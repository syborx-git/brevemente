package com.syborx.brevemente.repository;

import com.syborx.brevemente.domain.model.TerapeutaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TerapeutaRepository extends JpaRepository<TerapeutaEntity, String> {
    Optional<TerapeutaEntity> findByEmail(String email);
}
