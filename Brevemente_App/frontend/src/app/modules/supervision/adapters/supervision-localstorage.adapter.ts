import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SupervisionRepository } from '../ports/supervision.repository';
import { SupervisionLog } from '../../../core/types/clinical.types';

const INITIAL_SUPERVISION_LOGS: SupervisionLog[] = [
  {
    id: 'sup-1',
    date: '2026-08-18',
    supervisorName: 'Dra. Isabel Cárdenas',
    supervisorLicense: 'CED-9988221-MX',
    patientId: 'patient-1',
    patientName: 'Sofía Martínez',
    therapistId: 'therapist-1',
    therapistName: 'Dr. Alejandro Silva',
    sessionNumber: 2,
    problemDefinition: 'Ataques de pánico agudos con pérdida de control percibida.',
    currentSituation: 'Favorable tras prescripción de Diario de a Bordo.',
    spr: 'SPR Fóbico',
    ts: 'Ataque de Pánico',
    therapistProblem: 'Resistencia sutil cuando la paciente realiza la peor fantasía sola.',
    rst: 'Fantasía del peor escenario: "Míralo a los ojos y el fantasma desaparecerá".',
    px: 'Worry-Time (30 min diario) + Diario de a Bordo.',
    eff: 'Excelente disminución del miedo anticipatorio.',
    doubt: '¿Cómo modular la resistencia en transporte público?',
    blocking: 'Evitación del metro y aglomeraciones.',
    observations: 'Aplicar redefinición paradójica en la evitación sin confrontar directamente.',
    recommendations: 'Prescribir pequeños simulacros voluntarios en el metro.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class SupervisionLocalStorageAdapter implements SupervisionRepository {
  private readonly storageKey = 'brevemente_supervision_logs';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_SUPERVISION_LOGS));
    }
  }

  private getStored(): SupervisionLog[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : INITIAL_SUPERVISION_LOGS;
  }

  listarLogs(): Observable<SupervisionLog[]> {
    return of(this.getStored());
  }

  agregarLog(nuevo: Omit<SupervisionLog, 'id'>): Observable<SupervisionLog> {
    const items = this.getStored();
    const created: SupervisionLog = {
      ...nuevo,
      id: `sup-${Date.now().toString(36)}`
    };
    items.unshift(created);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return of(created);
  }
}
