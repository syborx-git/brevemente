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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "expedientes_clinicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpedienteJpaEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "paciente_id", length = 36, nullable = false)
    private String pacienteId;

    @Column(name = "terapeuta_asignado_id", length = 36)
    private String terapeutaAsignadoId;

    @Column(name = "motivo_consulta", columnDefinition = "TEXT", nullable = false)
    private String motivoConsulta;

    @Column(name = "intentos_solucion", columnDefinition = "TEXT")
    private String intentosSolucion;

    @Column(name = "objetivo_terapeutico", columnDefinition = "TEXT")
    private String objetivoTerapeutico;

    @Column(name = "diagnostico_operativo", columnDefinition = "TEXT")
    private String diagnosticoOperativo;

    @Column(name = "estatus_expediente", length = 30)
    private String estatusExpediente;

    @Column(name = "folio", length = 30)
    private String folio;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "modalidad", length = 10)
    private String modalidad;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "trastorno_estrategico", columnDefinition = "TEXT")
    private String trastornoEstrategico;

    @Column(name = "primera_aparicion", columnDefinition = "TEXT")
    private String primeraAparicion;

    @Column(name = "factores_precipitantes", columnDefinition = "TEXT")
    private String factoresPrecipitantes;

    @Column(name = "tipo_evolucion", length = 20)
    private String tipoEvolucion;

    @Column(name = "spr_inicial", columnDefinition = "TEXT")
    private String sprInicial;

    @Column(name = "valoracion_cambio_inicial", columnDefinition = "TEXT")
    private String valoracionCambioInicial;

    @Column(name = "valoracion_global_inicial", columnDefinition = "TEXT")
    private String valoracionGlobalInicial;

    @Column(name = "objetivo_paciente", columnDefinition = "TEXT")
    private String objetivoPaciente;

    @Column(name = "dx_nosologico", columnDefinition = "TEXT")
    private String dxNosologico;

    @Column(name = "dsm5", columnDefinition = "TEXT")
    private String dsm5;

    @Column(name = "cie11", columnDefinition = "TEXT")
    private String cie11;

    @Column(name = "comorbilidad", columnDefinition = "TEXT")
    private String comorbilidad;

    @Column(name = "diagnostico_diferencial", columnDefinition = "TEXT")
    private String diagnosticoDiferencial;

    @Column(name = "plan_tratamiento", columnDefinition = "TEXT")
    private String planTratamiento;

    @Column(name = "pronostico", length = 20)
    private String pronostico;

    @Column(name = "factores_favorables", columnDefinition = "TEXT")
    private String factoresFavorables;

    @Column(name = "factores_desfavorables", columnDefinition = "TEXT")
    private String factoresDesfavorables;

    @Column(name = "uso_farmacos", length = 15)
    private String usoFarmacos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "esquema_farmacologico", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> esquemaFarmacologico;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
