import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
import { mockClinicalRecords, mockPatients, mockSessions } from '../../../core/data/mockData';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteLocalStorageAdapter implements ExpedienteRepository {
  private readonly recordsKey = 'brevemente_records';
  private readonly patientsKey = 'brevemente_patients';
  private readonly sessionsKey = 'brevemente_sessions';

  constructor() {
    if (!localStorage.getItem(this.recordsKey)) {
      localStorage.setItem(this.recordsKey, JSON.stringify(mockClinicalRecords));
    }
    if (!localStorage.getItem(this.sessionsKey)) {
      localStorage.setItem(this.sessionsKey, JSON.stringify(mockSessions));
    }
  }

  listarPacientes(): Observable<Patient[]> {
    const raw = localStorage.getItem(this.patientsKey);
    const patients: Patient[] = raw ? JSON.parse(raw) : mockPatients;
    return of(patients);
  }

  obtenerPaciente(pacienteId: string): Observable<Patient | null> {
    const raw = localStorage.getItem(this.patientsKey);
    const patients: Patient[] = raw ? JSON.parse(raw) : mockPatients;
    const found = patients.find(p => p.id === pacienteId) || null;
    return of(found);
  }

  obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null> {
    const raw = localStorage.getItem(this.recordsKey);
    const records: ClinicalRecord[] = raw ? JSON.parse(raw) : mockClinicalRecords;
    const found = records.find(r => r.patientId === pacienteId) || records[0] || null;
    return of(found);
  }

  actualizarExpediente(pacienteId: string, datos: Partial<ClinicalRecord>): Observable<ClinicalRecord | null> {
    return this.obtenerExpediente(pacienteId);
  }

  obtenerSesiones(pacienteId: string): Observable<Session[]> {
    const raw = localStorage.getItem(this.sessionsKey);
    const sessions: Session[] = raw ? JSON.parse(raw) : mockSessions;
    const filtered = sessions.filter(s => s.patientId === pacienteId);
    return of(filtered.length > 0 ? filtered : sessions.slice(0, 3));
  }

  agregarSesion(pacienteId: string, nueva: Omit<Session, 'id' | 'patientId' | 'status'>): Observable<Session> {
    const raw = localStorage.getItem(this.sessionsKey);
    const sessions: Session[] = raw ? JSON.parse(raw) : mockSessions;
    const created: Session = {
      ...nueva,
      id: `session-${Date.now().toString(36)}`,
      patientId: pacienteId,
      status: 'borrador'
    };
    sessions.unshift(created);
    localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    return of(created);
  }

  firmarConsentimiento(pacienteId: string): Observable<boolean> {
    const raw = localStorage.getItem(this.patientsKey);
    const patients: Patient[] = raw ? JSON.parse(raw) : mockPatients;
    const index = patients.findIndex(p => p.id === pacienteId);
    if (index !== -1) {
      patients[index].consentimientoRepresentanteFirmado = true;
      localStorage.setItem(this.patientsKey, JSON.stringify(patients));
      return of(true);
    }
    return of(false);
  }

  // Pagos
  listarPagos(pacienteId: string): Observable<Payment[]> {
    return of([]);
  }

  registrarPago(pago: PagoNuevo): Observable<Payment> {
    return of({
      ...pago,
      id: `pay-${Date.now()}`,
      patientName: '',
      registeredBy: 'Terapeuta Demo',
      createdAt: new Date().toISOString()
    });
  }

  cambiarEstadoPago(pagoId: string, estado: PaymentStatus): Observable<Payment> {
    return of({
      id: pagoId,
      patientId: '',
      patientName: '',
      concept: 'Concepto Demo',
      amount: 800,
      date: new Date().toISOString().split('T')[0],
      method: 'transferencia',
      status: estado,
      registeredBy: 'Terapeuta Demo',
      createdAt: new Date().toISOString()
    });
  }

  eliminarPago(pagoId: string): Observable<void> {
    return of(void 0);
  }

  // Constancias
  listarConstancias(pacienteId: string): Observable<PhysicalCertificateLog[]> {
    return of([]);
  }

  registrarConstancia(constancia: ConstanciaNueva): Observable<PhysicalCertificateLog> {
    return of({
      ...constancia,
      id: `con-${Date.now()}`,
      patientName: '',
      status: 'entregada_en_fisico',
      registeredBy: 'Terapeuta Demo',
      registeredAt: new Date().toISOString()
    });
  }

  anularConstancia(constanciaId: string): Observable<void> {
    return of(void 0);
  }

  // Auditoría
  listarAuditoria(pacienteId: string): Observable<AuditLog[]> {
    return of([]);
  }

  // Bitácoras y Solicitudes
  listarBitacoras(pacienteId: string): Observable<SupervisionLog[]> {
    return of([]);
  }

  registrarBitacora(bitacora: BitacoraNueva): Observable<SupervisionLog> {
    return of({
      ...bitacora,
      id: `sup-${Date.now()}`,
      patientName: '',
      therapistName: 'Terapeuta Demo'
    });
  }

  eliminarBitacora(bitacoraId: string): Observable<void> {
    return of(void 0);
  }

  listarSolicitudes(pacienteId: string): Observable<SupervisionRequest[]> {
    return of([]);
  }

  crearSolicitud(pacienteId: string, reason: string): Observable<SupervisionRequest> {
    return of({
      id: `sup-req-${Date.now()}`,
      patientId: pacienteId,
      patientName: '',
      therapistId: '',
      therapistName: '',
      reason,
      status: 'pendiente',
      createdAt: new Date().toISOString()
    });
  }
}
