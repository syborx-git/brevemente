package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.in.ActualizarExpedienteUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ObtenerExpedienteUseCase;
import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpedienteApplicationService implements ObtenerExpedienteUseCase, ActualizarExpedienteUseCase {

    private final ExpedienteRepositoryPort expedienteRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional(readOnly = true)
    public Expediente obtenerPorPaciente(String pacienteId) {
        return expedienteRepositoryPort.findByPacienteId(pacienteId)
                .orElseThrow(() -> new ExpedienteNotFoundException(pacienteId));
    }

    @Override
    @Transactional
    public Expediente actualizar(String pacienteId, Expediente datosParciales, String usuarioId) {
        Expediente actual = obtenerPorPaciente(pacienteId);
        aplicar(actual, datosParciales);
        Expediente saved = expedienteRepositoryPort.save(actual);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), usuarioId,
                "Actualización de expediente",
                "Se actualizó la formulación TBE / expediente psiquiátrico.", "expediente");
        boolean historiaClinica = (datosParciales.getAntecedentes() != null && !datosParciales.getAntecedentes().isEmpty())
                || (datosParciales.getExamenMental() != null && !datosParciales.getExamenMental().isEmpty())
                || datosParciales.getRiesgoSuicidaEspecificar() != null
                || datosParciales.getRiesgoHeteroagresivoEspecificar() != null;
        if (historiaClinica) {
            auditoriaExpedientePort.registrar(
                    saved.getPacienteId(), usuarioId,
                    "Actualización de antecedentes/examen mental",
                    "Se actualizó la historia clínica (antecedentes, examen mental y/o evaluación de riesgo).", "expediente");
        }
        return saved;
    }

    /** Copia los campos editables no nulos del parcial sobre el expediente cargado. */
    private void aplicar(Expediente target, Expediente src) {
        if (src == null) return;
        if (src.getMotivoConsulta() != null) target.setMotivoConsulta(src.getMotivoConsulta());
        if (src.getDescripcion() != null) target.setDescripcion(src.getDescripcion());
        if (src.getTrastornoEstrategico() != null) target.setTrastornoEstrategico(src.getTrastornoEstrategico());
        if (src.getPrimeraAparicion() != null) target.setPrimeraAparicion(src.getPrimeraAparicion());
        if (src.getFactoresPrecipitantes() != null) target.setFactoresPrecipitantes(src.getFactoresPrecipitantes());
        if (src.getTipoEvolucion() != null) target.setTipoEvolucion(src.getTipoEvolucion());
        if (src.getDiagnosticoOperativo() != null) target.setDiagnosticoOperativo(src.getDiagnosticoOperativo());
        if (src.getSprInicial() != null) target.setSprInicial(src.getSprInicial());
        if (src.getObjetivoPaciente() != null) target.setObjetivoPaciente(src.getObjetivoPaciente());
        if (src.getObjetivoTerapeutico() != null) target.setObjetivoTerapeutico(src.getObjetivoTerapeutico());
        if (src.getDxNosologico() != null) target.setDxNosologico(src.getDxNosologico());
        if (src.getDsm5() != null) target.setDsm5(src.getDsm5());
        if (src.getCie11() != null) target.setCie11(src.getCie11());
        if (src.getComorbilidad() != null) target.setComorbilidad(src.getComorbilidad());
        if (src.getDiagnosticoDiferencial() != null) target.setDiagnosticoDiferencial(src.getDiagnosticoDiferencial());
        if (src.getPlanTratamiento() != null) target.setPlanTratamiento(src.getPlanTratamiento());
        if (src.getPronostico() != null) target.setPronostico(src.getPronostico());
        if (src.getFactoresFavorables() != null) target.setFactoresFavorables(src.getFactoresFavorables());
        if (src.getFactoresDesfavorables() != null) target.setFactoresDesfavorables(src.getFactoresDesfavorables());
        if (src.getUsoFarmacos() != null) target.setUsoFarmacos(src.getUsoFarmacos());
        if (src.getDrugsList() != null) target.setDrugsList(src.getDrugsList());
        if (src.getIntentosSolucion() != null) target.setIntentosSolucion(src.getIntentosSolucion());
        if (src.getTipoExpediente() != null) target.setTipoExpediente(src.getTipoExpediente());
        if (src.getFechaApertura() != null) target.setFechaApertura(src.getFechaApertura());
        if (src.getFuenteReferencia() != null) target.setFuenteReferencia(src.getFuenteReferencia());
        if (src.getFuenteReferenciaOtro() != null) target.setFuenteReferenciaOtro(src.getFuenteReferenciaOtro());
        if (src.getRiesgoSuicida() != null) target.setRiesgoSuicida(src.getRiesgoSuicida());
        if (src.getRiesgoHeteroagresivo() != null) target.setRiesgoHeteroagresivo(src.getRiesgoHeteroagresivo());
        if (src.getOtrosRiesgos() != null) target.setOtrosRiesgos(src.getOtrosRiesgos());
        if (src.getFechaEvaluacionRiesgo() != null) target.setFechaEvaluacionRiesgo(src.getFechaEvaluacionRiesgo());
        if (src.getExamenMental() != null && !src.getExamenMental().isEmpty()) target.setExamenMental(src.getExamenMental());
        if (src.getHistorialFarmacos() != null) target.setHistorialFarmacos(src.getHistorialFarmacos());
        if (src.getHistorialPsicofarmacos() != null) target.setHistorialPsicofarmacos(src.getHistorialPsicofarmacos());
        if (src.getHistorialDrogas() != null) target.setHistorialDrogas(src.getHistorialDrogas());
        if (src.getAntecedentes() != null && !src.getAntecedentes().isEmpty()) target.setAntecedentes(src.getAntecedentes());
        if (src.getRiesgoSuicidaEspecificar() != null) target.setRiesgoSuicidaEspecificar(src.getRiesgoSuicidaEspecificar());
        if (src.getRiesgoHeteroagresivoEspecificar() != null) target.setRiesgoHeteroagresivoEspecificar(src.getRiesgoHeteroagresivoEspecificar());
        if (src.getFechaExamenMental() != null) target.setFechaExamenMental(src.getFechaExamenMental());
    }
}
