package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.Consentimiento;

public interface ConsentimientoRepositoryPort {
    Consentimiento save(Consentimiento consentimiento);
}
