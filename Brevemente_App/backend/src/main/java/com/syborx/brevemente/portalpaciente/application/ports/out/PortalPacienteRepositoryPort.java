package com.syborx.brevemente.portalpaciente.application.ports.out;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.ContraReferencia;
import com.syborx.brevemente.portalpaciente.domain.model.PortalPerfil;
import com.syborx.brevemente.portalpaciente.domain.model.SesionPortal;

import java.util.List;
import java.util.Optional;

public interface PortalPacienteRepositoryPort {
    Optional<PortalPerfil> findPerfil(String pacienteId);
    List<SesionPortal> findSesionesPorPaciente(String pacienteId);
    List<AlertaPaciente> findAlertasPorPaciente(String pacienteId);
    Optional<ContraReferencia> findContraReferenciaAprobada(String pacienteId);
    AlertaPaciente saveAlerta(AlertaPaciente alerta);
}
