package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.out.ConsentimientoRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.FirmaResultado;
import com.syborx.brevemente.expediente.application.ports.out.PacienteConsentimientoEscrituraPort;
import com.syborx.brevemente.expediente.domain.model.Consentimiento;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsentimientoApplicationServiceTest {

    @Mock
    private PacienteConsentimientoEscrituraPort pacienteConsentimientoEscrituraPort;

    @Mock
    private ConsentimientoRepositoryPort consentimientoRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    private ConsentimientoApplicationService service;

    @BeforeEach
    void setUp() {
        service = new ConsentimientoApplicationService(
                auditoriaExpedientePort,
                pacienteConsentimientoEscrituraPort,
                consentimientoRepositoryPort);
    }

    @Test
    @DisplayName("Firmar consentimiento persiste el documento y registra auditoría")
    void firmarPersisteYAudita() {
        when(pacienteConsentimientoEscrituraPort.firmar(eq("pac-001"), any(LocalDate.class)))
                .thenReturn(new FirmaResultado("Claudia Santos", "MADRE", "CONSENTIMIENTO_REPRESENTANTE"));
        when(consentimientoRepositoryPort.save(any(Consentimiento.class))).thenAnswer(inv -> inv.getArgument(0));

        service.firmar("pac-001", "usr-001");

        verify(pacienteConsentimientoEscrituraPort).firmar(eq("pac-001"), any(LocalDate.class));
        verify(consentimientoRepositoryPort).save(any(Consentimiento.class));
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Firma de consentimiento informado"),
                anyString(), eq("expediente"));
    }
}
