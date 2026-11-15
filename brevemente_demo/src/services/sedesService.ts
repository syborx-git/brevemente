import { Establecimiento, TerapeutaSede } from '../types/clinical';

/**
 * Catálogo de sedes / establecimientos (PAR-10).
 * Solo lectura, equivalente al `obtenerSedesCatalog` del fullstack.
 * Semilla copiada de la migración V20 (sede-centro / sede-norte / sede-sur).
 * También administra las sedes asignadas al terapeuta (editables) con persistencia local.
 */

const STORAGE_KEY = 'brevemente_sedes';
const PATIENT_SEDE_KEY = 'brevemente_patient_sede';
const ASSIGNED_SEDES_KEY = 'brevemente_sedes_asignadas';

const DEFAULT_SEDES: Establecimiento[] = [
  { id: 'sede-centro', nombre: 'Sede Centro BreveMente', clues: 'CLSM-000001', licenciaSanitaria: 'LS-BM-2026-01', tipoEstablecimiento: 'privado' },
  { id: 'sede-norte', nombre: 'Sede Norte BreveMente', clues: 'CLSM-000002', licenciaSanitaria: 'LS-BM-2026-02', tipoEstablecimiento: 'privado' },
  { id: 'sede-sur', nombre: 'Sede Sur BreveMente', clues: 'CLSM-000003', licenciaSanitaria: 'LS-BM-2026-03', tipoEstablecimiento: 'social' }
];

/** Mapa paciente → sede, equivalente a la asignación de demo original. */
const DEFAULT_PATIENT_SEDE: Record<string, string> = {
  'pac-001': 'sede-centro',
  'pac-002': 'sede-centro',
  'pac-003': 'sede-norte',
  'pac-004': 'sede-sur'
};

const readSedes = (): Establecimiento[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEDES));
      return DEFAULT_SEDES;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SEDES;
  }
};

const readPatientSede = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(PATIENT_SEDE_KEY);
    if (!stored) {
      localStorage.setItem(PATIENT_SEDE_KEY, JSON.stringify(DEFAULT_PATIENT_SEDE));
      return DEFAULT_PATIENT_SEDE;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_PATIENT_SEDE;
  }
};

export const sedesService = {
  /** Catálogo completo de sedes (solo lectura). */
  getAll(): Establecimiento[] {
    return readSedes();
  },

  /** Devuelve el id de la sede asignada a un paciente (demo). */
  getSedeIdByPatientId(patientId: string): string {
    return readPatientSede()[patientId] ?? 'sede-centro';
  },

  /** Devuelve la sede completa asignada a un paciente. */
  getSedeByPatientId(patientId: string): Establecimiento | undefined {
    const sedeId = this.getSedeIdByPatientId(patientId);
    return this.getAll().find(s => s.id === sedeId);
  },

  /** Sedes asignadas al terapeuta (editables). Por defecto: sede-centro como principal. */
  getAssigned(): TerapeutaSede[] {
    try {
      const stored = localStorage.getItem(ASSIGNED_SEDES_KEY);
      if (stored) return JSON.parse(stored) as TerapeutaSede[];
    } catch {
      /* ignore */
    }
    const defaults: TerapeutaSede[] = [
      { id: 'sede-centro', nombre: 'Sede Centro BreveMente', esPrincipal: true }
    ];
    localStorage.setItem(ASSIGNED_SEDES_KEY, JSON.stringify(defaults));
    return defaults;
  },

  /** Persiste la lista de sedes asignadas. */
  saveAssigned(sedes: TerapeutaSede[]): TerapeutaSede[] {
    localStorage.setItem(ASSIGNED_SEDES_KEY, JSON.stringify(sedes));
    return sedes;
  }
};
