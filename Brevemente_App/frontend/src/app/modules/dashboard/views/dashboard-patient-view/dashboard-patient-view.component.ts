import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PuntoEvolucion {
  name: string;
  yo: number;
  demas: number;
  mundo: number;
}

interface LineaSerie {
  clave: string;
  color: string;
  puntos: string;
}

interface Leyenda {
  color: string;
  label: string;
}

/**
 * Vista del dashboard para el rol paciente (SDD-005 §4.2).
 * Réplica exacta de la sección `userRole === 'patient'` de la demo React:
 * banner de bienvenida, botón de crisis, próxima consulta, tareas terapéuticas,
 * evolución de cambio (SVG puro), LEVA Paciente, información de la clínica y
 * modal de crisis con teléfonos de auxilio.
 */
@Component({
  selector: 'app-dashboard-patient-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Banner de Bienvenida Paciente -->
      <div class="bg-gradient-to-r from-[#304768] to-[#75AFBC] text-white p-6 rounded-xl shadow-md space-y-2">
        <div class="flex justify-between items-start flex-wrap gap-4">
          <div>
            <span class="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Mi Portal de Terapia</span>
            <h2 class="text-xl font-bold mt-1.5">¡Hola, {{ nombre }}!</h2>
            <p class="text-xs text-white/80 font-medium mt-0.5">Espacio confidencial para el seguimiento de tu proceso de salud mental.</p>
          </div>
          <button
            (click)="mostrarCrisis = true"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-md animate-pulse shrink-0 flex items-center gap-1.5 border border-red-400"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            ⚠️ BOTÓN DE CRISIS
          </button>
        </div>
      </div>

      <!-- Grid Principal del Paciente -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Citas y Tareas -->
        <div class="md:col-span-2 space-y-6">
          <!-- Próxima Consulta -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Mi Próxima Consulta</span>
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-3">
                <div class="bg-teal-50 text-clinical-teal p-3 rounded-xl border border-teal-100">
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <span class="text-xs font-bold text-clinical-dark block">Hoy, 24 de Agosto de 2026</span>
                  <span class="text-[10px] font-semibold text-slate-500 block mt-0.5">Horario: 09:00 AM — Modalidad: Presencial (Sede Centro)</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-500 block font-bold">Terapeuta Responsable:</span>
                <span class="text-xs font-extrabold text-clinical-dark block">Dr. Alejandro Silva</span>
              </div>
            </div>
          </div>

          <!-- Tareas Terapéuticas Activas -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Mis Tareas Terapéuticas Activas</span>
            <p class="text-[11px] text-slate-500 leading-normal font-semibold">Realiza tus tareas asignadas tal como las indicó tu especialista. Esto forma parte central del tratamiento estratégico.</p>

            <div class="space-y-3 leading-normal font-semibold text-slate-700">
              <div class="bg-slate-50 border-l-4 border-l-[#75AFBC] p-4 rounded-r-xl">
                <div class="flex justify-between items-start gap-2">
                  <span class="font-bold text-clinical-dark block">1. Diario de a Bordo</span>
                  <span class="text-[8px] bg-clinical-teal/10 text-clinical-teal border border-teal-200/30 px-2 py-0.5 rounded font-extrabold">En Curso</span>
                </div>
                <p class="text-xs text-slate-600 mt-1 font-medium">
                  "Anotar en la libreta cada ataque de pánico justo en el momento en que ocurra, registrando la hora, síntomas y pensamientos."
                </p>
                <span class="text-[9px] text-slate-400 block mt-2">Asignado por: <b>Dr. Alejandro Silva</b> (Sesión 1)</span>
              </div>

              <div class="bg-slate-50 border-l-4 border-l-[#304768] p-4 rounded-r-xl">
                <div class="flex justify-between items-start gap-2">
                  <span class="font-bold text-clinical-dark block">2. La Peor Fantasía</span>
                  <span class="text-[8px] bg-clinical-teal/10 text-clinical-teal border border-teal-200/30 px-2 py-0.5 rounded font-extrabold">En Curso</span>
                </div>
                <p class="text-xs text-slate-600 mt-1 font-medium">
                  "Elegir un horario fijo al día (ej. 18:00 hrs) para encerrarse a solas por 30 minutos y evocar voluntariamente sus peores temores hasta que la ansiedad disminuya."
                </p>
                <span class="text-[9px] text-slate-400 block mt-2">Asignado por: <b>Dr. Alejandro Silva</b> (Sesión 2)</span>
              </div>
            </div>
          </div>

          <!-- Evolución Clínica Personal -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Mi Evolución de Cambio</span>
            <p class="text-[11px] text-slate-400 leading-normal font-semibold">Gráfica agregada que muestra tus niveles de bienestar percibido en las esferas relacionales.</p>
            <div class="flex items-center gap-4 flex-wrap text-[10px] font-bold text-slate-600">
              @for (l of leyendas; track l.label) {
                <span class="flex items-center gap-1.5">
                  <span class="w-3 h-1 rounded-full" [style.background-color]="l.color"></span>
                  {{ l.label }}
                </span>
              }
            </div>
            <div class="h-56">
              <svg class="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet">
                @for (g of gridLineas; track g.valor) {
                  <line x1="44" [attr.y1]="g.y" x2="580" [attr.y2]="g.y" stroke="#e2e8f0" stroke-dasharray="3 3"></line>
                  <text x="38" [attr.y]="g.y + 3" text-anchor="end" font-size="10" font-weight="bold" fill="#94a3b8">{{ g.valor }}</text>
                }
                @for (l of lineas; track l.clave) {
                  <polyline [attr.points]="l.puntos" fill="none" [attr.stroke]="l.color" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
                }
                @for (s of series; track s.name; let i = $index) {
                  <text [attr.x]="xDe(i)" y="232" text-anchor="middle" font-size="10" font-weight="bold" fill="#64748b">{{ s.name }}</text>
                }
              </svg>
            </div>
          </div>
        </div>

        <!-- LEVA Paciente y Contacto -->
        <div class="space-y-6">
          <!-- LEVA Paciente Helper -->
          <div class="bg-[#75AFBC]/5 border border-[#75AFBC]/20 rounded-xl p-5 shadow-sm space-y-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-clinical-teal animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l1.9 5.8L20 10l-5.1 3.2L12 19l-2.9-5.8L4 10l6.1-1.2z"></path>
              </svg>
              <span class="font-extrabold text-clinical-dark text-xs uppercase tracking-wide">LEVA Paciente</span>
            </div>
            <p class="text-slate-600 font-semibold leading-relaxed text-xs">
              Hola, {{ nombre }}. Soy <b>LEVA Paciente</b>. Puedo resolver dudas sobre cómo realizar tus tareas asignadas o explicarte el modelo de terapia de Arezzo.
            </p>

            <div class="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
              <span class="text-[10px] text-slate-400 font-bold block uppercase">Preguntas sugeridas:</span>
              <button
                (click)="responder('diario')"
                class="w-full text-left px-2.5 py-1.5 border border-slate-100 hover:border-clinical-teal rounded text-[10px] font-bold text-slate-600 bg-slate-50/50 block transition-all"
              >
                ¿Cómo completo el Diario de a Bordo?
              </button>
              <button
                (click)="responder('fantasia')"
                class="w-full text-left px-2.5 py-1.5 border border-slate-100 hover:border-clinical-teal rounded text-[10px] font-bold text-slate-600 bg-slate-50/50 block transition-all"
              >
                ¿Para qué sirve la Peor Fantasía?
              </button>
            </div>
          </div>

          <!-- Datos de Contacto de Clínica -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Información de la Clínica</span>
            <div class="space-y-2 font-semibold text-slate-600">
              <div>Dirección: <span class="text-clinical-dark font-extrabold">Sede Centro, Ciudad de México</span></div>
              <div>Teléfono de Urgencias: <span class="text-clinical-dark font-extrabold">+52 55 9000 8000</span></div>
              <div>Email: <span class="text-clinical-dark font-extrabold">contacto&#64;brevemente.com</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Crisis -->
      @if (mostrarCrisis) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div class="bg-white border-2 border-red-500 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div class="flex items-center gap-2.5 text-red-600 border-b border-slate-100 pb-2">
              <svg class="w-7 h-7 text-red-600 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 class="font-extrabold text-sm uppercase tracking-wider text-red-600">Atención de Crisis Inmediata</h3>
            </div>
            <p class="font-bold text-slate-700 text-xs leading-relaxed">
              ⚠️ Se ha notificado inmediatamente al <b>Dr. Alejandro Silva</b> y al <b>Supervisor de Guardia</b> sobre tu estado de crisis. Un profesional se comunicará contigo de forma prioritaria.
            </p>

            <div class="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <span class="font-bold text-red-800 text-[11px] block uppercase">Recursos de Apoyo Inmediatos (Gratuitos 24/7):</span>
              <div class="space-y-1.5 font-extrabold text-xs text-red-950">
                <div>📞 Línea de la Vida (Nacional): <span class="underline">800 911 2000</span></div>
                <div>📞 Teléfono de Guardia BreveMente: <span class="underline">+52 55 9000 8000</span></div>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button
                (click)="mostrarCrisis = false"
                class="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 text-xs"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [':host { display: block; }']
})
export class DashboardPatientViewComponent {
  @Input() userName = '';

  mostrarCrisis = false;

  readonly series: PuntoEvolucion[] = [
    { name: 'Sesión 1', yo: 30, demas: 40, mundo: 35 },
    { name: 'Sesión 2', yo: 45, demas: 50, mundo: 40 },
    { name: 'Sesión 3', yo: 65, demas: 60, mundo: 55 }
  ];

  private readonly claves = ['yo', 'demas', 'mundo'] as const;
  private readonly colores: Record<(typeof this.claves)[number], string> = {
    yo: '#304768',
    demas: '#75AFBC',
    mundo: '#319795'
  };
  private readonly etiquetas: Record<(typeof this.claves)[number], string> = {
    yo: 'Relación Conmigo Mismo (YO)',
    demas: 'Relación con los Demás',
    mundo: 'Relación con el Mundo'
  };

  private readonly PAD_L = 44;
  private readonly PAD_R = 20;
  private readonly PAD_T = 16;
  private readonly PLOT_H = 180;

  get nombre(): string {
    return this.userName?.trim() || 'Sofía Martínez';
  }

  get gridLineas(): { y: number; valor: number }[] {
    return [0, 25, 50, 75, 100].map((v) => ({
      y: this.PAD_T + this.PLOT_H - (v / 100) * this.PLOT_H,
      valor: v
    }));
  }

  get lineas(): LineaSerie[] {
    return this.claves.map((clave) => ({
      clave,
      color: this.colores[clave],
      puntos: this.series.map((s, i) => `${this.xDe(i)},${this.yDe(s[clave])}`).join(' ')
    }));
  }

  get leyendas(): Leyenda[] {
    return this.claves.map((c) => ({ color: this.colores[c], label: this.etiquetas[c] }));
  }

  responder(tipo: 'diario' | 'fantasia'): void {
    const mensaje =
      tipo === 'diario'
        ? "LEVA Paciente:\n\nEl Diario de a bordo consiste en registrar cada ataque de pánico justo en el momento en que ocurra. Debes anotar la hora, los síntomas físicos experimentados y tus pensamientos en ese instante exacto. Hacerlo ayuda a bloquear la evitación racional."
        : "LEVA Paciente:\n\nLa Peor Fantasía es una prescripción estratégica diseñada para disolver el control paradojal. Al obligarte a pensar en tus peores temores durante 30 minutos a una hora fija, la mente se satura y la ansiedad se anula de forma natural.";
    alert(mensaje);
  }

  xDe(i: number): number {
    const n = this.series.length;
    if (n === 1) {
      return this.PAD_L + this.anchoPlot / 2;
    }
    return this.PAD_L + (i * this.anchoPlot) / (n - 1);
  }

  private get anchoPlot(): number {
    return 600 - this.PAD_L - this.PAD_R;
  }

  private yDe(valor: number): number {
    return this.PAD_T + this.PLOT_H - (valor / 100) * this.PLOT_H;
  }
}
