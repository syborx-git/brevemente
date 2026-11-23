package com.syborx.brevemente.plataforma.application.service;

import com.syborx.brevemente.plataforma.application.ports.in.PlataformaDashboardUseCase;
import com.syborx.brevemente.plataforma.application.ports.out.PlataformaDashboardRepositoryPort;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ActividadRecienteDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.AlertaAdministrativaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.AlertasAdministrativasDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ClaveIndicadorClinico;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.DesgloseIndicadorDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.EstadoModulo;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.FeatureFlagDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.IndicadorClinicoDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.KpisPlataformaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ResumenPlataformaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.SaludModuloDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.SaludPlataformaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.Severidad;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.TerapeutaPlataformaDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.TipoAlertaAdministrativa;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Dashboard de Plataforma. KPIs y actividad son reales (puerto de persistencia);
 * indicadores, desglose, alertas y salud son MOCK en Fase 1 (SDD Módulo 1).
 */
@Service
public class PlataformaDashboardApplicationService implements PlataformaDashboardUseCase {

    private final PlataformaDashboardRepositoryPort repositoryPort;

    public PlataformaDashboardApplicationService(PlataformaDashboardRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    @Override
    public ResumenPlataformaDTO obtenerResumen() {
        return new ResumenPlataformaDTO(new KpisPlataformaDTO(
                repositoryPort.contarTerapeutasActivos(),
                repositoryPort.contarPacientesActivos()));
    }

    @Override
    public List<TerapeutaPlataformaDTO> listarTerapeutas() {
        return repositoryPort.listarTerapeutas();
    }

    @Override
    public List<IndicadorClinicoDTO> obtenerIndicadoresClinicos() {
        return List.of(
                new IndicadorClinicoDTO(ClaveIndicadorClinico.EFECTIVIDAD_TBE, "Efectividad TBE", new BigDecimal("72"), "%"),
                new IndicadorClinicoDTO(ClaveIndicadorClinico.INDICE_FIDELIDAD, "Índice de fidelidad", new BigDecimal("8.4"), "/10"),
                new IndicadorClinicoDTO(ClaveIndicadorClinico.TASA_DESERCION, "Tasa de deserción", new BigDecimal("4"), "%"));
    }

    /**
     * Valores de ejemplo por indicador (placeholder) mientras no existan las
     * fórmulas clínicas reales. Se asignan a los terapeutas reales en orden.
     */
    private static final Map<ClaveIndicadorClinico, List<BigDecimal>> VALORES_MOCK = Map.of(
            ClaveIndicadorClinico.EFECTIVIDAD_TBE, List.of(new BigDecimal("78"), new BigDecimal("65")),
            ClaveIndicadorClinico.INDICE_FIDELIDAD, List.of(new BigDecimal("8.6"), new BigDecimal("8.1")),
            ClaveIndicadorClinico.TASA_DESERCION, List.of(new BigDecimal("3"), new BigDecimal("6")));

    private static final Map<ClaveIndicadorClinico, List<Integer>> CASOS_MOCK = Map.of(
            ClaveIndicadorClinico.EFECTIVIDAD_TBE, List.of(24, 18),
            ClaveIndicadorClinico.INDICE_FIDELIDAD, List.of(24, 18),
            ClaveIndicadorClinico.TASA_DESERCION, List.of(24, 18));

    @Override
    public List<DesgloseIndicadorDTO> obtenerDesgloseIndicador(ClaveIndicadorClinico clave) {
        List<TerapeutaPlataformaDTO> terapeutas = repositoryPort.listarTerapeutas();
        List<BigDecimal> valores = VALORES_MOCK.getOrDefault(clave, List.of());
        List<Integer> casos = CASOS_MOCK.getOrDefault(clave, List.of());

        List<DesgloseIndicadorDTO> resultado = new ArrayList<>();
        for (int i = 0; i < terapeutas.size(); i++) {
            TerapeutaPlataformaDTO t = terapeutas.get(i);
            BigDecimal valor = i < valores.size() ? valores.get(i) : BigDecimal.ZERO;
            int numCasos = i < casos.size() ? casos.get(i) : 0;
            resultado.add(new DesgloseIndicadorDTO(t.id(), t.nombre(), valor, numCasos));
        }
        return resultado;
    }

    @Override
    public ActividadRecienteDTO obtenerActividadReciente(int limit) {
        return new ActividadRecienteDTO(
                repositoryPort.findAccesosRecientes(limit),
                repositoryPort.findUsuariosRecientes(limit));
    }

    @Override
    public AlertasAdministrativasDTO obtenerAlertasAdministrativas() {
        Instant hoy = Instant.now();
        return new AlertasAdministrativasDTO(List.of(
                new AlertaAdministrativaDTO("al-1", TipoAlertaAdministrativa.SUSCRIPCION,
                        "Mtro. Alejandro Mendoza — suscripción vencida",
                        "No ha cubierto la cuota mensual de la plataforma.",
                        Severidad.ALTA, hoy),
                new AlertaAdministrativaDTO("al-2", TipoAlertaAdministrativa.SUSCRIPCION,
                        "Dra. Sofía Ramírez — pago recibido",
                        "Suscripción pagada correctamente.",
                        Severidad.OK, hoy)));
    }

    @Override
    public SaludPlataformaDTO obtenerSaludPlataforma() {
        List<SaludModuloDTO> modulos = List.of(
                new SaludModuloDTO("Agenda", EstadoModulo.OK, 0),
                new SaludModuloDTO("Expedientes", EstadoModulo.OK, 0),
                new SaludModuloDTO("Pagos", EstadoModulo.OK, 0),
                new SaludModuloDTO("LEVA", EstadoModulo.DEGRADADO, 2),
                new SaludModuloDTO("Campus", EstadoModulo.CAIDO, 5),
                new SaludModuloDTO("Auditoría", EstadoModulo.OK, 0));
        List<FeatureFlagDTO> flags = List.of(
                new FeatureFlagDTO("dashboardBackend", true),
                new FeatureFlagDTO("agendaBackend", true),
                new FeatureFlagDTO("asistenteLevaBackend", false));
        return new SaludPlataformaDTO(modulos, flags);
    }
}
