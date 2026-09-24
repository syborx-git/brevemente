import { AuditLog, Role } from '../types/clinical';

const STORAGE_KEY = 'brevemente_audit_logs';

const initialLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // Hace 2 días
    userId: 'therapist-1',
    userName: 'Dr. Alejandro Silva',
    role: 'therapist',
    action: 'Acceso a expediente',
    details: 'Visualizó el expediente completo de Sofía Martínez (Folio: EXP-8849)',
    category: 'expediente'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 20 * 2).toISOString(),
    userId: 'assistant-1',
    userName: 'Marta Gómez',
    role: 'assistant',
    action: 'Creación de cita',
    details: 'Agendó cita de primera vez para el paciente Carlos Mendoza el 26/08/2026',
    category: 'sesion'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // Hace 12 horas
    userId: 'therapist-1',
    userName: 'Dr. Alejandro Silva',
    role: 'therapist',
    action: 'Edición de sesión',
    details: 'Actualizó notas y reestructuración de la Sesión 3 de Sofía Martínez',
    category: 'sesion'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // Hace 4 horas
    userId: 'therapist-1',
    userName: 'Dr. Alejandro Silva',
    role: 'therapist',
    action: 'Uso de Asistente IA',
    details: 'Consultó sugerencias de reestructuraciones para el protocolo de Ataque de Pánico',
    category: 'ia'
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // Hace 2 horas
    userId: 'therapist-1',
    userName: 'Dr. Alejandro Silva',
    role: 'therapist',
    action: 'Generación de constancia',
    details: 'Emitió constancia psicoterapéutica para Sofía Martínez y la descargó en PDF',
    category: 'reporte'
  }
];

export const auditLogService = {
  getLogs(): AuditLog[] {
    const logsJson = localStorage.getItem(STORAGE_KEY);
    if (!logsJson) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(logsJson);
  },

  addLog(
    action: string,
    details: string,
    category: AuditLog['category'],
    user: { id: string; name: string; role: Role }
  ): AuditLog {
    const logs = this.getLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      details,
      category
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
    // Despacha un evento personalizado para que las páginas se enteren del cambio en tiempo real
    window.dispatchEvent(new CustomEvent('brevemente_audit_log_added', { detail: newLog }));
    
    return newLog;
  },

  clearLogs(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('brevemente_audit_log_added'));
  }
};
