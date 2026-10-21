package com.syborx.brevemente.cita.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Día no laborable: festivo oficial (terapeutaId null) o día personal de un terapeuta.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaNoLaborable {

    private String id;
    private LocalDate fecha;
    private String nombre;
    private String tipo;        // oficial | personal
    private String terapeutaId; // null para festivos oficiales
}
