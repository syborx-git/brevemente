import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import {
  AccionDominante,
  AlertaStaff,
  BorradorSesion,
  CitaHoy,
  MiConsultaRepository,
  SolicitudPendiente
} from '../ports/mi-consulta.repository';
import { environment } from '../../../../environments/environment';

interface AccionDominanteWire {
  citaId: string;
  pacienteId: string;
  pacienteNombre: string;
  terapeutaNombre: string | null;
  fecha: string | null;
  hora: string | null;
  tipoCita: string;
  modalidad: string | null;
  duracionMinutos: number | null;
  consultorio: string | null;
  protocolo: string | null;
  intakeListo: boolean;
  consentimientoFirmado: boolean;
  grabacionLeva: boolean;
  motivoConsulta: string | null;
  numeroSesion: number | null;
}

interface CitaHoyWire {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  type: string;
  modality: string;
  duration: number;
  status: string;
}

interface AlertaStaffWire {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  tipo: string;
  estado: string;
  mensaje: string;
  createdAt: string;
  resueltaPor: string | null;
  resueltaEn: string | null;
}

interface SolicitudPendienteWire {
  id: string;
  patientId: string;
  patientName: string;
  therapistName: string | null;
  reason: string;
  status: string;
  createdAt: string;
}

interface BorradorSesionWire {
  id: string;
  patientId: string;
  number: number;
  date: string | null;
  notes: string | null;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class MiConsultaHttpAdapter implements MiConsultaRepository {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  obtenerAccionDominante(): Observable<AccionDominante | null> {
    return this.http
      .get<AccionDominanteWire | null>(`${this.baseUrl}/dashboard/accion-dominante`)
      .pipe(map((w) => (w ? this.toAccion(w) : null)));
  }

  listarCitasHoy(): Observable<CitaHoy[]> {
    return this.http
      .get<CitaHoyWire[]>(`${this.baseUrl}/dashboard/citas-hoy`)
      .pipe(map((citas) => citas.map((c) => this.toCita(c))));
  }

  listarAlertasActivas(): Observable<AlertaStaff[]> {
    return this.http
      .get<AlertaStaffWire[]>(`${this.baseUrl}/alertas/activas`)
      .pipe(map((alertas) => alertas.map((a) => this.toAlerta(a))));
  }

  resolverAlerta(id: string): Observable<AlertaStaff> {
    return this.http
      .patch<AlertaStaffWire>(`${this.baseUrl}/alertas/${id}/resolver`, {})
      .pipe(map((a) => this.toAlerta(a)));
  }

  listarSolicitudesPendientes(): Observable<SolicitudPendiente[]> {
    return this.http
      .get<SolicitudPendienteWire[]>(`${this.baseUrl}/supervision/solicitudes/pendientes`)
      .pipe(map((solicitudes) => solicitudes.map((s) => this.toSolicitud(s))));
  }

  listarBorradores(): Observable<BorradorSesion[]> {
    return this.http
      .get<BorradorSesionWire[]>(`${this.baseUrl}/expedientes/sesiones/borradores`)
      .pipe(
        map((sesiones) => sesiones.map((s) => this.toBorrador(s))),
        catchError(() => of([]))
      );
  }

  private toAccion(w: AccionDominanteWire): AccionDominante {
    return {
      citaId: w.citaId,
      pacienteId: w.pacienteId,
      pacienteNombre: w.pacienteNombre,
      terapeutaNombre: w.terapeutaNombre ?? null,
      fecha: w.fecha ?? null,
      hora: w.hora ?? null,
      tipoCita: w.tipoCita,
      modalidad: w.modalidad ?? null,
      duracionMinutos: w.duracionMinutos ?? null,
      consultorio: w.consultorio ?? null,
      protocolo: w.protocolo ?? null,
      intakeListo: !!w.intakeListo,
      consentimientoFirmado: !!w.consentimientoFirmado,
      grabacionLeva: !!w.grabacionLeva,
      motivoConsulta: w.motivoConsulta ?? null,
      numeroSesion: w.numeroSesion ?? null
    };
  }

  private toCita(w: CitaHoyWire): CitaHoy {
    return {
      id: w.id,
      pacienteId: w.patientId,
      pacienteNombre: w.patientName,
      hora: w.time,
      tipo: w.type,
      modalidad: w.modality ?? 'PRESENCIAL',
      duracionMinutos: w.duration ?? 30,
      estado: w.status
    };
  }

  private toAlerta(w: AlertaStaffWire): AlertaStaff {
    return {
      id: w.id,
      pacienteId: w.pacienteId,
      pacienteNombre: w.pacienteNombre,
      tipo: w.tipo,
      estado: w.estado,
      mensaje: w.mensaje,
      createdAt: w.createdAt,
      resueltaPor: w.resueltaPor ?? null,
      resueltaEn: w.resueltaEn ?? null
    };
  }

  private toSolicitud(w: SolicitudPendienteWire): SolicitudPendiente {
    return {
      id: w.id,
      pacienteId: w.patientId,
      pacienteNombre: w.patientName,
      terapeutaNombre: w.therapistName ?? null,
      motivo: w.reason,
      estado: w.status,
      createdAt: w.createdAt
    };
  }

  private toBorrador(w: BorradorSesionWire): BorradorSesion {
    return {
      id: w.id,
      pacienteId: w.patientId,
      numero: w.number,
      fecha: w.date ?? null,
      notas: w.notes ?? null,
      status: w.status
    };
  }
}
