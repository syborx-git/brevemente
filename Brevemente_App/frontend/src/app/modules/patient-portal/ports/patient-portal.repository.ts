import { Observable } from 'rxjs';

export interface PortalPerfil {
  id: string;
  name: string;
  therapistName: string;
  motif: string;
}

export interface CitaPortal {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  paymentStatus: string | null;
  duration: number | null;
}

export interface SesionPortal {
  id: string;
  citaId: string | null;
  numero: number;
  fecha: string;
  px: string[];
  notas: string;
}

export interface AlertaPortal {
  id: string;
  tipo: 'crisis' | 'seguridad_clinica' | 'crisis_atendida';
  mensaje: string;
  estado: 'activa' | 'resuelta';
  resueltaPor?: string | null;
  resueltaEn?: string | null;
  createdAt: string;
}

export interface ContraReferenciaPortal {
  id: string;
  fromTherapistName: string;
  toTherapistName: string;
  estado: string;
  aprobadaEl: string;
}

export abstract class PatientPortalRepository {
  abstract obtenerPerfil(): Observable<PortalPerfil>;
  abstract listarCitas(): Observable<CitaPortal[]>;
  abstract listarSesiones(): Observable<SesionPortal[]>;
  abstract escalarCrisis(mensaje: string): Observable<AlertaPortal>;
  abstract listarAlertas(): Observable<AlertaPortal[]>;
  abstract obtenerContraReferencia(): Observable<ContraReferenciaPortal | null>;
}
