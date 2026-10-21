package com.syborx.brevemente.expediente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expediente {
    private String id;
    private String pacienteId;
    private String pacienteNombre;
    private Integer edadCalculada;
    private String riskLevel;
    private String terapeutaAsignadoId;
    private String terapeutaNombre;
    private String motivoConsulta;
    private String intentosSolucion;
    private String objetivoTerapeutico;
    private String diagnosticoOperativo;
    private String estatusExpediente;
    private String folio;
    private LocalDate fechaInicio;
    private String modalidad;
    private String descripcion;
    private String trastornoEstrategico;
    private String primeraAparicion;
    private String factoresPrecipitantes;
    private String tipoEvolucion;
    private String sprInicial;
    private String valoracionCambioInicial;
    private String valoracionGlobalInicial;
    private String objetivoPaciente;
    private String dxNosologico;
    private String dsm5;
    private String cie11;
    private String comorbilidad;
    private String diagnosticoDiferencial;
    private String planTratamiento;
    private String pronostico;
    private String factoresFavorables;
    private String factoresDesfavorables;
    private String usoFarmacos;
    private List<Drug> drugsList;
}
