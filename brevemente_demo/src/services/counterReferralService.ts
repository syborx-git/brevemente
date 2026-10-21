import { CounterReferral, CounterReferralStatus, Role } from '../types/clinical';
import { auditLogService } from './auditLogService';
import { patientService } from './patientService';
import { getTherapistIdForRole } from './therapistService';

const STORAGE_KEY = 'brevemente_counter_referrals';

/** Evento emitido cuando cambia cualquier contra-referencia (crear / aceptar / rechazar). */
export const COUNTER_REFERRAL_CHANGED = 'brevemente_counter_referral_changed';
/** Evento emitido cuando un paciente se reasigna a otro terapeuta (para refrescar caseloads). */
export const PATIENTS_CHANGED = 'brevemente_patients_changed';

export interface NewCounterReferralInput {
  patientId: string;
  patientName: string;
  fromTherapistId: string;
  fromTherapistName: string;
  toTherapistId: string;
  toTherapistName: string;
  reason: string;
  clinicalSummary?: string;
}

const readAll = (): CounterReferral[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeAll = (items: CounterReferral[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

/**
 * ¿El rol puede iniciar una contra-referencia?
 * Terapeuta tratante + roles administrativos. NO la asistente ni el paciente.
 */
export const canCreateCounterReferral = (role: Role): boolean =>
  ['therapist', 'admin_clinical', 'admin_platform', 'supervisor'].includes(role);

export const counterReferralService = {
  getAll(): CounterReferral[] {
    return readAll();
  },

  getByPatientId(patientId: string): CounterReferral[] {
    return readAll().filter(r => r.patientId === patientId);
  },

  /**
   * Solicitudes entrantes (solicitada) visibles para un rol:
   * - therapist / admin_clinical → solo las dirigidas a su terapeuta.
   * - admin_platform / supervisor → todas.
   * - resto → ninguna.
   */
  getIncomingForRole(role: Role, therapistId?: string): CounterReferral[] {
    const pending = readAll().filter(r => r.status === 'solicitada');
    // Para el rol terapeuta, la identidad real es el terapeuta seleccionado en la
    // cabecera ("Ver como"), no un mapeo fijo a therapist-1.
    const effectiveTherapistId = role === 'therapist' && therapistId
      ? therapistId
      : getTherapistIdForRole(role);
    if (effectiveTherapistId) return pending.filter(r => r.toTherapistId === effectiveTherapistId);
    if (role === 'admin_platform' || role === 'supervisor') return pending;
    return [];
  },

  create(
    input: NewCounterReferralInput,
    user: { id: string; name: string; role: Role }
  ): CounterReferral {
    const referral: CounterReferral = {
      ...input,
      id: `ref-${Date.now()}`,
      status: 'solicitada',
      createdAt: new Date().toISOString(),
    };
    const items = readAll();
    items.unshift(referral);
    writeAll(items);

    auditLogService.addLog(
      'Contra-referencia solicitada',
      `${user.name} solicitó contra-referenciar a ${input.patientName} con ${input.toTherapistName}. Motivo: ${input.reason}`,
      'expediente',
      user
    );

    window.dispatchEvent(new CustomEvent(COUNTER_REFERRAL_CHANGED, { detail: referral }));
    return referral;
  },

  /**
   * Acepta o rechaza una contra-referencia.
   * Al aceptar, reasigna al paciente al terapeuta receptor y dispara
   * el evento PATIENTS_CHANGED para que la app refresque caseloads.
   */
  async resolve(
    id: string,
    decision: Extract<CounterReferralStatus, 'aceptada' | 'rechazada'>,
    user: { id: string; name: string; role: Role }
  ): Promise<CounterReferral | null> {
    const items = readAll();
    const index = items.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updated: CounterReferral = {
      ...items[index],
      status: decision,
      resolvedAt: new Date().toISOString(),
      resolvedBy: user.name,
    };
    items[index] = updated;
    writeAll(items);

    if (decision === 'aceptada') {
      const patient = await patientService.getById(updated.patientId);
      if (patient && patient.therapistId !== updated.toTherapistId) {
        await patientService.update({
          ...patient,
          therapistId: updated.toTherapistId,
          therapistName: updated.toTherapistName,
        });
        window.dispatchEvent(new CustomEvent(PATIENTS_CHANGED));
      }
    }

    auditLogService.addLog(
      decision === 'aceptada' ? 'Contra-referencia aceptada' : 'Contra-referencia rechazada',
      decision === 'aceptada'
        ? `${user.name} aceptó la contra-referencia de ${updated.patientName} → ${updated.toTherapistName}. Paciente reasignado.`
        : `${user.name} declinó la contra-referencia de ${updated.patientName} solicitada por ${updated.fromTherapistName}.`,
      'expediente',
      user
    );

    window.dispatchEvent(new CustomEvent(COUNTER_REFERRAL_CHANGED, { detail: updated }));
    return updated;
  },
};
