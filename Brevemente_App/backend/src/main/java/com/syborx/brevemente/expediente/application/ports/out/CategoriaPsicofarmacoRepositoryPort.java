package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.CategoriaPsicofarmaco;

import java.util.List;

public interface CategoriaPsicofarmacoRepositoryPort {
    List<CategoriaPsicofarmaco> findAll();
}
