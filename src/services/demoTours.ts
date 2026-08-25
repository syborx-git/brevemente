export interface DemoStep {
  stepIndex: number;
  route: string;
  targetSelector: string;
  title: string;
  explanation: string;
  benefit: string;
}

export const EXECUTIVE_TOUR: DemoStep[] = [
  {
    stepIndex: 1,
    route: '/',
    targetSelector: '[data-tour="dashboard-kpis"]',
    title: 'Estado General Operativo',
    explanation: 'El Centro de Control simplificado muestra de un vistazo el estado general: citas de hoy, pacientes activos, pendientes clínicos y alertas críticas sin saturación.',
    benefit: 'Visualización clara e inmediata de la operación.'
  },
  {
    stepIndex: 2,
    route: '/',
    targetSelector: '[data-tour="dashboard-next-action"]',
    title: 'Próxima Acción Dominante',
    explanation: 'La próxima consulta representa la prioridad visual absoluta del Centro de Control, facilitando la preparación inmediata de la sesión y estados de admisión (intake/consentimientos).',
    benefit: 'Focalización total y ahorro de tiempo operativo.'
  },
  {
    stepIndex: 3,
    route: '/mi-consulta',
    targetSelector: '[data-tour="mi-consulta-main"]',
    title: 'Mi Consulta (Superficie de Trabajo)',
    explanation: 'Es el área operativa personal del clínico. Concentra agenda del día, próxima sesión, pacientes a su cargo, alertas específicas y notas pendientes de redactar.',
    benefit: 'Superficie de productividad diaria adaptada al rol clínico.'
  },
  {
    stepIndex: 4,
    route: '/agenda',
    targetSelector: '[data-tour="calendar-view"]',
    title: 'Calendario y Agenda Completa',
    explanation: 'Visualiza la agenda de la clínica por vistas (mes/semana/día), permitiendo programar nuevas citas y revisar estados de intake y consentimientos.',
    benefit: 'Organización central de la agenda de la clínica.'
  },
  {
    stepIndex: 5,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="clinical-record-tabs"]',
    title: 'Expediente Clínico y Fases TBE',
    explanation: 'Muestra la ficha clínica de la Terapia Breve Estratégica, con diagnóstico operativo, fases de intervención y evolución detallada.',
    benefit: 'Fidelidad total al modelo científico de Arezzo.'
  },
  {
    stepIndex: 6,
    route: '/senda',
    targetSelector: '[data-tour="senda-assistant-chat"]',
    title: 'Senda - Inteligencia asistiva',
    explanation: 'Asistente IA integrado para consultas de manuales de intervención, redacción de notas y asistencia clínica en tiempo real.',
    benefit: 'Soporte cognitivo seguro y con revisión 100% humana.'
  },
  {
    stepIndex: 7,
    route: '/supervision',
    targetSelector: '[data-tour="supervision-workspace"]',
    title: 'Workspace de Supervisión',
    explanation: 'Sección dedicada para que el supervisor o coordinador evalúe el desempeño del terapeuta, audite grabaciones y autorice planes de mejora.',
    benefit: 'Control de calidad y cumplimiento normativo estricto.'
  },
  {
    stepIndex: 8,
    route: '/campus',
    targetSelector: '[data-tour="dashboard-academico"]',
    title: 'Campus Académico y LMS',
    explanation: 'Espacio de formación continua: cursos, simulaciones interactivas de casos con Senda, evaluaciones con rúbricas y certificados QR.',
    benefit: 'Capacitación continua integrada en el flujo de trabajo.'
  },
  {
    stepIndex: 9,
    route: '/desempeno',
    targetSelector: '[data-tour="mi-desarrollo-tabs"]',
    title: 'Resultados Clínicos y Desarrollo',
    explanation: 'Mapea las competencias en un radar de desarrollo profesional del terapeuta y sus resultados clínicos agregados de éxito terapéutico.',
    benefit: 'Autoevaluación continua del profesional de la salud.'
  },
  {
    stepIndex: 10,
    route: '/',
    targetSelector: '[data-tour="dashboard-header"]',
    title: 'Cierre y Valor de BreveMente',
    explanation: 'BreveMente conecta la atención de pacientes, la formación del personal y el control de calidad científico en una sola infraestructura comercial.',
    benefit: 'La herramienta comercial y clínica definitiva para salud mental.'
  }
];

export const CLINICAL_TOUR: DemoStep[] = [
  {
    stepIndex: 1,
    route: '/',
    targetSelector: '[data-tour="dashboard-kpis"]',
    title: 'Dashboard de Operación Clínica',
    explanation: 'Monitorea pacientes del día, estados de expedientes e indicadores generales de adherencia y resolución de casos.',
    benefit: 'Resumen operativo inmediato al iniciar el día.'
  },
  {
    stepIndex: 2,
    route: '/',
    targetSelector: '[data-tour="demo-roles"]',
    title: 'Roles de Consulta y Permisos',
    explanation: 'Demuestra la segregación de funciones: el asistente programa citas, el terapeuta atiende, el supervisor audita y el paciente solo ve su portal.',
    benefit: 'Seguridad basada en roles y confidencialidad estricta.'
  },
  {
    stepIndex: 3,
    route: '/agenda',
    targetSelector: '[data-tour="calendar-view"]',
    title: 'Agenda Semanal y Filtros',
    explanation: 'Consulta la disponibilidad horaria (08:00 - 20:00). Muestra indicadores de consentimiento e historias clínicas pendientes.',
    benefit: 'Organización central de la agenda de la clínica.'
  },
  {
    stepIndex: 4,
    route: '/agenda',
    targetSelector: '[data-tour="agenda-carlos-mendoza"]',
    title: 'Selección de Consulta (Carlos Mendoza)',
    explanation: 'Seleccionamos la primera consulta de Carlos Mendoza. El sistema de la agenda soporta intervalos de media hora a las 11:30.',
    benefit: 'Identificación clara del estatus de admisión del paciente.'
  },
  {
    stepIndex: 5,
    route: '/agenda',
    targetSelector: '[data-tour="whatsapp-simulation-btn"]',
    title: 'Simulación de WhatsApp e Intake',
    explanation: 'Haz click en "Llenar Intake" para simular el portal que abre el paciente en su teléfono para firmar y consentir.',
    benefit: 'Automatiza la admisión sin papeleos.'
  },
  {
    stepIndex: 6,
    route: '/intake?id=patient-2',
    targetSelector: 'form',
    title: 'Portal del Paciente: Consentimiento',
    explanation: 'El paciente completa sus datos clínicos iniciales y firma digitalmente autorizando el resguardo y la grabación con Senda.',
    benefit: 'Garantía jurídica y autorización del modo de expediente (IA vs Manual).'
  },
  {
    stepIndex: 7,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="clinical-record-tabs"]',
    title: 'Expediente Clínico TBE',
    explanation: 'Entramos al expediente de Sofía Martínez para iniciar la sesión. Muestra el diagnóstico estratégico y el trastorno de Ataque de Pánico.',
    benefit: 'Fidelidad al modelo de Terapia Breve Estratégica.'
  },
  {
    stepIndex: 8,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="session-history-box"]',
    title: 'Creación de Nueva Sesión',
    explanation: 'Inicia el registro clínico de la Sesión 3. Permite elegir llenado con grabación de audio asistida por Senda o llenado manual.',
    benefit: 'Flexibilidad de registro adaptado a la preferencia del paciente.'
  },
  {
    stepIndex: 9,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="recording-mic-box"]',
    title: 'Grabación de Audio e IA',
    explanation: 'Simula la grabación del audio de la sesión y presiona "IA rellena expediente". Senda transcribirá e identificará protocolos.',
    benefit: 'Reducción del 70% en tiempos de redacción de notas.'
  },
  {
    stepIndex: 10,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="brifi-widget"]',
    title: 'Consulta Contextual de Senda',
    explanation: 'Abre el panel lateral de Senda para buscar el protocolo de Ataque de Pánico sin abandonar tu formulario.',
    benefit: 'Soporte clínico en tiempo real en el punto de atención.'
  },
  {
    stepIndex: 11,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="brifi-ai-suggestion"]',
    title: 'Validación e Inserción de Borrador',
    explanation: 'Senda sugiere intervenciones y cita manuales. El clínico valida y presiona "Aceptar e insertar" para inyectar la nota como borrador.',
    benefit: 'Combina eficiencia digital y supervisión humana del especialista.'
  },
  {
    stepIndex: 12,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="save-session-btn"]',
    title: 'Registro de Nota y Tareas',
    explanation: 'El terapeuta edita y presiona "Validar y Guardar Sesión", registrando la intervención y las tareas terapéuticas (Diario de abordo).',
    benefit: 'Consistencia metodológica e histórica del caso.'
  },
  {
    stepIndex: 13,
    route: '/expedientes?id=patient-1',
    targetSelector: '[data-tour="clinical-evolution"]',
    title: 'Gráficas de Evolución (VC y VG)',
    explanation: 'Revisa las gráficas dinámicas de Valoración del Cambio y Valoración Global (Yo/Demás/Mundo) para medir el avance científico.',
    benefit: 'Evidencia matemática de la mejoría clínica.'
  },
  {
    stepIndex: 14,
    route: '/auditoria',
    targetSelector: '[data-tour="audit-log-table"]',
    title: 'Historial de Auditoría de Sesión',
    explanation: 'Verifica la bitácora de auditoría: cada cambio de datos y la inserción de IA han quedado registrados con fecha y hora.',
    benefit: 'Cumplimiento normativo del resguardo clínico.'
  },
  {
    stepIndex: 15,
    route: '/',
    targetSelector: '[data-tour="dashboard-kpis"]',
    title: 'Fin del Recorrido Clínico',
    explanation: 'Has completado el ciclo clínico del paciente: admisión, consentimiento, sesión asistida, consulta de protocolo y auditoría.',
    benefit: 'Terapia Breve Estratégica potenciada con Inteligencia Artificial Segura.'
  }
];

export const ACADEMIC_TOUR: DemoStep[] = [
  {
    stepIndex: 1,
    route: '/campus',
    targetSelector: '[data-tour="dashboard-academico"]',
    title: 'Dashboard del Campus Académico',
    explanation: 'El portal formativo consolida el perfil académico del alumno, el diplomado en curso, sus calificaciones, horas acumuladas e informes de retroalimentación recibidos.',
    benefit: 'Control centralizado del avance y la evaluación del terapeuta.'
  },
  {
    stepIndex: 2,
    route: '/campus',
    targetSelector: '[data-tour="campus-cohortes"]',
    title: 'Gestión de Cohortes y Calificaciones',
    explanation: 'Permite simular grupos académicos reales, como la Cohorte Agosto 2026 del Diplomado en TBE, mostrando listados de asistencia, promedios y actas exportables.',
    benefit: 'Gestión ágil para coordinadores académicos y clínicas.'
  },
  {
    stepIndex: 3,
    route: '/campus',
    targetSelector: '[data-tour="ruta-curricular"]',
    title: 'Ruta Curricular y Aprendizaje',
    explanation: 'Estructuración modular de la formación por etapas lógicas: desde fundamentos y SPR, hasta la práctica simulada y evaluación presencial.',
    benefit: 'Secuencia pedagógica rigurosa y ordenada.'
  },
  {
    stepIndex: 4,
    route: '/campus',
    targetSelector: '[data-tour="simulador-ia"]',
    title: 'Simulador Clínico con IA (Senda)',
    explanation: 'Los alumnos pueden entrenar diálogos estratégicos interactivos contra casos simulados virtuales (Ataques de Pánico, TOC, Fobia) con Senda.',
    benefit: 'Capacitación segura en un entorno clínico sin riesgos.'
  },
  {
    stepIndex: 5,
    route: '/campus',
    targetSelector: '[data-tour="simulador-ia"]',
    title: 'Rúbricas de Evaluación del Simulador',
    explanation: 'Senda actúa como evaluador al concluir el ejercicio, emitiendo una calificación objetiva basada en la adhesión a las maniobras de Arezzo.',
    benefit: 'Medición de aptitudes con rúbrica automatizada y oportuna.'
  },
  {
    stepIndex: 6,
    route: '/desempeno',
    targetSelector: '[data-tour="mi-desarrollo-tabs"]',
    title: 'Mi Desarrollo Profesional (Radar)',
    explanation: 'Mapea las competencias en un radar de 10 dimensiones, contrastando la evaluación de admisión, el nivel actual y el estándar esperado.',
    benefit: 'Autoevaluación continua del profesional de la salud.'
  },
  {
    stepIndex: 7,
    route: '/supervision',
    targetSelector: '[data-tour="supervision-workspace"]',
    title: 'Workspace de Supervisión Clínica',
    explanation: 'Espacio dedicado donde el supervisor audita expedientes, documenta dudas técnicas y emite planes de reestructuración.',
    benefit: 'Garantiza el acompañamiento clínico constante.'
  },
  {
    stepIndex: 8,
    route: '/supervision',
    targetSelector: '[data-tour="supervision-recording"]',
    title: 'Auditoría de Sesiones Grabadas',
    explanation: 'El supervisor puede revisar audios y transcripciones con anotaciones ancladas al minuto y segundo exacto de la sesión.',
    benefit: 'Identificación directa de aciertos, riesgos y desviaciones.'
  },
  {
    stepIndex: 9,
    route: '/desempeno',
    targetSelector: '[data-tour="mi-desarrollo-tabs"]',
    title: 'Gestión de Desviaciones de Protocolo',
    explanation: 'Monitorea alertas de calidad si un terapeuta modifica la prescripción literal del manual de Arezzo (por ejemplo, reducir el tiempo de la peor fantasía).',
    benefit: 'Asegura la efectividad científica de la terapia.'
  },
  {
    stepIndex: 10,
    route: '/campus',
    targetSelector: '[data-tour="campus-certificados"]',
    title: 'Certificados Digitales Verificables',
    explanation: 'Folio digital inmutable con código QR de validación que acredita las competencias aprobadas por el alumno o terapeuta.',
    benefit: 'Respaldo curricular verificable ante instituciones reguladoras.'
  },
  {
    stepIndex: 11,
    route: '/campus',
    targetSelector: '[data-tour="dashboard-academico"]',
    title: 'Capacitación del Personal de la Clínica',
    explanation: 'Los directores pueden crear programas de cumplimiento interno en privacidad (HIPAA), consentimiento seguro y uso ético de la IA Senda.',
    benefit: 'Monitoreo de asistencia y cumplimiento institucional.'
  },
  {
    stepIndex: 12,
    route: '/campus',
    targetSelector: '[data-tour="dashboard-academico"]',
    title: '¡Recorrido de Formación Completado!',
    explanation: 'BreveMente unifica la atención de salud mental, el control de calidad por supervisión y la formación académica en una sola suite comercial.',
    benefit: 'El prototipo comercial más completo para el mercado clínico.'
  }
];
