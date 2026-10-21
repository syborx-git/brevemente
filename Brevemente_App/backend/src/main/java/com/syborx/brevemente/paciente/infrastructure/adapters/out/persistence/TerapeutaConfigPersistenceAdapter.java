package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SedeJpaEntity;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataSedeRepository;
import com.syborx.brevemente.paciente.application.ports.out.TerapeutaConfigRepositoryPort;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaConfigNotFoundException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaSedeInvalidaException;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfigDatos;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSede;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSedeDatos;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaSedeJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaSedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TerapeutaConfigPersistenceAdapter implements TerapeutaConfigRepositoryPort {

    private final SpringDataTerapeutaRepository terapeutaRepository;
    private final SpringDataUsuarioRepository usuarioRepository;
    private final SpringDataTerapeutaSedeRepository terapeutaSedeRepository;
    private final SpringDataSedeRepository sedeRepository;

    @Override
    public Optional<TerapeutaConfig> findById(String terapeutaId) {
        return terapeutaRepository.findById(terapeutaId).map(this::toDomain);
    }

    @Override
    public TerapeutaConfig update(String terapeutaId, TerapeutaConfigDatos datos) {
        TerapeutaJpaEntity entity = terapeutaRepository.findById(terapeutaId)
                .orElseThrow(() -> new TerapeutaConfigNotFoundException(
                        "No se encontró la configuración del terapeuta " + terapeutaId));

        entity.setTelefono(datos.telefono());
        entity.setDuracionSesionDefaultMin(datos.duracionSesionDefaultMin() == null
                ? null : datos.duracionSesionDefaultMin().shortValue());
        entity.setCostoPrimeraSesion(datos.costoPrimeraSesion());
        entity.setCostoSeguimiento(datos.costoSeguimiento());
        entity.setEdadMinimaAtencion(datos.edadMinimaAtencion() == null
                ? null : datos.edadMinimaAtencion().shortValue());
        terapeutaRepository.save(entity);

        return toDomain(entity);
    }

    @Override
    @Transactional
    public List<TerapeutaSede> updateSedes(String terapeutaId, List<TerapeutaSedeDatos> sedes) {
        List<TerapeutaSedeDatos> lista = sedes == null ? List.of() : sedes;

        long principales = lista.stream().filter(TerapeutaSedeDatos::esPrincipal).count();
        if (principales > 1) {
            throw new TerapeutaSedeInvalidaException("Solo puede haber una sede principal por terapeuta.");
        }

        long distintos = lista.stream().map(TerapeutaSedeDatos::sedeId).distinct().count();
        if (distintos != lista.size()) {
            throw new TerapeutaSedeInvalidaException("La lista de sedes contiene duplicados.");
        }

        for (TerapeutaSedeDatos s : lista) {
            if (sedeRepository.findById(s.sedeId()).isEmpty()) {
                throw new TerapeutaSedeInvalidaException("No existe la sede " + s.sedeId());
            }
        }

        terapeutaSedeRepository.deleteByTerapeutaId(terapeutaId);
        List<TerapeutaSedeJpaEntity> entities = lista.stream()
                .map(s -> TerapeutaSedeJpaEntity.builder()
                        .terapeutaId(terapeutaId)
                        .sedeId(s.sedeId())
                        .esPrincipal(s.esPrincipal())
                        .activo(true)
                        .build())
                .toList();
        terapeutaSedeRepository.saveAll(entities);

        return obtenerSedes(terapeutaId);
    }

    private TerapeutaConfig toDomain(TerapeutaJpaEntity terapeuta) {
        UsuarioJpaEntity usuario = terapeuta.getUsuarioId() == null
                ? null
                : usuarioRepository.findById(terapeuta.getUsuarioId()).orElse(null);

        return new TerapeutaConfig(
                terapeuta.getId(),
                usuario != null ? usuario.getNombre() + " " + usuario.getApellidos() : "",
                usuario != null ? usuario.getEmail() : "",
                terapeuta.getCedulaProfesional(),
                terapeuta.getEspecialidad(),
                terapeuta.getTelefono(),
                terapeuta.getDuracionSesionDefaultMin() == null
                        ? null : terapeuta.getDuracionSesionDefaultMin().intValue(),
                terapeuta.getCostoPrimeraSesion(),
                terapeuta.getCostoSeguimiento(),
                terapeuta.getEdadMinimaAtencion() == null
                        ? null : terapeuta.getEdadMinimaAtencion().intValue(),
                obtenerSedes(terapeuta.getId())
        );
    }

    private List<TerapeutaSede> obtenerSedes(String terapeutaId) {
        return terapeutaSedeRepository.findActivasByTerapeutaId(terapeutaId).stream()
                .map(ts -> {
                    String nombreSede = sedeRepository.findById(ts.getSedeId())
                            .map(SedeJpaEntity::getNombre)
                            .orElse("");
                    return new TerapeutaSede(ts.getSedeId(), nombreSede, Boolean.TRUE.equals(ts.getEsPrincipal()));
                })
                .toList();
    }
}
