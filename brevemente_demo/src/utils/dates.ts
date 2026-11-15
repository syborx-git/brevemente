/**
 * Utilidades de fechas dinámicas (PAR-13).
 * Sustituye las fechas fijas "de demostración" por la fecha real del sistema,
 * anclando la semilla de la demo al día de hoy.
 */

const pad = (n: number): string => String(n).padStart(2, '0');

/** Fecha de hoy en formato ISO local (YYYY-MM-DD), sin desfase de zona horaria. */
export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toLocalDate = (iso: string): Date => new Date(`${iso}T12:00:00`);

/** Suma (o resta) días a una fecha ISO y devuelve la nueva fecha ISO. */
export const addDaysISO = (baseISO: string, days: number): string => {
  const d = toLocalDate(baseISO);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Fecha ISO `days` días atrás desde hoy. */
export const daysAgoISO = (days: number): string => addDaysISO(todayISO(), -days);

/** Fecha ISO `days` días adelante desde hoy. */
export const daysFromNowISO = (days: number): string => addDaysISO(todayISO(), days);

/** Lunes de la semana actual (semana comienza en lunes). */
export const startOfWeekISO = (): string => {
  const d = toLocalDate(todayISO());
  const dow = (d.getDay() + 6) % 7; // lunes = 0
  return addDaysISO(todayISO(), -dow);
};

/** Domingo de la semana actual. */
export const endOfWeekISO = (): string => addDaysISO(startOfWeekISO(), 6);

/** Primer día del mes actual. */
export const startOfMonthISO = (): string => {
  const d = toLocalDate(todayISO());
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};
