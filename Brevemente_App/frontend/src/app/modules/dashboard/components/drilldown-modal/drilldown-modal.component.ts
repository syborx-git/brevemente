import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DrilldownFila {
  titulo: string;
  subtitulo?: string;
  detalle?: string;
  badge?: string;
  badgeClase?: string;
}

/**
 * Modal genérico de drilldown (SDD-005 §4.1).
 * Reutiliza los datos ya filtrados (no requiere endpoints nuevos).
 */
@Component({
  selector: 'app-drilldown-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (abierto) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-xs text-slate-600 font-semibold">
          <div class="bg-clinical-dark p-4 text-white flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
              <svg class="w-5 h-5 text-[#75AFBC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Detalle del Centro de Control
            </h3>
            <button (click)="cerrar.emit()" class="text-slate-400 hover:text-white font-bold text-sm">✕</button>
          </div>

          <div class="p-5 space-y-4 max-h-[350px] overflow-y-auto leading-normal">
            <span class="font-bold text-clinical-dark block uppercase border-b border-slate-100 pb-1.5">{{ subtitulo }}</span>

            @if (filas.length === 0) {
              <div class="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center text-slate-400">
                {{ vacioMensaje }}
              </div>
            } @else {
              @for (f of filas; track f.titulo) {
                <div class="py-2.5 flex justify-between items-center gap-2">
                  <div class="min-w-0">
                    <span class="font-extrabold text-clinical-dark block">{{ f.titulo }}</span>
                    @if (f.subtitulo) {
                      <span class="text-[9px] text-slate-500 uppercase">{{ f.subtitulo }}</span>
                    }
                    @if (f.detalle) {
                      <p class="text-slate-600 mt-1 leading-normal font-medium">{{ f.detalle }}</p>
                    }
                  </div>
                  @if (f.badge) {
                    <span class="px-2 py-0.5 text-[9px] font-bold uppercase rounded shrink-0" [ngClass]="f.badgeClase ?? 'bg-slate-100 text-slate-500'">
                      {{ f.badge }}
                    </span>
                  }
                </div>
              }
            }
          </div>

          <div class="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
            <button (click)="cerrar.emit()" class="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 text-xs">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [':host { display: block; }']
})
export class DrilldownModalComponent {
  @Input() abierto = false;
  @Input() subtitulo = '';
  @Input() filas: DrilldownFila[] = [];
  @Input() vacioMensaje = '';

  @Output() cerrar = new EventEmitter<void>();
}
