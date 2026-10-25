import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DocBiblioteca {
  titulo: string;
  categoria: 'manual' | 'protocolo';
  codigo: string;
  resumen: string;
}

@Component({
  selector: 'app-biblioteca-clinica',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-clinical-dark">Biblioteca Digital Clínica</h2>
          <p class="text-xs text-clinical-textMuted">
            Corpus científico, manuales de tratamiento estratégico Arezzo y protocolos clínicos oficiales.
          </p>
        </div>
        <span class="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
          Simulado / Demo
        </span>
      </div>

      <!-- Buscador y Categorías (inertes) -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold w-full md:w-auto">
          <button type="button" class="flex-1 md:flex-initial px-4 py-1.5 rounded-md bg-white text-clinical-dark shadow-sm">Todos</button>
          <button type="button" class="flex-1 md:flex-initial px-4 py-1.5 rounded-md text-slate-500 hover:text-slate-800">Manuales TBE</button>
          <button type="button" class="flex-1 md:flex-initial px-4 py-1.5 rounded-md text-slate-500 hover:text-slate-800">Protocolos Clínicos</button>
        </div>

        <div class="relative w-full md:w-72">
          <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input type="text" placeholder="Buscar por título, código o contenido..." disabled
            class="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-400 cursor-not-allowed" />
        </div>
      </div>

      <!-- Listado de Documentos (datos simulados) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let doc of documentos" class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="bg-blue-50 p-2.5 rounded-lg text-clinical-accent shrink-0">📄</div>
              <span class="text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase bg-slate-50 border-slate-200 text-slate-500">{{ doc.codigo }}</span>
            </div>
            <div>
              <h3 class="text-xs font-bold text-clinical-dark">{{ doc.titulo }}</h3>
              <span class="text-[10px] text-clinical-teal font-semibold uppercase tracking-wider block mt-0.5">
                {{ doc.categoria === 'manual' ? 'Manual Técnico' : 'Protocolo Clínico' }}
              </span>
              <p class="text-slate-500 text-xs mt-2 leading-relaxed">{{ doc.resumen }}</p>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
            <span class="text-[9px] text-slate-400 font-bold uppercase">Acceso Clínico Autorizado</span>
            <button type="button" title="Próximamente" class="px-3 py-1.5 bg-clinical-accent text-white rounded-lg text-xs font-semibold shadow-sm cursor-default">
              Consultar ›
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class BibliotecaClinicaComponent {
  readonly documentos: DocBiblioteca[] = [
    {
      titulo: 'Terapia Breve Estratégica — Modelo Arezzo',
      categoria: 'manual',
      codigo: 'M-TBE-001',
      resumen: 'Manual técnico del enfoque estratégico: soluciones intentadas, SPR y reestructuración de la percepción del problema.'
    },
    {
      titulo: 'Protocolo de Fobia de Rendimiento',
      categoria: 'protocolo',
      codigo: 'P-FOB-014',
      resumen: 'Protocolo clínico oficial para el tratamiento de bloqueo fóbico en situaciones de examen y autoexigencia académica.'
    },
    {
      titulo: 'Protocolo de Ataque de Pánico',
      categoria: 'protocolo',
      codigo: 'P-PAN-008',
      resumen: 'Guía de intervención estratégica para la desactivación del intento de control en crisis de pánico.'
    },
    {
      titulo: 'Manual de Prescripciones Paradójicas',
      categoria: 'manual',
      codigo: 'M-PRX-003',
      resumen: 'Catálogo de prescripciones estratégicas (cómo empeorar, bitácora de la peor fantasía) con criterios de aplicación.'
    }
  ];
}
