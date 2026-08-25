import { 
  StudentAcademicInfo, AcademicProgram, CurricularModule, PatientSimulation, 
  AcademicFeedback, QualityAlert, AcademicCertificate, InternalClinicTraining 
} from '../types/academic';

// 1. Perfil del alumno/terapeuta en formación activo
export const mockStudentProfile: StudentAcademicInfo = {
  id: 'student-active',
  name: 'Carlos Mendoza',
  diplomado: 'Diplomado en Terapia Breve Estratégica',
  progressPercent: 75,
  nextActivity: 'Práctica de Diálogo Estratégico en Paciente de Fobia Social',
  completedModulesCount: 6,
  pendingEvaluationsCount: 1,
  scheduledSupervisionsCount: 2,
  pendingSimulationsCount: 1,
  gpa: 9.2,
  trainingHours: 90,
  certificationStatus: 'en_proceso',
  lastFeedback: 'Excelente aplicación del Diálogo Estratégico. Se recomienda profundizar en la modulación del tono de voz para inducir el efecto del descubrimiento conjunto.'
};

// 2. Programas y cohortes
export const mockPrograms: AcademicProgram[] = [
  {
    id: 'program-1',
    name: 'Diplomado en Terapia Breve Estratégica',
    cohort: 'Agosto 2026',
    studentsCount: 24,
    teachersCount: 4,
    supervisorsCount: 2,
    modulesCount: 8,
    hours: 120,
    modality: 'híbrida',
    aval: 'Aval universitario de la Facultad de Psicología UNAM en proceso de expedición'
  },
  {
    id: 'program-2',
    name: 'Especialidad en Trastornos Obsesivo-Compulsivos con TBE',
    cohort: 'Octubre 2026',
    studentsCount: 12,
    teachersCount: 2,
    supervisorsCount: 1,
    modulesCount: 6,
    hours: 80,
    modality: 'online',
    aval: 'Certificación Internacional del CTS Arezzo'
  }
];

// Listado simulado de 24 alumnos de la cohorte
export const mockStudentsList = Array.from({ length: 24 }, (_, i) => ({
  id: `std-${i + 1}`,
  name: [
    'Carlos Mendoza', 'Sofía Martínez', 'Ana Luisa Gómez', 'Juan Pablo López', 
    'María Fernanda Díaz', 'Esteban Ortiz', 'Gabriela Ruiz', 'Diego Morales',
    'Lucía Herrera', 'Martín Castro', 'Victoria Silva', 'Julián Medina',
    'Valeria Vargas', 'Mateo Salazar', 'Camila Benítez', 'Nicolás Fuentes',
    'Daniela Ortega', 'Sebastián Cabrera', 'Isabella Mendoza', 'Santiago Rivas',
    'Regina Torres', 'Alejandro Domínguez', 'Sofía Guerrero', 'Patricia León'
  ][i],
  email: `alumno.${i + 1}@brevemente.edu.mx`,
  gpa: Number((8.2 + Math.random() * 1.8).toFixed(1)),
  progress: Math.floor(40 + Math.random() * 60),
  status: Math.random() > 0.8 ? 'Aprobado' : 'Cursando'
}));

// 3. Ruta curricular / Aprendizaje
export const mockCurricularModules: CurricularModule[] = [
  {
    id: 'm1',
    title: 'Módulo 1: Fundamentos de Terapia Breve Estratégica',
    type: 'lectura',
    duration: '10 horas',
    status: 'completado',
    description: 'Bases teóricas, constructivismo, lógica no ordinaria y epistemología estratégica.',
    approvalCriteria: 'Examen teórico aprobado con 8.0 mínimo.'
  },
  {
    id: 'm2',
    title: 'Módulo 2: Sistema Perceptivo-Reactivo (SPR)',
    type: 'manual',
    duration: '15 horas',
    status: 'completado',
    description: 'Estudio de las modalidades de relación del paciente consigo mismo, con los demás y con el mundo.',
    approvalCriteria: 'Entrega de ensayo de mapeo de SPR sobre caso clínico.'
  },
  {
    id: 'm3',
    title: 'Módulo 3: Soluciones Intentadas Redundantes',
    type: 'protocolo',
    duration: '15 horas',
    status: 'completado',
    description: 'Identificación de la repetición de conductas que alimentan y mantienen el trastorno.',
    approvalCriteria: 'Evaluación práctica de identificación en video.'
  },
  {
    id: 'm4',
    title: 'Módulo 4: Diálogo Estratégico',
    type: 'video',
    duration: '20 horas',
    status: 'completado',
    description: 'Estructuración de preguntas de ilusión de alternativa, paráfrasis reestructurantes y lenguaje evocador.',
    approvalCriteria: 'Prueba en vivo simulada aprobada.'
  },
  {
    id: 'm5',
    title: 'Módulo 5: Prescripciones y Reestructuraciones',
    type: 'lectura',
    duration: '15 horas',
    status: 'completado',
    description: 'Prescripción de comportamiento, uso del diario de abordo, peor fantasía y oráculos.',
    approvalCriteria: 'Cuestionario de literalidad técnica de prescripción.'
  },
  {
    id: 'm6',
    title: 'Módulo 6: Protocolos Clínicos Específicos',
    type: 'protocolo',
    duration: '20 horas',
    status: 'en_progreso',
    description: 'Protocolo de Ataque de Pánico, Fobias, TOC y Depresión.',
    approvalCriteria: 'Simulación clínica contra IA con evaluación final.'
  },
  {
    id: 'm7',
    title: 'Módulo 7: Práctica con Pacientes Simulados con IA',
    type: 'ia_simulacion',
    duration: '15 horas',
    status: 'bloqueado',
    description: 'Sesiones de simulación interactiva con pacientes simulados de alta complejidad en Senda.',
    approvalCriteria: 'Tres simulaciones aprobadas con rúbrica mínima de 8.5.'
  },
  {
    id: 'm8',
    title: 'Módulo 8: Supervisión y Evaluación Final',
    type: 'supervision',
    duration: '10 horas',
    status: 'bloqueado',
    description: 'Supervisión en vivo de un caso real y defensa oral de la estructura lógica de la intervención.',
    approvalCriteria: 'Dictamen de aprobación emitido por el supervisor académico.'
  }
];

// 4. Casos del Simulador Clínico
export const mockSimulatedCases: PatientSimulation[] = [
  {
    id: 'sim-1',
    name: 'Marta Soler (Pánico)',
    problem: 'Ataques de pánico recurrentes con agorafobia. Evitación sistemática de transporte público y centros comerciales.',
    difficulty: 'fácil',
    solutionAttempts: ['Petición de ayuda a familiares', 'Evitación de espacios públicos', 'Uso de ansiolíticos preventivos'],
    protocolCode: 'TBE-P-01',
    systemPerceptiveReactive: 'Fóbico (Evitación/Demanda)',
    initialClues: 'Tengo un miedo horrible a salir a la calle sola. Siento que el aire me va a faltar, mi corazón late rapidísimo y que me voy a morir ahí en medio de la gente.'
  },
  {
    id: 'sim-2',
    name: 'Jorge Delgado (TOC Control)',
    problem: 'TOC caracterizado por la necesidad de verificar las cerraduras de gas, puertas y luces exactamente 7 veces antes de dormir para evitar catástrofes.',
    difficulty: 'medio',
    solutionAttempts: ['Ritual de verificación sistemática (control)', 'Demanda de reaseguro a su esposa'],
    protocolCode: 'TBE-M-02',
    systemPerceptiveReactive: 'Obsesivo (Paradoja del Control)',
    initialClues: 'No puedo dormir si no reviso la casa. Me levanto una y otra vez... si no lo hago en múltiplos de 7, siento que ocurrirá una explosión.'
  },
  {
    id: 'sim-3',
    name: 'Silvia Cruz (Fobia Social)',
    problem: 'Pánico escénico agudo que le impide realizar presentaciones ejecutivas ante sus directores en el corporativo.',
    difficulty: 'fácil',
    solutionAttempts: ['Escribir todo el guion y leerlo textualmente', 'Tomar betabloqueadores', 'Tratar de controlar la respiración y los temblores'],
    protocolCode: 'TBE-F-03',
    systemPerceptiveReactive: 'Fóbico (Miedo al Juicio/Pérdida de control)',
    initialClues: 'Tengo una presentación de resultados el próximo viernes y estoy pensando en inventar una enfermedad. Cuando me toca hablar frente a los jefes, la voz me tiembla y siento que haré el ridículo.'
  },
  {
    id: 'sim-4',
    name: 'Elena y Ramón (Pareja)',
    problem: 'Conflicto de pareja crónico basado en reproches constantes y soluciones intentadas de silencio punitivo y discusiones acaloradas.',
    difficulty: 'medio',
    solutionAttempts: ['Hacer como si nada pasara', 'Discusiones racionales infructuosas', 'Silencios punitivos prolongados'],
    protocolCode: 'TBE-CO-04',
    systemPerceptiveReactive: 'Relacional (Lucha de Poder/Reproches)',
    initialClues: 'Ya no nos entendemos. Cada conversación termina en pelea o pasamos días sin hablarnos en la misma casa.'
  },
  {
    id: 'sim-5',
    name: 'Roberto Valdés (Caso Riesgo)',
    problem: 'Paciente con depresión profunda y expresiones sutiles de desesperanza absoluta e ideación autolítica.',
    difficulty: 'difícil',
    solutionAttempts: ['Aislamiento social', 'Búsqueda de formas de despedirse', 'Regalo de objetos de valor'],
    protocolCode: 'TBE-D-05',
    systemPerceptiveReactive: 'Depresivo (Rendición/Abandono del Yo)',
    initialClues: 'Siento que ya no tiene caso seguir luchando. Todo es oscuro y creo que mi familia estaría mucho mejor si yo simplemente dejara de ser una carga.'
  }
];

// 5. Evaluaciones y Rúbricas
export const mockAcademicFeedback: AcademicFeedback[] = [
  {
    id: 'fb-1',
    studentId: 'student-active',
    studentName: 'Carlos Mendoza',
    evaluatorName: 'Dra. Isabel Cárdenas',
    date: '2026-08-20',
    dimensions: [
      { name: 'Identificación del problema', score: 9, expectedLevel: 8, evidence: 'Mapea con precisión la queja principal y el trastorno.', comment: 'Excelente capacidad de escucha.', actionPlan: 'Mantener estándar.' },
      { name: 'Identificación de soluciones intentadas', score: 9, expectedLevel: 8, evidence: 'Lista todas las evitan y demandas de ayuda.', comment: 'Preciso en el desglose.', actionPlan: 'Sin observaciones.' },
      { name: 'Reconstrucción del SPR', score: 8, expectedLevel: 8, evidence: 'Define correctamente la lógica fóbica del paciente.', comment: 'Cumple el estándar.', actionPlan: 'Profundizar en casos atípicos.' },
      { name: 'Calidad del diálogo estratégico', score: 7, expectedLevel: 8, evidence: 'Formuló preguntas de alternativa pero con tono agresivo.', comment: 'Mejorar modulación de tono.', actionPlan: 'Ejercicios de para-lenguaje.' },
      { name: 'Uso de preguntas con alternativa', score: 8, expectedLevel: 8, evidence: 'Aplicó la ilusión de alternativas dos veces.', comment: 'Adecuado.', actionPlan: 'Mantener.' },
      { name: 'Calidad de paráfrasis', score: 7, expectedLevel: 8, evidence: 'Paráfrasis demasiado argumentativas en lugar de evocadoras.', comment: 'Reducir explicaciones racionales.', actionPlan: 'Lecturas de lenguaje evocador.' },
      { name: 'Descubrimiento conjunto', score: 6, expectedLevel: 8, evidence: 'Le dijo al paciente la conclusión en lugar de guiarlo.', comment: 'Impaciencia por cerrar el diagnóstico.', actionPlan: 'Prácticas de silencio terapéutico.' },
      { name: 'Selección del protocolo', score: 9, expectedLevel: 8, evidence: 'Eligió el protocolo de Ataque de Pánico inmediatamente.', comment: 'Dominio perfecto de manuales.', actionPlan: 'Mantener.' },
      { name: 'Fidelidad a las maniobras', score: 8, expectedLevel: 8, evidence: 'Prescribió correctamente la Peor Fantasía.', comment: 'Fiel al modelo.', actionPlan: 'Revisar horas de alarma.' },
      { name: 'Literalidad de la prescripción', score: 9, expectedLevel: 8, evidence: 'Explicó la maniobra con las palabras canónicas del manual.', comment: 'Excelente rigor.', actionPlan: 'Mantener.' },
      { name: 'Detección de riesgo', score: 10, expectedLevel: 9, evidence: 'Detectó alerta autolítica y activó protocolo de inmediato.', comment: 'Perfecto cumplimiento ético.', actionPlan: 'Mantener excelencia.' },
      { name: 'Documentación clínica', score: 8, expectedLevel: 8, evidence: 'Notas claras y cargadas a tiempo.', comment: 'Consistente.', actionPlan: 'Mantener.' }
    ],
    overallComments: 'El alumno demuestra un alto rigor teórico y una excelente capacidad técnica de protocolo. Su principal área de desarrollo radica en suavizar la comunicación del diálogo estratégico, permitiendo que sea el paciente quien haga el descubrimiento, evitando la imposición racional.',
    recommendations: 'Practicar la modulación evocadora en diálogos y realizar al menos dos simulaciones con Senda en casos de TOC.',
    nextEvaluationDate: '2026-09-10',
    type: 'formativa'
  }
];

// 6. Alertas de calidad y clínica
export const mockQualityAlerts: QualityAlert[] = [
  {
    id: 'qa-1',
    type: 'desviacion_sistematica',
    title: 'Desviación sistemática en prescripción',
    targetName: 'Dr. Alejandro Silva',
    details: 'Se detecta que en el 40% de los casos de Ataque de Pánico, el terapeuta prescribe la Peor Fantasía reduciendo el tiempo a 15 minutos en lugar de los 30 minutos obligatorios del protocolo de Arezzo.',
    severity: 'alta',
    date: '2026-08-23',
    status: 'pendiente'
  },
  {
    id: 'qa-2',
    type: 'sesiones_excedidas',
    title: 'Expediente excede límite de 10 sesiones',
    targetName: 'Paciente: Carlos Mendoza (Dr. Alejandro Silva)',
    details: 'El tratamiento de TOC de Carlos Mendoza ha alcanzado la Sesión 11 sin reporte de alta o resolución del ritual verificado.',
    severity: 'media',
    date: '2026-08-24',
    status: 'pendiente'
  },
  {
    id: 'qa-3',
    type: 'alto_abandono',
    title: 'Tasa de abandono superior al promedio',
    targetName: 'Dr. Alejandro Silva',
    details: 'El terapeuta registra una tasa de deserción del 15% en el último trimestre, superando el límite institucional del 8%.',
    severity: 'alta',
    date: '2026-08-22',
    status: 'pendiente'
  },
  {
    id: 'qa-4',
    type: 'riesgo_abierto',
    title: 'Evento de riesgo clínico sin cierre',
    targetName: 'Paciente: Sofía Martínez',
    details: 'Alerta roja de riesgo suicida escalada en Sesión 3. Requiere acta de control y validación de alta de crisis por parte del supervisor supervisor.',
    severity: 'critica',
    date: '2026-08-24',
    status: 'pendiente'
  }
];

// 7. Certificados verificables
export const mockCertificates: AcademicCertificate[] = [
  {
    folio: 'CERT-TBE-2026-0988',
    programName: 'Diplomado en Terapia Breve Estratégica',
    studentName: 'Dr. Alejandro Silva',
    issueDate: '2025-12-15',
    expiryDate: '2027-12-15',
    institution: 'Centro de Terapia Breve Estratégica México & CTS Arezzo',
    competencies: [
      'Diagnóstico Estratégico Operativo',
      'Protocolos Específicos de Trastornos de Ansiedad y Pánico',
      'Prescripciones de Paradoja y Contra-paradoja',
      'Diálogo Estratégico y Reestructuración Evocadora'
    ],
    signatureSimulated: 'Dra. Isabel Cárdenas - Coordinadora de Certificación',
    qrMockData: 'https://verificacion.brevemente.edu.mx/cert/CERT-TBE-2026-0988'
  },
  {
    folio: 'CERT-TBE-2026-1122',
    programName: 'Uso Clínico Seguro de Inteligencia Artificial Asistencial',
    studentName: 'Dr. Alejandro Silva',
    issueDate: '2026-03-10',
    expiryDate: '2028-03-10',
    institution: 'BreveMente Clinical Ethics Board',
    competencies: [
      'Modelos de Humano en el Circuito (HITL)',
      'Trazabilidad e Inmutabilidad de Auditoría HIPAA',
      'Detección Automática de Riesgo y Crisis en Textos'
    ],
    signatureSimulated: 'Ing. Rodrigo Pérez - Director de Tecnología',
    qrMockData: 'https://verificacion.brevemente.edu.mx/cert/CERT-TBE-2026-1122'
  }
];

// 8. Capacitaciones de la clínica (Internal Clinics Training)
export const mockClinicTrainings: InternalClinicTraining[] = [
  {
    id: 'ct-1',
    title: 'Capacitación en Consentimiento Legal y Privacidad de Datos',
    targetAudience: ['therapist', 'assistant', 'supervisor'],
    limitDate: '2026-08-30',
    modulesCount: 4,
    studentsRegistered: 8,
    progressPercent: 88,
    status: 'activo'
  },
  {
    id: 'ct-2',
    title: 'Uso Correcto de Senda para Redacción de Notas Clínicas (Borradores)',
    targetAudience: ['therapist', 'supervisor'],
    limitDate: '2026-09-15',
    modulesCount: 5,
    studentsRegistered: 6,
    progressPercent: 50,
    status: 'activo'
  }
];

// 9. Comentarios anclados a grabaciones de supervisión (Revisión de Sesión)
export const mockRecordingAnnotations = [
  { time: '02:15', label: 'pregunta', text: 'Pregunta de alternativa bien formulada: ¿El miedo aparece antes o después de salir?', audioSec: 135 },
  { time: '05:40', label: 'parafrasis', text: 'Paráfrasis reestructurante oportuna sobre el control que hace perder el control.', audioSec: 340 },
  { time: '08:12', label: 'desviacion', text: 'Desviación: El terapeuta explica racionalmente el pánico en lugar de evocar sensaciones.', audioSec: 492 },
  { time: '11:30', label: 'prescripcion', text: 'Prescripción de la Peor Fantasía: Se dictó de manera literal y firme. Excelente.', audioSec: 690 },
  { time: '14:22', label: 'riesgo', text: 'Riesgo: El paciente insinúa autolesión. El terapeuta detecta pero no hace doble pregunta de seguridad. Alerta.', audioSec: 862 }
];
export const mockRecordingTranscript = [
  { time: '02:10 - 02:25', text: 'Terapeuta: Sofía, dime una cosa... ¿este miedo a desmayarte aparece antes de que decidas salir de casa, o solo cuando estás afuera en la calle?' },
  { time: '05:30 - 05:50', text: 'Terapeuta: O sea, que en el intento de mantener el control absoluto sobre tus latidos y tu respiración, lo que logras es precisamente perder el control y desatar la crisis. ¿Es así?' },
  { time: '08:00 - 08:30', text: 'Terapeuta: Lo que pasa es que fisiológicamente el pánico es una sobrecarga de adrenalina, tu cerebro reptiliano reacciona al peligro...' }
];
