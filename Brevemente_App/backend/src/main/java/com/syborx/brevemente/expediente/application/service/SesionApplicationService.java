package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.in.ActualizarSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.AgregarSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarSesionesUseCase;
import com.syborx.brevemente.expediente.application.ports.out.CitaEstadoPort;
import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.expediente.domain.exception.SesionNotFoundException;
import com.syborx.brevemente.expediente.domain.exception.SesionPorCitaExistenteException;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service("expedienteSesionApplicationService")
@RequiredArgsConstructor
public class SesionApplicationService implements ListarSesionesUseCase, AgregarSesionUseCase, ActualizarSesionUseCase {

    private final AuditoriaExpedientePort auditoriaExpedientePort;
    private final ExpedienteRepositoryPort expedienteRepositoryPort;
    private final SesionRepositoryPort sesionRepositoryPort;
    private final CitaEstadoPort citaEstadoPort;

    @Override
    @Transactional(readOnly = true)
    public List<Sesion> listarPorPaciente(String pacienteId) {
        String expedienteId = resolverExpediente(pacienteId);
        return sesionRepositoryPort.findByExpedienteId(expedienteId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Sesion> listarBorradores(List<String> terapeutaIds) {
        return sesionRepositoryPort.findBorradoresPorTerapeuta(terapeutaIds);
    }

    @Override
    @Transactional
    public Sesion agregar(String pacienteId, Sesion sesion, String usuarioId, List<String> terapeutaIds) {
        String expedienteId = resolverExpediente(pacienteId);

        int numero;
        if (sesion.getNumero() == null) {
            numero = sesionRepositoryPort.ultimoNumero(expedienteId).orElse(0) + 1;
        } else if (sesion.getNumero() < 1) {
            throw new SesionInvalidaException("El número de sesión debe ser mayor o igual a 1.");
        } else {
            numero = sesion.getNumero();
        }

        sesion.setExpedienteId(expedienteId);
        sesion.setPacienteId(pacienteId);
        sesion.setNumero(numero);
        if (sesion.getId() == null || sesion.getId().isBlank()) {
            sesion.setId("ses-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (sesion.getStatus() == null || sesion.getStatus().isBlank()) {
            sesion.setStatus("borrador");
        }
        if (sesion.getPx() == null) {
            sesion.setPx(List.of());
        }
        if (sesion.getCreadoPorId() == null && terapeutaIds != null && !terapeutaIds.isEmpty()) {
            sesion.setCreadoPorId(terapeutaIds.get(0));
        }

        // Integridad "1 sesión por cita": rechazar una segunda sesión para la misma cita.
        if (sesion.getCitaId() != null && !sesion.getCitaId().isBlank()) {
            sesionRepositoryPort.findByCitaId(sesion.getCitaId()).ifPresent(existente -> {
                throw new SesionPorCitaExistenteException(
                        "Ya existe una sesión para la cita " + sesion.getCitaId() + ".");
            });
        }

        Sesion saved = sesionRepositoryPort.save(sesion);
        // El mapeo de persistencia no conserva pacienteId (la tabla expone expediente_id),
        // por lo que se usa el parámetro de entrada para la traza de auditoría.
        auditoriaExpedientePort.registrar(
                pacienteId, usuarioId,
                "Registro de sesión TBE",
                "Se registró la Sesión " + saved.getNumero() + " del expediente.", "sesion");
        return saved;
    }

    @Override
    @Transactional
    public Sesion actualizar(String sesionId, Sesion datosParciales, String usuarioId) {
        Sesion target = sesionRepositoryPort.findById(sesionId)
                .orElseThrow(() -> new SesionNotFoundException("No existe la sesión " + sesionId));

        if (datosParciales.getStatus() != null
                && !List.of("borrador", "validado").contains(datosParciales.getStatus())) {
            throw new SesionInvalidaException("El estado debe ser 'borrador' o 'validado'.");
        }

        boolean estabaValidada = "validado".equals(target.getStatus());

        // Fusión PATCH: solo campos no nulos presentes en el request.
        if (datosParciales.getFase() != null) target.setFase(datosParciales.getFase());
        if (datosParciales.getSignificado() != null) target.setSignificado(datosParciales.getSignificado());
        if (datosParciales.getDxOperativo() != null) target.setDxOperativo(datosParciales.getDxOperativo());
        if (datosParciales.getSpr() != null) target.setSpr(datosParciales.getSpr());
        if (datosParciales.getTrastorno() != null) target.setTrastorno(datosParciales.getTrastorno());
        if (datosParciales.getPx() != null) target.setPx(datosParciales.getPx());
        if (datosParciales.getOss() != null) target.setOss(datosParciales.getOss());
        if (datosParciales.getAdherencia() != null) target.setAdherencia(datosParciales.getAdherencia());
        if (datosParciales.getRss() != null) target.setRss(datosParciales.getRss());
        if (datosParciales.getStatus() != null) target.setStatus(datosParciales.getStatus());

        Sesion saved = sesionRepositoryPort.save(target);

        // Cierre automático: validar la sesión completa la cita vinculada (D-5/D-14).
        // Pre-guard de idempotencia: no reintentar si ya estaba validada o la cita ya completó.
        if ("validado".equals(saved.getStatus()) && saved.getCitaId() != null
                && !estabaValidada
                && !citaEstadoPort.estaCompletada(saved.getCitaId())) {
            citaEstadoPort.marcarCompletada(saved.getCitaId());
        }

        auditoriaExpedientePort.registrar(
                saved.getPacienteId() != null ? saved.getPacienteId() : target.getPacienteId(),
                usuarioId,
                "Edición de sesión TBE",
                "Se editó la Sesión " + saved.getNumero() + " del expediente.", "sesion");
        return saved;
    }

    private String resolverExpediente(String pacienteId) {
        return expedienteRepositoryPort.findByPacienteId(pacienteId)
                .map(Expediente::getId)
                .orElseThrow(() -> new ExpedienteNotFoundException(pacienteId));
    }
}
