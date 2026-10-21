package com.syborx.brevemente.cita.application.service;

import com.syborx.brevemente.cita.application.ports.in.GestionarDiasNoLaborablesUseCase;
import com.syborx.brevemente.cita.application.ports.out.DiaNoLaborablePort;
import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.cita.domain.exception.SinTerapeutaVinculadoException;
import com.syborx.brevemente.cita.domain.model.DiaNoLaborable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiaNoLaborableApplicationService implements GestionarDiasNoLaborablesUseCase {

    private final DiaNoLaborablePort diaNoLaborablePort;
    private final IdentidadAutenticadaPort identidadAutenticadaPort;

    @Override
    @Transactional(readOnly = true)
    public List<DiaNoLaborable> listar() {
        return diaNoLaborablePort.findAll();
    }

    @Override
    @Transactional
    public DiaNoLaborable crear(DiaNoLaborable dia) {
        if ("personal".equalsIgnoreCase(dia.getTipo())) {
            // Regla de derivación de terapeuta_id para días personales (misma que en agendar).
            List<String> ids = identidadAutenticadaPort.terapeutaIds();
            String terapeutaId = dia.getTerapeutaId();
            if (ids != null && ids.size() == 1) {
                terapeutaId = ids.get(0);
            } else if (ids != null && ids.size() > 1) {
                if (terapeutaId == null || !ids.contains(terapeutaId)) {
                    throw new SinTerapeutaVinculadoException();
                }
            } else if (identidadAutenticadaPort.esAdminPlataforma()) {
                if (terapeutaId == null || terapeutaId.isBlank()) {
                    throw new SinTerapeutaVinculadoException();
                }
            } else {
                throw new SinTerapeutaVinculadoException();
            }
            dia.setTerapeutaId(terapeutaId);
        } else {
            dia.setTerapeutaId(null); // festivo oficial ⇒ sin terapeuta
        }

        if (dia.getId() == null || dia.getId().isBlank()) {
            dia.setId("hol-" + UUID.randomUUID().toString().substring(0, 8));
        }
        return diaNoLaborablePort.save(dia);
    }

    @Override
    @Transactional
    public void eliminar(String id) {
        diaNoLaborablePort.deleteById(id);
    }
}
