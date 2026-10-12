package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence;

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
    public long countByStatus(String status, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return 0;
        }
        return terapeutaIds == null
                ? springDataPacienteRepository.countByStatus(status)
                : springDataPacienteRepository.countByStatusAndTerapeutaIds(status, terapeutaIds);
    }

    @Override
    public long countByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return 0;
        }
        return terapeutaIds == null
                ? springDataPacienteRepository.countByRiskLevelIn(niveles)
                : springDataPacienteRepository.countByRiskLevelInAndTerapeutaIds(niveles, terapeutaIds);
    }

    @Override
    public List<Paciente> findByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findByRiskLevelIn(niveles)
                : springDataPacienteRepository.findByRiskLevelInAndTerapeutaIds(niveles, terapeutaIds);
        return entities.stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .toList();
    }

    @Override
    public List<Paciente> findByStatus(String status, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findByStatus(status)
                : springDataPacienteRepository.findByStatusAndTerapeutaIds(status, terapeutaIds);
        return entities.stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .toList();
    }

    @Override
    public List<Paciente> findRecientes(int limit, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                : springDataPacienteRepository.findRecientesByTerapeutaIds(terapeutaIds, PageRequest.of(0, limit));
        return entities.stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .toList();
    }

    @Override
    public long countConConsentimientoPendiente(Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return 0;
        }
        return terapeutaIds == null
                ? springDataPacienteRepository.countConConsentimientoPendiente()
                : springDataPacienteRepository.countConConsentimientoPendienteByTerapeutaIds(terapeutaIds);
    }

    @Override
    public List<Paciente> findConConsentimientoPendiente(Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        List<PacienteJpaEntity> entities = terapeutaIds == null
                ? springDataPacienteRepository.findConConsentimientoPendiente()
                : springDataPacienteRepository.findConConsentimientoPendienteByTerapeutaIds(terapeutaIds);
        return entities.stream()
                .map(e -> pacientePersistenceMapper.toDomain(e, resolveTherapistName(e)))
                .toList();
    }

    private String resolveTherapistName(PacienteJpaEntity entity) {
        if (entity.getTerapeuta() == null) {
            return null;
        }
        return springDataTerapeutaRepository.findTherapistDisplayName(entity.getTerapeuta().getId()).orElse(null);
    }
}
