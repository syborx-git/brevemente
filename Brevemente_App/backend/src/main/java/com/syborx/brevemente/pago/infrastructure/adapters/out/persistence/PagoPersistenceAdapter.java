package com.syborx.brevemente.pago.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import com.syborx.brevemente.pago.application.ports.out.PagoRepositoryPort;
import com.syborx.brevemente.pago.domain.model.Pago;
import com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.entity.PagoJpaEntity;
import com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.mapper.PagoPersistenceMapper;
import com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.repository.SpringDataPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PagoPersistenceAdapter implements PagoRepositoryPort {

    private final SpringDataPagoRepository pagoRepository;
    private final SpringDataPacienteRepository pacienteRepository;
    private final SpringDataUsuarioRepository usuarioRepository;
    private final PagoPersistenceMapper mapper;

    @Override
    public List<Pago> findByPacienteId(String pacienteId) {
        return pagoRepository.findByPacienteIdOrderByFechaDesc(pacienteId).stream()
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), usuarioNombre(e.getRegistradoPorId())))
                .toList();
    }

    @Override
    public Optional<Pago> findById(String id) {
        return pagoRepository.findById(id)
                .map(e -> mapper.toDomain(e, pacienteNombre(e.getPacienteId()), usuarioNombre(e.getRegistradoPorId())));
    }

    @Override
    public Pago save(Pago pago) {
        PagoJpaEntity saved = pagoRepository.save(mapper.toJpaEntity(pago));
        return mapper.toDomain(saved, pacienteNombre(saved.getPacienteId()), usuarioNombre(saved.getRegistradoPorId()));
    }

    @Override
    public void deleteById(String id) {
        pagoRepository.deleteById(id);
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
