package com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SupervisionAsignacionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataSupervisionAsignacionRepository
        extends JpaRepository<SupervisionAsignacionJpaEntity, String> {

    List<SupervisionAsignacionJpaEntity> findBySupervisorUsuarioId(String supervisorUsuarioId);
}
