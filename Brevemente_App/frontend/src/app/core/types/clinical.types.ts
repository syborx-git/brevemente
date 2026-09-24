export type Role = 'admin_platform' | 'admin_clinical' | 'therapist' | 'assistant' | 'supervisor' | 'patient' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
  license?: string;
}

export type CapacidadConsentimientoEstado =
  | 'AUTONOMO'
  | 'REPRESENTADO_POR_EDAD'
  | 'REPRESENTADO_POR_CONDICION'
  | 'PENDIENTE_DETERMINACION';

export type ParentescoRepresentante =
  | 'MADRE'
  | 'PADRE'
  | 'TUTOR_LEGAL'
  | 'PERSONA_DE_APOYO';

export type QuienCompletaRegistro = 'PACIENTE' | 'FAMILIAR_O_APOYO';

export interface ArchivoAdjunto {
  name: string;
  size: number;
  type?: string;
  url?: string;
  uploadedAt?: string;
}

export interface CapacidadConsentimiento {
  estado: CapacidadConsentimientoEstado;
  determinadoPor: string | null;
  fechaDeterminacion: string | null;
  fechaRevision: string | null;
  motivo: string | null;
}

export interface RepresentanteLegal {
  nombreCompleto: string;
  parentesco: ParentescoRepresentante;
  telefono: string;
  correo: string;
  documentoIdentificacion: ArchivoAdjunto | null;
  documentoVinculo: ArchivoAdjunto | null;
  otroProgenitorInformado: 'SI' | 'NO' | 'NO_APLICA' | null;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  curp: string;
  registrationDate: string;
  status: 'activo' | 'completado' | 'archivado' | 'pendiente';
  riskLevel: 'bajo' | 'medio' | 'alto';
  registryMode: 'ia' | 'manual';
  motif: string;
  therapistId: string;
  therapistName: string;

  fechaNacimiento: string;
  edadCalculada: number;
  capacidadConsentimiento: CapacidadConsentimiento;
  quienCompletaRegistro: QuienCompletaRegistro;
  representante: RepresentanteLegal | null;
  telefonoPaciente: string | null;

  consentimientoRepresentanteFirmado?: boolean;
  pendienteReconsentimiento?: boolean;
  notificacionesRepresentanteRevocadas?: boolean;
  sessionFrequency?: 'semanal' | 'quincenal' | 'mensual';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  type: 'primera' | 'seguimiento' | 'cierre';
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada' | 'ausente' | 'no_presentado' | 'solicita_reagendar';
  paymentStatus?: 'pagada' | 'pendiente' | 'exenta';
}

export type PaymentStatus = 'pagado' | 'pendiente' | 'parcial' | 'reembolsado';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface Payment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  concept: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  registeredBy: string;
  createdAt: string;
}

export interface ClinicalRecord {
  patientId: string;
  patientName: string;
  folio: string;
  startDate: string;
  age: number;
  therapistName: string;
  status: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
  modality: 'presencial' | 'online';

  motif?: string;
  description?: string;
  trastornoEstrategico?: string;
  firstAppearance?: string;
  precipitatingFactors?: string;
  evolutionType?: 'progresivo' | 'agudo' | 'crónico' | 'episódico';
  dxOpInicial?: string;
  sprInicial?: string;
  valoracionCambioInicial?: string;
  valoracionGlobalInicial?: string;
  objectivePatient?: string;
  objectiveTherapist?: string;
}

export interface Session {
  id: string;
  patientId: string;
  number: number;
  date: string;
  phase: string;
  protocol: string;
  dxOp: string;
  trastorno?: string;
  px: string[];
  f1: string;
  f2: string;
  oss: string;
  add: string;
  cumplimiento?: string;
  rss: string;
  eff: string;
  notes: string;
  observationsNextSession: string;
  situation: string;
  audioDuration?: string;
  status: 'borrador' | 'validado';
}

export interface RiskAlert {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  message: string;
  note: string;
  resolved: boolean;
}

export interface SupervisionLog {
  id: string;
  date: string;
  supervisorName: string;
  supervisorLicense: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  sessionNumber: number;
  problemDefinition: string;
  currentSituation: string;
  spr: string;
  ts: string;
  therapistProblem: string;
  rst: string;
  px: string;
  eff: string;
  doubt: string;
  blocking: string;
  observations: string;
  recommendations: string;
}

export interface LibraryDocument {
  id: string;
  title: string;
  category: 'manual' | 'protocolo' | 'normativa';
  code?: string;
  content: string;
  summary: string;
  warnings?: string[];
}

