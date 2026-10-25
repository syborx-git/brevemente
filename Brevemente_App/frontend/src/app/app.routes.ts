import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { pacientePortalGuard } from './core/guards/paciente-portal.guard';
import { staffOnlyGuard } from './core/guards/staff-only.guard';
import { hasAnyRoleGuard } from './core/guards/has-any-role.guard';

export const routes: Routes = [
  // Login fuera del shell: pantalla de acceso independiente.
  {
    path: 'login',
    loadComponent: () => import('./modules/login/login.component').then(m => m.LoginComponent)
  },
  // Aplicación autenticada: todo lo demás vive dentro del MainLayout (sidebar + header).
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pacientes',
        canActivate: [staffOnlyGuard],
        loadComponent: () => import('./modules/pacientes/pacientes.component').then(m => m.PacientesComponent)
      },
      {
        path: 'expedientes',
        canActivate: [staffOnlyGuard],
        loadComponent: () => import('./modules/expediente-clinico/expediente-clinico.component').then(m => m.ExpedienteClinicoComponent)
      },
      {
        path: 'expedientes/:id',
        canActivate: [staffOnlyGuard],
        loadComponent: () => import('./modules/expediente-clinico/expediente-clinico.component').then(m => m.ExpedienteClinicoComponent)
      },
      {
        path: 'expediente/:id',
        redirectTo: 'expedientes/:id'
      },
      {
        path: 'agenda',
        canActivate: [staffOnlyGuard],
        loadComponent: () => import('./modules/agenda/agenda.component').then(m => m.AgendaComponent)
      },
      {
        path: 'asistente-leva',
        canActivate: [staffOnlyGuard],
        loadComponent: () => import('./modules/asistente-leva/asistente-leva.component').then(m => m.AsistenteLevaComponent)
      },
      {
        path: 'leva',
        redirectTo: 'asistente-leva',
        pathMatch: 'full'
      },
      {
        path: 'supervision',
        canActivate: [staffOnlyGuard],
        loadComponent: () => import('./modules/supervision/supervision.component').then(m => m.SupervisionComponent)
      },
      {
        path: 'biblioteca',
        canActivate: [hasAnyRoleGuard('admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student')],
        loadComponent: () => import('./modules/biblioteca-clinica/biblioteca-clinica.component').then(m => m.BibliotecaClinicaComponent)
      },
      {
        path: 'campus',
        canActivate: [hasAnyRoleGuard('admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student')],
        loadComponent: () => import('./modules/campus/campus.component').then(m => m.CampusComponent)
      },
      {
        path: 'desempeno',
        canActivate: [hasAnyRoleGuard('admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student')],
        loadComponent: () => import('./modules/desempeno/desempeno.component').then(m => m.DesempenoComponent)
      },
      {
        path: 'configuracion',
        canActivate: [hasAnyRoleGuard('admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor')],
        loadComponent: () => import('./modules/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'auditoria',
        canActivate: [hasAnyRoleGuard('admin_platform', 'admin_clinical', 'supervisor')],
        loadComponent: () => import('./modules/auditoria-seguridad/auditoria-seguridad.component').then(m => m.AuditoriaSeguridadComponent)
      },
      {
        path: 'mi-consulta',
        canActivate: [hasAnyRoleGuard('admin_platform', 'admin_clinical', 'therapist', 'supervisor')],
        loadComponent: () => import('./modules/mi-consulta/mi-consulta.component').then(m => m.MiConsultaComponent)
      },
      {
        path: 'mi-historial',
        canActivate: [pacientePortalGuard],
        loadComponent: () => import('./modules/patient-portal/patient-portal.component').then(m => m.PatientPortalComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
