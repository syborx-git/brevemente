import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, AlertTriangle, FileText, CheckCircle, 
  ArrowRight, ShieldAlert, Sparkles, Eye, GraduationCap, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Role, Appointment, Patient } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';

interface MiConsultaProps {
  userRole: Role;
  appointments: Appointment[];
  patients: Patient[];
  userName: string;
}

export const MiConsulta: React.FC<MiConsultaProps> = ({ userRole, appointments, patients, userName }) => {
  const navigate = useNavigate();
  
  // Seguridad real: Alumno y Paciente no deben acceder
  if (['student', 'patient'].includes(userRole)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-xs font-semibold text-red-800 space-y-3 max-w-md mx-auto mt-12 leading-normal">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto animate-bounce" />
        <h3 className="font-extrabold text-sm uppercase">Acceso Denegado</h3>
        <p>No tienes los permisos requeridos para visualizar la agenda operativa y consulta privada del personal clínico.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // --- ESTADOS INTERACTIVOS PARA LA PRÓXIMA SESIÓN ---
  const [sessionState, setSessionState] = useState<'por_iniciar' | 'en_curso' | 'finalizada' | 'nota_pendiente'>('por_iniciar');

  // --- COLAPSO SECCIONES SECUNDARIAS ---
  const [showSecondaryContent, setShowSecondaryContent] = useState(false);

  const getPageTitle = () => {
    if (userRole === 'supervisor') return 'Mi Supervisión';
    if (userRole === 'admin_clinical') return 'Mi Operación';
    if (userRole === 'admin_platform') return 'Operación Clínica';
    return 'Mi Consulta';
  };

  // Datos simulados del caseload del doctor
  const todayStr = '2026-08-24';
  const myPatients = patients.filter(p => p.therapistId === 'therapist-1');
  const myAppointments = appointments.filter(app => {
    const p = patients.find(pat => pat.id === app.patientId);
    return p?.therapistId === 'therapist-1' && app.date === todayStr;
  });

  // Próxima cita de mi agenda
  const nextApp = appointments.find(app => app.patientId === 'patient-1') || appointments[0];

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-slate-655 font-semibold leading-normal" data-tour="mi-consulta-main">
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">{getPageTitle()} — Dr. Alejandro Silva</h2>
          <p className="text-[11px] text-clinical-textMuted mt-0.5">Espacio de trabajo operativo y control diario de citas y notas de sesión.</p>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-center font-bold text-[10px] shrink-0">
          <span className="px-3 py-1.5 bg-white text-clinical-dark rounded shadow-sm">Sede Centro</span>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (Sesión y Agenda) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PRÓXIMA SESIÓN - ZONA OPERATIVA PRINCIPAL */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
              <span className="font-extrabold text-clinical-dark text-xs uppercase tracking-wider block">Próxima Sesión Clínico-Estratégica</span>
              
              {/* Selector de Estado de Sesión Simulado */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-center font-bold text-[9px] border border-slate-200">
                {(['por_iniciar', 'en_curso', 'finalizada', 'nota_pendiente'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setSessionState(st);
                      auditLogService.addLog(
                        'Simulación estado sesión',
                        `El terapeuta cambió simulación de sesión a estado: ${st}`,
                        'sesion',
                        { id: 'therapist-1', name: userName, role: userRole }
                      );
                    }}
                    className={`px-2 py-1 rounded capitalize transition-all ${sessionState === st ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Ficha Dinámica del Paciente según Estado de Sesión */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Paciente Activo:</span>
                  <span className="text-sm font-extrabold text-clinical-dark block mt-0.5">{nextApp?.patientName}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Motivo: Ataque de Pánico (TBE-P-01) • Sesión #3</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-450 block uppercase font-bold">Estado actual:</span>
                  <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border inline-block mt-1 ${
                    sessionState === 'por_iniciar' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    sessionState === 'en_curso' ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse' :
                    sessionState === 'finalizada' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {sessionState === 'por_iniciar' ? 'Por Iniciar (09:00 AM)' :
                     sessionState === 'en_curso' ? 'En Curso (Graba Audio)' :
                     sessionState === 'finalizada' ? 'Sesión Completada' : 'Nota de Sesión Pendiente'}
                  </span>
                </div>
              </div>

              {/* Parámetros de Admisión e IA */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3 text-[10px] uppercase font-bold text-slate-450">
                <div>
                  <span>Intake Form:</span>
                  <span className="text-emerald-700 block font-extrabold mt-0.5">COMPLETO</span>
                </div>
                <div>
                  <span>Consentimiento Grabación:</span>
                  <span className="text-emerald-700 block font-extrabold mt-0.5">FIRMADO DIGITALMENTE</span>
                </div>
                <div>
                  <span>Modo Asistencial IA:</span>
                  <span className="text-clinical-teal block font-extrabold mt-0.5">SENDA HABILITADA</span>
                </div>
              </div>

              {/* Botón dinámico de acción principal */}
              <div className="pt-2">
                {sessionState === 'por_iniciar' && (
                  <button 
                    onClick={() => navigate('/expedientes?id=patient-1')}
                    className="w-full py-2 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold shadow text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Atender / Preparar Sesión
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {sessionState === 'en_curso' && (
                  <button 
                    onClick={() => navigate('/expedientes?id=patient-1')}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow text-xs transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    Detener Grabación y Procesar con Senda
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
                {sessionState === 'finalizada' && (
                  <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-lg text-emerald-800 text-center font-bold">
                    ✓ Sesión 3 registrada correctamente. La bitácora ha sido firmada criptográficamente.
                  </div>
                )}
                {sessionState === 'nota_pendiente' && (
                  <button 
                    onClick={() => navigate('/expedientes?id=patient-1')}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Redactar Nota de Sesión Urgente (Sugerida por Senda)
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AGENDA OPERATIVA DEL DÍA */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Agenda de Hoy</span>
            
            <div className="space-y-2">
              {myAppointments.map(app => (
                <div key={app.id} className="p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-center py-1 font-bold text-clinical-accent bg-blue-50 border border-blue-100 rounded text-[10px]">
                      {app.time}
                    </span>
                    <div>
                      <span className="font-bold text-clinical-dark block">{app.patientName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{app.type.toUpperCase()} • Presencial</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-clinical-teal">{app.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha (Pacientes que requieren atención, Notas, Alertas) */}
        <div className="space-y-6">
          
          {/* PACIENTES QUE REQUIEREN ATENCIÓN URGENTE */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="font-extrabold text-clinical-dark text-xs uppercase tracking-wider block">Requieren Atención Urgente</span>
            </div>
            
            <div className="space-y-3 font-semibold">
              <div className="bg-red-50/30 border border-red-200 rounded-lg p-3 space-y-1">
                <span className="font-extrabold text-red-750 block">Roberto Valdés</span>
                <span className="text-[10px] text-slate-500 block">Ideación Suicida Detectada</span>
                <p className="text-slate-600 font-medium text-[11px] mt-0.5">El paciente refirió descompensación y pensamientos de desesperanza. Requiere escalamiento clínico.</p>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => alert('Escalando caso de Roberto Valdés con supervisor y psiquiatría de guardia.')}
                    className="text-[9px] font-bold text-red-700 hover:underline"
                  >
                    Escalar Caso →
                  </button>
                </div>
              </div>

              <div className="bg-amber-50/30 border border-amber-200 rounded-lg p-3 space-y-1">
                <span className="font-extrabold text-amber-750 block">Ana María Ruiz</span>
                <span className="text-[10px] text-slate-500 block">Caso Estancado en Sesión 5</span>
                <p className="text-slate-600 font-medium text-[11px] mt-0.5">Paciente con TOC de verificación rígido. No está realizando las prescripciones paradojales.</p>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => navigate('/supervision')}
                    className="text-[9px] font-bold text-clinical-teal hover:underline"
                  >
                    Solicitar Supervisión →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NOTAS Y ALERTAS (BORRADORES DE SENDA PENDIENTES) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-100 pb-2">Borradores de Senda Pendientes</span>
            
            <div className="space-y-2">
              <div className="p-3 border border-slate-100 rounded bg-slate-50/50 flex flex-col justify-between gap-2">
                <div>
                  <span className="font-bold text-clinical-dark block">Borrador sugerido por Senda</span>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Caso: Sofía Martínez • Sesión 2</span>
                  <p className="text-[11px] text-slate-600 mt-1 leading-normal font-medium">"Prescribir la maniobra de la peor fantasía de 30 minutos a las 18:00..."</p>
                </div>
                <button 
                  onClick={() => navigate('/expedientes?id=patient-1')}
                  className="text-[10px] font-bold text-clinical-teal hover:underline block text-left"
                >
                  Revisar e Insertar Borrador →
                </button>
              </div>
            </div>
          </div>

          {/* CONTENIDO SECUNDARIO (COLAPSABLE / ACORDEÓN) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <button
              onClick={() => setShowSecondaryContent(!showSecondaryContent)}
              className="w-full flex items-center justify-between font-bold text-[10px] text-slate-500 uppercase tracking-wide focus:outline-none"
            >
              <span>Información Secundaria (Supervisión y Formación)</span>
              {showSecondaryContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSecondaryContent && (
              <div className="mt-4 pt-3 border-t border-slate-150 space-y-3.5 animate-fadeIn">
                
                {/* Supervisiones solicitadas */}
                <div className="space-y-1">
                  <span className="font-bold text-clinical-dark block text-[10px] uppercase">Supervisiones Solicitadas</span>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span>Sesión 2 (Sofía Martínez)</span>
                    <span className="text-amber-600 text-[9px] font-bold">En Revisión</span>
                  </div>
                </div>

                {/* Formación pendiente */}
                <div className="space-y-1">
                  <span className="font-bold text-clinical-dark block text-[10px] uppercase">Mi Capacitación Pendiente</span>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span>Uso Ético de Senda IA</span>
                    <span className="text-red-650 text-[9px] font-bold">Pendiente (Límite: 2026-09-15)</span>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
