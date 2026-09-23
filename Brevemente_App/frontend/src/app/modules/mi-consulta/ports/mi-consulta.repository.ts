import { Observable } from 'rxjs';

export interface ConsultaConfig {
  therapistName: string;
  license: string;
  specialty: string;
  email: string;
  phone: string;
  defaultSessionDuration: number;
  costoPrimeraSesion: number;
  costoSeguimiento: number;
  edadMinimaAtencion: number;
}

export abstract class MiConsultaRepository {
  abstract obtenerConfig(): Observable<ConsultaConfig>;
  abstract guardarConfig(config: ConsultaConfig): Observable<ConsultaConfig>;
}
