package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PacienteJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "apellidos", length = 100, nullable = false)
    private String apellidos;

    @Column(name = "curp", length = 18, unique = true)
    private String curp;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "edad_calculada", nullable = false)
    private Integer edadCalculada;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "estado_consentimiento", length = 30, nullable = false)
    private String estadoConsentimiento;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "activo";

    @Column(name = "risk_level", length = 10)
    @Builder.Default
    private String riskLevel = "bajo";

    @Column(name = "registry_mode", length = 10)
    @Builder.Default
    private String registryMode = "manual";

    @Column(name = "session_frequency", length = 20)
    @Builder.Default
    private String sessionFrequency = "semanal";

    @Column(name = "quien_completa_registro", length = 30)
    @Builder.Default
    private String quienCompletaRegistro = "PACIENTE";

    @Column(name = "motivo_consulta", columnDefinition = "TEXT")
    private String motivoConsulta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "terapeuta_id")
    private TerapeutaJpaEntity terapeuta;

    // Metadatos de consentimiento
    @Column(name = "fecha_determinacion_consentimiento")
    private LocalDate fechaDeterminacionConsentimiento;

    @Column(name = "motivo_determinacion_consentimiento", columnDefinition = "TEXT")
    private String motivoDeterminacionConsentimiento;

    // Metadatos de persona de apoyo / representante
    @Column(name = "persona_de_apoyo_nombre", length = 200)
    private String personaDeApoyoNombre;

    @Column(name = "persona_de_apoyo_contacto", length = 100)
    private String personaDeApoyoContacto;

    @Column(name = "representante_parentesco", length = 30)
    private String representanteParentesco;

    @Column(name = "representante_correo", length = 150)
    private String representanteCorreo;

    @Column(name = "consentimiento_representante_firmado")
    @Builder.Default
    private Boolean consentimientoRepresentanteFirmado = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
