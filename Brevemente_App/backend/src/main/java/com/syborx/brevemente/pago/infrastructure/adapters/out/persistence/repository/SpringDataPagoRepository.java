package com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.entity.PagoJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataPagoRepository extends JpaRepository<PagoJpaEntity, String> {
    List<PagoJpaEntity> findByPacienteIdOrderByFechaDesc(String pacienteId);
}
