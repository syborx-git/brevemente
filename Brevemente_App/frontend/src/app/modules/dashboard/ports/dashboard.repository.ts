import { Observable } from 'rxjs';
import { Appointment, Patient } from '../../../core/types/clinical.types';

export interface DashboardStats {
  totalPacientes: number;
  citasHoyCount: number;
  alertasPendientes: number;
  horasSupervisadas: number;
}

export interface UrgentAlert {
  id: string;
  tipo: 'CONSENTIMIENTO' | 'RIESGO' | 'SUPERVISION';
  titulo: string;
  descripcion: string;
  pacienteId: string;
  pacienteNombre: string;
}

export abstract class DashboardRepository {
  abstract obtenerStats(): Observable<DashboardStats>;
  abstract obtenerCitasHoy(): Observable<Appointment[]>;
  abstract obtenerAlertasUrgentes(): Observable<UrgentAlert[]>;
  abstract obtenerPacientesRecientes(): Observable<Patient[]>;
}
