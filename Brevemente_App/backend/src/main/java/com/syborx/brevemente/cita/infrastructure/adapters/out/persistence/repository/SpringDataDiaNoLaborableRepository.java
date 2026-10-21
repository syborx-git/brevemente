package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.DiaNoLaborableJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface SpringDataDiaNoLaborableRepository extends JpaRepository<DiaNoLaborableJpaEntity, String> {

    @Query(value = """
            SELECT COUNT(*) > 0 FROM dias_no_laborables d
            WHERE d.fecha = :fecha
              AND (d.tipo = 'oficial'
                   OR (d.tipo = 'personal' AND d.terapeuta_id = :terapeutaId))
            """, nativeQuery = true)
    boolean existeDiaNoLaborable(@Param("fecha") LocalDate fecha, @Param("terapeutaId") String terapeutaId);
}
