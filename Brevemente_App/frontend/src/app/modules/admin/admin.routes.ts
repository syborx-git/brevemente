import { Routes } from '@angular/router';
import { AdminLayoutComponent } from '../../core/layout/admin-layout/admin-layout.component';

/**
 * Rutas de la zona de administración (/admin/*).
 * Carga lazy desde app.routes.ts. El guard (authGuard + adminPlatformGuard)
 * se aplica en la ruta padre.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard-plataforma/dashboard-plataforma.component').then(m => m.DashboardPlataformaComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'sedes',
        loadComponent: () =>
          import('./sedes/sedes.component').then(m => m.SedesComponent)
      }
    ]
  }
];
