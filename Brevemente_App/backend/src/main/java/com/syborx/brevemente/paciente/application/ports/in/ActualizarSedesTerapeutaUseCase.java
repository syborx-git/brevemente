package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.TerapeutaSede;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSedeDatos;

import java.util.List;

public interface ActualizarSedesTerapeutaUseCase {

    /**
     * Reemplaza las sedes de atención del terapeuta. Solo el propio
     * terapeuta (o un administrador) puede editar.
     */
    List<TerapeutaSede> actualizarSedes(String terapeutaIdExplicito, List<TerapeutaSedeDatos> sedes);
}
