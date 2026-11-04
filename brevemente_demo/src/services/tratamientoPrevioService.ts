import { TratamientoPrevio } from '../types/clinical';

const STORAGE_KEY = 'brevemente_tratamientos_previos';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const readAll = (): Record<string, TratamientoPrevio[]> => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
};

const writeAll = (data: Record<string, TratamientoPrevio[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const tratamientoPrevioService = {
  async getByPatientId(patientId: string): Promise<TratamientoPrevio[]> {
    await delay(200);
    return readAll()[patientId] || [];
  },

  async guardarByPatientId(patientId: string, items: TratamientoPrevio[]): Promise<TratamientoPrevio[]> {
    await delay(200);
    const all = readAll();
    all[patientId] = items;
    writeAll(all);
    return items;
  },

  async removeByPatientId(patientId: string): Promise<void> {
    await delay(200);
    const all = readAll();
    delete all[patientId];
    writeAll(all);
  }
};
