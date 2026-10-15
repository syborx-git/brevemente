package com.syborx.brevemente.auditoria.application.ports.in;

import com.syborx.brevemente.auditoria.domain.model.AuditoriaConfiguracion;

import java.util.List;

public interface ListarAuditoriaConfiguracionUseCase {

    List<AuditoriaConfiguracion> listarPorTerapeuta(String terapeutaId);
}
