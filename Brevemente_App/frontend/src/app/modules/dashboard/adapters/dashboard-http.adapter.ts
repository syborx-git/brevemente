import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardRepository, DashboardStats, UrgentAlert } from '../ports/dashboard.repository';
import { Appointment, Patient } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class DashboardHttpAdapter implements DashboardRepository {
  private readonly apiUrl = '/api/v1/dashboard';

  constructor(private readonly http: HttpClient) {}

  obtenerStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  obtenerCitasHoy(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/citas-hoy`);
  }

  obtenerAlertasUrgentes(): Observable<UrgentAlert[]> {
    return this.http.get<UrgentAlert[]>(`${this.apiUrl}/alertas`);
  }

  obtenerPacientesRecientes(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/pacientes-recientes`);
  }
}
