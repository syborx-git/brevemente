import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VC_ESCALA, VcEstado } from '../../../../core/constants/vc-escala';

/**
 * Selector visual de 5 estados de Valoración del Cambio (semáforo) — issue #105.
 */
@Component({
  selector: 'app-vc-semaphore',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Valoración del Cambio">
      <button
        *ngFor="let e of estados"
        type="button"
        role="radio"
        [attr.aria-checked]="estado === e.clave"
        (click)="seleccionar(e.clave)"
        [ngClass]="estado === e.clave ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'"
        class="flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-all"
        [style.borderColor]="e.color"
        [style.color]="e.color"
        [style.background]="estado === e.clave ? e.color + '22' : '#ffffff'">
        <span class="w-2 h-2 rounded-full" [style.background]="e.color"></span>
        {{ e.etiqueta }}
      </button>
    </div>
  `
})
export class VcSemaphoreComponent {
  @Input() estado: VcEstado | null = null;
  @Output() seleccion = new EventEmitter<VcEstado>();

  readonly estados = (Object.entries(VC_ESCALA) as Array<[VcEstado, { etiqueta: string; color: string; orden: number }]>)
    .map(([clave, meta]) => ({ clave, ...meta }));

  seleccionar(clave: VcEstado): void {
    this.seleccion.emit(clave);
  }
}
