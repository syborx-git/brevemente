import { Role } from '../types/clinical';

/**
 * Permisos granulares por acción (PBAC), espejo del tipo `Permission` del
 * fullstack (23 permisos). La resolución por rol replica la matriz final
 * post-migraciones V5→V18 del backend.
 */
export type Permission =
  | 'PACIENTES_LEER'
  | 'PACIENTES_CREAR'
  | 'PACIENTES_EDITAR'
  | 'PACIENTES_ELIMINAR'
  | 'EXPEDIENTE_LEER'
  | 'EXPEDIENTE_ESCRIBIR'
  | 'EXPEDIENTE_FIRMAR'
  | 'AGENDA_GESTIONAR'
  | 'AGENDA_LEER'
  | 'MIS_CITAS_LEER'
  | 'MIS_SESIONES_LEER'
  | 'SUPERVISION_LEER'
  | 'SUPERVISION_EVALUAR'
  | 'SUPERVISION_REGISTRAR'
  | 'PAGOS_LEER'
  | 'PAGOS_GESTIONAR'
  | 'CONSTANCIAS_EMITIR'
  | 'ADMIN_USUARIOS'
  | 'DASHBOARD_LEER'
  | 'MI_CONSULTA_LEER'
  | 'LEVA_USAR'
  | 'REPORTES_VER'
  | 'CONFIGURACION_SISTEMA';

export const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  admin_platform: [
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'PACIENTES_EDITAR', 'PACIENTES_ELIMINAR',
    'EXPEDIENTE_LEER', 'EXPEDIENTE_ESCRIBIR', 'EXPEDIENTE_FIRMAR',
    'AGENDA_GESTIONAR', 'AGENDA_LEER', 'MIS_CITAS_LEER', 'MIS_SESIONES_LEER',
    'SUPERVISION_LEER', 'SUPERVISION_EVALUAR', 'SUPERVISION_REGISTRAR',
    'PAGOS_LEER', 'PAGOS_GESTIONAR', 'CONSTANCIAS_EMITIR', 'ADMIN_USUARIOS',
    'DASHBOARD_LEER', 'MI_CONSULTA_LEER', 'LEVA_USAR', 'REPORTES_VER',
    'CONFIGURACION_SISTEMA'
  ],
  admin_clinical: [
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'PACIENTES_EDITAR',
    'AGENDA_LEER', 'SUPERVISION_LEER', 'DASHBOARD_LEER', 'MI_CONSULTA_LEER',
    'LEVA_USAR', 'REPORTES_VER', 'PAGOS_LEER', 'PAGOS_GESTIONAR',
    'CONSTANCIAS_EMITIR'
  ],
  therapist: [
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'PACIENTES_EDITAR',
    'EXPEDIENTE_LEER', 'EXPEDIENTE_ESCRIBIR', 'EXPEDIENTE_FIRMAR',
    'AGENDA_GESTIONAR', 'AGENDA_LEER', 'DASHBOARD_LEER', 'MI_CONSULTA_LEER',
    'LEVA_USAR', 'PAGOS_LEER', 'PAGOS_GESTIONAR', 'CONSTANCIAS_EMITIR',
    'SUPERVISION_REGISTRAR', 'SUPERVISION_LEER'
  ],
  assistant: [
    'PACIENTES_LEER', 'PACIENTES_CREAR', 'AGENDA_GESTIONAR', 'AGENDA_LEER',
    'DASHBOARD_LEER', 'PAGOS_LEER', 'PAGOS_GESTIONAR'
  ],
  supervisor: [
    'PACIENTES_LEER', 'EXPEDIENTE_LEER', 'SUPERVISION_LEER',
    'SUPERVISION_EVALUAR', 'DASHBOARD_LEER', 'MI_CONSULTA_LEER', 'LEVA_USAR',
    'REPORTES_VER', 'AGENDA_LEER', 'PAGOS_LEER'
  ],
  patient: ['MIS_CITAS_LEER', 'MIS_SESIONES_LEER'],
  student: ['LEVA_USAR']
};

/** Resolución granular por acción. */
export const hasActionPermission = (role: Role, permission: Permission): boolean => {
  return (PERMISSIONS_BY_ROLE[role] ?? []).includes(permission);
};

// ── Acceso por módulo (compatibilidad con las vistas de la demo) ──────────────
export const MODULE_PERMISSIONS: Record<string, Role[]> = {
  dashboard: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  patients: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  agenda: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'],
  expedientes: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'],
  leva: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'],
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
