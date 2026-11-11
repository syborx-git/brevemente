package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.ClinicalCorpusChunkJpaEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataClinicalCorpusChunkRepository extends JpaRepository<ClinicalCorpusChunkJpaEntity, String> {

    List<ClinicalCorpusChunkJpaEntity> findByDocumentIdOrderByChunkIndexAsc(String documentId);

    void deleteByDocumentId(String documentId);

    @Query("SELECT c FROM ClinicalCorpusChunkJpaEntity c WHERE " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY c.createdAt DESC")
    List<ClinicalCorpusChunkJpaEntity> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}

