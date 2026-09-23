import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DashboardRepository, DashboardStats, UrgentAlert } from './ports/dashboard.repository';
import { DashboardLocalStorageAdapter } from './adapters/dashboard-localstorage.adapter';
import { DashboardHttpAdapter } from './adapters/dashboard-http.adapter';
import { Appointment, Patient } from '../../core/types/clinical.types';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  stats: DashboardStats = { totalPacientes: 0, citasHoyCount: 0, alertasPendientes: 0, horasSupervisadas: 0 };
  citasHoy: Appointment[] = [];
  alertasUrgentes: UrgentAlert[] = [];
  pacientesRecientes: Patient[] = [];

  constructor(
    private readonly dashboardRepo: DashboardRepository,
    public readonly roleService: RoleStateService
  ) {}

  ngOnInit(): void {
    this.dashboardRepo.obtenerStats().subscribe(s => this.stats = s);
    this.dashboardRepo.obtenerCitasHoy().subscribe(c => this.citasHoy = c);
    this.dashboardRepo.obtenerAlertasUrgentes().subscribe(a => this.alertasUrgentes = a);
    this.dashboardRepo.obtenerPacientesRecientes().subscribe(p => this.pacientesRecientes = p);
  }
}
