package com.syborx.brevemente.expediente.application.ports.out;

import java.time.LocalDate;

public interface PacienteConsentimientoEscrituraPort {
    FirmaResultado firmar(String pacienteId, LocalDate fechaDeterminacion);
}
