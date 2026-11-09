import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';

/**
 * Resuelve el aterrizaje ("home") según el rol del usuario.
 * Precedencia multi-rol: patient → admin_platform → resto.
 * Se usa en las rutas raíz (`''` y `**`) y en el redirect post-login.
 */
export const homeRedirectGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);

  if (roleService.hasRole('patient')) {
    return router.createUrlTree(['/mi-historial']);
  }
  if (roleService.hasRole('admin_platform')) {
    return router.createUrlTree(['/admin/dashboard']);
  }
  return router.createUrlTree(['/dashboard']);
};
