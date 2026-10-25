import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AccionDominante,
  AlertaStaff,
  BorradorSesion,
  CitaHoy,
  MiConsultaRepository,
  SolicitudPendiente
} from './ports/mi-consulta.repository';
import { MiConsultaHttpAdapter } from './adapters/mi-consulta-http.adapter';
import { MiConsultaLocalStorageAdapter } from './adapters/mi-consulta-localstorage.adapter';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

type EstadoSesion = 'por_iniciar' | 'en_curso' | 'finalizada' | 'nota_pendiente';

@Component({
  selector: 'app-mi-consulta',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: MiConsultaRepository,
      useFactory: (http: HttpClient) =>
        environment.features.miConsultaBackend
          ? new MiConsultaHttpAdapter(http)
          : new MiConsultaLocalStorageAdapter(),
      deps: [HttpClient]
    }
  ],
  template: `
    <div class="max-w-6xl mx-auto space-y-6 text-xs font-semibold leading-normal select-none">
      <!-- Cabecera -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-clinical-dark">{{ titulo }} — {{ terapeutaNombre }}</h1>
          <p class="text-[11px] text-clinical-textMuted mt-0.5">Espacio de trabajo operativo y control diario de citas y notas de sesión.</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="px-3 py-1.5 bg-slate-100 text-clinical-dark rounded-lg shadow-sm font-bold text-[10px]">Sede Centro</span>
          <span class="px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">Simulación</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Próxima Sesión -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
              <span class="font-extrabold text-clinical-dark text-xs uppercase tracking-wider">Próxima Sesión Clínico-Estratégica</span>
              <div class="flex bg-slate-100 p-0.5 rounded-lg text-center font-bold text-[9px] border border-slate-200">
                @for (estado of estadosSesion; track estado) {
                  <button
                    type="button"
                    [attr.aria-pressed]="sessionState() === estado"
                    (click)="sessionState.set(estado)"
                    class="px-2 py-1 rounded capitalize transition-all"
                    [ngClass]="sessionState() === estado ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                    {{ estado.replace('_', ' ') }}
                  </button>
                }
              </div>
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
              <div class="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Paciente Activo:</span>
                  <span class="text-sm font-extrabold text-clinical-dark block mt-0.5">{{ accion()?.pacienteNombre || 'Sin próxima cita' }}</span>
                  <span class="text-[10px] text-slate-500 block mt-0.5">
                    Motivo: {{ accion()?.motivoConsulta || '—' }} · Sesión #{{ accion()?.numeroSesion ?? '—' }}
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-[9px] text-slate-400 block uppercase font-bold">Estado actual:</span>
                  <span class="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border inline-block mt-1"
                    [ngClass]="claseEstadoSesion(sessionState())">
                    {{ labelEstadoSesion(sessionState()) }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3 text-[10px] uppercase font-bold text-slate-400">
                <div>
                  <span>Intake Form:</span>
                  <span class="block font-extrabold mt-0.5" [ngClass]="accion()?.intakeListo ? 'text-emerald-700' : 'text-slate-400'">
                    {{ accion()?.intakeListo ? 'COMPLETO' : 'PENDIENTE' }}
                  </span>
                </div>
                <div>
                  <span>Consentimiento Grabación:</span>
                  <span class="block font-extrabold mt-0.5" [ngClass]="accion()?.consentimientoFirmado ? 'text-emerald-700' : 'text-slate-400'">
                    {{ accion()?.consentimientoFirmado ? 'FIRMADO DIGITALMENTE' : 'PENDIENTE' }}
                  </span>
                </div>
                <div>
                  <span>Modo Asistencial IA:</span>
                  <span class="block font-extrabold mt-0.5" [ngClass]="accion()?.grabacionLeva ? 'text-clinical-teal' : 'text-slate-400'">
                    {{ accion()?.grabacionLeva ? 'LEVA HABILITADA' : 'NO DISPONIBLE' }}
                  </span>
                </div>
              </div>

              <div class="pt-2">
                @if (sessionState() === 'por_iniciar') {
                  <button type="button" class="w-full py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow text-xs transition-colors">
                    Atender / Preparar Sesión →
                  </button>
                }
                @if (sessionState() === 'en_curso') {
                  <button type="button" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow text-xs transition-colors">
                    Detener Grabación y Procesar con LEVA ✨
                  </button>
                }
                @if (sessionState() === 'finalizada') {
                  <div class="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800 text-center font-bold">
                    ✓ Sesión registrada correctamente. La bitácora ha sido firmada criptográficamente.
                  </div>
                }
                @if (sessionState() === 'nota_pendiente') {
                  <button type="button" class="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow text-xs transition-colors">
                    Redactar Nota de Sesión Urgente 📄
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Agenda de Hoy -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Agenda de Hoy</span>
            <div class="space-y-2">
              @for (cita of citas(); track cita.id) {
                <div class="p-3 border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-3">
                    <span class="w-12 text-center py-1 font-bold text-clinical-accent bg-blue-50 border border-blue-100 rounded text-[10px]">{{ cita.hora }}</span>
                    <div>
                      <span class="font-bold text-clinical-dark block">{{ cita.pacienteNombre }}</span>
                      <span class="text-[10px] text-slate-500 font-semibold">{{ cita.tipo.toUpperCase() }} · {{ cita.modalidad }} · {{ cita.duracionMinutos }} min</span>
                    </div>
                  </div>
                  <span class="text-[9px] font-extrabold text-clinical-teal">{{ cita.estado.toUpperCase() }}</span>
                </div>
              } @empty {
                <p class="text-[11px] text-slate-400 italic text-center py-3">Sin citas para hoy.</p>
              }
            </div>
          </div>
        </div>

        <!-- Columna derecha -->
        <div class="space-y-6">
          <!-- Requieren Atención Urgente -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span class="text-red-500 font-bold">⚠</span>
              <span class="font-extrabold text-clinical-dark text-xs uppercase tracking-wider">Requieren Atención Urgente</span>
            </div>

            <div class="space-y-3">
              @for (alerta of alertas(); track alerta.id) {
                <div class="bg-red-50/50 border border-red-200 rounded-lg p-3 space-y-1">
                  <span class="font-extrabold text-red-800 block">{{ alerta.pacienteNombre }}</span>
                  <span class="text-[10px] text-slate-500 block">Alerta de riesgo clínico · {{ alerta.tipo }}</span>
                  <p class="text-slate-600 font-medium text-[11px] mt-0.5">{{ alerta.mensaje }}</p>
                  <button type="button" (click)="resolverAlerta(alerta.id)"
                    class="text-[9px] font-bold text-red-800 hover:underline bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded transition-colors">
                    Resolver Caso →
                  </button>
                </div>
              }

              @for (solicitud of solicitudes(); track solicitud.id) {
                <div class="bg-amber-50/50 border border-amber-200 rounded-lg p-3 space-y-1">
                  <span class="font-extrabold text-amber-900 block">{{ solicitud.pacienteNombre }}</span>
                  <span class="text-[10px] text-slate-500 block">Solicitud de supervisión · por {{ solicitud.terapeutaNombre }}</span>
                  <p class="text-slate-600 font-medium text-[11px] mt-0.5">{{ solicitud.motivo }}</p>
                </div>
              }

              @if (alertas().length === 0 && solicitudes().length === 0) {
                <p class="text-[11px] text-slate-400 italic text-center py-3">Sin casos que requieran atención urgente.</p>
              }
            </div>
          </div>

          <!-- Borradores de LEVA -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span class="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Borradores de LEVA Pendientes</span>
            <div class="space-y-2">
              @for (borrador of borradores(); track borrador.id) {
                <div class="p-3 border border-slate-100 rounded bg-slate-50/50 space-y-1">
                  <span class="font-bold text-clinical-dark block">Borrador sugerido por LEVA</span>
                  <span class="text-[9px] text-slate-400 block uppercase font-bold">Sesión {{ borrador.numero }}</span>
                  <p class="text-[11px] text-slate-600 mt-1 leading-normal font-medium">"{{ borrador.notas }}"</p>
                </div>
              } @empty {
                <p class="text-[11px] text-slate-400 italic text-center py-3">Sin borradores pendientes.</p>
              }
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-[10px] text-slate-400">
        Esta vista es una reconstrucción de la demo. Los datos provienen del backend cuando el flag miConsultaBackend está activo.
      </p>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class MiConsultaComponent implements OnInit {
  private readonly repo: MiConsultaRepository;

  readonly accion = signal<AccionDominante | null>(null);
  readonly citas = signal<CitaHoy[]>([]);
  readonly alertas = signal<AlertaStaff[]>([]);
  readonly solicitudes = signal<SolicitudPendiente[]>([]);
  readonly borradores = signal<BorradorSesion[]>([]);
  readonly sessionState = signal<EstadoSesion>('por_iniciar');

  readonly estadosSesion: EstadoSesion[] = ['por_iniciar', 'en_curso', 'finalizada', 'nota_pendiente'];

  constructor(
    http: HttpClient,
    public readonly roleState: RoleStateService
  ) {
    this.repo = environment.features.miConsultaBackend
      ? new MiConsultaHttpAdapter(http)
      : new MiConsultaLocalStorageAdapter();
  }

  ngOnInit(): void {
    this.repo.obtenerAccionDominante().subscribe((a) => this.accion.set(a));
    this.repo.listarCitasHoy().subscribe((c) => this.citas.set(c));
    this.repo.listarAlertasActivas().subscribe((a) => this.alertas.set(a));
    this.repo.listarSolicitudesPendientes().subscribe((s) => this.solicitudes.set(s));
    this.repo.listarBorradores().subscribe((b) => this.borradores.set(b));
  }

  get titulo(): string {
    if (this.roleState.hasRole('supervisor')) return 'Mi Supervisión';
    if (this.roleState.hasRole('admin_clinical')) return 'Mi Operación';
    if (this.roleState.hasRole('admin_platform')) return 'Operación Clínica';
    return 'Mi Consulta';
  }

  get terapeutaNombre(): string {
    return this.roleState.currentUserName || 'Tu consulta';
  }

  labelEstadoSesion(estado: EstadoSesion): string {
    switch (estado) {
      case 'por_iniciar': return 'Por Iniciar';
      case 'en_curso': return 'En Curso (Graba Audio)';
      case 'finalizada': return 'Sesión Completada';
      case 'nota_pendiente': return 'Nota de Sesión Pendiente';
    }
  }

  claseEstadoSesion(estado: EstadoSesion): string {
    switch (estado) {
      case 'por_iniciar': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'en_curso': return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
      case 'finalizada': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'nota_pendiente': return 'bg-red-50 text-red-800 border-red-200';
    }
  }

  resolverAlerta(id: string): void {
    this.repo.resolverAlerta(id).subscribe(() => {
      this.alertas.update((lista) => lista.filter((a) => a.id !== id));
    });
  }
}
