package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "clinical_corpus_documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalCorpusJpaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "protocol_code", length = 50, nullable = false, unique = true)
    private String protocolCode;

    @Column(name = "category", length = 50, nullable = false)
    private String category;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "source_reference", length = 255)
    private String sourceReference;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
