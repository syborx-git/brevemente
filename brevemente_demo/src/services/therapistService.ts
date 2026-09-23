import { Role } from '../types/clinical';
/**
 * Servicio de directorio de terapeutas
 * BreveMente — Sistema Clínico TBE
 *
 * Determina, para cada terapeuta, si cuenta con asistente clínico asignado.
 * En la versión real esto proviene de la entidad Terapeuta en la BD;
 * aquí es una tabla simulada para la demo.
 */

export interface TherapistDirectoryEntry {
  id: string;
  name: string;
  hasAssistant: boolean;
  assistantName?: string;
}

const THERAPIST_DIRECTORY: TherapistDirectoryEntry[] = [
  {
    id: 'therapist-1',
    name: 'Dr. Alejandro Silva',
    hasAssistant: true,
    assistantName: 'Laura Gómez',
  },
  {
    id: 'therapist-2',
    name: 'Dra. Patricia Ortiz',
    hasAssistant: false,
  },
];

export const therapistService = {
  getEntry(therapistId: string): TherapistDirectoryEntry | undefined {
    return THERAPIST_DIRECTORY.find((t) => t.id === therapistId);
  },

    /** ¿El terapeuta cuenta con asistente clínico asignado? */
  hasAssistant(therapistId: string): boolean {
    return THERAPIST_DIRECTORY.find((t) => t.id === therapistId)?.hasAssistant ?? false;
  },

  /**
   * REGLA DE NEGOCIO — Visibilidad de la columna "Estatus de pago" en el
   * directorio de pacientes.
   *
   * La columna se muestra SOLO para terapeutas SIN asistente: ellos gestionan
   * directamente su facturación. Los terapeutas CON asistente la ocultan porque
   * el asistente administra los pagos.
   *
   * @param therapistId Id del terapeuta autenticado (lo proveerá el backend real).
   * @returns true si la columna debe mostrarse para ese terapeuta.
   */
    shouldShowPaymentColumn(therapistId: string): boolean {
    return !this.hasAssistant(therapistId);
  },

  /**
   * REGLA DE NEGOCIO — ¿El usuario autenticado puede gestionar pagos?
   * Un terapeuta SIN asistente gestiona su propia facturación → SÍ edita.
   * Un terapeuta CON asistente delega → solo lectura (su asistente administra).
   *
   * DEMO: los roles aún no traen therapistId, por eso este mapeo temporal:
   *   - therapist      = Dr. Alejandro Silva (therapist-1, CON asistente)
   *   - admin_clinical = Dra. Patricia Ortiz  (therapist-2, SIN asistente)
   */
  canManagePayments(role: Role): boolean {
    const ROLE_TO_THERAPIST: Partial<Record<Role, string>> = {
      therapist: 'therapist-1',
      admin_clinical: 'therapist-2',
    };
    const therapistId = ROLE_TO_THERAPIST[role];
    if (!therapistId) return false; // asistentes/admins/supervisores → solo lectura
    return !this.hasAssistant(therapistId);
  },
};
