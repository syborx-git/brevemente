package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.in.GuardarTratamientosPreviosUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarTratamientosPreviosUseCase;
import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.TratamientoPrevioRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.domain.model.TratamientoPrevio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service("expedienteTratamientoPrevioApplicationService")
@RequiredArgsConstructor
public class TratamientoPrevioApplicationService implements ListarTratamientosPreviosUseCase, GuardarTratamientosPreviosUseCase {

    private static final Set<String> RESULTADOS = Set.of("resuelto", "mejorado", "invariable", "drop_out", "otro");

    private final ExpedienteRepositoryPort expedienteRepositoryPort;
    private final TratamientoPrevioRepositoryPort tratamientoPrevioRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional(readOnly = true)
    public List<TratamientoPrevio> listar(String pacienteId) {
        return tratamientoPrevioRepositoryPort.findByExpedienteId(resolverExpedienteId(pacienteId));
    }

    @Override
    @Transactional
    public List<TratamientoPrevio> guardar(String pacienteId, List<TratamientoPrevio> items, String usuarioId) {
        String expedienteId = resolverExpedienteId(pacienteId);

        List<TratamientoPrevio> validos = items == null ? List.of() : items;
        for (TratamientoPrevio t : validos) {
            if (t.resultado() == null || !RESULTADOS.contains(t.resultado())) {
                throw new IllegalArgumentException("Resultado de tratamiento previo inválido: " + t.resultado());
            }
        }

        tratamientoPrevioRepositoryPort.deleteByExpedienteId(expedienteId);
        List<TratamientoPrevio> guardados = tratamientoPrevioRepositoryPort.saveAll(expedienteId, validos);
        auditoriaExpedientePort.registrar(pacienteId, usuarioId, "Actualización de tratamientos previos",
                "Se actualizaron los tratamientos psicoterapéuticos previos.", "expediente");
        return guardados;
    }

    private String resolverExpedienteId(String pacienteId) {
        return expedienteRepositoryPort.findByPacienteId(pacienteId)
                .map(Expediente::getId)
                .orElseThrow(() -> new ExpedienteNotFoundException(pacienteId));
    }
}
