package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.portalpaciente.application.ports.out.AlertaStaffRepositoryPort;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaStaff;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity.AlertaPacienteJpaEntity;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository.SpringDataAlertaPacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AlertaStaffPersistenceAdapter implements AlertaStaffRepositoryPort {

    private final SpringDataAlertaPacienteRepository alertaRepository;

    @Override
    public List<AlertaStaff> findActivasPorTerapeutaIds(List<String> terapeutaIds) {
        List<Object[]> filas;
        if (terapeutaIds == null) {
            filas = alertaRepository.findActivasGlobal();
        } else if (terapeutaIds.isEmpty()) {
            return List.of();
        } else {
            filas = alertaRepository.findActivasScoped(terapeutaIds);
        }
        return filas.stream().map(this::toStaff).toList();
    }

    @Override
    public Optional<AlertaStaff> findById(String id) {
        return alertaRepository.findStaffById(id).stream()
                .map(this::toStaff)
                .findFirst();
    }

    @Override
    public AlertaPaciente save(AlertaPaciente alerta) {
        AlertaPacienteJpaEntity entity = alertaRepository.save(toEntity(alerta));
        return toDomain(entity);
    }

    private AlertaStaff toStaff(Object[] f) {
        return AlertaStaff.builder()
                .id(str(f[0]))
                .pacienteId(str(f[1]))
                .pacienteNombre(nombreCompleto(str(f[2]), str(f[3])))
                .tipo(str(f[4]))
                .estado(str(f[5]))
                .mensaje(str(f[6]))
                .createdAt(toOffsetDateTime(f[7]))
                .resueltaPor(str(f[8]))
                .resueltaEn(toOffsetDateTime(f[9]))
                .build();
    }

    private AlertaPaciente toDomain(AlertaPacienteJpaEntity e) {
        return AlertaPaciente.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .tipo(e.getTipo())
                .mensaje(e.getMensaje())
                .estado(e.getEstado())
                .resueltaPor(e.getResueltaPor())
                .resueltaEn(e.getResueltaEn())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private AlertaPacienteJpaEntity toEntity(AlertaPaciente d) {
        return AlertaPacienteJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .tipo(d.getTipo())
                .mensaje(d.getMensaje())
                .estado(d.getEstado())
                .resueltaPor(d.getResueltaPor())
                .resueltaEn(d.getResueltaEn())
                .createdAt(d.getCreatedAt())
                .build();
    }

    private String nombreCompleto(String nombre, String apellidos) {
        if (nombre == null || nombre.isBlank()) {
            return apellidos != null ? apellidos.trim() : "";
        }
        if (apellidos == null || apellidos.isBlank()) {
            return nombre.trim();
        }
        return (nombre.trim() + " " + apellidos.trim()).trim();
    }

    private String str(Object o) {
        return o != null ? o.toString() : null;
    }

    private OffsetDateTime toOffsetDateTime(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof OffsetDateTime odt) {
            return odt;
        }
        if (o instanceof Instant inst) {
            return inst.atOffset(ZoneOffset.UTC);
        }
        if (o instanceof LocalDateTime ldt) {
            return ldt.atOffset(ZoneOffset.UTC);
        }
        if (o instanceof Timestamp ts) {
            return ts.toInstant().atOffset(ZoneOffset.UTC);
        }
        if (o instanceof java.sql.Date d) {
            return d.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        }
        return null;
    }
}
