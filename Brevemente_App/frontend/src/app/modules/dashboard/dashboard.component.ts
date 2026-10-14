import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AccionDominante,
  AlertaMayoriaEdad,
  CatalogosDashboard,
  DashboardFiltros,
  DashboardRepository,
  DashboardStats,
  PendientePrioritario,
  UrgentAlert
} from './ports/dashboard.repository';
import { DashboardLocalStorageAdapter } from './adapters/dashboard-localstorage.adapter';
import { DashboardHttpAdapter } from './adapters/dashboard-http.adapter';
import { Appointment, PacienteResumen } from '../../core/types/clinical.types';
import { SerieMes, DistribucionFase, CasoProtocolo } from '../../core/utils/dashboard-metrics';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';
import { DashboardTherapistViewComponent } from './views/dashboard-therapist-view/dashboard-therapist-view.component';
import { DashboardPatientViewComponent } from './views/dashboard-patient-view/dashboard-patient-view.component';
import { DashboardStudentViewComponent } from './views/dashboard-student-view/dashboard-student-view.component';

type DashboardVista = 'patient' | 'student' | 'therapist';

/**
 * Contenedor del dashboard (SDD-005 §4.2). Orquesta por rol (`roleService.roles`):
 * patient → dashboard-patient-view, student → dashboard-student-view,
 * resto → dashboard-therapist-view. Carga los datos desde el puerto y los pasa
 * a la vista activa.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardTherapistViewComponent,
    DashboardPatientViewComponent,
    DashboardStudentViewComponent
  ],
  providers: [
    {
      provide: DashboardRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.dashboardBackend
          ? new DashboardHttpAdapter(http)
          : new DashboardLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  filtros: DashboardFiltros = {};

  catalogos: CatalogosDashboard = { sedes: [], protocolos: [], terapeutas: [], modalidades: [] };
  stats: DashboardStats = {
    pacientesActivos: 0,
    citasHoyCount: 0,
    alertasConsentimiento: 0,
    alertasRiesgo: 0,
    pendientesClinicos: 0,
    confirmadasHoy: 0
  };
  citasHoy: Appointment[] = [];
  alertasUrgentes: UrgentAlert[] = [];
  pacientesRecientes: PacienteResumen[] = [];
  accion: AccionDominante | null = null;
  citasPorMes: SerieMes[] = [];
  fases: DistribucionFase[] = [];
  protocolos: CasoProtocolo[] = [];
  alertasMayoriaEdad: AlertaMayoriaEdad[] = [];
  pendientes: PendientePrioritario[] = [];

  constructor(
    private readonly dashboardRepo: DashboardRepository,
    public readonly roleService: RoleStateService
  ) {}

  ngOnInit(): void {
    if (this.vista === 'therapist') {
      this.cargarCatalogos();
      this.cargarDatos(this.filtros);
    }
  }

  /** Vista activa decidida por el conjunto de roles (no `activeRole`), SDD-005 §4.2. */
  get vista(): DashboardVista {
    if (this.roleService.hasRole('patient')) {
      return 'patient';
    }
    if (this.roleService.hasRole('student')) {
      return 'student';
    }
    return 'therapist';
  }

  get userName(): string {
    return this.roleService.currentUserName;
  }

  onFiltros(filtros: DashboardFiltros): void {
    this.filtros = filtros;
    this.cargarDatos(filtros);
  }

  onLimpiar(): void {
    this.filtros = {};
    this.cargarDatos({});
  }

  onTerapeutaGrafica(terapeutaId?: string): void {
    this.cargarGraficas({ ...this.filtros, terapeutaId });
  }

  private cargarCatalogos(): void {
    this.dashboardRepo.obtenerCatalogos().subscribe((c) => (this.catalogos = c));
    this.dashboardRepo.obtenerAlertasMayoriaEdad().subscribe((a) => (this.alertasMayoriaEdad = a));
    this.dashboardRepo.obtenerPendientesPrioritarios().subscribe((p) => (this.pendientes = p));
  }

  private cargarDatos(filtros: DashboardFiltros): void {
    this.dashboardRepo.obtenerStats(filtros).subscribe((s) => (this.stats = s));
    this.dashboardRepo.obtenerCitasHoy(filtros).subscribe((c) => (this.citasHoy = c));
    this.dashboardRepo.obtenerAccionDominante(filtros).subscribe((a) => (this.accion = a));
    this.dashboardRepo.obtenerAlertasUrgentes(filtros).subscribe((a) => (this.alertasUrgentes = a));
    this.dashboardRepo.obtenerPacientesRecientes(filtros).subscribe((p) => (this.pacientesRecientes = p));
    this.cargarGraficas(filtros);
  }

  private cargarGraficas(filtros: DashboardFiltros): void {
    this.dashboardRepo.obtenerCitasPorMes(filtros).subscribe((d) => (this.citasPorMes = d));
    this.dashboardRepo.obtenerDistribucionFases(filtros).subscribe((d) => (this.fases = d));
    this.dashboardRepo.obtenerCasosPorProtocolo(filtros).subscribe((d) => (this.protocolos = d));
  }
}
