import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpedienteRepository } from '../ports/expediente.repository';
import { ClinicalRecord, Patient, Session } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteHttpAdapter implements ExpedienteRepository {
  private readonly apiUrl = '/api/v1/expedientes';

  constructor(private readonly http: HttpClient) {}

  obtenerPaciente(pacienteId: string): Observable<Patient | null> {
    return this.http.get<Patient>(`/api/v1/pacientes/${pacienteId}`);
  }

  obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null> {
    return this.http.get<ClinicalRecord>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  obtenerSesiones(pacienteId: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/paciente/${pacienteId}/sesiones`);
  }

  agregarSesion(pacienteId: string, sesion: Omit<Session, 'id'>): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/paciente/${pacienteId}/sesiones`, sesion);
  }

  firmarConsentimiento(pacienteId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/paciente/${pacienteId}/consentimiento/firmar`, {});
  }
}
