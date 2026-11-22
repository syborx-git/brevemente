package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.adapter;

import com.syborx.brevemente.leva.application.ports.out.ClinicalCaseSourceRepositoryPort;
import com.syborx.brevemente.leva.domain.model.ClinicalCaseSource;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCaseSourceJpaEntity;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository.SpringDataClinicalCaseSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ClinicalCaseSourcePersistenceAdapter implements ClinicalCaseSourceRepositoryPort {

    private final SpringDataClinicalCaseSourceRepository repository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public ClinicalCaseSource save(ClinicalCaseSource source) {
        OffsetDateTime now = OffsetDateTime.now();
        ClinicalCaseSourceJpaEntity entity = ClinicalCaseSourceJpaEntity.builder()
                .id(source.getId())
                .caseToken(source.getCaseToken())
                .expedienteId(source.getExpedienteId())
                .expedienteFolio(source.getExpedienteFolio())
                .status(source.getStatus())
                .spr(source.getSpr())
                .diagnosticoOperativo(source.getDiagnosticoOperativo())
                .trastornoEstrategico(source.getTrastornoEstrategico())
                .tentativas(orEmpty(source.getTentativas()))
                .prescripciones(orEmpty(source.getPrescripciones()))
                .reestructuraciones(orEmpty(source.getReestructuraciones()))
                .resultado(source.getResultado())
                .numSesiones(source.getNumSesiones() != null ? source.getNumSesiones() : 0)
                .perfilEtario(source.getPerfilEtario())
                .notasCuraduria(source.getNotasCuraduria())
                .searchText(source.getSearchText())
                .embedding(source.getEmbedding())
                .approvedBy(source.getApprovedBy())
                .approvedAt(toOffset(source.getApprovedAt(), now))
                .revokedBy(source.getRevokedBy())
                .revokedAt(toOffset(source.getRevokedAt(), null))
                .createdAt(toOffset(source.getCreatedAt(), now))
                .updatedAt(now)
                .build();
        return toDomain(repository.save(entity));
    }

    @Override
    public Optional<ClinicalCaseSource> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<ClinicalCaseSource> findActive() {
        return repository.findByStatusOrderByApprovedAtDesc(ClinicalCaseSource.STATUS_ACTIVE).stream()
                .map(this::toDomain).toList();
    }

    @Override
    public List<ClinicalCaseSource> findAllOrdered() {
        return repository.findAllByOrderByApprovedAtDesc().stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsActiveByExpedienteId(String expedienteId) {
        return repository.existsByExpedienteIdAndStatus(expedienteId, ClinicalCaseSource.STATUS_ACTIVE);
    }

    @Override
    public String nextCaseToken() {
        Long next = jdbcTemplate.queryForObject("SELECT nextval('leva_case_token_seq')", Long.class);
        return String.format("REF-CASO-%d-%03d", Year.now().getValue(), next != null ? next : 1L);
    }

    private ClinicalCaseSource toDomain(ClinicalCaseSourceJpaEntity e) {
        return ClinicalCaseSource.builder()
                .id(e.getId())
                .caseToken(e.getCaseToken())
                .expedienteId(e.getExpedienteId())
                .expedienteFolio(e.getExpedienteFolio())
                .status(e.getStatus())
                .spr(e.getSpr())
                .diagnosticoOperativo(e.getDiagnosticoOperativo())
                .trastornoEstrategico(e.getTrastornoEstrategico())
                .tentativas(e.getTentativas() != null ? new ArrayList<>(e.getTentativas()) : new ArrayList<>())
                .prescripciones(e.getPrescripciones() != null ? new ArrayList<>(e.getPrescripciones()) : new ArrayList<>())
                .reestructuraciones(e.getReestructuraciones() != null ? new ArrayList<>(e.getReestructuraciones()) : new ArrayList<>())
                .resultado(e.getResultado())
                .numSesiones(e.getNumSesiones())
                .perfilEtario(e.getPerfilEtario())
                .notasCuraduria(e.getNotasCuraduria())
                .searchText(e.getSearchText())
                .embedding(e.getEmbedding())
                .approvedBy(e.getApprovedBy())
                .approvedAt(e.getApprovedAt() != null ? e.getApprovedAt().toInstant() : null)
                .revokedBy(e.getRevokedBy())
                .revokedAt(e.getRevokedAt() != null ? e.getRevokedAt().toInstant() : null)
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toInstant() : null)
                .build();
    }

    private static List<String> orEmpty(List<String> list) {
        return list != null ? list : new ArrayList<>();
    }

    private static OffsetDateTime toOffset(Instant instant, OffsetDateTime fallback) {
        return instant != null ? instant.atOffset(ZoneOffset.UTC) : fallback;
    }
}
