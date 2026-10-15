package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaSedeId;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaSedeJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataTerapeutaSedeRepository
        extends JpaRepository<TerapeutaSedeJpaEntity, TerapeutaSedeId> {

    /**
     * Sedes activas del terapeuta, con la principal primero.
     */
    @Query("""
            select ts from TerapeutaSedeJpaEntity ts
            where ts.terapeutaId = :terapeutaId and ts.activo = true
            order by ts.esPrincipal desc
            """)
    List<TerapeutaSedeJpaEntity> findActivasByTerapeutaId(@Param("terapeutaId") String terapeutaId);

    void deleteByTerapeutaId(@Param("terapeutaId") String terapeutaId);
}
