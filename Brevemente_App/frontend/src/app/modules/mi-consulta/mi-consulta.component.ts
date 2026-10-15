import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CambioConfiguracion, ConsultaConfig, MiConsultaRepository, TerapeutaSede } from './ports/mi-consulta.repository';
import { MiConsultaLocalStorageAdapter } from './adapters/mi-consulta-localstorage.adapter';
import { MiConsultaHttpAdapter } from './adapters/mi-consulta-http.adapter';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mi-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: MiConsultaRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.miConsultaBackend
          ? new MiConsultaHttpAdapter(http)
          : new MiConsultaLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './mi-consulta.component.html',
  styleUrl: './mi-consulta.component.scss'
})
export class MiConsultaComponent implements OnInit {
  config: ConsultaConfig = {
    therapistName: '',
    license: '',
    specialty: '',
    email: '',
    phone: '',
    defaultSessionDuration: 50,
    costoPrimeraSesion: 1200,
    costoSeguimiento: 1000,
    edadMinimaAtencion: 12,
    sedes: []
  };

  sedesCatalog: TerapeutaSede[] = [];
  nuevaSedeId = '';

  savedNotification = false;
  saving = false;
  savingSedes = false;
  errorMessage = '';
  esBackend = environment.features.miConsultaBackend;

  historial: CambioConfiguracion[] = [];
  cargandoHistorial = false;

  constructor(
    private readonly consultaRepo: MiConsultaRepository,
    private readonly roleState: RoleStateService
  ) {}

  private get terapeutaId(): string | undefined {
    return this.roleState.terapeutaIds[0];
  }

  get sedesDisponibles(): TerapeutaSede[] {
    return this.sedesCatalog.filter((s) => !this.config.sedes.some((cs) => cs.id === s.id));
  }

  ngOnInit(): void {
    this.consultaRepo.obtenerConfig(this.terapeutaId).subscribe({
      next: (c) => (this.config = { ...c }),
      error: () => (this.errorMessage = 'No se pudo cargar la configuración del terapeuta.')
    });
    this.consultaRepo.obtenerSedesCatalog().subscribe({
      next: (sedes) => (this.sedesCatalog = sedes),
      error: () => {
        /* El catálogo de sedes es de apoyo; su fallo no bloquea la pantalla. */
      }
    });
    this.cargandoHistorial = true;
    this.consultaRepo.obtenerHistorial(this.terapeutaId).subscribe({
      next: (h) => {
        this.historial = h;
        this.cargandoHistorial = false;
      },
      error: () => {
        this.cargandoHistorial = false;
      }
    });
  }

  guardar(): void {
    this.saving = true;
    this.errorMessage = '';
    this.consultaRepo.guardarConfig(this.config, this.terapeutaId).subscribe({
      next: () => {
        this.saving = false;
        this.savedNotification = true;
        setTimeout(() => (this.savedNotification = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
      }
    });
  }

  agregarSede(): void {
    if (!this.nuevaSedeId) return;
    const sede = this.sedesCatalog.find((s) => s.id === this.nuevaSedeId);
    if (!sede || this.config.sedes.some((s) => s.id === sede.id)) return;
    const esPrincipal = this.config.sedes.length === 0;
    this.config = {
      ...this.config,
      sedes: [...this.config.sedes, { id: sede.id, nombre: sede.nombre, esPrincipal }]
    };
    this.nuevaSedeId = '';
  }

  quitarSede(sedeId: string): void {
    const eraPrincipal = this.config.sedes.find((s) => s.id === sedeId)?.esPrincipal;
    const restantes = this.config.sedes.filter((s) => s.id !== sedeId);
    if (eraPrincipal && restantes.length > 0) {
      restantes[0] = { ...restantes[0], esPrincipal: true };
    }
    this.config = { ...this.config, sedes: restantes };
  }

  marcarPrincipal(sedeId: string): void {
    this.config = {
      ...this.config,
      sedes: this.config.sedes.map((s) => ({ ...s, esPrincipal: s.id === sedeId }))
    };
  }

  guardarSedes(): void {
    this.savingSedes = true;
    this.errorMessage = '';
    this.consultaRepo.guardarSedes(this.config.sedes, this.terapeutaId).subscribe({
      next: (sedes) => {
        this.savingSedes = false;
        this.config = { ...this.config, sedes };
        this.savedNotification = true;
        setTimeout(() => (this.savedNotification = false), 3000);
      },
      error: () => {
        this.savingSedes = false;
        this.errorMessage = 'No se pudieron guardar las sedes. Inténtalo de nuevo.';
      }
    });
  }

  etiquetaCampo(campo: string): string {
    const etiquetas: Record<string, string> = {
      telefono: 'Teléfono',
      duracionSesionDefaultMin: 'Duración de sesión',
      costoPrimeraSesion: 'Costo primera sesión',
      costoSeguimiento: 'Costo de seguimiento',
      edadMinimaAtencion: 'Edad mínima de atención',
      sedes: 'Sedes de atención'
    };
    return etiquetas[campo] ?? campo;
  }
}
