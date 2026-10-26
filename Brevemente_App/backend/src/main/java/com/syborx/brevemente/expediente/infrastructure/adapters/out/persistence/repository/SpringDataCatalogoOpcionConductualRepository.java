package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.CatalogoOpcionConductualJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataCatalogoOpcionConductualRepository extends JpaRepository<CatalogoOpcionConductualJpaEntity, String> {
    List<CatalogoOpcionConductualJpaEntity> findAllByOrderByOrdenAsc();
}
