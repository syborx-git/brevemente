/**
 * Servicio de configuración del terapeuta
 * BreveMente — Sistema Clínico TBE
 */

export interface TherapistSettings {
  edadMinimaAtencion: number; // Por defecto 0
  consultorioDefault?: string;
  firmaDigitalHabilitada?: boolean;
  // PAR-09 — datos profesionales y tarifas del terapeuta
  therapistName: string;
  license: string;
  specialty: string;
  email: string;
  phone: string;
  defaultSessionDuration: 30 | 45 | 60;
  costoPrimeraSesion: number;
  costoSeguimiento: number;
}

const STORAGE_KEY = 'brevemente_therapist_settings';

const DEFAULT_SETTINGS: TherapistSettings = {
  edadMinimaAtencion: 0,
  consultorioDefault: 'Consultorio A',
  firmaDigitalHabilitada: true,
  therapistName: 'Dra. Sofía Ramírez Lozano',
  license: 'CÉD. PROF. 12345678',
  specialty: 'Psicología Clínica Estratégica (TBE)',
  email: 'alejandro.silva@brevemente.org',
  phone: '55 1234 5678',
  defaultSessionDuration: 60,
  costoPrimeraSesion: 1200,
  costoSeguimiento: 950
};

export const therapistSettingsService = {
  getSettings(): TherapistSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  updateSettings(settings: Partial<TherapistSettings>): TherapistSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('brevemente_settings_updated', { detail: updated }));
    return updated;
  },

  getEdadMinimaAtencion(): number {
    return this.getSettings().edadMinimaAtencion ?? 0;
  },

  setEdadMinimaAtencion(edad: number): void {
    this.updateSettings({ edadMinimaAtencion: Math.max(0, edad) });
  }
};
