package com.syborx.brevemente.auth.infrastructure.security;

import com.syborx.brevemente.auth.domain.exception.DemasiadosIntentosException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class InMemoryLoginAttemptAdapterTest {

    private InMemoryLoginAttemptAdapter adapter;

    @BeforeEach
    void setUp() {
        // max 3 por cuenta, max 5 por IP, ventana 15 min, bloqueo 15 min
        adapter = new InMemoryLoginAttemptAdapter(3, 5, 15, 15);
    }

    @Test
    @DisplayName("Permite accesos cuando no se supera el límite de intentos")
    void permiteAccesosIniciales() {
        assertDoesNotThrow(() -> adapter.verificarPermitido("test@brevemente.org", "127.0.0.1"));
        adapter.registrarFallo("test@brevemente.org", "127.0.0.1");
        assertDoesNotThrow(() -> adapter.verificarPermitido("test@brevemente.org", "127.0.0.1"));
    }

    @Test
    @DisplayName("Bloquea la cuenta tras alcanzar el máximo de intentos fallidos")
    void bloqueaPorCuenta() {
        String email = "victima@brevemente.org";
        adapter.registrarFallo(email, "192.168.1.1");
        adapter.registrarFallo(email, "192.168.1.2");
        adapter.registrarFallo(email, "192.168.1.3"); // 3 fallos

        DemasiadosIntentosException ex = assertThrows(
                DemasiadosIntentosException.class,
                () -> adapter.verificarPermitido(email, "192.168.1.4")
        );
        assertTrue(ex.getRetryAfterSeconds() > 0);
    }

    @Test
    @DisplayName("Un login exitoso reinicia el contador de la cuenta")
    void exitoReiniciaContador() {
        String email = "usuario@brevemente.org";
        adapter.registrarFallo(email, "127.0.0.1");
        adapter.registrarFallo(email, "127.0.0.1");
        adapter.registrarExito(email);

        adapter.registrarFallo(email, "127.0.0.1");
        // No debe lanzar excepción porque el contador se reseteó a 1 fallo
        assertDoesNotThrow(() -> adapter.verificarPermitido(email, "127.0.0.1"));
    }
}
