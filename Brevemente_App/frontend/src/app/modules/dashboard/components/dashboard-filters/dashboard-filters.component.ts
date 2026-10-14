import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogosDashboard, DashboardFiltros } from '../../ports/dashboard.repository';

/**
 * Barra de filtros del Centro de Control (SDD-005 §4.1).
 * Emite `filtrosChange` en cada cambio y `limpiar` al pulsar "Limpiar filtros".
 */
@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap items-center gap-3 text-[11px]">
      <div class="flex items-center gap-1 shrink-0">
        <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <span class="font-bold">Filtros:</span>
      </div>

      <select
        class="px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none"
        [value]="filtros.modalidad ?? ''"
        (change)="onModalidad($any($event.target).value)"
      >
        <option value="">Todas las Modalidades</option>
        <option value="ONLINE">Online</option>
        <option value="PRESENCIAL">Presencial</option>
      </select>

      <select
        class="px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none"
        [value]="filtros.sedeId ?? ''"
        (change)="onSede($any($event.target).value)"
      >
        <option value="">Todas las Sedes</option>
        @for (s of catalogos.sedes; track s.id) {
          <option [value]="s.id">{{ s.nombre }}</option>
        }
      </select>

      <select
        class="px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none"
        [value]="filtros.periodo ?? 'mes'"
        (change)="onPeriodo($any($event.target).value)"
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Esta semana</option>
        <option value="mes">Este mes</option>
      </select>

      <select
        class="px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none"
        [value]="filtros.terapeutaId ?? ''"
        (change)="onTerapeuta($any($event.target).value)"
      >
        <option value="">Todos los Terapeutas</option>
        @for (t of catalogos.terapeutas; track t.id) {
          <option [value]="t.id">{{ t.nombre }}</option>
        }
      </select>

      <select
        class="px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none"
        [value]="filtros.protocoloId ?? ''"
        (change)="onProtocolo($any($event.target).value)"
      >
        <option value="">Todos los Protocolos</option>
        <option value="Ataque de Pánico">Ataque de Pánico</option>
        <option value="TOC Control">TOC de Verificación</option>
      </select>

      <button
        (click)="limpiar.emit()"
        class="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg flex items-center gap-1 transition-colors ml-auto"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
        Limpiar filtros
      </button>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class DashboardFiltersComponent {
  @Input() catalogos: CatalogosDashboard = { sedes: [], protocolos: [], terapeutas: [], modalidades: [] };
  @Input() filtros: DashboardFiltros = {};

  @Output() filtrosChange = new EventEmitter<DashboardFiltros>();
  @Output() limpiar = new EventEmitter<void>();

  private emitir(nuevo: DashboardFiltros): void {
    this.filtrosChange.emit(nuevo);
  }

  onModalidad(valor: string): void {
    this.emitir({ ...this.filtros, modalidad: valor || undefined });
  }

  onSede(valor: string): void {
    this.emitir({ ...this.filtros, sedeId: valor || undefined });
  }

  onPeriodo(valor: string): void {
    this.emitir({ ...this.filtros, periodo: valor || undefined });
  }

  onTerapeuta(valor: string): void {
    this.emitir({ ...this.filtros, terapeutaId: valor || undefined });
  }

  onProtocolo(valor: string): void {
    this.emitir({ ...this.filtros, protocoloId: valor || undefined });
  }
}
