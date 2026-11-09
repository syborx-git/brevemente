import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';

/**
 * Guard de la rama /admin/*: solo `admin_platform`.
 * Usa el CONJUNTO de roles (no `activeRole`) para soportar usuarios multi-rol.
 */
export const adminPlatformGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);

  if (roleService.hasRole('admin_platform')) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
