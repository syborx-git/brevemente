import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCampus {
  etiqueta: string;
  valor: string;
  detalle: string;
}

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-clinical-dark">Campus BreveMente</h2>
          <p class="text-xs text-clinical-textMuted">
            Formación académica, ruta de aprendizaje, simulador clínico y certificaciones del corpus TBE.
          </p>
        </div>
        <span class="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
          Simulado / Demo
        </span>
      </div>

      <!-- Tabs (inertes) -->
      <div class="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-500 overflow-x-auto select-none">
        <button type="button" class="px-4 py-2 rounded-lg bg-clinical-dark text-white shadow-sm whitespace-nowrap">Dashboard</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Ruta de Aprendizaje</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Simulador Clínico</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Cohortes</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Alertas de Calidad</button>
        <button type="button" class="px-4 py-2 rounded-lg hover:text-slate-800 whitespace-nowrap">Certificados</button>
      </div>

      <!-- Contenido estático del tab Dashboard -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let stat of stats" class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ stat.etiqueta }}</span>
          <p class="text-2xl font-bold text-clinical-dark">{{ stat.valor }}</p>
          <p class="text-[11px] text-clinical-textMuted">{{ stat.detalle }}</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-200 pb-2">
          Competencias del Perfil (Radar)
        </span>
        <p class="text-[11px] text-clinical-textMuted mt-3 leading-relaxed">
          La gráfica de competencias (evaluación estratégica, diálogo estratégico, protocolos, prescripciones, riesgo clínico y ética)
          se mostrará aquí cuando exista backend académico. Vista simulada para validar la navegación del tab.
        </p>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class CampusComponent {
  readonly stats: StatCampus[] = [
    { etiqueta: 'Módulos Completados', valor: '12', detalle: 'de 24 módulos curriculares' },
    { etiqueta: 'Simulaciones Aprobadas', valor: '7', detalle: 'calificación promedio 9.1' },
    { etiqueta: 'Supervisiones Programadas', valor: '2', detalle: 'esta semana' },
    { etiqueta: 'Certificados Emitidos', valor: '3', detalle: 'ruta TBE en curso' }
  ];
}
