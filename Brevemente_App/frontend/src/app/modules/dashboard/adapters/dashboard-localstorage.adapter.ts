import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AccionDominante,
  AlertaMayoriaEdad,
  CatalogosDashboard,
  DashboardFiltros,
  DashboardRepository,
  DashboardStats,
  PendientePrioritario,
  UrgentAlert
} from '../ports/dashboard.repository';
import { Appointment, PacienteResumen, Patient } from '../../../core/types/clinical.types';
import { mockAppointments, mockPatients } from '../../../core/data/mockData';
import {
  SerieMes,
  DistribucionFase,
  CasoProtocolo,
  sessionMinutes,
  agruparCitasPorMes,
  distribuirPorFase,
  agruparPorProtocolo,
  detectarMayoriaEdad,
  modalidadDePaciente,
  sedeDePaciente,
  protocoloDePaciente
} from '../../../core/utils/dashboard-metrics';

@Injectable({
  providedIn: 'root'
})
export class DashboardLocalStorageAdapter implements DashboardRepository {
  private readonly patientsKey = 'brevemente_patients';
  private readonly appointmentsKey = 'brevemente_appointments';

  /** Hoy simulado, coherente con el set de citas de la demo (2026-08-24). */
  private static readonly HOY = '2026-08-24';

  constructor() {
    if (!localStorage.getItem(this.patientsKey)) {
      localStorage.setItem(this.patientsKey, JSON.stringify(mockPatients));
    }
    if (!localStorage.getItem(this.appointmentsKey)) {
      localStorage.setItem(this.appointmentsKey, JSON.stringify(mockAppointments));
    }
  }

  private getPatients(): Patient[] {
    const raw = localStorage.getItem(this.patientsKey);
    return raw ? (JSON.parse(raw) as Patient[]) : mockPatients;
  }

  private getAppointments(): Appointment[] {
    const raw = localStorage.getItem(this.appointmentsKey);
    return raw ? (JSON.parse(raw) as Appointment[]) : mockAppointments;
  }

  /** Filtra pacientes por modalidad/sede/terapeuta/protocolo (sin periodo). */
  private pacientesFiltrados(filtros: DashboardFiltros = {}): Patient[] {
    return this.getPatients().filter((p) => {
      if (filtros.modalidad && modalidadDePaciente(p) !== filtros.modalidad) {
        return false;
      }
      if (filtros.sedeId && sedeDePaciente(p) !== filtros.sedeId) {
        return false;
      }
      if (filtros.terapeutaId && p.therapistId !== filtros.terapeutaId) {
        return false;
      }
      if (filtros.protocoloId && protocoloDePaciente(p) !== filtros.protocoloId) {
        return false;
      }
      return true;
    });
  }

  /** ¿La fecha cumple el periodo seleccionado? (default `mes` = todo el set). */
  private cumplePeriodo(date: string, periodo?: string): boolean {
    if (!periodo || periodo === 'mes') {
      return true;
    }
    if (periodo === 'hoy') {
      return date === DashboardLocalStorageAdapter.HOY;
    }
    if (periodo === 'semana') {
      return date >= '2026-08-24' && date <= '2026-08-28';
    }
    return true;
  }

  /** Citas filtradas por modalidad/sede/terapeuta/protocolo + periodo. */
  private citasFiltradas(filtros: DashboardFiltros = {}): Appointment[] {
    const patients = this.getPatients();
    return this.getAppointments().filter((app) => {
      const p = patients.find((x) => x.id === app.patientId);
      if (filtros.modalidad && p && modalidadDePaciente(p) !== filtros.modalidad) {
        return false;
      }
      if (filtros.sedeId && p && sedeDePaciente(p) !== filtros.sedeId) {
        return false;
      }
      if (filtros.terapeutaId && p && p.therapistId !== filtros.terapeutaId) {
        return false;
      }
      if (filtros.protocoloId && p && protocoloDePaciente(p) !== filtros.protocoloId) {
        return false;
      }
      return this.cumplePeriodo(app.date, filtros.periodo);
    });
  }

  /** Citas de hoy (independiente del periodo), filtradas por el resto de criterios. */
  private citasDeHoy(filtros: DashboardFiltros = {}): Appointment[] {
    const patients = this.getPatients();
    return this.getAppointments().filter((app) => {
      if (app.date !== DashboardLocalStorageAdapter.HOY) {
        return false;
      }
      const p = patients.find((x) => x.id === app.patientId);
      if (filtros.modalidad && p && modalidadDePaciente(p) !== filtros.modalidad) {
        return false;
      }
      if (filtros.sedeId && p && sedeDePaciente(p) !== filtros.sedeId) {
        return false;
      }
      if (filtros.terapeutaId && p && p.therapistId !== filtros.terapeutaId) {
        return false;
      }
      if (filtros.protocoloId && p && protocoloDePaciente(p) !== filtros.protocoloId) {
        return false;
      }
      return true;
    });
  }

  obtenerStats(filtros: DashboardFiltros = {}): Observable<DashboardStats> {
    const patients = this.pacientesFiltrados(filtros);
    const citasHoy = this.citasDeHoy(filtros);

    const stats: DashboardStats = {
      pacientesActivos: patients.filter((p) => p.status === 'activo').length,
      citasHoyCount: citasHoy.length,
      alertasConsentimiento: patients.filter(
        (p) => p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado
      ).length,
      alertasRiesgo: patients.filter((p) => p.riskLevel === 'medio' || p.riskLevel === 'alto').length,
      pendientesClinicos: patients.filter((p) => p.status === 'pendiente').length,
      confirmadasHoy: citasHoy.filter((a) => a.status === 'confirmada').length
    };
    return of(stats);
  }

  obtenerCitasHoy(filtros: DashboardFiltros = {}): Observable<Appointment[]> {
    return of(this.citasDeHoy(filtros));
  }

  obtenerAlertasUrgentes(filtros: DashboardFiltros = {}): Observable<UrgentAlert[]> {
    const patients = this.pacientesFiltrados(filtros);
    const alerts: UrgentAlert[] = [];

    const representado = patients.find(
      (p) => p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado
    );
    if (representado) {
      alerts.push({
        id: 'al-01',
        tipo: 'CONSENTIMIENTO',
        titulo: 'Falta Firma de Persona de Apoyo',
        descripcion: `El paciente ${representado.name} (${representado.edadCalculada} años) tiene citas bloqueadas hasta formalizar el consentimiento en expediente.`,
        pacienteId: representado.id,
        pacienteNombre: representado.name
      });
    }

    const riesgo = patients.find((p) => p.riskLevel === 'medio' || p.riskLevel === 'alto');
    if (riesgo) {
      alerts.push({
        id: 'al-02',
        tipo: 'RIESGO',
        titulo: 'Paciente con Nivel de Riesgo Elevado',
        descripcion: `El paciente ${riesgo.name} presenta nivel de riesgo ${riesgo.riskLevel}; se recomienda revisión prioritaria.`,
        pacienteId: riesgo.id,
        pacienteNombre: riesgo.name
      });
    }

    const pendiente = patients.find((p) => p.status === 'pendiente');
    if (pendiente) {
      alerts.push({
        id: 'al-03',
        tipo: 'PENDIENTE_CLINICO',
        titulo: 'Paciente Pendiente de Valoración Clínica',
        descripcion: `El paciente ${pendiente.name} está en estado pendiente y requiere valoración clínica.`,
        pacienteId: pendiente.id,
        pacienteNombre: pendiente.name
      });
    }

    return of(alerts);
  }

  obtenerPacientesRecientes(filtros: DashboardFiltros = {}): Observable<PacienteResumen[]> {
    return of(this.pacientesFiltrados(filtros).slice(0, 4));
  }

  obtenerCatalogos(): Observable<CatalogosDashboard> {
    const catalogos: CatalogosDashboard = {
      sedes: [
        { id: 'sede-centro', nombre: 'Sede Centro BreveMente' },
        { id: 'sede-norte', nombre: 'Sede Norte BreveMente' },
        { id: 'sede-sur', nombre: 'Sede Sur BreveMente' }
      ],
      protocolos: [
        { id: 'prot-panico', nombre: 'Ataque de Pánico' },
        { id: 'prot-toc', nombre: 'TOC Control' },
        { id: 'prot-fobia-escolar', nombre: 'Fobia Escolar' },
        { id: 'prot-fobia-social', nombre: 'Fobia Social' }
      ],
      terapeutas: [
        { id: 'therapist-1', nombre: 'Dr. Alejandro Silva' },
        { id: 'therapist-2', nombre: 'Dra. Patricia Ortiz' }
      ],
      modalidades: ['PRESENCIAL', 'ONLINE']
    };
    return of(catalogos);
  }

  obtenerCitasPorMes(filtros: DashboardFiltros): Observable<SerieMes[]> {
    return of(agruparCitasPorMes(this.citasFiltradas(filtros)));
  }

  obtenerDistribucionFases(filtros: DashboardFiltros): Observable<DistribucionFase[]> {
    return of(distribuirPorFase(this.pacientesFiltrados(filtros)));
  }

  obtenerCasosPorProtocolo(filtros: DashboardFiltros): Observable<CasoProtocolo[]> {
    return of(agruparPorProtocolo(this.pacientesFiltrados(filtros)));
  }

  obtenerAlertasMayoriaEdad(): Observable<AlertaMayoriaEdad[]> {
    const aging = detectarMayoriaEdad(this.getPatients());
    const alertas: AlertaMayoriaEdad[] = aging.map((p) => ({
      pacienteId: p.id,
      nombre: p.name,
      fechaNacimiento: p.fechaNacimiento || p.birthDate,
      representante: p.representante?.nombreCompleto || 'Padre/Madre/Tutor'
    }));
    return of(alertas);
  }

  obtenerPendientesPrioritarios(): Observable<PendientePrioritario[]> {
    const appointments = this.getAppointments();
    const pendientes: PendientePrioritario[] = this.getPatients()
      .filter((p) => p.status === 'pendiente')
      .map((p) => {
        const nextApp = appointments.find((a) => a.patientId === p.id);
        return {
          pacienteId: p.id,
          nombre: p.name,
          horaCita: nextApp?.time ?? '',
          motivo: nextApp
            ? `Debe completar historia clínica y firmar consentimiento antes de su cita a las ${nextApp.time}.`
            : 'Pendiente de historia clínica y consentimiento de audio.'
        };
      });
    return of(pendientes);
  }

  obtenerAccionDominante(filtros: DashboardFiltros = {}): Observable<AccionDominante | null> {
    const patients = this.getPatients();
    const citasHoy = this.citasDeHoy(filtros);
    const citasTodas = this.citasFiltradas(filtros);

    const nextAppointment =
      citasHoy.find((a) => a.status === 'confirmada' || a.status === 'pendiente') ||
      citasHoy[0] ||
      citasTodas[0];

    if (!nextAppointment) {
      return of(null);
    }

    const nextPatient = patients.find((p) => p.id === nextAppointment.patientId);
    if (!nextPatient) {
      return of(null);
    }

    const accion: AccionDominante = {
      citaId: nextAppointment.id,
      pacienteId: nextAppointment.patientId,
      pacienteNombre: nextAppointment.patientName,
      terapeutaNombre: nextPatient.therapistName,
      fecha: nextAppointment.date,
      hora: nextAppointment.time,
      tipoCita: nextAppointment.type,
      modalidad: modalidadDePaciente(nextPatient),
      duracionMinutos: sessionMinutes(nextAppointment),
      protocolo: protocoloDePaciente(nextPatient),
      intakeListo: nextPatient.status !== 'pendiente',
      consentimientoFirmado: nextPatient.consentimientoRepresentanteFirmado ?? false,
      grabacionLeva: nextPatient.registryMode === 'ia'
    };
    return of(accion);
  }
}
