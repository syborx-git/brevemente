package com.syborx.brevemente.service;

import com.syborx.brevemente.domain.model.PacienteEntity;
import com.syborx.brevemente.domain.model.TerapeutaEntity;
import com.syborx.brevemente.dto.PacienteCreateRequest;
import com.syborx.brevemente.dto.PacientePatchRequest;
import com.syborx.brevemente.dto.PacienteResponseDTO;
import com.syborx.brevemente.mapper.PacienteMapper;
import com.syborx.brevemente.repository.PacienteRepository;
import com.syborx.brevemente.repository.TerapeutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final TerapeutaRepository terapeutaRepository;
    private final PacienteMapper pacienteMapper;

    @Transactional(readOnly = true)
    public List<PacienteResponseDTO> listarTodos() {
        return pacienteRepository.findAll().stream()
                .map(pacienteMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO obtenerPorId(String id) {
        return pacienteRepository.findById(id)
                .map(pacienteMapper::toResponseDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado: " + id));
    }

    @Transactional
    public PacienteResponseDTO crearPaciente(PacienteCreateRequest request) {
        if (request.curp() != null && !request.curp().isBlank()) {
            if (pacienteRepository.existsByCurp(request.curp())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un paciente con el CURP: " + request.curp());
            }
        }

        TerapeutaEntity terapeuta = null;
        String tId = request.therapistId() != null ? request.therapistId() : "ter-001";
        terapeuta = terapeutaRepository.findById(tId).orElse(null);

        PacienteEntity entity = pacienteMapper.toEntity(request, terapeuta);
        PacienteEntity guardado = pacienteRepository.save(entity);
        return pacienteMapper.toResponseDTO(guardado);
    }

    @Transactional
    public PacienteResponseDTO actualizarPaciente(String id, PacientePatchRequest cambios) {
        PacienteEntity entity = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado: " + id));

        pacienteMapper.applyPatch(entity, cambios);
        PacienteEntity actualizado = pacienteRepository.save(entity);
        return pacienteMapper.toResponseDTO(actualizado);
    }
}
