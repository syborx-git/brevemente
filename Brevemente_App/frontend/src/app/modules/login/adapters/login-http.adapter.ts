import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { LoginRepository, LoginCredentials, AuthSession } from '../ports/login.repository';
import { User, Role, Permission } from '../../../core/types/clinical.types';
import { environment } from '../../../../environments/environment';

/** Contrato real del backend (POST /api/v1/auth/login y /refresh). */
interface TokenResponseBackend {
  token: string;
  user: {
    id: string;
    name: string;
    roles: string[];
    permissions?: string[];
    email: string;
    license: string | null;
  };
}

const VALID_ROLES: Role[] = [
  'admin_platform',
  'admin_clinical',
  'therapist',
  'assistant',
  'supervisor',
  'patient',
  'student'
];

const VALID_PERMISSIONS: Permission[] = [
  'PACIENTES_LEER',
  'PACIENTES_CREAR',
  'PACIENTES_EDITAR',
  'PACIENTES_ELIMINAR',
  'EXPEDIENTE_LEER',
  'EXPEDIENTE_ESCRIBIR',
  'EXPEDIENTE_FIRMAR',
  'AGENDA_GESTIONAR',
  'SUPERVISION_LEER',
  'SUPERVISION_EVALUAR',
  'ADMIN_USUARIOS',
  'DASHBOARD_LEER',
  'MI_CONSULTA_LEER',
  'LEVA_USAR',
  'REPORTES_VER',
  'CONFIGURACION_SISTEMA'
];

@Injectable({ providedIn: 'root' })
export class LoginHttpAdapter implements LoginRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly sessionKey = 'brevemente_session';

  constructor(private readonly http: HttpClient) {}

  autenticar(credentials: LoginCredentials): Observable<AuthSession | null> {
    return this.http
      .post<TokenResponseBackend>(`${this.baseUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        map((res) => this.persistSession(res)),
        // 401 → credenciales inválidas; el resto de errores (500, 429, red) se propaga sin enmascararse.
        catchError((err) => (err?.status === 401 ? of(null) : throwError(() => err)))
      );
  }

  refrescarSesion(): Observable<AuthSession | null> {
    return this.http
      .post<TokenResponseBackend>(`${this.baseUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => this.persistSession(res)),
        catchError(() => {
          localStorage.removeItem(this.sessionKey);
          return of(null);
        })
      );
  }

  cerrarSesion(): Observable<void> {
    localStorage.removeItem(this.sessionKey);
    // Notifica al backend para revocar refresh tokens en BD y limpiar la cookie HttpOnly
    return this.http
      .post<void>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => of(undefined))
      );
  }

  private persistSession(res: TokenResponseBackend): AuthSession {
    const user: User = {
      id: res.user.id,
      name: res.user.name,
      roles: this.validRoles(res.user.roles),
      permissions: this.validPermissions(res.user.permissions),
      email: res.user.email,
      license: res.user.license ?? undefined
    };
    const session: AuthSession = { token: res.token, user };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    return session;
  }

  /**
   * Valida y normaliza los roles devueltos por el backend (multi-rol)
   * al contrato `User.roles: Role[]` del frontend.
   */
  private validRoles(roles: string[] | undefined): Role[] {
    return (roles ?? []).filter((r): r is Role => (VALID_ROLES as string[]).includes(r));
  }

  /**
   * Valida y normaliza los permisos devueltos por el backend (PBAC)
   * al contrato `User.permissions: Permission[]` del frontend.
   */
  private validPermissions(permissions: string[] | undefined): Permission[] {
    return (permissions ?? []).filter((p): p is Permission => (VALID_PERMISSIONS as string[]).includes(p));
  }
}
