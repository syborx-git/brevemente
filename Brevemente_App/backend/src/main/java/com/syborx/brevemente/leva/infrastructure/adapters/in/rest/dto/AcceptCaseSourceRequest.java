package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcceptCaseSourceRequest {
    @NotBlank(message = "El expediente es obligatorio")
    private String expedienteId;

    @Size(max = 1000, message = "Las notas de curaduría no pueden exceder 1000 caracteres")
    private String notasCuraduria;
}
