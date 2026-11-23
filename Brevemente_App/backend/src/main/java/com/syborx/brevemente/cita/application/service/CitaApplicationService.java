package com.syborx.brevemente.cita.application.service;

import com.syborx.brevemente.cita.application.ports.in.ActualizarEstadoCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.AgendarCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.ListarCitasUseCase;
import com.syborx.brevemente.cita.application.ports.in.ConfirmarPagoCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.ReprogramarCitaUseCase;
import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.application.ports.out.DiaNoLaborablePort;
import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.cita.application.ports.out.PacienteConsentimientoPort;
import com.syborx.brevemente.cita.application.ports.out.PasarelaPagosPort;
import com.syborx.brevemente.cita.application.ports.out.SupervisionScopePort;
import com.syborx.brevemente.cita.domain.exception.CitaBloqueadaPorNormativaException;
import com.syborx.brevemente.cita.domain.exception.CitaEnPasadoException;
import com.syborx.brevemente.cita.domain.exception.CitaNotFoundException;
import com.syborx.brevemente.cita.domain.exception.FechaNoLaborableException;
import com.syborx.brevemente.cita.domain.exception.PacienteAjenoAlTerapeutaException;
import com.syborx.brevemente.cita.domain.exception.SinTerapeutaVinculadoException;
import com.syborx.brevemente.cita.domain.exception.SolapamientoCitaException;
import com.syborx.brevemente.cita.domain.exception.TransicionEstadoCitaInvalidaException;
import com.syborx.brevemente.cita.domain.exception.MotivoCancelacionObligatorioException;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.paciente.application.ports.out.TerapeutaConfigRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;
import com.syborx.brevemente.pago.application.ports.out.PagoRepositoryPort;
import com.syborx.brevemente.pago.domain.model.Pago;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CitaApplicationService implements
        ListarCitasUseCase,
        AgendarCitaUseCase,
        ActualizarEstadoCitaUseCase,
        ReprogramarCitaUseCase,
        ConfirmarPagoCitaUseCase {

    private final CitaRepositoryPort citaRepositoryPort;
    private final DiaNoLaborablePort diaNoLaborablePort;
    private final PacienteConsentimientoPort pacienteConsentimientoPort;
    private final IdentidadAutenticadaPort identidadAutenticadaPort;
    private final SupervisionScopePort supervisionScopePort;
    private final PasarelaPagosPort pasarelaPagosPort;
    private final PagoRepositoryPort pagoRepositoryPort;
    private final TerapeutaConfigRepositoryPort terapeutaConfigRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    /**
     * Máquina de estados de la cita. Los estados terminales
     * (`completada`, `cancelada`, `ausente`, `no_presentado`) no tienen salidas.
     */
    private static final Map<String, Set<String>> TRANSICIONES_ESTADO = Map.of(
            "pendiente", Set.of("confirmada", "cancelada"),
            "confirmada", Set.of("completada", "cancelada", "ausente", "no_presentado"),
            "solicita_reagendar", Set.of("confirmada", "cancelada")
    );

    private static final ZoneId ZONA = ZoneId.of("America/Mexico_City");

    @Override
    @Transactional(readOnly = true)
    public List<Cita> listar(CitaFiltro filtro) {
        CitaFiltro efectivo = filtro;
        // Restricción por rol: el patient solo ve sus citas (gana el rol clínico si lo tiene).
        if (!identidadAutenticadaPort.puedeVerAgendaCompleta()) {
            String pacienteId = identidadAutenticadaPort.pacienteId();
            efectivo = new CitaFiltro(
                    filtro != null ? filtro.terapeutaId() : null,
                    pacienteId,
                    filtro != null ? filtro.consultorio() : null,
                    filtro != null ? filtro.modalidad() : null,
                    filtro != null ? filtro.estado() : null,
                    filtro != null ? filtro.desde() : null,
                    filtro != null ? filtro.hasta() : null,
                    null
            );
        } else {
            // Alcance del personal clínico: terapeuta/asistente → sus vínculos;
            // supervisor → sus supervisados; admin → global (sin filtro).
            Collection<String> alcance = resolverAlcanceTerapeutas();
            if (alcance != null) {
                efectivo = new CitaFiltro(
                        filtro != null ? filtro.terapeutaId() : null,
                        filtro != null ? filtro.pacienteId() : null,
                        filtro != null ? filtro.consultorio() : null,
                        filtro != null ? filtro.modalidad() : null,
                        filtro != null ? filtro.estado() : null,
                        filtro != null ? filtro.desde() : null,
                        filtro != null ? filtro.hasta() : null,
                        alcance
                );
            }
        }
        return citaRepositoryPort.findAll(efectivo);
    }

    /**
     * Resuelve el alcance de terapeutas del personal clínico:
     * - Admin (plataforma/clínico): {@code null} (global).
     * - Terapeuta/asistente: sus propios vínculos.
     * - Supervisor: los terapeutas supervisados.
     */
    private Collection<String> resolverAlcanceTerapeutas() {
        boolean admin = identidadAutenticadaPort.tieneRol("admin_platform")
                || identidadAutenticadaPort.tieneRol("admin_clinical");
        if (admin) {
            return null;
        }

        Set<String> ids = new LinkedHashSet<>();
        if (identidadAutenticadaPort.tieneRol("therapist") || identidadAutenticadaPort.tieneRol("assistant")) {
            ids.addAll(identidadAutenticadaPort.terapeutaIds());
        }
        if (identidadAutenticadaPort.tieneRol("supervisor")) {
            String sub = identidadAutenticadaPort.sub();
            if (sub != null && !sub.isBlank()) {
                ids.addAll(supervisionScopePort.terapeutasSupervisados(sub));
            }
        }
        return ids;
    }

    @Override
    @Transactional
    public Cita agendar(Cita cita) {
        String terapeutaId = resolverTerapeutaId(cita.getTerapeutaId());
        cita.setTerapeutaId(terapeutaId);
        validarPacientePertenece(cita.getPacienteId(), terapeutaId);

        OffsetDateTime inicio = cita.getFechaHoraInicio();
        int duracion = cita.getDuracionMinutos() != null ? cita.getDuracionMinutos() : 30;

        // 0. No permitir citas en el pasado
        if (inicio.isBefore(OffsetDateTime.now(ZONA))) {
            throw new CitaEnPasadoException();
        }

        // 1. Día no laborable
        validarDiaNoLaborable(inicio.toLocalDate(), terapeutaId);

        // 2. Solapamiento por terapeuta y por paciente
        OffsetDateTime fin = inicio.plusMinutes(duracion);
        if (citaRepositoryPort.existeSolapamiento(terapeutaId, cita.getPacienteId(), inicio, fin, null)) {
            throw new SolapamientoCitaException(
                    "La cita se solapa con otra existente para el terapeuta o el paciente.");
        }

        // 3. Bloqueo normativo
        if (pacienteConsentimientoPort.estaBloqueadoPorNormativa(cita.getPacienteId())) {
            cita.setBloqueadaPorNormativa(true);
            cita.setEstadoCita("pendiente");
        }

        // 4/5. Fin de la cita e id
        cita.setFechaHoraFin(fin);
        if (cita.getId() == null || cita.getId().isBlank()) {
            cita.setId("cit-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (cita.getPaymentStatus() == null || cita.getPaymentStatus().isBlank()) {
            cita.setPaymentStatus("pendiente");
        }
        if (cita.getModalidad() == null || cita.getModalidad().isBlank()) {
            cita.setModalidad("PRESENCIAL");
        }
        if (cita.getTipoSesion() == null || cita.getTipoSesion().isBlank()) {
            cita.setTipoSesion("individual");
        }
        // Regla ONLINE ⇒ consultorio null
        if ("ONLINE".equalsIgnoreCase(cita.getModalidad())) {
            cita.setConsultorio(null);
        }

        return citaRepositoryPort.save(cita);
    }

    @Override
    @Transactional
    public Cita actualizarEstado(String id, String estado, String motivo, String motivoDetalle) {
        Cita existente = citaRepositoryPort.findById(id)
                .orElseThrow(() -> new CitaNotFoundException(id));

        // Pertenencia: el paciente solo actúa sobre sus propias citas (anti-IDOR).
        if (identidadAutenticadaPort.tieneRol("patient")) {
            String pacienteId = identidadAutenticadaPort.pacienteId();
            if (pacienteId == null || !pacienteId.equals(existente.getPacienteId())) {
                throw new PacienteAjenoAlTerapeutaException(
                        "El paciente autenticado no puede modificar citas ajenas.");
            }
        } else {
            validarAlcanceStaff(existente);
        }

        String actual = existente.getEstadoCita();
        if (actual != null && !TRANSICIONES_ESTADO.getOrDefault(actual, Set.of()).contains(estado)) {
            throw new TransicionEstadoCitaInvalidaException(
                    "No se puede cambiar la cita de estado '" + actual + "' a '" + estado + "'.");
        }

        if ("cancelada".equals(estado)) {
            validarMotivoCancelacion(motivo, motivoDetalle);
            existente.setMotivoCancelacion(motivo);
            existente.setMotivoCancelacionDetalle(motivoDetalle);
        }

        existente.setEstadoCita(estado);
        Cita guardada = citaRepositoryPort.save(existente);

        if ("cancelada".equals(estado)) {
            auditoriaExpedientePort.registrarEnMismaTransaccion(
                    guardada.getPacienteId(),
                    identidadAutenticadaPort.sub(),
                    "Cancelación de cita",
                    "Motivo: " + motivo + (motivoDetalle != null && !motivoDetalle.isBlank()
                            ? " — " + motivoDetalle : ""),
                    "citas");
        }

        return guardada;
    }

    @Override
    @Transactional
    public Cita confirmarPago(String citaId) {
        Cita cita = citaRepositoryPort.findById(citaId)
                .orElseThrow(() -> new CitaNotFoundException(citaId));

        if (identidadAutenticadaPort.tieneRol("patient")) {
            String pacienteId = identidadAutenticadaPort.pacienteId();
            if (pacienteId == null || !pacienteId.equals(cita.getPacienteId())) {
                throw new PacienteAjenoAlTerapeutaException(
                        "El paciente autenticado no puede pagar citas ajenas.");
            }
        } else {
            validarAlcanceStaff(cita);
        }

        // Idempotencia por paymentStatus
        if ("confirmada".equals(cita.getEstadoCita()) && "pagada".equals(cita.getPaymentStatus())) {
            return cita;
        }
        if ("confirmada".equals(cita.getEstadoCita()) && "pendiente".equals(cita.getPaymentStatus())) {
            throw new TransicionEstadoCitaInvalidaException(
                    "La cita está confirmada con pago pendiente (estado ambiguo).");
        }
        if ("exenta".equals(cita.getPaymentStatus())) {
            throw new TransicionEstadoCitaInvalidaException("La cita está exenta de pago.");
        }
        if (!"pendiente".equals(cita.getEstadoCita())) {
            throw new TransicionEstadoCitaInvalidaException(
                    "Solo se puede pagar una cita en estado pendiente.");
        }
        if (cita.isBloqueadaPorNormativa()) {
            throw new CitaBloqueadaPorNormativaException();
        }

        BigDecimal monto = resolverMonto(cita);
        String concepto = "Consulta " + cita.getTipoCita() + " - cita " + citaId;

        PasarelaPagosPort.ResultadoCobro resultado = pasarelaPagosPort.cobrar(citaId, monto, concepto);
        if (!resultado.exito()) {
            throw new TransicionEstadoCitaInvalidaException("El pago no pudo procesarse.");
        }

        cita.setPaymentStatus("pagada");
        cita.setEstadoCita("confirmada");
        citaRepositoryPort.save(cita);

        Pago pago = Pago.builder()
                .id("pay-" + UUID.randomUUID().toString().substring(0, 8))
                .pacienteId(cita.getPacienteId())
                .citaId(citaId)
                .concepto(concepto)
                .monto(monto)
                .fecha(LocalDate.now(ZONA))
                .metodo("transferencia")
                .estado("pagado")
                .registradoPorId(identidadAutenticadaPort.sub())
                .build();
        pagoRepositoryPort.save(pago);

        auditoriaExpedientePort.registrarEnMismaTransaccion(
                cita.getPacienteId(),
                identidadAutenticadaPort.sub(),
                "Confirmación de pago de cita",
                "Pago de la cita " + citaId + " por $" + monto + " MXN (referencia " + resultado.referencia() + ").",
                "pagos");

        return cita;
    }

    private void validarAlcanceStaff(Cita cita) {
        Collection<String> alcance = resolverAlcanceTerapeutas();
        if (alcance != null && (cita.getTerapeutaId() == null || !alcance.contains(cita.getTerapeutaId()))) {
            throw new PacienteAjenoAlTerapeutaException(
                    "No tiene alcance sobre el terapeuta de esta cita.");
        }
    }

    private void validarMotivoCancelacion(String motivo, String motivoDetalle) {
        if (motivo == null || motivo.isBlank()) {
            throw new MotivoCancelacionObligatorioException(
                    "El motivo de cancelación es obligatorio.");
        }
        Set<String> motivos = Set.of("EMERGENCIA", "NO_PUEDE_ASISTIR", "CAMBIO_DE_PLANES", "MOTIVO_CLINICO", "OTRO");
        if (!motivos.contains(motivo)) {
            throw new MotivoCancelacionObligatorioException("Motivo de cancelación inválido: " + motivo);
        }
        if ("OTRO".equals(motivo) && (motivoDetalle == null || motivoDetalle.isBlank())) {
            throw new MotivoCancelacionObligatorioException(
                    "El detalle del motivo es obligatorio cuando el motivo es OTRO.");
        }
    }

    private BigDecimal resolverMonto(Cita cita) {
        TerapeutaConfig config = cita.getTerapeutaId() != null
                ? terapeutaConfigRepositoryPort.findById(cita.getTerapeutaId()).orElse(null)
                : null;
        if (config == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal costo = "primera".equals(cita.getTipoCita())
                ? config.costoPrimeraSesion()
                : config.costoSeguimiento();
        return costo != null ? costo : BigDecimal.ZERO;
    }

    @Override
    @Transactional
    public Cita reprogramar(String id, Cita cambios) {
        Cita existente = citaRepositoryPort.findById(id)
                .orElseThrow(() -> new CitaNotFoundException(id));

        String terapeutaId = resolverTerapeutaId(
                cambios.getTerapeutaId() != null ? cambios.getTerapeutaId() : existente.getTerapeutaId());
        validarPacientePertenece(existente.getPacienteId(), terapeutaId);
        OffsetDateTime inicio = cambios.getFechaHoraInicio() != null
                ? cambios.getFechaHoraInicio() : existente.getFechaHoraInicio();
        int duracion = cambios.getDuracionMinutos() != null
                ? cambios.getDuracionMinutos() : existente.getDuracionMinutos();

        validarDiaNoLaborable(inicio.toLocalDate(), terapeutaId);

        OffsetDateTime fin = inicio.plusMinutes(duracion);
        if (citaRepositoryPort.existeSolapamiento(terapeutaId, existente.getPacienteId(), inicio, fin, id)) {
            throw new SolapamientoCitaException(
                    "La reprogramación se solapa con otra cita para el terapeuta o el paciente.");
        }

        existente.setTerapeutaId(terapeutaId);
        existente.setFechaHoraInicio(inicio);
        existente.setFechaHoraFin(fin);
        existente.setDuracionMinutos(duracion);
        return citaRepositoryPort.save(existente);
    }

    private String resolverTerapeutaId(String explicito) {
        List<String> ids = identidadAutenticadaPort.terapeutaIds();
        if (ids != null && ids.size() == 1) {
            return ids.get(0);
        }
        if (ids != null && ids.size() > 1) {
            if (explicito == null || !ids.contains(explicito)) {
                throw new SinTerapeutaVinculadoException();
            }
            return explicito;
        }
        if (identidadAutenticadaPort.esAdminPlataforma()) {
            if (explicito == null || explicito.isBlank()) {
                throw new SinTerapeutaVinculadoException();
            }
            return explicito;
        }
        throw new SinTerapeutaVinculadoException();
    }

    private void validarDiaNoLaborable(LocalDate fecha, String terapeutaId) {
        if (diaNoLaborablePort.existeDiaNoLaborable(fecha, terapeutaId)) {
            throw new FechaNoLaborableException(fecha.toString());
        }
    }

    /**
     * Regla de pertenencia: la cita solo puede agendarse/reprogramarse con el
     * terapeuta dueño del paciente ({@code pacientes.terapeuta_id}).
     */
    private void validarPacientePertenece(String pacienteId, String terapeutaId) {
        if (pacienteId == null || pacienteId.isBlank()) {
            throw new PacienteAjenoAlTerapeutaException("El paciente es obligatorio para agendar la cita");
        }
        String dueno = pacienteConsentimientoPort.terapeutaIdDePaciente(pacienteId);
        if (dueno == null || !dueno.equals(terapeutaId)) {
            throw new PacienteAjenoAlTerapeutaException(
                    "El paciente no está asignado al terapeuta de la cita");
        }
    }
}
