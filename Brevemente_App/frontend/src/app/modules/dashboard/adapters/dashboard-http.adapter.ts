import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AccionDominante,
  AlertaMayoriaEdad,
  CatalogosDashboard,
  DashboardFiltros,
  DashboardRepository,
  DashboardStats,
  PendientePrioritario,
  UrgentAlert
} from '../ports/dashboard.repository';
import { Appointment, PacienteResumen } from '../../../core/types/clinical.types';
import { SerieMes, DistribucionFase, CasoProtocolo } from '../../../core/utils/dashboard-metrics';

@Injectable({
  providedIn: 'root'
})
export class DashboardHttpAdapter implements DashboardRepository {
  private readonly apiUrl = '/api/v1/dashboard';

  constructor(private readonly http: HttpClient) {}

  /** Mapea DashboardFiltros a query params (todos opcionales). */
  private buildParams(filtros?: DashboardFiltros): HttpParams {
    let params = new HttpParams();
    if (!filtros) {
      return params;
    }
    if (filtros.modalidad) {
      params = params.set('modalidad', filtros.modalidad);
    }
    if (filtros.sedeId) {
      params = params.set('sedeId', filtros.sedeId);
    }
    if (filtros.periodo) {
      params = params.set('periodo', filtros.periodo);
    }
    if (filtros.terapeutaId) {
      params = params.set('terapeutaId', filtros.terapeutaId);
    }
    if (filtros.protocoloId) {
      params = params.set('protocoloId', filtros.protocoloId);
    }
    return params;
  }

  obtenerStats(filtros?: DashboardFiltros): Observable<DashboardStats> {
    return this.http
      .get<DashboardStats>(`${this.apiUrl}/stats`, { params: this.buildParams(filtros) })
      .pipe(map((s) => ({ ...s, confirmadasHoy: s.confirmadasHoy ?? 0 })));
  }

  obtenerCitasHoy(filtros?: DashboardFiltros): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/citas-hoy`, { params: this.buildParams(filtros) });
  }

  obtenerAlertasUrgentes(filtros?: DashboardFiltros): Observable<UrgentAlert[]> {
    return this.http.get<UrgentAlert[]>(`${this.apiUrl}/alertas`, { params: this.buildParams(filtros) });
  }

  obtenerPacientesRecientes(filtros?: DashboardFiltros): Observable<PacienteResumen[]> {
    return this.http.get<PacienteResumen[]>(`${this.apiUrl}/pacientes-recientes`, { params: this.buildParams(filtros) });
  }

  obtenerCatalogos(): Observable<CatalogosDashboard> {
    return this.http.get<CatalogosDashboard>(`${this.apiUrl}/catalogos`);
  }

  obtenerCitasPorMes(filtros: DashboardFiltros): Observable<SerieMes[]> {
    return this.http.get<SerieMes[]>(`${this.apiUrl}/citas-por-mes`, { params: this.buildParams(filtros) });
  }

  obtenerDistribucionFases(filtros: DashboardFiltros): Observable<DistribucionFase[]> {
    return this.http.get<DistribucionFase[]>(`${this.apiUrl}/distribucion-fases`, { params: this.buildParams(filtros) });
  }

  obtenerCasosPorProtocolo(filtros: DashboardFiltros): Observable<CasoProtocolo[]> {
    return this.http.get<CasoProtocolo[]>(`${this.apiUrl}/casos-por-protocolo`, { params: this.buildParams(filtros) });
  }

  obtenerAlertasMayoriaEdad(): Observable<AlertaMayoriaEdad[]> {
    return this.http.get<AlertaMayoriaEdad[]>(`${this.apiUrl}/alertas-mayoria-edad`);
  }

  obtenerPendientesPrioritarios(): Observable<PendientePrioritario[]> {
    return this.http.get<PendientePrioritario[]>(`${this.apiUrl}/pendientes-prioritarios`);
  }

  obtenerAccionDominante(filtros?: DashboardFiltros): Observable<AccionDominante | null> {
    return this.http.get<AccionDominante | null>(`${this.apiUrl}/accion-dominante`, {
      params: this.buildParams(filtros)
    });
  }
}
