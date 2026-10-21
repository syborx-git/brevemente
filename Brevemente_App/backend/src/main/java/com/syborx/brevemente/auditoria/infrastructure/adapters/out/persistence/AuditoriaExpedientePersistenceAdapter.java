package com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;
import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.entity.AuditoriaExpedienteJpaEntity;
import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.mapper.AuditoriaExpedientePersistenceMapper;
import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.repository.SpringDataAuditoriaExpedienteRepository;
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
public class AuditoriaExpedientePersistenceAdapter implements AuditoriaExpedientePort {

    private final SpringDataAuditoriaExpedienteRepository repository;
    private final SpringDataUsuarioRepository usuarioRepository;
    private final AuditoriaExpedientePersistenceMapper mapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String pacienteId, String usuarioId, String accion, String detalle, String categoria) {
        repository.save(AuditoriaExpedienteJpaEntity.builder()
                .id("aud-" + UUID.randomUUID().toString().substring(0, 8))
                .pacienteId(pacienteId)
                .usuarioId(usuarioId)
                .accion(accion)
                .detalle(detalle)
                .categoria(categoria)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditoriaExpediente> listarPorPaciente(String pacienteId) {
        return repository.findByPacienteIdOrderByCreatedAtDesc(pacienteId).stream()
                .map(e -> {
                    UsuarioJpaEntity u = e.getUsuarioId() != null
                            ? usuarioRepository.findById(e.getUsuarioId()).orElse(null) : null;
                    String userName = u != null ? (u.getNombre() + " " + u.getApellidos()).trim() : null;
                    String role = u != null && u.getRoles() != null && !u.getRoles().isEmpty()
                            ? u.getRoles().iterator().next().getNombre() : null;
                    return mapper.toDomain(e, userName, role);
                })
                .toList();
    }
}
