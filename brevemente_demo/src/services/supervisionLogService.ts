import { SupervisionLog, Role } from '../types/clinical';
import { auditLogService } from './auditLogService';

const STORAGE_KEY = 'brevemente_supervision_logs';

const initialSupervisionLogs: SupervisionLog[] = [
  {
    id: 'sup-1',
    date: '2026-08-18',
    supervisorName: 'Dra. Isabel Cárdenas',
    supervisorLicense: 'CED-9988221-MX',
    patientId: 'patient-1',
    patientName: 'Sofía Martínez',
    therapistId: 'therapist-1',
    therapistName: 'Dr. Alejandro Silva',
    sessionNumber: 2,
    problemDefinition: 'Ataques de pánico agudos con pérdida de control percibida. Solución intentada dominante de evitación sistemática y búsqueda compulsiva de acompañamiento.',
    currentSituation: 'Favorable. Disminución del 70% de las crisis agudas espontáneas tras prescripción de Diario de a Bordo.',
    spr: 'SPR Fóbico',
    ts: 'Ataque de Pánico',
    therapistProblem: 'Resistencia sutil al cambio cuando la paciente debe realizar sola la prescripción de la peor fantasía.',
    rst: 'Fantasía del peor escenario: "Míralo a los ojos y el fantasma desaparecerá". Prescripción paradójica del síntoma.',
    px: 'Worry-Time (WF 30 min diario a las 18:00 hrs) + Diario de a Bordo.',
    eff: 'Excelente disminución del miedo anticipatorio.',
    doubt: '¿Cómo modular la resistencia de la paciente al salir sola a trabajar en transporte público?',
    blocking: 'Evitación persistente del metro y lugares con aglomeraciones.',
    observations: 'El terapeuta debe aplicar una redefinición paradójica en la evitación del metro sin confrontar directamente el miedo.',
    recommendations: 'Prescribir pequeños simulacros voluntarios en el metro acompañados de un Diario de a Bordo preventivo. Programar revisión en Sesión 4.'
  }
];

export const supervisionLogService = {
  getAll(): SupervisionLog[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSupervisionLogs));
      return initialSupervisionLogs;
    }
    try {
      return JSON.parse(raw) as SupervisionLog[];
    } catch {
      return initialSupervisionLogs;
    }
  },

  getByPatientId(patientId: string): SupervisionLog[] {
    return this.getAll().filter(l => l.patientId === patientId);
  },

  addLog(
    log: Omit<SupervisionLog, 'id'>,
    user: { id: string; name: string; role: Role }
  ): SupervisionLog {
    const logs = this.getAll();
    const newLog: SupervisionLog = {
      ...log,
      id: `sup-${Date.now()}`
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

    auditLogService.addLog(
      'Bitácora de Supervisión',
      `Se registró bitácora de supervisión clínica para ${log.patientName} (Sesión ${log.sessionNumber}) por ${log.supervisorName}.`,
      'sesion',
      user
    );

    window.dispatchEvent(new CustomEvent('brevemente_supervision_log_changed', { detail: newLog }));
    return newLog;
  },

  deleteLog(id: string, user: { id: string; name: string; role: Role }): void {
    const logs = this.getAll();
    const target = logs.find(l => l.id === id);
    const filtered = logs.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    if (target) {
      auditLogService.addLog(
        'Eliminación de Bitácora de Supervisión',
        `Se eliminó la bitácora de supervisión de ${target.patientName} (Sesión ${target.sessionNumber}).`,
        'sesion',
        user
      );
    }

    window.dispatchEvent(new CustomEvent('brevemente_supervision_log_changed'));
  }
};
