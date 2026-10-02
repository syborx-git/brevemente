import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { LoginRepository, LoginCredentials, AuthSession } from '../ports/login.repository';
import { User, Role } from '../../../core/types/clinical.types';
import { environment } from '../../../../environments/environment';

/** Contrato real del backend (POST /api/v1/auth/login). */
interface TokenResponseBackend {
  token: string;
  user: {
    id: string;
    name: string;
    roles: string[];
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

@Injectable({ providedIn: 'root' })
export class LoginHttpAdapter implements LoginRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly sessionKey = 'brevemente_session';

  constructor(private readonly http: HttpClient) {}

  autenticar(credentials: LoginCredentials): Observable<AuthSession | null> {
    return this.http.post<TokenResponseBackend>(`${this.baseUrl}/login`, credentials).pipe(
      map((res) => {
        const user: User = {
          id: res.user.id,
          name: res.user.name,
          roles: this.validRoles(res.user.roles),
          email: res.user.email,
          license: res.user.license ?? undefined
        };
        const session: AuthSession = { token: res.token, user };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        return session;
      }),
      // 401 → credenciales inválidas; el resto de errores (500, red) se propaga sin enmascararse.
      catchError((err) => (err?.status === 401 ? of(null) : throwError(() => err)))
    );
  }

  cerrarSesion(): Observable<void> {
    // JWT stateless: descartar el token en el cliente es suficiente y evita
    // la incoherencia de invocar un endpoint protegido sin token.
    localStorage.removeItem(this.sessionKey);
    return of(undefined);
  }

  /**
   * Valida y normaliza los roles devueltos por el backend (multi-rol)
   * al contrato `User.roles: Role[]` del frontend.
   */
  private validRoles(roles: string[] | undefined): Role[] {
    return (roles ?? []).filter((r): r is Role => (VALID_ROLES as string[]).includes(r));
  }
}
