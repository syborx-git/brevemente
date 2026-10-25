package com.syborx.brevemente.portalpaciente.domain.model;

/**
 * Perfil propio del paciente autenticado para el encabezado del portal.
 */
public record PortalPerfil(
        String id,
        String name,
        String therapistName,
        String motif
) {}
