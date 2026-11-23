package com.syborx.brevemente.cita.application.ports.out;

import java.math.BigDecimal;

/**
 * Abstracción de la pasarela de pagos. Hoy se implementa con un mock; mañana
 * se sustituye por un adaptador de pasarela real sin tocar el caso de uso.
 */
public interface PasarelaPagosPort {

    ResultadoCobro cobrar(String citaId, BigDecimal monto, String concepto);

    record ResultadoCobro(boolean exito, String referencia) {
    }
}
