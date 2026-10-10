package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.expediente.domain.model.Drug;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.ExpedienteJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ExpedientePersistenceMapper {

    private final ObjectMapper objectMapper;

    public Expediente toDomain(ExpedienteJpaEntity e, String pacienteNombre, Integer edadCalculada,
                               String riskLevel, String terapeutaNombre) {
        if (e == null) return null;
        return Expediente.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .edadCalculada(edadCalculada)
                .riskLevel(riskLevel)
                .terapeutaAsignadoId(e.getTerapeutaAsignadoId())
                .terapeutaNombre(terapeutaNombre)
                .motivoConsulta(e.getMotivoConsulta())
                .intentosSolucion(e.getIntentosSolucion())
                .objetivoTerapeutico(e.getObjetivoTerapeutico())
                .diagnosticoOperativo(e.getDiagnosticoOperativo())
                .estatusExpediente(e.getEstatusExpediente())
                .folio(e.getFolio())
                .fechaInicio(e.getFechaInicio())
                .modalidad(e.getModalidad())
                .descripcion(e.getDescripcion())
                .trastornoEstrategico(e.getTrastornoEstrategico())
                .primeraAparicion(e.getPrimeraAparicion())
                .factoresPrecipitantes(e.getFactoresPrecipitantes())
                .tipoEvolucion(e.getTipoEvolucion())
                .sprInicial(e.getSprInicial())
                .valoracionCambioInicial(e.getValoracionCambioInicial())
                .valoracionGlobalInicial(e.getValoracionGlobalInicial())
                .objetivoPaciente(e.getObjetivoPaciente())
                .dxNosologico(e.getDxNosologico())
                .dsm5(e.getDsm5())
                .cie11(e.getCie11())
                .comorbilidad(e.getComorbilidad())
                .diagnosticoDiferencial(e.getDiagnosticoDiferencial())
                .planTratamiento(e.getPlanTratamiento())
                .pronostico(e.getPronostico())
                .factoresFavorables(e.getFactoresFavorables())
                .factoresDesfavorables(e.getFactoresDesfavorables())
                .usoFarmacos(e.getUsoFarmacos())
                .drugsList(toDrugs(e.getEsquemaFarmacologico()))
                .build();
    }

    public ExpedienteJpaEntity toJpaEntity(Expediente d) {
        if (d == null) return null;
        return ExpedienteJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .terapeutaAsignadoId(d.getTerapeutaAsignadoId())
                .motivoConsulta(d.getMotivoConsulta())
                .intentosSolucion(d.getIntentosSolucion())
                .objetivoTerapeutico(d.getObjetivoTerapeutico())
                .diagnosticoOperativo(d.getDiagnosticoOperativo())
                .estatusExpediente(d.getEstatusExpediente())
                .folio(d.getFolio())
                .fechaInicio(d.getFechaInicio())
                .modalidad(d.getModalidad())
                .descripcion(d.getDescripcion())
                .trastornoEstrategico(d.getTrastornoEstrategico())
                .primeraAparicion(d.getPrimeraAparicion())
                .factoresPrecipitantes(d.getFactoresPrecipitantes())
                .tipoEvolucion(d.getTipoEvolucion())
                .sprInicial(d.getSprInicial())
                .valoracionCambioInicial(d.getValoracionCambioInicial())
                .valoracionGlobalInicial(d.getValoracionGlobalInicial())
                .objetivoPaciente(d.getObjetivoPaciente())
                .dxNosologico(d.getDxNosologico())
                .dsm5(d.getDsm5())
                .cie11(d.getCie11())
                .comorbilidad(d.getComorbilidad())
                .diagnosticoDiferencial(d.getDiagnosticoDiferencial())
                .planTratamiento(d.getPlanTratamiento())
                .pronostico(d.getPronostico())
                .factoresFavorables(d.getFactoresFavorables())
                .factoresDesfavorables(d.getFactoresDesfavorables())
                .usoFarmacos(d.getUsoFarmacos())
                .esquemaFarmacologico(toJson(d.getDrugsList()))
                .build();
    }

    private List<Drug> toDrugs(List<Map<String, Object>> json) {
        if (json == null || json.isEmpty()) return List.of();
        return objectMapper.convertValue(json, new TypeReference<List<Drug>>() {});
    }

    private List<Map<String, Object>> toJson(List<Drug> drugs) {
        if (drugs == null || drugs.isEmpty()) return List.of();
        return objectMapper.convertValue(drugs, new TypeReference<List<Map<String, Object>>>() {});
    }
}
