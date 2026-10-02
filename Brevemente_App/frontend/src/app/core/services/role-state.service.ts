import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Role, User } from '../types/clinical.types';

const SESSION_KEY = 'brevemente_session';

@Injectable({
  providedIn: 'root'
})
export class RoleStateService {
  // Identidad autenticada (usuario real devuelto por el backend).
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromSession());

  // Estado de UI (no es autenticación).
  private readonly currentPatientIdSubject = new BehaviorSubject<string>('patient-1');
  private readonly isLevaOpenSubject = new BehaviorSubject<boolean>(false);

  readonly currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  readonly currentPatientId$: Observable<string> = this.currentPatientIdSubject.asObservable();
  readonly isLevaOpen$: Observable<boolean> = this.isLevaOpenSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Roles reales del usuario autenticado (multi-rol). */
  get roles(): Role[] {
    return this.currentUser?.roles ?? [];
  }

  /** Rol primario (compatibilidad con vistas que esperan un único rol). */
  get currentRole(): Role {
    return this.roles[0] ?? 'therapist';
  }

  /** Nombre real del usuario autenticado. */
  get currentUserName(): string {
    return this.currentUser?.name ?? '';
  }

  hasRole(role: Role): boolean {
    return this.roles.includes(role);
  }

  setUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUserSubject.next(null);
  }

  get currentPatientId(): string {
    return this.currentPatientIdSubject.value;
  }

  get isLevaOpen(): boolean {
    return this.isLevaOpenSubject.value;
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

  private loadUserFromSession(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const session = JSON.parse(raw) as { user?: User };
      return session?.user ?? null;
    } catch {
      return null;
    }
  }
}
