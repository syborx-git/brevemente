/**
 * Utilidades de duración de sesión (demo BreveMente).
 * La duración se guarda en `Appointment.duration` y se usa para:
 *  - mostrarla en la agenda del terapeuta,
 *  - detectar solapamientos reales entre citas del mismo día.
 */
import { SessionDuration } from '../types/clinical';

/** Opciones ofrecidas en el formulario "Agendar Consulta Médica". */
export const SESSION_DURATION_OPTIONS: SessionDuration[] = [30, 45, 60];

/** Valor por defecto del formulario al agendar una cita nueva. */
export const DEFAULT_FORM_DURATION: SessionDuration = 30;

/** Duración asumida para las citas antiguas que no tienen el campo `duration`. */
export const DEFAULT_LEGACY_DURATION: SessionDuration = 60;

/** Minutos reales de una cita (60 min si es anterior al campo `duration`). */
export const sessionMinutes = (appointment: { duration?: SessionDuration }): number =>
  appointment.duration ?? DEFAULT_LEGACY_DURATION;

/** Convierte "HH:MM" a minutos desde medianoche. */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * true si dos citas del mismo día se solapan.
 * Se comparan intervalos semiabiertos [inicio, inicio + duración): una cita que
 * empieza justo cuando termina la otra NO se considera solapamiento.
 * No valida la fecha: el llamador debe filtrar por día.
 */
export const appointmentsOverlap = (
  first: { time: string; duration?: SessionDuration },
  second: { time: string; duration?: SessionDuration }
): boolean => {
  const firstStart = timeToMinutes(first.time);
  const secondStart = timeToMinutes(second.time);
  return firstStart < secondStart + sessionMinutes(second) && secondStart < firstStart + sessionMinutes(first);
};

/** Texto legible para avisar de un solapamiento: "Sofía Martínez (09:00, 45 min)". */
export const overlapDescription = (appointments: { patientName: string; time: string; duration?: SessionDuration }[]): string =>
  appointments.map(a => `${a.patientName} (${a.time}, ${sessionMinutes(a)} min)`).join(' · ');
