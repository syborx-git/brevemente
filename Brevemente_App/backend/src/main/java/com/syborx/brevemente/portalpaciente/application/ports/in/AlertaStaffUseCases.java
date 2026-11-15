package com.syborx.brevemente.portalpaciente.application.ports.in;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaStaff;

import java.util.List;

/**
 * Casos de uso staff sobre las alertas de crisis/seguridad clínica
 * (vista "Requieren Atención Urgente" del terapeuta).
 */
public interface AlertaStaffUseCases {

    List<AlertaStaff> listarActivas();

    AlertaStaff resolver(String id);
}
