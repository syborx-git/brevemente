import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { LinearProgressComponent } from '../linear-progress/linear-progress.component';
import { RiskSemaphoreComponent } from '../risk-semaphore/risk-semaphore.component';

export type KpiVariant = 'numerico' | 'anillo' | 'barra' | 'semaforo';

/**
 * Tarjeta KPI (SDD-005 §4.1): 4 variantes visuales no idénticas.
 *  - numerico : valor + subtexto + pie de acción.
 *  - anillo   : valor + anillo de progreso (máx. 1 por viewport).
 *  - barra    : valor + barra lineal.
 *  - semaforo : valor + badge REQUERIDO + semáforo.
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, ProgressRingComponent, LinearProgressComponent, RiskSemaphoreComponent],
  template: `
    <div
      class="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between transition-all select-none"
      [class.cursor-pointer]="clickeable"
      [class.hover:border-clinical-teal]="variant !== 'semaforo'"
      [class.hover:border-red-500]="variant === 'semaforo' && clickeable"
      (click)="onClick()"
    >
      @if (variant === 'numerico') {
        <div>
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">{{ etiqueta }}</span>
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-2xl font-extrabold text-clinical-dark block">{{ valor }}</span>
            <span class="text-[10px] text-emerald-600 font-bold block">{{ subtexto }}</span>
          </div>
        </div>
        <span class="text-[9px] text-slate-400 mt-3 block border-t border-slate-50 pt-2 font-bold uppercase">{{ pie }}</span>
      }

      @if (variant === 'anillo') {
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block">{{ etiqueta }}</span>
            <span class="text-xl font-extrabold text-clinical-dark block">{{ valor }}</span>
            <span class="text-[9px] text-emerald-600 font-bold block">{{ subtexto }}</span>
          </div>
          <app-progress-ring [percent]="anilloPct"></app-progress-ring>
        </div>
      }

      @if (variant === 'barra') {
        <div>
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">{{ etiqueta }}</span>
          <span class="text-xl font-extrabold text-clinical-dark block mt-1">{{ valor }}</span>
          <app-linear-progress [percent]="barraPct" color="#0d9488"></app-linear-progress>
        </div>
        <span class="text-[9px] text-slate-400 block font-bold mt-2 uppercase">{{ pie }}</span>
      }

      @if (variant === 'semaforo') {
        <div>
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">{{ etiqueta }}</span>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-2xl font-extrabold block" [ngClass]="esAsistente ? 'text-slate-400' : 'text-red-700'">
              {{ esAsistente ? '—' : valor }}
            </span>
            @if (!esAsistente && mostrarBadgeRequerido) {
              <span class="px-2 py-0.5 bg-red-100 text-red-800 text-[8px] font-extrabold rounded-full animate-pulse border border-red-200">
                REQUERIDO
              </span>
            }
          </div>
        </div>
        <app-risk-semaphore [alertas]="alertas" [esAsistente]="esAsistente"></app-risk-semaphore>
      }
    </div>
  `,
  styles: [':host { display: block; }']
})
export class KpiCardComponent {
  @Input() variant: KpiVariant = 'numerico';
  @Input() etiqueta = '';
  @Input() valor: number | string = 0;
  @Input() subtexto = '';
  @Input() pie = '';
  @Input() anilloPct = 0;
  @Input() barraPct = 0;
  @Input() alertas = 0;
  @Input() esAsistente = false;
  @Input() mostrarBadgeRequerido = false;

  @Output() clic = new EventEmitter<void>();

  get clickeable(): boolean {
    return this.variant !== 'semaforo' || !this.esAsistente;
  }

  onClick(): void {
    if (this.clickeable) {
      this.clic.emit();
    }
  }
}
