package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "alerta_paciente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaPacienteJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "tipo", length = 30, nullable = false)
    private String tipo;

    @Column(name = "mensaje", columnDefinition = "TEXT", nullable = false)
    private String mensaje;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @Column(name = "resuelta_por", length = 200)
    private String resueltaPor;

    @Column(name = "resuelta_en")
    private OffsetDateTime resueltaEn;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
