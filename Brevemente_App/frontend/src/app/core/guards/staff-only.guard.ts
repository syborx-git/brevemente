import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';

/**
 * Guard que blinda las rutas de staff contra el rol patient:
 * el patient es redirigido a su portal (/mi-historial).
 */
export const staffOnlyGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);

  if (roleService.hasRole('patient')) {
    return router.createUrlTree(['/mi-historial']);
  }
  return true;
};
