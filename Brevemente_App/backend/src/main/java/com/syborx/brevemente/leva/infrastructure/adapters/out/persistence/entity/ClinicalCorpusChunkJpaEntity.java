package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "clinical_corpus_chunks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalCorpusChunkJpaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "document_id", length = 36, nullable = false)
    private String documentId;

    @Column(name = "protocol_code", length = 50)
    private String protocolCode;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "word_count", nullable = false)
    private Integer wordCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "embedding", columnDefinition = "jsonb")
    private List<Float> embedding;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}

