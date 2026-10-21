import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';

/**
 * Guard funcional de permisos para el dashboard (SDD-004, Fase B).
 * - Con `DASHBOARD_LEER` → permite la navegación.
 * - Sin el permiso: patient → `/mi-consulta`; resto (student / sin rol clínico) → `/` (fallback).
 */
export const permissionGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);

  if (roleService.hasPermission('DASHBOARD_LEER')) {
    return true;
  }

  if (roleService.hasRole('patient')) {
    return router.createUrlTree(['/mi-consulta']);
  }

  return router.createUrlTree(['/']);
};
