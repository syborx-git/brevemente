package com.syborx.brevemente.dashboard.domain.model;

import java.util.List;

/**
 * Ámbito de datos del dashboard resuelto por rol (SDD-004).
 * <p>
 * GLOBAL: métricas de toda la plataforma ({@code terapeutaIds} vacío).
 * SCOPED: métricas restringidas a los terapeutas indicados.
 */
public record AlcanceDashboard(
        TipoAlcance tipo,
        List<String> terapeutaIds,
        boolean puedeVerAlertasClinicas
) {

    public enum TipoAlcance {
        GLOBAL, SCOPED
    }

    public AlcanceDashboard {
        terapeutaIds = terapeutaIds == null ? List.of() : List.copyOf(terapeutaIds);
    }
}
