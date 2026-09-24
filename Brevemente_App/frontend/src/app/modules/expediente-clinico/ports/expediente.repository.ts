import { Observable } from 'rxjs';
import { ClinicalRecord, Patient, Session } from '../../../core/types/clinical.types';

export abstract class ExpedienteRepository {
  abstract obtenerPaciente(pacienteId: string): Observable<Patient | null>;
  abstract obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null>;
  abstract obtenerSesiones(pacienteId: string): Observable<Session[]>;
  abstract agregarSesion(pacienteId: string, sesion: Omit<Session, 'id'>): Observable<Session>;
  abstract firmarConsentimiento(pacienteId: string): Observable<boolean>;
}
