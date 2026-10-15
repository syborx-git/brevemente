package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/**
 * Entidad JPA de la tabla {@code terapeuta_sedes} (migración V14).
 * Relación muchos-a-muchos terapeuta <-> sede con una sede principal.
 */
@Entity
@Table(name = "terapeuta_sedes")
@IdClass(TerapeutaSedeId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TerapeutaSedeJpaEntity {

    @Id
    @Column(name = "terapeuta_id", length = 36, nullable = false)
    private String terapeutaId;

    @Id
    @Column(name = "sede_id", length = 36, nullable = false)
    private String sedeId;

    @Column(name = "es_principal", nullable = false)
    @Builder.Default
    private Boolean esPrincipal = false;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
