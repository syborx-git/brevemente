package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.CriterioClinico;

import java.util.List;

public interface ListarCriteriosSesionUseCase {
    List<CriterioClinico> listar(String sesionId);
}
