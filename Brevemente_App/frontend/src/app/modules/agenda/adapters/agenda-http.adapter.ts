import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgendaRepository } from '../ports/agenda.repository';
import { Appointment, Patient } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class AgendaHttpAdapter implements AgendaRepository {
  private readonly apiUrl = '/api/v1/citas';

  constructor(private readonly http: HttpClient) {}

  listarCitas(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  agendarCita(cita: Omit<Appointment, 'id'>): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, cita);
  }

  obtenerPacientes(): Observable<Patient[]> {
    return this.http.get<Patient[]>('/api/v1/pacientes');
  }

  actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/estado`, { status });
  }
}
