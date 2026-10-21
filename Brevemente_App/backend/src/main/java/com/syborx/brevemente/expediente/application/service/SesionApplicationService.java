package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.in.AgregarSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarSesionesUseCase;
import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service("expedienteSesionApplicationService")
@RequiredArgsConstructor
public class SesionApplicationService implements ListarSesionesUseCase, AgregarSesionUseCase {

    private final AuditoriaExpedientePort auditoriaExpedientePort;
    private final ExpedienteRepositoryPort expedienteRepositoryPort;
    private final SesionRepositoryPort sesionRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<Sesion> listarPorPaciente(String pacienteId) {
        String expedienteId = resolverExpediente(pacienteId);
        return sesionRepositoryPort.findByExpedienteId(expedienteId);
    }

    @Override
    @Transactional
    public Sesion agregar(String pacienteId, Sesion sesion, String usuarioId) {
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

        Sesion saved = sesionRepositoryPort.save(sesion);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), usuarioId,
                "Registro de sesión TBE",
                "Se registró la Sesión " + saved.getNumero() + " del expediente.", "sesion");
        return saved;
    }

    private String resolverExpediente(String pacienteId) {
        return expedienteRepositoryPort.findByPacienteId(pacienteId)
                .map(Expediente::getId)
                .orElseThrow(() -> new ExpedienteNotFoundException(pacienteId));
    }
}
