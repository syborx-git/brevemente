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
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.TipoAlertaAdministrativa;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
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
    public List<IndicadorClinicoDTO> obtenerIndicadoresClinicos() {
        return List.of(
                new IndicadorClinicoDTO(ClaveIndicadorClinico.EFECTIVIDAD_TBE, "Efectividad TBE", new BigDecimal("72"), "%"),
                new IndicadorClinicoDTO(ClaveIndicadorClinico.INDICE_FIDELIDAD, "Índice de fidelidad", new BigDecimal("8.4"), "/10"),
                new IndicadorClinicoDTO(ClaveIndicadorClinico.TASA_DESERCION, "Tasa de deserción", new BigDecimal("4"), "%"));
    }

    private static final Map<ClaveIndicadorClinico, List<DesgloseIndicadorDTO>> DESGLOSE = Map.of(
            ClaveIndicadorClinico.EFECTIVIDAD_TBE, List.of(
                    new DesgloseIndicadorDTO("ter-001", "Dra. Sofía Ramírez Lozano", new BigDecimal("78"), 24),
                    new DesgloseIndicadorDTO("ter-002", "Mtro. Alejandro Mendoza Garza", new BigDecimal("65"), 18),
                    new DesgloseIndicadorDTO("ter-003", "Dra. Isabel Cárdenas", new BigDecimal("71"), 12)),
            ClaveIndicadorClinico.INDICE_FIDELIDAD, List.of(
                    new DesgloseIndicadorDTO("ter-001", "Dra. Sofía Ramírez Lozano", new BigDecimal("8.6"), 24),
                    new DesgloseIndicadorDTO("ter-002", "Mtro. Alejandro Mendoza Garza", new BigDecimal("8.1"), 18),
                    new DesgloseIndicadorDTO("ter-003", "Dra. Isabel Cárdenas", new BigDecimal("8.4"), 12)),
            ClaveIndicadorClinico.TASA_DESERCION, List.of(
                    new DesgloseIndicadorDTO("ter-001", "Dra. Sofía Ramírez Lozano", new BigDecimal("3"), 24),
                    new DesgloseIndicadorDTO("ter-002", "Mtro. Alejandro Mendoza Garza", new BigDecimal("6"), 18),
                    new DesgloseIndicadorDTO("ter-003", "Dra. Isabel Cárdenas", new BigDecimal("5"), 12)));

    @Override
    public List<DesgloseIndicadorDTO> obtenerDesgloseIndicador(ClaveIndicadorClinico clave) {
        return DESGLOSE.getOrDefault(clave, List.of());
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
