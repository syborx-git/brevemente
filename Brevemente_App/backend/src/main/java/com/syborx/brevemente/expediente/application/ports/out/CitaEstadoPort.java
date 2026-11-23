package com.syborx.brevemente.expediente.application.ports.out;

/**
 * Puerto de salida para consultar y completar el estado de la cita vinculada
 * a una sesión, sin acoplar el contexto {@code expediente} al dominio de {@code cita}.
 */
public interface CitaEstadoPort {
    boolean estaCompletada(String citaId);
    void marcarCompletada(String citaId);
}
