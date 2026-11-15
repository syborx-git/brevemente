package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.OpcionConductualRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.OpcionConductual;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.CatalogoOpcionConductualJpaEntity;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository.SpringDataCatalogoOpcionConductualRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CatalogoOpcionConductualPersistenceAdapter implements OpcionConductualRepositoryPort {

    private final SpringDataCatalogoOpcionConductualRepository repository;

    @Override
    public List<OpcionConductual> findAll() {
        return repository.findAllByOrderByOrdenAsc().stream()
                .map(e -> new OpcionConductual(e.getId(), e.getCodigo(), e.getEtiqueta(), e.getOrden()))
                .toList();
    }
}
