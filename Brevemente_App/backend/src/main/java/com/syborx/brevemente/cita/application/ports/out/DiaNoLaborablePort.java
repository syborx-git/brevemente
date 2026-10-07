package com.syborx.brevemente.cita.application.ports.out;

import com.syborx.brevemente.cita.domain.model.DiaNoLaborable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DiaNoLaborablePort {
    List<DiaNoLaborable> findAll();
    Optional<DiaNoLaborable> findById(String id);
    boolean existeDiaNoLaborable(LocalDate fecha, String terapeutaId);
    DiaNoLaborable save(DiaNoLaborable dia);
    void deleteById(String id);
}
