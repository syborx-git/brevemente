import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

/** Clave de sesión persistida por el adaptador de login (JWT + usuario). */
const SESSION_KEY = 'brevemente_session';

/**
 * Guard funcional de autenticación.
 * - Sin sesión → redirige a /login.
 * - Sesión malformada o token JWT expirado → limpia y redirige a /login.
 * - Con el flag de onboarding activo → fuerza /onboarding (salvo que ya esté ahí).
 */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const router = inject(Router);

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return router.createUrlTree(['/login']);
  }

  try {
    const session = JSON.parse(raw) as {
      token?: string;
      user?: { roles?: string[] };
      debeCambiarPassword?: boolean;
    };
    if (!session?.token || !session?.user) {
      localStorage.removeItem(SESSION_KEY);
      return router.createUrlTree(['/login']);
    }
    if (isTokenExpired(session.token)) {
      localStorage.removeItem(SESSION_KEY);
      return router.createUrlTree(['/login']);
    }
    if (session.debeCambiarPassword && state.url !== '/onboarding') {
      return router.createUrlTree(['/onboarding']);
    }
    return true;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return router.createUrlTree(['/login']);
  }
};

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return false; // sin exp → no se valida expiración
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // token ilegible → se considera expirado
  }
}

function decodeJwtPayload(token: string): unknown {
  const base64 = token.split('.')[1];
  if (!base64) {
    throw new Error('JWT sin payload');
  }
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
}
