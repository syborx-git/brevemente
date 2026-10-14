import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Vista del dashboard para el rol alumno (SDD-005 §4.2).
 * Réplica exacta de la sección `userRole === 'student'` de la demo React:
 * bienvenida, CTA al Campus, resumen académico y avisos.
 */
@Component({
  selector: 'app-dashboard-student-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto text-xs text-slate-600 font-semibold leading-normal">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-clinical-dark">¡Hola de nuevo, {{ nombre }}!</h2>
          <p class="text-[11px] text-clinical-textMuted mt-1">
            Portal académico de formación y desarrollo profesional.
          </p>
        </div>
        <button
          (click)="irACampus()"
          class="px-4 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          Ingresar al Campus Completo
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <span class="font-bold text-clinical-dark uppercase tracking-wider block border-b border-slate-100 pb-2">Mi Resumen Académico</span>
          <div class="grid grid-cols-2 gap-4">
            <div>Diplomado Activo: <span class="text-clinical-dark font-extrabold">Diplomado en Terapia Breve Estratégica</span></div>
            <div>Cohorte: <span class="text-clinical-dark font-extrabold">Agosto 2026</span></div>
            <div>Promedio (G.P.A): <span class="text-clinical-teal font-extrabold">9.2 / 10</span></div>
            <div>Horas Acumuladas: <span class="text-clinical-dark font-extrabold">90 / 120 hrs</span></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span class="font-bold text-clinical-dark uppercase tracking-wider block border-b border-slate-100 pb-2">Avisos Académicos</span>
            <p class="mt-2 font-medium italic text-slate-600 leading-normal">
              "Recuerden que para la sesión final de evaluación práctica (Módulo 8), el expediente de práctica simulada debe estar concluido."
            </p>
          </div>
          <button
            (click)="irARadar()"
            class="text-clinical-teal font-bold hover:underline block mt-3 text-left"
          >
            Ver Radar de Competencias completo →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class DashboardStudentViewComponent {
  @Input() userName = '';

  constructor(private readonly router: Router) {}

  get nombre(): string {
    return this.userName?.trim() || 'Carlos Mendoza';
  }

  irACampus(): void {
    void this.router.navigate(['/campus']);
  }

  irARadar(): void {
    void this.router.navigate(['/desempeno']);
  }
}
