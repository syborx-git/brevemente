import { Observable } from 'rxjs';

export interface TerapeutaSede {
  id: string;
  nombre: string;
  esPrincipal: boolean;
}

export interface CambioConfiguracion {
  id: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  usuarioNombre: string;
  fecha: string;
}

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
  sedes: TerapeutaSede[];
}

export abstract class MiConsultaRepository {
  abstract obtenerConfig(terapeutaId?: string): Observable<ConsultaConfig>;
  abstract guardarConfig(config: ConsultaConfig, terapeutaId?: string): Observable<ConsultaConfig>;
  abstract guardarSedes(sedes: TerapeutaSede[], terapeutaId?: string): Observable<TerapeutaSede[]>;
  abstract obtenerSedesCatalog(): Observable<TerapeutaSede[]>;
  abstract obtenerHistorial(terapeutaId?: string): Observable<CambioConfiguracion[]>;
}
