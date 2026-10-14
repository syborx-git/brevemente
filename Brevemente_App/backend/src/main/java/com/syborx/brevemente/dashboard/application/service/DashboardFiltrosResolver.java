package com.syborx.brevemente.dashboard.application.service;

import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard.TipoAlcance;
import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;

import java.util.Collection;
import java.util.List;

/**
 * Resolución pura de filtros + scope (SDD-004/005). No accede a Spring Security:
 * recibe el {@link AlcanceDashboard} ya resuelto y los {@link DashboardFiltros}
 * normalizados, y devuelve los IDs de terapeuta efectivos.
 */
public final class DashboardFiltrosResolver {

    private DashboardFiltrosResolver() {
    }

    /**
     * Combina el scope por rol con el filtro opcional {@code terapeutaId}.
     *
     * <p>Convención heredada de {@code DashboardApplicationService}:
     * {@code null} = sin filtro por terapeuta (global); lista vacía = sin resultados
     * (scope restringido a nadie o terapeuta fuera del scope).
     */
    public static Collection<String> terapeutaIdsEfectivos(AlcanceDashboard alcance, DashboardFiltros filtros) {
        if (alcance.tipo() == TipoAlcance.GLOBAL) {
            return filtros != null && filtros.terapeutaId() != null
                    ? List.of(filtros.terapeutaId())
                    : null;
        }

        List<String> base = alcance.terapeutaIds();
        if (filtros == null || filtros.terapeutaId() == null) {
            return base;
        }
        return base.contains(filtros.terapeutaId())
                ? List.of(filtros.terapeutaId())
                : List.of();
    }

    /**
     * Indica si la combinación scope+filtro produce necesariamente un resultado vacío.
     */
    public static boolean sinResultados(AlcanceDashboard alcance, Collection<String> ids) {
        return alcance.tipo() == TipoAlcance.SCOPED && ids != null && ids.isEmpty();
    }
}
