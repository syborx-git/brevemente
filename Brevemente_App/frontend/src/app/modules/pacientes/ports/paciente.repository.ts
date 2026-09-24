import { Observable } from 'rxjs';
import { Patient } from '../../../core/types/clinical.types';

export abstract class PacienteRepository {
  abstract listar(): Observable<Patient[]>;
  abstract buscarPorId(id: string): Observable<Patient | null>;
  abstract crear(paciente: Omit<Patient, 'id'>): Observable<Patient>;
  abstract actualizar(id: string, paciente: Partial<Patient>): Observable<Patient>;
}
