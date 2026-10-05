package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.AuditoriaAccesoPort;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.AuditoriaAccesoJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataAuditoriaAccesoRepository;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
    public void registrarLogin(String usuarioId, Set<String> roles, String ip) {
        // 1. Marcar el último acceso en la identidad
        usuarioRepository.updateLastLoginAt(usuarioId);

        // 2. Escribir la traza de auditoría de acceso
        Map<String, Object> detalles = baseDetalles(ip);
        detalles.put("roles", roles != null ? new ArrayList<>(roles) : List.of());
        guardar(usuarioId, "LOGIN", detalles);
    }

    @Override
    // Transacción propia: el caso de uso hace rollback al lanzar CredencialesInvalidasException,
    // pero la traza del intento fallido debe persistir.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarIntentoFallido(String usuarioId, String email, String ip, String motivo) {
        Map<String, Object> detalles = baseDetalles(ip);
        detalles.put("email", email);
        detalles.put("motivo", motivo);
        guardar(usuarioId, "LOGIN_FAILED", detalles);
    }

    @Override
    public void registrarEvento(String usuarioId, String accion, String ip, String detalle) {
        Map<String, Object> detalles = baseDetalles(ip);
        detalles.put("detalle", detalle);
        guardar(usuarioId, accion, detalles);
    }

    private Map<String, Object> baseDetalles(String ip) {
        Map<String, Object> detalles = new HashMap<>();
        detalles.put("timestamp", OffsetDateTime.now().toString());
        detalles.put("ip", ip);
        return detalles;
    }

    private void guardar(String usuarioId, String accion, Map<String, Object> detalles) {
        auditoriaAccesoRepository.save(AuditoriaAccesoJpaEntity.builder()
                .id(UUID.randomUUID().toString())
                .usuarioId(usuarioId)
                .recursoAccedido("auth")
                .accion(accion)
                .detalles(detalles)
                .build());
    }
}
