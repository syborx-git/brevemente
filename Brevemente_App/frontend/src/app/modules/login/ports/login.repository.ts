import { Observable } from 'rxjs';
import { User } from '../../../core/types/clinical.types';

/** Credenciales de acceso enviadas por el formulario de login. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Sesión autenticada devuelta tras un login exitoso. */
export interface AuthSession {
  token: string;
  user: User;
}

/**
 * Puerto secundario del módulo Log In (ADR-001 / ADR-002).
 * Define el contrato de autenticación sin acoplarse a la fuente de datos
 * (LocalStorage en Fase 0, API REST en Fase 3).
 */
export abstract class LoginRepository {
  abstract autenticar(credentials: LoginCredentials): Observable<AuthSession | null>;
  abstract cerrarSesion(): Observable<void>;
}
