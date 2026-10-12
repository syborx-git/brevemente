import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardRepository, DashboardStats, UrgentAlert } from '../ports/dashboard.repository';
import { Appointment, PacienteResumen, Patient } from '../../../core/types/clinical.types';
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

  private static hoy(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  obtenerStats(): Observable<DashboardStats> {
    const patients = this.getPatients();
    const appointments = this.getAppointments();
    const hoy = DashboardLocalStorageAdapter.hoy();

    const stats: DashboardStats = {
      pacientesActivos: patients.filter(p => p.status === 'activo').length,
      citasHoyCount: appointments.filter(a => a.date === hoy).length,
      alertasConsentimiento: patients.filter(p => p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado).length,
      alertasRiesgo: patients.filter(p => p.riskLevel === 'medio' || p.riskLevel === 'alto').length,
      pendientesClinicos: patients.filter(p => p.status === 'pendiente').length
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

    const riesgo = patients.find(p => p.riskLevel === 'medio' || p.riskLevel === 'alto');
    if (riesgo) {
      alerts.push({
        id: 'al-02',
        tipo: 'RIESGO',
        titulo: 'Paciente con Nivel de Riesgo Elevado',
        descripcion: `El paciente ${riesgo.name} presenta nivel de riesgo ${riesgo.riskLevel}; se recomienda revisión prioritaria.`,
        pacienteId: riesgo.id,
        pacienteNombre: riesgo.name
      });
    }

    const pendiente = patients.find(p => p.status === 'pendiente');
    if (pendiente) {
      alerts.push({
        id: 'al-03',
        tipo: 'PENDIENTE_CLINICO',
        titulo: 'Paciente Pendiente de Valoración Clínica',
        descripcion: `El paciente ${pendiente.name} está en estado pendiente y requiere valoración clínica.`,
        pacienteId: pendiente.id,
        pacienteNombre: pendiente.name
      });
    }

    return of(alerts);
  }

  obtenerPacientesRecientes(): Observable<PacienteResumen[]> {
    return of(this.getPatients().slice(0, 4));
  }
}
