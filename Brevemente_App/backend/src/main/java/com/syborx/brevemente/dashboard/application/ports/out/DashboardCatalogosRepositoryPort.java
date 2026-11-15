package com.syborx.brevemente.dashboard.application.ports.out;

import com.syborx.brevemente.dashboard.domain.model.CatalogosDashboard;
import com.syborx.brevemente.dashboard.domain.model.Sede;

import java.util.Optional;

/**
 * Puerto de salida de catálogos de apoyo del Centro de Control (sedes V11,
 * protocolos V12, terapeutas y modalidades) más las resoluciones puntuales de
 * nombre por ID usadas por la acción dominante.
 */
public interface DashboardCatalogosRepositoryPort {

    CatalogosDashboard obtenerCatalogos();

    Optional<Sede> findSedeById(String sedeId);

    Optional<String> findTerapeutaNombre(String terapeutaId);

    Optional<String> findProtocoloNombre(String protocoloId);
}
