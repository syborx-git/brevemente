package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.CatalogoCategoriaPsicofarmacoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataCatalogoCategoriaPsicofarmacoRepository
        extends JpaRepository<CatalogoCategoriaPsicofarmacoJpaEntity, String> {

    List<CatalogoCategoriaPsicofarmacoJpaEntity> findAllByOrderByOrdenAsc();
}
