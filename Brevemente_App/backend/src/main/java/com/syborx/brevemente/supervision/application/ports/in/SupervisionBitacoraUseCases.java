package com.syborx.brevemente.supervision.application.ports.in;

import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;

import java.util.List;

public interface SupervisionBitacoraUseCases {
    List<SupervisionBitacora> listarPorPaciente(String pacienteId, List<String> terapeutaIds, boolean esEvaluador);

    SupervisionBitacora registrar(SupervisionBitacora bitacora);

    void eliminar(String bitacoraId, List<String> terapeutaIds, boolean esEvaluador);
}
