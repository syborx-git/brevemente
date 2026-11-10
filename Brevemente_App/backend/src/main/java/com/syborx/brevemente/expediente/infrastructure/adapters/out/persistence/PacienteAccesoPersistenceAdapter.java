package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SupervisionAsignacionJpaEntity;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataSupervisionAsignacionRepository;
import com.syborx.brevemente.expediente.application.ports.out.PacienteAccesoPort;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PacienteAccesoPersistenceAdapter implements PacienteAccesoPort {

    private final PacienteRepositoryPort pacienteRepositoryPort;
    private final SpringDataSupervisionAsignacionRepository supervisionRepository;

    @Override
    public boolean puedeAcceder(String pacienteId, String usuarioSub, List<String> terapeutaIds, boolean esAdmin) {
        if (esAdmin) {
            return true;
        }
        String dueno = pacienteRepositoryPort.findById(pacienteId)
                .map(Paciente::getTerapeutaId)
                .orElse(null);
        if (dueno == null) {
            return false;
        }
        if (terapeutaIds != null && terapeutaIds.contains(dueno)) {
            return true;
        }
        if (usuarioSub != null && !usuarioSub.isBlank()) {
            return supervisionRepository.findBySupervisorUsuarioId(usuarioSub).stream()
                    .map(SupervisionAsignacionJpaEntity::getTerapeutaId)
                    .anyMatch(dueno::equals);
        }
        return false;
    }
}
