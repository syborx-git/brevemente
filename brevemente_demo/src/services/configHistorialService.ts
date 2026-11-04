import { CambioConfiguracion } from '../types/clinical';

/**
 * Historial de cambios de configuración (solo lectura/append).
 * Equivalente al endpoint `GET /auditoria/configuracion/{id}` del fullstack.
 */

const STORAGE_KEY = 'brevemente_config_historial';

const readHistorial = (): CambioConfiguracion[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, '[]');
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const configHistorialService = {
  /** Devuelve el historial completo, el más reciente primero. */
  getHistorial(): CambioConfiguracion[] {
    return readHistorial().slice().reverse();
  },

  /** Registra un cambio de configuración. */
  addCambio(
    campo: string,
    valorAnterior: string | null,
    valorNuevo: string | null,
    usuarioNombre: string
  ): void {
    const historial = readHistorial();
    historial.push({
      id: `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      campo,
      valorAnterior,
      valorNuevo,
      usuarioNombre,
      fecha: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
  }
};
