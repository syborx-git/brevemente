import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CasosFuenteLevaService, CaseCandidate, CaseSource } from '../services/casos-fuente-leva.service';

@Component({
  selector: 'app-casos-fuente-leva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './casos-fuente-leva.component.html'
})
export class CasosFuenteLevaComponent implements OnInit {
  // Búsqueda de expedientes
  q = '';
  estatus = '';
  candidatos: CaseCandidate[] = [];
  buscando = false;
  busquedaRealizada = false;

  // Casos que hoy alimentan a LEVA
  fuentes: CaseSource[] = [];
  cargandoFuentes = false;

  // Revisión de la ficha antes de aceptar
  fichaEnRevision: CaseSource | null = null;
  cargandoFicha = false;
  notasCuraduria = '';
  aceptando = false;

  // Retiro de un caso
  fuenteParaRetirar: CaseSource | null = null;
  retirando = false;

  mensajeExito = '';
  mensajeError = '';

  readonly estatusOpciones = [
    { value: '', label: 'Todos los estatus' },
    { value: 'CERRADO', label: 'Cerrado (alta terapéutica)' },
    { value: 'EN_TRATAMIENTO', label: 'En tratamiento' },
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'EN_DIAGNOSTICO', label: 'En diagnóstico' },
    { value: 'ARCHIVADO', label: 'Archivado' }
  ];

  constructor(private readonly casosService: CasosFuenteLevaService) {}

  ngOnInit(): void {
    this.cargarFuentes();
    this.buscar();
  }

  buscar(): void {
    this.buscando = true;
    this.casosService.buscarCandidatos(this.q, this.estatus).subscribe({
      next: (lista) => {
        this.candidatos = lista;
        this.buscando = false;
        this.busquedaRealizada = true;
      },
      error: (err) => {
        this.buscando = false;
        this.mostrarError(err, 'No se pudo consultar el listado de expedientes.');
      }
    });
  }

  cargarFuentes(): void {
    this.cargandoFuentes = true;
    this.casosService.listarFuentes().subscribe({
      next: (lista) => {
        this.fuentes = lista;
        this.cargandoFuentes = false;
      },
      error: (err) => {
        this.cargandoFuentes = false;
        this.mostrarError(err, 'No se pudo cargar la lista de casos de aprendizaje.');
      }
    });
  }

  revisarFicha(candidato: CaseCandidate): void {
    this.limpiarMensajes();
    this.cargandoFicha = true;
    this.notasCuraduria = '';
    this.fichaEnRevision = null;
    this.casosService.previsualizar(candidato.expedienteId).subscribe({
      next: (ficha) => {
        this.fichaEnRevision = ficha;
        this.cargandoFicha = false;
      },
      error: (err) => {
        this.cargandoFicha = false;
        this.mostrarError(err, 'No se pudo preparar la ficha del caso.');
      }
    });
  }

  cerrarFicha(): void {
    this.fichaEnRevision = null;
    this.notasCuraduria = '';
  }

  aceptarFicha(): void {
    if (!this.fichaEnRevision || this.aceptando) return;
    this.aceptando = true;
    this.casosService.aceptar(this.fichaEnRevision.expedienteId, this.notasCuraduria).subscribe({
      next: (fuente) => {
        this.aceptando = false;
        this.mensajeExito = `El caso ${fuente.caseToken} ahora es una fuente de aprendizaje de LEVA.`;
        this.cerrarFicha();
        this.cargarFuentes();
        this.buscar();
      },
      error: (err) => {
        this.aceptando = false;
        this.mostrarError(err, 'No se pudo aceptar el caso como fuente de aprendizaje.');
      }
    });
  }

  pedirRetiro(fuente: CaseSource): void {
    this.fuenteParaRetirar = fuente;
  }

  cancelarRetiro(): void {
    this.fuenteParaRetirar = null;
  }

  confirmarRetiro(): void {
    if (!this.fuenteParaRetirar?.id || this.retirando) return;
    const fuente = this.fuenteParaRetirar;
    this.retirando = true;
    this.casosService.retirar(fuente.id!).subscribe({
      next: () => {
        this.retirando = false;
        this.fuenteParaRetirar = null;
        this.mensajeExito = `El caso ${fuente.caseToken} fue retirado: LEVA ya no lo usará como referencia.`;
        this.cargarFuentes();
        this.buscar();
      },
      error: (err) => {
        this.retirando = false;
        this.mostrarError(err, 'No se pudo retirar el caso.');
      }
    });
  }

  etiquetaEstatus(valor: string): string {
    const found = this.estatusOpciones.find(o => o.value === valor);
    return found ? found.label : valor;
  }

  claseEstatus(valor: string): string {
    switch (valor) {
      case 'CERRADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EN_TRATAMIENTO': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'ARCHIVADO': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.mensajeExito = '';
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        this.mensajeError = 'Tu perfil no tiene autorización para administrar los casos de aprendizaje de LEVA.';
        return;
      }
      this.mensajeError = err.error?.message || porDefecto;
      return;
    }
    this.mensajeError = porDefecto;
  }
}
