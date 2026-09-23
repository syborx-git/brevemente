import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ConsultaConfig, MiConsultaRepository } from '../ports/mi-consulta.repository';

const DEFAULT_CONFIG: ConsultaConfig = {
  therapistName: 'Dr. Alejandro Silva',
  license: 'CED-782190-PSIC',
  specialty: 'Terapia Breve Estratégica (Modelo Nardone)',
  email: 'alejandro.silva@brevemente.org',
  phone: '+52 55 5555 4321',
  defaultSessionDuration: 50,
  costoPrimeraSesion: 1200,
  costoSeguimiento: 1000,
  edadMinimaAtencion: 12
};

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

  obtenerConfig(): Observable<ConsultaConfig> {
    return of(this.getStored());
  }

  guardarConfig(config: ConsultaConfig): Observable<ConsultaConfig> {
    localStorage.setItem(this.storageKey, JSON.stringify(config));
    return of(config);
  }
}
