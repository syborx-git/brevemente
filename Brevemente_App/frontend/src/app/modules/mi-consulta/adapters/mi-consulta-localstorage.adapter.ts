import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CambioConfiguracion, ConsultaConfig, MiConsultaRepository, TerapeutaSede } from '../ports/mi-consulta.repository';

const DEFAULT_CONFIG: ConsultaConfig = {
  therapistName: 'Dr. Alejandro Silva',
  license: 'CED-782190-PSIC',
  specialty: 'Terapia Breve Estratégica (Modelo Nardone)',
  email: 'alejandro.silva@brevemente.org',
  phone: '+52 55 5555 4321',
  defaultSessionDuration: 50,
  costoPrimeraSesion: 1200,
  costoSeguimiento: 1000,
  edadMinimaAtencion: 12,
  sedes: []
};

const CATALOGO_SEDES: TerapeutaSede[] = [
  { id: 'sede-centro', nombre: 'Sede Centro BreveMente', esPrincipal: false },
  { id: 'sede-norte', nombre: 'Sede Norte BreveMente', esPrincipal: false },
  { id: 'sede-sur', nombre: 'Sede Sur BreveMente', esPrincipal: false }
];

@Injectable({
  providedIn: 'root'
})
export class MiConsultaLocalStorageAdapter implements MiConsultaRepository {
  private readonly storageKey = 'brevemente_consulta_config';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(DEFAULT_CONFIG));
    }
  }

  private getStored(): ConsultaConfig {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  }

  obtenerConfig(terapeutaId?: string): Observable<ConsultaConfig> {
    return of(this.getStored());
  }

  guardarConfig(config: ConsultaConfig, terapeutaId?: string): Observable<ConsultaConfig> {
    localStorage.setItem(this.storageKey, JSON.stringify(config));
    return of(config);
  }

  guardarSedes(sedes: TerapeutaSede[], terapeutaId?: string): Observable<TerapeutaSede[]> {
    const config = this.getStored();
    config.sedes = sedes;
    localStorage.setItem(this.storageKey, JSON.stringify(config));
    return of(sedes);
  }

  obtenerSedesCatalog(): Observable<TerapeutaSede[]> {
    return of(CATALOGO_SEDES);
  }

  obtenerHistorial(terapeutaId?: string): Observable<CambioConfiguracion[]> {
    return of([]);
  }
}
