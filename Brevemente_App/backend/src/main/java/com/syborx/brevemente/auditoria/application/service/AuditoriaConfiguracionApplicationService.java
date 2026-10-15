package com.syborx.brevemente.auditoria.application.service;

import com.syborx.brevemente.auditoria.application.ports.in.ListarAuditoriaConfiguracionUseCase;
import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaConfiguracionPort;
import com.syborx.brevemente.auditoria.domain.model.AuditoriaConfiguracion;
import com.syborx.brevemente.paciente.application.ports.out.IdentidadTerapeutaPort;
import com.syborx.brevemente.paciente.application.ports.out.SupervisionScopePort;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaAccesoDenegadoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service("auditoriaConfiguracionApplicationService")
@RequiredArgsConstructor
public class AuditoriaConfiguracionApplicationService implements ListarAuditoriaConfiguracionUseCase {

    private final AuditoriaConfiguracionPort auditoriaConfiguracionPort;
    private final IdentidadTerapeutaPort identidad;
    private final SupervisionScopePort supervisionScopePort;

    @Override
    public List<AuditoriaConfiguracion> listarPorTerapeuta(String terapeutaId) {
        if (!tieneAcceso(terapeutaId)) {
            throw new TerapeutaAccesoDenegadoException(
                    "No tienes acceso a la auditoría del terapeuta " + terapeutaId);
        }
        return auditoriaConfiguracionPort.listarPorTerapeuta(terapeutaId);
    }

    private boolean tieneAcceso(String terapeutaId) {
        if (identidad.tieneRol("admin_platform") || identidad.tieneRol("admin_clinical")) {
            return true;
        }
        // El terapeuta ve su propio historial.
        if (identidad.terapeutaIds().contains(terapeutaId)) {
            return true;
        }
        // El supervisor ve el historial de sus supervisados.
        return supervisionScopePort.terapeutasSupervisados(identidad.sub()).contains(terapeutaId);
    }
}
