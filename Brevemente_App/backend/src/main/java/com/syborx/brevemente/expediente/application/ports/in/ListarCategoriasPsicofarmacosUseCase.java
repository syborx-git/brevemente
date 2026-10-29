package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.CategoriaPsicofarmaco;

import java.util.List;

public interface ListarCategoriasPsicofarmacosUseCase {
    List<CategoriaPsicofarmaco> listar();
}
