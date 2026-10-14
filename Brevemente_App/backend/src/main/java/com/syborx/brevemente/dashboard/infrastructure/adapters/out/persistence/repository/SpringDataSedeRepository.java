package com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SedeJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataSedeRepository extends JpaRepository<SedeJpaEntity, String> {

    List<SedeJpaEntity> findByActivoTrueOrderByNombreAsc();
}
