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
};
