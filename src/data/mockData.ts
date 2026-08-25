import { Patient, Appointment, ClinicalRecord, Session, LibraryDocument } from '../types/clinical';

export const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    name: 'Sofía Martínez',
    phone: '+52 55 1234 5678',
    email: 'sofia.martinez@email.com',
    birthDate: '1998-05-14',
    curp: 'MAVS980514MDFRR09',
    registrationDate: '2026-08-10',
    status: 'activo',
    riskLevel: 'medio',
    registryMode: 'ia',
    motif: 'Ataques de pánico intensos y repentinos con sudoración, taquicardia y miedo a morir.',
    therapistId: 'therapist-1',
    therapistName: 'Dr. Alejandro Silva'
  },
  {
    id: 'patient-2',
    name: 'Carlos Mendoza',
    phone: '+52 55 9876 5432',
    email: 'carlos.mendoza@email.com',
    birthDate: '1991-10-22',
    curp: 'MECC911022HDFLN03',
    registrationDate: '2026-08-20',
    status: 'pendiente',
    riskLevel: 'bajo',
    registryMode: 'manual',
    motif: 'Ansiedad severa y sudoración al tener que hablar ante audiencias o juntas laborales.',
    therapistId: 'therapist-1',
    therapistName: 'Dr. Alejandro Silva'
  },
  {
    id: 'patient-3',
    name: 'Ana María Ruiz',
    phone: '+52 55 4567 8901',
    email: 'ana.ruiz@email.com',
    birthDate: '1984-03-08',
    curp: 'RUZA840308MDFPP07',
    registrationDate: '2026-07-01',
    status: 'completado',
    riskLevel: 'bajo',
    registryMode: 'manual',
    motif: 'Pensamientos obsesivos sobre contaminación y rituales de lavado de manos repetitivos.',
    therapistId: 'therapist-1',
    therapistName: 'Dr. Alejandro Silva'
  },
  {
    id: 'patient-4',
    name: 'Roberto Valdés',
    phone: '+52 55 8765 4321',
    email: 'roberto.valdes@email.com',
    birthDate: '1979-12-01',
    curp: 'VARR791201HDFZZ01',
    registrationDate: '2026-08-15',
    status: 'archivado',
    riskLevel: 'bajo',
    registryMode: 'manual',
    motif: 'Problemas de pareja y comunicación destructiva.',
    therapistId: 'therapist-1',
    therapistName: 'Dr. Alejandro Silva'
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'app-1',
    patientId: 'patient-1',
    patientName: 'Sofía Martínez',
    time: '09:00',
    date: '2026-08-24', // Hoy
    type: 'seguimiento',
    status: 'confirmada'
  },
  {
    id: 'app-2',
    patientId: 'patient-2',
    patientName: 'Carlos Mendoza',
    time: '11:30',
    date: '2026-08-24',
    type: 'primera',
    status: 'confirmada'
  },
  {
    id: 'app-3',
    patientId: 'patient-3',
    patientName: 'Ana María Ruiz',
    time: '16:00',
    date: '2026-08-24',
    type: 'seguimiento',
    status: 'pendiente'
  }
];

export const mockClinicalRecords: Record<string, ClinicalRecord> = {
  'patient-1': {
    patientId: 'patient-1',
    patientName: 'Sofía Martínez',
    folio: 'EXP-8849',
    startDate: '2026-08-10',
    age: 28,
    therapistName: 'Dr. Alejandro Silva',
    status: 'Activo - En Tratamiento',
    riskLevel: 'medio',
    modality: 'online',
    motif: 'Ataques de pánico intensos y repentinos con sudoración, taquicardia y miedo a morir.',
    description: 'Paciente femenina de 28 años que refiere inicio de crisis de angustia súbitas hace 3 meses. Asocia síntomas con miedo a desmayarse en público y perder el control. Ha evitado lugares concurridos y solicita compañía constante para salir a trabajar.',
    trastornoEstrategico: 'Trastorno por Ataque de Pánico',
    firstAppearance: 'Hace 3 meses tras periodo de alto estrés laboral.',
    precipitatingFactors: 'Discusión fuerte con superior jerárquico y desvelo prolongado.',
    evolutionType: 'episódico',
    dxOpInicial: 'SPR Fóbico',
    sprInicial: 'Marcador de inicio',
    valoracionCambioInicial: 'Marcador de inicio',
    valoracionGlobalInicial: 'Marcador de inicio',
    objectivePatient: 'Poder salir a trabajar y estar sola en su casa sin temor a morir o desmayarse.',
    objectiveTherapist: 'Reestructurar la percepción de peligro físico, disolver la paradoja del control que hace perder el control, y eliminar las soluciones intentadas (evitación y petición de ayuda).'
  },
  'patient-2': {
    patientId: 'patient-2',
    patientName: 'Carlos Mendoza',
    folio: 'EXP-9012',
    startDate: '2026-08-20',
    age: 35,
    therapistName: 'Dr. Alejandro Silva',
    status: 'Activo - En Diagnóstico',
    riskLevel: 'bajo',
    modality: 'presencial',
    motif: 'Ansiedad severa y sudoración al tener que hablar ante audiencias o juntas laborales.',
    description: 'Paciente masculino de 35 años, gerente de operaciones, que reporta bloqueos de habla y temblor de manos al exponer informes en su empresa. La evitación de hablar en público ha comenzado a afectar sus oportunidades de promoción.',
    trastornoEstrategico: 'Miedo a perder el control tipo 1: hablar en público',
    firstAppearance: 'Hace 6 meses en presentación ante el consejo directivo.',
    precipitatingFactors: 'Pregunta imprevista de un auditor externo que no supo responder en el momento.',
    evolutionType: 'progresivo',
    dxOpInicial: 'SPR Fóbico',
    sprInicial: 'Marcador de inicio',
    valoracionCambioInicial: 'Marcador de inicio',
    valoracionGlobalInicial: 'Marcador de inicio',
    objectivePatient: 'Hacer exposiciones con fluidez y sin sentir que me falta el aire.',
    objectiveTherapist: 'Disolver la lucha consciente por controlar las reacciones fisiológicas de ansiedad.'
  }
};

export const mockSessions: Record<string, Session[]> = {
  'patient-1': [
    {
      id: 'session-1-1',
      patientId: 'patient-1',
      number: 1,
      date: '2026-08-10',
      phase: 'Socialización',
      protocol: 'Ataque de Pánico',
      dxOp: 'SPR Fóbico',
      px: ['Diario de abordo', 'Cómo empeorar'],
      f1: 'Redefinición del control: "Quien busca el control, lo pierde; quien lo entrega, lo gana."',
      f2: 'Evitación que confirma el peligro.',
      oss: 'Paciente muy receptiva. Se identificó la solución intentada de pedir ayuda a su madre y esposo.',
      add: '100% - Realizó la tarea de diario de abordo cada vez que sintió ansiedad.',
      rss: 'Mejoría leve al externalizar las crisis en el registro escrito.',
      eff: 'Excelente impacto de la redefinición del síntoma.',
      notes: 'La paciente reporta que escribir en el diario de abordo redujo la duración de la crisis de 20 minutos a 5 minutos.',
      observationsNextSession: 'Profundizar en la maniobra del "cómo empeorar" para bloquear el control voluntario.',
      situation: 'Estable con crisis de menor intensidad.',
      status: 'validado'
    },
    {
      id: 'session-1-2',
      patientId: 'patient-1',
      number: 2,
      date: '2026-08-17',
      phase: 'Intervención',
      protocol: 'Ataque de Pánico',
      dxOp: 'SPR Fóbico',
      px: ['Diario de abordo', 'WF 30 min'],
      f1: 'La fantasía del peor escenario: "Míralo a los ojos y el fantasma desaparecerá."',
      f2: 'Prescribir el síntoma en un horario fijo.',
      oss: 'Se prescribe la Peor Fantasía (Worry-Time / Wiggle Room) de 30 minutos diarios a las 18:00.',
      add: '80% - Dejó de hacer la peor fantasía un día por olvido.',
      rss: 'Mejoría significativa. Disminuyeron drásticamente las crisis espontáneas durante el día.',
      eff: 'La paradoja de la peor fantasía logró extinguir el miedo al miedo.',
      notes: 'Al colocarse voluntariamente en el peor escenario durante 30 minutos, la paciente reporta que le costaba sentir miedo y terminaba aburriéndose o relajándose.',
      observationsNextSession: 'Evaluar autonomía al salir sola a la calle sin pedir ayuda.',
      situation: 'Muy mejorada. Solo reporta un amago de crisis en la semana.',
      status: 'validado'
    }
  ]
};

export const mockLibrary: LibraryDocument[] = [
  {
    id: 'lib-1',
    title: 'Manual General TBE - Modelo Arezzo',
    category: 'manual',
    code: 'TBE-M-01',
    summary: 'Guía introductoria y bases teóricas de la Terapia Breve Estratégica creada por Giorgio Nardone. Fundamentos de la intervención sin diagnóstico nosológico tradicional.',
    content: 'El enfoque estratégico se caracteriza por una intervención activa, focalizada y orientada a la resolución de problemas específicos en un plazo breve. En lugar de indagar en las causas pasadas del síntoma, se concentra en el funcionamiento actual del problema y en cómo las soluciones intentadas por el sujeto para resolverlo terminan por mantenerlo o empeorarlo. Utiliza técnicas lógicas y no lógicas (paradojas, metáforas, prescripciones conductuales) para provocar un cambio perceptivo que reestructure el sistema de creencias y reacciones del paciente.'
  },
  {
    id: 'lib-2',
    title: 'Manual Trastorno Obsesivo Compulsivo TBE',
    category: 'manual',
    code: 'TBE-M-02',
    summary: 'Estructuración del tratamiento estratégico para TOC. Ritualizaciones basadas en el placer, la prevención de riesgos o la mitigación de la duda.',
    content: 'En el TOC, la solución intentada fundamental es la ejecución de rituales (mentales o conductuales) para aplacar la duda o prevenir un daño catastrófico. La maniobra clave consiste en orientar el ritual hacia la autodestrucción aplicando paradojas tales como: "Si lo haces una vez, debes hacerlo 5 veces", "Si lo evitas por completo, estás libre", o "Si te lavas, debes lavarte exactamente 10 veces de forma lenta". Esto reestructura la obligatoriedad del ritual y rompe la lógica obsesiva.'
  },
  {
    id: 'lib-3',
    title: 'Protocolo de Intervención: Ataque de Pánico',
    category: 'protocolo',
    code: 'TBE-P-01',
    summary: 'Fases, maniobras y condiciones del protocolo clínico estandarizado para crisis de pánico y agorafobia.',
    content: 'Protocolo Ataque de Pánico:\nFase 1: Socialización del síntoma y prescripción del Diario de a bordo. Bloqueo de la evitación y la petición de ayuda.\nFase 2: Introducción de la Peor Fantasía (Worry-Time / WF 30 min) en un horario específico diario para canalizar y agotar la carga ansiosa a través de la paradoja. Si se presenta una crisis espontánea fuera de horario, se aplica la Peor Fantasía preventivo-necesidad por 5 minutos.\nFase 3: Consolidación y autoprescripciones de exposición controlada progresiva.\nFase 4: Cierre del caso y seguimiento a 3, 6 y 12 meses.'
  },
  {
    id: 'lib-4',
    title: 'Protocolo: Miedo a perder el control tipo 1 (Hablar en público)',
    category: 'protocolo',
    code: 'TBE-P-02',
    summary: 'Maniobras y fases para el miedo escénico y bloqueo fóbico-social.',
    content: 'Maniobras clave:\n1. Declarar el secreto: El paciente debe decir abiertamente a su audiencia al inicio: "Les pido disculpas de antemano si tiemblo o me pongo rojo, ya que me genera mucha ansiedad hablar en público". Esto disuelve inmediatamente la lucha interna por ocultar la debilidad.\n2. Prescribir la sudoración o temblor voluntario por periodos cortos.'
  }
];

export const mockAIAnswers = {
  default: 'Con base en el Protocolo Clínico de BreveMente, se recomienda revisar las Soluciones Intentadas del paciente. En TBE, la solución intentada que mantiene el problema es el núcleo de la intervención. Esta respuesta proviene del corpus de manuales y requiere validación del profesional clínico.',
  panic: 'Con base en el **Protocolo Ataque de Pánico (Manual TBE, sección de intervención inicial)**, se sugiere revisar si el paciente mantiene soluciones intentadas activas como: 1. Evitación de situaciones, 2. Petición de ayuda/compañía, y 3. Control consciente de reacciones fisiológicas (respirar profundo, tomar el pulso). Si estas soluciones persisten, se prescribe el *Diario de a bordo* para bloquear la monitorización del síntoma y registrar la crisis sin intentar controlarla. **Esta sugerencia requiere validación y criterio clínico del profesional responsable.**',
  ocd: 'De acuerdo con el **Manual de Trastorno Obsesivo Compulsivo (TBE-M-02)**, ante rituales de verificación (ej. revisar la estufa o llaves múltiples veces), se prescribe la maniobra de la *Violación del Ritual* o la *Paradoja del número de repeticiones*: "Si lo haces una vez para estar seguro, debes hacerlo exactamente 5 veces de forma obligatoria". Si no estás dispuesto a hacerlo 5 veces, no debes hacerlo ninguna. **Esta prescripción es una sugerencia técnica que debe ajustarse a las particularidades del caso por el clínico.**',
  risk: '⚠️ **ALERTA DE SEGURIDAD CLÍNICA:** Se han detectado términos asociados a riesgo clínico elevado (ideación autolesiva o crisis severa fuera de rango). Se activa el protocolo de seguridad. El sistema sugiere desplegar el banner de escalamiento y notificar inmediatamente al supervisor clínico responsable.'
};
