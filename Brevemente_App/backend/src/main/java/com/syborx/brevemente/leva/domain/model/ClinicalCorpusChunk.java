package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalCorpusChunk {
    private String id;
    private String documentId;
    private String protocolCode;
    private Integer chunkIndex;
    private String title;
    private String content;
    private Integer wordCount;
    private List<Float> embedding;
    private Instant createdAt;

    public String getSectionTitle() {
        return title;
    }
}

