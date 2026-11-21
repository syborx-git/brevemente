package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Expediente;

/**
 * Abre (crea) el expediente clínico de un paciente.
 * <p>
 * Es idempotente: si el paciente ya tiene expediente, devuelve el existente.
 */
public interface CrearExpedienteUseCase {

    /**
     * @param pacienteId  identificador del paciente.
     * @param terapeutaId terapeuta asignado (puede ser {@code null}).
     * @param operadorId  identificador del operador autenticado (actor de la
     *                    auditoría de apertura; NO es el usuario del paciente).
     * @return el expediente creado, o el existente si ya había uno.
     */
    Expediente crear(String pacienteId, String terapeutaId, String operadorId);
}
