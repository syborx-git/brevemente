package com.syborx.brevemente.paciente.application.service;

import com.syborx.brevemente.auth.application.ports.in.GenerarPasswordTemporalUseCase;
import com.syborx.brevemente.auth.domain.model.PasswordTemporal;
import com.syborx.brevemente.paciente.application.ports.in.*;
import com.syborx.brevemente.paciente.application.ports.out.IdentidadPacientePort;
import com.syborx.brevemente.paciente.application.ports.out.IdentidadTerapeutaPort;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.application.ports.out.SupervisionScopePort;
import com.syborx.brevemente.paciente.domain.exception.PacienteConflictException;
import com.syborx.brevemente.paciente.domain.exception.PacienteNotFoundException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaVinculoException;
import com.syborx.brevemente.paciente.domain.model.CapacidadConsentimiento;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.domain.model.PacienteCreado;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PacienteApplicationService implements 
        ListarPacientesUseCase,
        ObtenerPacienteUseCase,
        CrearPacienteUseCase,
        ActualizarPacienteUseCase,
        GenerarPasswordTemporalPacienteUseCase {

    private final PacienteRepositoryPort pacienteRepositoryPort;
    private final IdentidadTerapeutaPort identidadTerapeutaPort;
    private final SupervisionScopePort supervisionScopePort;
    private final IdentidadPacientePort identidadPacientePort;
    private final GenerarPasswordTemporalUseCase generarPasswordTemporalUseCase;

    @Override
    @Transactional(readOnly = true)
    public List<Paciente> listarTodos() {
        Collection<String> terapeutaIds = resolverAlcanceTerapeutas();
        return pacienteRepositoryPort.findAll(terapeutaIds);
    }

    /**
     * Resuelve el alcance del directorio de pacientes:
     * - Admin (plataforma/clínico): global ({@code null}).
     * - Terapeuta/asistente: sus propios vínculos de terapeuta.
     * - Supervisor: los terapeutas que supervisa.
     * Un alcance vacío devuelve lista vacía (sin pacientes visibles).
     */
    private Collection<String> resolverAlcanceTerapeutas() {
        boolean admin = identidadTerapeutaPort.tieneRol("admin_platform")
                || identidadTerapeutaPort.tieneRol("admin_clinical");
        if (admin) {
            return null;
        }

        Set<String> ids = new LinkedHashSet<>();
        if (identidadTerapeutaPort.tieneRol("therapist") || identidadTerapeutaPort.tieneRol("assistant")) {
            ids.addAll(identidadTerapeutaPort.terapeutaIds());
        }
        if (identidadTerapeutaPort.tieneRol("supervisor")) {
            String sub = identidadTerapeutaPort.sub();
            if (sub != null && !sub.isBlank()) {
                ids.addAll(supervisionScopePort.terapeutasSupervisados(sub));
            }
        }
        return ids;
    }

    /**
     * Verifica que el paciente esté dentro del alcance del usuario autenticado.
     * Admin (global) omite la verificación; el resto solo accede a pacientes
     * de sus terapeutas vinculados/supervisados (404 en caso contrario — anti-IDOR).
     */
    private void validarAcceso(Paciente paciente) {
        Collection<String> terapeutaIds = resolverAlcanceTerapeutas();
        if (terapeutaIds == null) {
            return;
        }
        String terapeutaId = paciente.getTerapeutaId();
        if (terapeutaId == null || !terapeutaIds.contains(terapeutaId)) {
            throw new PacienteNotFoundException(paciente.getId());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Paciente obtenerPorId(String id) {
        Paciente paciente = pacienteRepositoryPort.findById(id)
                .orElseThrow(() -> new PacienteNotFoundException(id));
        validarAcceso(paciente);
        return paciente;
    }

    @Override
    @Transactional
    public PacienteCreado crear(Paciente nuevoPaciente) {
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

        // Identidad de acceso al portal (rol patient) + contraseña temporal.
        String email = nuevoPaciente.getEmail() != null ? nuevoPaciente.getEmail().trim() : "";
        if (email.isBlank()) {
            throw new PacienteConflictException("El correo del paciente es obligatorio");
        }
        if (identidadPacientePort.existeEmail(email)) {
            throw new PacienteConflictException("El correo ya está registrado: " + email);
        }
        String usuarioId = identidadPacientePort.crearIdentidad(
                email, nuevoPaciente.getNombre(), nuevoPaciente.getApellidos());
        nuevoPaciente.setUsuarioId(usuarioId);

        Paciente guardado = pacienteRepositoryPort.save(nuevoPaciente);

        PasswordTemporal temporal = generarPasswordTemporalUseCase.generarPasswordTemporal(
                usuarioId, identidadTerapeutaPort.sub(), "ALTA_PACIENTE");
        return new PacienteCreado(guardado, temporal.valor());
    }

    @Override
    @Transactional
    public PasswordTemporal generarPasswordTemporal(String pacienteId) {
        Paciente paciente = pacienteRepositoryPort.findById(pacienteId)
                .orElseThrow(() -> new PacienteNotFoundException(pacienteId));
        validarAcceso(paciente);

        String usuarioId = paciente.getUsuarioId();
        if (usuarioId == null || usuarioId.isBlank()) {
            String email = paciente.getEmail() != null ? paciente.getEmail().trim() : "";
            if (email.isBlank()) {
                throw new PacienteConflictException("El paciente no tiene correo registrado; no se puede generar su acceso");
            }
            if (identidadPacientePort.existeEmail(email)) {
                throw new PacienteConflictException("El correo ya está registrado: " + email);
            }
            usuarioId = identidadPacientePort.crearIdentidad(
                    email, paciente.getNombre(), paciente.getApellidos());
            paciente.setUsuarioId(usuarioId);
            pacienteRepositoryPort.save(paciente);
        }
        return generarPasswordTemporalUseCase.generarPasswordTemporal(
                usuarioId, identidadTerapeutaPort.sub(), "RESET");
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
        validarAcceso(existente);

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
