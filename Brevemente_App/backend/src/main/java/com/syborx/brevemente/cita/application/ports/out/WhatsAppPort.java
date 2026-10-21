package com.syborx.brevemente.cita.application.ports.out;

/**
 * Puerto de salida para notificar/contactar por WhatsApp.
 * En la fase actual (Nivel A) el contacto es un enlace `wa.me` generado en el
 * frontend; este puerto queda definido para enchufar Cloud API (Nivel B) después.
 */
public interface WhatsAppPort {
    void contactar(String pacienteTelefono, String mensaje);
}
