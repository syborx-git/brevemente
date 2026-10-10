package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import com.syborx.brevemente.supervision.application.ports.out.SupervisionSolicitudRepositoryPort;
import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity.SupervisionSolicitudJpaEntity;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.mapper.SupervisionSolicitudPersistenceMapper;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.repository.SpringDataSupervisionSolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SupervisionSolicitudPersistenceAdapter implements SupervisionSolicitudRepositoryPort {

    private final SpringDataSupervisionSolicitudRepository solicitudRepository;
    private final SpringDataPacienteRepository pacienteRepository;
    private final SpringDataTerapeutaRepository terapeutaRepository;
    private final SupervisionSolicitudPersistenceMapper mapper;

    @Override
    public List<SupervisionSolicitud> findByPacienteId(String pacienteId) {
        return solicitudRepository.findByPacienteIdOrderByCreatedAtDesc(pacienteId).stream()
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), terapeutaNombre(e.getTerapeutaId())))
                .toList();
    }

    @Override
    public Optional<SupervisionSolicitud> findById(String id) {
        return solicitudRepository.findById(id)
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), terapeutaNombre(e.getTerapeutaId())));
    }

    @Override
    public SupervisionSolicitud save(SupervisionSolicitud solicitud) {
        SupervisionSolicitudJpaEntity saved = solicitudRepository.save(mapper.toJpaEntity(solicitud));
        return mapper.toDomain(saved, pacienteNombre(saved.getPacienteId()), terapeutaNombre(saved.getTerapeutaId()));
    }

    private String pacienteNombre(String pacienteId) {
        if (pacienteId == null) return null;
        return pacienteRepository.findById(pacienteId)
                .map(p -> (p.getNombre() + " " + p.getApellidos()).trim())
                .orElse(null);
    }

    private String terapeutaNombre(String terapeutaId) {
        if (terapeutaId == null) return null;
        return terapeutaRepository.findTherapistDisplayName(terapeutaId).orElse(null);
    }
}
