import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PendientePrioritario } from '../../ports/dashboard.repository';

/**
 * Pendientes Prioritarios (SDD-005 §4.1/§4.2): lista breve con badge "Crítico".
 */
@Component({
  selector: 'app-pendientes-prioritarios',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div class="flex justify-between items-center border-b border-slate-100 pb-2">
        <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block">Pendientes Prioritarios</span>
        <a routerLink="/pacientes" class="text-[10px] text-clinical-teal font-bold hover:underline">Ver todos</a>
      </div>

      <div class="space-y-3 text-[11px] font-semibold text-slate-600">
        @if (pendientes.length === 0) {
          <p class="text-[11px] text-slate-400 font-semibold italic text-center py-4">
            No hay pendientes clínicos. Todo al día ✅
          </p>
        } @else {
          @for (p of pendientes; track p.pacienteId) {
            <div class="flex items-start justify-between border-b border-slate-100 pb-2 gap-2">
              <div>
                <span class="font-bold text-clinical-dark block">Admisión de {{ p.nombre }}</span>
                <span class="text-[10px] text-slate-500 block">{{ p.motivo }}</span>
              </div>
              <span class="px-2 py-0.5 bg-red-100 text-red-800 text-[8px] font-bold uppercase rounded shrink-0">Crítico</span>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class PendientesPrioritariosComponent {
  @Input() pendientes: PendientePrioritario[] = [];
}
