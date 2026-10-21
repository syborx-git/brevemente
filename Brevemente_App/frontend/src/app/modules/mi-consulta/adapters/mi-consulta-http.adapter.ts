import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { CambioConfiguracion, ConsultaConfig, MiConsultaRepository, TerapeutaSede } from '../ports/mi-consulta.repository';
import { environment } from '../../../../environments/environment';

/** Wire de una sede (GET /mi-consulta y PUT /mi-consulta/sedes). */
interface TerapeutaSedeWire {
  id: string;
  nombre: string;
  esPrincipal: boolean;
}

/** Wire del backend (GET/PUT /api/v1/mi-consulta) — 10 campos + sedes. */
interface TerapeutaConfigWire {
  id: string;
  nombre: string;
  email: string;
  cedulaProfesional: string;
  especialidad: string;
  telefono: string | null;
  duracionSesionDefaultMin: number;
  costoPrimeraSesion: number;
  costoSeguimiento: number;
  edadMinimaAtencion: number;
  sedes: TerapeutaSedeWire[];
}

/** Body de actualización (solo los 5 campos editables). */
interface TerapeutaConfigRequestWire {
  telefono: string | null;
  duracionSesionDefaultMin: number;
  costoPrimeraSesion: number;
  costoSeguimiento: number;
  edadMinimaAtencion: number;
}

/** Body de reemplazo de sedes (PUT /mi-consulta/sedes). */
interface TerapeutaSedeRequestWire {
  sedeId: string;
  esPrincipal: boolean;
}

/** Wire del historial de configuración (GET /auditoria/configuracion/{id}). */
interface AuditoriaConfiguracionWire {
  id: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  usuarioNombre: string | null;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiConsultaHttpAdapter implements MiConsultaRepository {
  private readonly apiUrl = `${environment.apiBaseUrl}/mi-consulta`;

  constructor(private readonly http: HttpClient) {}

  obtenerConfig(terapeutaId?: string): Observable<ConsultaConfig> {
    return this.http
      .get<TerapeutaConfigWire>(this.apiUrl, { params: this.buildParams(terapeutaId) })
      .pipe(map((wire) => this.toDomain(wire)));
  }

  guardarConfig(config: ConsultaConfig, terapeutaId?: string): Observable<ConsultaConfig> {
    const body: TerapeutaConfigRequestWire = {
      telefono: config.phone || null,
      duracionSesionDefaultMin: config.defaultSessionDuration,
      costoPrimeraSesion: config.costoPrimeraSesion,
      costoSeguimiento: config.costoSeguimiento,
      edadMinimaAtencion: config.edadMinimaAtencion
    };
    return this.http
      .put<TerapeutaConfigWire>(this.apiUrl, body, { params: this.buildParams(terapeutaId) })
      .pipe(map((wire) => this.toDomain(wire)));
  }

  guardarSedes(sedes: TerapeutaSede[], terapeutaId?: string): Observable<TerapeutaSede[]> {
    const body: TerapeutaSedeRequestWire[] = sedes.map((s) => ({
      sedeId: s.id,
      esPrincipal: s.esPrincipal
    }));
    return this.http.put<TerapeutaSedeWire[]>(
      `${this.apiUrl}/sedes`,
      body,
      { params: this.buildParams(terapeutaId) }
    );
  }

  obtenerSedesCatalog(): Observable<TerapeutaSede[]> {
    return this.http
      .get<{ sedes: { id: string; nombre: string }[] }>(
        `${environment.apiBaseUrl}/dashboard/catalogos`
      )
      .pipe(
        map((resp) => (resp.sedes ?? []).map((s) => ({ id: s.id, nombre: s.nombre, esPrincipal: false })))
      );
  }

  obtenerHistorial(terapeutaId?: string): Observable<CambioConfiguracion[]> {
    if (!terapeutaId) {
      return of([]);
    }
    return this.http
      .get<AuditoriaConfiguracionWire[]>(
        `${environment.apiBaseUrl}/auditoria/configuracion/${terapeutaId}`
      )
      .pipe(
        map((items) => (items ?? []).map((i) => ({
          id: i.id,
          campo: i.campo,
          valorAnterior: i.valorAnterior ?? null,
          valorNuevo: i.valorNuevo ?? null,
          usuarioNombre: i.usuarioNombre ?? '',
          fecha: i.timestamp
        })))
      );
  }

  private buildParams(terapeutaId?: string): HttpParams {
    let params = new HttpParams();
    if (terapeutaId) {
      params = params.set('terapeutaId', terapeutaId);
    }
    return params;
  }

  private toDomain(wire: TerapeutaConfigWire): ConsultaConfig {
    return {
      therapistName: wire.nombre ?? '',
      license: wire.cedulaProfesional ?? '',
      specialty: wire.especialidad ?? '',
      email: wire.email ?? '',
      phone: wire.telefono ?? '',
      defaultSessionDuration: wire.duracionSesionDefaultMin ?? 50,
      costoPrimeraSesion: wire.costoPrimeraSesion ?? 0,
      costoSeguimiento: wire.costoSeguimiento ?? 0,
      edadMinimaAtencion: wire.edadMinimaAtencion ?? 0,
      sedes: (wire.sedes ?? []).map((s) => ({ id: s.id, nombre: s.nombre, esPrincipal: s.esPrincipal }))
    };
  }
}
