package com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.entity;

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
@Table(name = "constancias_fisicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConstanciaFisicaJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "folio_fisico", length = 50)
    private String folioFisico;

    @Column(name = "fecha_expedicion")
    private LocalDate fechaExpedicion;

    @Column(name = "tipo", length = 20, nullable = false)
    private String tipo;

    @Column(name = "emisor_nombre", length = 200)
    private String emisorNombre;

    @Column(name = "emisor_cedula", length = 50)
    private String emisorCedula;

    @Column(name = "destinatario", columnDefinition = "TEXT")
    private String destinatario;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "periodo_cubierto", columnDefinition = "TEXT")
    private String periodoCubierto;

    @Column(name = "num_sesiones")
    private Integer numSesiones;

    @Column(name = "resumen_clinico", columnDefinition = "TEXT")
    private String resumenClinico;

    @Column(name = "url_escaneo", columnDefinition = "TEXT")
    private String urlEscaneo;

    @Column(name = "nombre_archivo_escaneo", length = 255)
    private String nombreArchivoEscaneo;

    @Column(name = "entregado_a", columnDefinition = "TEXT")
    private String entregadoA;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @Column(name = "registrado_por_id", length = 36)
    private String registradoPorId;

    @Column(name = "registrado_at")
    private OffsetDateTime registradoAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
