package com.syborx.brevemente.cita.application.ports.out;

import java.util.List;

/**
 * Abstrae la lectura de la identidad autenticada (claims `terapeutaIds`/`pacienteId`
 * expuestos en el SecurityContext) sin acoplar el módulo `cita` a Spring Security.
 */
public interface IdentidadAutenticadaPort {
    List<String> terapeutaIds();
    String pacienteId();
    boolean esAdminPlataforma();

    /** Indica si el principal puede ver la agenda completa (AGENDA_LEER/AGENDA_GESTIONAR), frente al patient. */
    boolean puedeVerAgendaCompleta();
}
