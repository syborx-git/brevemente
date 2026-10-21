package com.syborx.brevemente.dashboard.domain.model;

import java.util.List;

/**
 * Catálogos de apoyo del Centro de Control: sedes, protocolos, terapeutas y
 * modalidades canónicas ({@code PRESENCIAL}/{@code ONLINE}).
 */
public record CatalogosDashboard(
        List<Sede> sedes,
        List<Protocolo> protocolos,
        List<Terapeuta> terapeutas,
        List<String> modalidades
) {}
