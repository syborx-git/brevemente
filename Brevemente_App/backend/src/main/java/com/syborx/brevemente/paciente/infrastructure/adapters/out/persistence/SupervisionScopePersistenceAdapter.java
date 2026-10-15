package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SupervisionAsignacionJpaEntity;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataSupervisionAsignacionRepository;
import com.syborx.brevemente.paciente.application.ports.out.SupervisionScopePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SupervisionScopePersistenceAdapter implements SupervisionScopePort {

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
