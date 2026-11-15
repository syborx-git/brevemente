package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.CriterioClinicoRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.CriterioClinico;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionCriterioClinicoJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataSesionCriterioClinicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SesionCriterioClinicoPersistenceAdapter implements CriterioClinicoRepositoryPort {

    private final SpringDataSesionCriterioClinicoRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<CriterioClinico> findBySesionId(String sesionId) {
        return repository.findBySesionIdOrderByCategoriaAsc(sesionId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public void deleteBySesionId(String sesionId) {
        repository.deleteBySesionId(sesionId);
    }

    @Override
    @Transactional
    public List<CriterioClinico> saveAll(String sesionId, List<CriterioClinico> criterios) {
        List<SesionCriterioClinicoJpaEntity> entities = criterios.stream()
                .filter(c -> c != null && c.categoria() != null && c.valor() != null && !c.valor().isBlank())
                .map(c -> SesionCriterioClinicoJpaEntity.builder()
                        .id(c.id() != null && !c.id().isBlank() ? c.id() : "crit-" + UUID.randomUUID().toString().substring(0, 8))
                        .sesionId(sesionId)
                        .categoria(c.categoria())
                        .valor(c.valor())
                        .build())
                .toList();
        return repository.saveAll(entities).stream()
                .map(this::toDomain)
                .toList();
    }

    private CriterioClinico toDomain(SesionCriterioClinicoJpaEntity e) {
        return new CriterioClinico(e.getId(), e.getSesionId(), e.getCategoria(), e.getValor());
    }
}
