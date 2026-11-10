import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  ShieldCheck,
  BarChart3,
  LogOut
} from 'lucide-angular';
import { RoleStateService } from '../../services/role-state.service';
import { LoginRepository } from '../../../modules/login/ports/login.repository';

interface AdminNavItem {
  path?: string;
  label: string;
  icon: any;
  soon?: boolean;
}

interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/**
 * Sidebar de la zona admin (separado del sidebar clínico).
 * `Dashboard`, `Usuarios` y `Sedes` son navegables en esta fase; el resto se muestra como "Pronto".
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  sections: AdminNavSection[] = [
    {
      title: 'INICIO',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard de Plataforma', icon: LayoutDashboard }
      ]
    },
    {
      title: 'PLATAFORMA',
      items: [
        { path: '/admin/usuarios', label: 'Usuarios y Roles', icon: Users },
        { path: '/admin/sedes', label: 'Sedes y Establecimientos', icon: Building2 }
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { path: '/admin/configuracion', label: 'Configuración del Sistema', icon: Settings, soon: true },
        { path: '/admin/auditoria', label: 'Auditoría y Seguridad', icon: ShieldCheck, soon: true }
      ]
    },
    {
      title: 'ANALÍTICA',
      items: [
        { path: '/admin/reportes', label: 'Reportes de Plataforma', icon: BarChart3, soon: true }
      ]
    }
  ];

  constructor(
    protected readonly roleService: RoleStateService,
    private readonly loginRepo: LoginRepository,
    private readonly router: Router
  ) {}

  readonly logOutIcon = LogOut;

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

  getUserInitials(): string {
    const name = this.roleService.currentUserName || 'Administrador';
    const clean = name.replace(/^(Dr\.|Dra\.|Lic\.|Mtro\.|Mtra\.|Ing\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || 'A').toUpperCase();
  }
}
