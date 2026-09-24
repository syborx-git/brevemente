import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PacienteRepository } from '../ports/paciente.repository';
import { Patient } from '../../../core/types/clinical.types';
import { mockPatients } from '../../../core/data/mockData';

@Injectable({
  providedIn: 'root'
})
export class PacienteLocalStorageAdapter implements PacienteRepository {
  private readonly storageKey = 'brevemente_patients';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(mockPatients));
    }
  }

  private getStored(): Patient[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : mockPatients;
  }

  private setStored(items: Patient[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  listar(): Observable<Patient[]> {
    return of(this.getStored());
  }

  buscarPorId(id: string): Observable<Patient | null> {
    const found = this.getStored().find(p => p.id === id) || null;
    return of(found);
  }

  crear(nuevo: Omit<Patient, 'id'>): Observable<Patient> {
    const items = this.getStored();
    const created: Patient = {
      ...nuevo,
      id: `patient-${Date.now().toString(36)}`
    };
    items.unshift(created);
    this.setStored(items);
    return of(created);
  }

  actualizar(id: string, cambios: Partial<Patient>): Observable<Patient> {
    const items = this.getStored();
    const index = items.findIndex(p => p.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...cambios };
      this.setStored(items);
      return of(items[index]);
    }
    throw new Error('Paciente no encontrado');
  }
}
