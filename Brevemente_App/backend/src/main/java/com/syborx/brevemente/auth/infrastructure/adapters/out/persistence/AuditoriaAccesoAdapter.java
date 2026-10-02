package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.AuditoriaAccesoPort;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.AuditoriaAccesoJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataAuditoriaAccesoRepository;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditoriaAccesoAdapter implements AuditoriaAccesoPort {

    private final SpringDataAuditoriaAccesoRepository auditoriaAccesoRepository;
    private final SpringDataUsuarioRepository usuarioRepository;

    @Override
    public void registrarLogin(String usuarioId, Set<String> roles) {
        // 1. Marcar el último acceso en la identidad
        usuarioRepository.updateLastLoginAt(usuarioId);

        // 2. Escribir la traza de auditoría de acceso
        Map<String, Object> detalles = new HashMap<>();
        detalles.put("roles", roles != null ? new ArrayList<>(roles) : List.of());
        detalles.put("timestamp", OffsetDateTime.now().toString());

        AuditoriaAccesoJpaEntity entity = AuditoriaAccesoJpaEntity.builder()
                .id(UUID.randomUUID().toString())
                .usuarioId(usuarioId)
                .recursoAccedido("auth")
                .accion("LOGIN")
                .detalles(detalles)
                .build();

        auditoriaAccesoRepository.save(entity);
    }
}
