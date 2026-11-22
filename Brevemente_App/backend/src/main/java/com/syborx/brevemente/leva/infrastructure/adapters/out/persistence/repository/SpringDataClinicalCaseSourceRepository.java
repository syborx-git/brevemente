package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCaseSourceJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataClinicalCaseSourceRepository extends JpaRepository<ClinicalCaseSourceJpaEntity, String> {

    List<ClinicalCaseSourceJpaEntity> findByStatusOrderByApprovedAtDesc(String status);

    List<ClinicalCaseSourceJpaEntity> findAllByOrderByApprovedAtDesc();

    boolean existsByExpedienteIdAndStatus(String expedienteId, String status);
}
