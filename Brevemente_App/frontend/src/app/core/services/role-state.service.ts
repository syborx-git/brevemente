import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Role } from '../types/clinical.types';

export const USER_NAMES: Record<Role, string> = {
  admin_platform: 'Ing. Rodrigo Pérez',
  admin_clinical: 'Dra. Patricia Ortiz',
  therapist: 'Dr. Alejandro Silva',
  assistant: 'Marta Gómez',
  supervisor: 'Dra. Isabel Cárdenas',
  patient: 'Sofía Martínez',
  student: 'Carlos Mendoza'
};

@Injectable({
  providedIn: 'root'
})
export class RoleStateService {
  private readonly currentRoleSubject = new BehaviorSubject<Role>('therapist');
  private readonly currentPatientIdSubject = new BehaviorSubject<string>('patient-1');
  private readonly isLevaOpenSubject = new BehaviorSubject<boolean>(false);

  readonly currentRole$: Observable<Role> = this.currentRoleSubject.asObservable();
  readonly currentPatientId$: Observable<string> = this.currentPatientIdSubject.asObservable();
  readonly isLevaOpen$: Observable<boolean> = this.isLevaOpenSubject.asObservable();

  get currentRole(): Role {
    return this.currentRoleSubject.value;
  }

  get currentPatientId(): string {
    return this.currentPatientIdSubject.value;
  }

  get isLevaOpen(): boolean {
    return this.isLevaOpenSubject.value;
  }

  get currentUserName(): string {
    return USER_NAMES[this.currentRole];
  }

  setRole(role: Role): void {
    this.currentRoleSubject.next(role);
    localStorage.setItem('brevemente_role', role);
  }

  setPatientId(patientId: string): void {
    this.currentPatientIdSubject.next(patientId);
  }

  toggleLeva(): void {
    this.isLevaOpenSubject.next(!this.isLevaOpenSubject.value);
  }

  setLevaOpen(open: boolean): void {
    this.isLevaOpenSubject.next(open);
  }
}
