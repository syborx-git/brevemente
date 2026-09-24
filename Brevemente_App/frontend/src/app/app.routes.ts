import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'pacientes',
    loadComponent: () => import('./modules/pacientes/pacientes.component').then(m => m.PacientesComponent)
  },
  {
    path: 'expedientes',
    redirectTo: 'pacientes',
    pathMatch: 'full'
  },
  {
    path: 'expediente/:id',
    loadComponent: () => import('./modules/expediente-clinico/expediente-clinico.component').then(m => m.ExpedienteClinicoComponent)
  },
  {
    path: 'agenda',
    loadComponent: () => import('./modules/agenda/agenda.component').then(m => m.AgendaComponent)
  },
  {
    path: 'asistente-leva',
    loadComponent: () => import('./modules/asistente-leva/asistente-leva.component').then(m => m.AsistenteLevaComponent)
  },
  {
    path: 'leva',
    redirectTo: 'asistente-leva',
    pathMatch: 'full'
  },
  {
    path: 'supervision',
    loadComponent: () => import('./modules/supervision/supervision.component').then(m => m.SupervisionComponent)
  },
  {
    path: 'mi-consulta',
    loadComponent: () => import('./modules/mi-consulta/mi-consulta.component').then(m => m.MiConsultaComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
