export type Role = 'admin_platform' | 'admin_clinical' | 'therapist' | 'assistant' | 'supervisor' | 'patient' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
  license?: string;
}

/**
 * NOTA JURÍDICA — Puntos pendientes de validación con el área legal de BreveMente:
 * 1. Si basta el consentimiento de un solo progenitor o se requieren ambos para menores de edad.
 * 2. La edad a partir de la cual se solicita asentimiento del propio menor, además del consentimiento del representante.
 * 3. Si la aceptación de términos de la plataforma se separa del consentimiento de tratamiento clínico.
 *
 * NOMENCLATURA OBLIGATORIA: Se utiliza estrictamente 'PERSONA_DE_APOYO' y la etiqueta visible "persona de apoyo designada".
 * Prohibido el uso de los términos "interdicción", "incapacitado" o "incompetente".
 */

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
  determinadoPor: string | null;      // id del clínico; null si fue automático por edad
  fechaDeterminacion: string | null;
  fechaRevision: string | null;       // sólo para REPRESENTADO_POR_CONDICION
  motivo: string | null;
}

export interface RepresentanteLegal {
  nombreCompleto: string;
  parentesco: ParentescoRepresentante;
  telefono: string;
  correo: string;
  documentoIdentificacion: ArchivoAdjunto | File | null;
  documentoVinculo: ArchivoAdjunto | File | null;
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

  // Nuevos campos normativos de representación legal
  fechaNacimiento: string; // ISO (YYYY-MM-DD), obligatorio
  edadCalculada: number;   // derivado, no editable
  capacidadConsentimiento: CapacidadConsentimiento;
  quienCompletaRegistro: QuienCompletaRegistro;
  representante: RepresentanteLegal | null;
  telefonoPaciente: string | null; // opcional cuando hay representante

  // Banderas operativas
  consentimientoRepresentanteFirmado?: boolean;
  pendienteReconsentimiento?: boolean;
  notificacionesRepresentanteRevocadas?: boolean;
}


export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  type: 'primera' | 'seguimiento' | 'cierre';
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada' | 'ausente';
  /** Estado de pago de la sesión. Campo simulado en demo; editable por asistente en versión real. */
  paymentStatus?: 'pagada' | 'pendiente' | 'exenta';
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
  
  // DX Estratégico
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

  // DX Psiquiátrico
  dxNosologico?: string;
  dsm5?: string;
  cie11?: string;
  comorbilidad?: string;
  differentialDx?: string;
  treatmentPlan?: string;
  prognosis?: 'excelente' | 'bueno' | 'reservado' | 'malo';
  favorableFactors?: string;
  unfavorableFactors?: string;
  drugsList?: Array<{
    id: string;
    name: string;
    doseMorning: string;
    doseAfternoon: string;
    doseNight: string;
    eff: string;
    notes: string;
  }>;
  drugsUsage?: string; // sí / no / especificar
}

export interface Session {
  id: string;
  patientId: string;
  number: number;
  date: string;
  phase: string;
  protocol: string;
  dxOp: string;
  px: string[]; // Prescripciones/maniobras asignadas
  f1: string; // Frase 1 o foco
  f2: string; // Frase 2 o foco
  oss: string; // Observaciones del terapeuta
  add: string; // Adherencia
  rss: string; // Resonancia o respuesta al cambio
  eff: string; // Efecto de las maniobras
  notes: string;
  observationsNextSession: string;
  situation: string;
  audioDuration?: string;
  status: 'borrador' | 'validado';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  details: string;
  category: 'expediente' | 'sesion' | 'ia' | 'reporte' | 'seguridad' | 'riesgo';
}

export interface RiskAlert {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  message: string;
  note: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface LibraryDocument {
  id: string;
  title: string;
  category: 'manual' | 'protocolo' | 'normativa';
  code?: string;
  content: string;
  summary: string;
}

export interface Certificate {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: 'psicoterapeutica' | 'psiquiatrica';
  professionalName: string;
  license: string;
  address: string;
  phone: string;
  email: string;
  birthDate: string;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
  frequency: string;
  modality: string;
  interventionType: string;
  motif: string;
  symptoms: string;
  origin: string;
  evolution: string;
  globalObservation: string;
  recommendations: string;
  placeDate: string;
  pdfUrl?: string;
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
  ts: string; // Trastorno Estratégico
  therapistProblem: string;
  rst: string; // Reestructuración
  px: string; // Prescripciones
  eff: string; // Efecto
  doubt: string;
  blocking: string;
  observations: string;
  recommendations: string;
}
