import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitaPortal, SesionPortal } from './ports/patient-portal.repository';

interface Badge {
  label: string;
  cls: string;
}

const ASISTENCIA: Record<string, Badge> = {
  completada: { label: 'Completada', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  confirmada: { label: 'Próxima cita', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  pendiente: { label: 'Por confirmar', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  ausente: { label: 'No asistió', cls: 'bg-red-100 text-red-800 border-red-200' },
  no_presentado: { label: 'No se presentó', cls: 'bg-red-100 text-red-800 border-red-300' },
  solicita_reagendar: { label: 'Solicita reagendar', cls: 'bg-amber-100 text-amber-800 border-amber-300' }
};

const PAGO: Record<string, Badge> = {
  pagada: { label: 'Pagada', cls: 'bg-green-100 text-green-800 border-green-200' },
  pendiente: { label: 'Pendiente de pago', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  exenta: { label: 'Exenta', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
};

const TIPO: Record<string, string> = {
  primera: 'Primera sesión',
  seguimiento: 'Seguimiento',
  cierre: 'Sesión de cierre'
};

@Component({
  selector: 'app-cita-fila',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div
        class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 transition-colors"
        [ngClass]="{ 'cursor-pointer hover:bg-slate-50/60': hasPrescripciones(), 'bg-slate-50': expanded() }"
        (click)="toggle()">
        <div class="min-w-[160px]">
          <p class="text-xs font-bold text-clinical-dark capitalize">{{ fechaEs() }}</p>
          <p class="text-[10px] text-slate-400">{{ cita.time }} hrs · {{ cita.duration }} min · {{ tipo() }}</p>
        </div>

        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase {{ asistencia().cls }}">
          {{ asistencia().label }}
        </span>

        @if (pago(); as p) {
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase {{ p.cls }}">
            {{ p.label }}
          </span>
        } @else {
          <span class="text-slate-300 text-[10px] font-bold">Sin info de pago</span>
        }

        <div class="ml-auto flex items-center gap-2">
          @if (hasPrescripciones()) {
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-clinical-accent/10 text-clinical-accent rounded-full text-[10px] font-bold">
              {{ totalPrescripciones }} {{ totalPrescripciones > 1 ? 'prescripciones' : 'prescripción' }}
            </span>
            <span class="text-slate-400 text-xs">{{ expanded() ? '▲' : '▼' }}</span>
          }
        </div>
      </div>

      @if (expanded() && hasPrescripciones()) {
        <div class="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-3">
          @for (s of sesionesConPx; track s.id) {
            <div>
              <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Prescripciones asignadas en esta sesión
              </p>
              <ul class="space-y-1">
                @for (px of s.px; track px; let i = $index) {
                  <li class="flex items-start gap-2 text-xs text-slate-700">
                    <span class="w-5 h-5 bg-clinical-accent/10 text-clinical-accent rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {{ i + 1 }}
                    </span>
                    {{ px }}
                  </li>
                }
              </ul>
              @if (s.notas) {
                <div class="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Nota de seguimiento</p>
                  <p class="text-xs text-slate-600">{{ s.notas }}</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [':host { display: block; }']
})
export class CitaFilaComponent {
  @Input() cita!: CitaPortal;
  @Input() prescripciones: SesionPortal[] = [];

  readonly expanded = signal(false);

  get totalPrescripciones(): number {
    return this.prescripciones.reduce((acc, s) => acc + (s.px?.length ?? 0), 0);
  }

  get sesionesConPx(): SesionPortal[] {
    return this.prescripciones.filter((s) => (s.px?.length ?? 0) > 0);
  }

  asistencia(): Badge {
    return ASISTENCIA[this.cita.status] ?? { label: this.cita.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  pago(): Badge | null {
    return this.cita.paymentStatus ? (PAGO[this.cita.paymentStatus] ?? null) : null;
  }

  tipo(): string {
    return TIPO[this.cita.type] ?? this.cita.type;
  }

  hasPrescripciones(): boolean {
    return this.totalPrescripciones > 0;
  }

  toggle(): void {
    if (this.hasPrescripciones()) {
      this.expanded.update((v) => !v);
    }
  }

  fechaEs(): string {
    try {
      const [y, m, d] = this.cita.date.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return this.cita.date;
    }
  }
}
