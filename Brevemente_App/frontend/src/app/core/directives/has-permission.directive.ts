import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { RoleStateService } from '../services/role-state.service';
import { Permission } from '../types/clinical.types';

/**
 * Directiva estructural para control de acceso basado en permisos (PBAC).
 *
 * Ejemplos de uso:
 *  - `<button *hasPermission="'PACIENTES_CREAR'">Nuevo Paciente</button>`
 *  - `<div *hasPermission="['PACIENTES_EDITAR', 'PACIENTES_CREAR']">Acciones</div>`
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly roleService = inject(RoleStateService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private hasView = false;

  @Input() set hasPermission(permission: Permission | Permission[] | undefined) {
    if (!permission) {
      this.show();
      return;
    }

    const perms = Array.isArray(permission) ? permission : [permission];
    const can = this.roleService.hasAnyPermission(perms);

    if (can && !this.hasView) {
      this.show();
    } else if (!can && this.hasView) {
      this.hide();
    }
  }

  private show(): void {
    this.viewContainer.createEmbeddedView(this.templateRef);
    this.hasView = true;
  }

  private hide(): void {
    this.viewContainer.clear();
    this.hasView = false;
  }
}
