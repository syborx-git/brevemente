import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  LucideAngularModule, 
  Home, 
  Activity, 
  Users, 
  Calendar, 
  FolderHeart, 
  MessageSquareCode, 
  Eye 
} from 'lucide-angular';
import { RoleStateService } from '../../services/role-state.service';
import { Role } from '../../types/clinical.types';

interface NavItem {
  path: string;
  label: string;
  icon: any;
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
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    LucideAngularModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  sections: NavSection[] = [
    {
      title: 'INICIO',
      items: [
        { path: '/dashboard', label: 'Panel Principal', icon: Home, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/mi-consulta', label: 'Mi Consulta', icon: Activity, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] }
      ]
    },
    {
      title: 'OPERACIÓN CLÍNICA',
      items: [
        { path: '/pacientes', label: 'Pacientes', icon: Users, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/agenda', label: 'Agenda', icon: Calendar, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'patient'] },
        { path: '/expedientes', label: 'Expedientes', icon: FolderHeart, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] },
        { path: '/asistente-leva', label: 'LEVA', subtitle: 'Inteligencia asistiva', icon: MessageSquareCode, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] }
      ]
    },
    {
      title: 'FORMACIÓN Y DESARROLLO',
      items: [
        { path: '/supervision', label: 'Supervisión Clínica', icon: Eye, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] }
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
      case 'admin_platform': return 'Administrador Plataforma';
      case 'admin_clinical': return 'Admin Clínico';
      case 'therapist': return 'Dr. / Terapeuta';
      case 'supervisor': return 'Supervisor Clínico';
      case 'assistant': return 'Asistente Clínico';
      default: return role;
    }
  }

  getUserInitials(): string {
    const name = this.roleService.currentUserName || 'Usuario';
    const clean = name.replace(/^(Dr\.|Dra\.|Lic\.|Mtro\.|Mtra\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || 'U').toUpperCase();
  }
}
