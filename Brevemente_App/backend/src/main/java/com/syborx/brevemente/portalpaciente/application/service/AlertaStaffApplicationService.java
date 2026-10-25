package com.syborx.brevemente.portalpaciente.application.service;

import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.dashboard.application.service.DashboardScopeResolver;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.portalpaciente.application.ports.in.AlertaStaffUseCases;
import com.syborx.brevemente.portalpaciente.application.ports.out.AlertaStaffRepositoryPort;
import com.syborx.brevemente.portalpaciente.domain.exception.AlertaStaffNotFoundException;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaStaff;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Orquestador staff de alertas de crisis/seguridad clínica.
 * El scope se resuelve con {@link DashboardScopeResolver} (Global/Scoped).
 */
@Service
@RequiredArgsConstructor
public class AlertaStaffApplicationService implements AlertaStaffUseCases {

    private final AlertaStaffRepositoryPort repositoryPort;
    private final DashboardScopeResolver scopeResolver;
    private final IdentidadAutenticadaPort identidadAutenticadaPort;

    @Override
    @Transactional(readOnly = true)
    public List<AlertaStaff> listarActivas() {
        AlcanceDashboard alcance = scopeResolver.resolver();
        List<String> ids = alcance.tipo() == AlcanceDashboard.TipoAlcance.GLOBAL
                ? null
                : alcance.terapeutaIds();
        return repositoryPort.findActivasPorTerapeutaIds(ids);
    }

    @Override
    @Transactional
    public AlertaStaff resolver(String id) {
        AlertaStaff alerta = repositoryPort.findById(id)
                .orElseThrow(() -> new AlertaStaffNotFoundException(id));

        if (!"activa".equalsIgnoreCase(alerta.getEstado())) {
            return alerta; // idempotente: ya resuelta
        }

        AlertaPaciente dominio = AlertaPaciente.builder()
                .id(alerta.getId())
                .pacienteId(alerta.getPacienteId())
                .tipo(alerta.getTipo())
                .mensaje(alerta.getMensaje())
                .estado("resuelta")
                .resueltaPor(identidadAutenticadaPort.sub())
                .resueltaEn(OffsetDateTime.now())
                .createdAt(alerta.getCreatedAt())
                .build();
        repositoryPort.save(dominio);

        return repositoryPort.findById(id)
                .orElseThrow(() -> new AlertaStaffNotFoundException(id));
    }
}
