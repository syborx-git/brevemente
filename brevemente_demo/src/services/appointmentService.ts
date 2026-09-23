import { Appointment } from '../types/clinical';

const STORAGE_KEY = 'brevemente_appointments';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const readAll = (): Appointment[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

const writeAll = (appointments: Appointment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    await delay(200);
    return readAll();
  },

  async getById(id: string): Promise<Appointment | undefined> {
    const all = readAll();
    return all.find(a => a.id === id);
  },

  // 🔗 NUEVO: citas de un paciente específico
  async getByPatientId(patientId: string): Promise<Appointment[]> {
    const all = readAll();
    return all.filter(a => a.patientId === patientId);
  },

  async create(appointment: Appointment): Promise<Appointment> {
    await delay(200);
    const all = readAll();
    all.push(appointment);
    writeAll(all);
    return appointment;
  },

  async update(updated: Appointment): Promise<Appointment> {
    await delay(200);
    const all = readAll();
    writeAll(all.map(a => (a.id === updated.id ? updated : a)));
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay(200);
    writeAll(readAll().filter(a => a.id !== id));
  },

  // 🔗 NUEVO: borrar todas las citas de un paciente (para el paso 2)
  async removeByPatientId(patientId: string): Promise<void> {
    await delay(200);
    writeAll(readAll().filter(a => a.patientId !== patientId));
  },
};