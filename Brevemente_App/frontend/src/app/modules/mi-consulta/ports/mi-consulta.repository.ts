import { Observable } from 'rxjs';

export interface AccionDominante {
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

export interface CitaHoy {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  hora: string;
  tipo: string;
  modalidad: string;
  duracionMinutos: number;
  estado: string;
}

export interface AlertaStaff {
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

export interface SolicitudPendiente {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  terapeutaNombre: string | null;
  motivo: string;
  estado: string;
  createdAt: string;
}

export interface BorradorSesion {
  id: string;
  pacienteId: string;
  numero: number;
  fecha: string | null;
  notas: string | null;
  status: string;
}

export abstract class MiConsultaRepository {
  abstract obtenerAccionDominante(): Observable<AccionDominante | null>;
  abstract listarCitasHoy(): Observable<CitaHoy[]>;
  abstract listarAlertasActivas(): Observable<AlertaStaff[]>;
  abstract resolverAlerta(id: string): Observable<AlertaStaff>;
  abstract listarSolicitudesPendientes(): Observable<SolicitudPendiente[]>;
  abstract listarBorradores(): Observable<BorradorSesion[]>;
}
