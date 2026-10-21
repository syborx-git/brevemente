package com.syborx.brevemente.constancia.application.ports.in;

import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;

import java.util.List;

public interface ConstanciaUseCases {
    List<ConstanciaFisica> listarPorPaciente(String pacienteId);

    ConstanciaFisica registrar(ConstanciaFisica constancia);

    void anular(String constanciaId);
}
