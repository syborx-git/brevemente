import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccesoRecienteBackend,
  AlertaAdministrativaBackend,
  DashboardPlataformaRepository,
  DesgloseIndicadorBackend,
  FeatureFlagBackend,
  IndicadorClinicoBackend,
  KpisPlataformaBackend,
  SaludModuloBackend,
  UsuarioRecienteBackend
} from '../ports/dashboard-plataforma.repository';

@Injectable({ providedIn: 'root' })
export class DashboardPlataformaHttpAdapter extends DashboardPlataformaRepository {
  private readonly apiUrl = '/api/v1/admin/dashboard';

  constructor(private readonly http: HttpClient) {
    super();
  }

  obtenerResumen(): Observable<{ kpis: KpisPlataformaBackend }> {
    return this.http.get<{ kpis: KpisPlataformaBackend }>(`${this.apiUrl}/resumen`);
  }

  obtenerIndicadores(): Observable<IndicadorClinicoBackend[]> {
    return this.http.get<IndicadorClinicoBackend[]>(`${this.apiUrl}/indicadores-clinicos`);
  }

  obtenerDesglose(clave: string): Observable<DesgloseIndicadorBackend[]> {
    return this.http.get<DesgloseIndicadorBackend[]>(`${this.apiUrl}/indicadores-clinicos/${clave}/desglose`);
  }

  obtenerActividad(limit = 10): Observable<{ accesos: AccesoRecienteBackend[]; usuarios: UsuarioRecienteBackend[] }> {
    return this.http.get<{ accesos: AccesoRecienteBackend[]; usuarios: UsuarioRecienteBackend[] }>(
      `${this.apiUrl}/actividad-reciente?limit=${limit}`);
  }

  obtenerAlertas(): Observable<{ alertas: AlertaAdministrativaBackend[] }> {
    return this.http.get<{ alertas: AlertaAdministrativaBackend[] }>(`${this.apiUrl}/alertas-administrativas`);
  }

  obtenerSalud(): Observable<{ modulos: SaludModuloBackend[]; featureFlags: FeatureFlagBackend[] }> {
    return this.http.get<{ modulos: SaludModuloBackend[]; featureFlags: FeatureFlagBackend[] }>(
      `${this.apiUrl}/salud-plataforma`);
  }
}
