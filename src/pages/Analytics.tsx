import React, { useState } from 'react';
import { 
  BarChart as BarIcon, PieChart as PieIcon, LineChart as LineIcon, 
  TrendingUp, Filter, GraduationCap, Eye, FileCheck, ShieldAlert 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Role } from '../types/clinical';
import { mockCertificates, mockClinicTrainings } from '../services/academicData';

interface AnalyticsProps {
  userRole: Role;
}

export const Analytics: React.FC<AnalyticsProps> = ({ userRole }) => {
  const [timeFilter, setTimeFilter] = useState('2026');
  const [activeSubTab, setActiveSubTab] = useState<'resultados' | 'fidelidad' | 'formacion' | 'supervision'>('resultados');

  // Datos 1: Historial citas mensuales
  const monthlyCitasData = [
    { name: 'Ene', Citas: 45, Completadas: 40, Canceladas: 5 },
    { name: 'Feb', Citas: 50, Completadas: 45, Canceladas: 5 },
    { name: 'Mar', Citas: 65, Completadas: 58, Canceladas: 7 },
    { name: 'Abr', Citas: 60, Completadas: 54, Canceladas: 6 },
    { name: 'May', Citas: 75, Completadas: 70, Canceladas: 5 },
    { name: 'Jun', Citas: 80, Completadas: 75, Canceladas: 5 },
    { name: 'Jul', Citas: 95, Completadas: 88, Canceladas: 7 },
    { name: 'Ago', Citas: 110, Completadas: 102, Canceladas: 8 }
  ];

  // Datos 2: Distribución por trastorno estratégico
  const diagnosticData = [
    { name: 'Ataque Pánico', Casos: 24 },
    { name: 'TOC', Casos: 15 },
    { name: 'Fobia Social', Casos: 18 },
    { name: 'Depresión', Casos: 10 },
    { name: 'Problema Pareja', Casos: 12 }
  ];

  // Datos 3: Resolución de casos (Efectividad TBE)
  const resolutionData = [
    { name: 'Casos Resueltos', value: 72 },
    { name: 'Casos Mejorados', value: 16 },
    { name: 'Invariables', value: 8 },
    { name: 'Drop Out (Abandono)', value: 4 }
  ];

  // Datos 4: Radar de competencias
  const competencyRadarData = [
    { subject: 'Ev. Estratégica', A: 9, B: 6, expected: 8, fullMark: 10 },
    { subject: 'Diálogo Estratégico', A: 7, B: 5, expected: 8, fullMark: 10 },
    { subject: 'Protocolos', A: 9, B: 8, expected: 8, fullMark: 10 },
    { subject: 'Prescripciones', A: 8, B: 7, expected: 8, fullMark: 10 },
    { subject: 'Reestructuración', A: 7, B: 5, expected: 8, fullMark: 10 },
    { subject: 'Riesgo Clínico', A: 10, B: 8, expected: 9, fullMark: 10 },
    { subject: 'Documentación', A: 8, B: 7, expected: 8, fullMark: 10 },
    { subject: 'Ética y Privacidad', A: 9, B: 8, expected: 8, fullMark: 10 },
    { subject: 'Uso de IA', A: 9, B: 6, expected: 8, fullMark: 10 },
    { subject: 'Medición', A: 8, B: 7, expected: 8, fullMark: 10 }
  ];

  const COLORS = ['#0d9488', '#75AFBC', '#ea580c', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Mi Desarrollo Profesional</h2>
          <p className="text-xs text-clinical-textMuted">
            Monitoreo integrado de desempeño clínico, adherencia técnica a protocolos, capacitación académica y bitácoras de supervisión.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-650">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Año:</span>
          <select
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Selector de Sub-pestañas */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-500 overflow-x-auto shrink-0 select-none" data-tour="mi-desarrollo-tabs">
        <button
          onClick={() => setActiveSubTab('resultados')}
          className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'resultados' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Resultados Clínicos
        </button>
        <button
          onClick={() => setActiveSubTab('fidelidad')}
          className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'fidelidad' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Fidelidad al Modelo (TBE)
        </button>
        <button
          onClick={() => setActiveSubTab('formacion')}
          className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'formacion' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Formación y Competencias
        </button>
        <button
          onClick={() => setActiveSubTab('supervision')}
          className={`px-4 py-2 rounded-lg transition-all ${activeSubTab === 'supervision' ? 'bg-clinical-dark text-white shadow-sm' : 'hover:text-slate-800'}`}
        >
          Supervisiones Recibidas
        </button>
      </div>

      {/* --- RENDER SUBTAB CONTENIDO --- */}

      {/* TAB 1: RESULTADOS CLÍNICOS */}
      {activeSubTab === 'resultados' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Grid Indicadores Clave de Desempeño */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Efectividad de Resolución (TBE)</span>
                <span className="text-2xl font-extrabold text-clinical-teal mt-1 block">88%</span>
                <span className="text-[10px] text-slate-400 block mt-1">Casos con mejoría o alta definitiva</span>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg text-clinical-teal">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Promedio de Sesiones por Caso</span>
                <span className="text-2xl font-extrabold text-clinical-dark mt-1 block">6.2</span>
                <span className="text-[10px] text-slate-400 block mt-1">Límite clínico estratégico TBE: &lt; 10</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-[#75AFBC]">
                <BarIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Tasa de Deserción (Drop Out)</span>
                <span className="text-2xl font-extrabold text-clinical-risk mt-1 block">4%</span>
                <span className="text-[10px] text-slate-400 block mt-1">Pacientes que abandonan voluntariamente</span>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-clinical-risk">
                <PieIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Grid de Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historial citas mensuales */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <LineIcon className="w-4 h-4 text-clinical-accent" />
                <h3 className="text-xs font-bold text-clinical-dark uppercase">Historial de Consultas Mensuales</h3>
              </div>
              <div className="h-60 text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyCitasData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Citas" stroke="#94a3b8" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="Completadas" stroke="#75AFBC" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Efectividad resolución casos */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <PieIcon className="w-4 h-4 text-clinical-teal" />
                <h3 className="text-xs font-bold text-clinical-dark uppercase">Distribución de Resultados de Casos (Efectividad)</h3>
              </div>
              <div className="h-60 flex flex-col sm:flex-row items-center justify-around gap-4 text-[10px]">
                <div className="w-44 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {resolutionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Leyenda manual ordenada */}
                <div className="space-y-2 text-xs font-semibold">
                  {resolutionData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index] }} />
                      <span className="text-slate-650">{entry.name}:</span>
                      <span className="text-clinical-dark font-bold">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trastornos Diagnósticos */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BarIcon className="w-4 h-4 text-clinical-orange" />
                <h3 className="text-xs font-bold text-clinical-dark uppercase">Distribución de Casos por Trastorno Estratégico</h3>
              </div>
              <div className="h-64 text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diagnosticData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Casos" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIDELIDAD AL MODELO */}
      {activeSubTab === 'fidelidad' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-650 font-semibold leading-normal animate-fadeIn">
          <div>
            <h3 className="text-sm font-extrabold text-clinical-dark uppercase tracking-wide">Fidelidad y Adherencia al Protocolo TBE</h3>
            <p className="text-slate-400 mt-0.5">Mapeo de desviaciones metodológicas en la prescripción de maniobras.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-slate-400 uppercase text-[9px] block">Apego de Prescripciones</span>
              <span className="text-2xl font-extrabold text-clinical-teal block mt-1">94%</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Uso de fórmulas literales en recetas</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-slate-400 uppercase text-[9px] block">Desviaciones de Tiempo</span>
              <span className="text-2xl font-extrabold text-clinical-risk block mt-1">1</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Caso con alerta activa por tiempo reducido</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-slate-400 uppercase text-[9px] block">Casos Estancados</span>
              <span className="text-2xl font-extrabold text-clinical-dark block mt-1">1</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Caso que supera las 10 sesiones sin alta</span>
            </div>
          </div>

          {/* Advertencia sobre desviaciones */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">Observación del Supervisor Clínico:</span>
              <p className="text-amber-800 mt-0.5 font-medium leading-relaxed">
                "Dr. Silva, se detecta en la bitácora de Sofía Martínez una reducción en la alarma de la Peor Fantasía de 30 a 15 minutos en la última sesión. Recuerde que el protocolo de Arezzo exige el periodo de 30 minutos completo para disolver la paradoja del control. Favor de restablecer la literalidad técnica en la siguiente consulta."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORMACIÓN Y COMPETENCIAS */}
      {activeSubTab === 'formacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Radar Chart (Izquierda) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide block border-b border-slate-100 pb-1.5">
              Matriz de Competencias Clínicas (Radar de 10 dimensiones)
            </span>
            <div className="h-60 text-[7px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Evaluación Inicial" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                  <Radar name="Nivel Esperado" dataKey="expected" stroke="#ea580c" fill="#ea580c" fillOpacity={0.0} />
                  <Radar name="Evaluación Actual" dataKey="A" stroke="#75AFBC" fill="#75AFBC" fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cursos y Horas (Derecha) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificados */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-650">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide block border-b border-slate-100 pb-1.5">Certificaciones de Capacitación Profesional</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockCertificates.map(c => (
                  <div key={c.folio} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                    <span className="font-bold text-clinical-dark text-xs block leading-tight">{c.programName}</span>
                    <div className="text-[10px] text-slate-500 font-medium">Folio: <b>{c.folio}</b></div>
                    <div className="text-[10px] text-slate-500 font-medium">Vigencia: {c.expiryDate}</div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] font-bold uppercase rounded inline-block">Vigente</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cursos Internos */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs text-slate-650">
              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wide block border-b border-slate-100 pb-1.5">Talleres y Cursos Clínicos Internos</span>
              <div className="space-y-2.5">
                {mockClinicTrainings.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold">
                    <div>
                      <span className="font-bold text-clinical-dark block">{t.title}</span>
                      <span className="text-[9px] text-slate-450 block mt-0.5">Fecha límite: {t.limitDate}</span>
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[9px] font-bold uppercase rounded">{t.progressPercent}% COMPLETADO</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPERVISIONES RECIBIDAS */}
      {activeSubTab === 'supervision' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-650 font-semibold leading-normal animate-fadeIn">
          <div>
            <h3 className="text-sm font-extrabold text-clinical-dark uppercase tracking-wide">Registro Histórico de Supervisión Técnica</h3>
            <p className="text-slate-400 mt-0.5">Bitácoras y recomendaciones autorizadas por tus supervisores clínicos asignados.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-clinical-dark text-xs block">Caso: Sofía Martínez (Sesión 2)</span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Supervisor: Dra. Isabel Cárdenas (Fecha: 18 de Agosto, 2026)</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded font-bold uppercase text-[9px]">Atendido / Resuelto</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-450 uppercase block font-bold">Bloqueo o impase clínico:</span>
                <p className="text-slate-650 font-medium">Paciente manifiesta evitación del metro por temor al desmayo.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[9px] text-clinical-teal uppercase block font-bold">Recomendación técnica del supervisor:</span>
                <p className="text-slate-750 font-extrabold mt-0.5">Prescribir pequeños temblores o simulacros voluntarios en el metro acompañados de un Diario de Abordo preventivo.</p>
              </div>
              <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-150">
                <span className="text-[9px] text-slate-450 uppercase block font-bold">Estado de Compromiso:</span>
                <span className="text-emerald-800 font-bold">✓ Recomendación aplicada en consulta. Avance registrado en la nota clínica de la Sesión 3.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
