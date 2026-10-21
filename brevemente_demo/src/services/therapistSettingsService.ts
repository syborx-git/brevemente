/**
 * Servicio de configuración del terapeuta
 * BreveMente — Sistema Clínico TBE
 */

export interface TherapistSettings {
  edadMinimaAtencion: number; // Por defecto 0
  consultorioDefault?: string;
  firmaDigitalHabilitada?: boolean;
}

const STORAGE_KEY = 'brevemente_therapist_settings';

const DEFAULT_SETTINGS: TherapistSettings = {
  edadMinimaAtencion: 0,
  consultorioDefault: 'Consultorio A',
  firmaDigitalHabilitada: true
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
