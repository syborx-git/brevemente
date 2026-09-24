import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ExpedienteRepository } from '../ports/expediente.repository';
import { ClinicalRecord, Patient, Session } from '../../../core/types/clinical.types';
import { mockClinicalRecords, mockPatients, mockSessions } from '../../../core/data/mockData';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteLocalStorageAdapter implements ExpedienteRepository {
  private readonly recordsKey = 'brevemente_records';
  private readonly patientsKey = 'brevemente_patients';
  private readonly sessionsKey = 'brevemente_sessions';

  constructor() {
    if (!localStorage.getItem(this.recordsKey)) {
      localStorage.setItem(this.recordsKey, JSON.stringify(mockClinicalRecords));
    }
    if (!localStorage.getItem(this.sessionsKey)) {
      localStorage.setItem(this.sessionsKey, JSON.stringify(mockSessions));
    }
  }

  obtenerPaciente(pacienteId: string): Observable<Patient | null> {
    const raw = localStorage.getItem(this.patientsKey);
    const patients: Patient[] = raw ? JSON.parse(raw) : mockPatients;
    const found = patients.find(p => p.id === pacienteId) || null;
    return of(found);
  }

  obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null> {
    const raw = localStorage.getItem(this.recordsKey);
    const records: ClinicalRecord[] = raw ? JSON.parse(raw) : mockClinicalRecords;
    const found = records.find(r => r.patientId === pacienteId) || records[0] || null;
    return of(found);
  }

  obtenerSesiones(pacienteId: string): Observable<Session[]> {
    const raw = localStorage.getItem(this.sessionsKey);
    const sessions: Session[] = raw ? JSON.parse(raw) : mockSessions;
    const filtered = sessions.filter(s => s.patientId === pacienteId);
    return of(filtered.length > 0 ? filtered : sessions.slice(0, 3));
  }

  agregarSesion(pacienteId: string, nueva: Omit<Session, 'id'>): Observable<Session> {
    const raw = localStorage.getItem(this.sessionsKey);
    const sessions: Session[] = raw ? JSON.parse(raw) : mockSessions;
    const created: Session = {
      ...nueva,
      id: `session-${Date.now().toString(36)}`,
      patientId: pacienteId
    };
    sessions.unshift(created);
    localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    return of(created);
  }

  firmarConsentimiento(pacienteId: string): Observable<boolean> {
    const raw = localStorage.getItem(this.patientsKey);
    const patients: Patient[] = raw ? JSON.parse(raw) : mockPatients;
    const index = patients.findIndex(p => p.id === pacienteId);
    if (index !== -1) {
      patients[index].consentimientoRepresentanteFirmado = true;
      localStorage.setItem(this.patientsKey, JSON.stringify(patients));
      return of(true);
    }
    return of(false);
  }
}
