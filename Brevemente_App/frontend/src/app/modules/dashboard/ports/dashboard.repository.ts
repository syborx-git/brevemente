import { Observable } from 'rxjs';
import { Appointment, PacienteResumen } from '../../../core/types/clinical.types';

export interface DashboardStats {
  pacientesActivos: number;
  citasHoyCount: number;
  alertasConsentimiento: number;
  alertasRiesgo: number;
  pendientesClinicos: number;
}

export interface UrgentAlert {
  id: string;
  tipo: 'CONSENTIMIENTO' | 'RIESGO' | 'PENDIENTE_CLINICO';
  titulo: string;
  descripcion: string;
  pacienteId: string;
  pacienteNombre: string;
}

export abstract class DashboardRepository {
  abstract obtenerStats(): Observable<DashboardStats>;
  abstract obtenerCitasHoy(): Observable<Appointment[]>;
  abstract obtenerAlertasUrgentes(): Observable<UrgentAlert[]>;
  abstract obtenerPacientesRecientes(): Observable<PacienteResumen[]>;
}
