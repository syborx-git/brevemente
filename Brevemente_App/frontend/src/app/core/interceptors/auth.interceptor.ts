import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginHttpAdapter } from '../../modules/login/adapters/login-http.adapter';

const SESSION_KEY = 'brevemente_session';

/**
 * Adjunta el access token JWT (Authorization: Bearer) a las peticiones salientes.
 * Ante un 401 sobre una petición autenticada (token expirado), ejecuta silent refresh
 * automático mediante el refresh token en cookie HttpOnly. Si el refresh falla,
 * limpia la sesión y redirige a /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const loginAdapter = inject(LoginHttpAdapter);

  const raw = localStorage.getItem(SESSION_KEY);
  let authReq = req;
  let wasAuthenticated = false;

  if (raw) {
    try {
      const session = JSON.parse(raw) as { token?: string };
      if (session?.token) {
        authReq = req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } });
        wasAuthenticated = true;
      }
    } catch {
      // sesión corrupta: se envía sin token
    }
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout');

      if (error instanceof HttpErrorResponse && error.status === 401 && wasAuthenticated && !isAuthEndpoint) {
        // Intento de Silent Refresh transparente vía cookie HttpOnly
        return loginAdapter.refrescarSesion().pipe(
          switchMap((newSession) => {
            if (newSession?.token) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newSession.token}` }
              });
              return next(retryReq);
            }
            localStorage.removeItem(SESSION_KEY);
            if (!router.url.startsWith('/login')) {
              void router.navigate(['/login']);
            }
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            localStorage.removeItem(SESSION_KEY);
            if (!router.url.startsWith('/login')) {
              void router.navigate(['/login']);
            }
            return throwError(() => refreshErr);
          })
        );
      }

      if (error instanceof HttpErrorResponse && error.status === 401 && wasAuthenticated && isAuthEndpoint) {
        localStorage.removeItem(SESSION_KEY);
        if (!router.url.startsWith('/login')) {
          void router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
