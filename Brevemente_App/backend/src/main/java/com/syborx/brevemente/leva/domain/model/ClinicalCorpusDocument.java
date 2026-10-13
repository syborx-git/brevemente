package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalCorpusDocument {
    private String id;
    private String title;
    private String protocolCode;
    private String category; // "PROTOCOLO_TBE", "MANUAL_CLINICO", "GUIA_DIAGNOSTICA"
    private String content;
    private String sourceReference;
    private Instant createdAt;
}
