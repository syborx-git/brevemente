import { Observable } from 'rxjs';
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

export type PagoNuevo = Omit<Payment, 'id' | 'patientName' | 'registeredBy' | 'createdAt'>;
export type ConstanciaNueva = Omit<PhysicalCertificateLog, 'id' | 'patientName' | 'status' | 'registeredBy' | 'registeredAt'>;
export type BitacoraNueva = Omit<SupervisionLog, 'id' | 'patientName' | 'therapistName'>;

export abstract class ExpedienteRepository {
  abstract listarPacientes(): Observable<Patient[]>;
  abstract obtenerPaciente(pacienteId: string): Observable<Patient | null>;
  abstract obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null>;
  abstract actualizarExpediente(pacienteId: string, datos: Partial<ClinicalRecord>): Observable<ClinicalRecord | null>;
  abstract obtenerSesiones(pacienteId: string): Observable<Session[]>;
  abstract agregarSesion(pacienteId: string, sesion: Omit<Session, 'id' | 'patientId' | 'status'>): Observable<Session>;
  abstract firmarConsentimiento(pacienteId: string): Observable<boolean>;
  
  // Pagos
  abstract listarPagos(pacienteId: string): Observable<Payment[]>;
  abstract registrarPago(pago: PagoNuevo): Observable<Payment>;
  abstract cambiarEstadoPago(pagoId: string, estado: PaymentStatus): Observable<Payment>;
  abstract eliminarPago(pagoId: string): Observable<void>;

  // Constancias
  abstract listarConstancias(pacienteId: string): Observable<PhysicalCertificateLog[]>;
  abstract registrarConstancia(constancia: ConstanciaNueva): Observable<PhysicalCertificateLog>;
  abstract anularConstancia(constanciaId: string): Observable<void>;

  // Auditoría
  abstract listarAuditoria(pacienteId: string): Observable<AuditLog[]>;

  // Bitácoras y Solicitudes de Supervisión
  abstract listarBitacoras(pacienteId: string): Observable<SupervisionLog[]>;
  abstract registrarBitacora(bitacora: BitacoraNueva): Observable<SupervisionLog>;
  abstract eliminarBitacora(bitacoraId: string): Observable<void>;
  abstract listarSolicitudes(pacienteId: string): Observable<SupervisionRequest[]>;
  abstract crearSolicitud(pacienteId: string, reason: string): Observable<SupervisionRequest>;
}
