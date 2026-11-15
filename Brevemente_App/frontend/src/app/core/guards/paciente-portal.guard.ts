import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';

/**
 * Guard del portal del paciente: requiere el permiso MIS_CITAS_LEER
 * (asignado a rol-006 en V6). El resto redirige a /dashboard.
 */
export const pacientePortalGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);

  if (roleService.hasPermission('MIS_CITAS_LEER')) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
