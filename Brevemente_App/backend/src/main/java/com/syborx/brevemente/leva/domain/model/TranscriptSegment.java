package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptSegment {
    private Integer id;
    private String speaker; // "Terapeuta", "Paciente", "SPEAKER_00", o null
    private Double start;
    private Double end;
    private String text;
    private Double confidence;
}
