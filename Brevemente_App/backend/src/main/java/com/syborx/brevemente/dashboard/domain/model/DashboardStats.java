package com.syborx.brevemente.dashboard.domain.model;

import lombok.Builder;
import lombok.Value;

/**
 * Métricas agregadas del centro de control clínico (POJO puro, sin JPA).
 * Simétrico 1:1 con MetricasDashboard (TS) y DashboardStatsResponseDTO (REST).
 */
@Value
@Builder
public class DashboardStats {
    long pacientesActivos;
    long citasHoyCount;
    long alertasConsentimiento;
    long alertasRiesgo;
    long pendientesClinicos;
}
