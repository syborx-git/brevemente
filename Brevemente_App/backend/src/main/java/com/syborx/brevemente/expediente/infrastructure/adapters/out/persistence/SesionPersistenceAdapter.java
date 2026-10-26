package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.ExpedienteJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper.SesionPersistenceMapper;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataExpedienteRepository;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataSesionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SesionPersistenceAdapter implements SesionRepositoryPort {

    private final SpringDataSesionRepository sesionRepository;
    private final SpringDataExpedienteRepository expedienteRepository;
    private final SesionPersistenceMapper mapper;

    @Override
    public List<Sesion> findByExpedienteId(String expedienteId) {
        return sesionRepository.findByExpedienteIdOrderByNumeroAsc(expedienteId).stream()
                .map(mapper::toDomain)
                .map(this::enrichPacienteId)
                .toList();
    }

    @Override
    public Optional<Sesion> findById(String sesionId) {
        return sesionRepository.findById(sesionId)
                .map(mapper::toDomain)
                .map(this::enrichPacienteId);
    }

    @Override
    public Sesion save(Sesion sesion) {
        SesionJpaEntity saved = sesionRepository.save(mapper.toJpaEntity(sesion));
        return enrichPacienteId(mapper.toDomain(saved));
    }

    @Override
    public Optional<Integer> ultimoNumero(String expedienteId) {
        return sesionRepository.findTopByExpedienteIdOrderByNumeroDesc(expedienteId)
                .map(SesionJpaEntity::getNumero);
    }

    @Override
    public Optional<Sesion> findByCitaId(String citaId) {
        return sesionRepository.findByCitaId(citaId)
                .map(mapper::toDomain)
                .map(this::enrichPacienteId);
    }

    @Override
    public List<Sesion> findBorradoresPorTerapeuta(List<String> terapeutaIds) {
        if (terapeutaIds == null || terapeutaIds.isEmpty()) {
            return List.of();
        }
        return sesionRepository.findBorradoresPorTerapeuta(terapeutaIds).stream()
                .map(mapper::toDomain)
                .map(this::enrichPacienteId)
                .toList();
    }

    /**
     * La tabla {@code sesiones} no expone {@code paciente_id} (solo
     * {@code expediente_id}); se resuelve el paciente desde el expediente para
     * que {@code Sesion.pacienteId} no salga nulo en lecturas y escrituras.
     */
    private Sesion enrichPacienteId(Sesion sesion) {
        if (sesion != null && sesion.getPacienteId() == null && sesion.getExpedienteId() != null) {
            expedienteRepository.findById(sesion.getExpedienteId())
                    .map(ExpedienteJpaEntity::getPacienteId)
                    .ifPresent(sesion::setPacienteId);
        }
        return sesion;
    }
}
