import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AccionDominante,
  AlertaStaff,
  BorradorSesion,
  CitaHoy,
  MiConsultaRepository,
  SolicitudPendiente
} from '../ports/mi-consulta.repository';

const ACCION_DEMO: AccionDominante = {
  citaId: 'cit-demo-1',
  pacienteId: 'patient-1',
  pacienteNombre: 'Sofía Martínez',
  terapeutaNombre: 'Dr. Alejandro Silva',
  fecha: '2026-10-21',
  hora: '09:00',
  tipoCita: 'seguimiento',
  modalidad: 'PRESENCIAL',
  duracionMinutos: 50,
  consultorio: 'A',
  protocolo: 'Ataque de Pánico',
  intakeListo: true,
  consentimientoFirmado: true,
  grabacionLeva: true,
  motivoConsulta: 'Ataque de Pánico (TBE-P-01)',
  numeroSesion: 3
};

const CITAS_DEMO: CitaHoy[] = [
  { id: 'cit-demo-1', pacienteId: 'patient-1', pacienteNombre: 'Sofía Martínez', hora: '09:00', tipo: 'seguimiento', modalidad: 'PRESENCIAL', duracionMinutos: 50, estado: 'confirmada' },
  { id: 'cit-demo-2', pacienteId: 'patient-2', pacienteNombre: 'Carlos Mendoza', hora: '11:00', tipo: 'primera', modalidad: 'ONLINE', duracionMinutos: 30, estado: 'pendiente' },
  { id: 'cit-demo-3', pacienteId: 'patient-3', pacienteNombre: 'Valeria Gómez', hora: '13:00', tipo: 'cierre', modalidad: 'PRESENCIAL', duracionMinutos: 45, estado: 'confirmada' }
];

const ALERTAS_DEMO: AlertaStaff[] = [
  {
    id: 'alerta-demo-1',
    pacienteId: 'patient-1',
    pacienteNombre: 'Sofía Martínez',
    tipo: 'crisis',
    estado: 'activa',
    mensaje: 'ALERTA ROJA: El paciente activó el Botón de Crisis de emergencia desde su portal.',
    createdAt: '2026-10-21T08:00:00-06:00',
    resueltaPor: null,
    resueltaEn: null
  }
];

const SOLICITUDES_DEMO: SolicitudPendiente[] = [
  {
    id: 'sup-req-demo-1',
    pacienteId: 'patient-2',
    pacienteNombre: 'Carlos Mendoza',
    terapeutaNombre: 'Dr. Alejandro Silva',
    motivo: 'Duda sobre maniobra de reestructuración en sesión 4',
    estado: 'pendiente',
    createdAt: '2026-10-20T16:00:00-06:00'
  }
];

const BORRADORES_DEMO: BorradorSesion[] = [
  {
    id: 'ses-demo-1',
    pacienteId: 'patient-1',
    numero: 3,
    fecha: '2026-10-21',
    notas: 'Prescribir la maniobra de la peor fantasía de 30 minutos a las 18:00...',
    status: 'borrador'
  }
];

@Injectable({ providedIn: 'root' })
export class MiConsultaLocalStorageAdapter implements MiConsultaRepository {
  obtenerAccionDominante(): Observable<AccionDominante | null> {
    return of(ACCION_DEMO);
  }

  listarCitasHoy(): Observable<CitaHoy[]> {
    return of(CITAS_DEMO);
  }

  listarAlertasActivas(): Observable<AlertaStaff[]> {
    return of(ALERTAS_DEMO);
  }

  resolverAlerta(id: string): Observable<AlertaStaff> {
    const alerta = ALERTAS_DEMO.find((a) => a.id === id);
    return of({ ...(alerta ?? ALERTAS_DEMO[0]), estado: 'resuelta', resueltaPor: 'staff', resueltaEn: new Date().toISOString() });
  }

  listarSolicitudesPendientes(): Observable<SolicitudPendiente[]> {
    return of(SOLICITUDES_DEMO);
  }

  listarBorradores(): Observable<BorradorSesion[]> {
    return of(BORRADORES_DEMO);
  }
}
