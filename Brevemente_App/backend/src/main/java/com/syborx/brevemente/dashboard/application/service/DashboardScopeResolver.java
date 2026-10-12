package com.syborx.brevemente.dashboard.application.service;

import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.dashboard.application.ports.out.SupervisionAsignacionRepositoryPort;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard.TipoAlcance;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Resuelve el {@link AlcanceDashboard} a partir de los roles del principal
 * (autoridades {@code ROLE_*}) y de la relación supervisor → terapeuta.
 *
 * <p>No lee {@code SecurityContextHolder} directamente (ADR-001): accede a la
 * identidad a través de {@link IdentidadAutenticadaPort}.
 */
@Component
@RequiredArgsConstructor
public class DashboardScopeResolver {

    private final IdentidadAutenticadaPort identidadAutenticadaPort;
    private final SupervisionAsignacionRepositoryPort supervisionAsignacionRepositoryPort;

    public AlcanceDashboard resolver() {
        boolean admin = identidadAutenticadaPort.tieneRol("admin_platform")
                || identidadAutenticadaPort.tieneRol("admin_clinical");
        boolean puedeVerAlertasClinicas = identidadAutenticadaPort.tieneRol("therapist")
                || identidadAutenticadaPort.tieneRol("supervisor")
                || identidadAutenticadaPort.tieneRol("admin_platform")
                || identidadAutenticadaPort.tieneRol("admin_clinical");

        if (admin) {
            return new AlcanceDashboard(TipoAlcance.GLOBAL, List.of(), puedeVerAlertasClinicas);
        }

        Set<String> ids = new LinkedHashSet<>();
        if (identidadAutenticadaPort.tieneRol("therapist") || identidadAutenticadaPort.tieneRol("assistant")) {
            List<String> propios = identidadAutenticadaPort.terapeutaIds();
            if (propios != null) {
                ids.addAll(propios);
            }
        }
        if (identidadAutenticadaPort.tieneRol("supervisor")) {
            String sub = identidadAutenticadaPort.sub();
            if (sub != null && !sub.isBlank()) {
                List<String> supervisados = supervisionAsignacionRepositoryPort.findTerapeutasSupervisados(sub);
                if (supervisados != null) {
                    ids.addAll(supervisados);
                }
            }
        }

        return new AlcanceDashboard(TipoAlcance.SCOPED, List.copyOf(ids), puedeVerAlertasClinicas);
    }
}
