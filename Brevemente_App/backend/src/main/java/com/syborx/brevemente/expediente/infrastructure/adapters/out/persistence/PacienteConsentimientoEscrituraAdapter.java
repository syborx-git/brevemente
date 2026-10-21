package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.expediente.application.ports.out.FirmaResultado;
import com.syborx.brevemente.expediente.application.ports.out.PacienteConsentimientoEscrituraPort;
import com.syborx.brevemente.expediente.domain.exception.ConsentimientoYaFirmadoException;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.CapacidadConsentimiento;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PacienteConsentimientoEscrituraAdapter implements PacienteConsentimientoEscrituraPort {

    private final PacienteRepositoryPort pacienteRepositoryPort;

    @Override
    public FirmaResultado firmar(String pacienteId, LocalDate fechaDeterminacion) {
        Paciente paciente = pacienteRepositoryPort.findById(pacienteId)
                .orElseThrow(() -> new ExpedienteNotFoundException(pacienteId));

        if (Boolean.TRUE.equals(paciente.getConsentimientoRepresentanteFirmado())) {
            throw new ConsentimientoYaFirmadoException(pacienteId);
        }

        String estado = paciente.getCapacidadConsentimiento() != null
                ? paciente.getCapacidadConsentimiento().estado()
                : "AUTONOMO";

        boolean representado = "REPRESENTADO_POR_EDAD".equals(estado)
                || "REPRESENTADO_POR_CONDICION".equals(estado);

        String firmadoPor = (paciente.getRepresentante() != null
                && paciente.getRepresentante().nombreCompleto() != null
                && !paciente.getRepresentante().nombreCompleto().isBlank())
                ? paciente.getRepresentante().nombreCompleto()
                : paciente.getNombreCompleto();

        String calidadFirmante = representado ? "PERSONA_DE_APOYO" : "TITULAR";
        String tipoConsentimiento = "REPRESENTADO_POR_EDAD".equals(estado)
                ? "TRATAMIENTO_MENOR"
                : "TRATAMIENTO_TITULAR";

        CapacidadConsentimiento cc = paciente.getCapacidadConsentimiento();
        CapacidadConsentimiento nuevaCapacidad = new CapacidadConsentimiento(
                cc != null ? cc.estado() : estado,
                cc != null ? cc.determinadoPor() : null,
                fechaDeterminacion,
                cc != null ? cc.fechaRevision() : null,
                cc != null ? cc.motivo() : null
        );

        paciente.setCapacidadConsentimiento(nuevaCapacidad);
        paciente.setConsentimientoRepresentanteFirmado(true);
        pacienteRepositoryPort.save(paciente);

        return new FirmaResultado(firmadoPor, calidadFirmante, tipoConsentimiento);
    }
}
