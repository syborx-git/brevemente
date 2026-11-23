package com.syborx.brevemente.expediente.infrastructure.adapters.out.cita;

import com.syborx.brevemente.cita.application.ports.in.ActualizarEstadoCitaUseCase;
import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.CitaEstadoPort;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * Adaptador de {@link CitaEstadoPort} que delega en el caso de uso de cambio de
 * estado y en el repositorio del contexto {@code cita}.
 */
@Component
public class CitaEstadoAdapter implements CitaEstadoPort {

    private final ActualizarEstadoCitaUseCase actualizarEstadoCitaUseCase;
    private final CitaRepositoryPort citaRepositoryPort;

    public CitaEstadoAdapter(
            @Lazy ActualizarEstadoCitaUseCase actualizarEstadoCitaUseCase,
            CitaRepositoryPort citaRepositoryPort) {
        this.actualizarEstadoCitaUseCase = actualizarEstadoCitaUseCase;
        this.citaRepositoryPort = citaRepositoryPort;
    }

    @Override
    public boolean estaCompletada(String citaId) {
        return citaRepositoryPort.findById(citaId)
                .map(c -> "completada".equals(c.getEstadoCita()))
                .orElse(false);
    }

    @Override
    public void marcarCompletada(String citaId) {
        actualizarEstadoCitaUseCase.actualizarEstado(citaId, "completada", null, null);
    }
}
