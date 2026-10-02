package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity;

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
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "auditoria_accesos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaAccesoJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "usuario_id", length = 36, nullable = false)
    private String usuarioId;

    @Column(name = "recurso_accedido", length = 100, nullable = false)
    private String recursoAccedido;

    @Column(name = "accion", length = 50, nullable = false)
    private String accion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detalles", columnDefinition = "jsonb")
    private Map<String, Object> detalles;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
