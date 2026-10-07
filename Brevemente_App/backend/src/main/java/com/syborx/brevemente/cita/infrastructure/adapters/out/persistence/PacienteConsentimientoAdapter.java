package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.cita.application.ports.out.PacienteConsentimientoPort;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Resuelve la regla "Bloqueada por Normativa" reutilizando el puerto de
 * persistencia del módulo `paciente` (frontera hexagonal).
 */
@Component
@RequiredArgsConstructor
public class PacienteConsentimientoAdapter implements PacienteConsentimientoPort {

    private final PacienteRepositoryPort pacienteRepositoryPort;

    @Override
    public boolean estaBloqueadoPorNormativa(String pacienteId) {
        if (pacienteId == null) {
            return false;
        }
        return pacienteRepositoryPort.findById(pacienteId)
                .map(PacienteConsentimientoAdapter::esBloqueado)
                .orElse(false);
    }

    private static boolean esBloqueado(Paciente paciente) {
        boolean representado = paciente.getCapacidadConsentimiento() != null
                && "REPRESENTADO_POR_EDAD".equals(paciente.getCapacidadConsentimiento().estado());
        return representado && !Boolean.TRUE.equals(paciente.getConsentimientoRepresentanteFirmado());
    }
}
