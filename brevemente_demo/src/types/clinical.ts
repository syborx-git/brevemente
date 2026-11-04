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

  /** Frecuencia de sesiones del tratamiento: semanal | quincenal | mensual (se refleja en la agenda) */
  sessionFrequency?: 'semanal' | 'quincenal' | 'mensual';

  // Identificación ampliada (paridad fullstack)
  rfc?: string;
  sexo?: 'M' | 'F' | 'LGTB+';
  sedeId?: string;
  lugarNacimiento?: string;
  estadoCivil?: string;
  escolaridad?: string;
  ocupacion?: string;
  religion?: string;
  domicilio?: Domicilio;
  contactoEmergencia?: ContactoEmergencia;
}


/** Duración de la sesión en minutos, elegida por el terapeuta al agendar. */
export type SessionDuration = 30 | 45 | 60;

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  type: 'primera' | 'seguimiento' | 'cierre';
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada' | 'ausente' | 'no_presentado' | 'solicita_reagendar';
  /** Estado de pago de la sesión. Campo simulado en demo; editable por asistente en versión real. */
  paymentStatus?: 'pagada' | 'pendiente' | 'exenta';
  /**
   * Duración de la sesión en minutos (30 | 45 | 60).
   * Opcional por compatibilidad: las citas de demo anteriores se interpretan como 60 min.
   */
  duration?: SessionDuration;
  /** Modalidad de la sesión: presencial | online. */
  modality?: 'presencial' | 'online';
  /** Tipo de terapia: individual | pareja | familiar | grupal. */
  tipoTerapia?: 'individual' | 'pareja' | 'familiar' | 'grupal';
  /** Consultorio físico asignado a la sesión presencial. */
  office?: 'A' | 'B';
}

/** Estado del ciclo de vida de una contra-referencia entre terapeutas. */
export type CounterReferralStatus = 'solicitada' | 'aceptada' | 'rechazada';

/**
 * Contra-referencia: derivación de un paciente de su terapeuta tratante a otro
 * terapeuta del sistema, con trazabilidad completa en el expediente.
 */
export interface CounterReferral {
  id: string;
  patientId: string;
  patientName: string;
  fromTherapistId: string;
  fromTherapistName: string;
  toTherapistId: string;
  toTherapistName: string;
  reason: string;
  clinicalSummary?: string;
  status: CounterReferralStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
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

export type HolidayType = 'oficial' | 'personal';

export interface Holiday {
  id: string;
  date: string;      // ISO YYYY-MM-DD
  name: string;      // "Día de la Independencia" | "Vacaciones personales"
  type: HolidayType;
  createdBy?: string; // solo para días personales
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
  motivoConsulta?: string;
  dsm5?: string;
  cie11?: string;
  comorbilidad?: string;
  differentialDx?: string;
  treatmentPlan?: string;
  prognosis?: 'excelente' | 'bueno' | 'reservado' | 'malo';
  favorableFactors?: string;
  unfavorableFactors?: string;
  drugsList?: Drug[];
  drugsUsage?: string; // sí / no / especificar
  crisisHistory?: CrisisIncident[];

  // Identificación del expediente
  tipoExpediente?: 'fisico' | 'electronico' | 'mixto';
  fechaApertura?: string;
  fuenteReferencia?: FuenteReferencia;
  fuenteReferenciaOtro?: string;
  intentosSolucion?: string;
  // Historia clínica
  antecedentes?: Antecedentes;
  examenMental?: ExamenMental;
  fechaExamenMental?: string;
  riesgoSuicida?: RiesgoSuicida;
  riesgoHeteroagresivo?: RiesgoHeteroagresivo;
  otrosRiesgos?: string;
  riesgoSuicidaEspecificar?: string;
  riesgoHeteroagresivoEspecificar?: string;
  // Ficha de identificación (historiales)
  historialFarmacos?: HistorialFarmaco[];
  historialPsicofarmacos?: HistorialPsicofarmaco[];
  historialDrogas?: HistorialDroga[];
  // Esquema vigente (fármacos/drogas)
  farmacosEsquema?: HistorialFarmaco[];
  drogasEsquema?: HistorialDroga[];
  usoDrogas?: 'SI' | 'NO' | 'ESPECIFICAR';
}

export interface Session {
  id: string;
  patientId: string;
  number: number;
  date: string;
  phase: string;
  protocol: string;
  dxOp: string;
  spr?: string;
  significado?: string;
  trastorno?: string; // Trastorno especificado manualmente cuando el protocolo no está disponible
  px: string[]; // Prescripciones/maniobras asignadas
  f1: string; // Frase 1 o foco
  f2: string; // Frase 2 o foco
  oss: string; // Observaciones del terapeuta
  add: string; // Adherencia
  cumplimiento?: string; // Cumplimiento: adherencia | observancia | resistencia
  rss: string; // Resonancia o respuesta al cambio
  eff: string; // Efecto de las maniobras
  notes: string;
  observationsNextSession: string;
  situation: string;
  audioDuration?: string;
  status: 'borrador' | 'validado';
  valoracionCambio?: VcEntry;
  valoracionGlobal?: VgEntry;
  criterios?: CriterioClinico[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  details: string;
  category: 'expediente' | 'sesion' | 'ia' | 'reporte' | 'seguridad' | 'riesgo' | 'pagos';
}

export interface SupervisionRequest {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  reason: string;
  status: 'pendiente' | 'atendida';
  createdAt: string;
  attendedBy?: string;
  attendedAt?: string;
}

export type ContactOutcome = 'paciente_directo' | 'persona_apoyo' | 'sin_respuesta' | 'falsa_alarma';
export type AssessedRiskLevel = 'bajo' | 'medio' | 'alto' | 'inminente';

export interface CrisisResolutionDetails {
  contactOutcome: ContactOutcome;
  riskLevelAssessed: AssessedRiskLevel;
  actionsTaken: string[];
  clinicalNote: string;
  patientInstructions?: string;
  nextStep?: 'sesion_urgente' | 'derivacion_urgencias' | 'seguimiento_habitual';
  updatedPatientRiskLevel?: 'bajo' | 'medio' | 'alto';
}

export interface CrisisIncident {
  id: string;
  alertId: string;
  timestamp: string;
  resolvedAt: string;
  resolvedBy: string;
  role: Role;
  reason: string;
  resolutionDetails: CrisisResolutionDetails;
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
  resolutionDetails?: CrisisResolutionDetails;
}

export interface LibraryDocument {
  id: string;
  title: string;
  category: 'manual' | 'protocolo' | 'normativa';
  code?: string;
  content: string;
  summary: string;
  warnings?: string[];   // ← NUEVO (opcional)
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

export type PhysicalCertificateType = 
  | 'psicoterapeutica'
  | 'psiquiatrica'
  | 'asistencia'
  | 'informe_pericial'
  | 'justificante';

export interface PhysicalCertificateLog {
  id: string;
  patientId: string;
  patientName: string;
  physicalFolio: string;           // Folio físico asentado en papel
  issueDate: string;               // Fecha de expedición en consultorio
  type: PhysicalCertificateType;
  issuerName: string;              // Médico o psicólogo firmante
  issuerLicense: string;           // Cédula profesional
  recipient: string;               // Destinatario (A quien corresponda, etc.)
  purpose: string;                 // Motivo de solicitud
  periodCovered: string;           // Periodo cubierto
  sessionsCount: number;           // Sesiones acreditadas
  clinicalSummary: string;         // Síntesis de lo asentado en físico
  digitalScanUrl?: string;         // Enlace o nombre de archivo del escaneo/foto adjunto
  scanFileName?: string;
  deliveredTo: string;             // A quién se le entregó en mano
  status: 'entregada_en_fisico' | 'anulada';
  registeredBy: string;
  registeredAt: string;
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

// ── Tipos de paridad (copiados del fullstack) ────────────────────────────────

export type RiesgoSuicida = 'ausente' | 'bajo' | 'moderado' | 'alto' | 'inminente';
export type RiesgoHeteroagresivo = 'ausente' | 'bajo' | 'moderado' | 'alto';
export type FuenteReferencia = 'iniciativa_propia' | 'medico' | 'psiquiatra' | 'psicoterapeuta' | 'familiar' | 'amigo' | 'otro';
export type CodigoCategoriaPsicofarmaco =
  'bzd' | 'isrs' | 'duales' | 'triciclicos_tetraciclicos'
  | 'neurolepticos_tipicos' | 'neurolepticos_atipicos'
  | 'psicoestabilizadores' | 'inductores_sueno' | 'otros';

export interface CategoriaPsicofarmaco { codigo: CodigoCategoriaPsicofarmaco; etiqueta: string; orden: number; }
export interface Domicilio {
  calleNumero: string; colonia: string; codigoPostal: string;
  municipio: string; estadoDomicilio: string;
  telefonoCasa: string | null; telefonoCelular: string | null; telefonoTrabajo: string | null;
}
export interface ContactoEmergencia { nombre: string; parentesco: string; telefono: string; }
export interface TerapeutaSede { id: string; nombre: string; esPrincipal: boolean; }
export interface CambioConfiguracion {
  id: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  usuarioNombre: string;
  fecha: string;
}
export interface HábitoPresente {
  presente: boolean;
  cantidad?: string;
  tiempo?: string;
  frecuencia?: string;
  tipo?: string;
}

export interface Antecedentes {
  personalesPatológicos: {
    médicos: string;
    quirúrgicos: string;
    traumáticos: string;
    alérgicos: string;
    transfusionales: string;
    hospitalizaciones: string;
  };
  personalesNoPatológicos: {
    tabaquismo: HábitoPresente;
    alcoholismo: HábitoPresente;
    toxicomanías: HábitoPresente;
    actividadFísica: string;
    alimentación: string;
  };
  heredoFamiliares: {
    enfermedadesMentales: string;
    enfermedadesCrónicas: string;
    suicidiosIntentos: string;
    adicciones: string;
  };
}

export interface ExamenRiesgoItem {
  nivel: string;
  hallazgo: string;
}

export interface ExamenMental {
  aparienciaConducta?: Record<string, string>;
  concienciaSensorio?: Record<string, string>;
  lenguajeHabla?: Record<string, string>;
  afectividad?: Record<string, string>;
  pensamiento?: Record<string, string>;
  sensopercepción?: Record<string, string>;
  funcionesCognoscitivas?: Record<string, string>;
  juicioIntrospección?: Record<string, string>;
  funcionesFisiológicas?: Record<string, string>;
  evaluaciónRiesgo?: Record<string, ExamenRiesgoItem>;
  síntesis?: Record<string, string>;
}

export interface TratamientoPrevio { id?: string; enfoque: string; duracion: string; resultado: 'resuelto' | 'mejorado' | 'invariable' | 'drop_out' | 'otro'; }
export interface HistorialFarmaco { nombre: string; }
export interface HistorialPsicofarmaco { nombre: string; duracion: string; }
export interface HistorialDroga { nombre: string; }
export interface Establecimiento { id: string; nombre: string; clues: string | null; licenciaSanitaria: string | null; tipoEstablecimiento: 'publico' | 'privado' | 'social' | null; }

export interface Drug {
  id: string;
  name: string;
  doseMorning: string;
  doseAfternoon: string;
  doseNight: string;
  eff: string;
  notes: string;
  categoria?: CodigoCategoriaPsicofarmaco;
}

export interface VcEntry {
  sessionNum: number;
  percepcion: string;
  pensamientos: string;
  sensaciones: string;
  reacciones: string;
  sintomas: string;
  crisis: string;
}

export interface VgEntry {
  sessionNum: number;
  yo: boolean;
  demas: boolean;
  mundo: boolean;
}

export type CriterioCategoria =
  | 'conductual'
  | 'racionalizaciones_intelectualizaciones'
  | 'comparaciones'
  | 'imagenes_intrusivas'
  | 'otro';

export interface CriterioClinico {
  id?: string;
  categoria: CriterioCategoria;
  valor: string;
}

export interface OpcionConductual {
  codigo: string;
  etiqueta: string;
  orden: number;
}
