import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BitacoraNueva, ConstanciaNueva, ExpedienteRepository, PagoNuevo } from '../ports/expediente.repository';
import {
  AuditLog,
  ClinicalRecord,
  Patient,
  Payment,
  PaymentStatus,
  PhysicalCertificateLog,
  Session,
  SupervisionLog,
  SupervisionRequest
} from '../../../core/types/clinical.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteHttpAdapter implements ExpedienteRepository {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  listarPacientes(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.base}/pacientes`).pipe(catchError(() => of([])));
  }

  obtenerPaciente(pacienteId: string): Observable<Patient | null> {
    return this.http.get<Patient>(`${this.base}/pacientes/${pacienteId}`)
      .pipe(catchError(() => of(null)));
  }

  obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null> {
    return this.http.get<ClinicalRecord>(`${this.base}/expedientes/paciente/${pacienteId}`)
      .pipe(catchError(() => of(null)));
  }

  actualizarExpediente(pacienteId: string, datos: Partial<ClinicalRecord>): Observable<ClinicalRecord | null> {
    return this.http.patch<ClinicalRecord>(`${this.base}/expedientes/paciente/${pacienteId}`, datos)
      .pipe(catchError(() => of(null)));
  }

  // Pagos
  listarPagos(pacienteId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/pagos?pacienteId=${pacienteId}`)
      .pipe(catchError(() => of([])));
  }

  registrarPago(pago: PagoNuevo): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/pagos`, pago);
  }

  cambiarEstadoPago(pagoId: string, estado: PaymentStatus): Observable<Payment> {
    return this.http.patch<Payment>(`${this.base}/pagos/${pagoId}/estado`, { estado });
  }

  eliminarPago(pagoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/pagos/${pagoId}`);
  }

  // Constancias
  listarConstancias(pacienteId: string): Observable<PhysicalCertificateLog[]> {
    return this.http.get<PhysicalCertificateLog[]>(`${this.base}/constancias?pacienteId=${pacienteId}`)
      .pipe(catchError(() => of([])));
  }

  registrarConstancia(constancia: ConstanciaNueva): Observable<PhysicalCertificateLog> {
    return this.http.post<PhysicalCertificateLog>(`${this.base}/constancias`, constancia);
  }

  anularConstancia(constanciaId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/constancias/${constanciaId}`);
  }

  // Auditoría
  listarAuditoria(pacienteId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/expedientes/paciente/${pacienteId}/auditoria`)
      .pipe(catchError(() => of([])));
  }

  // Bitácoras y Solicitudes de Supervisión
  listarBitacoras(pacienteId: string): Observable<SupervisionLog[]> {
    return this.http.get<SupervisionLog[]>(`${this.base}/supervision/bitacoras?pacienteId=${pacienteId}`)
      .pipe(catchError(() => of([])));
  }

  registrarBitacora(bitacora: BitacoraNueva): Observable<SupervisionLog> {
    return this.http.post<SupervisionLog>(`${this.base}/supervision/bitacoras`, bitacora);
  }

  eliminarBitacora(bitacoraId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/supervision/bitacoras/${bitacoraId}`);
  }

  listarSolicitudes(pacienteId: string): Observable<SupervisionRequest[]> {
    return this.http.get<SupervisionRequest[]>(`${this.base}/supervision/solicitudes?pacienteId=${pacienteId}`)
      .pipe(catchError(() => of([])));
  }

  crearSolicitud(pacienteId: string, reason: string): Observable<SupervisionRequest> {
    return this.http.post<SupervisionRequest>(`${this.base}/supervision/solicitudes`, { pacienteId, reason });
  }

  // Sesiones
  obtenerSesiones(pacienteId: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/expedientes/paciente/${pacienteId}/sesiones`)
      .pipe(catchError(() => of([])));
  }

  agregarSesion(pacienteId: string, sesion: Omit<Session, 'id' | 'patientId' | 'status'>): Observable<Session> {
    return this.http.post<Session>(`${this.base}/expedientes/paciente/${pacienteId}/sesiones`, sesion);
  }

  firmarConsentimiento(pacienteId: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/pacientes/${pacienteId}/consentimiento/firmar`, {})
      .pipe(map(() => true));
  }
}
