package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.ExpedienteJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper.ExpedientePersistenceMapper;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataExpedienteRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ExpedientePersistenceAdapter implements ExpedienteRepositoryPort {

    private final SpringDataExpedienteRepository expedienteRepository;
    private final SpringDataPacienteRepository pacienteRepository;
    private final SpringDataTerapeutaRepository terapeutaRepository;
    private final ExpedientePersistenceMapper mapper;

    @Override
    public Optional<Expediente> findByPacienteId(String pacienteId) {
        return expedienteRepository.findByPacienteId(pacienteId).map(e -> {
            PacienteJpaEntity paciente = e.getPacienteId() != null
                    ? pacienteRepository.findById(e.getPacienteId()).orElse(null)
                    : null;

            String pacienteNombre = paciente != null
                    ? (paciente.getNombre() + " " + paciente.getApellidos()).trim()
                    : null;
            Integer edad = paciente != null ? paciente.getEdadCalculada() : null;
            String riskLevel = paciente != null ? paciente.getRiskLevel() : null;

            String terapeutaNombre = e.getTerapeutaAsignadoId() != null
                    ? terapeutaRepository.findTherapistDisplayName(e.getTerapeutaAsignadoId()).orElse(null)
                    : null;

            return mapper.toDomain((ExpedienteJpaEntity) e, pacienteNombre, edad, riskLevel, terapeutaNombre);
        });
    }

    @Override
    public Expediente save(Expediente expediente) {
        expedienteRepository.save(mapper.toJpaEntity(expediente));
        if (expediente.getPacienteId() != null) {
            return findByPacienteId(expediente.getPacienteId()).orElse(expediente);
        }
        return expediente;
    }
}
