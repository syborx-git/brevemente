package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.expediente.domain.model.Drug;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Solicitud de actualización de la formulación TBE y del expediente psiquiátrico")
public record ExpedienteUpdateRequest(
        @Schema(description = "Motivo de consulta (textual)") String motif,
        @Schema(description = "Descripción de la conducta sintomática") String description,
        @Schema(description = "Trastorno estratégico clasificado") String trastornoEstrategico,
        @Schema(description = "Primera aparición") String firstAppearance,
        @Schema(description = "Factores precipitantes") String precipitatingFactors,
        @Schema(description = "Tipo de evolución") String evolutionType,
        @Schema(description = "Diagnóstico operativo inicial") String dxOpInicial,
        @Schema(description = "SPR inicial") String sprInicial,
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
        @Schema(description = "Esquema farmacológico") List<Drug> drugsList
) {}
