package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.dashboard.domain.model.AlertaMayoriaEdad;
import com.syborx.brevemente.dashboard.domain.model.CasoProtocolo;
import com.syborx.brevemente.dashboard.domain.model.DistribucionFase;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.mapper.PacientePersistenceMapper;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PacientePersistenceAdapter implements PacienteRepositoryPort {

    private final SpringDataPacienteRepository springDataPacienteRepository;
    private final SpringDataTerapeutaRepository springDataTerapeutaRepository;
    private final PacientePersistenceMapper pacientePersistenceMapper;

    @Override
    public List<Paciente> findAll() {
        return springDataPacienteRepository.findAll().stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .toList();
    }

    @Override
    public Optional<Paciente> findById(String id) {
        return springDataPacienteRepository.findById(id)
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)));
    }

    @Override
    public Optional<Paciente> findByCurp(String curp) {
        return springDataPacienteRepository.findByCurp(curp)
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)));
    }

    @Override
    public boolean existsByCurp(String curp) {
        return springDataPacienteRepository.existsByCurp(curp);
    }

    @Override
    public Paciente save(Paciente paciente) {
        TerapeutaJpaEntity terapeuta = null;
        if (paciente.getTerapeutaId() != null) {
            terapeuta = springDataTerapeutaRepository.findById(paciente.getTerapeutaId()).orElse(null);
        }

        PacienteJpaEntity jpaEntity = pacientePersistenceMapper.toJpaEntity(paciente, terapeuta);
        PacienteJpaEntity saved = springDataPacienteRepository.save(jpaEntity);
        return pacientePersistenceMapper.toDomain(saved, resolveTherapistName(saved));
    }

    @Override
    public long countByStatus(String status, Collection<String> terapeutaIds, String sedeId, String protocoloId) {
        return findByStatus(status, terapeutaIds, sedeId, protocoloId).size();
    }

    @Override
    public long countByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds,
                                   String sedeId, String protocoloId) {
        return findByRiskLevelIn(niveles, terapeutaIds, sedeId, protocoloId).size();
    }

    @Override
    public List<Paciente> findByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds,
                                            String sedeId, String protocoloId) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findByRiskLevelIn(niveles)
                : springDataPacienteRepository.findByRiskLevelInAndTerapeutaIds(niveles, terapeutaIds);
        return filtrar(entities, sedeId, protocoloId);
    }

    @Override
    public List<Paciente> findByStatus(String status, Collection<String> terapeutaIds,
                                       String sedeId, String protocoloId) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findByStatus(status)
                : springDataPacienteRepository.findByStatusAndTerapeutaIds(status, terapeutaIds);
        return filtrar(entities, sedeId, protocoloId);
    }

    @Override
    public List<Paciente> findRecientes(int limit, Collection<String> terapeutaIds,
                                        String sedeId, String protocoloId) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 200))
                : springDataPacienteRepository.findRecientesByTerapeutaIds(terapeutaIds, PageRequest.of(0, 200));
        return entities.stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .filter(p -> coincideSede(p, sedeId) && coincideProtocolo(p, protocoloId))
                .limit(limit)
                .toList();
    }

    @Override
    public long countConConsentimientoPendiente(Collection<String> terapeutaIds, String sedeId, String protocoloId) {
        return findConConsentimientoPendiente(terapeutaIds, sedeId, protocoloId).size();
    }

    @Override
    public List<Paciente> findConConsentimientoPendiente(Collection<String> terapeutaIds,
                                                         String sedeId, String protocoloId) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findConConsentimientoPendiente()
                : springDataPacienteRepository.findConConsentimientoPendienteByTerapeutaIds(terapeutaIds);
        return filtrar(entities, sedeId, protocoloId);
    }

    @Override
    public List<DistribucionFase> agruparPorFase(Collection<String> terapeutaIds, String sedeId, String protocoloId) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<Object[]> filas = terapeutaIds == null
                ? springDataPacienteRepository.agruparPorFaseGlobal(sedeId, protocoloId)
                : springDataPacienteRepository.agruparPorFaseScoped(sedeId, protocoloId, terapeutaIds);
        return filas.stream()
                .map(f -> new DistribucionFase((String) f[0], ((Number) f[1]).longValue()))
                .toList();
    }

    @Override
    public List<CasoProtocolo> agruparPorProtocolo(Collection<String> terapeutaIds, String sedeId, String protocoloId) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<Object[]> filas = terapeutaIds == null
                ? springDataPacienteRepository.agruparPorProtocoloGlobal(sedeId, protocoloId)
                : springDataPacienteRepository.agruparPorProtocoloScoped(sedeId, protocoloId, terapeutaIds);
        return filas.stream()
                .map(f -> new CasoProtocolo((String) f[0], ((Number) f[1]).longValue()))
                .toList();
    }

    @Override
    public List<AlertaMayoriaEdad> findMayoriaEdad(LocalDate corteNacimiento) {
        return springDataPacienteRepository.findMayoriaEdad(corteNacimiento).stream()
                .map(e -> new AlertaMayoriaEdad(
                        e.getId(),
                        nombreCompleto(e),
                        e.getFechaNacimiento() != null ? e.getFechaNacimiento().toString() : null,
                        (e.getPersonaDeApoyoNombre() != null && !e.getPersonaDeApoyoNombre().isBlank())
                                ? e.getPersonaDeApoyoNombre()
                                : "Padre/Madre/Tutor"))
                .toList();
    }

    private List<Paciente> filtrar(List<PacienteJpaEntity> entities, String sedeId, String protocoloId) {
        return entities.stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .filter(p -> coincideSede(p, sedeId) && coincideProtocolo(p, protocoloId))
                .toList();
    }

    private boolean coincideSede(Paciente paciente, String sedeId) {
        return sedeId == null || sedeId.equals(paciente.getSedeId());
    }

    private boolean coincideProtocolo(Paciente paciente, String protocoloId) {
        return protocoloId == null || protocoloId.equals(paciente.getProtocoloId());
    }

    private String nombreCompleto(PacienteJpaEntity e) {
        String nombre = e.getNombre() != null ? e.getNombre().trim() : "";
        String apellidos = e.getApellidos() != null ? e.getApellidos().trim() : "";
        return (nombre + " " + apellidos).trim();
    }

    private String resolveTherapistName(PacienteJpaEntity entity) {
        if (entity.getTerapeuta() == null) {
            return null;
        }
        return springDataTerapeutaRepository.findTherapistDisplayName(entity.getTerapeuta().getId()).orElse(null);
    }
}
