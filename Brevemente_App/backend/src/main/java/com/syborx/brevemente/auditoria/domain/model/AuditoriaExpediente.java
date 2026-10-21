package com.syborx.brevemente.auditoria.domain.model;

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
public class AuditoriaExpediente {
    private String id;
    private String pacienteId;
    private String usuarioId;
    private String userName;
    private String role;
    private String accion;
    private String detalle;
    private String categoria;
    private OffsetDateTime createdAt;
}
