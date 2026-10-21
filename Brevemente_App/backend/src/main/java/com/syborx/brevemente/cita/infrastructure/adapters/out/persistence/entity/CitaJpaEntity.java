package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitaJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "terapeuta_id", length = 36, nullable = false)
    private String terapeutaId;

    @Column(name = "expediente_id", length = 36)
    private String expedienteId;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin", nullable = false)
    private OffsetDateTime fechaHoraFin;

    @Column(name = "tipo_cita", length = 20, nullable = false)
    @Builder.Default
    private String tipoCita = "primera";

    @Column(name = "modalidad", length = 20)
    @Builder.Default
    private String modalidad = "PRESENCIAL";

    @Column(name = "estado_cita", length = 30)
    @Builder.Default
    private String estadoCita = "pendiente";

    @Column(name = "duracion_minutos", nullable = false)
    @Builder.Default
    private Integer duracionMinutos = 30;

    @Column(name = "payment_status", length = 20)
    @Builder.Default
    private String paymentStatus = "pendiente";

    @Column(name = "consultorio", length = 10)
    private String consultorio;

    @Column(name = "bloqueada_por_normativa")
    @Builder.Default
    private Boolean bloqueadaPorNormativa = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
