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
@Table(name = "contra_referencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraReferenciaJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "terapeuta_origen_id", length = 36, nullable = false)
    private String terapeutaOrigenId;

    @Column(name = "terapeuta_destino_id", length = 36, nullable = false)
    private String terapeutaDestinoId;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "resumen", columnDefinition = "TEXT")
    private String resumen;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
