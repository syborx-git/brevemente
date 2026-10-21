package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "sesiones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "expediente_id", length = 36, nullable = false)
    private String expedienteId;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "fase", length = 100)
    private String fase;

    @Column(name = "protocolo", length = 100)
    private String protocolo;

    @Column(name = "dx_operativo", columnDefinition = "TEXT")
    private String dxOperativo;

    @Column(name = "trastorno", columnDefinition = "TEXT")
    private String trastorno;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "px", columnDefinition = "jsonb", nullable = false)
    private List<String> px;

    @Column(name = "f1", columnDefinition = "TEXT")
    private String f1;

    @Column(name = "f2", columnDefinition = "TEXT")
    private String f2;

    @Column(name = "oss", columnDefinition = "TEXT")
    private String oss;

    @Column(name = "adherencia", columnDefinition = "TEXT")
    private String adherencia;

    @Column(name = "cumplimiento", columnDefinition = "TEXT")
    private String cumplimiento;

    @Column(name = "rss", columnDefinition = "TEXT")
    private String rss;

    @Column(name = "eff", columnDefinition = "TEXT")
    private String eff;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "observaciones_proxima_sesion", columnDefinition = "TEXT")
    private String observacionesProximaSesion;

    @Column(name = "situacion", columnDefinition = "TEXT")
    private String situacion;

    @Column(name = "duracion_audio", length = 20)
    private String duracionAudio;

    @Column(name = "status", length = 10, nullable = false)
    private String status;

    @Column(name = "creado_por_id", length = 36)
    private String creadoPorId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valoracion_cambio", columnDefinition = "jsonb")
    private Map<String, Object> valoracionCambio;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valoracion_global", columnDefinition = "jsonb")
    private Map<String, Object> valoracionGlobal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
