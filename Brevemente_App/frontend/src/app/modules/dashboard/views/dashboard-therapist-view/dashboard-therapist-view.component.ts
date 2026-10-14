import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AccionDominante,
  AlertaMayoriaEdad,
  CatalogosDashboard,
  DashboardFiltros,
  DashboardStats,
  PendientePrioritario,
  UrgentAlert
} from '../../ports/dashboard.repository';
import { Appointment, PacienteResumen } from '../../../../core/types/clinical.types';
import { SerieMes, DistribucionFase, CasoProtocolo } from '../../../../core/utils/dashboard-metrics';
import { calcCapacidadPct, calcPendientesPct, sessionMinutes } from '../../../../core/utils/dashboard-metrics';
import { RoleStateService } from '../../../../core/services/role-state.service';
import { DashboardFiltersComponent } from '../../components/dashboard-filters/dashboard-filters.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { ClinicPerspectiveComponent } from '../../components/clinic-perspective/clinic-perspective.component';
import { MajorityAgeAlertComponent } from '../../components/majority-age-alert/majority-age-alert.component';
import { DominantActionComponent } from '../../components/dominant-action/dominant-action.component';
import { AgendaDiaComponent } from '../../components/agenda-dia/agenda-dia.component';
import { PendientesPrioritariosComponent } from '../../components/pendientes-prioritarios/pendientes-prioritarios.component';
import { DrilldownModalComponent, DrilldownFila } from '../../components/drilldown-modal/drilldown-modal.component';

type DrilldownTipo = 'risk' | 'consentimientos' | 'pacientes' | 'citas';

/**
 * Centro de Control (SDD-005 §4.2): vista para terapeuta/admin/supervisor/asistente.
 * Orquesta filtros, KPIs, gráficas, acción dominante, agenda, pendientes y drilldowns.
 */
@Component({
  selector: 'app-dashboard-therapist-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DashboardFiltersComponent,
    KpiCardComponent,
    ClinicPerspectiveComponent,
    MajorityAgeAlertComponent,
    DominantActionComponent,
    AgendaDiaComponent,
    PendientesPrioritariosComponent,
    DrilldownModalComponent
  ],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto text-xs text-slate-600 font-semibold leading-normal">
      <!-- ZONA 1: Bienvenida y contexto -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-xl font-bold text-clinical-dark flex items-center gap-2">
              <svg class="w-6 h-6 text-[#75AFBC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Centro de Control BreveMente
            </h2>
            <p class="text-[11px] text-clinical-textMuted mt-0.5">
              Visión ejecutiva de la operación clínica, las alertas y la efectividad general.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <span class="text-[10px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Actualizado: {{ lastUpdated }}
            </span>
            <a
              routerLink="/asistente-leva"
              class="px-3.5 py-1.5 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1 transition-colors"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l1.9 5.8L20 10l-5.1 3.2L12 19l-2.9-5.8L4 10l6.1-1.2z"></path>
              </svg>
              LEVA
            </a>
            <a
              routerLink="/pacientes"
              class="px-3.5 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1 transition-colors"
            >
              <span class="leading-none">+</span> Nuevo Paciente
            </a>
            <a
              routerLink="/agenda"
              class="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-clinical-dark font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-colors"
            >
              <span class="leading-none"></span> Agendar Cita
            </a>
          </div>
        </div>

        <app-dashboard-filters
          [catalogos]="catalogos"
          [filtros]="filtros"
          (filtrosChange)="onFiltros($event)"
          (limpiar)="onLimpiar()"
        ></app-dashboard-filters>
      </div>

      <!-- ZONA 5: Perspectiva Clínica Unificada (oculta para asistente) -->
      @if (!esAsistente) {
        <app-clinic-perspective
          [citasPorMes]="citasPorMes"
          [fases]="fases"
          [protocolos]="protocolos"
          [terapeutas]="catalogos.terapeutas"
          [esRolSuperior]="esRolSuperior"
          (terapeutaCambiado)="onTerapeutaGrafica($event)"
        ></app-clinic-perspective>
      }

      <!-- Alerta de Mayoría de Edad -->
      <app-majority-age-alert [pacientes]="alertasMayoriaEdad"></app-majority-age-alert>

      <!-- ZONA 2: KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-kpi-card
          variant="numerico"
          etiqueta="Citas Programadas"
          [valor]="citasHoy.length"
          [subtexto]="confirmadasHoy + ' confirmadas hoy'"
          pie="Clic para ver agenda"
          (clic)="abrirDrilldown('citas')"
        ></app-kpi-card>

        <app-kpi-card
          variant="anillo"
          etiqueta="Pacientes Activos"
          [valor]="stats.pacientesActivos"
          [subtexto]="'Capacidad al ' + capacidadPct + '%'"
          [anilloPct]="capacidadPct"
          (clic)="abrirDrilldown('pacientes')"
        ></app-kpi-card>

        <app-kpi-card
          variant="barra"
          etiqueta="Pendientes Clínicos"
          [valor]="stats.pendientesClinicos"
          [barraPct]="pendientesPct"
          pie="Límite semanal: 5"
          (clic)="abrirDrilldown('consentimientos')"
        ></app-kpi-card>

        <app-kpi-card
          variant="semaforo"
          etiqueta="Alertas de Riesgo"
          [valor]="stats.alertasRiesgo"
          [alertas]="stats.alertasRiesgo"
          [esAsistente]="esAsistente"
          [mostrarBadgeRequerido]="stats.alertasRiesgo > 0"
          (clic)="abrirDrilldown('risk')"
        ></app-kpi-card>
      </div>

      <!-- ZONA 3: Acción Operativa Dominante -->
      <app-dominant-action [accion]="accion" [esAsistente]="esAsistente"></app-dominant-action>

      <!-- ZONA 4: Agenda y Pendientes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <app-agenda-dia [citas]="citasHoy"></app-agenda-dia>
        <app-pendientes-prioritarios [pendientes]="pendientes"></app-pendientes-prioritarios>
      </div>

      <!-- Drilldown modal -->
      <app-drilldown-modal
        [abierto]="drilldown !== null"
        [subtitulo]="drilldownSubtitulo"
        [filas]="drilldownFilas"
        [vacioMensaje]="drilldownVacio"
        (cerrar)="cerrarDrilldown()"
      ></app-drilldown-modal>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class DashboardTherapistViewComponent {
  @Input() filtros: DashboardFiltros = {};
  @Input() catalogos: CatalogosDashboard = { sedes: [], protocolos: [], terapeutas: [], modalidades: [] };
  @Input() stats: DashboardStats = {
    pacientesActivos: 0,
    citasHoyCount: 0,
    alertasConsentimiento: 0,
    alertasRiesgo: 0,
    pendientesClinicos: 0,
    confirmadasHoy: 0
  };
  @Input() citasHoy: Appointment[] = [];
  @Input() citasPorMes: SerieMes[] = [];
  @Input() fases: DistribucionFase[] = [];
  @Input() protocolos: CasoProtocolo[] = [];
  @Input() alertasMayoriaEdad: AlertaMayoriaEdad[] = [];
  @Input() pendientes: PendientePrioritario[] = [];
  @Input() accion: AccionDominante | null = null;
  @Input() alertasUrgentes: UrgentAlert[] = [];
  @Input() pacientesRecientes: PacienteResumen[] = [];

  @Output() filtrosChange = new EventEmitter<DashboardFiltros>();
  @Output() limpiar = new EventEmitter<void>();
  @Output() terapeutaGrafica = new EventEmitter<string | undefined>();

  lastUpdated = 'Hace unos instantes';
  drilldown: DrilldownTipo | null = null;

  constructor(public readonly roleService: RoleStateService) {}

  get esAsistente(): boolean {
    return this.roleService.esAsistenteOperativo();
  }

  get esRolSuperior(): boolean {
    return this.roleService.esAdmin() || this.roleService.esSupervisor();
  }

  get confirmadasHoy(): number {
    return this.citasHoy.filter((a) => a.status === 'confirmada').length;
  }

  get capacidadPct(): number {
    return calcCapacidadPct(this.stats.pacientesActivos);
  }

  get pendientesPct(): number {
    return calcPendientesPct(this.stats.pendientesClinicos);
  }

  onFiltros(filtros: DashboardFiltros): void {
    this.filtros = filtros;
    this.lastUpdated = 'Hace unos instantes';
    this.filtrosChange.emit(filtros);
  }

  onLimpiar(): void {
    this.filtros = {};
    this.lastUpdated = 'Filtros restaurados y actualizados';
    this.limpiar.emit();
  }

  onTerapeutaGrafica(terapeutaId?: string): void {
    this.terapeutaGrafica.emit(terapeutaId);
  }

  abrirDrilldown(tipo: DrilldownTipo): void {
    this.drilldown = tipo;
  }

  cerrarDrilldown(): void {
    this.drilldown = null;
  }



  get drilldownSubtitulo(): string {
    switch (this.drilldown) {
      case 'risk':
        return `Pacientes en Riesgo (Nivel medio/alto) — ${this.alertasUrgentes.filter((a) => a.tipo === 'RIESGO').length}`;
      case 'consentimientos':
        return `Pacientes con Trámite Pendiente — ${this.pendientes.length}`;
      case 'pacientes':
        return `Pacientes Filtrados — ${this.pacientesRecientes.length}`;
      case 'citas':
        return `Citas Programadas (Filtradas) — ${this.citasHoy.length}`;
      default:
        return '';
    }
  }

  get drilldownVacio(): string {
    switch (this.drilldown) {
      case 'risk':
        return 'Sin pacientes en riesgo en el filtro actual.';
      case 'consentimientos':
        return 'Sin pacientes con trámite pendiente en el filtro actual.';
      case 'pacientes':
        return 'Sin pacientes en el filtro actual.';
      case 'citas':
        return 'Sin citas en el filtro actual.';
      default:
        return '';
    }
  }

  get drilldownFilas(): DrilldownFila[] {
    switch (this.drilldown) {
      case 'risk':
        return this.alertasUrgentes
          .filter((a) => a.tipo === 'RIESGO')
          .map((a) => ({
            titulo: a.pacienteNombre,
            detalle: a.descripcion,
            badge: 'Riesgo',
            badgeClase: 'bg-red-100 text-red-800 border border-red-200'
          }));
      case 'consentimientos':
        return this.pendientes.map((p) => ({
          titulo: `Admisión de ${p.nombre}`,
          detalle: p.motivo,
          badge: 'pendiente',
          badgeClase: 'bg-amber-100 text-amber-800 border border-amber-200'
        }));
      case 'pacientes':
        return this.pacientesRecientes.map((p) => ({
          titulo: p.name,
          subtitulo: `CURP: ${p.curp} · ${p.edadCalculada} años`
        }));
      case 'citas':
        return this.citasHoy.map((a) => ({
          titulo: a.patientName,
          subtitulo: `Hora: ${a.time} • Duración: ${sessionMinutes(a)} min • Fecha: ${a.date}`,
          badge: a.status.toUpperCase(),
          badgeClase: 'bg-emerald-100 text-emerald-800'
        }));
      default:
        return [];
    }
  }
}
