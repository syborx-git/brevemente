package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Clave compuesta de la tabla {@code terapeuta_sedes} (V14).
 */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TerapeutaSedeId implements Serializable {

    private String terapeutaId;
    private String sedeId;
}
