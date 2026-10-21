package com.syborx.brevemente.cita.application.ports.in;

import com.syborx.brevemente.cita.domain.model.Cita;

public interface AgendarCitaUseCase {
    Cita agendar(Cita cita);
}
