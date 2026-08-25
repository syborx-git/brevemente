import React, { useState } from 'react';
import { 
  Eye, Plus, Save, Paperclip, Send, FileCheck, Play, Pause, 
  Clock, AlertTriangle, ShieldAlert, CheckCircle, MessageSquare, ChevronRight 
} from 'lucide-react';
import { Role, Patient, SupervisionLog } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';
import { mockRecordingAnnotations, mockRecordingTranscript } from '../services/academicData';

interface SupervisionProps {
  userRole: Role;
  patients: Patient[];
  userName: string;
}

export const Supervision: React.FC<SupervisionProps> = ({ userRole, patients, userName }) => {
  const [selectedPatientId, setSelectedPatientId] = useState('patient-1');
  const activePatient = patients.find(p => p.id === selectedPatientId);

  // Historial de supervisión
  const [logs, setLogs] = useState<SupervisionLog[]>([
    {
      id: 'sup-1',
      date: '2026-08-18',
      supervisorName: 'Dra. Isabel Cárdenas',
      supervisorLicense: 'CED-9988221-MX',
      patientId: 'patient-1',
      patientName: 'Sofía Martínez',
      therapistId: 'therapist-1',
      therapistName: 'Dr. Alejandro Silva',
      sessionNumber: 2,
      problemDefinition: 'Ataques de pánico agudos. Solución intentada dominante de evitación y demanda de compañía.',
      currentSituation: 'Favorable, disminución de crisis agudas tras diario de abordo.',
      spr: 'SPR Fóbico',
      ts: 'Ataque de Pánico',
      therapistProblem: 'Resistencia sutil al cambio al no querer realizar sola la peor fantasía.',
      rst: 'Fantasía del peor escenario prescrita.',
      px: 'WF 30 min diario.',
      eff: 'Excelente disminución del miedo.',
      doubt: '¿Cómo modular la resistencia al salir sola a trabajar?',
      blocking: 'Evitación persistente del metro.',
      observations: 'El terapeuta debe aplicar redefinición paradójica en la evitación del metro.',
      recommendations: 'Prescribir pequeños temblores o simulacros voluntarios en el metro acompañados de un Diario de Abordo preventivo.'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'bitacoras' | 'grabaciones'>('bitacoras');

  // Form states
  const [supervisorName, setSupervisorName] = useState(userRole === 'supervisor' ? userName : 'Dra. Isabel Cárdenas');
  const [license, setLicense] = useState('CED-9988221-MX');
  const [sessionNumber, setSessionNumber] = useState(3);
  const [problemDefinition, setProblemDefinition] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [spr, setSpr] = useState('SPR Fóbico');
  const [ts, setTs] = useState('Ataque de Pánico');
  const [therapistProblem, setTherapistProblem] = useState('');
  const [rst, setRst] = useState('');
  const [px, setPx] = useState('');
  const [eff, setEff] = useState('');
  const [doubt, setDoubt] = useState('');
  const [blocking, setBlocking] = useState('');
  const [observations, setObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // --- AUDIO PLAYER SIMULATED STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // en segundos
  const [selectedAnnotationIdx, setSelectedAnnotationIdx] = useState<number | null>(null);
  const [therapistReplyText, setTherapistReplyText] = useState('');
  const [replies, setReplies] = useState<Record<number, string>>({});

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAnnotationClick = (idx: number, sec: number) => {
    setSelectedAnnotationIdx(idx);
    setCurrentTime(sec);
    // Simular salto de audio
  };

  const handleAddReply = (idx: number) => {
    if (!therapistReplyText.trim()) return;
    setReplies({ ...replies, [idx]: therapistReplyText });
    setTherapistReplyText('');
    
    // Registrar auditoría
    auditLogService.addLog(
      'Respuesta a supervisión',
      `Terapeuta respondió a anotación de supervisión en minuto ${mockRecordingAnnotations[idx].time}: "${therapistReplyText.substring(0, 30)}..."`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('Respuesta registrada localmente y notificada al supervisor.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const newLog: SupervisionLog = {
      id: `sup-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supervisorName,
      supervisorLicense: license,
      patientId: selectedPatientId,
      patientName: activePatient.name,
      therapistId: 'therapist-1',
      therapistName: 'Dr. Alejandro Silva',
      sessionNumber,
      problemDefinition,
      currentSituation,
      spr,
      ts,
      therapistProblem,
      rst,
      px,
      eff,
      doubt,
      blocking,
      observations,
      recommendations
    };

    setLogs([newLog, ...logs]);
    setIsCreating(false);

    // Registrar en auditoría
    auditLogService.addLog(
      'Creación de bitácora',
      `Creó bitácora de supervisión clínica para el paciente ${activePatient.name} (Sesión: ${sessionNumber}).`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );

    // Resetear
    setProblemDefinition('');
    setCurrentSituation('');
    setTherapistProblem('');
    setRst('');
    setPx('');
    setEff('');
    setDoubt('');
    setBlocking('');
    setObservations('');
    setRecommendations('');
    alert('Bitácora de supervisión registrada localmente.');
  };

  const handleAnex = (patName: string) => {
    auditLogService.addLog(
      'Actualización de expediente',
      `Anexó reporte de supervisión clínica formal al expediente de ${patName}`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('✓ Anexado: Bitácora de supervisión añadida formalmente a los documentos del paciente.');
  };

  const handleSendTherapist = (therName: string) => {
    auditLogService.addLog(
      'Envío de bitácora',
      `Envió las recomendaciones y bitácora de supervisión cifrada al buzón del terapeuta ${therName}`,
      'seguridad',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert(`✓ Enviado: Recomendaciones de supervisión notificadas al terapeuta ${therName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Supervisión Clínica y Auditoría Técnica</h2>
          <p className="text-xs text-clinical-textMuted">
            Supervisión técnica de casos, revisión de grabaciones consentidas y desbloqueo de desviaciones de protocolo.
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('bitacoras')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'bitacoras' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500'}`}
          >
            Bitácoras Clínicas
          </button>
          <button
            onClick={() => setActiveTab('grabaciones')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'grabaciones' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500'}`}
          >
            Revisión de Grabaciones
          </button>
        </div>
      </div>

      {/* VISTA 1: BITÁCORAS DE CASO */}
      {activeTab === 'bitacoras' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="supervision-workspace">
          {/* Formulario o Lista Historial */}
          <div className="lg:col-span-2 space-y-4">
            {isCreating ? (
              <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-600 font-semibold">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-clinical-accent" />
                    <h3 className="text-sm font-bold text-clinical-dark">Registrar Sesión de Supervisión</h3>
                  </div>
                  <button
                    type="button"
                    className="font-bold text-slate-400 hover:text-slate-700"
                    onClick={() => setIsCreating(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Paciente Supervisado:</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Nombre Supervisor:</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Cédula Supervisor:</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Sesión # del Caso:</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={sessionNumber}
                      onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Diagnóstico Operativo (Dx.OP):</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={spr}
                      onChange={(e) => setSpr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Trastorno Estratégico (TS):</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={ts}
                      onChange={(e) => setTs(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Definición Problema Caso:</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={problemDefinition}
                      onChange={(e) => setProblemDefinition(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Situación Actual del Caso:</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={currentSituation}
                      onChange={(e) => setCurrentSituation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Definición Problema del Terapeuta (Dudas/Bloqueos):</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={therapistProblem}
                      onChange={(e) => setTherapistProblem(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Reestructuración Sugerida (RST):</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={rst}
                      onChange={(e) => setRst(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Observaciones Generales:</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Recomendaciones del Supervisor:</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-55"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold shadow flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Bitácora
                  </button>
                </div>
              </form>
            ) : (
              /* Historial de bitácoras */
              <div className="space-y-4 font-semibold text-xs text-slate-650">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-650 leading-relaxed font-semibold">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-extrabold text-clinical-dark text-xs block">Caso: {log.patientName} (Sesión {log.sessionNumber})</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Supervisor: {log.supervisorName} (Registro: {log.date})</span>
                      </div>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-750 border border-purple-200 rounded-[4px] font-bold uppercase text-[9px]">
                        Supervisión Técnica
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-450 block uppercase text-[9px]">Diagnóstico de Situación:</span>
                        <p className="mt-0.5 text-slate-750 font-medium">{log.problemDefinition}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-455 block uppercase text-[9px]">Evolución/Estado:</span>
                        <p className="mt-0.5 text-slate-750 font-medium">{log.currentSituation}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-150">
                      <div>
                        <span className="font-bold text-clinical-dark block">Problema del Terapeuta (Duda):</span>
                        <p className="mt-0.5 text-slate-600 font-medium">{log.therapistProblem || 'Ninguno reportado'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-clinical-dark block">Recomendación del Supervisor:</span>
                        <p className="mt-0.5 text-slate-700 font-extrabold">{log.recommendations}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                      {['supervisor', 'academic_coordinator', 'admin_clinical'].includes(userRole) && (
                        <button
                          onClick={() => handleSendTherapist(log.therapistName)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-600 transition-colors shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5 text-slate-450" />
                          Enviar al Terapeuta
                        </button>
                      )}
                      <button
                        onClick={() => handleAnex(log.patientName)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded text-[10px] font-bold shadow-sm transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-300" />
                        Anexar al Expediente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Lateral: Concepto de Supervisión */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit text-xs text-slate-650 leading-normal">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCheck className="w-4 h-4 text-[#75AFBC]" />
                <span className="font-bold text-clinical-dark uppercase">Supervisión en Arezzo TBE</span>
              </div>
              <p>
                La supervisión clínica en el modelo de Terapia Breve Estratégica se enfoca en resolver los &ldquo;bloqueos de la intervención&rdquo; provocados usualmente por la resistencia del paciente o la falta de rigor del terapeuta al aplicar la maniobra prescrita.
              </p>
              <p className="font-semibold text-clinical-dark bg-blue-50/50 p-2.5 rounded border border-blue-100">
                El supervisor audita la concordancia del protocolo, verifica las notas del expediente y firma las recomendaciones del caso.
              </p>
            </div>

            {/* Listado de Casos pendientes de supervisión */}
            {['supervisor', 'academic_coordinator', 'admin_clinical'].includes(userRole) && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
                <span className="font-bold text-clinical-dark block uppercase tracking-wide border-b border-slate-100 pb-1.5">Casos Pendientes de Auditoría</span>
                <div className="space-y-2 font-semibold">
                  <div className="flex justify-between items-center bg-red-50/30 p-2 border border-red-150 rounded">
                    <div>
                      <span className="font-bold text-clinical-dark block">Sofía Martínez (Sesión 3)</span>
                      <span className="text-[9px] text-red-700 font-bold block uppercase mt-0.5">⚠️ Riesgo Elevado</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedPatientId('patient-1');
                        setActiveTab('grabaciones');
                      }}
                      className="text-[#75AFBC] hover:underline text-[9px] font-bold font-sans"
                    >
                      Revisar grab.
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-200 rounded">
                    <div>
                      <span className="font-bold text-clinical-dark block">Carlos Mendoza (Sesión 11)</span>
                      <span className="text-[9px] text-amber-700 font-bold block uppercase mt-0.5">⚠️ Caso Estancado</span>
                    </div>
                    <button 
                      onClick={() => alert('Abriendo expediente clínico de Carlos Mendoza para supervisión.')}
                      className="text-[#75AFBC] hover:underline text-[9px] font-bold font-sans"
                    >
                      Ver notas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: REPRODUCTOR DE GRABACIONES Y ANOTACIONES TEMPORALES */}
      {activeTab === 'grabaciones' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-650 leading-relaxed font-semibold" data-tour="supervision-recording">
          {/* Header del Reproductor */}
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-clinical-dark uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-[#75AFBC]" />
                Auditoría de Audio y Transcripción Clínica (HITL)
              </h3>
              <p className="text-slate-400 font-semibold mt-0.5">Paciente: {activePatient?.name || 'Sofía Martínez'} • Consentimiento firmado para grabación con IA (Sí)</p>
            </div>
            <div className="flex items-center gap-1.5 font-bold px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              Consentimiento Activo
            </div>
          </div>

          {/* Panel del Reproductor Simulado */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow flex flex-col">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Audio de la Consulta - Sesión 3</span>
              <span className="text-[11px] font-bold">Tiempo: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 15:00</span>
            </div>

            {/* Timeline con marcadores */}
            <div className="relative w-full bg-slate-700 h-2 rounded-full mt-2 cursor-pointer">
              {/* Barra de progreso */}
              <div 
                className="bg-[#75AFBC] h-full rounded-full transition-all" 
                style={{ width: `${(currentTime / 900) * 100}%` }}
              />

              {/* Marcadores de comentarios temporales */}
              {mockRecordingAnnotations.map((ann, idx) => {
                const percent = (ann.audioSec / 900) * 100;
                let markerBg = 'bg-blue-400';
                if (ann.label === 'riesgo') markerBg = 'bg-red-500 scale-110';
                else if (ann.label === 'desviacion') markerBg = 'bg-amber-500 scale-105';
                else if (ann.label === 'prescripcion') markerBg = 'bg-emerald-500';

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnnotationClick(idx, ann.audioSec)}
                    style={{ left: `${percent}%` }}
                    className={`absolute -top-1 w-3 h-3 rounded-full hover:scale-125 border border-white transition-all transform -translate-x-1/2 cursor-pointer ${markerBg} ${selectedAnnotationIdx === idx ? 'ring-2 ring-white ring-offset-2' : ''}`}
                    title={`${ann.time} - [${ann.label.toUpperCase()}]: ${ann.text}`}
                  />
                );
              })}
            </div>

            {/* Controles de reproducción */}
            <div className="flex items-center justify-center gap-4 mt-2 shrink-0">
              <button 
                onClick={handlePlayPause}
                className="p-3 bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-colors shadow"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Sección de detalles del Comentario seleccionado y la Transcripción */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comentario Temporal Seleccionado */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <span className="font-bold text-clinical-dark uppercase block border-b border-slate-100 pb-1.5">Anotaciones del Supervisor</span>
              
              {selectedAnnotationIdx === null ? (
                <div className="text-slate-400 italic text-center py-8">
                  Haz click en un marcador de la barra de reproducción de arriba para examinar el comentario del supervisor en ese segundo específico.
                </div>
              ) : (
                <div className="space-y-4 font-semibold text-xs animate-fadeIn text-slate-650">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-clinical-dark font-extrabold text-xs">Minuto {mockRecordingAnnotations[selectedAnnotationIdx].time}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      mockRecordingAnnotations[selectedAnnotationIdx].label === 'riesgo' ? 'bg-red-100 text-red-800' :
                      mockRecordingAnnotations[selectedAnnotationIdx].label === 'desviacion' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-clinical-dark'
                    }`}>
                      {mockRecordingAnnotations[selectedAnnotationIdx].label.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-normal font-medium bg-white p-3 rounded-lg border border-slate-150">
                    {mockRecordingAnnotations[selectedAnnotationIdx].text}
                  </p>

                  {/* Transcripción asociada al segundo */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-450 block uppercase">Transcripción asociada:</span>
                    <p className="italic text-slate-500 font-medium bg-white/70 p-2.5 rounded border border-slate-100 text-[10px]">
                      "{mockRecordingTranscript[selectedAnnotationIdx % mockRecordingTranscript.length].text}"
                    </p>
                  </div>

                  {/* Respuestas del terapeuta */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <span className="text-[10px] text-slate-500 block uppercase">Respuestas del Terapeuta (Justificación):</span>
                    {replies[selectedAnnotationIdx] ? (
                      <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-150 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <span className="text-[8px] text-slate-450 block uppercase font-bold">Respuesta del Dr. Silva:</span>
                          <span className="font-medium text-[11px]">{replies[selectedAnnotationIdx]}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userRole === 'therapist' ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Justifica o responde a la observación..."
                              className="flex-1 px-3 py-1.5 border border-slate-250 bg-white rounded-lg focus:outline-none text-[10px]"
                              value={therapistReplyText}
                              onChange={(e) => setTherapistReplyText(e.target.value)}
                            />
                            <button
                              onClick={() => handleAddReply(selectedAnnotationIdx)}
                              className="px-3 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white font-bold rounded-lg"
                            >
                              Responder
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic block">Sin justificación cargada por el terapeuta...</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Listado de todas las marcas */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <span className="font-bold text-clinical-dark block uppercase tracking-wide border-b border-slate-100 pb-1.5">Anotaciones Cronológicas de la Sesión</span>
              <div className="space-y-2 font-semibold">
                {mockRecordingAnnotations.map((ann, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAnnotationClick(idx, ann.audioSec)}
                    className={`p-2.5 rounded-lg border cursor-pointer hover:border-[#75AFBC] transition-all flex items-start justify-between gap-3 text-xs bg-white ${selectedAnnotationIdx === idx ? 'border-[#75AFBC] ring-1 ring-[#75AFBC]' : 'border-slate-200'}`}
                  >
                    <div>
                      <span className="font-extrabold text-clinical-dark block">{ann.time} - {ann.label.toUpperCase()}</span>
                      <p className="text-slate-500 font-medium text-[11px] mt-0.5 line-clamp-1">{ann.text}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
