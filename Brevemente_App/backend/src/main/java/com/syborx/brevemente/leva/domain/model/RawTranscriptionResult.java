package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RawTranscriptionResult {
    private String taskId;
    private String status;
    private Double durationSeconds;
    private String languageDetected;
    private String fullText;
    @Builder.Default
    private List<TranscriptSegment> segments = new ArrayList<>();
    private String errorMessage;
}
