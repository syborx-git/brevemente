import { Component, Input } from '@angular/core';

/**
 * Barra de progreso lineal (SDD-005 §4.1).
 * Se usa en el KPI "Pendientes Clínicos".
 */
@Component({
  selector: 'app-linear-progress',
  standalone: true,
  template: `
    <div class="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
      <div
        class="h-full rounded-full transition-all"
        [style.width.%]="clampedPercent"
        [style.background-color]="color"
      ></div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class LinearProgressComponent {
  @Input() percent = 0;
  @Input() color = '#0d9488';

  get clampedPercent(): number {
    return Math.max(0, Math.min(100, this.percent));
  }
}
