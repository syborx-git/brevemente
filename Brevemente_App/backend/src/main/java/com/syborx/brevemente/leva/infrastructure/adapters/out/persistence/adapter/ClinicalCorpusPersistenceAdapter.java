package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.adapter;

import com.syborx.brevemente.leva.application.ports.out.ClinicalCorpusRepositoryPort;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCorpusJpaEntity;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository.SpringDataClinicalCorpusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ClinicalCorpusPersistenceAdapter implements ClinicalCorpusRepositoryPort {

    private final SpringDataClinicalCorpusRepository repository;

    @Override
    public List<ClinicalCorpusDocument> findAll() {
        return repository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public List<ClinicalCorpusDocument> searchByKeywordsOrProtocol(String query, String protocolFilter) {
        String filter = (protocolFilter != null && !protocolFilter.isBlank()) ? protocolFilter : null;
        String q = (query != null && !query.isBlank()) ? query : "";
        return repository.searchByQueryAndProtocol(q, filter).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<ClinicalCorpusDocument> findByProtocolCode(String protocolCode) {
        return repository.findByProtocolCode(protocolCode).map(this::toDomain);
    }

    private ClinicalCorpusDocument toDomain(ClinicalCorpusJpaEntity entity) {
        return ClinicalCorpusDocument.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .protocolCode(entity.getProtocolCode())
                .category(entity.getCategory())
                .content(entity.getContent())
                .sourceReference(entity.getSourceReference())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant() : null)
                .build();
    }
}
