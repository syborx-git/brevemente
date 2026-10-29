export type Role = 'admin_platform' | 'admin_clinical' | 'therapist' | 'assistant' | 'supervisor' | 'patient' | 'student';

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

export interface User {
  id: string;
  name: string;
  roles: Role[];
  permissions?: Permission[];
  email: string;
  avatar?: string;
  license?: string;
  terapeutaIds?: string[];
  pacienteId?: string;
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
  rfc?: string;
  sexo?: Sexo;
  lugarNacimiento?: string;
  estadoCivil?: string;
  escolaridad?: string;
  ocupacion?: string;
  religion?: string;
  domicilio?: Domicilio;
  contactoEmergencia?: ContactoEmergencia;
  sedeId?: string;
}

export interface PacienteResumen {
  id: string;
  name: string;
  curp: string;
  edadCalculada: number;
  capacidadConsentimiento?: CapacidadConsentimiento;
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
  terapeutaId?: string;
  duration?: 30 | 45 | 60;
  modality?: 'PRESENCIAL' | 'ONLINE';
  office?: 'A' | 'B';
  bloqueadaPorNormativa?: boolean;
}

export interface DiaNoLaborable {
  id: string;
  fecha: string;
  nombre: string;
  tipo: 'oficial' | 'personal';
  terapeutaId?: string | null;
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

  // DX Psiquiátrico (Fase 2)
  dxNosologico?: string;
  dsm5?: string;
  cie11?: string;
  comorbilidad?: string;
  differentialDx?: string;
  treatmentPlan?: string;
  prognosis?: 'excelente' | 'bueno' | 'reservado' | 'malo';
  favorableFactors?: string;
  unfavorableFactors?: string;
  drugsUsage?: string;
  drugsList?: Drug[];
  intentosSolucion?: string;
  tipoExpediente?: TipoExpediente;
  fechaApertura?: string;
  fuenteReferencia?: FuenteReferencia;
  fuenteReferenciaOtro?: string;
  riesgoSuicida?: RiesgoSuicida;
  riesgoHeteroagresivo?: RiesgoHeteroagresivo;
  otrosRiesgos?: string;
  riesgoSuicidaEspecificar?: string;
  riesgoHeteroagresivoEspecificar?: string;
  antecedentes?: Antecedentes;
  fechaExamenMental?: string;
  examenMental?: ExamenMental;
  historialFarmacos?: HistorialFarmaco[];
  historialPsicofarmacos?: HistorialPsicofarmaco[];
  historialDrogas?: HistorialDroga[];
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
  valoracionCambio?: VcEntry;
  valoracionGlobal?: VgEntry;
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

export type Sexo = 'M' | 'F' | 'LGTB+';
export type TipoExpediente = 'fisico' | 'electronico' | 'mixto';
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

export type AuditLogCategory = 'expediente' | 'sesion' | 'ia' | 'reporte' | 'seguridad' | 'riesgo' | 'pagos';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  category: AuditLogCategory;
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

export type PhysicalCertificateType = 'psicoterapeutica' | 'psiquiatrica' | 'asistencia' | 'informe_pericial' | 'justificante';

export interface PhysicalCertificateLog {
  id: string;
  patientId: string;
  patientName: string;
  physicalFolio: string;
  issueDate: string;
  type: PhysicalCertificateType;
  issuerName: string;
  issuerLicense: string;
  recipient: string;
  purpose: string;
  periodCovered: string;
  sessionsCount: number;
  clinicalSummary: string;
  digitalScanUrl?: string;
  scanFileName?: string;
  deliveredTo: string;
  status: 'entregada_en_fisico' | 'anulada';
  registeredBy: string;
  registeredAt: string;
}

