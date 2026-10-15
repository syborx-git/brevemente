package com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaConfiguracionPort;
import com.syborx.brevemente.auditoria.domain.model.AuditoriaConfiguracion;
import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.entity.AuditoriaConfiguracionJpaEntity;
import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.repository.SpringDataAuditoriaConfiguracionRepository;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditoriaConfiguracionPersistenceAdapter implements AuditoriaConfiguracionPort {

    private final SpringDataAuditoriaConfiguracionRepository repository;
    private final SpringDataUsuarioRepository usuarioRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String terapeutaId, String campo, String valorAnterior, String valorNuevo, String usuarioId) {
        repository.save(AuditoriaConfiguracionJpaEntity.builder()
                .id("cfg-" + UUID.randomUUID().toString().substring(0, 8))
                .terapeutaId(terapeutaId)
                .campo(campo)
                .valorAnterior(valorAnterior)
                .valorNuevo(valorNuevo)
                .usuarioId(usuarioId)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditoriaConfiguracion> listarPorTerapeuta(String terapeutaId) {
        return repository.findByTerapeutaIdOrderByCreatedAtDesc(terapeutaId).stream()
                .map(e -> {
                    UsuarioJpaEntity u = e.getUsuarioId() != null
                            ? usuarioRepository.findById(e.getUsuarioId()).orElse(null) : null;
                    String nombre = u != null ? (u.getNombre() + " " + u.getApellidos()).trim() : null;
                    return new AuditoriaConfiguracion(
                            e.getId(),
                            e.getTerapeutaId(),
                            e.getCampo(),
                            e.getValorAnterior(),
                            e.getValorNuevo(),
                            e.getUsuarioId(),
                            nombre,
                            e.getCreatedAt()
                    );
                })
                .toList();
    }
}
