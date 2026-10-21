import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgendaRepository, CitaReprogramarPayload } from '../ports/agenda.repository';
import { Appointment, Patient, DiaNoLaborable } from '../../../core/types/clinical.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgendaHttpAdapter implements AgendaRepository {
  private readonly apiUrl = `${environment.apiBaseUrl}/citas`;
  private readonly diasUrl = `${environment.apiBaseUrl}/dias-no-laborables`;

  constructor(private readonly http: HttpClient) {}

  listarCitas(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  agendarCita(cita: Omit<Appointment, 'id'>): Observable<Appointment> {
    // Traduce el contrato Appointment al DTO del backend (CitaCreateRequest).
    const payload = {
      pacienteId: cita.patientId,
      fecha: cita.date,
      hora: cita.time,
      tipo: cita.type,
      duracionMinutos: cita.duration ?? 30,
      modalidad: cita.modality ?? 'PRESENCIAL',
      consultorio: cita.office ?? undefined
    };
    return this.http.post<Appointment>(this.apiUrl, payload);
  }

  reprogramarCita(id: string, cita: CitaReprogramarPayload): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, cita);
  }

  obtenerPacientes(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiBaseUrl}/pacientes`);
  }

  actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/estado`, { status });
  }

  listarDiasNoLaborables(): Observable<DiaNoLaborable[]> {
    return this.http.get<DiaNoLaborable[]>(this.diasUrl);
  }

  crearDiaNoLaborable(dto: Omit<DiaNoLaborable, 'id'>): Observable<DiaNoLaborable> {
    return this.http.post<DiaNoLaborable>(this.diasUrl, dto);
  }

  eliminarDiaNoLaborable(id: string): Observable<void> {
    return this.http.delete<void>(`${this.diasUrl}/${id}`);
  }
}
