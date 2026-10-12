package com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity;

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

/**
 * Entidad JPA de la tabla {@code asignaciones_supervision} (migración V10).
 */
@Entity
@Table(name = "asignaciones_supervision")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisionAsignacionJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "supervisor_usuario_id", length = 36, nullable = false)
    private String supervisorUsuarioId;

    @Column(name = "terapeuta_id", length = 36, nullable = false)
    private String terapeutaId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
