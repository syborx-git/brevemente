package com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import com.syborx.brevemente.constancia.application.ports.out.ConstanciaRepositoryPort;
import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;
import com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.entity.ConstanciaFisicaJpaEntity;
import com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.mapper.ConstanciaFisicaPersistenceMapper;
import com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.repository.SpringDataConstanciaRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ConstanciaFisicaPersistenceAdapter implements ConstanciaRepositoryPort {

    private final SpringDataConstanciaRepository constanciaRepository;
    private final SpringDataPacienteRepository pacienteRepository;
    private final SpringDataUsuarioRepository usuarioRepository;
    private final ConstanciaFisicaPersistenceMapper mapper;

    @Override
    public List<ConstanciaFisica> findByPacienteId(String pacienteId) {
        return constanciaRepository.findByPacienteIdOrderByFechaExpedicionDesc(pacienteId).stream()
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), usuarioNombre(e.getRegistradoPorId())))
                .toList();
    }

    @Override
    public Optional<ConstanciaFisica> findById(String id) {
        return constanciaRepository.findById(id)
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), usuarioNombre(e.getRegistradoPorId())));
    }

    @Override
    public ConstanciaFisica save(ConstanciaFisica constancia) {
        ConstanciaFisicaJpaEntity saved = constanciaRepository.save(mapper.toJpaEntity(constancia));
        return mapper.toDomain(saved, pacienteNombre(saved.getPacienteId()), usuarioNombre(saved.getRegistradoPorId()));
    }

    private String pacienteNombre(String pacienteId) {
        if (pacienteId == null) return null;
        return pacienteRepository.findById(pacienteId)
                .map(p -> (p.getNombre() + " " + p.getApellidos()).trim())
                .orElse(null);
    }

    private String usuarioNombre(String usuarioId) {
        if (usuarioId == null) return null;
        return usuarioRepository.findById(usuarioId)
                .map(u -> (u.getNombre() + " " + u.getApellidos()).trim())
                .orElse(null);
    }
}
