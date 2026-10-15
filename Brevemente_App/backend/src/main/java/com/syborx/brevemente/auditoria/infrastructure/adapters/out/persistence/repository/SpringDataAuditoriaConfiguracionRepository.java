package com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.entity.AuditoriaConfiguracionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataAuditoriaConfiguracionRepository
        extends JpaRepository<AuditoriaConfiguracionJpaEntity, String> {

    List<AuditoriaConfiguracionJpaEntity> findByTerapeutaIdOrderByCreatedAtDesc(String terapeutaId);
}
