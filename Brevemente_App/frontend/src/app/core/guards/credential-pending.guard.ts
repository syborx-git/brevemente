import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleStateService } from '../services/role-state.service';

/**
 * Guard de la pantalla de onboarding (/onboarding).
 * Solo deja pasar si la sesión autenticada tiene el flag `debeCambiarPassword`.
 * - Sin flag (ya cambió o sesión sin flag) → redirige a la raíz.
 */
export const credentialPendingGuard: CanActivateFn = () => {
  const router = inject(Router);
  const roleState = inject(RoleStateService);

  if (roleState.debeCambiarPassword) {
    return true;
  }
  return router.createUrlTree(['/']);
};
