import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Role, Permission, User } from '../types/clinical.types';

const SESSION_KEY = 'brevemente_session';

@Injectable({
  providedIn: 'root'
})
export class RoleStateService {
  // Identidad autenticada (usuario real devuelto por el backend).
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromSession());

  // Rol activo para usuarios multi-rol (permite alternar el contexto operativo).
  private readonly activeRoleSubject = new BehaviorSubject<Role>(this.getInitialActiveRole());

  // Estado de UI (no es autenticación).
  private readonly currentPatientIdSubject = new BehaviorSubject<string>('patient-1');
  private readonly isLevaOpenSubject = new BehaviorSubject<boolean>(false);

  readonly currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  readonly activeRole$: Observable<Role> = this.activeRoleSubject.asObservable();
  readonly currentPatientId$: Observable<string> = this.currentPatientIdSubject.asObservable();
  readonly isLevaOpen$: Observable<boolean> = this.isLevaOpenSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Roles reales del usuario autenticado (multi-rol). */
  get roles(): Role[] {
    return this.currentUser?.roles ?? [];
  }

  /** Rol activo actual (contexto visual y operativo). */
  get activeRole(): Role {
    return this.activeRoleSubject.value;
  }

  /** Compatibilidad hacia atrás con vistas y sidebar que consumen currentRole. */
  get currentRole(): Role {
    return this.activeRole;
  }

  /** Permisos efectivos otorgados al usuario (agregados de sus roles). */
  get permissions(): Permission[] {
    return this.currentUser?.permissions ?? [];
  }

  /** Nombre real del usuario autenticado. */
  get currentUserName(): string {
    return this.currentUser?.name ?? '';
  }

  hasRole(role: Role): boolean {
    return this.roles.includes(role);
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.permissions.includes(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => this.permissions.includes(p));
  }

  /**
   * Conmuta el rol activo si el usuario posee dicho rol.
   */
  switchActiveRole(newRole: Role): void {
    if (this.roles.includes(newRole)) {
      this.activeRoleSubject.next(newRole);
    }
  }

  setUser(user: User): void {
    this.currentUserSubject.next(user);
    if (!user.roles.includes(this.activeRole)) {
      this.activeRoleSubject.next(user.roles[0] ?? 'therapist');
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUserSubject.next(null);
    this.activeRoleSubject.next('therapist');
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

  private getInitialActiveRole(): Role {
    const user = this.loadUserFromSession();
    return user?.roles?.[0] ?? 'therapist';
  }
}
