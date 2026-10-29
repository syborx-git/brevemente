package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.TratamientoPrevioRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.TratamientoPrevio;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.TratamientoPrevioJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataTratamientoPrevioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TratamientoPrevioPersistenceAdapter implements TratamientoPrevioRepositoryPort {

    private final SpringDataTratamientoPrevioRepository repository;

    @Override
    public List<TratamientoPrevio> findByExpedienteId(String expedienteId) {
        return repository.findByExpedienteIdOrderByCreatedAtAsc(expedienteId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<TratamientoPrevio> saveAll(String expedienteId, List<TratamientoPrevio> items) {
        List<TratamientoPrevioJpaEntity> entities = items.stream()
                .map(t -> TratamientoPrevioJpaEntity.builder()
                        .id(t.id() != null ? t.id() : "trat-" + UUID.randomUUID().toString().substring(0, 8))
                        .expedienteId(expedienteId)
                        .enfoque(t.enfoque())
                        .duracion(t.duracion())
                        .resultado(t.resultado())
                        .build())
                .toList();
        return repository.saveAll(entities).stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteByExpedienteId(String expedienteId) {
        repository.deleteByExpedienteId(expedienteId);
    }

    private TratamientoPrevio toDomain(TratamientoPrevioJpaEntity e) {
        return new TratamientoPrevio(e.getId(), e.getExpedienteId(), e.getEnfoque(), e.getDuracion(), e.getResultado());
    }
}
