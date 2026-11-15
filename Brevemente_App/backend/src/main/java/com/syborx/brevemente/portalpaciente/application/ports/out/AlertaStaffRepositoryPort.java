package com.syborx.brevemente.portalpaciente.application.ports.out;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.AlertaStaff;

import java.util.List;
import java.util.Optional;

/**
 * Puerto de persistencia staff para alertas de crisis/seguridad clínica.
 */
public interface AlertaStaffRepositoryPort {

    /**
     * Lista alertas activas. {@code terapeutaIds == null} → global;
     * {@code terapeutaIds} vacío → sin resultados.
     */
    List<AlertaStaff> findActivasPorTerapeutaIds(List<String> terapeutaIds);

    Optional<AlertaStaff> findById(String id);

    AlertaPaciente save(AlertaPaciente alerta);
}
