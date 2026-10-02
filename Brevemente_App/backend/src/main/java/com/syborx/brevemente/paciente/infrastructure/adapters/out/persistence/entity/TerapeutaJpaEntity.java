package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "terapeutas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TerapeutaJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "usuario_id", length = 36)
    private String usuarioId;

    @Column(name = "cedula_profesional", length = 50)
    private String cedulaProfesional;

    @Column(name = "especialidad", length = 100)
    private String especialidad;

    @Column(name = "activo")
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
