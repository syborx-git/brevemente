import { Component, Input } from '@angular/core';

/**
 * Anillo de progreso SVG (SDD-005 §4.1).
 * Máximo 1 por viewport (se usa solo en el KPI "Pacientes Activos").
 */
@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <div class="relative w-12 h-12 shrink-0">
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          class="text-slate-100"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        ></path>
        <path
          stroke="#75AFBC"
          [attr.stroke-dasharray]="clampedPercent + ', 100'"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        ></path>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-slate-600">
        {{ clampedPercent }}%
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class ProgressRingComponent {
  @Input() percent = 0;

  get clampedPercent(): number {
    return Math.max(0, Math.min(100, this.percent));
  }
}
