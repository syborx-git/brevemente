import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccionDominante } from '../../ports/dashboard.repository';

/**
 * Acción Operativa Dominante (SDD-005 §4.1/§4.2).
 * Sin sede; chips Intake/Consentimiento/LEVA; "Preparar Sesión" oculto para asistente.
 */
@Component({
  selector: 'app-dominant-action',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-inner space-y-4">
      <div class="flex justify-between items-center border-b border-slate-200 pb-2">
        <span class="font-extrabold text-clinical-dark text-xs uppercase tracking-wider block">Acción Operativa Dominante</span>
        <span class="text-[8px] bg-[#75AFBC]/25 text-clinical-dark border border-teal-200 px-2 py-0.5 rounded font-extrabold uppercase">
          {{ accion ? 'Próxima Consulta' : 'Sin Consultas' }}
        </span>
      </div>

      @if (accion) {
        <div class="flex items-center justify-between gap-6 flex-wrap leading-normal font-semibold text-slate-600">
          <div class="flex items-start gap-4">
            <div class="bg-white p-3 rounded-lg border border-slate-200 text-center shrink-0">
              <span class="text-xl font-extrabold text-clinical-dark block">{{ accion.hora }}</span>
              <span class="text-[9px] text-slate-400 font-extrabold block uppercase mt-0.5">{{ meridiano }}</span>
            </div>
            <div>
              <span class="text-sm font-extrabold text-clinical-dark block">{{ accion.pacienteNombre }}</span>
              <span class="text-[10px] text-slate-500 block mt-0.5">
                Protocolo: {{ accion.protocolo }} • Modalidad: {{ accion.modalidad }} • Tipo: {{ accion.tipoCita.toUpperCase() }} • Duración: {{ accion.duracionMinutos }} min
              </span>
              <div class="flex items-center gap-2 mt-2 text-[9px] text-slate-400 font-bold uppercase flex-wrap">
                <span [ngClass]="accion.intakeListo ? 'text-emerald-700' : 'text-amber-600'">
                  Intake: {{ accion.intakeListo ? 'Listo' : 'Pendiente' }}
                </span>
                <span>•</span>
                <span [ngClass]="accion.consentimientoFirmado ? 'text-emerald-700' : 'text-amber-600'">
                  Consentimiento: {{ accion.consentimientoFirmado ? 'Firmado' : 'Pendiente' }}
                </span>
                <span>•</span>
                <span class="text-clinical-teal">
                  Grabación LEVA: {{ accion.grabacionLeva ? 'Autorizada' : 'Modo Manual' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right hidden sm:block">
              <span class="text-[9px] text-slate-400 font-bold uppercase block">Responsable</span>
              <span class="text-xs font-bold text-clinical-dark block">{{ accion.terapeutaNombre }}</span>
            </div>
            @if (!esAsistente) {
              <a
                [routerLink]="['/expediente', accion.pacienteId]"
                class="px-5 py-2.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                Preparar Sesión
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            }
          </div>
        </div>
      } @else {
        <div class="py-4 text-center text-slate-400">
          <svg class="w-8 h-8 text-slate-300 mx-auto mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p class="text-xs font-semibold">No hay consultas programadas para los filtros seleccionados.</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Prueba cambiando la sede, terapeuta o modalidad para ver otras consultas.</p>
        </div>
      }
    </div>
  `,
  styles: [':host { display: block; }']
})
export class DominantActionComponent {
  @Input() accion: AccionDominante | null = null;
  @Input() esAsistente = false;

  get meridiano(): string {
    if (!this.accion) {
      return '';
    }
    const hours = parseInt(this.accion.hora.split(':')[0], 10);
    return hours >= 12 ? 'PM' : 'AM';
  }
}
