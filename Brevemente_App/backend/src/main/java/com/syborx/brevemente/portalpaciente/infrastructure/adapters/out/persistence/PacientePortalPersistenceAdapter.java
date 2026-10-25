package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.portalpaciente.application.ports.out.PortalPacienteRepositoryPort;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.ContraReferencia;
import com.syborx.brevemente.portalpaciente.domain.model.PortalPerfil;
import com.syborx.brevemente.portalpaciente.domain.model.SesionPortal;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity.AlertaPacienteJpaEntity;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity.ContraReferenciaJpaEntity;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository.SpringDataAlertaPacienteRepository;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository.SpringDataContraReferenciaRepository;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository.SpringDataPortalPacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PacientePortalPersistenceAdapter implements PortalPacienteRepositoryPort {

    private final SpringDataPortalPacienteRepository portalRepository;
    private final SpringDataAlertaPacienteRepository alertaRepository;
    private final SpringDataContraReferenciaRepository contraReferenciaRepository;

    @Override
    public Optional<PortalPerfil> findPerfil(String pacienteId) {
        List<Object[]> filas = portalRepository.findPerfil(pacienteId);
        if (filas.isEmpty()) {
            return Optional.empty();
        }
        Object[] f = filas.get(0);
        return Optional.of(new PortalPerfil(
                str(f[0]), str(f[1]), str(f[2]), str(f[3])));
    }

    @Override
    public List<SesionPortal> findSesionesPorPaciente(String pacienteId) {
        return portalRepository.findSesionesPorPaciente(pacienteId).stream()
                .map(f -> new SesionPortal(
                        str(f[0]),
                        str(f[1]),
                        intOrNull(f[2]),
                        str(f[3]),
                        str(f[4]),
                        str(f[5])))
                .toList();
    }

    @Override
    public List<AlertaPaciente> findAlertasPorPaciente(String pacienteId) {
        return alertaRepository.findByPacienteIdOrderByCreatedAtDesc(pacienteId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<ContraReferencia> findContraReferenciaAprobada(String pacienteId) {
        List<Object[]> filas = portalRepository.findContraReferenciaAprobada(pacienteId);
        if (filas.isEmpty()) {
            return Optional.empty();
        }
        Object[] f = filas.get(0);
        ContraReferencia cr = ContraReferencia.builder()
                .id(str(f[0]))
                .pacienteId(str(f[1]))
                .terapeutaOrigenId(str(f[2]))
                .terapeutaDestinoId(str(f[3]))
                .motivo(str(f[4]))
                .resumen(str(f[5]))
                .estado(str(f[6]))
                .createdAt(toOffsetDateTime(f[7]))
                .resolvedAt(toOffsetDateTime(f[8]))
                .fromTherapistName(str(f[9]))
                .toTherapistName(str(f[10]))
                .build();
        return Optional.of(cr);
    }

    @Override
    public AlertaPaciente saveAlerta(AlertaPaciente alerta) {
        AlertaPacienteJpaEntity entity = alertaRepository.save(toEntity(alerta));
        return toDomain(entity);
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

    private String str(Object o) {
        return o != null ? o.toString() : null;
    }

    private Integer intOrNull(Object o) {
        return o != null ? ((Number) o).intValue() : null;
    }

    private OffsetDateTime toOffsetDateTime(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof OffsetDateTime odt) {
            return odt;
        }
        if (o instanceof Timestamp ts) {
            return ts.toInstant().atOffset(ZoneOffset.UTC);
        }
        return null;
    }
}
