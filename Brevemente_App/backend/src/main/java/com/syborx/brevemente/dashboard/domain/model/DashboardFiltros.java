package com.syborx.brevemente.dashboard.domain.model;

/**
 * Filtros opcionales de los endpoints del Centro de Control (todos query params).
 * Los valores en blanco se normalizan a {@code null}.
 */
public record DashboardFiltros(
        String modalidad,
        String sedeId,
        String periodo,
        String terapeutaId,
        String protocoloId
) {

    public DashboardFiltros {
        modalidad = normalizar(modalidad);
        sedeId = normalizar(sedeId);
        periodo = normalizar(periodo);
        terapeutaId = normalizar(terapeutaId);
        protocoloId = normalizar(protocoloId);
    }

    public static DashboardFiltros of(String modalidad, String sedeId, String periodo,
                                      String terapeutaId, String protocoloId) {
        return new DashboardFiltros(modalidad, sedeId, periodo, terapeutaId, protocoloId);
    }

    private static String normalizar(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }
}
