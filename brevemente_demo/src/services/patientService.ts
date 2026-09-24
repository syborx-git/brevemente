import { Patient } from '../types/clinical';

const STORAGE_KEY = 'brevemente_patients';

// Simula el tiempo de una petición de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Lee la "base de datos" (localStorage)
const readAll = (): Patient[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

// Escribe la "base de datos"
const writeAll = (patients: Patient[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
};

export const patientService = {
    // Obtener todos los pacientes
    async getAll(): Promise<Patient[]> {
        await delay(200);
        return readAll();
    },

    // Obtener un paciente por id
    async getById(id: string): Promise<Patient | undefined> {
        const all = readAll();
        return all.find(p => p.id === id);
    },

    // Crear un paciente nuevo
    async create(patient: Patient): Promise<Patient> {
        await delay(200);
        const all = readAll();
        all.push(patient);
        writeAll(all);
        return patient;
    },

    // Actualizar un paciente existente
    async update(updated: Patient): Promise<Patient> {
        await delay(200);
        const all = readAll();
        writeAll(all.map(p => (p.id === updated.id ? updated : p)));
        return updated;
    },

    // Eliminar un paciente (¡el que te faltaba!)
    async remove(id: string): Promise<void> {
        await delay(200);
        writeAll(readAll().filter(p => p.id !== id));
    },
};