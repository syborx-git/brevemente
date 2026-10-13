package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveProposalRequest {
    @NotBlank(message = "El ID del terapeuta revisor es obligatorio")
    private String reviewedById;
    private StructuredProposalData approvedData;
}
