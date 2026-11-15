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

import java.time.OffsetDateTime;

@Entity
@Table(name = "tratamientos_previos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TratamientoPrevioJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "expediente_id", length = 36, nullable = false)
    private String expedienteId;

    @Column(name = "enfoque", length = 100)
    private String enfoque;

    @Column(name = "duracion", length = 50)
    private String duracion;

    @Column(name = "resultado", length = 20)
    private String resultado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
