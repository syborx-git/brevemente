package com.syborx.brevemente.plataforma.application.ports.in;

import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ActividadRecienteDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.AlertasAdministrativasDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ClaveIndicadorClinico;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.DesgloseIndicadorDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.IndicadorClinicoDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ResumenPlataformaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.SaludPlataformaDTO;

import java.util.List;

/** Casos de uso del dashboard de plataforma (Módulo 1). */
public interface PlataformaDashboardUseCase {

    ResumenPlataformaDTO obtenerResumen();

    List<IndicadorClinicoDTO> obtenerIndicadoresClinicos();

    List<DesgloseIndicadorDTO> obtenerDesgloseIndicador(ClaveIndicadorClinico clave);

    ActividadRecienteDTO obtenerActividadReciente(int limit);

    AlertasAdministrativasDTO obtenerAlertasAdministrativas();

    SaludPlataformaDTO obtenerSaludPlataforma();
}
