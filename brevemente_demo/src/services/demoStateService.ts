import { mockPatients, mockAppointments, mockClinicalRecords, mockSessions } from '../data/mockData';
import { auditLogService } from './auditLogService';

const PATIENTS_KEY = 'brevemente_patients';
const APPOINTMENTS_KEY = 'brevemente_appointments';
const CLINICAL_RECORDS_KEY = 'brevemente_clinical_records';
const SESSIONS_KEY = 'brevemente_sessions';
const AUDIT_LOGS_KEY = 'brevemente_audit_logs';
const RISK_ALERTS_KEY = 'brevemente_risk_alerts';
const DEMO_STEP_KEY = 'brevemente_demo_active_step';
const DEMO_TOUR_KEY = 'brevemente_demo_active_tour';

export const demoStateService = {
  restoreToInitialState(): void {
    // Restaurar base de datos simulada
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(mockPatients));
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(mockAppointments));
    localStorage.setItem(CLINICAL_RECORDS_KEY, JSON.stringify(mockClinicalRecords));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(mockSessions));
    localStorage.setItem(RISK_ALERTS_KEY, JSON.stringify([]));
    
    // Resetear demo state
    localStorage.setItem(DEMO_STEP_KEY, '0');
    localStorage.setItem(DEMO_TOUR_KEY, 'none');

    // Registrar en auditoría
    auditLogService.clearLogs();
    auditLogService.addLog(
      'Restauración de Datos de Demo',
      'El sistema ha sido reiniciado a su estado inicial para comenzar una nueva demostración comercial.',
      'seguridad',
      { id: 'system-demo', name: 'Sistema Demo', role: 'admin_platform' }
    );

    // Disparar evento para recargar estado en componentes
    window.dispatchEvent(new CustomEvent('brevemente_demo_reset'));
  },

  getActiveStep(): number {
    return parseInt(localStorage.getItem(DEMO_STEP_KEY) || '0');
  },

  setActiveStep(step: number): void {
    localStorage.setItem(DEMO_STEP_KEY, step.toString());
    window.dispatchEvent(new CustomEvent('brevemente_demo_step_change', { detail: step }));
  },

  getActiveTour(): 'executiva' | 'clinica' | 'academic' | 'none' {
    return (localStorage.getItem(DEMO_TOUR_KEY) || 'none') as any;
  },

  setActiveTour(tour: 'executiva' | 'clinica' | 'academic' | 'none'): void {
    localStorage.setItem(DEMO_TOUR_KEY, tour);
    window.dispatchEvent(new CustomEvent('brevemente_demo_tour_change', { detail: tour }));
  }
};
