import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BarraMensual {
  mes: string;
  citas: number;
  completadas: number;
}

@Component({
  selector: 'app-desempeno',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-clinical-dark">Mi Desarrollo Profesional</h2>
          <p class="text-xs text-clinical-textMuted">
            Monitoreo integrado de desempeño clínico, adherencia técnica a protocolos, capacitación académica y bitácoras de supervisión.
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span class="text-slate-400">Año:</span>
          <select disabled class="px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg cursor-not-allowed">
            <option>2026</option>
          </select>
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
            Simulado
          </span>
        </div>
      </div>

      <!-- Sub-pestañas (inertes) -->
      <div class="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-500 overflow-x-auto select-none">
        <button type="button" class="px-4 py-2 rounded-lg bg-clinical-dark text-white shadow-sm whitespace-nowrap">Resultados Clínicos</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Fidelidad al Modelo (TBE)</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Formación y Competencias</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Supervisiones Recibidas</button>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citas Mensuales</span>
          <p class="text-2xl font-bold text-clinical-dark">110</p>
          <p class="text-[11px] text-clinical-textMuted">agosto 2026 (simulado)</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efectividad TBE</span>
          <p class="text-2xl font-bold text-clinical-teal">72%</p>
          <p class="text-[11px] text-clinical-textMuted">casos resueltos</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Índice de Fidelidad</span>
          <p class="text-2xl font-bold text-clinical-dark">8.4 / 10</p>
          <p class="text-[11px] text-clinical-textMuted">adherencia al modelo</p>
        </div>
      </div>

      <!-- Gráfica estática (SVG, sin dependencias) -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-200 pb-2">
          Historial de Citas Mensuales (2026)
        </span>
        <svg viewBox="0 0 480 180" class="w-full" role="img" aria-label="Gráfica de citas mensuales simulada">
          <line x1="40" y1="150" x2="460" y2="150" stroke="#cbd5e1" stroke-width="1"></line>
          <ng-container *ngFor="let bar of barras; let i = index">
            <rect [attr.x]="55 + i * 55" [attr.y]="150 - bar.citas" width="22" [attr.height]="bar.citas" rx="3" fill="#75AFBC"></rect>
            <rect [attr.x]="55 + i * 55" [attr.y]="150 - bar.completadas" width="22" [attr.height]="bar.completadas" rx="3" fill="#0d9488"></rect>
            <text [attr.x]="55 + i * 55 + 11" y="165" text-anchor="middle" font-size="9" fill="#94a3b8">{{ bar.mes }}</text>
          </ng-container>
        </svg>
        <div class="flex items-center gap-4 text-[10px] font-semibold text-slate-500">
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-clinical-accent inline-block"></span> Citas</span>
          <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-clinical-teal inline-block"></span> Completadas</span>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class DesempenoComponent {
  readonly barras: BarraMensual[] = [
    { mes: 'Ene', citas: 45, completadas: 40 },
    { mes: 'Feb', citas: 50, completadas: 45 },
    { mes: 'Mar', citas: 65, completadas: 58 },
    { mes: 'Abr', citas: 60, completadas: 54 },
    { mes: 'May', citas: 75, completadas: 70 },
    { mes: 'Jun', citas: 80, completadas: 75 },
    { mes: 'Jul', citas: 95, completadas: 88 },
    { mes: 'Ago', citas: 110, completadas: 102 }
  ];
}
