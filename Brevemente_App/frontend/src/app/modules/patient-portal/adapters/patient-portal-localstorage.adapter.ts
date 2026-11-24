import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AlertaPortal,
  CitaPortal,
  ContraReferenciaPortal,
  PatientPortalRepository,
  PortalPerfil,
  SesionPortal
} from '../ports/patient-portal.repository';

/**
 * Adaptador de respaldo (feature flag pacientePortalBackend=false). Devuelve
 * datos vacíos para que el portal no falle sin backend.
 */
@Injectable({ providedIn: 'root' })
export class PatientPortalLocalStorageAdapter implements PatientPortalRepository {
  obtenerPerfil(): Observable<PortalPerfil> {
    return of({ id: 'pac-001', name: 'Paciente Demo', therapistName: '—', motif: '' });
  }

  listarCitas(): Observable<CitaPortal[]> {
    return of([]);
  }

  listarSesiones(): Observable<SesionPortal[]> {
    return of([]);
  }

  escalarCrisis(mensaje: string): Observable<AlertaPortal> {
    return of({
      id: 'alerta-local',
      tipo: 'crisis',
      mensaje,
      estado: 'activa',
      resueltaPor: null,
      resueltaEn: null,
      createdAt: new Date().toISOString()
    });
  }

  listarAlertas(): Observable<AlertaPortal[]> {
    return of([]);
  }

  obtenerContraReferencia(): Observable<ContraReferenciaPortal | null> {
    return of(null);
  }

  pagarCita(id: string): Observable<CitaPortal> {
    return of({
      id, date: '', time: '', type: 'seguimiento', status: 'confirmada',
      paymentStatus: 'pagada', duration: null, monto: null, bloqueadaPorNormativa: false
    });
  }

  cancelarCita(id: string, motivo: string, motivoDetalle?: string): Observable<CitaPortal> {
    return of({
      id, date: '', time: '', type: 'seguimiento', status: 'cancelada',
      paymentStatus: null, duration: null, monto: null, bloqueadaPorNormativa: false, motivoCancelacion: motivo
    });
  }
}
