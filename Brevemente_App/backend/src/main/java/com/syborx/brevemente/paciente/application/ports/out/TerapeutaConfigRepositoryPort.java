package com.syborx.brevemente.paciente.application.ports.out;

import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfigDatos;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSede;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSedeDatos;

import java.util.List;
import java.util.Optional;

public interface TerapeutaConfigRepositoryPort {

    Optional<TerapeutaConfig> findById(String terapeutaId);

    TerapeutaConfig update(String terapeutaId, TerapeutaConfigDatos datos);

    List<TerapeutaSede> updateSedes(String terapeutaId, List<TerapeutaSedeDatos> sedes);
}
