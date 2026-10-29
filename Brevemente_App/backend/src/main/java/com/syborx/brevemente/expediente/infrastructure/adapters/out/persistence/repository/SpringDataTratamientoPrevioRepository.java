package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.TratamientoPrevioJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataTratamientoPrevioRepository
        extends JpaRepository<TratamientoPrevioJpaEntity, String> {

    List<TratamientoPrevioJpaEntity> findByExpedienteIdOrderByCreatedAtAsc(String expedienteId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TratamientoPrevioJpaEntity t WHERE t.expedienteId = :expedienteId")
    void deleteByExpedienteId(@Param("expedienteId") String expedienteId);
}
