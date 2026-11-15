import { Observable } from 'rxjs';

export interface KpisPlataformaBackend {
  terapeutasActivos: number;
  pacientesActivos: number;
}

export interface IndicadorClinicoBackend {
  clave: string;
  etiqueta: string;
  valor: number;
  unidad: string;
}

export interface DesgloseIndicadorBackend {
  terapeutaId: string;
  terapeutaNombre: string;
  valor: number;
  casos: number;
}

export interface AccesoRecienteBackend {
  id: string;
  usuario: string;
  fecha: string;
}

export interface UsuarioRecienteBackend {
  id: string;
  nombre: string;
  rol: string;
  creadoEn: string;
}

export interface AlertaAdministrativaBackend {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  severidad: string;
  fecha: string;
}

export interface SaludModuloBackend {
  nombre: string;
  estado: string;
  erroresRecientes: number;
}

export interface FeatureFlagBackend {
  clave: string;
  activo: boolean;
}

export abstract class DashboardPlataformaRepository {
  abstract obtenerResumen(): Observable<{ kpis: KpisPlataformaBackend }>;
  abstract obtenerIndicadores(): Observable<IndicadorClinicoBackend[]>;
  abstract obtenerDesglose(clave: string): Observable<DesgloseIndicadorBackend[]>;
  abstract obtenerActividad(limit?: number): Observable<{ accesos: AccesoRecienteBackend[]; usuarios: UsuarioRecienteBackend[] }>;
  abstract obtenerAlertas(): Observable<{ alertas: AlertaAdministrativaBackend[] }>;
  abstract obtenerSalud(): Observable<{ modulos: SaludModuloBackend[]; featureFlags: FeatureFlagBackend[] }>;
}
