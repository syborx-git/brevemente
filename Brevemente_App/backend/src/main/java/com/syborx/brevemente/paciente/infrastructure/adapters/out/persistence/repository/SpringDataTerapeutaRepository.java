package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataTerapeutaRepository extends JpaRepository<TerapeutaJpaEntity, String> {
    Optional<TerapeutaJpaEntity> findByEmail(String email);
}
