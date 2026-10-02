package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.mapper.PacientePersistenceMapper;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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

    private String resolveTherapistName(PacienteJpaEntity entity) {
        if (entity.getTerapeuta() == null) {
            return null;
        }
        return springDataTerapeutaRepository.findTherapistDisplayName(entity.getTerapeuta().getId()).orElse(null);
    }
}
