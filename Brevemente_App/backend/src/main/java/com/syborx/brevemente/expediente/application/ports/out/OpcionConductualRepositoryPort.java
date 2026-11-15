package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.OpcionConductual;

import java.util.List;

public interface OpcionConductualRepositoryPort {
    List<OpcionConductual> findAll();
}
