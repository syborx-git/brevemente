package com.syborx.brevemente.expediente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consentimiento {
    private String id;
    private String pacienteId;
    private String tipoConsentimiento;
    private String firmadoPor;
    private String calidadFirmante;
    private OffsetDateTime fechaFirma;
    private String documentoHash;
    private Boolean revocado;
}
