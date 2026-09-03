import { Session } from '../types/clinical';

const STORAGE_KEY = 'brevemente_sessions';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Lee el mapa de sesiones (objeto: patientId → arreglo de sesiones)
const readAll = (): Record<string, Session[]> => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
};

const writeAll = (sessions: Record<string, Session[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const sessionService = {
  // Obtener las sesiones de un paciente (o [] si no tiene)
  async getByPatientId(patientId: string): Promise<Session[]> {
    await delay(200);
    return readAll()[patientId] || [];
  },

  // Guardar el historial completo de sesiones de un paciente
  async saveByPatientId(patientId: string, sessions: Session[]): Promise<Session[]> {
    await delay(200);
    const all = readAll();
    all[patientId] = sessions;
    writeAll(all);
    return sessions;
  },

  // Agregar una sesión al historial de un paciente
  async addSession(patientId: string, session: Session): Promise<Session[]> {
    await delay(200);
    const all = readAll();
    const current = all[patientId] || [];
    all[patientId] = [...current, session];
    writeAll(all);
    return all[patientId];
  },

  // Eliminar todas las sesiones de un paciente
  async removeByPatientId(patientId: string): Promise<void> {
    await delay(200);
    const all = readAll();
    delete all[patientId];
    writeAll(all);
  },
};