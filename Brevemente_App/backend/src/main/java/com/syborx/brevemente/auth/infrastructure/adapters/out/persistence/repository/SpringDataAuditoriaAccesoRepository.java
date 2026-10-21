package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.AuditoriaAccesoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataAuditoriaAccesoRepository extends JpaRepository<AuditoriaAccesoJpaEntity, String> {
}
