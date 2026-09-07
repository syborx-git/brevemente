import { Patient, CapacidadConsentimiento, QuienCompletaRegistro } from '../types/clinical';

/**
 * Utilidades normativas de representación legal y capacidad de consentimiento
 * BreveMente — Sistema Clínico TBE
 *
 * NOMENCLATURA OBLIGATORIA: 'PERSONA_DE_APOYO' ("persona de apoyo designada").
 * Prohibido el uso de términos como "interdicción", "incapacitado" o "incompetente".
 */

export const LEGAL_CONSENT_TOOLTIP = 
  'Falta el consentimiento del representante legal. Complétalo en el expediente para habilitar esta acción.';

/**
 * Extrae la fecha de nacimiento de una CURP de 18 caracteres en formato YYYY-MM-DD.
 * 
 * Regla:
 * - Posiciones 5 a 10 (índices 4 a 9): AAMMDD.
 * - Posición 17 (índice 16): Dígito -> Siglo 19xx; Letra -> Siglo 20xx.
 */
export function parseCurpBirthDate(curp: string): { isValid: boolean; birthDate: string | null } {
  const clean = (curp || '').trim().toUpperCase();
  if (clean.length !== 18) {
    return { isValid: false, birthDate: null };
  }

  const curpRegex = /^[A-Z]{4}(\d{2})(\d{2})(\d{2})[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}([A-Z0-9])\d$/;
  const match = clean.match(curpRegex);

  // Si no encaja con el regex estricto pero tiene 18 caracteres y los números en posiciones 4 a 9
  const yearDigits = clean.substring(4, 6);
  const monthDigits = clean.substring(6, 8);
  const dayDigits = clean.substring(8, 10);
  const centuryChar = clean.charAt(16);

  if (!/^\d{2}$/.test(yearDigits) || !/^\d{2}$/.test(monthDigits) || !/^\d{2}$/.test(dayDigits)) {
    return { isValid: false, birthDate: null };
  }

  const is19xx = /\d/.test(centuryChar);
  const is20xx = /[A-Z]/.test(centuryChar);

  if (!is19xx && !is20xx) {
    return { isValid: false, birthDate: null };
  }

  const fullYear = `${is19xx ? '19' : '20'}${yearDigits}`;
  const monthNum = parseInt(monthDigits, 10);
  const dayNum = parseInt(dayDigits, 10);

  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return { isValid: false, birthDate: null };
  }

  const formattedDate = `${fullYear}-${monthDigits}-${dayDigits}`;
  return { isValid: true, birthDate: formattedDate };
}

/**
 * Calcula la edad precisa en años a partir de una fecha de nacimiento (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr: string, refDate: Date = new Date()): number {
  if (!birthDateStr) return 0;
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return 0;

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-index
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 0;

  let age = refDate.getFullYear() - birthYear;
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Evalúa discrepancias entre la CURP y la fecha de nacimiento capturada manualmente.
 * Devuelve el mensaje de advertencia no bloqueante si hay inconsistencia.
 */
export function evaluateCurpDateMismatch(curp: string, manualDate: string): string | null {
  const parsed = parseCurpBirthDate(curp);
  if (!parsed.isValid || !parsed.birthDate || !manualDate) {
    return null;
  }

  if (parsed.birthDate !== manualDate) {
    return 'La fecha de nacimiento no coincide con la CURP capturada. Verifica antes de continuar.';
  }

  return null;
}

/**
 * Determina el estado de capacidad de consentimiento al momento de crear el expediente:
 * - Edad 18 o más y PACIENTE -> AUTONOMO
 * - Menor de 18 -> REPRESENTADO_POR_EDAD (determinadoPor: null, automático)
 * - Edad 18 o más y FAMILIAR_O_APOYO -> PENDIENTE_DETERMINACION (no asume capacidad disminuida)
 * - REPRESENTADO_POR_CONDICION NO es asignable desde este formulario.
 */
export function determineCapacityState(
  edad: number,
  quienCompleta: QuienCompletaRegistro
): CapacidadConsentimiento {
  const today = new Date().toISOString().split('T')[0];

  if (edad < 18) {
    return {
      estado: 'REPRESENTADO_POR_EDAD',
      determinadoPor: null, // automático por edad
      fechaDeterminacion: today,
      fechaRevision: null,
      motivo: 'Minoría de edad calculada automáticamente por sistema'
    };
  }

  if (quienCompleta === 'FAMILIAR_O_APOYO') {
    return {
      estado: 'PENDIENTE_DETERMINACION',
      determinadoPor: null,
      fechaDeterminacion: null,
      fechaRevision: null,
      motivo: 'Registro realizado por familiar o persona de apoyo; pendiente juicio clínico en admisión'
    };
  }

  return {
    estado: 'AUTONOMO',
    determinadoPor: null,
    fechaDeterminacion: today,
    fechaRevision: null,
    motivo: null
  };
}

/**
 * Punto de extensión para asignación de REPRESENTADO_POR_CONDICION
 * Solo ejecutable por el clínico tratante en admisión con fechaRevision obligatoria.
 */
export function createRepresentadoPorCondicionState(
  therapistId: string,
  motivoClinico: string,
  fechaRevisionObligatoria: string
): CapacidadConsentimiento {
  if (!fechaRevisionObligatoria) {
    throw new Error('La fecha de revisión es estrictamente obligatoria para asignación de persona de apoyo.');
  }

  return {
    estado: 'REPRESENTADO_POR_CONDICION',
    determinadoPor: therapistId,
    fechaDeterminacion: new Date().toISOString().split('T')[0],
    fechaRevision: fechaRevisionObligatoria,
    motivo: motivoClinico
  };
}

/**
 * Valida si una acción clínica/operativa (Confirmar Cita, Grabación, Constancias) está bloqueada.
 * Se bloquea si el estado es REPRESENTADO_POR_EDAD o PENDIENTE_DETERMINACION y aún falta el consentimiento del representante.
 */
export function isActionBlockedByLegalConsent(patient?: Patient | null): { isBlocked: boolean; tooltip: string } {
  if (!patient || !patient.capacidadConsentimiento) {
    return { isBlocked: false, tooltip: '' };
  }

  const { estado } = patient.capacidadConsentimiento;
  const isProtectedState = estado === 'REPRESENTADO_POR_EDAD' || estado === 'PENDIENTE_DETERMINACION';
  const hasConsent = patient.consentimientoRepresentanteFirmado === true;

  if (isProtectedState && !hasConsent) {
    return {
      isBlocked: true,
      tooltip: LEGAL_CONSENT_TOOLTIP
    };
  }

  return { isBlocked: false, tooltip: '' };
}

/**
 * Detecta pacientes en estado REPRESENTADO_POR_EDAD que han cumplido 18 años.
 */
export function checkAgingMinorPatients(patients: Patient[], refDate: Date = new Date()): Patient[] {
  return patients.filter(p => {
    if (p.capacidadConsentimiento?.estado !== 'REPRESENTADO_POR_EDAD') return false;
    const birthDate = p.fechaNacimiento || p.birthDate;
    if (!birthDate) return false;
    const currentAge = calculateAge(birthDate, refDate);
    return currentAge >= 18;
  });
}
