package com.syborx.brevemente.cita.application.service;

import com.syborx.brevemente.cita.application.ports.in.ActualizarEstadoCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.AgendarCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.ListarCitasUseCase;
import com.syborx.brevemente.cita.application.ports.in.ReprogramarCitaUseCase;
import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.application.ports.out.DiaNoLaborablePort;
import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.cita.application.ports.out.PacienteConsentimientoPort;
import com.syborx.brevemente.cita.domain.exception.CitaNotFoundException;
import com.syborx.brevemente.cita.domain.exception.FechaNoLaborableException;
import com.syborx.brevemente.cita.domain.exception.SinTerapeutaVinculadoException;
import com.syborx.brevemente.cita.domain.exception.SolapamientoCitaException;
import com.syborx.brevemente.cita.domain.exception.TransicionEstadoCitaInvalidaException;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
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
        ReprogramarCitaUseCase {

    private final CitaRepositoryPort citaRepositoryPort;
    private final DiaNoLaborablePort diaNoLaborablePort;
    private final PacienteConsentimientoPort pacienteConsentimientoPort;
    private final IdentidadAutenticadaPort identidadAutenticadaPort;

    /**
     * Máquina de estados de la cita. Los estados terminales
     * (`completada`, `cancelada`, `ausente`, `no_presentado`) no tienen salidas.
     */
    private static final Map<String, Set<String>> TRANSICIONES_ESTADO = Map.of(
            "pendiente", Set.of("confirmada", "cancelada"),
            "confirmada", Set.of("completada", "cancelada", "ausente", "no_presentado"),
            "solicita_reagendar", Set.of("confirmada", "cancelada")
    );

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
                    filtro != null ? filtro.hasta() : null
            );
        }
        return citaRepositoryPort.findAll(efectivo);
    }

    @Override
    @Transactional
    public Cita agendar(Cita cita) {
        String terapeutaId = resolverTerapeutaId(cita.getTerapeutaId());
        cita.setTerapeutaId(terapeutaId);

        OffsetDateTime inicio = cita.getFechaHoraInicio();
        int duracion = cita.getDuracionMinutos() != null ? cita.getDuracionMinutos() : 30;

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
        // Regla ONLINE ⇒ consultorio null
        if ("ONLINE".equalsIgnoreCase(cita.getModalidad())) {
            cita.setConsultorio(null);
        }

        return citaRepositoryPort.save(cita);
    }

    @Override
    @Transactional
    public Cita actualizarEstado(String id, String estado) {
        Cita existente = citaRepositoryPort.findById(id)
                .orElseThrow(() -> new CitaNotFoundException(id));

        String actual = existente.getEstadoCita();
        if (actual != null && !TRANSICIONES_ESTADO.getOrDefault(actual, Set.of()).contains(estado)) {
            throw new TransicionEstadoCitaInvalidaException(
                    "No se puede cambiar la cita de estado '" + actual + "' a '" + estado + "'.");
        }

        existente.setEstadoCita(estado);
        return citaRepositoryPort.save(existente);
    }

    @Override
    @Transactional
    public Cita reprogramar(String id, Cita cambios) {
        Cita existente = citaRepositoryPort.findById(id)
                .orElseThrow(() -> new CitaNotFoundException(id));

        String terapeutaId = resolverTerapeutaId(
                cambios.getTerapeutaId() != null ? cambios.getTerapeutaId() : existente.getTerapeutaId());
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
}
