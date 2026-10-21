package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.ExpedienteResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.ExpedienteUpdateRequest;
import org.springframework.stereotype.Component;

@Component
public class ExpedienteRestMapper {

    public ExpedienteResponseDTO toResponse(Expediente e) {
        if (e == null) return null;
        return new ExpedienteResponseDTO(
                e.getPacienteId(),
                e.getPacienteNombre(),
                e.getFolio(),
                e.getFechaInicio() != null ? e.getFechaInicio().toString() : null,
                e.getEdadCalculada(),
                e.getTerapeutaNombre(),
                e.getEstatusExpediente(),
                e.getRiskLevel(),
                e.getModalidad(),
                e.getMotivoConsulta(),
                e.getDescripcion(),
                e.getTrastornoEstrategico(),
                e.getPrimeraAparicion(),
                e.getFactoresPrecipitantes(),
                e.getTipoEvolucion(),
                e.getDiagnosticoOperativo(),
                e.getSprInicial(),
                e.getValoracionCambioInicial(),
                e.getValoracionGlobalInicial(),
                e.getObjetivoPaciente(),
                e.getObjetivoTerapeutico(),
                e.getDxNosologico(),
                e.getDsm5(),
                e.getCie11(),
                e.getComorbilidad(),
                e.getDiagnosticoDiferencial(),
                e.getPlanTratamiento(),
                e.getPronostico(),
                e.getFactoresFavorables(),
                e.getFactoresDesfavorables(),
                e.getUsoFarmacos(),
                e.getDrugsList()
        );
    }

    /**
     * Construye un {@link Expediente} parcial (solo campos editables de DX + psiquiatría)
     * a partir del request de actualización. Los campos de identidad/join van a null.
     */
    public Expediente toParcial(ExpedienteUpdateRequest r) {
        if (r == null) return null;
        return Expediente.builder()
                .motivoConsulta(r.motif())
                .descripcion(r.description())
                .trastornoEstrategico(r.trastornoEstrategico())
                .primeraAparicion(r.firstAppearance())
                .factoresPrecipitantes(r.precipitatingFactors())
                .tipoEvolucion(r.evolutionType())
                .diagnosticoOperativo(r.dxOpInicial())
                .sprInicial(r.sprInicial())
                .objetivoPaciente(r.objectivePatient())
                .objetivoTerapeutico(r.objectiveTherapist())
                .dxNosologico(r.dxNosologico())
                .dsm5(r.dsm5())
                .cie11(r.cie11())
                .comorbilidad(r.comorbilidad())
                .diagnosticoDiferencial(r.differentialDx())
                .planTratamiento(r.treatmentPlan())
                .pronostico(r.prognosis())
                .factoresFavorables(r.favorableFactors())
                .factoresDesfavorables(r.unfavorableFactors())
                .usoFarmacos(r.drugsUsage())
                .drugsList(r.drugsList())
                .build();
    }
}
