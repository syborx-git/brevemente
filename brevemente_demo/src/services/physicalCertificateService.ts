import { PhysicalCertificateLog, Role } from '../types/clinical';
import { auditLogService } from './auditLogService';

const STORAGE_KEY = 'brevemente_physical_certificates';

const initialPhysicalCertificates: PhysicalCertificateLog[] = [
  {
    id: 'cert-phys-1',
    patientId: 'patient-1',
    patientName: 'Sofía Martínez',
    physicalFolio: 'CONST-2026-084-FIS',
    issueDate: '2026-08-20',
    type: 'psicoterapeutica',
    issuerName: 'Dr. Alejandro Silva',
    issuerLicense: 'CED-8849302-MX',
    recipient: 'Dirección de Recursos Humanos · Grupo Salinas',
    purpose: 'Acreditación formal de asistencia y continuidad a tratamiento psicoterapéutico',
    periodCovered: '10 de Agosto de 2026 al 17 de Agosto de 2026',
    sessionsCount: 2,
    clinicalSummary: 'Se hace constar en físico que la paciente acude de manera regular a intervención en Terapia Breve Estratégica. Presenta adherencia terapéutica satisfactoria y evolución clínica favorable.',
    deliveredTo: 'Sofía Martínez (en mano propia, consultorio Sede Centro)',
    digitalScanUrl: 'escaneo_constancia_sofia_martinez.pdf',
    scanFileName: 'escaneo_constancia_sofia_martinez.pdf',
    status: 'entregada_en_fisico',
    registeredBy: 'Dr. Alejandro Silva',
    registeredAt: '2026-08-20T14:30:00.000Z'
  }
];

export const physicalCertificateService = {
  getAll(): PhysicalCertificateLog[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPhysicalCertificates));
      return initialPhysicalCertificates;
    }
    try {
      return JSON.parse(raw) as PhysicalCertificateLog[];
    } catch {
      return initialPhysicalCertificates;
    }
  },

  getByPatientId(patientId: string): PhysicalCertificateLog[] {
    return this.getAll().filter(c => c.patientId === patientId);
  },

  addCertificateRecord(
    record: Omit<PhysicalCertificateLog, 'id' | 'registeredAt'>,
    user: { id: string; name: string; role: Role }
  ): PhysicalCertificateLog {
    const certs = this.getAll();
    const newCert: PhysicalCertificateLog = {
      ...record,
      id: `cert-phys-${Date.now()}`,
      registeredAt: new Date().toISOString()
    };

    certs.unshift(newCert);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(certs));

    auditLogService.addLog(
      'Registro de Constancia Física',
      `Se asentó la entrega de constancia física Folio ${record.physicalFolio} emitida para ${record.patientName} (Destinatario: ${record.recipient}).`,
      'expediente',
      user
    );

    window.dispatchEvent(new CustomEvent('brevemente_physical_certificate_changed', { detail: newCert }));
    return newCert;
  },

  deleteCertificateRecord(id: string, user: { id: string; name: string; role: Role }): void {
    const certs = this.getAll();
    const target = certs.find(c => c.id === id);
    const filtered = certs.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    if (target) {
      auditLogService.addLog(
        'Anulación de Constancia Física',
        `Se retiró del registro la constancia física ${target.physicalFolio} de ${target.patientName}.`,
        'expediente',
        user
      );
    }

    window.dispatchEvent(new CustomEvent('brevemente_physical_certificate_changed'));
  }
};
