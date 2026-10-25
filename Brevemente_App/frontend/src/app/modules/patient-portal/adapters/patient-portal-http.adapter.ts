import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import {
  AlertaPortal,
  CitaPortal,
  ContraReferenciaPortal,
  PatientPortalRepository,
  PortalPerfil,
  SesionPortal
} from '../ports/patient-portal.repository';
import { environment } from '../../../../environments/environment';

interface CitaBackend {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  paymentStatus: string | null;
  duration: number | null;
}

interface SesionBackend {
  id: string;
  citaId: string | null;
  numero: number;
  fecha: string;
  px: string;
  notas: string;
}

interface AlertaBackend {
  id: string;
  tipo: string;
  mensaje: string;
  estado: string;
  resueltaPor?: string | null;
  resueltaEn?: string | null;
  createdAt: string;
}

interface ContraReferenciaBackend {
  id: string;
  fromTherapistName: string;
  toTherapistName: string;
  estado: string;
  aprobadaEl: string;
}

@Injectable({ providedIn: 'root' })
export class PatientPortalHttpAdapter implements PatientPortalRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/portal-paciente`;
  private readonly citasUrl = `${environment.apiBaseUrl}/citas`;

  constructor(private readonly http: HttpClient) {}

  obtenerPerfil(): Observable<PortalPerfil> {
    return this.http.get<PortalPerfil>(`${this.baseUrl}/perfil`).pipe(
      catchError(() => throwError(() => new Error('No se pudo cargar tu perfil.')))
    );
  }

  listarCitas(): Observable<CitaPortal[]> {
    return this.http.get<CitaBackend[]>(this.citasUrl).pipe(
      map((citas) => citas.map((c) => this.toCita(c))),
      catchError(() => throwError(() => new Error('No se pudieron cargar tus citas.')))
    );
  }

  listarSesiones(): Observable<SesionPortal[]> {
    return this.http.get<SesionBackend[]>(`${this.baseUrl}/sesiones`).pipe(
      map((sesiones) => sesiones.map((s) => this.toSesion(s))),
      catchError(() => throwError(() => new Error('No se pudieron cargar tus sesiones.')))
    );
  }

  escalarCrisis(mensaje: string): Observable<AlertaPortal> {
    return this.http.post<AlertaBackend>(`${this.baseUrl}/crisis`, { mensaje }).pipe(
      map((a) => this.toAlerta(a)),
      catchError(() => throwError(() => new Error('No se pudo enviar tu aviso de crisis.')))
    );
  }

  listarAlertas(): Observable<AlertaPortal[]> {
    return this.http.get<AlertaBackend[]>(`${this.baseUrl}/alertas`).pipe(
      map((alertas) => alertas.map((a) => this.toAlerta(a))),
      catchError(() => of([]))
    );
  }

  obtenerContraReferencia(): Observable<ContraReferenciaPortal | null> {
    return this.http
      .get<ContraReferenciaBackend>(`${this.baseUrl}/contra-referencia`, { observe: 'response' })
      .pipe(
        map((resp) => (resp.status === 204 ? null : resp.body)),
        catchError((err) => (err?.status === 404 ? of(null) : throwError(() => err)))
      );
  }

  private toCita(c: CitaBackend): CitaPortal {
    return {
      id: c.id,
      date: c.date,
      time: c.time,
      type: c.type,
      status: c.status,
      paymentStatus: c.paymentStatus ?? null,
      duration: c.duration ?? null
    };
  }

  private toSesion(s: SesionBackend): SesionPortal {
    let px: string[] = [];
    try {
      const parsed = JSON.parse(s.px ?? '[]');
      if (Array.isArray(parsed)) {
        px = parsed.map((x) => String(x));
      }
    } catch {
      px = [];
    }
    return {
      id: s.id,
      citaId: s.citaId ?? null,
      numero: s.numero,
      fecha: s.fecha,
      px,
      notas: s.notas ?? ''
    };
  }

  private toAlerta(a: AlertaBackend): AlertaPortal {
    return {
      id: a.id,
      tipo: a.tipo as AlertaPortal['tipo'],
      mensaje: a.mensaje,
      estado: a.estado as AlertaPortal['estado'],
      resueltaPor: a.resueltaPor ?? null,
      resueltaEn: a.resueltaEn ?? null,
      createdAt: a.createdAt
    };
  }
}
