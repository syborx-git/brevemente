import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FilaAuditoria {
  usuario: string;
  accion: string;
  detalle: string;
  categoria: string;
  tiempo: string;
}

@Component({
  selector: 'app-auditoria-seguridad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-clinical-dark">Auditoría y Seguridad Clínica</h2>
          <p class="text-xs text-clinical-textMuted">
            Monitoreo en tiempo real de accesos, consentimiento legal, uso de IA y alertas de riesgo crítico.
          </p>
        </div>
        <span class="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
          Simulado / Demo
        </span>
      </div>

      <!-- Alertas de Riesgo Crítico (sin backend → empty state) -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm space-y-3.5">
        <div class="flex items-center gap-2">
          <span class="text-red-600 font-bold">⚠</span>
          <span class="text-xs font-bold text-red-800 uppercase tracking-wide">Alertas de Riesgo Activas (Escaladas a Supervisor)</span>
        </div>
        <div class="bg-white border border-red-100 rounded-lg p-6 text-center text-xs text-slate-400">
          Sin alertas activas en esta vista simulada.
        </div>
      </div>

      <!-- Bitácora de auditoría (datos simulados) -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-200 pb-2">
          Bitácora de Auditoría
        </span>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th class="py-2 pr-4 font-bold">Usuario</th>
                <th class="py-2 pr-4 font-bold">Acción</th>
                <th class="py-2 pr-4 font-bold">Detalle</th>
                <th class="py-2 pr-4 font-bold">Categoría</th>
                <th class="py-2 font-bold">Cuándo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of filas" class="border-b border-slate-50">
                <td class="py-2.5 pr-4 font-semibold text-clinical-dark whitespace-nowrap">{{ f.usuario }}</td>
                <td class="py-2.5 pr-4 text-slate-600 whitespace-nowrap">{{ f.accion }}</td>
                <td class="py-2.5 pr-4 text-slate-500">{{ f.detalle }}</td>
                <td class="py-2.5 pr-4 whitespace-nowrap">
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border"
                    [ngClass]="f.categoria === 'seguridad' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'">
                    {{ f.categoria }}
                  </span>
                </td>
                <td class="py-2.5 text-slate-400 whitespace-nowrap">{{ f.tiempo }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-[10px] text-slate-400">
          Los registros de esta bitácora son de demostración y no representan eventos reales.
        </p>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class AuditoriaSeguridadComponent {
  readonly filas: FilaAuditoria[] = [
    { usuario: 'Dra. Sofía Ramírez', accion: 'Acceso a expediente', detalle: 'Consultó el expediente de Mateo Herrera Santos', categoria: 'expediente', tiempo: 'hace 5 min' },
    { usuario: 'Dra. Isabel Cárdenas', accion: 'Aprobación de consentimiento', detalle: 'Validó el consentimiento informado del paciente pac-003', categoria: 'seguridad', tiempo: 'hace 22 min' },
    { usuario: 'LEVA (IA)', accion: 'Uso de Biblioteca', detalle: 'Consultó el documento M-TBE-001 (Modelo Arezzo)', categoria: 'ia', tiempo: 'hace 1 h' },
    { usuario: 'Ing. Rodrigo Pérez', accion: 'Vaciado de auditoría', detalle: 'Purgó el historial de logs (demo)', categoria: 'seguridad', tiempo: 'hace 3 h' }
  ];
}
