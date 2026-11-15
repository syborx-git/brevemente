import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AlertaPortal,
  CitaPortal,
  ContraReferenciaPortal,
  PatientPortalRepository,
  PortalPerfil,
  SesionPortal
} from './ports/patient-portal.repository';
import { PatientPortalHttpAdapter } from './adapters/patient-portal-http.adapter';
import { PatientPortalLocalStorageAdapter } from './adapters/patient-portal-localstorage.adapter';
import { CitaFilaComponent } from './cita-fila.component';
import { environment } from '../../../environments/environment';

interface Badge {
  label: string;
  cls: string;
}

const ASISTENCIA: Record<string, Badge> = {
  completada: { label: 'Completada', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  confirmada: { label: 'Próxima cita', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  pendiente: { label: 'Por confirmar', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  ausente: { label: 'No asistió', cls: 'bg-red-100 text-red-800 border-red-200' },
  no_presentado: { label: 'No se presentó', cls: 'bg-red-100 text-red-800 border-red-300' },
  solicita_reagendar: { label: 'Solicita reagendar', cls: 'bg-amber-100 text-amber-800 border-amber-300' }
};

const PAGO: Record<string, Badge> = {
  pagada: { label: 'Pagada', cls: 'bg-green-100 text-green-800 border-green-200' },
  pendiente: { label: 'Pendiente de pago', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  exenta: { label: 'Exenta', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
};

const TIPO: Record<string, string> = {
  primera: 'Primera sesión',
  seguimiento: 'Seguimiento',
  cierre: 'Sesión de cierre'
};

@Component({
  selector: 'app-patient-portal',
  standalone: true,
  imports: [CommonModule, CitaFilaComponent],
  providers: [
    {
      provide: PatientPortalRepository,
      useFactory: (http: HttpClient) => environment.features.pacientePortalBackend
        ? new PatientPortalHttpAdapter(http)
        : new PatientPortalLocalStorageAdapter(),
      deps: [HttpClient]
    }
  ],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 pb-12">
      <!-- Encabezado -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-clinical-accent/10 border-2 border-clinical-accent/20 flex items-center justify-center text-clinical-accent text-xl font-bold">
            {{ inicial() }}
          </div>
          <div>
            <h2 class="text-lg font-bold text-clinical-dark">Hola, {{ perfil()?.name }}</h2>
            <p class="text-xs text-slate-500">
              Terapeuta asignado:
              <span class="font-semibold text-slate-700">{{ perfil()?.therapistName }}</span>
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5 max-w-xs">{{ perfil()?.motif }}</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            (click)="escalarCrisis()"
            [disabled]="crisisEnviada()"
            class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
            [ngClass]="crisisEnviada()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'">
            {{ crisisEnviada() ? 'Aviso enviado al equipo' : 'Botón de Crisis' }}
          </button>
          <button
            (click)="contactarAsistente()"
            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-bold shadow-sm transition-all">
            Contactar asistente
          </button>
        </div>
      </div>

      <!-- Contra-referencia aprobada -->
      @if (contraReferencia(); as cr) {
        <section class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-bold text-emerald-800 text-sm">Tu contra-referencia fue aprobada</h3>
            <button (click)="contraReferencia.set(null)" class="text-emerald-500 hover:text-emerald-700 font-bold" title="Cerrar aviso">✕</button>
          </div>
          <p class="text-xs text-emerald-800 leading-relaxed">
            A partir de ahora tu terapeuta asignado es <b>{{ cr.toTherapistName }}</b>.
          </p>
          <div class="bg-white/70 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 space-y-1">
            <div>Deriva de: {{ cr.fromTherapistName }}</div>
            <div>Aprobada el: {{ cr.aprobadaEl }}</div>
          </div>
        </section>
      }

      <!-- Alerta de seguridad clínica activa -->
      @if (alertaActiva(); as al) {
        <section class="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <h3 class="font-bold text-red-800 text-sm">Aviso de seguridad clínica</h3>
          <p class="text-xs text-red-700 leading-relaxed">{{ al.mensaje }}</p>
        </section>
      }

      <!-- Aviso de crisis atendida -->
      @if (crisisResuelta(); as cr) {
        <section class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <h3 class="font-bold text-emerald-900 text-sm">Tu aviso de crisis fue atendido</h3>
          <p class="text-xs text-emerald-800 leading-relaxed">{{ cr.mensaje }}</p>
        </section>
      }

      <!-- Próximas citas -->
      @if (proximas().length > 0) {
        <section class="space-y-3">
          <h3 class="text-sm font-bold text-clinical-dark">Próximas Citas</h3>
          <div class="space-y-2">
            @for (cita of proximas(); track cita.id) {
              <app-cita-fila [cita]="cita" [prescripciones]="prescripcionesDe(cita.id)" />
            }
          </div>
        </section>
      }

      <!-- Historial -->
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-clinical-dark">Historial de Citas</h3>
          <span class="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {{ historial().length }} sesión{{ historial().length !== 1 ? 'es' : '' }}
          </span>
        </div>

        @if (historial().length === 0) {
          <div class="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p class="text-xs text-slate-400">Aún no hay citas en el historial.</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (cita of historial(); track cita.id) {
              <app-cita-fila [cita]="cita" [prescripciones]="prescripcionesDe(cita.id)" />
            }
          </div>
        }
      </section>

      <p class="text-center text-[10px] text-slate-400 px-4">
        Esta vista es de solo lectura. Para reprogramar o cancelar una cita, contacta al asistente o a tu terapeuta.
      </p>

      @if (cargaError()) {
        <p class="text-center text-xs text-red-600">No se pudo cargar la información del portal. Intenta de nuevo más tarde.</p>
      }
    </div>
  `,
  styles: [':host { display: block; }']
})
export class PatientPortalComponent implements OnInit {
  private readonly repo: PatientPortalRepository;

  readonly perfil = signal<PortalPerfil | null>(null);
  readonly citas = signal<CitaPortal[]>([]);
  readonly sesiones = signal<SesionPortal[]>([]);
  readonly alertas = signal<AlertaPortal[]>([]);
  readonly contraReferencia = signal<ContraReferenciaPortal | null>(null);
  readonly crisisEnviada = signal(false);
  readonly cargaError = signal(false);

  readonly proximas = computed(() =>
    this.citas().filter((c) => c.status === 'confirmada' || c.status === 'pendiente')
  );
  readonly historial = computed(() =>
    this.citas().filter((c) => c.status !== 'confirmada' && c.status !== 'pendiente')
  );
  readonly alertaActiva = computed(() =>
    this.alertas().find((a) => a.estado === 'activa' && a.tipo === 'seguridad_clinica')
  );
  readonly crisisResuelta = computed(() =>
    this.alertas().find((a) => a.estado === 'resuelta' && a.tipo === 'crisis_atendida')
  );

  constructor(http: HttpClient) {
    this.repo = environment.features.pacientePortalBackend
      ? new PatientPortalHttpAdapter(http)
      : new PatientPortalLocalStorageAdapter();
  }

  ngOnInit(): void {
    this.cargar();
  }

  inicial(): string {
    const name = this.perfil()?.name ?? 'P';
    return name.trim().charAt(0).toUpperCase();
  }

  prescripcionesDe(citaId: string): SesionPortal[] {
    return this.sesiones().filter((s) => s.citaId === citaId);
  }

  escalarCrisis(): void {
    if (this.crisisEnviada()) {
      return;
    }
    this.repo.escalarCrisis('ALERTA ROJA: El paciente activó el Botón de Crisis de emergencia desde su portal.')
      .subscribe({
        next: (alerta) => {
          this.alertas.update((lista) => [alerta, ...lista]);
          this.crisisEnviada.set(true);
        },
        error: () => this.cargaError.set(true)
      });
  }

  contactarAsistente(): void {
    const nombre = this.perfil()?.name ?? 'paciente';
    const mensaje = `Hola, soy ${nombre}. Me gustaría solicitar información para reprogramar mi cita. ¿Podrían ayudarme?`;
    window.open(`https://wa.me/525511223344?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  private cargar(): void {
    this.repo.obtenerPerfil().subscribe({
      next: (p) => this.perfil.set(p),
      error: () => this.cargaError.set(true)
    });
    this.repo.listarCitas().subscribe({
      next: (c) => this.citas.set(c),
      error: () => this.cargaError.set(true)
    });
    this.repo.listarSesiones().subscribe({
      next: (s) => this.sesiones.set(s),
      error: () => this.cargaError.set(true)
    });
    this.repo.listarAlertas().subscribe({
      next: (a) => this.alertas.set(a),
      error: () => this.cargaError.set(true)
    });
    this.repo.obtenerContraReferencia().subscribe({
      next: (cr) => this.contraReferencia.set(cr),
      error: () => this.cargaError.set(true)
    });
  }
}
