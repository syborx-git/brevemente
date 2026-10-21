import { Observable } from 'rxjs';
import { Appointment, PacienteResumen } from '../../../core/types/clinical.types';
import { SerieMes, DistribucionFase, CasoProtocolo } from '../../../core/utils/dashboard-metrics';

export interface DashboardStats {
  pacientesActivos: number;
  citasHoyCount: number;
  alertasConsentimiento: number;
  alertasRiesgo: number;
  pendientesClinicos: number;
  confirmadasHoy: number;
}

export interface UrgentAlert {
  id: string;
  tipo: 'CONSENTIMIENTO' | 'RIESGO' | 'PENDIENTE_CLINICO';
  titulo: string;
  descripcion: string;
  pacienteId: string;
  pacienteNombre: string;
}

/** Filtros comunes del Centro de Control (SDD-005 §3.1). Todos opcionales. */
export interface DashboardFiltros {
  modalidad?: string;
  sedeId?: string;
  periodo?: string;
  terapeutaId?: string;
  protocoloId?: string;
}

export interface SedeDTO {
  id: string;
  nombre: string;
}

export interface ProtocoloDTO {
  id: string;
  nombre: string;
}

export interface TerapeutaDTO {
  id: string;
  nombre: string;
}

export interface CatalogosDashboard {
  sedes: SedeDTO[];
  protocolos: ProtocoloDTO[];
  terapeutas: TerapeutaDTO[];
  modalidades: string[];
}

export interface AlertaMayoriaEdad {
  pacienteId: string;
  nombre: string;
  fechaNacimiento: string;
  representante: string;
}

export interface PendientePrioritario {
  pacienteId: string;
  nombre: string;
  horaCita: string;
  motivo: string;
}

/** Acción Operativa Dominante (SDD-005 §3.2, sin `sede`). */
export interface AccionDominante {
  citaId: string;
  pacienteId: string;
  pacienteNombre: string;
  terapeutaNombre: string;
  fecha: string;
  hora: string;
  tipoCita: string;
  modalidad: string;
  duracionMinutos: number;
  protocolo: string;
  intakeListo: boolean;
  consentimientoFirmado: boolean;
  grabacionLeva: boolean;
}

export abstract class DashboardRepository {
  // Métodos existentes (ahora aceptan DashboardFiltros).
  abstract obtenerStats(filtros?: DashboardFiltros): Observable<DashboardStats>;
  abstract obtenerCitasHoy(filtros?: DashboardFiltros): Observable<Appointment[]>;
  abstract obtenerAlertasUrgentes(filtros?: DashboardFiltros): Observable<UrgentAlert[]>;
  abstract obtenerPacientesRecientes(filtros?: DashboardFiltros): Observable<PacienteResumen[]>;

  // Métodos nuevos (SDD-005 §4.4).
  abstract obtenerCatalogos(): Observable<CatalogosDashboard>;
  abstract obtenerCitasPorMes(filtros: DashboardFiltros): Observable<SerieMes[]>;
  abstract obtenerDistribucionFases(filtros: DashboardFiltros): Observable<DistribucionFase[]>;
  abstract obtenerCasosPorProtocolo(filtros: DashboardFiltros): Observable<CasoProtocolo[]>;
  abstract obtenerAlertasMayoriaEdad(): Observable<AlertaMayoriaEdad[]>;
  abstract obtenerPendientesPrioritarios(): Observable<PendientePrioritario[]>;

  // Acción dominante (SDD-005 §3.1/§3.2), alimenta el componente `dominant-action`.
  abstract obtenerAccionDominante(filtros?: DashboardFiltros): Observable<AccionDominante | null>;
}
