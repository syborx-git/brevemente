package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCorpusJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataClinicalCorpusRepository extends JpaRepository<ClinicalCorpusJpaEntity, String> {

    Optional<ClinicalCorpusJpaEntity> findByProtocolCode(String protocolCode);

    @Query("SELECT c FROM ClinicalCorpusJpaEntity c WHERE " +
           "(:protocolFilter IS NULL OR LOWER(c.protocolCode) LIKE LOWER(CONCAT('%', :protocolFilter, '%'))) AND " +
           "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ClinicalCorpusJpaEntity> searchByQueryAndProtocol(
            @Param("query") String query,
            @Param("protocolFilter") String protocolFilter
    );
}
