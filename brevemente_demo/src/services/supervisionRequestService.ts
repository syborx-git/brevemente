import { auditLogService } from './auditLogService';
import { Role, SupervisionRequest } from '../types/clinical';

const STORAGE_KEY = 'brevemente_supervision_requests';

export const supervisionRequestService = {
  getRequests(): SupervisionRequest[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SupervisionRequest[];
    } catch {
      return [];
    }
  },

  createRequest(
    patientId: string,
    patientName: string,
    reason: string,
    user: { id: string; name: string; role: Role }
  ): SupervisionRequest {
    const requests = this.getRequests();
    const request: SupervisionRequest = {
      id: `sup-req-${Date.now()}`,
      patientId,
      patientName,
      therapistId: user.id,
      therapistName: user.name,
      reason,
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };
    requests.unshift(request);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

    auditLogService.addLog(
      'Solicitud de Supervisión',
      `El terapeuta ${user.name} solicitó supervisión clínica para ${patientName}. Motivo: ${reason}`,
      'sesion',
      user
    );

    window.dispatchEvent(new CustomEvent('brevemente_supervision_request_changed', { detail: request }));
    return request;
  },

  attendRequest(id: string, user: { id: string; name: string; role: Role }): void {
    const requests = this.getRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) return;
    requests[idx].status = 'atendida';
    requests[idx].attendedBy = user.name;
    requests[idx].attendedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

    auditLogService.addLog(
      'Supervisión Atendida',
      `El supervisor ${user.name} atendió la solicitud de supervisión de ${requests[idx].patientName}.`,
      'sesion',
      user
    );

    window.dispatchEvent(new CustomEvent('brevemente_supervision_request_changed'));
  }
};