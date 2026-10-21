import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoleStateService } from '../../services/role-state.service';
import { Role } from '../../types/clinical.types';
import { LoginRepository } from '../../../modules/login/ports/login.repository';

const ROLE_LABELS: Record<Role, string> = {
  admin_platform: 'Administrador Plataforma',
  admin_clinical: 'Administrador Clínico',
  therapist: 'Terapeuta',
  assistant: 'Asistente',
  supervisor: 'Supervisor Clínico',
  patient: 'Paciente',
  student: 'Alumno'
};

const ROLE_COLORS: Record<Role, string> = {
  admin_platform: 'bg-indigo-100 text-indigo-800',
  admin_clinical: 'bg-emerald-100 text-emerald-800',
  therapist: 'bg-blue-100 text-blue-800',
  assistant: 'bg-orange-100 text-orange-800',
  supervisor: 'bg-purple-100 text-purple-800',
  patient: 'bg-slate-100 text-slate-800',
  student: 'bg-teal-100 text-teal-800'
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(
    public readonly roleService: RoleStateService,
    private readonly loginRepo: LoginRepository,
    private readonly router: Router
  ) {}

  get roles(): Role[] {
    return this.roleService.roles;
  }

  get activeRole(): Role {
    return this.roleService.activeRole;
  }

  get initials(): string {
    const name = this.roleService.currentUserName.trim();
    if (!name) {
      return 'US';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  getRoleLabel(role: Role): string {
    return ROLE_LABELS[role] ?? role;
  }

  getRoleColor(role: Role): string {
    return ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-800';
  }

  selectRole(role: Role): void {
    this.roleService.switchActiveRole(role);
  }

  logout(): void {
    this.loginRepo.cerrarSesion().subscribe({
      next: () => {
        this.roleService.logout();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.roleService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
