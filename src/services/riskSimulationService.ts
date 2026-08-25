import { auditLogService } from './auditLogService';
import { Role, RiskAlert } from '../types/clinical';

const STORAGE_KEY = 'brevemente_risk_alerts';

const initialAlerts: RiskAlert[] = [
  {
    id: 'risk-1',
    patientId: 'patient-1',
    patientName: 'Sofía Martínez',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // Hace 1 día
    message: 'Ideación de escape y crisis de pánico recurrente con pérdida de control físico.',
    note: 'Escalado preventivo por el terapeuta Dr. Alejandro Silva.',
    resolved: true,
    resolvedBy: 'Dr. Alejandro Silva',
    resolvedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

export const riskSimulationService = {
  getAlerts(): RiskAlert[] {
    const alertsJson = localStorage.getItem(STORAGE_KEY);
    if (!alertsJson) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAlerts));
      return initialAlerts;
    }
    return JSON.parse(alertsJson);
  },

  checkTextForRisk(text: string): { isRisk: boolean; reason: string } {
    const criticalWords = [
      'suicid', 'lastimar', 'morir', 'matar', 'quitarme la vida', 
      'autolesion', 'sobredosis', 'cortar', 'daño', 'desesperanza absoluta'
    ];
    
    const lowercaseText = text.toLowerCase();
    for (const word of criticalWords) {
      if (lowercaseText.includes(word)) {
        return {
          isRisk: true,
          reason: `Detección del término de riesgo clínico: "${word}"`
        };
      }
    }
    return { isRisk: false, reason: '' };
  },

  escalateRisk(
    patientId: string,
    patientName: string,
    message: string,
    user: { id: string; name: string; role: Role }
  ): RiskAlert {
    const alerts = this.getAlerts();
    const newAlert: RiskAlert = {
      id: `risk-${Date.now()}`,
      patientId,
      patientName,
      timestamp: new Date().toISOString(),
      message,
      note: `Escalado de emergencia iniciado por ${user.name} (${user.role})`,
      resolved: false
    };

    alerts.unshift(newAlert);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));

    // Registrar en bitácora de auditoría
    auditLogService.addLog(
      'Alerta de Riesgo Clínico',
      `Paciente: ${patientName}. Motivo: ${message}. Estado: Escalado a Supervisor.`,
      'riesgo',
      user
    );

    // Disparar evento para actualizar UI en vivo
    window.dispatchEvent(new CustomEvent('brevemente_risk_alert_added', { detail: newAlert }));
    
    return newAlert;
  },

  resolveAlert(
    alertId: string,
    user: { id: string; name: string; role: Role }
  ): void {
    const alerts = this.getAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
      alerts[alertIndex].resolved = true;
      alerts[alertIndex].resolvedBy = user.name;
      alerts[alertIndex].resolvedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));

      auditLogService.addLog(
        'Riesgo Resuelto',
        `Alerta de riesgo para ${alerts[alertIndex].patientName} marcada como resuelta por ${user.name}.`,
        'riesgo',
        user
      );

      window.dispatchEvent(new CustomEvent('brevemente_risk_alert_added'));
    }
  }
};
