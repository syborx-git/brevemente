import { Observable } from 'rxjs';
import { Patient } from '../../../core/types/clinical.types';

/** Paciente creado junto con su contraseña temporal de acceso al portal. */
export interface PacienteCreado {
  paciente: Patient;
  passwordTemporal: string;
}

export abstract class PacienteRepository {
  abstract listar(): Observable<Patient[]>;
  abstract buscarPorId(id: string): Observable<Patient | null>;
  abstract crear(paciente: Omit<Patient, 'id'>): Observable<PacienteCreado>;
  abstract actualizar(id: string, paciente: Partial<Patient>): Observable<Patient>;
  abstract generarPasswordTemporal(id: string): Observable<{ passwordTemporal: string }>;
}
