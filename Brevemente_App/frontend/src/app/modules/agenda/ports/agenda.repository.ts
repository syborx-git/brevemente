import { Observable, of, throwError } from 'rxjs';
import { Appointment, Patient, DiaNoLaborable } from '../../../core/types/clinical.types';

export interface CitaReprogramarPayload {
  fecha: string;
  hora: string;
  duracionMinutos: 30 | 45 | 60;
  terapeutaId?: string;
}

export abstract class AgendaRepository {
  // Contrato original (componente y mock lo consumen tal cual).
  abstract listarCitas(): Observable<Appointment[]>;
  abstract agendarCita(cita: Omit<Appointment, 'id'>): Observable<Appointment>;
  abstract obtenerPacientes(): Observable<Patient[]>;
  abstract actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment>;

  // Métodos extendidos (concretos por defecto; el mock no los implementa).
  reprogramarCita(id: string, cita: CitaReprogramarPayload): Observable<Appointment> {
    return throwError(() => new Error('Reprogramar cita no implementado en este adaptador'));
  }

  listarDiasNoLaborables(): Observable<DiaNoLaborable[]> {
    return of([]);
  }

  crearDiaNoLaborable(dto: Omit<DiaNoLaborable, 'id'>): Observable<DiaNoLaborable> {
    return throwError(() => new Error('Crear día no laborable no implementado en este adaptador'));
  }

  eliminarDiaNoLaborable(id: string): Observable<void> {
    return of(undefined);
  }
}
