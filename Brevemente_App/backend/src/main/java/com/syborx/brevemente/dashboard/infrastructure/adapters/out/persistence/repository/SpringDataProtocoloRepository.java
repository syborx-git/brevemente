package com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.ProtocoloJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataProtocoloRepository extends JpaRepository<ProtocoloJpaEntity, String> {

    List<ProtocoloJpaEntity> findByActivoTrueOrderByNombreAsc();
}
