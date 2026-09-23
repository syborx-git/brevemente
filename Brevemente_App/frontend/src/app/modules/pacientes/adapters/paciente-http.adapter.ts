import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PacienteRepository } from '../ports/paciente.repository';
import { Patient } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class PacienteHttpAdapter implements PacienteRepository {
  private readonly apiUrl = '/api/v1/pacientes';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  buscarPorId(id: string): Observable<Patient | null> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  crear(paciente: Omit<Patient, 'id'>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, paciente);
  }

  actualizar(id: string, cambios: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.apiUrl}/${id}`, cambios);
  }
}
