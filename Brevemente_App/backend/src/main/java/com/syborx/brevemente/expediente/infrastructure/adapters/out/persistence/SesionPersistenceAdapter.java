package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper.SesionPersistenceMapper;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataSesionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SesionPersistenceAdapter implements SesionRepositoryPort {

    private final SpringDataSesionRepository sesionRepository;
    private final SesionPersistenceMapper mapper;

    @Override
    public List<Sesion> findByExpedienteId(String expedienteId) {
        return sesionRepository.findByExpedienteIdOrderByNumeroAsc(expedienteId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Sesion save(Sesion sesion) {
        SesionJpaEntity saved = sesionRepository.save(mapper.toJpaEntity(sesion));
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Integer> ultimoNumero(String expedienteId) {
        return sesionRepository.findTopByExpedienteIdOrderByNumeroDesc(expedienteId)
                .map(SesionJpaEntity::getNumero);
    }
}
