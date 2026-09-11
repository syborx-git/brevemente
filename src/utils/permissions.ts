import { Role } from '../types/clinical';

export const MODULE_PERMISSIONS: Record<string, Role[]> = {
  dashboard: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  patients: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  agenda: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  expedientes: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'],
  senda: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'],
  biblioteca: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'],
  reportes: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'],
  supervision: ['admin_platform', 'admin_clinical', 'supervisor'],
  desempeno: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'],
  auditoria: ['admin_platform', 'admin_clinical', 'supervisor'],
  configuracion: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  campus: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'],
  historial_paciente: ['patient'],
};

export const hasPermission = (role: Role, module: string): boolean => {
  const allowedRoles = MODULE_PERMISSIONS[module];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};
