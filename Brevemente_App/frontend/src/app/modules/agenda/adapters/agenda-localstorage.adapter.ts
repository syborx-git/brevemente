import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AgendaRepository } from '../ports/agenda.repository';
import { Appointment, Patient } from '../../../core/types/clinical.types';
import { mockAppointments, mockPatients } from '../../../core/data/mockData';

@Injectable({
  providedIn: 'root'
})
export class AgendaLocalStorageAdapter implements AgendaRepository {
  private readonly appointmentsKey = 'brevemente_appointments';
  private readonly patientsKey = 'brevemente_patients';

  constructor() {
    if (!localStorage.getItem(this.appointmentsKey)) {
      localStorage.setItem(this.appointmentsKey, JSON.stringify(mockAppointments));
    }
  }

  private getAppointments(): Appointment[] {
    const raw = localStorage.getItem(this.appointmentsKey);
    return raw ? JSON.parse(raw) : mockAppointments;
  }

  listarCitas(): Observable<Appointment[]> {
    return of(this.getAppointments());
  }

  agendarCita(nueva: Omit<Appointment, 'id'>): Observable<Appointment> {
    const items = this.getAppointments();
    const created: Appointment = {
      ...nueva,
      id: `appointment-${Date.now().toString(36)}`
    };
    items.unshift(created);
    localStorage.setItem(this.appointmentsKey, JSON.stringify(items));
    return of(created);
  }

  obtenerPacientes(): Observable<Patient[]> {
    const raw = localStorage.getItem(this.patientsKey);
    return of(raw ? JSON.parse(raw) : mockPatients);
  }

  actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment> {
    const items = this.getAppointments();
    const index = items.findIndex(a => a.id === id);
    if (index !== -1) {
      items[index].status = status;
      localStorage.setItem(this.appointmentsKey, JSON.stringify(items));
      return of(items[index]);
    }
    throw new Error('Cita no encontrada');
  }
}
