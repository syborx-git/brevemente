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

    @Column(name = "tipo_expediente", length = 15)
    private String tipoExpediente;

    @Column(name = "fecha_apertura")
    private LocalDate fechaApertura;

    @Column(name = "fuente_referencia", length = 30)
    private String fuenteReferencia;

    @Column(name = "fuente_referencia_otro", length = 100)
    private String fuenteReferenciaOtro;

    @Column(name = "riesgo_suicida", length = 10)
    private String riesgoSuicida;

    @Column(name = "riesgo_heteroagresivo", length = 10)
    private String riesgoHeteroagresivo;

    @Column(name = "otros_riesgos", columnDefinition = "TEXT")
    private String otrosRiesgos;

    @Column(name = "fecha_evaluacion_riesgo")
    private LocalDate fechaEvaluacionRiesgo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "examen_mental", columnDefinition = "jsonb")
    private Map<String, Object> examenMental;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "historial_farmacos", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> historialFarmacos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "historial_psicofarmacos", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> historialPsicofarmacos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "historial_drogas", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> historialDrogas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "antecedentes", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> antecedentes;

    @Column(name = "riesgo_suicida_especificar", columnDefinition = "TEXT")
    private String riesgoSuicidaEspecificar;

    @Column(name = "riesgo_heteroagresivo_especificar", columnDefinition = "TEXT")
    private String riesgoHeteroagresivoEspecificar;

    @Column(name = "fecha_examen_mental")
    private LocalDate fechaExamenMental;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
