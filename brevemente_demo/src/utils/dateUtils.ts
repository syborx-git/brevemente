/**
 * Utilidades de fecha para la Agenda.
 * Todas las fechas se manejan como string ISO "YYYY-MM-DD" en zona local (sin UTC),
 * para evitar desfases de día al usar new Date(iso).
 */

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

export function addYears(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setFullYear(d.getFullYear() + n);
  return toISO(d);
}

/** Devuelve el lunes de la semana que contiene la fecha dada. */
export function startOfWeek(iso: string): string {
  const d = parseISO(iso);
  const day = d.getDay(); // 0 = domingo, 1 = lunes ...
  const diff = day === 0 ? -6 : 1 - day; // lunes como inicio de semana
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

/** Devuelve el primer día del mes de la fecha dada. */
export function startOfMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

/** Número de días del mes (month: 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function dayName(iso: string): string {
  return DAY_NAMES[parseISO(iso).getDay()];
}

/** Nombre del mes en español. month: 1-12. */
export function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'long' });
}

export function yearOf(iso: string): number {
  return parseISO(iso).getFullYear();
}

export function monthOf(iso: string): number {
  return parseISO(iso).getMonth() + 1;
}