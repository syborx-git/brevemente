package com.syborx.brevemente.paciente.domain.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * Configuración del terapeuta para el módulo "Mi Consulta".
 * Combina la identidad (proveniente de `usuarios`) con el perfil
 * y los parámetros de consulta (provenientes de `terapeutas`).
 */
public record TerapeutaConfig(
        String id,
        String nombre,
        String email,
        String cedulaProfesional,
        String especialidad,
        String telefono,
        Integer duracionSesionDefaultMin,
        BigDecimal costoPrimeraSesion,
        BigDecimal costoSeguimiento,
        Integer edadMinimaAtencion,
        List<TerapeutaSede> sedes
) {}
