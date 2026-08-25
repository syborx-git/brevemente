import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, PlayCircle, Award, ShieldAlert, CheckCircle, 
  HelpCircle, ChevronRight, UserCheck, AlertTriangle, FileText, Send, 
  Search, Check, RefreshCw, Layers, Sliders, Calendar, Play 
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { Role } from '../types/clinical';
import { InternalClinicTraining } from '../types/academic';
import { Logo } from '../components/Logo';
import { auditLogService } from '../services/auditLogService';
import { 
  mockStudentProfile, mockPrograms, mockStudentsList, mockCurricularModules, 
  mockSimulatedCases, mockAcademicFeedback, mockQualityAlerts, mockCertificates, 
  mockClinicTrainings 
} from '../services/academicData';

interface CampusProps {
  userRole: Role;
  userName: string;
}

export const Campus: React.FC<CampusProps> = ({ userRole, userName }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ruta' | 'simulador' | 'cohortes' | 'alertas' | 'certificados'>('dashboard');

  // Ajustar tab activa si el rol no tiene permisos de cohorte
  useEffect(() => {
    if (userRole === 'student' && (activeTab === 'cohortes' || activeTab === 'alertas')) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  // --- ESTADOS SIMULADOR CLINICO ---
  const [selectedCaseId, setSelectedCaseId] = useState('sim-1');
  const [difficulty, setDifficulty] = useState<'fácil' | 'medio' | 'difícil'>('fácil');
  const [simStep, setSimStep] = useState<'intro' | 'chat' | 'diagnosis' | 'protocol' | 'result'>('intro');
  const [chatRound, setChatRound] = useState(1);
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [selectedManiobra, setSelectedManiobra] = useState('');
  const [discoveredSolutions, setDiscoveredSolutions] = useState<string[]>([]);
  const [simLog, setSimLog] = useState<Array<{ sender: 'patient' | 'therapist'; text: string }>>([]);

  const activeCase = mockSimulatedCases.find(c => c.id === selectedCaseId) || mockSimulatedCases[0];

  // Opciones de diálogo múltiples por caso y ronda
  const dialogueOptions: Record<string, Record<number, Array<{ text: string; nextText: string; solIndex?: number }>>> = {
    'sim-1': { // Marta (Pánico)
      1: [
        { text: '¿Me puedes decir desde cuándo empezaste a sentir este temor de salir de casa?', nextText: 'Todo empezó hace tres meses, después de que mi compañera de trabajo tuvo un infarto en el metro. Desde ese día no puedo subirme al vagón sin sentir que me asfixio.' },
        { text: '¿Y qué haces cuando sientes que te vas a desmayar?', nextText: 'De inmediato llamo a mi esposo para que vaya por mí, o simplemente me bajo en la primera estación y pido un taxi. No puedo estar sola.', solIndex: 0 },
        { text: 'Dime, ¿has ido al médico general para descartar un problema del corazón?', nextText: 'Sí, fui a urgencias dos veces. Me hicieron electrocardiogramas y me dijeron que físicamente estoy perfecta, que es solo ansiedad. Pero yo no les creo, siento que mi corazón va a estallar.' }
      ],
      2: [
        { text: '¿Has intentado usar algún medicamento o amuleto para sentirte segura?', nextText: 'Tengo unas gotas de valeriana y una pastilla de clonazepam en mi bolso todo el tiempo. Aunque casi nunca me la tomo, con solo saber que está ahí me tranquilizo un poco.', solIndex: 2 },
        { text: '¿Qué pasaría si te obligaras a permanecer en el metro cuando viene el miedo?', nextText: '¡Me volvería loca! Siento que perdería el control por completo, gritaría o me desmayaría en el piso. Prefiero evitar el metro por completo.', solIndex: 1 },
        { text: 'Cuando pides ayuda a tus familiares, ¿cómo reaccionan ellos?', nextText: 'Al principio me apoyaban y venían por mí, pero ahora se sienten cansados. Mi esposo dice que tengo que echarle ganas, lo cual me hace sentir más culpable y asustada.' }
      ],
      3: [
        { text: 'Entiendo. O sea que el esfuerzo por controlar tu respiración y evitar el metro es lo que incrementa el pánico.', nextText: 'Sí, exactamente. Cuanto más intento calmarme y respirar despacio, más me ahogo y más rápido late mi corazón.' },
        { text: '¿Consideras que pedir ayuda a los demás te hace sentir protegida pero al mismo tiempo confirma que no puedes sola?', nextText: 'Sí... cada vez que llamo a mi esposo me siento a salvo, pero luego me da una tristeza enorme porque siento que soy una inútil que depende de otros.', solIndex: 0 },
        { text: 'Vamos a intentar un ejercicio simple esta semana. Quiero que evites salir del todo.', nextText: '¿De verdad? Pero si lo que quiero es salir y hacer mi vida... aunque bueno, si usted lo dice, me da algo de alivio no tener que obligarme.' }
      ]
    },
    'sim-5': { // Roberto (Riesgo)
      1: [
        { text: 'Hola Roberto. Cuéntame qué te trae por aquí hoy.', nextText: 'La verdad es que vine porque mi hermana insistió. Yo siento que ya no tiene caso. Todo es un esfuerzo inútil y estoy muy cansado de todo.' },
        { text: '¿A qué te refieres con que ya no tiene caso?', nextText: 'A nada en específico. A trabajar, a levantarme... a estar aquí. Siento que he terminado mi ciclo y que solo estorbo a mi familia.' },
        { text: 'Roberto, ¿has estado pensando en hacerte daño o terminar con tu vida?', nextText: 'A veces creo que sería la solución más limpia. Todo el mundo estaría más tranquilo y yo descansaría de este dolor.', solIndex: 0 }
      ],
      2: [
        { text: '¿Hay algún plan concreto que hayas elaborado para esto?', nextText: 'He estado juntando mis medicamentos para dormir. Ya los ordené en mi cajón. Solo estoy esperando el momento en que mi familia salga de viaje el próximo fin de semana.', solIndex: 1 },
        { text: '¿Por qué crees que eres un estorbo para ellos?', nextText: 'Desde que perdí el empleo no aporto nada. Solo me ven acostado, triste. Se preocupan y gastan en mí. Sería un alivio para todos que yo ya no estuviera.' },
        { text: 'Entiendo que estés triste, pero debes pensar en las cosas positivas que tienes.', nextText: 'Sé que lo dice para animarme, pero cuando estás en este pozo no hay nada positivo. Todo es gris y pesado.' }
      ],
      3: [
        { text: 'Roberto, esto es una situación grave. Debo llamar a tu hermana inmediatamente y activar un protocolo de resguardo.', nextText: 'Por favor, no lo haga. Si les dice se van a asustar más y me van a vigilar todo el tiempo. Déjeme resolverlo a mi manera.' },
        { text: '¿Hay alguien en quien confíes plenamente para acompañarte hoy al salir de la sesión?', nextText: 'Solo mi hermana. Ella me trajo y me está esperando en la sala de estar.' },
        { text: 'Activo inmediatamente el protocolo de crisis y contacto al supervisor clínico en turno.', nextText: 'Está bien. Si es necesario, que venga mi hermana. Ya no tengo fuerzas para discutir.', solIndex: 2 }
      ]
    }
  };

  // --- DATOS RADAR DE COMPETENCIAS ---
  const competencyRadarData = [
    { subject: 'Ev. Estratégica', A: 9, B: 6, fullMark: 10 },
    { subject: 'Diálogo Estratégico', A: 7, B: 5, fullMark: 10 },
    { subject: 'Protocolos', A: 9, B: 8, fullMark: 10 },
    { subject: 'Prescripciones', A: 8, B: 7, fullMark: 10 },
    { subject: 'Reestructuración', A: 7, B: 5, fullMark: 10 },
    { subject: 'Riesgo Clínico', A: 10, B: 8, fullMark: 10 },
    { subject: 'Documentación', A: 8, B: 7, fullMark: 10 },
    { subject: 'Ética y Privacidad', A: 9, B: 8, fullMark: 10 }
  ];

  // Iniciar Simulación
  const handleStartSimulation = () => {
    setSimStep('chat');
    setChatRound(1);
    setDiscoveredSolutions([]);
    setSimLog([{ sender: 'patient', text: activeCase.initialClues }]);
    
    auditLogService.addLog(
      'Simulador clínico iniciado',
      `Inició simulación interactiva con el caso: ${activeCase.name}`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  // Enviar pregunta en el simulador
  const handleSelectOption = (optionText: string, nextText: string, solIndex?: number) => {
    // Agregar diálogo al historial
    const newLog = [
      ...simLog,
      { sender: 'therapist' as const, text: optionText },
      { sender: 'patient' as const, text: nextText }
    ];
    setSimLog(newLog);

    if (solIndex !== undefined) {
      const sol = activeCase.solutionAttempts[solIndex];
      if (sol && !discoveredSolutions.includes(sol)) {
        setDiscoveredSolutions([...discoveredSolutions, sol]);
      }
    }

    if (chatRound < 3) {
      setChatRound(prev => prev + 1);
    } else {
      setSimStep('diagnosis');
    }
  };

  const handleFinishSimulation = () => {
    setSimStep('result');
    
    // Registrar auditoría de simulación
    auditLogService.addLog(
      'Simulación clínica completada',
      `Completó práctica interactiva de simulación de paciente para: ${activeCase.name}. Calificación de Senda emitida.`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  // --- CAPACITACIÓN INTERNA MOCKS ---
  const [internalTrainings, setInternalTrainings] = useState(mockClinicTrainings);
  const [showCreateTrainingModal, setShowCreateTrainingModal] = useState(false);
  const [newTrainingTitle, setNewTrainingTitle] = useState('');
  const [newTrainingAudience, setNewTrainingAudience] = useState<Role[]>(['therapist']);
  const [newTrainingLimit, setNewTrainingLimit] = useState('2026-09-30');

  const handleCreateTraining = (e: React.FormEvent) => {
    e.preventDefault();
    const newTraining: InternalClinicTraining = {
      id: `ct-${Date.now()}`,
      title: newTrainingTitle,
      targetAudience: newTrainingAudience,
      limitDate: newTrainingLimit,
      modulesCount: 4,
      studentsRegistered: 12,
      progressPercent: 0,
      status: 'activo'
    };
    setInternalTrainings([...internalTrainings, newTraining]);
    setShowCreateTrainingModal(false);
    setNewTrainingTitle('');
    
    // Registrar en auditoría
    auditLogService.addLog(
      'Capacitación interna creada',
      `Creó programa de capacitación clínica: "${newTrainingTitle}" para roles específicos.`,
      'seguridad',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('✓ Capacitación interna asignada con éxito al personal.');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Campus */}
      <div className="bg-clinical-dark p-6 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow relative overflow-hidden">
        {/* Isotipo cerebral decorativo */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 text-white select-none pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-80 h-80 fill-current">
            <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" />
          </svg>
        </div>

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="bg-clinical-accent p-2.5 rounded-xl border border-[#75AFBC]/30 text-white shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider block">Área de Formación y Calidad</span>
            <h2 className="text-xl font-extrabold tracking-wide">Campus BreveMente</h2>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              Capacitación de personal, supervisión técnica, simulaciones con IA y certificaciones oficiales.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <span className="text-xs font-semibold text-slate-300">Rol Educativo Activo:</span>
          <span className="px-3 py-1 bg-clinical-accent text-white border border-[#75AFBC]/30 rounded-lg text-xs font-bold uppercase">
            {userRole === 'student' ? 'Alumno' : userRole === 'academic_coordinator' ? 'Coordinador Académico' : userRole === 'supervisor' ? 'Supervisor Clínico' : userRole.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs de Navegación del Campus */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-500 overflow-x-auto shrink-0 select-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Mi Dashboard
        </button>
        <button
          onClick={() => setActiveTab('ruta')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'ruta' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Ruta Curricular
        </button>
        {['student', 'therapist', 'supervisor'].includes(userRole) && (
          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'simulador' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
          >
            Simulador Clínico con Senda
          </button>
        )}
        {['admin_platform', 'admin_clinical', 'academic_coordinator', 'supervisor'].includes(userRole) && (
          <button
            onClick={() => setActiveTab('cohortes')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'cohortes' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
          >
            Cohortes y Programas
          </button>
        )}
        {['admin_platform', 'admin_clinical', 'academic_coordinator', 'supervisor'].includes(userRole) && (
          <button
            onClick={() => setActiveTab('alertas')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'alertas' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
          >
            Alertas de Calidad
          </button>
        )}
        <button
          onClick={() => setActiveTab('certificados')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'certificados' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Certificaciones
        </button>
      </div>

      {/* --- RENDER TAB CONTENIDO --- */}

      {/* TAB 1: DASHBOARD ACADÉMICO / ALUMNO */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="dashboard-academico">
          {/* Ficha Perfil Académico Izquierda */}
          <div className="space-y-6">
            {/* Tarjeta Perfil */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-clinical-accent/10 border border-clinical-accent/30 flex items-center justify-center text-clinical-accent font-extrabold text-lg shrink-0">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-clinical-dark leading-none">{userName}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">Expediente Académico #77651</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Diplomado Activo:</span>
                  <span className="text-clinical-dark text-xs block mt-0.5">{mockStudentProfile.diplomado}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Próxima Actividad Obligatoria:</span>
                  <span className="text-clinical-dark text-xs block mt-0.5 text-clinical-teal">{mockStudentProfile.nextActivity}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 uppercase">Avance Curricular</span>
                  <span className="text-clinical-accent">{mockStudentProfile.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-clinical-accent h-full transition-all" style={{ width: `${mockStudentProfile.progressPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Tarjeta Competencias Radar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide">Mapa de Competencias Clínicas</span>
                <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded text-[9px] font-bold text-clinical-teal">TBE</span>
              </div>
              <div className="h-56 text-[8px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <Radar name="Evaluación Inicial" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                    <Radar name="Evaluación Actual" dataKey="A" stroke="#75AFBC" fill="#75AFBC" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Avisos y Módulos Centro */}
          <div className="lg:col-span-2 space-y-6">
            {/* Grid Métricas Académicas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">G.P.A / Calificación</span>
                <span className="text-2xl font-extrabold text-clinical-dark block mt-1">{mockStudentProfile.gpa}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Promedio acumulado</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Horas Formación</span>
                <span className="text-2xl font-extrabold text-clinical-teal block mt-1">{mockStudentProfile.trainingHours} hrs</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">90 de 120 requeridas</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Módulos Aprobados</span>
                <span className="text-2xl font-extrabold text-clinical-accent block mt-1">{mockStudentProfile.completedModulesCount} / 8</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">En diplomado activo</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Estatus Grado</span>
                <span className="text-sm font-extrabold bg-blue-50 border border-blue-200 text-clinical-dark px-2.5 py-1.5 rounded-lg inline-block mt-2">
                  EN CURSO
                </span>
              </div>
            </div>

            {/* Avisos Coordinación */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-650">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide">Avisos del Coordinador Académico</span>
                <span className="text-[9px] text-slate-400 font-semibold">Última actualización: Hoy</span>
              </div>
              <div className="space-y-3.5 leading-normal">
                <div className="bg-slate-50 border-l-4 border-l-[#304768] p-3 rounded-r-xl">
                  <span className="font-bold text-clinical-dark block">📌 Obligatoriedad de Consentimiento Informado de Grabación</span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Recuerden que para la sesión final de evaluación práctica (Módulo 8), el expediente del paciente simulado o real debe contar con la firma digital de consentimiento de audio, de lo contrario la rúbrica se invalidará automáticamente.
                  </p>
                </div>
                <div className="bg-slate-50 border-l-4 border-l-[#75AFBC] p-3 rounded-r-xl">
                  <span className="font-bold text-clinical-dark block">📌 Prácticas Clínicas en el Simulador Senda</span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    El Simulador de Pacientes con IA ha sido actualizado con el caso "Roberto Valdés" que presenta factores de riesgo. Es indispensable que practiquen el protocolo de escalamiento clínico antes de su evaluación presencial.
                  </p>
                </div>
              </div>
            </div>

            {/* Última Retroalimentación Recibida */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs text-slate-600">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide block">Última Retroalimentación Recibida</span>
              <p className="italic bg-blue-50/50 p-4 border border-blue-100 rounded-xl leading-relaxed text-slate-700 font-medium">
                "{mockStudentProfile.lastFeedback}"
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>Evaluador: Dra. Isabel Cárdenas (Supervisora Clínica)</span>
                <span>Fecha: 20 de Agosto, 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RUTA CURRICULAR */}
      {activeTab === 'ruta' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-650" data-tour="ruta-curricular">
          <div>
            <h3 className="text-sm font-extrabold text-clinical-dark uppercase tracking-wide">Ruta Curricular y Contenidos Académicos</h3>
            <p className="text-slate-400 font-semibold mt-0.5">Sigue los módulos ordenados secuencialmente para cumplir los criterios de aprobación.</p>
          </div>

          <div className="space-y-4">
            {mockCurricularModules.map((mod, index) => {
              const isCompleted = mod.status === 'completado';
              const isInProgress = mod.status === 'en_progreso';
              const isLocked = mod.status === 'bloqueado';

              let borderClass = 'border-slate-200 bg-slate-50 opacity-60';
              let badgeColor = 'bg-slate-200 text-slate-500';
              if (isCompleted) {
                borderClass = 'border-emerald-200 bg-emerald-50/20';
                badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              } else if (isInProgress) {
                borderClass = 'border-[#75AFBC] bg-white ring-1 ring-[#75AFBC]';
                badgeColor = 'bg-blue-100 text-clinical-dark border-blue-200';
              }

              return (
                <div key={mod.id} className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderClass}`}>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-clinical-dark text-xs">{mod.title}</span>
                      <span className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase ${badgeColor}`}>
                        {mod.type.toUpperCase()} • {mod.duration}
                      </span>
                    </div>
                    <p className="text-slate-600 font-semibold leading-normal">{mod.description}</p>
                    {mod.approvalCriteria && (
                      <span className="text-[10px] text-slate-450 block font-bold">
                        Criterio de aprobación: <span className="italic text-slate-600 font-semibold">{mod.approvalCriteria}</span>
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        Completado
                      </div>
                    )}
                    {isInProgress && (
                      <button 
                        onClick={() => {
                          if (mod.id === 'm6') {
                            setActiveTab('simulador');
                          } else {
                            alert('Abriendo recursos del módulo...');
                          }
                        }}
                        className="px-4 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold shadow transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Iniciar
                      </button>
                    )}
                    {isLocked && (
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        🔒 Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SIMULADOR CLÍNICO CON SENDA */}
      {activeTab === 'simulador' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-655" data-tour="simulador-ia">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-clinical-dark uppercase tracking-wide flex items-center gap-1.5">
                <PlayCircle className="w-5 h-5 text-clinical-teal" />
                Simulador Clínico con IA (Senda)
              </h3>
              <p className="text-slate-400 font-semibold mt-0.5">Practica tu diálogo estratégico y prescripción técnica contra un paciente simulado por IA.</p>
            </div>
            {simStep !== 'intro' && (
              <button
                onClick={() => {
                  if (confirm('¿Seguro que deseas abortar la simulación actual? Perderás el progreso de la evaluación.')) {
                    setSimStep('intro');
                  }
                }}
                className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-700 rounded-lg font-bold"
              >
                Abortar Práctica
              </button>
            )}
          </div>

          {/* 1. INTRO / CONFIGURACIÓN DEL CASO */}
          {simStep === 'intro' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              {/* Configuración */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-4">
                <span className="font-bold text-clinical-dark uppercase block border-b border-slate-200 pb-1.5">1. Configurar Simulación</span>
                
                <div>
                  <label className="block text-slate-450 font-bold mb-1">Seleccionar Caso Clínico:</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-semibold text-slate-700"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                  >
                    {mockSimulatedCases.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.difficulty.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-450 font-bold mb-1">Nivel de Dificultad Académica:</label>
                  <div className="flex bg-slate-200 p-0.5 rounded-lg text-center font-bold">
                    {['fácil', 'medio', 'difícil'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl as any)}
                        className={`flex-1 py-1 rounded text-[10px] capitalize transition-all ${difficulty === lvl ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-[11px] leading-normal text-slate-700 font-medium">
                  💡 **Regla del Simulador:** Senda actúa como el paciente durante el diálogo y no te dará pistas ni reestructurará por ti. Tu labor es descubrir el SPR y las Soluciones Intentadas mediante el Diálogo.
                </div>

                <button
                  onClick={handleStartSimulation}
                  className="w-full py-2 bg-clinical-teal hover:bg-clinical-tealHover text-white rounded-lg font-bold shadow transition-colors flex items-center justify-center gap-1 text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Iniciar Caso Clínico
                </button>
              </div>

              {/* Ficha del Caso */}
              <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-xl space-y-4">
                <span className="font-bold text-clinical-dark uppercase block border-b border-slate-100 pb-1.5">Ficha de Admisión del Paciente Simulado</span>
                
                <div className="space-y-3 font-semibold">
                  <div>
                    <span className="text-[10px] text-slate-450 block uppercase">Nombre / Avatar Simulador:</span>
                    <span className="text-clinical-dark text-xs font-extrabold">{activeCase.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block uppercase">Resumen de Admisión (Derivación):</span>
                    <p className="text-slate-600 text-xs mt-0.5 leading-normal font-medium">{activeCase.problem}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block uppercase">Información inicial revelada al terapeuta:</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-slate-700 mt-1 leading-normal italic font-medium">
                      "{activeCase.initialClues}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHAT DE SIMULACIÓN INTERACTIVA */}
          {simStep === 'chat' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn">
              {/* Historial de Chat (Izquierda) */}
              <div className="md:col-span-3 border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[50vh] bg-slate-50">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Ronda de Entrevista: {chatRound} de 3</span>
                  <span>Paciente: {activeCase.name}</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {simLog.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${chat.sender === 'therapist' ? 'bg-[#75AFBC] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                        <span className="text-[8px] font-bold block mb-0.5 text-slate-400 uppercase">{chat.sender === 'therapist' ? 'Tú (Terapeuta)' : 'Paciente'}</span>
                        <p className="font-semibold text-[11px]">{chat.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Opciones de Pregunta para el terapeuta */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
                  <span className="block font-bold text-slate-500 mb-1">Elige tu siguiente intervención (Diálogo Estratégico):</span>
                  <div className="space-y-2">
                    {(dialogueOptions[activeCase.id]?.[chatRound] || dialogueOptions['sim-1'][chatRound]).map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(opt.text, opt.nextText, opt.solIndex)}
                        className="w-full p-2.5 border border-slate-200 hover:border-clinical-teal bg-slate-50 hover:bg-white rounded-lg text-left transition-all text-[11px] font-semibold text-slate-700 hover:shadow-sm"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estatus e Información Descubierta (Derecha) */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-4 h-fit">
                <span className="font-bold text-clinical-dark uppercase block border-b border-slate-200 pb-1.5">Información Descubierta</span>
                
                <div className="space-y-3 font-semibold text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Soluciones Intentadas Redundantes:</span>
                    {discoveredSolutions.length === 0 ? (
                      <span className="text-slate-400 italic block mt-1">Ninguna identificada todavía en el diálogo...</span>
                    ) : (
                      <div className="space-y-1 mt-1">
                        {discoveredSolutions.map((sol, i) => (
                          <div key={i} className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate">{sol}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. DIAGNÓSTICO E INTERVENCIÓN (SELECCIÓN DE PROTOCOLO) */}
          {simStep === 'diagnosis' && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 max-w-2xl mx-auto animate-fadeIn">
              <div>
                <span className="font-bold text-clinical-dark uppercase block border-b border-slate-200 pb-1.5">2. Diagnóstico Estratégico e Intervención</span>
                <p className="text-slate-400 mt-1 font-semibold">Formula tu hipótesis perceptivo-reactiva y elige el protocolo formal.</p>
              </div>

              <div className="space-y-4">
                {/* 1. Protocolo */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Seleccionar Protocolo de Arezzo correspondiente:</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-semibold text-slate-700"
                    value={selectedProtocol}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                  >
                    <option value="">-- Elige el protocolo --</option>
                    <option value="TBE-P-01">TBE-P-01: Ataque de Pánico (Arezzo)</option>
                    <option value="TBE-M-02">TBE-M-02: TOC basado en Control</option>
                    <option value="TBE-F-03">TBE-F-03: Fobia Social y Pánico Escénico</option>
                    <option value="TBE-D-05">TBE-D-05: Trastorno Depresivo y Rendición</option>
                  </select>
                </div>

                {/* 2. Maniobra */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Prescribir Maniobra Técnica principal:</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-semibold text-slate-700"
                    value={selectedManiobra}
                    onChange={(e) => setSelectedManiobra(e.target.value)}
                  >
                    <option value="">-- Elige la maniobra --</option>
                    <option value="Peor Fantasía (Worry-Time)">La Peor Fantasía (30 min diarios)</option>
                    <option value="Diario de Abordo">Diario de Abordo (Registro de ataques)</option>
                    <option value="Ritual de bloqueo de control">Ritual del control paradojal (TOC)</option>
                    <option value="Pequeños temblores voluntarios">Pequeños temblores voluntarios (Fobia)</option>
                    <option value="Evitación de reproches">Bloqueo de reproches (Pareja)</option>
                  </select>
                </div>

                {/* 3. Paráfrasis de Cierre */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Redactar Paráfrasis Evocadora / Reestructuración de Cierre:</label>
                  <textarea
                    rows={3}
                    placeholder="Escribe tu paráfrasis..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none font-semibold text-slate-700"
                  />
                </div>

                <button
                  onClick={handleFinishSimulation}
                  disabled={!selectedProtocol || !selectedManiobra}
                  className="w-full py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold shadow transition-colors disabled:opacity-40"
                >
                  Finalizar Simulación y Obtener Evaluación Senda
                </button>
              </div>
            </div>
          )}

          {/* 4. RÚBRICA Y RETROALIMENTACIÓN EMITIDA POR IA */}
          {simStep === 'result' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow space-y-6 max-w-2xl mx-auto animate-scaleUp">
              {/* Header Rúbrica */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-clinical-teal" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Rúbrica Académica Simulador IA</span>
                    <h4 className="text-xs font-bold text-clinical-dark">Resultado del Caso: {activeCase.name}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-semibold block">Calificación Senda:</span>
                  <span className="text-2xl font-extrabold text-clinical-teal">9.0 / 10</span>
                </div>
              </div>

              {/* Dimensiones Calificadas */}
              <div className="space-y-3 font-semibold text-xs text-slate-655">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span>Identificación del problema (SPR)</span>
                  <span className="font-bold text-clinical-dark">9 / 10</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span>Soluciones Intentadas Redundantes</span>
                  <span className="font-bold text-clinical-dark">10 / 10</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span>Selección del Protocolo de Arezzo</span>
                  <span className="font-bold text-clinical-teal">10 / 10 (Fiel al manual)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span>Literalidad de la Prescripción Técnica</span>
                  <span className="font-bold text-clinical-dark">8 / 10</span>
                </div>
              </div>

              {/* Evaluación detallada */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 text-xs leading-normal">
                <div className="flex items-center gap-1.5 font-bold text-clinical-dark">
                  {/* Isotipo cerebral mini */}
                  <svg viewBox="0 0 100 100" fill="none" className="h-5 w-5 shrink-0 text-[#75AFBC] animate-pulse">
                    <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" fill="currentColor" fillOpacity="0.2" />
                    <path d="M50 20C33.4315 20 20 33.4315 20 50C20 62 28 72 38 77" stroke="#304768" strokeWidth="6" strokeLinecap="round" />
                    <path d="M50 20C66.5685 20 80 33.4315 80 50C80 62 72 72 62 77" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="6" fill="#304768" />
                  </svg>
                  <span>Evaluación Asistida Senda</span>
                </div>
                <p className="text-slate-700 font-semibold">
                  Has guiado la simulación con precisión. Lograste identificar la solución intentada dominante del paciente (petición de ayuda/demanda) en el segundo turno de diálogo y prescribiste la maniobra de la Peor Fantasía de forma canónica.
                </p>
                <div className="bg-white p-2.5 rounded border border-blue-150 text-[10px] text-slate-500 font-bold uppercase">
                  Área de Mejora: En la paráfrasis de cierre, intenta evocar más sensaciones físicas para incrementar la resonancia de la paradoja.
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setSimStep('intro')}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-650 hover:bg-slate-50"
                >
                  Volver al Simulador
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold shadow"
                >
                  Guardar en Expediente Académico
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COHORTES Y PROGRAMAS (VISTA ACADÉMICA / COORDINADOR) */}
      {activeTab === 'cohortes' && (
        <div className="space-y-6" data-tour="campus-cohortes">
          {/* Ficha Cohorte Diplomado */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-650 leading-relaxed">
            <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[9px] text-[#75AFBC] font-bold uppercase tracking-wider block">Diplomado Oficial Ficticio</span>
                <span className="font-extrabold text-clinical-dark text-sm block">Diplomado en Terapia Breve Estratégica</span>
              </div>
              <button 
                onClick={() => {
                  auditLogService.addLog(
                    'Exportar actas cohorte',
                    `Exportó acta oficial de calificaciones para la cohorte Agosto 2026.`,
                    'reporte',
                    { id: 'user-current', name: userName, role: userRole }
                  );
                  alert('✓ Acta oficial exportada en formato tabular (CSV/Excel).');
                }}
                className="px-3.5 py-1.5 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold shadow transition-colors flex items-center gap-1 shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                Exportar Acta de Cohorte
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center font-bold">
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Cohorte</span>
                <span className="text-clinical-dark text-xs mt-1 block">Agosto 2026</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Matrícula</span>
                <span className="text-clinical-teal text-xs mt-1 block">24 Alumnos</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Docentes</span>
                <span className="text-clinical-dark text-xs mt-1 block">4 Profesores</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Supervisores</span>
                <span className="text-clinical-accent text-xs mt-1 block">2 Clínicos</span>
              </div>
            </div>

            {/* Listado de Alumnos */}
            <div className="space-y-2.5">
              <span className="font-bold text-clinical-dark block uppercase tracking-wide">Listado de Calificaciones y Avances de Alumnos</span>
              <div className="overflow-x-auto border border-slate-150 rounded-lg">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="p-2.5">Alumno</th>
                      <th className="p-2.5 text-center">G.P.A / Promedio</th>
                      <th className="p-2.5 text-center">Progreso Curricular</th>
                      <th className="p-2.5 text-center">Estado Académico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                    {mockStudentsList.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-650 flex items-center justify-center font-bold text-[9px]">
                            {st.name.substring(0,2).toUpperCase()}
                          </div>
                          <span>{st.name}</span>
                        </td>
                        <td className="p-2.5 text-center text-clinical-dark font-extrabold">{st.gpa}</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                              <div className="bg-[#75AFBC] h-full" style={{ width: `${st.progress}%` }} />
                            </div>
                            <span>{st.progress}%</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${st.status === 'Aprobado' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-clinical-dark border border-blue-200'}`}>
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Capacitación del Personal Clínico */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-650">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <div>
                <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide block">Capacitación Interna de la Clínica</span>
                <span className="text-[10px] text-slate-400 font-semibold">Cursos obligatorios asignados al personal técnico.</span>
              </div>
              <button
                onClick={() => setShowCreateTrainingModal(true)}
                className="px-3 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold shadow-sm text-[11px]"
              >
                + Crear Capacitación
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {internalTrainings.map((ct) => (
                <div key={ct.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-semibold">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-clinical-dark text-xs block leading-tight">{ct.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${ct.status === 'activo' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
                      {ct.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[10px] text-slate-500">
                    <div>Audiencia: <span className="text-slate-700 font-bold uppercase">{ct.targetAudience.join(', ')}</span></div>
                    <div>Fecha límite de aprobación: <span className="text-slate-750 font-bold">{ct.limitDate}</span></div>
                    <div className="flex justify-between items-center mt-2.5">
                      <span>Avance de Cumplimiento:</span>
                      <span className="text-clinical-teal font-extrabold">{ct.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-clinical-teal h-full" style={{ width: `${ct.progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Crear Capacitación */}
          {showCreateTrainingModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-clinical-dark p-4 text-white flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wide">Crear Programa Interno de Capacitación</h3>
                  <button onClick={() => setShowCreateTrainingModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
                </div>
                <form onSubmit={handleCreateTraining} className="p-5 space-y-4 text-xs text-slate-600 font-semibold">
                  <div>
                    <label className="block text-slate-450 font-bold mb-1">Título de la capacitación:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Uso seguro de IA..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={newTrainingTitle}
                      onChange={(e) => setNewTrainingTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-450 font-bold mb-1">Fecha límite de aprobación:</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={newTrainingLimit}
                      onChange={(e) => setNewTrainingLimit(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateTrainingModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#75AFBC] text-white rounded-lg font-bold shadow"
                    >
                      Asignar Capacitación
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ALERTAS DE CALIDAD CLÍNICA */}
      {activeTab === 'alertas' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-655" data-tour="campus-alertas">
          <div>
            <h3 className="text-sm font-extrabold text-clinical-dark uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alertas de Calidad y Adherencia al Modelo
            </h3>
            <p className="text-slate-405 font-semibold mt-0.5">Alertas automáticas del sistema que requieren revisión técnica humana de coordinadores y supervisores.</p>
          </div>

          <div className="space-y-4 font-semibold text-slate-700">
            {mockQualityAlerts.map((qa) => {
              const isCritical = qa.severity === 'critica';
              const isHigh = qa.severity === 'alta';

              let cardBg = 'bg-slate-50 border-slate-250';
              let badgeColor = 'bg-slate-100 text-slate-600';
              if (isCritical) {
                cardBg = 'bg-red-50/20 border-red-200';
                badgeColor = 'bg-red-100 text-red-800 border-red-200 animate-pulse';
              } else if (isHigh) {
                cardBg = 'bg-amber-50/20 border-amber-200';
                badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
              }

              return (
                <div key={qa.id} className={`border rounded-xl p-4 leading-normal flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${cardBg}`}>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-clinical-dark text-xs">{qa.title}</span>
                      <span className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase ${badgeColor}`}>
                        Gravedad: {qa.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>Sujeto: <span className="text-clinical-dark font-bold">{qa.targetName}</span></div>
                    <p className="text-slate-600 font-semibold text-[11px] mt-1">{qa.details}</p>
                    <span className="text-[9px] text-slate-400 block font-bold mt-1">Registrado el: {qa.date}</span>
                  </div>

                  <div className="shrink-0 flex gap-1.5 sm:mt-1">
                    <button
                      onClick={() => alert('Abriendo expediente clínico para revisión humana. Toda acción auditada.')}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-white rounded font-bold text-[10px] text-slate-655 transition-colors shadow-sm"
                    >
                      Revisar Expediente
                    </button>
                    <button
                      onClick={() => alert('Abriendo agenda del supervisor para programar sesión urgente.')}
                      className="px-3 py-1.5 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded font-bold text-[10px] transition-colors shadow-sm"
                    >
                      Programar Supervisión
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: CERTIFICACIONES VERIFICABLES */}
      {activeTab === 'certificados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-tour="campus-certificados">
          {mockCertificates.map((cert) => (
            <div key={cert.folio} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden font-semibold text-xs text-slate-600 leading-normal gap-4">
              {/* Sello de fondo decorativo */}
              <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-5 text-clinical-dark select-none pointer-events-none">
                <Award className="w-40 h-40" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-[#75AFBC] font-bold block uppercase tracking-wider">Certificado Digital Verificable</span>
                    <span className="font-extrabold text-clinical-dark text-xs block leading-tight">{cert.programName}</span>
                  </div>
                  <Award className="w-8 h-8 text-[#75AFBC] shrink-0" />
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div>Acreditado a: <span className="text-clinical-dark font-extrabold">{cert.studentName}</span></div>
                  <div>Folio oficial: <span className="font-bold text-slate-800">{cert.folio}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>Emisión: <b>{cert.issueDate}</b></div>
                    <div>Vigencia: <b>{cert.expiryDate}</b></div>
                  </div>
                  <div>Emisor: <span className="text-[10px] font-bold text-slate-500 block uppercase">{cert.institution}</span></div>
                </div>
              </div>

              {/* QR Mock y Verificación */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 shrink-0">
                {/* QR ficticio en SVG */}
                <div className="w-12 h-12 border border-slate-300 p-0.5 rounded bg-white shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-800">
                    <rect x="10" y="10" width="20" height="20" />
                    <rect x="70" y="10" width="20" height="20" />
                    <rect x="10" y="70" width="20" height="20" />
                    <rect x="40" y="40" width="20" height="20" />
                    <rect x="40" y="10" width="10" height="20" />
                    <rect x="10" y="40" width="20" height="10" />
                    <rect x="70" y="40" width="20" height="20" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] text-slate-400 block font-bold uppercase">Firmado digitalmente por:</span>
                  <span className="text-[10px] font-bold text-clinical-dark block truncate">{cert.signatureSimulated}</span>
                  <button 
                    onClick={() => alert(`Folio ${cert.folio} validado exitosamente contra los servidores de la UNAM y CTS Arezzo.`)}
                    className="text-[9px] font-bold text-clinical-teal hover:underline block mt-0.5"
                  >
                    Verificar validez del folio →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
