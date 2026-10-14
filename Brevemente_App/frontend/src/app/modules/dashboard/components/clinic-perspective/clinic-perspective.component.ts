import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerapeutaDTO } from '../../ports/dashboard.repository';
import { SerieMes, DistribucionFase, CasoProtocolo } from '../../../../core/utils/dashboard-metrics';

type Perspectiva = 'citas' | 'fases' | 'protocolos';

interface PuntoLinea {
  x: number;
  y: number;
}

interface SegmentoDonut {
  color: string;
  dasharray: string;
  offset: number;
}

interface BarraDato {
  x: number;
  y: number;
  width: number;
  height: number;
  valor: number;
  label: string;
  color: string;
}

/**
 * Perspectiva Clínica Unificada (SDD-005 §4.1): 3 gráficas SVG puras con selector
 * (línea, donut y barras). Paleta exacta de la demo React.
 */
@Component({
  selector: 'app-clinic-perspective',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div>
          <span class="font-extrabold text-clinical-dark text-xs uppercase tracking-wide block">Perspectiva Clínica Unificada</span>
          <p class="text-[11px] text-slate-400 font-semibold mt-0.5">Selecciona el ángulo analítico a visualizar en el viewport principal.</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          @if (esRolSuperior) {
            <select
              class="px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none text-[11px] font-bold text-slate-600"
              [value]="terapeutaSeleccionado"
              (change)="onTerapeuta($any($event.target).value)"
            >
              <option value="all">Todos los doctores</option>
              @for (t of terapeutas; track t.id) {
                <option [value]="t.id">{{ t.nombre }}</option>
              }
            </select>
          }

          <select
            class="px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none text-[11px] font-bold text-slate-600"
            [value]="perspectiva"
            (change)="onPerspectiva($any($event.target).value)"
          >
            <option value="citas">Citas completadas (Histórico)</option>
            <option value="fases">Distribución por Fase TBE</option>
            <option value="protocolos">Casos Activos por Protocolo</option>
          </select>
        </div>
      </div>

      <div class="h-64 flex items-center justify-center">
        @switch (perspectiva) {
          @case ('citas') {
            <svg class="w-full h-full" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet">
              @for (g of lineGrid; track g.y) {
                <line x1="44" [attr.y1]="g.y" x2="580" [attr.y2]="g.y" stroke="#e2e8f0" stroke-dasharray="3 3"></line>
                <text x="38" [attr.y]="g.y + 3" text-anchor="end" font-size="10" font-weight="bold" fill="#94a3b8">{{ g.valor }}</text>
              }
              <polyline [attr.points]="polylinePoints" fill="none" stroke="#304768" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
              @for (p of puntosLinea; track p.x) {
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#304768"></circle>
              }
              @for (d of citasPorMes; track d.month; let i = $index) {
                <text [attr.x]="puntosLinea[i].x" y="252" text-anchor="middle" font-size="10" font-weight="bold" fill="#64748b">{{ d.month }}</text>
              }
            </svg>
          }

          @case ('fases') {
            <div class="w-full h-full flex items-center justify-center gap-8">
              <svg class="h-full w-auto shrink-0" viewBox="0 0 220 220">
                @for (s of segmentosDonut; track s.color) {
                  <circle cx="110" cy="110" r="70" fill="none" [attr.stroke]="s.color" stroke-width="22"
                    [attr.stroke-dasharray]="s.dasharray" [attr.stroke-dashoffset]="s.offset"
                    transform="rotate(-90 110 110)"></circle>
                }
                <text x="110" y="106" text-anchor="middle" font-size="22" font-weight="800" fill="#304768">{{ totalFases }}</text>
                <text x="110" y="124" text-anchor="middle" font-size="9" font-weight="700" fill="#94a3b8">PACIENTES</text>
              </svg>
              <div class="space-y-2 text-[10px] font-bold text-slate-600">
                @for (f of fases; track f.fase; let i = $index) {
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background-color]="coloresDonut[i]"></span>
                    <span>{{ f.fase }}: <b class="text-clinical-dark">{{ f.valor }}</b></span>
                  </div>
                }
              </div>
            </div>
          }

          @case ('protocolos') {
            <svg class="w-full h-full" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet">
              @for (g of barGrid; track g.y) {
                <line x1="44" [attr.y1]="g.y" x2="580" [attr.y2]="g.y" stroke="#e2e8f0" stroke-dasharray="3 3"></line>
                <text x="38" [attr.y]="g.y + 3" text-anchor="end" font-size="10" font-weight="bold" fill="#94a3b8">{{ g.valor }}</text>
              }
              @for (b of barras; track b.label) {
                <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.width" [attr.height]="b.height" rx="3" [attr.fill]="b.color"></rect>
                <text [attr.x]="b.x + b.width / 2" [attr.y]="b.y - 6" text-anchor="middle" font-size="10" font-weight="bold" fill="#304768">{{ b.valor }}</text>
                <text [attr.x]="b.x + b.width / 2" y="252" text-anchor="middle" font-size="10" font-weight="bold" fill="#64748b">{{ b.label }}</text>
              }
            </svg>
          }
        }
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class ClinicPerspectiveComponent {
  @Input() citasPorMes: SerieMes[] = [];
  @Input() fases: DistribucionFase[] = [];
  @Input() protocolos: CasoProtocolo[] = [];
  @Input() terapeutas: TerapeutaDTO[] = [];
  @Input() esRolSuperior = false;

  @Output() terapeutaCambiado = new EventEmitter<string | undefined>();

  perspectiva: Perspectiva = 'citas';
  terapeutaSeleccionado = 'all';

  readonly coloresDonut = ['#304768', '#75AFBC', '#319795', '#4A5568'];
  readonly coloresBarras = ['#304768', '#75AFBC', '#2C7A7B', '#4A5568'];

  private readonly PAD_L = 44;
  private readonly PAD_T = 20;
  private readonly PLOT_H = 200;
  private readonly PLOT_W = 536;

  onPerspectiva(valor: string): void {
    this.perspectiva = valor as Perspectiva;
  }

  onTerapeuta(valor: string): void {
    this.terapeutaSeleccionado = valor;
    this.terapeutaCambiado.emit(valor === 'all' ? undefined : valor);
  }

  get maxCitas(): number {
    const max = Math.max(...this.citasPorMes.map((c) => c.citas), 1);
    return max;
  }

  get lineGrid(): { y: number; valor: number }[] {
    const max = this.maxCitas;
    return [0, 1, 2, 3].map((i) => {
      const frac = i / 3;
      return {
        y: this.PAD_T + this.PLOT_H - frac * this.PLOT_H,
        valor: Math.round(max * frac)
      };
    });
  }

  get puntosLinea(): PuntoLinea[] {
    const n = this.citasPorMes.length;
    if (n === 0) {
      return [];
    }
    return this.citasPorMes.map((d, i) => {
      const x = n === 1 ? this.PAD_L + this.PLOT_W / 2 : this.PAD_L + (i * this.PLOT_W) / (n - 1);
      const y = this.PAD_T + this.PLOT_H - (d.citas / this.maxCitas) * this.PLOT_H;
      return { x, y };
    });
  }

  get polylinePoints(): string {
    return this.puntosLinea.map((p) => `${p.x},${p.y}`).join(' ');
  }

  get totalFases(): number {
    return this.fases.reduce((sum, f) => sum + f.valor, 0);
  }

  get segmentosDonut(): SegmentoDonut[] {
    const total = this.totalFases || 1;
    const C = 2 * Math.PI * 70;
    let acc = 0;
    return this.coloresDonut.map((color, i) => {
      const valor = this.fases[i]?.valor ?? 0;
      const pct = valor / total;
      const segmento: SegmentoDonut = {
        color,
        dasharray: `${pct * C} ${C}`,
        offset: -(acc / total) * C
      };
      acc += valor;
      return segmento;
    });
  }

  get maxCasos(): number {
    return Math.max(...this.protocolos.map((p) => p.casos), 1);
  }

  get barGrid(): { y: number; valor: number }[] {
    const max = this.maxCasos;
    return [0, 1, 2, 3].map((i) => {
      const frac = i / 3;
      return {
        y: this.PAD_T + this.PLOT_H - frac * this.PLOT_H,
        valor: Math.round(max * frac)
      };
    });
  }

  get barras(): BarraDato[] {
    const n = this.protocolos.length;
    if (n === 0) {
      return [];
    }
    const slot = this.PLOT_W / n;
    const barWidth = slot * 0.5;
    return this.protocolos.map((p, i) => {
      const height = (p.casos / this.maxCasos) * this.PLOT_H;
      const x = this.PAD_L + i * slot + (slot - barWidth) / 2;
      const y = this.PAD_T + this.PLOT_H - height;
      return {
        x,
        y,
        width: barWidth,
        height,
        valor: p.casos,
        label: p.protocolo,
        color: this.coloresBarras[i % this.coloresBarras.length]
      };
    });
  }
}
