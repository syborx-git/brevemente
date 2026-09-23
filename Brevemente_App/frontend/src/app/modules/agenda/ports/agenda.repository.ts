import { Observable } from 'rxjs';
import { Appointment, Patient } from '../../../core/types/clinical.types';

export abstract class AgendaRepository {
  abstract listarCitas(): Observable<Appointment[]>;
  abstract agendarCita(cita: Omit<Appointment, 'id'>): Observable<Appointment>;
  abstract obtenerPacientes(): Observable<Patient[]>;
  abstract actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment>;
}
