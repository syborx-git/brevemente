package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.ConsentimientoRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.Consentimiento;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper.ConsentimientoPersistenceMapper;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataConsentimientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConsentimientoPersistenceAdapter implements ConsentimientoRepositoryPort {

    private final SpringDataConsentimientoRepository repository;
    private final ConsentimientoPersistenceMapper mapper;

    @Override
    public Consentimiento save(Consentimiento consentimiento) {
        return mapper.toDomain(repository.save(mapper.toJpaEntity(consentimiento)));
    }
}
