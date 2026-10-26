package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionCriterioClinicoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataSesionCriterioClinicoRepository extends JpaRepository<SesionCriterioClinicoJpaEntity, String> {
    List<SesionCriterioClinicoJpaEntity> findBySesionIdOrderByCategoriaAsc(String sesionId);

    /**
     * Borrado en bloque (JPQL) para que el DELETE se ejecute de inmediato dentro
     * de la transacción, antes del saveAll del reemplazo (PUT), evitando la
     * violación de ux_sesion_criterio (UNIQUE sesion_id + categoria).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM SesionCriterioClinicoJpaEntity c WHERE c.sesionId = :sesionId")
    void deleteBySesionId(@Param("sesionId") String sesionId);
}
