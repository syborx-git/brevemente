import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Clock, BookOpen, FileText, 
  ShieldAlert, Sparkles, PlusCircle, ArrowRight, 
  AlertTriangle, Filter, RotateCcw, Building, CheckCircle, 
  Search, Check, Trash2, Shield, GraduationCap, Eye, BarChart3, HelpCircle 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { Role, Appointment, Patient } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';
import { riskSimulationService } from '../services/riskSimulationService';
import { mockStudentProfile } from '../services/academicData';

interface DashboardProps {
  userRole: Role;
  appointments: Appointment[];
  patients: Patient[];
  userName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole, appointments, patients, userName }) => {
  const navigate = useNavigate();
  const todayStr = '2026-08-24'; // Simulado hoy

  // --- FILTROS DE CABECERA ---
  const [selectedSede, setSelectedSede] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('mes');
  const [selectedTherapist, setSelectedTherapist] = useState<string>('all');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('Hace unos instantes');

  // --- SELECTOR DE PERSPECTIVA DE GRÁFICA (ZONA 5) ---
  const [chartPerspective, setChartPerspective] = useState<string>('fases');

  // --- DRILLDOWNS (MODALES) ---
  const [activeDrilldown, setActiveDrilldown] = useState<string | null>(null);

  // --- BOTÓN DE CRISIS (PACIENTE) ---
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisAlertSent, setCrisisAlertSent] = useState(false);

  // --- LIMPIAR FILTROS ---
  const handleClearFilters = () => {
    setSelectedSede('all');
    setSelectedPeriod('mes');
    setSelectedTherapist('all');
    setSelectedProtocol('all');
    setSelectedModality('all');
    setLastUpdated('Filtros restaurados y actualizados');
    auditLogService.addLog(
      'Filtros limpiados',
      'El usuario restauró los filtros del Centro de Control a sus valores iniciales.',
      'seguridad',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  // --- LOG DE INICIO DE TOUR ---
  const handleStartDemo = () => {
    window.dispatchEvent(new CustomEvent('brevemente_demo_start', { detail: 'executiva' }));
  };

  // --- ASIGNACIÓN DE SEDES Y PERIODO A LOS DATOS DE DEMO ---
  // Para que sede y periodo filtren de verdad los datos:
  const getPatientSede = (patientId: string): string => {
    if (patientId === 'patient-1') return 'centro';
    if (patientId === 'patient-2') return 'centro';
    if (patientId === 'patient-3') return 'norte';
    return 'sur'; // patient-4 u otros
  };

  const getPatientModality = (patientId: string): string => {
    if (patientId === 'patient-2') return 'online';
    return 'presencial';
  };

  const getPatientProtocol = (patientId: string): string => {
    if (patientId === 'patient-1') return 'Ataque de Pánico';
    if (patientId === 'patient-3') return 'TOC Control';
    return 'Fobia Social';
  };

  // Filtrar pacientes
  const filteredPatients = patients.filter(p => {
    if (selectedSede !== 'all' && getPatientSede(p.id) !== selectedSede) return false;
    if (selectedTherapist !== 'all' && p.therapistId !== selectedTherapist) return false;
    if (selectedProtocol !== 'all' && getPatientProtocol(p.id) !== selectedProtocol) return false;
    if (selectedModality !== 'all' && getPatientModality(p.id) !== selectedModality) return false;
    return true;
  });

  // Filtrar citas según periodo y sede
  const filteredAppointments = appointments.filter(app => {
    const patientSede = getPatientSede(app.patientId);
    const patientModality = getPatientModality(app.patientId);
    const patientProtocol = getPatientProtocol(app.patientId);
    const patientData = patients.find(p => p.id === app.patientId);

    if (selectedSede !== 'all' && patientSede !== selectedSede) return false;
    if (selectedTherapist !== 'all' && patientData?.therapistId !== selectedTherapist) return false;
    if (selectedProtocol !== 'all' && patientProtocol !== selectedProtocol) return false;
    if (selectedModality !== 'all' && patientModality !== selectedModality) return false;

    // Filtrado por periodo
    if (selectedPeriod === 'hoy') {
      return app.date === todayStr;
    }
    if (selectedPeriod === 'semana') {
      // Semana del 24 de agosto al 28 de agosto
      return app.date >= '2026-08-24' && app.date <= '2026-08-28';
    }
    return true; // mes/trimestre/año muestra todo el set de demo
  });

  // Citas de hoy específicas
  const todayAppointments = filteredAppointments.filter(app => app.date === todayStr);

  // --- CÁLCULO DE MÉTRICAS OPERATIVAS DINDÁMICAS ---
  const activePatientsCount = filteredPatients.filter(p => p.status === 'activo').length;
  const todayAppsCount = todayAppointments.length;
  const pendingRecordsCount = filteredPatients.filter(p => p.status === 'pendiente').length || 1;
  const alertsCount = filteredPatients.filter(p => p.riskLevel === 'medio' || p.id === 'patient-1').length;

  // --- SEGREGACIÓN DE DATOS DEL PACIENTE ---
  if (userRole === 'patient') {
    const handleTriggerCrisisButton = () => {
      setShowCrisisModal(true);
      setCrisisAlertSent(true);

      // Escalar alerta de contingencia a supervisores y registrar en auditoría
      riskSimulationService.escalateRisk(
        'patient-1',
        'Sofía Martínez',
        'ALERTA ROJA: El paciente pulsó el Botón de Crisis de emergencia desde su dashboard principal.',
        { id: 'patient-1', name: 'Sofía Martínez', role: 'patient' }
      );

      auditLogService.addLog(
        'Botón de Crisis activado',
        'El paciente activó el Botón de Crisis. Teléfonos de auxilio mostrados y alerta enviada a supervisión.',
        'seguridad',
        { id: 'patient-1', name: 'Sofía Martínez', role: 'patient' }
      );
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Banner de Bienvenida Paciente */}
        <div className="bg-gradient-to-r from-[#304768] to-[#75AFBC] text-white p-6 rounded-xl shadow-md space-y-2">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Mi Portal de Terapia</span>
              <h2 className="text-xl font-bold mt-1.5">¡Hola, Sofía Martínez!</h2>
              <p className="text-xs text-white/80 font-medium mt-0.5">Espacio confidencial para el seguimiento de tu proceso de salud mental.</p>
            </div>
            <button
              onClick={handleTriggerCrisisButton}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-md animate-pulse shrink-0 flex items-center gap-1.5 border border-red-400"
            >
              <AlertTriangle className="w-4 h-4" />
              ⚠️ BOTÓN DE CRISIS
            </button>
          </div>
        </div>

        {/* Grid Principal del Paciente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Citas y Tareas */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Próxima Consulta */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Mi Próxima Consulta</span>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-50 text-clinical-teal p-3 rounded-xl border border-teal-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-clinical-dark block">Hoy, 24 de Agosto de 2026</span>
                    <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">Horario: 09:00 AM — Modalidad: Presencial (Sede Centro)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-450 block font-bold">Terapeuta Responsable:</span>
                  <span className="text-xs font-extrabold text-clinical-dark block">Dr. Alejandro Silva</span>
                </div>
              </div>
            </div>

            {/* Prescripciones Asignadas Reales */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Mis Tareas Terapéuticas Activas</span>
              <p className="text-[11px] text-slate-455 leading-normal font-semibold">Realiza tus tareas asignadas tal como las indicó tu especialista. Esto forma parte central del tratamiento estratégico.</p>
              
              <div className="space-y-3 leading-normal font-semibold text-slate-705">
                <div className="bg-slate-50 border-l-4 border-l-[#75AFBC] p-4 rounded-r-xl">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-clinical-dark block">1. Diario de a Bordo</span>
                    <span className="text-[8px] bg-clinical-teal/10 text-clinical-teal border border-teal-200/30 px-2 py-0.5 rounded font-extrabold">En Curso</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    "Anotar en la libreta cada ataque de pánico justo en el momento en que ocurra, registrando la hora, síntomas y pensamientos."
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-2">Asignado por: <b>Dr. Alejandro Silva</b> (Sesión 1)</span>
                </div>

                <div className="bg-slate-50 border-l-4 border-l-[#304768] p-4 rounded-r-xl">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-clinical-dark block">2. La Peor Fantasía</span>
                    <span className="text-[8px] bg-clinical-teal/10 text-clinical-teal border border-teal-200/30 px-2 py-0.5 rounded font-extrabold">En Curso</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    "Elegir un horario fijo al día (ej. 18:00 hrs) para encerrarse a solas por 30 minutos y evocar voluntariamente sus peores temores hasta que la ansiedad disminuya."
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-2">Asignado por: <b>Dr. Alejandro Silva</b> (Sesión 2)</span>
                </div>
              </div>
            </div>

            {/* Evolución Clínica Personal */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Mi Evolución de Cambio</span>
              <p className="text-[11px] text-slate-400 leading-normal font-semibold">Gráfica agregada que muestra tus niveles de bienestar percibido en las esferas relacionales.</p>
              
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: 'Sesión 1', yo: 30, demas: 40, mundo: 35 },
                    { name: 'Sesión 2', yo: 45, demas: 50, mundo: 40 },
                    { name: 'Sesión 3', yo: 65, demas: 60, mundo: 55 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="yo" name="Relación Conmigo Mismo (YO)" stroke="#304768" strokeWidth={3} />
                    <Line type="monotone" dataKey="demas" name="Relación con los Demás" stroke="#75AFBC" strokeWidth={3} />
                    <Line type="monotone" dataKey="mundo" name="Relación con el Mundo" stroke="#319795" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Senda Paciente y Contacto */}
          <div className="space-y-6">
            {/* Senda Paciente Helper */}
            <div className="bg-[#75AFBC]/5 border border-[#75AFBC]/20 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-clinical-teal animate-pulse" />
                <span className="font-extrabold text-clinical-dark text-xs uppercase tracking-wide">Senda Paciente</span>
              </div>
              <p className="text-slate-600 font-semibold leading-relaxed text-xs">
                Hola, Sofía. Soy <b>Senda Paciente</b>. Puedo resolver dudas sobre cómo realizar tus tareas asignadas o explicarte el modelo de terapia de Arezzo.
              </p>
              
              <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Preguntas sugeridas:</span>
                <button
                  onClick={() => alert('Senda Paciente:\n\nEl Diario de a bordo consiste en registrar cada ataque de pánico justo en el momento en que ocurra. Debes anotar la hora, los síntomas físicos experimentados y tus pensamientos en ese instante exacto. Hacerlo ayuda a bloquear la evitación racional.')}
                  className="w-full text-left px-2.5 py-1.5 border border-slate-100 hover:border-clinical-teal rounded text-[10px] font-bold text-slate-650 bg-slate-50/50 block transition-all"
                >
                  ¿Cómo completo el Diario de a Bordo?
                </button>
                <button
                  onClick={() => alert('Senda Paciente:\n\nLa Peor Fantasía es una prescripción estratégica diseñada para disolver el control paradojal. Al obligarte a pensar en tus peores temores durante 30 minutos a una hora fija, la mente se satura y la ansiedad se anula de forma natural.')}
                  className="w-full text-left px-2.5 py-1.5 border border-slate-100 hover:border-clinical-teal rounded text-[10px] font-bold text-slate-655 bg-slate-50/50 block transition-all"
                >
                  ¿Para qué sirve la Peor Fantasía?
                </button>
              </div>
            </div>

            {/* Datos de Contacto de Clínica */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Información de la Clínica</span>
              <div className="space-y-2 font-semibold text-slate-600">
                <div>Dirección: <span className="text-clinical-dark font-extrabold">Sede Centro, Ciudad de México</span></div>
                <div>Teléfono de Urgencias: <span className="text-clinical-dark font-extrabold">+52 55 9000 8000</span></div>
                <div>Email: <span className="text-clinical-dark font-extrabold">contacto@brevemente.com</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Crisis */}
        {showCrisisModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white border-2 border-red-500 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-red-650 border-b border-slate-100 pb-2">
                <AlertTriangle className="w-7 h-7 text-red-650 animate-bounce" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-red-600">Atención de Crisis Inmediata</h3>
              </div>
              <p className="font-bold text-slate-700 text-xs leading-relaxed">
                ⚠️ Se ha notificado inmediatamente al **Dr. Alejandro Silva** y al **Supervisor de Guardia** sobre tu estado de crisis. Un profesional se comunicará contigo de forma prioritaria.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <span className="font-bold text-red-800 text-[11px] block uppercase">Recursos de Apoyo Inmediatos (Gratuitos 24/7):</span>
                <div className="space-y-1.5 font-extrabold text-xs text-red-950">
                  <div>📞 Línea de la Vida (Nacional): <span className="underline">800 911 2000</span></div>
                  <div>📞 Teléfono de Guardia BreveMente: <span className="underline">+52 55 9000 8000</span></div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowCrisisModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 text-xs"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SEGREGACIÓN DE DATOS DEL ALUMNO Y REDIRECCIÓN REAL ---
  if (userRole === 'student') {
    return (
      <div className="space-y-6 animate-fadeIn text-xs text-slate-650 font-semibold leading-normal">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-clinical-dark">¡Hola de nuevo, {userName}!</h2>
            <p className="text-[11px] text-clinical-textMuted mt-1">
              Portal académico de formación y desarrollo profesional.
            </p>
          </div>
          <button
            onClick={() => navigate('/campus')}
            className="px-4 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0"
          >
            <GraduationCap className="w-4 h-4" />
            Ingresar al Campus Completo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <span className="font-bold text-clinical-dark uppercase tracking-wider block border-b border-slate-100 pb-2">Mi Resumen Académico</span>
            <div className="grid grid-cols-2 gap-4">
              <div>Diplomado Activo: <span className="text-clinical-dark font-extrabold">{mockStudentProfile.diplomado}</span></div>
              <div>Cohorte: <span className="text-clinical-dark font-extrabold">Agosto 2026</span></div>
              <div>Promedio (G.P.A): <span className="text-clinical-teal font-extrabold">{mockStudentProfile.gpa} / 10</span></div>
              <div>Horas Acumuladas: <span className="text-clinical-dark font-extrabold">{mockStudentProfile.trainingHours} / 120 hrs</span></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="font-bold text-clinical-dark uppercase tracking-wider block border-b border-slate-100 pb-2">Avisos Académicos</span>
              <p className="mt-2 font-medium italic text-slate-600 leading-normal">
                "Recuerden que para la sesión final de evaluación práctica (Módulo 8), el expediente de práctica simulada debe estar concluido."
              </p>
            </div>
            <button
              onClick={() => navigate('/desempeno')}
              className="text-clinical-teal font-bold hover:underline block mt-3 text-left"
            >
              Ver Radar de Competencias completo →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FILTRADO DE MÉTRICAS SEGÚN ACCESO ROL (DOM SEGURO) ---
  const isAssistant = userRole === 'assistant';

  // Sedes Ficticias
  const SEDES = [
    { id: 'all', name: 'Todas las Sedes' },
    { id: 'centro', name: 'Sede Centro BreveMente' },
    { id: 'norte', name: 'Sede Norte BreveMente' },
    { id: 'sur', name: 'Sede Sur BreveMente' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-xs text-slate-650 font-semibold leading-normal">
      
      {/* ZONA 1: BIENVENIDA Y CONTEXTO */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4" data-tour="dashboard-header">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-150 pb-4">
          <div>
            <h2 className="text-xl font-bold text-clinical-dark flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#75AFBC]" />
              Centro de Control BreveMente
            </h2>
            <p className="text-[11px] text-clinical-textMuted mt-0.5">
              Visión ejecutiva de la operación clínica, las alertas y la efectividad general.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Actualizado: {lastUpdated}
            </span>
            <button
              onClick={handleStartDemo}
              className="px-3.5 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Guiada
            </button>
            <button
              onClick={() => navigate('/senda')}
              className="px-3.5 py-1.5 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1 transition-colors"
            >
              Senda
            </button>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]" data-tour="dashboard-filters">
          <div className="flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">Filtros:</span>
          </div>

          <select
            className="px-2 py-1 border border-slate-250 bg-white rounded-lg focus:outline-none"
            value={selectedSede}
            onChange={(e) => { setSelectedSede(e.target.value); setLastUpdated('Hace unos instantes'); }}
          >
            {SEDES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="px-2 py-1 border border-slate-250 bg-white rounded-lg focus:outline-none"
            value={selectedPeriod}
            onChange={(e) => { setSelectedPeriod(e.target.value); setLastUpdated('Hace unos instantes'); }}
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>

          <select
            className="px-2 py-1 border border-slate-250 bg-white rounded-lg focus:outline-none"
            value={selectedTherapist}
            onChange={(e) => { setSelectedTherapist(e.target.value); setLastUpdated('Hace unos instantes'); }}
          >
            <option value="all">Todos los Terapeutas</option>
            <option value="therapist-1">Dr. Alejandro Silva</option>
          </select>

          <select
            className="px-2 py-1 border border-slate-250 bg-white rounded-lg focus:outline-none"
            value={selectedProtocol}
            onChange={(e) => { setSelectedProtocol(e.target.value); setLastUpdated('Hace unos instantes'); }}
          >
            <option value="all">Todos los Protocolos</option>
            <option value="Ataque de Pánico">Ataque de Pánico</option>
            <option value="TOC Control">TOC de Verificación</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg flex items-center gap-1 transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* ZONA 2: ESTADO GENERAL (MÁXIMO 4 INDICADORES VISUALES NO IDÉNTICOS, MÁXIMO 1 ANILLO DE PROGRESO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard-kpis">
        
        {/* Indicador 1: Compacto Numérico (Citas) */}
        <div 
          onClick={() => setActiveDrilldown('citas')}
          className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-clinical-teal transition-all"
        >
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Citas Programadas</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-clinical-dark block">{todayAppsCount}</span>
              <span className="text-[10px] text-emerald-600 font-bold block">+1 vs ayer</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-450 mt-3 block border-t border-slate-50 pt-2 font-bold uppercase">Clic para ver agenda</span>
        </div>

        {/* Indicador 2: Anillo de Progreso (Pacientes Activos - MÁXIMO 1 ANILLO EN VIEWPORT) */}
        <div 
          onClick={() => setActiveDrilldown('pacientes')}
          className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:border-clinical-teal transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pacientes Activos</span>
            <span className="text-xl font-extrabold text-clinical-dark block">{activePatientsCount}</span>
            <span className="text-[9px] text-emerald-600 font-bold block">Capacidad al 40%</span>
          </div>
          {/* Anillo de Progreso SVG */}
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#75AFBC]" strokeDasharray={`${(activePatientsCount / 10) * 100}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-slate-650">
              {(activePatientsCount / 10) * 100}%
            </div>
          </div>
        </div>

        {/* Indicador 3: Barra de Estado (Pendientes Clínicos) */}
        <div 
          onClick={() => setActiveDrilldown('consentimientos')}
          className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-clinical-teal transition-all"
        >
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pendientes Clínicos</span>
            <span className="text-xl font-extrabold text-clinical-dark block mt-1">{pendingRecordsCount}</span>
            {/* Barra de Progreso Lineal */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div className="bg-clinical-teal h-full rounded-full transition-all" style={{ width: `${(pendingRecordsCount / 5) * 100}%` }} />
            </div>
          </div>
          <span className="text-[9px] text-slate-400 block font-bold mt-2 uppercase">Límite semanal: 5</span>
        </div>

        {/* Indicador 4: Semáforo / Badge (Alertas Clínicas - Oculto para asistente) */}
        <div 
          onClick={() => { if (!isAssistant) setActiveDrilldown('risk'); }}
          className={`bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between ${!isAssistant ? 'cursor-pointer hover:border-red-500' : ''}`}
        >
          <div>
            <span className="text-[10px] text-slate-450 uppercase tracking-wider block">Alertas de Riesgo</span>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-2xl font-extrabold block ${isAssistant ? 'text-slate-400' : 'text-red-700'}`}>
                {isAssistant ? '—' : alertsCount}
              </span>
              {!isAssistant && alertsCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[8px] font-extrabold rounded-full animate-pulse border border-red-200">
                  REQUERIDO
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 border-t border-slate-50 pt-2">
            {/* Luces del semáforo */}
            <div className={`w-2.5 h-2.5 rounded-full ${(!isAssistant && alertsCount > 0) ? 'bg-red-500 animate-pulse' : 'bg-slate-200'}`} />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="text-[9px] text-slate-400 block font-bold uppercase">
              {isAssistant ? 'No autorizado' : 'Nivel de alerta'}
            </span>
          </div>
        </div>
      </div>

      {/* ZONA 3: PRÓXIMA ACCIÓN (BLOQUE VISUAL MÁS IMPORTANTE - DESTACADO) */}
      <div className="bg-slate-50 border border-slate-250 p-6 rounded-xl shadow-inner space-y-4" data-tour="dashboard-next-action">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <span className="font-extrabold text-clinical-dark text-xs uppercase tracking-wider block">Acción Operativa Dominante</span>
          <span className="text-[8px] bg-[#75AFBC]/25 text-clinical-dark border border-teal-200 px-2 py-0.5 rounded font-extrabold uppercase">Próxima Consulta</span>
        </div>

        <div className="flex items-center justify-between gap-6 flex-wrap leading-normal font-semibold text-slate-650">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center shrink-0">
              <span className="text-xl font-extrabold text-clinical-dark block">09:00</span>
              <span className="text-[9px] text-slate-400 font-extrabold block uppercase mt-0.5">AM</span>
            </div>
            <div>
              <span className="text-sm font-extrabold text-clinical-dark block">Sofía Martínez</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Protocolo: Ataque de Pánico • Fase 2 TBE • Sesión #3</span>
              <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-400 font-bold uppercase flex-wrap">
                <span className="text-emerald-700">Intake: Listo</span>
                <span>•</span>
                <span className="text-emerald-700">Consentimiento: Firmado</span>
                <span>•</span>
                <span className="text-clinical-teal">Grabación Senda: Autorizada</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Responsable</span>
              <span className="text-xs font-bold text-clinical-dark block">Dr. Alejandro Silva</span>
            </div>
            {!isAssistant && (
              <button
                onClick={() => navigate('/expedientes?id=patient-1')}
                className="px-5 py-2.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                Preparar Sesión
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ZONA 4: AGENDA Y PENDIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Agenda (Línea de Tiempo Compacta de Citas) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block">Agenda del Día</span>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-[10px] text-clinical-teal font-bold hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {todayAppointments.slice(0, 3).map(app => (
              <div key={app.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-12 text-center py-1 font-bold text-clinical-accent bg-blue-50 border border-blue-100 rounded text-[10px]">
                    {app.time}
                  </span>
                  <div>
                    <span className="font-bold text-clinical-dark block">{app.patientName}</span>
                    <span className="text-[9px] text-slate-500 font-semibold">{app.type.toUpperCase()} • Presencial</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">{app.status}</span>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <p className="text-[11px] text-slate-400 font-semibold italic text-center py-4">No hay citas registradas para este periodo y sede.</p>
            )}
          </div>
        </div>

        {/* Columna Pendientes (Lista breve y priorizada) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block">Pendientes Prioritarios</span>
            <button 
              onClick={() => navigate('/expedientes')}
              className="text-[10px] text-clinical-teal font-bold hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3 text-[11px] font-semibold text-slate-650">
            {/* Pendiente 1 */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-2 gap-2">
              <div>
                <span className="font-bold text-clinical-dark block">Firma digital de Carlos Mendoza</span>
                <span className="text-[10px] text-slate-500 block">Debe firmar consentimiento de audio antes de su cita a las 11:30.</span>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[8px] font-bold uppercase rounded">Crítico</span>
            </div>

            {/* Pendiente 2 (Oculto para asistente) */}
            {!isAssistant && (
              <div className="flex items-start justify-between border-b border-slate-100 pb-2 gap-2">
                <div>
                  <span className="font-bold text-clinical-dark block">Borrador de nota en Sofía Martínez</span>
                  <span className="text-[10px] text-slate-500 block">Validar borrador sugerido por Senda en la Sesión 2.</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-bold uppercase rounded">Pendiente</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ZONA 5: VISIÓN CLÍNICA RESUMIDA (UNA SOLA GRÁFICA PRINCIPAL CON SELECTOR DE PERSPECTIVA) */}
      {!isAssistant && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4" data-tour="dashboard-results">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <span className="font-extrabold text-clinical-dark text-xs uppercase tracking-wide block">Perspectiva Clínica Unificada</span>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Selecciona el ángulo analítico a visualizar en el viewport principal.</p>
            </div>
            
            {/* Selector de Perspectiva (Dropdown) */}
            <select
              className="px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none text-[11px] font-bold text-slate-650"
              value={chartPerspective}
              onChange={(e) => setChartPerspective(e.target.value)}
            >
              <option value="fases">Distribución por Fase TBE</option>
              <option value="protocolos">Casos Activos por Protocolo</option>
              <option value="citas">Citas completadas (Histórico)</option>
            </select>
          </div>

          <div className="h-64 flex items-center justify-center">
            {chartPerspective === 'fases' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Fase 1: Definición del SPR', value: 30 },
                      { name: 'Fase 2: Desbloqueo Estratégico', value: 40 },
                      { name: 'Fase 3: Consolidación', value: 20 },
                      { name: 'Fase 4: Alta / Cierre', value: 10 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#304768" />
                    <Cell fill="#75AFBC" />
                    <Cell fill="#319795" />
                    <Cell fill="#4A5568" />
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {chartPerspective === 'protocolos' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Ataque Pánico', casos: filteredPatients.filter(p => getPatientProtocol(p.id) === 'Ataque de Pánico').length || 1 },
                  { name: 'TOC Control', casos: filteredPatients.filter(p => getPatientProtocol(p.id) === 'TOC Control').length || 1 },
                  { name: 'Fobia Social', casos: 1 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip />
                  <Bar dataKey="casos" fill="#75AFBC" name="Casos">
                    <Cell fill="#304768" />
                    <Cell fill="#75AFBC" />
                    <Cell fill="#2C7A7B" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartPerspective === 'citas' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { week: 'Sem 1', citas: 10 },
                  { week: 'Sem 2', citas: 14 },
                  { week: 'Sem 3', citas: todayAppsCount || 18 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="citas" name="Citas Atendidas" stroke="#304768" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* --- MODALES DE DRILLDOWN (PROFUNDIZACIÓN) --- */}
      {activeDrilldown && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-xs text-slate-655 font-semibold">
            {/* Header Modal */}
            <div className="bg-clinical-dark p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-[#75AFBC]" />
                Detalle del Centro de Control
              </h3>
              <button 
                onClick={() => setActiveDrilldown(null)} 
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo Modal */}
            <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto leading-normal">
              {activeDrilldown === 'risk' && (
                <div className="space-y-3">
                  <span className="font-bold text-clinical-dark block uppercase border-b border-slate-100 pb-1.5">Pacientes en Riesgo Elevado</span>
                  <div className="bg-red-50/50 border border-red-200 rounded-lg p-3">
                    <span className="font-extrabold text-red-750 block">Roberto Valdés</span>
                    <span className="text-[10px] text-slate-500">Motivo: Ideación autolítica • Estado: Escalamiento Urgente</span>
                    <p className="text-slate-600 mt-1 leading-normal font-medium">Canalizado con la Dra. Patricia Ortiz y en contacto prioritario.</p>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                    <span className="font-extrabold text-amber-755 block">Sofía Martínez</span>
                    <span className="text-[10px] text-slate-500">Motivo: Pánico Severo • Estado: Pendiente de Supervisión</span>
                    <p className="text-slate-600 mt-1 leading-normal font-medium">Requiere auditoría del Diario de a Bordo de la última sesión.</p>
                  </div>
                </div>
              )}

              {activeDrilldown === 'consentimientos' && (
                <div className="space-y-3">
                  <span className="font-bold text-clinical-dark block uppercase border-b border-slate-100 pb-1.5">Consentimientos Pendientes de Firma</span>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                    <span className="font-extrabold text-amber-700 block">Carlos Mendoza</span>
                    <span className="text-[10px] text-slate-500">Motivo: Primera Sesión • Estatus: Documentación de Admisión</span>
                    <p className="text-slate-600 mt-1 leading-normal font-medium">Debe firmar consentimiento de audio antes de la cita de las 11:30.</p>
                  </div>
                </div>
              )}

              {activeDrilldown === 'pacientes' && (
                <div className="space-y-3">
                  <span className="font-bold text-clinical-dark block uppercase border-b border-slate-100 pb-1.5">Pacientes Filtrados (Sede: {selectedSede})</span>
                  <div className="divide-y divide-slate-100">
                    {filteredPatients.map(p => (
                      <div key={p.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-clinical-dark block">{p.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase">{p.motif?.substring(0, 30)}...</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${p.status === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDrilldown === 'citas' && (
                <div className="space-y-3">
                  <span className="font-bold text-clinical-dark block uppercase border-b border-slate-100 pb-1.5">Citas Programadas (Filtradas)</span>
                  <div className="divide-y divide-slate-100">
                    {filteredAppointments.map(app => (
                      <div key={app.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-clinical-dark block">{app.patientName}</span>
                          <span className="text-[9px] text-slate-500">Hora: {app.time} • Fecha: {app.date}</span>
                        </div>
                        <span className="text-[10px] font-bold text-clinical-teal">{app.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveDrilldown(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
