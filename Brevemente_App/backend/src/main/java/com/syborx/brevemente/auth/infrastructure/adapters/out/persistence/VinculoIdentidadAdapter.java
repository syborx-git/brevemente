package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.VinculoIdentidadPort;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.VinculoJpaProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VinculoIdentidadAdapter implements VinculoIdentidadPort {

    private final VinculoJpaProjection vinculoJpaProjection;

    @Override
    public List<String> findTerapeutaIdsByUsuarioId(String usuarioId) {
        if (usuarioId == null) {
            return List.of();
        }
        return vinculoJpaProjection.findTerapeutaIdsByUsuarioId(usuarioId);
    }

    @Override
    public String findPacienteIdByUsuarioId(String usuarioId) {
        if (usuarioId == null) {
            return null;
        }
        return vinculoJpaProjection.findPacienteIdByUsuarioId(usuarioId).orElse(null);
    }
}
