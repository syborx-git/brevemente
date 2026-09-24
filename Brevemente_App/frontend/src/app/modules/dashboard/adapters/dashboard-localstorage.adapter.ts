import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardRepository, DashboardStats, UrgentAlert } from '../ports/dashboard.repository';
import { Appointment, Patient } from '../../../core/types/clinical.types';
import { mockAppointments, mockPatients } from '../../../core/data/mockData';

@Injectable({
  providedIn: 'root'
})
export class DashboardLocalStorageAdapter implements DashboardRepository {
  private readonly patientsKey = 'brevemente_patients';
  private readonly appointmentsKey = 'brevemente_appointments';

  constructor() {
    if (!localStorage.getItem(this.patientsKey)) {
      localStorage.setItem(this.patientsKey, JSON.stringify(mockPatients));
    }
    if (!localStorage.getItem(this.appointmentsKey)) {
      localStorage.setItem(this.appointmentsKey, JSON.stringify(mockAppointments));
    }
  }

  private getPatients(): Patient[] {
    const raw = localStorage.getItem(this.patientsKey);
    return raw ? JSON.parse(raw) : mockPatients;
  }

  private getAppointments(): Appointment[] {
    const raw = localStorage.getItem(this.appointmentsKey);
    return raw ? JSON.parse(raw) : mockAppointments;
  }

  obtenerStats(): Observable<DashboardStats> {
    const patients = this.getPatients();
    const appointments = this.getAppointments();

    const stats: DashboardStats = {
      totalPacientes: patients.length,
      citasHoyCount: appointments.filter(a => a.status !== 'cancelada').length,
      alertasPendientes: patients.filter(p => p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado).length,
      horasSupervisadas: 34
    };
    return of(stats);
  }

  obtenerCitasHoy(): Observable<Appointment[]> {
    return of(this.getAppointments().slice(0, 5));
  }

  obtenerAlertasUrgentes(): Observable<UrgentAlert[]> {
    const patients = this.getPatients();
    const alerts: UrgentAlert[] = [];

    const representado = patients.find(p => p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado);
    if (representado) {
      alerts.push({
        id: 'al-01',
        tipo: 'CONSENTIMIENTO',
        titulo: 'Falta Firma de Persona de Apoyo',
        descripcion: `El paciente ${representado.name} (${representado.edadCalculada} años) tiene citas bloqueadas hasta formalizar el consentimiento en expediente.`,
        pacienteId: representado.id,
        pacienteNombre: representado.name
      });
    }

    return of(alerts);
  }

  obtenerPacientesRecientes(): Observable<Patient[]> {
    return of(this.getPatients().slice(0, 4));
  }
}
