import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Semáforo de alertas de riesgo (SDD-005 §4.1).
 * Luz roja encendida si hay alertas; asistente → luces apagadas y "No autorizado".
 */
@Component({
  selector: 'app-risk-semaphore',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1.5 mt-3 border-t border-slate-50 pt-2">
      <div
        class="w-2.5 h-2.5 rounded-full"
        [ngClass]="encendido ? 'bg-red-500 animate-pulse' : 'bg-slate-200'"
      ></div>
      <div class="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
      <span class="text-[9px] text-slate-400 block font-bold uppercase">
        {{ esAsistente ? 'No autorizado' : 'Nivel de alerta' }}
      </span>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class RiskSemaphoreComponent {
  @Input() alertas = 0;
  @Input() esAsistente = false;

  get encendido(): boolean {
    return !this.esAsistente && this.alertas > 0;
  }
}
