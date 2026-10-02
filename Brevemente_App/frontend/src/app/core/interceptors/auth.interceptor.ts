import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const SESSION_KEY = 'brevemente_session';

/**
 * Adjunta el token JWT (Authorization: Bearer) a las peticiones salientes y,
 * ante un 401 sobre una petición autenticada, limpia la sesión y redirige a
 * /login (auto-logout por token inválido/expirado).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

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
      if (error instanceof HttpErrorResponse && error.status === 401 && wasAuthenticated) {
        localStorage.removeItem(SESSION_KEY);
        if (!router.url.startsWith('/login')) {
          void router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
