package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.expediente.application.ports.in.ListarCategoriasPsicofarmacosUseCase;
import com.syborx.brevemente.expediente.application.ports.out.CategoriaPsicofarmacoRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.CategoriaPsicofarmaco;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("expedienteCatalogoCategoriaPsicofarmacoApplicationService")
@RequiredArgsConstructor
public class CatalogoCategoriaPsicofarmacoApplicationService implements ListarCategoriasPsicofarmacosUseCase {

    private final CategoriaPsicofarmacoRepositoryPort categoriaPsicofarmacoRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaPsicofarmaco> listar() {
        return categoriaPsicofarmacoRepositoryPort.findAll();
    }
}
