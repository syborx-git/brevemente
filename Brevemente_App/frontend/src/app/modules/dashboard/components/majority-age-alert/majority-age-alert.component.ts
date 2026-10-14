import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlertaMayoriaEdad } from '../../ports/dashboard.repository';

/**
 * Alerta de Mayoría de Edad (SDD-005 §4.1/§4.2): banner oscuro con tarjetas
 * por paciente y botón "Ver Expediente". Visible también para asistente.
 */
@Component({
  selector: 'app-majority-age-alert',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (pacientes.length > 0) {
      <div class="bg-gradient-to-r from-slate-900 to-clinical-dark text-white p-5 rounded-2xl border border-slate-700 shadow-md space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <div class="p-2 bg-[#75AFBC]/20 border border-[#75AFBC]/30 rounded-lg text-[#75AFBC]">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <polyline points="16 11 18 13 22 9"></polyline>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-sm tracking-wide flex items-center gap-2 flex-wrap">
                Alerta de Mayoría de Edad — Reconsentimiento Autónomo Requerido
                <span class="px-2 py-0.5 bg-[#75AFBC] text-clinical-dark rounded-full text-[9px] font-extrabold uppercase">
                  {{ pacientes.length }} {{ pacientes.length === 1 ? 'paciente' : 'pacientes' }}
                </span>
              </h3>
              <p class="text-xs text-slate-300 mt-0.5">
                Se detectó que el paciente ha cumplido 18 años. El expediente pasa a requerir formalización de consentimiento autónomo directo y se prepara la revocación de notificaciones al representante.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          @for (p of pacientes; track p.pacienteId) {
            <div class="bg-white/10 border border-white/15 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <span class="font-bold text-white block text-sm">{{ p.nombre }}</span>
                <span class="text-[10px] text-slate-300 block">
                  Nacimiento: {{ p.fechaNacimiento }} • Mayoría de edad cumplida (18+ años)
                </span>
                <span class="text-[10px] text-teal-300 block mt-0.5">
                  Representante previo: {{ p.representante }} • Revocación preparada
                </span>
              </div>

              <a
                [routerLink]="['/expediente', p.pacienteId]"
                class="px-3 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-clinical-dark font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-sm"
              >
                Ver Expediente
              </a>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [':host { display: block; }']
})
export class MajorityAgeAlertComponent {
  @Input() pacientes: AlertaMayoriaEdad[] = [];
}
