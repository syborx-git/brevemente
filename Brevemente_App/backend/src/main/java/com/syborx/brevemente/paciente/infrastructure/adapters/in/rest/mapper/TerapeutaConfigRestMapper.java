package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfigDatos;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSede;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSedeDatos;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaConfigRequestDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaConfigResponseDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaSedeDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaSedeRequestDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TerapeutaConfigRestMapper {

    public TerapeutaConfigResponseDTO toResponse(TerapeutaConfig domain) {
        if (domain == null) return null;
        return new TerapeutaConfigResponseDTO(
                domain.id(),
                domain.nombre(),
                domain.email(),
                domain.cedulaProfesional(),
                domain.especialidad(),
                domain.telefono(),
                domain.duracionSesionDefaultMin(),
                domain.costoPrimeraSesion(),
                domain.costoSeguimiento(),
                domain.edadMinimaAtencion(),
                toSedesResponse(domain.sedes())
        );
    }

    public TerapeutaConfigDatos toDatos(TerapeutaConfigRequestDTO request) {
        if (request == null) return null;
        return new TerapeutaConfigDatos(
                request.telefono(),
                request.duracionSesionDefaultMin(),
                request.costoPrimeraSesion(),
                request.costoSeguimiento(),
                request.edadMinimaAtencion()
        );
    }

    public List<TerapeutaSedeDatos> toSedesDatos(List<TerapeutaSedeRequestDTO> request) {
        if (request == null) return List.of();
        return request.stream()
                .map(r -> new TerapeutaSedeDatos(r.sedeId(), r.esPrincipal()))
                .toList();
    }

    public List<TerapeutaSedeDTO> toSedesResponse(List<TerapeutaSede> sedes) {
        if (sedes == null) return List.of();
        return sedes.stream()
                .map(s -> new TerapeutaSedeDTO(s.id(), s.nombre(), s.esPrincipal()))
                .toList();
    }
}
