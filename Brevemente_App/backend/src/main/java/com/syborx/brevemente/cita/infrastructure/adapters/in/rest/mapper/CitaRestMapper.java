package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaCreateRequest;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaReprogramarRequest;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaResponseDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * Correspondencia request↔response: pacienteId↔patientId, fecha↔date, hora↔time,
 * tipo↔type, estado↔status, duracionMinutos↔duration, modalidad↔modality,
 * consultorio↔office.
 */
@Component
public class CitaRestMapper {

    private static final ZoneId ZONA = ZoneId.of("America/Mexico_City");

    public CitaResponseDTO toResponse(Cita domain) {
        if (domain == null) {
            return null;
        }
        String date = domain.getFechaHoraInicio() != null
                ? domain.getFechaHoraInicio().atZoneSameInstant(ZONA).toLocalDate().toString() : null;
        String time = domain.getFechaHoraInicio() != null
                ? domain.getFechaHoraInicio().atZoneSameInstant(ZONA).toLocalTime().toString() : null;

        return new CitaResponseDTO(
                domain.getId(),
                domain.getPacienteId(),
                domain.getPacienteNombre(),
                date,
                time,
                domain.getTipoCita(),
                domain.getEstadoCita(),
                domain.getPaymentStatus(),
                domain.getTerapeutaId(),
                domain.getDuracionMinutos(),
                domain.getModalidad(),
                domain.getConsultorio(),
                domain.isBloqueadaPorNormativa()
        );
    }

    public Cita toDomain(CitaCreateRequest request) {
        if (request == null) {
            return null;
        }
        OffsetDateTime inicio = componerFechaHora(request.fecha(), request.hora());
        return Cita.builder()
                .pacienteId(request.pacienteId())
                .terapeutaId(request.terapeutaId())
                .fechaHoraInicio(inicio)
                .tipoCita(request.tipo())
                .duracionMinutos(request.duracionMinutos() != null ? request.duracionMinutos() : 30)
                .modalidad(request.modalidad() != null ? request.modalidad() : "PRESENCIAL")
                .consultorio(request.consultorio())
                .estadoCita("confirmada")
                .paymentStatus("pendiente")
                .bloqueadaPorNormativa(false)
                .build();
    }

    public Cita toReprogramacion(CitaReprogramarRequest request) {
        if (request == null) {
            return null;
        }
        OffsetDateTime inicio = request.fecha() != null && request.hora() != null
                ? componerFechaHora(request.fecha(), request.hora()) : null;
        return Cita.builder()
                .fechaHoraInicio(inicio)
                .duracionMinutos(request.duracionMinutos())
                .terapeutaId(request.terapeutaId())
                .build();
    }

    private OffsetDateTime componerFechaHora(String fecha, String hora) {
        LocalDate date = LocalDate.parse(fecha);
        LocalTime time = hora != null ? LocalTime.parse(hora) : LocalTime.of(9, 0);
        return date.atTime(time).atZone(ZONA).toOffsetDateTime();
    }
}
