import { Appointment, Patient } from '../types/clinical.types';

/**
 * Utilidades puras de métricas para el dashboard (SDD-005 §4.3).
 *
 * Todas las funciones son puras y no dependen de servicios ni del DOM, lo que
 * permite testearlas de forma aislada. La paridad de datos con la demo React se
 * mantiene en las derivaciones de protocolo/modalidad/sede (mismo criterio que
 * `Dashboard.tsx`).
 */

export interface SerieMes {
  month: string;
  citas: number;
}

export interface DistribucionFase {
  fase: string;
  valor: number;
}

export interface CasoProtocolo {
  protocolo: string;
  casos: number;
}

/** Denominador de capacidad de pacientes activos (paridad con la demo). */
export const CAPACIDAD_PACIENTES = 10;

/** Límite semanal de pendientes clínicos (paridad con la demo). */
export const LIMITE_PENDIENTES_SEMANAL = 5;

/** Duración asumida para citas que no declaran `duration`. */
const DURACION_LEGACY = 60;

/** Minutos reales de una cita (60 si no declara `duration`). */
export function sessionMinutes(appointment: { duration?: 30 | 45 | 60 }): number {
  return appointment.duration ?? DURACION_LEGACY;
}

/** Porcentaje de capacidad (activos / capacidad * 100), redondeado. */
export function calcCapacidadPct(activos: number, capacidad: number = CAPACIDAD_PACIENTES): number {
  if (capacidad <= 0) {
    return 0;
  }
  return Math.round((activos / capacidad) * 100);
}

/** Porcentaje de pendientes respecto del límite semanal (pendientes / 5 * 100). */
export function calcPendientesPct(pendientes: number, limite: number = LIMITE_PENDIENTES_SEMANAL): number {
  if (limite <= 0) {
    return 0;
  }
  return Math.round((pendientes / limite) * 100);
}

const MESES_DEFAULT: { prefix: string; label: string }[] = [
  { prefix: '2026-07', label: 'Jul' },
  { prefix: '2026-08', label: 'Ago' },
  { prefix: '2026-09', label: 'Sep' }
];

/** Agrupa citas por mes (paridad con la demo: cuenta TODAS las citas del rango). */
export function agruparCitasPorMes(
  appointments: Appointment[],
  meses: { prefix: string; label: string }[] = MESES_DEFAULT
): SerieMes[] {
  return meses.map((m) => ({
    month: m.label,
    citas: appointments.filter((a) => (a.date ?? '').startsWith(m.prefix)).length
  }));
}

/**
 * Distribución de pacientes por Fase TBE, derivada de `status` + `riskLevel`
 * (mismo criterio que la demo y SDD-005 §2.3):
 *   Fase 1 (Admisión/Definición) = status pendiente
 *   Fase 2 (Desbloqueo)          = activo y riesgo medio/alto
 *   Fase 3 (Consolidación)       = activo y riesgo bajo
 *   Fase 4 (Cierre/Alta)         = completado/archivado
 */
export function distribuirPorFase(patients: Patient[]): DistribucionFase[] {
  const fase1 = patients.filter((p) => p.status === 'pendiente').length;
  const fase2 = patients.filter((p) => p.status === 'activo' && p.riskLevel !== 'bajo').length;
  const fase3 = patients.filter((p) => p.status === 'activo' && p.riskLevel === 'bajo').length;
  const fase4 = patients.filter((p) => p.status === 'completado' || p.status === 'archivado').length;

  return [
    { fase: 'Fase 1: Admisión/Definición', valor: fase1 },
    { fase: 'Fase 2: Desbloqueo', valor: fase2 },
    { fase: 'Fase 3: Consolidación', valor: fase3 },
    { fase: 'Fase 4: Cierre/Alta', valor: fase4 }
  ];
}

const PROTOCOLOS_CHART: { key: string; label: string }[] = [
  { key: 'Ataque de Pánico', label: 'Ataque Pánico' },
  { key: 'TOC Control', label: 'TOC Control' },
  { key: 'Fobia Escolar', label: 'Fobia Escolar' },
  { key: 'Fobia Social', label: 'Fobia Social' }
];

/** Agrupa pacientes por protocolo (4 protocolos canónicos). */
export function agruparPorProtocolo(patients: Patient[]): CasoProtocolo[] {
  return PROTOCOLOS_CHART.map((p) => ({
    protocolo: p.label,
    casos: patients.filter((x) => protocoloDePaciente(x) === p.key).length
  }));
}

/** Protocolo canónico derivado del paciente (paridad con la demo). */
export function protocoloDePaciente(patient: Patient): string {
  switch (patient.id) {
    case 'patient-1':
    case 'pac-001':
      return 'Ataque de Pánico';
    case 'patient-3':
    case 'pac-003':
      return 'TOC Control';
    case 'patient-5':
      return 'Fobia Escolar';
    default:
      return 'Fobia Social';
  }
}

/** Modalidad derivada del paciente (paridad con la demo). */
export function modalidadDePaciente(patient: Patient): 'PRESENCIAL' | 'ONLINE' {
  const online = patient.id === 'patient-1' || patient.id === 'patient-2' ||
    patient.id === 'pac-001' || patient.id === 'pac-002';
  return online ? 'ONLINE' : 'PRESENCIAL';
}

/** Sede derivada del paciente (paridad con la demo). */
export function sedeDePaciente(patient: Patient): string {
  if (patient.id === 'patient-1' || patient.id === 'patient-2' ||
    patient.id === 'pac-001' || patient.id === 'pac-002') {
    return 'sede-centro';
  }
  if (patient.id === 'patient-3' || patient.id === 'pac-003') {
    return 'sede-norte';
  }
  return 'sede-sur';
}

/** Edad precisa en años a partir de una fecha YYYY-MM-DD. */
export function calcularEdad(birthDateStr: string, refDate: Date = new Date()): number {
  if (!birthDateStr) {
    return 0;
  }
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) {
    return 0;
  }
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    return 0;
  }

  let age = refDate.getFullYear() - birthYear;
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Detecta pacientes en estado REPRESENTADO_POR_EDAD que ya cumplieron 18 años
 * (paridad con `checkAgingMinorPatients` de la demo).
 */
export function detectarMayoriaEdad(patients: Patient[], refDate: Date = new Date()): Patient[] {
  return patients.filter((p) => {
    if (p.capacidadConsentimiento?.estado !== 'REPRESENTADO_POR_EDAD') {
      return false;
    }
    const birthDate = p.fechaNacimiento || p.birthDate;
    if (!birthDate) {
      return false;
    }
    return calcularEdad(birthDate, refDate) >= 18;
  });
}
