package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import com.syborx.brevemente.supervision.application.ports.out.SupervisionBitacoraRepositoryPort;
import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity.SupervisionBitacoraJpaEntity;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.mapper.SupervisionBitacoraPersistenceMapper;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.repository.SpringDataSupervisionBitacoraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SupervisionBitacoraPersistenceAdapter implements SupervisionBitacoraRepositoryPort {

    private final SpringDataSupervisionBitacoraRepository bitacoraRepository;
    private final SpringDataPacienteRepository pacienteRepository;
    private final SpringDataTerapeutaRepository terapeutaRepository;
    private final SupervisionBitacoraPersistenceMapper mapper;

    @Override
    public List<SupervisionBitacora> findByPacienteId(String pacienteId) {
        return bitacoraRepository.findByPacienteIdOrderByFechaDesc(pacienteId).stream()
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), terapeutaNombre(e.getTerapeutaId())))
                .toList();
    }

    @Override
    public Optional<SupervisionBitacora> findById(String id) {
        return bitacoraRepository.findById(id)
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), terapeutaNombre(e.getTerapeutaId())));
    }

    @Override
    public SupervisionBitacora save(SupervisionBitacora bitacora) {
        SupervisionBitacoraJpaEntity saved = bitacoraRepository.save(mapper.toJpaEntity(bitacora));
        return mapper.toDomain(saved, pacienteNombre(saved.getPacienteId()), terapeutaNombre(saved.getTerapeutaId()));
    }

    @Override
    public void deleteById(String id) {
        bitacoraRepository.deleteById(id);
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
