package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.CategoriaPsicofarmacoRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.CategoriaPsicofarmaco;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.CatalogoCategoriaPsicofarmacoJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataCatalogoCategoriaPsicofarmacoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CatalogoCategoriaPsicofarmacoPersistenceAdapter implements CategoriaPsicofarmacoRepositoryPort {

    private final SpringDataCatalogoCategoriaPsicofarmacoRepository repository;

    @Override
    public List<CategoriaPsicofarmaco> findAll() {
        return repository.findAllByOrderByOrdenAsc().stream()
                .map(e -> new CategoriaPsicofarmaco(e.getId(), e.getCodigo(), e.getEtiqueta(), e.getOrden()))
                .toList();
    }
}
