package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.cita.application.ports.out.DiaNoLaborablePort;
import com.syborx.brevemente.cita.domain.model.DiaNoLaborable;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.DiaNoLaborableJpaEntity;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.mapper.DiaNoLaborablePersistenceMapper;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.repository.SpringDataDiaNoLaborableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DiaNoLaborablePersistenceAdapter implements DiaNoLaborablePort {

    private final SpringDataDiaNoLaborableRepository springDataDiaNoLaborableRepository;
    private final DiaNoLaborablePersistenceMapper diaNoLaborablePersistenceMapper;

    @Override
    public List<DiaNoLaborable> findAll() {
        return springDataDiaNoLaborableRepository.findAll().stream()
                .map(diaNoLaborablePersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<DiaNoLaborable> findById(String id) {
        return springDataDiaNoLaborableRepository.findById(id)
                .map(diaNoLaborablePersistenceMapper::toDomain);
    }

    @Override
    public boolean existeDiaNoLaborable(LocalDate fecha, String terapeutaId) {
        return springDataDiaNoLaborableRepository.existeDiaNoLaborable(fecha, terapeutaId);
    }

    @Override
    public DiaNoLaborable save(DiaNoLaborable dia) {
        DiaNoLaborableJpaEntity jpa = diaNoLaborablePersistenceMapper.toJpaEntity(dia);
        DiaNoLaborableJpaEntity saved = springDataDiaNoLaborableRepository.save(jpa);
        return diaNoLaborablePersistenceMapper.toDomain(saved);
    }

    @Override
    public void deleteById(String id) {
        springDataDiaNoLaborableRepository.deleteById(id);
    }
}
