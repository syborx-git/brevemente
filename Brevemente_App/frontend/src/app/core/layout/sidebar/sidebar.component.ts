import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RoleStateService } from '../../services/role-state.service';
import { Role } from '../../types/clinical.types';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  subtitle?: string;
  badge?: string;
  roles: Role[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  sections: NavSection[] = [
    {
      title: 'INICIO',
      items: [
        { path: '/dashboard', label: 'Panel Principal', icon: '🏠', roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/mi-consulta', label: 'Mi Consulta', icon: '🩺', roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] }
      ]
    },
    {
      title: 'OPERACIÓN CLÍNICA',
      items: [
        { path: '/pacientes', label: 'Pacientes', icon: '👥', roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/agenda', label: 'Agenda', icon: '📅', roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'patient'] },
        { path: '/expedientes', label: 'Expedientes', icon: '📁', roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] },
        { path: '/asistente-leva', label: 'LEVA', subtitle: 'Inteligencia asistiva', badge: 'IA', icon: '🧠', roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] }
      ]
    },
    {
      title: 'FORMACIÓN Y DESARROLLO',
      items: [
        { path: '/supervision', label: 'Supervisión Clínica', icon: '👁️', roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] }
      ]
    }
  ];

  constructor(public readonly roleService: RoleStateService) {}

  /** Rol primario del usuario (para la etiqueta inferior del sidebar). */
  get currentRole(): Role {
    return this.roleService.currentRole;
  }

  isItemVisible(item: NavItem): boolean {
    const userRoles = this.roleService.roles;
    return item.roles.some((r) => userRoles.includes(r));
  }

  getRoleLabel(role: Role): string {
    switch (role) {
      case 'therapist': return 'Dr. / Terapeuta';
      case 'supervisor': return 'Supervisor Clínico';
      case 'admin_clinical': return 'Admin Clínico';
      case 'assistant': return 'Asistente Clínico';
      default: return role;
    }
  }
}
