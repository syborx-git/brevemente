package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity;

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

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "supervision_bitacoras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisionBitacoraJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "terapeuta_id", length = 36)
    private String terapeutaId;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "numero_sesion")
    private Integer numeroSesion;

    @Column(name = "supervisor_nombre", length = 200)
    private String supervisorNombre;

    @Column(name = "supervisor_cedula", length = 50)
    private String supervisorCedula;

    @Column(name = "definicion_problema", columnDefinition = "TEXT")
    private String definicionProblema;

    @Column(name = "situacion_actual", columnDefinition = "TEXT")
    private String situacionActual;

    @Column(name = "spr", columnDefinition = "TEXT")
    private String spr;

    @Column(name = "ts", columnDefinition = "TEXT")
    private String ts;

    @Column(name = "problema_terapeuta", columnDefinition = "TEXT")
    private String problemaTerapeuta;

    @Column(name = "rst", columnDefinition = "TEXT")
    private String rst;

    @Column(name = "px", columnDefinition = "TEXT")
    private String px;

    @Column(name = "eff", columnDefinition = "TEXT")
    private String eff;

    @Column(name = "duda", columnDefinition = "TEXT")
    private String duda;

    @Column(name = "bloqueo", columnDefinition = "TEXT")
    private String bloqueo;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "recomendaciones", columnDefinition = "TEXT")
    private String recomendaciones;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
