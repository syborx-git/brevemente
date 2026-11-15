/**
 * Utilidades de derivación de fecha de nacimiento desde la CURP
 * (paridad 1:1 con la utilidad `legalConsent.ts` de la demo).
 */

export interface CurpBirthDateResult {
  isValid: boolean;
  birthDate: string | null;
}

/**
 * Extrae la fecha de nacimiento de una CURP de 18 caracteres en formato YYYY-MM-DD.
 *
 * Regla:
 * - Posiciones 5 a 10 (índices 4 a 9): AAMMDD.
 * - Posición 17 (índice 16): dígito → siglo 19xx; letra → siglo 20xx.
 */
export function parseCurpBirthDate(curp: string): CurpBirthDateResult {
  const clean = (curp || '').trim().toUpperCase();
  if (clean.length !== 18) {
    return { isValid: false, birthDate: null };
  }

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

  return { isValid: true, birthDate: `${fullYear}-${monthDigits}-${dayDigits}` };
}

/**
 * Evalúa discrepancias entre la CURP y la fecha de nacimiento capturada manualmente.
 * Devuelve un mensaje de advertencia no bloqueante si hay inconsistencia.
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
