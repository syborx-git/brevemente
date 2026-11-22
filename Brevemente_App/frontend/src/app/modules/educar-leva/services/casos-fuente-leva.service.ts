import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CaseCandidate {
  expedienteId: string;
  folio: string;
  estatus: string;
  spr?: string;
  diagnosticoOperativo?: string;
  trastornoEstrategico?: string;
  fechaApertura?: string;
  numSesiones: number;
  propuestasAprobadas: number;
  yaEsFuente: boolean;
}

export interface CaseSource {
  id?: string;
  caseToken?: string;
  expedienteId: string;
  expedienteFolio?: string;
  status?: 'ACTIVE' | 'REVOKED';
  spr?: string;
  diagnosticoOperativo?: string;
  trastornoEstrategico?: string;
  tentativas: string[];
  prescripciones: string[];
  reestructuraciones: string[];
  resultado?: string;
  numSesiones?: number;
  perfilEtario?: string;
  notasCuraduria?: string;
  approvedBy?: string;
  approvedAt?: string;
  revokedBy?: string;
  revokedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CasosFuenteLevaService {
  private readonly baseUrl = `${environment.apiBaseUrl}/leva/cases`;

  constructor(private readonly http: HttpClient) {}

  buscarCandidatos(q: string, estatus: string, limit = 25): Observable<CaseCandidate[]> {
    let params = new HttpParams().set('limit', limit);
    if (q?.trim()) params = params.set('q', q.trim());
    if (estatus) params = params.set('estatus', estatus);
    return this.http.get<CaseCandidate[]>(`${this.baseUrl}/candidates`, { params });
  }

  previsualizar(expedienteId: string): Observable<CaseSource> {
    return this.http.get<CaseSource>(`${this.baseUrl}/candidates/${expedienteId}/preview`);
  }

  aceptar(expedienteId: string, notasCuraduria: string): Observable<CaseSource> {
    return this.http.post<CaseSource>(`${this.baseUrl}/sources`, {
      expedienteId,
      notasCuraduria: notasCuraduria?.trim() || null
    });
  }

  listarFuentes(incluirRetirados = false): Observable<CaseSource[]> {
    const params = new HttpParams().set('includeRevoked', incluirRetirados);
    return this.http.get<CaseSource[]>(`${this.baseUrl}/sources`, { params });
  }

  retirar(id: string): Observable<CaseSource> {
    return this.http.delete<CaseSource>(`${this.baseUrl}/sources/${id}`);
  }
}
