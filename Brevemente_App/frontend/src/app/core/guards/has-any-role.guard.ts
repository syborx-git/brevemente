import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';
import { Role } from '../types/clinical.types';

/**
 * Guard funcional que restringe la navegación a un conjunto de roles.
 * Si el usuario no posee ninguno de los roles permitidos, se redirige a /dashboard.
 */
export function hasAnyRoleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const roleService = inject(RoleStateService);
    const router = inject(Router);

    if (roles.some((r) => roleService.hasRole(r))) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
}
