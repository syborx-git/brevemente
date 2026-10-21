package com.syborx.brevemente.pago.application.ports.in;

import com.syborx.brevemente.pago.domain.model.Pago;

import java.util.List;

public interface PagoUseCases {
    List<Pago> listarPorPaciente(String pacienteId);

    Pago registrar(Pago pago);

    Pago cambiarEstado(String pagoId, String estado);

    void eliminar(String pagoId);
}
