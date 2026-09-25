import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { PacienteRepository } from '../ports/paciente.repository';
import { Patient } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class PacienteHttpAdapter implements PacienteRepository {
  private readonly apiUrl = '/api/v1/pacientes';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('[PacienteHttpAdapter] Error al listar pacientes:', err);
        return throwError(() => new Error('Error al consultar el directorio de pacientes en el backend'));
      })
    );
  }

  buscarPorId(id: string): Observable<Patient | null> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        console.error(`[PacienteHttpAdapter] Error al buscar paciente ${id}:`, err);
        return throwError(() => new Error('Error al obtener el expediente del paciente'));
      })
    );
  }

  crear(paciente: Omit<Patient, 'id'>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, paciente).pipe(
      catchError(err => {
        console.error('[PacienteHttpAdapter] Error al registrar paciente:', err);
        return throwError(() => new Error('No se pudo registrar el paciente en el servidor'));
      })
    );
  }

  actualizar(id: string, cambios: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.apiUrl}/${id}`, cambios).pipe(
      catchError(err => {
        console.error(`[PacienteHttpAdapter] Error al actualizar paciente ${id}:`, err);
        return throwError(() => new Error('No se pudo actualizar el paciente en el servidor'));
      })
    );
  }
}
