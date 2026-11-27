import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoleStateService } from '../../services/role-state.service';

/**
 * Candado clínico (D-13/D-14): aviso + CTA para el administrador sin identidad
 * clínica vinculada. Se muestra dentro de los módulos clínicos scoped y se
 * oculta automáticamente para el resto de perfiles.
 */
@Component({
  selector: 'app-clinical-lock',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clinical-lock.component.html'
})
export class ClinicalLockComponent {
  private readonly roleState = inject(RoleStateService);

  get visible(): boolean {
    return (
      this.roleState.esAdmin() &&
      !this.roleState.esTerapeuta() &&
      this.roleState.terapeutaIds.length === 0
    );
  }
}
