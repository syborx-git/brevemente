package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.expediente.domain.model.Drug;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Map;

@Schema(description = "Contrato de respuesta del expediente clínico, simétrico con ClinicalRecord del frontend Angular")
public record ExpedienteResponseDTO(
        @Schema(description = "Identificador del paciente", example = "pac-001") String patientId,
        @Schema(description = "Nombre completo del paciente", example = "Mateo Herrera Santos") String patientName,
        @Schema(description = "Folio del expediente", example = "EXP-0001") String folio,
        @Schema(description = "Fecha de inicio de tratamiento (YYYY-MM-DD)", example = "2026-08-10") String startDate,
        @Schema(description = "Edad calculada", example = "17") Integer age,
        @Schema(description = "Terapeuta asignado", example = "Dra. Sofía Ramírez Lozano") String therapistName,
        @Schema(description = "Estatus del expediente", example = "ACTIVO") String status,
        @Schema(description = "Nivel de riesgo", example = "medio") String riskLevel,
        @Schema(description = "Modalidad de tratamiento", example = "presencial") String modality,
        @Schema(description = "Motivo de consulta") String motif,
        @Schema(description = "Descripción de conducta sintomática") String description,
        @Schema(description = "Trastorno estratégico") String trastornoEstrategico,
        @Schema(description = "Primera aparición") String firstAppearance,
        @Schema(description = "Factores precipitantes") String precipitatingFactors,
        @Schema(description = "Tipo de evolución") String evolutionType,
        @Schema(description = "Diagnóstico operativo inicial") String dxOpInicial,
        @Schema(description = "SPR inicial") String sprInicial,
        @Schema(description = "Valoración de cambio inicial") String valoracionCambioInicial,
        @Schema(description = "Valoración global inicial") String valoracionGlobalInicial,
        @Schema(description = "Objetivo del paciente") String objectivePatient,
        @Schema(description = "Objetivo del terapeuta") String objectiveTherapist,
        @Schema(description = "Diagnóstico nosológico") String dxNosologico,
        @Schema(description = "Criterio DSM-5-TR") String dsm5,
        @Schema(description = "Criterio CIE-11") String cie11,
        @Schema(description = "Comorbilidad") String comorbilidad,
        @Schema(description = "Diagnóstico diferencial") String differentialDx,
        @Schema(description = "Plan de tratamiento farmacológico") String treatmentPlan,
        @Schema(description = "Pronóstico") String prognosis,
        @Schema(description = "Factores favorables") String favorableFactors,
        @Schema(description = "Factores desfavorables") String unfavorableFactors,
        @Schema(description = "Uso de fármacos (SI/NO/ESPECIFICAR)") String drugsUsage,
        @Schema(description = "Esquema farmacológico") List<Drug> drugsList,
        @Schema(description = "Intentos de solución del paciente") String intentosSolucion,
        @Schema(description = "Tipo de expediente", allowableValues = {"fisico", "electronico", "mixto"}) String tipoExpediente,
        @Schema(description = "Fecha de apertura del expediente (YYYY-MM-DD)") String fechaApertura,
        @Schema(description = "Fuente de referencia") String fuenteReferencia,
        @Schema(description = "Fuente de referencia (otro, texto libre)") String fuenteReferenciaOtro,
        @Schema(description = "Riesgo suicida", allowableValues = {"ausente", "bajo", "moderado", "alto", "inminente"}) String riesgoSuicida,
        @Schema(description = "Riesgo heteroagresivo", allowableValues = {"ausente", "bajo", "moderado", "alto"}) String riesgoHeteroagresivo,
        @Schema(description = "Otros riesgos") String otrosRiesgos,
        @Schema(description = "Examen mental (JSONB)") Object examenMental,
        @Schema(description = "Historial de fármacos") List<Map<String, Object>> historialFarmacos,
        @Schema(description = "Historial de psicofármacos") List<Map<String, Object>> historialPsicofarmacos,
        @Schema(description = "Historial de drogas") List<Map<String, Object>> historialDrogas,
        @Schema(description = "Antecedentes estructurados (JSONB)") Map<String, Object> antecedentes,
        @Schema(description = "Especificación del riesgo suicida") String riesgoSuicidaEspecificar,
        @Schema(description = "Especificación del riesgo heteroagresivo") String riesgoHeteroagresivoEspecificar,
        @Schema(description = "Fecha del examen mental (YYYY-MM-DD)") String fechaExamenMental
) {}
