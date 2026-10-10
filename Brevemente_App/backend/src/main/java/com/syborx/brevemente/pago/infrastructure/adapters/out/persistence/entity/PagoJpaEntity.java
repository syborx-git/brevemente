package com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.entity;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pagos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "cita_id", length = 36)
    private String citaId;

    @Column(name = "concepto", columnDefinition = "TEXT", nullable = false)
    private String concepto;

    @Column(name = "monto", precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "metodo", length = 20, nullable = false)
    private String metodo;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "registrado_por_id", length = 36)
    private String registradoPorId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
