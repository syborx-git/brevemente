package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SegmentPayload {
    private Integer id;
    private String speaker;
    private Double start;
    private Double end;
    private String text;
    private Double confidence;
}
