import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleStateService } from '../../services/role-state.service';
import { Role } from '../../types/clinical.types';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  currentRole: Role = 'therapist';
  showRoleDropdown = false;

  readonly rolesList: { value: Role; label: string; badgeColor: string }[] = [
    { value: 'therapist', label: 'Terapeuta (Especialista TBE)', badgeColor: 'bg-blue-100 text-blue-800' },
    { value: 'assistant', label: 'Asistente / Secretaria', badgeColor: 'bg-orange-100 text-orange-800' },
    { value: 'supervisor', label: 'Supervisor Clínico', badgeColor: 'bg-purple-100 text-purple-800' },
    { value: 'student', label: 'Alumno (En Formación)', badgeColor: 'bg-teal-100 text-teal-800' },
    { value: 'admin_clinical', label: 'Administrador Clínico', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { value: 'admin_platform', label: 'Administrador Plataforma', badgeColor: 'bg-indigo-100 text-indigo-800' },
    { value: 'patient', label: 'Paciente (Simulador)', badgeColor: 'bg-slate-100 text-slate-800' }
  ];

  constructor(public readonly roleService: RoleStateService) {}

  ngOnInit(): void {
    this.roleService.currentRole$.subscribe((role) => {
      this.currentRole = role;
    });
  }

  toggleDropdown(): void {
    this.showRoleDropdown = !this.showRoleDropdown;
  }

  selectRole(role: Role): void {
    this.roleService.setRole(role);
    this.showRoleDropdown = false;
  }

  getRoleLabel(role: Role): string {
    const found = this.rolesList.find(r => r.value === role);
    return found ? found.label : role;
  }

  getRoleColor(role: Role): string {
    const found = this.rolesList.find(r => r.value === role);
    return found ? found.badgeColor : 'bg-slate-100 text-slate-800';
  }
}
