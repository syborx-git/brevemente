import { Role } from '../types/clinical';

export const MODULE_PERMISSIONS: Record<string, Role[]> = {
  dashboard: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'academic_coordinator'],
  patients: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  agenda: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'patient'],
  expedientes: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'],
  senda: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'],
  biblioteca: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'],
  reportes: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'],
  supervision: ['admin_platform', 'admin_clinical', 'supervisor', 'academic_coordinator'],
  desempeno: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'],
  auditoria: ['admin_platform', 'admin_clinical', 'supervisor', 'academic_coordinator'],
  configuracion: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'academic_coordinator'],
  campus: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator']
};

export const hasPermission = (role: Role, module: string): boolean => {
  const allowedRoles = MODULE_PERMISSIONS[module];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};
