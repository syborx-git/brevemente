package com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.entity.ConstanciaFisicaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataConstanciaRepository extends JpaRepository<ConstanciaFisicaJpaEntity, String> {
    List<ConstanciaFisicaJpaEntity> findByPacienteIdOrderByFechaExpedicionDesc(String pacienteId);
}
