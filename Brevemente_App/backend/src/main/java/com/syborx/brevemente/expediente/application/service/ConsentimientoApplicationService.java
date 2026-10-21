package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.in.FirmarConsentimientoUseCase;
import com.syborx.brevemente.expediente.application.ports.out.ConsentimientoRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.FirmaResultado;
import com.syborx.brevemente.expediente.application.ports.out.PacienteConsentimientoEscrituraPort;
import com.syborx.brevemente.expediente.domain.model.Consentimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsentimientoApplicationService implements FirmarConsentimientoUseCase {

    private final AuditoriaExpedientePort auditoriaExpedientePort;
    private final PacienteConsentimientoEscrituraPort pacienteConsentimientoEscrituraPort;
    private final ConsentimientoRepositoryPort consentimientoRepositoryPort;

    @Override
    @Transactional
    public void firmar(String pacienteId, String usuarioId) {
        LocalDate fechaDeterminacion = LocalDate.now();
        FirmaResultado resultado = pacienteConsentimientoEscrituraPort.firmar(pacienteId, fechaDeterminacion);

        Consentimiento consentimiento = Consentimiento.builder()
                .id("con-" + UUID.randomUUID().toString().substring(0, 8))
                .pacienteId(pacienteId)
                .tipoConsentimiento(resultado.tipoConsentimiento())
                .firmadoPor(resultado.firmadoPor())
                .calidadFirmante(resultado.calidadFirmante())
                .fechaFirma(OffsetDateTime.now())
                .revocado(false)
                .build();

        consentimientoRepositoryPort.save(consentimiento);

        auditoriaExpedientePort.registrar(
                pacienteId, usuarioId,
                "Firma de consentimiento informado",
                "Se formalizó la firma del consentimiento informado del representante.", "expediente");
    }
}
