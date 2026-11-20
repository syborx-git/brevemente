package com.syborx.brevemente.expediente.domain.factory;

import com.syborx.brevemente.expediente.domain.model.Expediente;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Fábrica de dominio para la apertura de expedientes clínicos.
 * <p>
 * Genera un expediente mínimo válido en el alta del paciente. El dominio no
 * conoce la persistencia: el folio y la fecha llegan como parámetros desde la
 * capa de aplicación (la secuencia de folio la resuelve el adaptador de
 * persistencia).
 */
public final class ExpedienteFactory {

    /** Motivo de consulta inicial mientras el clínico captura la formulación TBE. */
    public static final String MOTIVO_CONSULTA_INICIAL = "Pendiente de captura en primera consulta";

    private ExpedienteFactory() {
    }

    /**
     * Crea un expediente mínimo en estado ACTIVO con los valores por defecto
     * exigidos por el esquema (columnas NOT NULL y JSONB vacíos).
     *
     * @param pacienteId          identificador del paciente recién dado de alta.
     * @param terapeutaAsignadoId terapeuta asignado (puede ser {@code null}).
     * @param folio               folio ya formateado (p. ej. {@code EXP-0005}).
     * @param fecha               fecha de alta (se usa para inicio y apertura).
     * @return expediente mínimo listo para persistir.
     */
    public static Expediente crearMinimo(String pacienteId, String terapeutaAsignadoId,
                                         String folio, LocalDate fecha) {
        return Expediente.builder()
                .id("exp-" + UUID.randomUUID().toString().substring(0, 8))
                .pacienteId(pacienteId)
                .terapeutaAsignadoId(terapeutaAsignadoId)
                .motivoConsulta(MOTIVO_CONSULTA_INICIAL)
                .estatusExpediente("ACTIVO")
                .modalidad("presencial")
                .tipoExpediente("electronico")
                .folio(folio)
                .fechaInicio(fecha)
                .fechaApertura(fecha)
                .drugsList(List.of())
                .farmacosEsquema(List.of())
                .drogasEsquema(List.of())
                .historialFarmacos(List.of())
                .historialPsicofarmacos(List.of())
                .historialDrogas(List.of())
                .antecedentes(Map.of())
                .build();
    }
}
