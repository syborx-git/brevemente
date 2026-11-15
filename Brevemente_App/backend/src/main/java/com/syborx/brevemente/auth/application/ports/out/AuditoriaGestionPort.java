package com.syborx.brevemente.auth.application.ports.out;

import java.util.Map;

/**
 * Auditoría append-only de gestión (`auditoria_gestion`): alta/edición de
 * usuarios, cambio de estado, reset de contraseña, revocaciones, etc.
 */
public interface AuditoriaGestionPort {

    void registrar(String actorId, String accion, String entidad, String entidadId, Map<String, Object> detalle);
}
