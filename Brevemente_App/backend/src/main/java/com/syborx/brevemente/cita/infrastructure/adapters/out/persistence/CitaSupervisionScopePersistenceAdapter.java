package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.cita.application.ports.out.SupervisionScopePort;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SupervisionAsignacionJpaEntity;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataSupervisionAsignacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CitaSupervisionScopePersistenceAdapter implements SupervisionScopePort {

    private final SpringDataSupervisionAsignacionRepository repository;

    @Override
    public List<String> terapeutasSupervisados(String supervisorUsuarioId) {
        if (supervisorUsuarioId == null || supervisorUsuarioId.isBlank()) {
            return List.of();
        }
        return repository.findBySupervisorUsuarioId(supervisorUsuarioId).stream()
                .map(SupervisionAsignacionJpaEntity::getTerapeutaId)
                .toList();
    }
}
