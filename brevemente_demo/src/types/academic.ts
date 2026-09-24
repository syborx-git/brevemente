import { Role } from './clinical';

export interface StudentAcademicInfo {
  id: string;
  name: string;
  diplomado: string;
  progressPercent: number;
  nextActivity: string;
  completedModulesCount: number;
  pendingEvaluationsCount: number;
  scheduledSupervisionsCount: number;
  pendingSimulationsCount: number;
  gpa: number;
  trainingHours: number;
  certificationStatus: 'certificado' | 'en_proceso' | 'no_iniciado';
  lastFeedback: string;
}

export interface AcademicProgram {
  id: string;
  name: string;
  cohort: string;
  studentsCount: number;
  teachersCount: number;
  supervisorsCount: number;
  modulesCount: number;
  hours: number;
  modality: 'presencial' | 'online' | 'híbrida';
  aval: string;
}

export interface CurricularModule {
  id: string;
  title: string;
  type: 'video' | 'lectura' | 'manual' | 'protocolo' | 'caso' | 'practica' | 'evaluacion' | 'ia_simulacion' | 'supervision';
  duration: string;
  status: 'completado' | 'en_progreso' | 'bloqueado';
  description: string;
  approvalCriteria?: string;
}

export interface PatientSimulation {
  id: string;
  name: string;
  problem: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  solutionAttempts: string[];
  protocolCode: string;
  systemPerceptiveReactive: string;
  initialClues: string; // lo que decide revelar inicialmente
  riskFactor?: boolean;
}

export interface CompetencyDimension {
  name: string;
  score: number; // 1-10
  expectedLevel: number;
  evidence: string;
  comment: string;
  actionPlan: string;
}

export interface AcademicFeedback {
  id: string;
  studentId: string;
  studentName: string;
  evaluatorName: string;
  date: string;
  dimensions: CompetencyDimension[];
  overallComments: string;
  recommendations: string;
  nextEvaluationDate: string;
  type: 'formativa' | 'clinica';
}

export interface QualityAlert {
  id: string;
  type: 'desviacion_sistematica' | 'caso_estancado' | 'sesiones_excedidas' | 'alto_abandono' | 'prescripcion_alterada' | 'nota_sin_validar' | 'supervision_vencida' | 'riesgo_abierto';
  title: string;
  targetName: string; // Terapeuta o Paciente implicado
  details: string;
  severity: 'media' | 'alta' | 'critica';
  date: string;
  status: 'pendiente' | 'revisado' | 'resuelto';
}

export interface AcademicCertificate {
  folio: string;
  programName: string;
  studentName: string;
  issueDate: string;
  expiryDate: string;
  institution: string;
  competencies: string[];
  signatureSimulated: string;
  qrMockData: string;
}

export interface InternalClinicTraining {
  id: string;
  title: string;
  targetAudience: Role[];
  limitDate: string;
  modulesCount: number;
  studentsRegistered: number;
  progressPercent: number;
  status: 'activo' | 'completado';
}
