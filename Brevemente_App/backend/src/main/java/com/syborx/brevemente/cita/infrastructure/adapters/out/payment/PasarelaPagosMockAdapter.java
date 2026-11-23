package com.syborx.brevemente.cita.infrastructure.adapters.out.payment;

import com.syborx.brevemente.cita.application.ports.out.PasarelaPagosPort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Pasarela de pagos simulada. Siempre aprueba el cobro y devuelve una referencia
 * mock. Será reemplazada por un adaptador real (Stripe/Conekta/OpenPay).
 */
@Component
public class PasarelaPagosMockAdapter implements PasarelaPagosPort {

    @Override
    public ResultadoCobro cobrar(String citaId, BigDecimal monto, String concepto) {
        return new ResultadoCobro(true, "mock-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
