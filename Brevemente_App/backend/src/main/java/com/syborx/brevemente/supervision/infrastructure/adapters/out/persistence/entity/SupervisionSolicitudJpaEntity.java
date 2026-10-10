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

import java.time.OffsetDateTime;

@Entity
@Table(name = "supervision_solicitudes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisionSolicitudJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "solicitante_id", length = 36, nullable = false)
    private String solicitanteId;

    @Column(name = "terapeuta_id", length = 36)
    private String terapeutaId;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "atendido_por_id", length = 36)
    private String atendidoPorId;

    @Column(name = "atendido_at")
    private OffsetDateTime atendidoAt;
}
