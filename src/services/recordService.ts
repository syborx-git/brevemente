import { ClinicalRecord, CrisisIncident } from '../types/clinical';

const STORAGE_KEY = 'brevemente_clinical_records';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Lee el mapa completo de expedientes (objeto agrupado por patientId)
const readAll = (): Record<string, ClinicalRecord> => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
};

const writeAll = (records: Record<string, ClinicalRecord>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const recordService = {
  // Obtener el expediente de un paciente
  async getByPatientId(patientId: string): Promise<ClinicalRecord | undefined> {
    await delay(200);
    return readAll()[patientId];
  },

  // Guardar (crear o actualizar) el expediente de un paciente
  async saveByPatientId(patientId: string, record: ClinicalRecord): Promise<ClinicalRecord> {
    await delay(200);
    const all = readAll();
    all[patientId] = record;
    writeAll(all);
    return record;
  },

  // Registrar un incidente de crisis resuelto en el expediente clínico
  async addCrisisIncident(patientId: string, incident: CrisisIncident): Promise<ClinicalRecord> {
    await delay(150);
    const all = readAll();
    const existing = all[patientId];
    const record: ClinicalRecord = existing ? { ...existing } : {
      patientId,
      patientName: 'Paciente',
      folio: `EXP-${patientId.replace(/\D/g, '') || '001'}`,
      startDate: new Date().toISOString().split('T')[0],
      age: 28,
      therapistName: incident.resolvedBy,
      status: 'activo',
      riskLevel: incident.resolutionDetails?.riskLevelAssessed === 'inminente' || incident.resolutionDetails?.riskLevelAssessed === 'alto' ? 'alto' : (incident.resolutionDetails?.riskLevelAssessed === 'medio' ? 'medio' : 'bajo'),
      modality: 'presencial'
    };

    const history = record.crisisHistory ? [...record.crisisHistory] : [];
    record.crisisHistory = [incident, ...history];
    all[patientId] = record;
    writeAll(all);
    return record;
  },

  // Eliminar el expediente de un paciente
  async removeByPatientId(patientId: string): Promise<void> {
    await delay(200);
    const all = readAll();
    delete all[patientId];
    writeAll(all);
  },
};