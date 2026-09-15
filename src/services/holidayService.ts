/**
 * Servicio de calendario festivo y días no laborables.
 * BreveMente — Sistema Clínico TBE
 *
 * Maneja:
 *  - Festivos oficiales de México (seed 2026, de solo lectura).
 *  - Días personales del terapeuta (CRUD).
 *  - Configuración "bloquear festivos para agendar".
 */

import { auditLogService } from './auditLogService';
import { Role, Holiday } from '../types/clinical';

const STORAGE_KEY = 'brevemente_holidays';
const SETTINGS_KEY = 'brevemente_holiday_settings';

const OFFICIAL_HOLIDAYS_2026: Holiday[] = [
  { id: 'hol-1', date: '2026-01-01', name: 'Año Nuevo', type: 'oficial' },
  { id: 'hol-2', date: '2026-02-02', name: 'Día de la Constitución', type: 'oficial' },
  { id: 'hol-3', date: '2026-03-16', name: 'Natalicio de Benito Juárez', type: 'oficial' },
  { id: 'hol-4', date: '2026-05-01', name: 'Día del Trabajo', type: 'oficial' },
  { id: 'hol-5', date: '2026-09-16', name: 'Día de la Independencia', type: 'oficial' },
  { id: 'hol-6', date: '2026-11-16', name: 'Día de la Revolución', type: 'oficial' },
  { id: 'hol-7', date: '2026-12-25', name: 'Navidad', type: 'oficial' }
];

type UserLike = { id: string; name: string; role: Role };

export const holidayService = {
  getHolidays(): Holiday[] {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFICIAL_HOLIDAYS_2026));
      return OFFICIAL_HOLIDAYS_2026;
    }
    return JSON.parse(json);
  },

  getOfficialHolidays(): Holiday[] {
    return this.getHolidays().filter(h => h.type === 'oficial');
  },

  getPersonalHolidays(): Holiday[] {
    return this.getHolidays().filter(h => h.type === 'personal');
  },

  getHolidayByDate(date: string): Holiday | undefined {
    return this.getHolidays().find(h => h.date === date);
  },

  addPersonalHoliday(date: string, name: string, user: UserLike): Holiday {
    const holidays = this.getHolidays();
    const newHoliday: Holiday = {
      id: `hol-${Date.now()}`,
      date,
      name: name.trim() || 'Día personal',
      type: 'personal',
      createdBy: user.name
    };
    holidays.push(newHoliday);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
    auditLogService.addLog(
      'Día personal bloqueado',
      `Bloqueó el ${date} por "${newHoliday.name}" (personal).`,
      'sesion',
      user
    );
    window.dispatchEvent(new CustomEvent('brevemente_holidays_changed'));
    return newHoliday;
  },

  removeHoliday(id: string, user: UserLike): void {
    const holidays = this.getHolidays();
    const target = holidays.find(h => h.id === id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays.filter(h => h.id !== id)));
    if (target) {
      auditLogService.addLog(
        'Día desbloqueado',
        `Eliminó el día bloqueado "${target.name}" (${target.date}).`,
        'sesion',
        user
      );
    }
    window.dispatchEvent(new CustomEvent('brevemente_holidays_changed'));
  },

  getBlockHolidays(): boolean {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return false;
      return (JSON.parse(raw) as { blockHolidays: boolean }).blockHolidays === true;
    } catch {
      return false;
    }
  },

  setBlockHolidays(block: boolean): boolean {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ blockHolidays: block }));
    window.dispatchEvent(new CustomEvent('brevemente_holiday_settings_changed'));
    return block;
  }
};