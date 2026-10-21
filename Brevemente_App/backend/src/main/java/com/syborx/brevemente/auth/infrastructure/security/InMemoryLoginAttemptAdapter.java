package com.syborx.brevemente.auth.infrastructure.security;

import com.syborx.brevemente.auth.application.ports.out.LoginAttemptPort;
import com.syborx.brevemente.auth.domain.exception.DemasiadosIntentosException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitador de intentos de login en memoria (anti fuerza bruta).
 * <ul>
 *   <li>Por cuenta: {@code max-por-cuenta} fallos en la ventana bloquean la cuenta.</li>
 *   <li>Por IP: {@code max-por-ip} fallos en la ventana bloquean la IP (password spraying).</li>
 * </ul>
 * Alcance: una sola instancia del backend. Para despliegues con varias réplicas
 * debe sustituirse por un adaptador respaldado en Redis implementando el mismo puerto.
 */
@Component
public class InMemoryLoginAttemptAdapter implements LoginAttemptPort {

    private static final int MAX_ENTRADAS_ANTES_DE_PURGAR = 10_000;

    private final int maxPorCuenta;
    private final int maxPorIp;
    private final Duration ventana;
    private final Duration bloqueo;

    private final Map<String, Contador> contadores = new ConcurrentHashMap<>();

    public InMemoryLoginAttemptAdapter(
            @Value("${app.security.login-attempts.max-por-cuenta:5}") int maxPorCuenta,
            @Value("${app.security.login-attempts.max-por-ip:20}") int maxPorIp,
            @Value("${app.security.login-attempts.ventana-minutos:15}") long ventanaMinutos,
            @Value("${app.security.login-attempts.bloqueo-minutos:15}") long bloqueoMinutos
    ) {
        this.maxPorCuenta = maxPorCuenta;
        this.maxPorIp = maxPorIp;
        this.ventana = Duration.ofMinutes(ventanaMinutos);
        this.bloqueo = Duration.ofMinutes(bloqueoMinutos);
    }

    @Override
    public void verificarPermitido(String email, String ip) {
        Instant ahora = Instant.now();
        long espera = Math.max(segundosBloqueado(claveCuenta(email), ahora), segundosBloqueado(claveIp(ip), ahora));
        if (espera > 0) {
            throw new DemasiadosIntentosException(espera);
        }
    }

    @Override
    public void registrarFallo(String email, String ip) {
        Instant ahora = Instant.now();
        purgarSiEsNecesario(ahora);
        registrar(claveCuenta(email), maxPorCuenta, ahora);
        registrar(claveIp(ip), maxPorIp, ahora);
    }

    @Override
    public void registrarExito(String email) {
        contadores.remove(claveCuenta(email));
    }

    // -------------------------------------------------------------------------

    private static final class Contador {
        Instant inicioVentana;
        int fallos;
        Instant bloqueadoHasta;

        Contador(Instant inicio) {
            this.inicioVentana = inicio;
        }
    }

    private void registrar(String clave, int max, Instant ahora) {
        contadores.compute(clave, (k, c) -> {
            if (c == null || ahora.isAfter(c.inicioVentana.plus(ventana))) {
                c = new Contador(ahora);
            }
            c.fallos++;
            if (c.fallos >= max) {
                c.bloqueadoHasta = ahora.plus(bloqueo);
            }
            return c;
        });
    }

    private long segundosBloqueado(String clave, Instant ahora) {
        Contador c = contadores.get(clave);
        if (c == null || c.bloqueadoHasta == null || !c.bloqueadoHasta.isAfter(ahora)) {
            return 0;
        }
        return Math.max(1, Duration.between(ahora, c.bloqueadoHasta).toSeconds());
    }

    private void purgarSiEsNecesario(Instant ahora) {
        if (contadores.size() < MAX_ENTRADAS_ANTES_DE_PURGAR) {
            return;
        }
        contadores.entrySet().removeIf(e -> {
            Contador c = e.getValue();
            boolean ventanaVencida = ahora.isAfter(c.inicioVentana.plus(ventana));
            boolean sinBloqueo = c.bloqueadoHasta == null || !c.bloqueadoHasta.isAfter(ahora);
            return ventanaVencida && sinBloqueo;
        });
    }

    private static String claveCuenta(String email) {
        return "cuenta:" + (email == null ? "" : email.trim().toLowerCase());
    }

    private static String claveIp(String ip) {
        return "ip:" + (ip == null ? "desconocida" : ip);
    }
}
