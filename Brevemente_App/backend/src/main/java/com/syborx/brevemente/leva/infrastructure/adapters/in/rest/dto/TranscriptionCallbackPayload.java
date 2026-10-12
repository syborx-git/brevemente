package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.syborx.brevemente.leva.domain.model.RawTranscriptionResult;
import com.syborx.brevemente.leva.domain.model.TranscriptSegment;
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
public class TranscriptionCallbackPayload {

    @JsonProperty("task_id")
    private String taskId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("duration_seconds")
    private Double durationSeconds;

    @JsonProperty("language_detected")
    private String languageDetected;

    @JsonProperty("full_text")
    private String fullText;

    @JsonProperty("segments")
    @Builder.Default
    private List<SegmentPayload> segments = new ArrayList<>();

    @JsonProperty("error_message")
    private String errorMessage;

    public RawTranscriptionResult toDomain() {
        List<TranscriptSegment> domainSegments = new ArrayList<>();
        if (segments != null) {
            for (SegmentPayload s : segments) {
                domainSegments.add(TranscriptSegment.builder()
                        .id(s.getId())
                        .speaker(s.getSpeaker())
                        .start(s.getStart())
                        .end(s.getEnd())
                        .text(s.getText())
                        .confidence(s.getConfidence())
                        .build());
            }
        }

        return RawTranscriptionResult.builder()
                .taskId(taskId)
                .status(status)
                .durationSeconds(durationSeconds)
                .languageDetected(languageDetected)
                .fullText(fullText)
                .segments(domainSegments)
                .errorMessage(errorMessage)
                .build();
    }
}
