package com.syborx.brevemente.portalpaciente.application.service;

import com.syborx.brevemente.cita.application.ports.in.ListarCitasUseCase;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.portalpaciente.application.ports.in.EscalarCrisisUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ListarAlertasPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ListarCitasPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ListarSesionesPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ObtenerContraReferenciaPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ObtenerPerfilPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.out.IdentidadPortalPort;
import com.syborx.brevemente.portalpaciente.application.ports.out.PortalPacienteRepositoryPort;
import com.syborx.brevemente.portalpaciente.domain.exception.PacienteSinVinculoException;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.ContraReferencia;
import com.syborx.brevemente.portalpaciente.domain.model.PortalPerfil;
import com.syborx.brevemente.portalpaciente.domain.model.SesionPortal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio orquestador del portal del paciente. Todos los casos de uso son
 * patient-scoped: el {@code pacienteId} se resuelve SIEMPRE desde el claim
 * (nunca de path/query) y se deniega si no hay vínculo (anti-IDOR).
 */
@Service
@RequiredArgsConstructor
public class PacientePortalApplicationService implements
        ObtenerPerfilPortalUseCase,
        ListarCitasPortalUseCase,
        ListarSesionesPortalUseCase,
        EscalarCrisisUseCase,
        ListarAlertasPortalUseCase,
        ObtenerContraReferenciaPortalUseCase {

    private final PortalPacienteRepositoryPort repositoryPort;
    private final IdentidadPortalPort identidadPortalPort;
    private final ListarCitasUseCase listarCitasUseCase;

    @Override
    @Transactional(readOnly = true)
    public PortalPerfil obtenerPerfil() {
        String pacienteId = resolverPacienteId();
        return repositoryPort.findPerfil(pacienteId)
                .orElseThrow(() -> new PacienteSinVinculoException(
                        "No se encontró el perfil del paciente autenticado."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cita> listarCitas() {
        String pacienteId = resolverPacienteId();
        return listarCitasUseCase.listar(
                new CitaFiltro(null, pacienteId, null, null, null, null, null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SesionPortal> listarSesiones() {
        String pacienteId = resolverPacienteId();
        return repositoryPort.findSesionesPorPaciente(pacienteId);
    }

    @Override
    @Transactional
    public AlertaPaciente escalar(String mensaje) {
        String pacienteId = resolverPacienteId();
        String texto = (mensaje == null || mensaje.isBlank())
                ? "ALERTA ROJA: El paciente activó el Botón de Crisis de emergencia desde su portal."
                : mensaje;
        AlertaPaciente alerta = AlertaPaciente.builder()
                .id("alerta-" + UUID.randomUUID().toString().substring(0, 8))
                .pacienteId(pacienteId)
                .tipo("crisis")
                .estado("activa")
                .mensaje(texto)
                .createdAt(OffsetDateTime.now())
                .build();
        return repositoryPort.saveAlerta(alerta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertaPaciente> listarAlertas() {
        String pacienteId = resolverPacienteId();
        return repositoryPort.findAlertasPorPaciente(pacienteId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ContraReferencia> obtenerContraReferencia() {
        String pacienteId = resolverPacienteId();
        return repositoryPort.findContraReferenciaAprobada(pacienteId);
    }

    private String resolverPacienteId() {
        String pacienteId = identidadPortalPort.pacienteId();
        if (pacienteId == null || pacienteId.isBlank()) {
            throw new PacienteSinVinculoException(
                    "El paciente autenticado no tiene un expediente vinculado.");
        }
        return pacienteId;
    }
}
