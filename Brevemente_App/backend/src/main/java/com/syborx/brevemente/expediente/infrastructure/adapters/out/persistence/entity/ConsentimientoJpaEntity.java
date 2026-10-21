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
@Table(name = "consentimientos_informados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentimientoJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "tipo_consentimiento", length = 50, nullable = false)
    private String tipoConsentimiento;

    @Column(name = "firmado_por", length = 200, nullable = false)
    private String firmadoPor;

    @Column(name = "calidad_firmante", length = 50, nullable = false)
    private String calidadFirmante;

    @Column(name = "fecha_firma", nullable = false)
    private OffsetDateTime fechaFirma;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "documento_hash", length = 64)
    private String documentoHash;

    @Column(name = "revocado")
    private Boolean revocado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
