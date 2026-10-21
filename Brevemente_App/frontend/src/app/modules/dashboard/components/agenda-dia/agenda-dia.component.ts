import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../../../core/types/clinical.types';

/**
 * Agenda del Día (SDD-005 §4.1): línea de tiempo compacta, máx. 3 citas.
 * Subtítulo "{tipo} • Presencial" y status plano en mayúsculas.
 */
@Component({
  selector: 'app-agenda-dia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div class="flex justify-between items-center border-b border-slate-100 pb-2">
        <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block">Agenda del Día</span>
        <a routerLink="/agenda" class="text-[10px] text-clinical-teal font-bold hover:underline">Ver todos</a>
      </div>

      <div class="space-y-3">
        @for (app of citas.slice(0, 3); track app.id) {
          <div class="p-3 border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-12 text-center py-1 font-bold text-[#75AFBC] bg-blue-50 border border-blue-100 rounded text-[10px]">
                {{ app.time }}
              </span>
              <div>
                <span class="font-bold text-clinical-dark block">{{ app.patientName }}</span>
                <span class="text-[9px] text-slate-500 font-semibold">{{ app.type.toUpperCase() }} • Presencial</span>
              </div>
            </div>
            <span class="text-[9px] text-slate-400 font-bold uppercase">{{ app.status }}</span>
          </div>
        }
        @if (citas.length === 0) {
          <p class="text-[11px] text-slate-400 font-semibold italic text-center py-4">No hay citas registradas para este periodo y sede.</p>
        }
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class AgendaDiaComponent {
  @Input() citas: Appointment[] = [];
}
