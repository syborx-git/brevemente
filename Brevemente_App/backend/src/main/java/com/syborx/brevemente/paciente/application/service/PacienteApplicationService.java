package com.syborx.brevemente.paciente.application.service;

import com.syborx.brevemente.paciente.application.ports.in.*;
import com.syborx.brevemente.paciente.application.ports.out.IdentidadTerapeutaPort;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.exception.PacienteConflictException;
import com.syborx.brevemente.paciente.domain.exception.PacienteNotFoundException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaVinculoException;
import com.syborx.brevemente.paciente.domain.model.CapacidadConsentimiento;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PacienteApplicationService implements 
        ListarPacientesUseCase,
        ObtenerPacienteUseCase,
        CrearPacienteUseCase,
        ActualizarPacienteUseCase {

    private final PacienteRepositoryPort pacienteRepositoryPort;
    private final IdentidadTerapeutaPort identidadTerapeutaPort;

    @Override
    @Transactional(readOnly = true)
    public List<Paciente> listarTodos() {
        return pacienteRepositoryPort.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Paciente obtenerPorId(String id) {
        return pacienteRepositoryPort.findById(id)
                .orElseThrow(() -> new PacienteNotFoundException(id));
    }

    @Override
    @Transactional
    public Paciente crear(Paciente nuevoPaciente) {
        if (nuevoPaciente.getCurp() != null && !nuevoPaciente.getCurp().isBlank()) {
            if (pacienteRepositoryPort.existsByCurp(nuevoPaciente.getCurp())) {
                throw new PacienteConflictException("Ya existe un paciente con el CURP: " + nuevoPaciente.getCurp());
            }
        }

        if (nuevoPaciente.getRfc() != null && !nuevoPaciente.getRfc().isBlank()) {
            if (pacienteRepositoryPort.existsByRfc(nuevoPaciente.getRfc())) {
                throw new PacienteConflictException("Ya existe un paciente con el RFC: " + nuevoPaciente.getRfc());
            }
        }

        resolverTerapeuta(nuevoPaciente);

        // Generación de ID de dominio si no viene provisto
        if (nuevoPaciente.getId() == null || nuevoPaciente.getId().isBlank()) {
            nuevoPaciente.setId("pac-" + UUID.randomUUID().toString().substring(0, 8));
        }

        // Cálculo de edad si no está provista
        if (nuevoPaciente.getEdadCalculada() == null && nuevoPaciente.getFechaNacimiento() != null) {
            nuevoPaciente.setEdadCalculada(Period.between(nuevoPaciente.getFechaNacimiento(), LocalDate.now()).getYears());
        }

        // Regla clínica de minoría de edad y consentimiento
        boolean esMenor = nuevoPaciente.esMenorDeEdad();
        if (nuevoPaciente.getCapacidadConsentimiento() == null) {
            nuevoPaciente.setCapacidadConsentimiento(new CapacidadConsentimiento(
                    esMenor ? "REPRESENTADO_POR_EDAD" : "AUTONOMO",
                    null,
                    LocalDate.now(),
                    null,
                    esMenor ? "Menor de 18 años calculado automáticamente" : null
            ));
        }

        if (nuevoPaciente.getQuienCompletaRegistro() == null) {
            nuevoPaciente.setQuienCompletaRegistro(esMenor ? "FAMILIAR_O_APOYO" : "PACIENTE");
        }

        if (nuevoPaciente.getFechaRegistro() == null) {
            nuevoPaciente.setFechaRegistro(LocalDate.now());
        }

        return pacienteRepositoryPort.save(nuevoPaciente);
    }

    /**
     * Resuelve el terapeuta asignado al alta:
     * - Un terapeuta autenticado con un único vínculo se asigna a sí mismo.
     * - El resto (admin/assistant) debe indicar un {@code therapistId} válido.
     */
    private void resolverTerapeuta(Paciente paciente) {
        boolean esTerapeuta = identidadTerapeutaPort.tieneRol("therapist");
        java.util.List<String> ids = identidadTerapeutaPort.terapeutaIds();
        if (esTerapeuta && ids.size() == 1) {
            paciente.setTerapeutaId(ids.get(0));
            return;
        }
        String terapeutaId = paciente.getTerapeutaId();
        if (terapeutaId != null && !terapeutaId.isBlank()
                && !pacienteRepositoryPort.existsTerapeuta(terapeutaId)) {
            throw new TerapeutaVinculoException("El terapeuta asignado no existe: " + terapeutaId);
        }
    }

    @Override
    @Transactional
    public Paciente actualizar(String id, Paciente cambios) {
        Paciente existente = pacienteRepositoryPort.findById(id)
                .orElseThrow(() -> new PacienteNotFoundException(id));

        if (cambios.getNombre() != null) existente.setNombre(cambios.getNombre());
        if (cambios.getApellidos() != null) existente.setApellidos(cambios.getApellidos());
        if (cambios.getTelefono() != null) existente.setTelefono(cambios.getTelefono());
        if (cambios.getEmail() != null) existente.setEmail(cambios.getEmail());
        if (cambios.getStatus() != null) existente.setStatus(cambios.getStatus());
        if (cambios.getRiskLevel() != null) existente.setRiskLevel(cambios.getRiskLevel());
        if (cambios.getMotivoConsulta() != null) existente.setMotivoConsulta(cambios.getMotivoConsulta());
        if (cambios.getSessionFrequency() != null) existente.setSessionFrequency(cambios.getSessionFrequency());
        if (cambios.getCapacidadConsentimiento() != null) existente.setCapacidadConsentimiento(cambios.getCapacidadConsentimiento());
        if (cambios.getRepresentante() != null) existente.setRepresentante(cambios.getRepresentante());
        if (cambios.getConsentimientoRepresentanteFirmado() != null) {
            existente.setConsentimientoRepresentanteFirmado(cambios.getConsentimientoRepresentanteFirmado());
        }
        if (cambios.getRfc() != null) existente.setRfc(cambios.getRfc());
        if (cambios.getSexo() != null) existente.setSexo(cambios.getSexo());
        if (cambios.getLugarNacimiento() != null) existente.setLugarNacimiento(cambios.getLugarNacimiento());
        if (cambios.getEstadoCivil() != null) existente.setEstadoCivil(cambios.getEstadoCivil());
        if (cambios.getEscolaridad() != null) existente.setEscolaridad(cambios.getEscolaridad());
        if (cambios.getOcupacion() != null) existente.setOcupacion(cambios.getOcupacion());
        if (cambios.getReligion() != null) existente.setReligion(cambios.getReligion());
        if (cambios.getDomicilio() != null) existente.setDomicilio(cambios.getDomicilio());
        if (cambios.getContactoEmergencia() != null) existente.setContactoEmergencia(cambios.getContactoEmergencia());

        return pacienteRepositoryPort.save(existente);
    }
}
