package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest;

import com.syborx.brevemente.plataforma.application.ports.in.PlataformaDashboardUseCase;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ActividadRecienteDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.AlertasAdministrativasDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ClaveIndicadorClinico;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.DesgloseIndicadorDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.IndicadorClinicoDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ResumenPlataformaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.SaludPlataformaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN_DASHBOARD_LEER')")
public class AdminDashboardRestController {

    private final PlataformaDashboardUseCase plataformaDashboardUseCase;

    @GetMapping("/resumen")
    public ResumenPlataformaDTO resumen() {
        return plataformaDashboardUseCase.obtenerResumen();
    }

    @GetMapping("/indicadores-clinicos")
    public List<IndicadorClinicoDTO> indicadoresClinicos() {
        return plataformaDashboardUseCase.obtenerIndicadoresClinicos();
    }

    @GetMapping("/indicadores-clinicos/{clave}/desglose")
    public List<DesgloseIndicadorDTO> desglose(@PathVariable String clave) {
        ClaveIndicadorClinico c = ClaveIndicadorClinico.fromValor(clave);
        if (c == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clave de indicador inválida: " + clave);
        }
        return plataformaDashboardUseCase.obtenerDesgloseIndicador(c);
    }

    @GetMapping("/actividad-reciente")
    public ActividadRecienteDTO actividadReciente(@RequestParam(defaultValue = "10") int limit) {
        int clamped = Math.max(1, Math.min(limit, 20));
        return plataformaDashboardUseCase.obtenerActividadReciente(clamped);
    }

    @GetMapping("/alertas-administrativas")
    public AlertasAdministrativasDTO alertasAdministrativas() {
        return plataformaDashboardUseCase.obtenerAlertasAdministrativas();
    }

    @GetMapping("/salud-plataforma")
    public SaludPlataformaDTO saludPlataforma() {
        return plataformaDashboardUseCase.obtenerSaludPlataforma();
    }
}
