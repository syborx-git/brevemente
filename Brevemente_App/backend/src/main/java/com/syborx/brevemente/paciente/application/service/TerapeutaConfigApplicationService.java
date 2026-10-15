package com.syborx.brevemente.paciente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaConfiguracionPort;
import com.syborx.brevemente.paciente.application.ports.in.ActualizarConfigTerapeutaUseCase;
import com.syborx.brevemente.paciente.application.ports.in.ActualizarSedesTerapeutaUseCase;
import com.syborx.brevemente.paciente.application.ports.in.ObtenerConfigTerapeutaUseCase;
import com.syborx.brevemente.paciente.application.ports.out.IdentidadTerapeutaPort;
import com.syborx.brevemente.paciente.application.ports.out.SupervisionScopePort;
import com.syborx.brevemente.paciente.application.ports.out.TerapeutaConfigRepositoryPort;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaAccesoDenegadoException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaConfigNotFoundException;
import com.syborx.brevemente.paciente.domain.exception.TerapeutaVinculoException;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfigDatos;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSede;
import com.syborx.brevemente.paciente.domain.model.TerapeutaSedeDatos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TerapeutaConfigApplicationService
        implements ObtenerConfigTerapeutaUseCase, ActualizarConfigTerapeutaUseCase, ActualizarSedesTerapeutaUseCase {

    private final TerapeutaConfigRepositoryPort repositoryPort;
    private final AuditoriaConfiguracionPort auditoriaConfiguracionPort;
    private final IdentidadTerapeutaPort identidad;
    private final SupervisionScopePort supervisionScopePort;

    @Override
    public TerapeutaConfig obtenerConfig(String terapeutaIdExplicito) {
        String terapeutaId = resolverTerapeutaId(terapeutaIdExplicito, false);
        return repositoryPort.findById(terapeutaId)
                .orElseThrow(() -> new TerapeutaConfigNotFoundException(
                        "No se encontró la configuración del terapeuta " + terapeutaId));
    }

    @Override
    public TerapeutaConfig actualizarConfig(String terapeutaIdExplicito, TerapeutaConfigDatos datos) {
        String terapeutaId = resolverTerapeutaId(terapeutaIdExplicito, true);
        TerapeutaConfig anterior = repositoryPort.findById(terapeutaId)
                .orElseThrow(() -> new TerapeutaConfigNotFoundException(
                        "No se encontró la configuración del terapeuta " + terapeutaId));
        TerapeutaConfig nueva = repositoryPort.update(terapeutaId, datos);
        auditarCambiosConfig(terapeutaId, anterior, nueva, identidad.sub());
        return nueva;
    }

    @Override
    public List<TerapeutaSede> actualizarSedes(String terapeutaIdExplicito, List<TerapeutaSedeDatos> sedes) {
        String terapeutaId = resolverTerapeutaId(terapeutaIdExplicito, true);
        List<TerapeutaSede> anteriores = repositoryPort.findById(terapeutaId)
                .map(TerapeutaConfig::sedes).orElse(List.of());
        List<TerapeutaSede> nuevas = repositoryPort.updateSedes(terapeutaId, sedes);
        auditoriaConfiguracionPort.registrar(
                terapeutaId, "sedes", resumenSedes(anteriores), resumenSedes(nuevas), identidad.sub());
        return nuevas;
    }

    private void auditarCambiosConfig(
            String terapeutaId, TerapeutaConfig anterior, TerapeutaConfig nueva, String usuarioId) {
        compararYRegistrar(terapeutaId, "telefono", anterior.telefono(), nueva.telefono(), usuarioId);
        compararYRegistrar(terapeutaId, "duracionSesionDefaultMin",
                anterior.duracionSesionDefaultMin(), nueva.duracionSesionDefaultMin(), usuarioId);
        compararYRegistrar(terapeutaId, "costoPrimeraSesion",
                anterior.costoPrimeraSesion(), nueva.costoPrimeraSesion(), usuarioId);
        compararYRegistrar(terapeutaId, "costoSeguimiento",
                anterior.costoSeguimiento(), nueva.costoSeguimiento(), usuarioId);
        compararYRegistrar(terapeutaId, "edadMinimaAtencion",
                anterior.edadMinimaAtencion(), nueva.edadMinimaAtencion(), usuarioId);
    }

    private void compararYRegistrar(
            String terapeutaId, String campo, Object anterior, Object nueva, String usuarioId) {
        if (!valoresIguales(anterior, nueva)) {
            auditoriaConfiguracionPort.registrar(terapeutaId, campo, str(anterior), str(nueva), usuarioId);
        }
    }

    private boolean valoresIguales(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof BigDecimal x && b instanceof BigDecimal y) {
            return x.compareTo(y) == 0;
        }
        return a.equals(b);
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String resumenSedes(List<TerapeutaSede> sedes) {
        if (sedes == null || sedes.isEmpty()) return "";
        return sedes.stream()
                .map(s -> s.id() + (s.esPrincipal() ? "(P)" : ""))
                .collect(Collectors.joining(", "));
    }

    /**
     * Resuelve el terapeuta efectivo con reglas de alcance por rol:
     * <ul>
     *   <li>Admin → cualquier terapeuta (explícito obligatorio si no tiene vinculado).</li>
     *   <li>Escritura → solo los terapeutas vinculados (su propio consultorio).</li>
     *   <li>Lectura → terapeutas vinculados + supervisados.</li>
     * </ul>
     */
    private String resolverTerapeutaId(String terapeutaIdExplicito, boolean escritura) {
        boolean admin = identidad.tieneRol("admin_platform") || identidad.tieneRol("admin_clinical");
        List<String> vinculados = identidad.terapeutaIds();

        if (admin) {
            if (vinculados.size() == 1 && esBlanco(terapeutaIdExplicito)) {
                return vinculados.get(0);
            }
            return exigirExplicito(terapeutaIdExplicito);
        }

        List<String> supervisados = escritura
                ? List.of()
                : (identidad.tieneRol("supervisor")
                        ? supervisionScopePort.terapeutasSupervisados(identidad.sub())
                        : List.of());

        if (!esBlanco(terapeutaIdExplicito)) {
            boolean permitido = vinculados.contains(terapeutaIdExplicito)
                    || supervisados.contains(terapeutaIdExplicito);
            if (!permitido) {
                throw new TerapeutaAccesoDenegadoException(
                        "No tienes acceso a la configuración del terapeuta " + terapeutaIdExplicito);
            }
            return terapeutaIdExplicito;
        }

        if (vinculados.size() == 1) {
            return vinculados.get(0);
        }
        if (vinculados.size() > 1) {
            throw new TerapeutaVinculoException(
                    "Existen varios terapeutas vinculados; especifica terapeutaId.");
        }
        throw new TerapeutaVinculoException(
                "No hay un terapeuta vinculado al usuario; especifica terapeutaId.");
    }

    private boolean esBlanco(String value) {
        return value == null || value.isBlank();
    }

    private String exigirExplicito(String terapeutaIdExplicito) {
        if (!esBlanco(terapeutaIdExplicito)) {
            return terapeutaIdExplicito;
        }
        throw new TerapeutaVinculoException("Especifica terapeutaId para operar.");
    }
}
