import React, { useState } from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, User, Sparkles, BookOpen } from 'lucide-react';
import { Patient, Role, SupervisionLog } from '../types/clinical';
import { supervisionLogService } from '../services/supervisionLogService';

interface SupervisionLogModalProps {
  patient: Patient;
  userName: string;
  userRole: Role;
  sessionCount: number;
  onClose: () => void;
  onSaved: (log: SupervisionLog) => void;
}

export const SupervisionLogModal: React.FC<SupervisionLogModalProps> = ({
  patient,
  userName,
  userRole,
  sessionCount,
  onClose,
  onSaved
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supervisorName, setSupervisorName] = useState(
    userRole === 'supervisor' ? userName : 'Dra. Isabel Cárdenas'
  );
  const [supervisorLicense, setSupervisorLicense] = useState('CED-9988221-MX');
  const [sessionNumber, setSessionNumber] = useState(sessionCount > 0 ? sessionCount : 1);
  const [spr, setSpr] = useState('SPR Fóbico');
  const [ts, setTs] = useState('Ataque de Pánico');
  const [problemDefinition, setProblemDefinition] = useState(
    `Cuadro fóbico agudo con evitación situacional. Motivo: "${patient.motif || 'Crisis de ansiedad'}"`
  );
  const [currentSituation, setCurrentSituation] = useState(
    'Evolución favorable con reducción de síntomas tras prescripciones estratégicas iniciales.'
  );
  const [therapistProblem, setTherapistProblem] = useState(
    'Dificultad para desmontar la solución intentada de pedir ayuda continua a la familia.'
  );
  const [rst, setRst] = useState('Fantasía del peor escenario y redefinición paradójica del síntoma.');
  const [px, setPx] = useState('Worry-Time (WF 30 min) a las 18:00 hrs + Diario de a Bordo.');
  const [eff, setEff] = useState('Disminución de crisis espontáneas y aumento de autonomía personal.');
  const [doubt, setDoubt] = useState('¿En qué momento retirar el acompañante familiar al salir a la calle?');
  const [blocking, setBlocking] = useState('Miedo a perder el control en transporte público.');
  const [observations, setObservations] = useState(
    'El terapeuta maneja adecuadamente el lenguaje hipnótico e indirecto. Debe mantener la postura no juzgadora.'
  );
  const [recommendations, setRecommendations] = useState(
    'Prescribir simulacros voluntarios en trayectos cortos sin anunciar a los familiares. Monitorear adherencia en la siguiente sesión.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newLog = supervisionLogService.addLog(
        {
          date,
          supervisorName,
          supervisorLicense,
          patientId: patient.id,
          patientName: patient.name,
          therapistId: patient.therapistId || 'therapist-1',
          therapistName: patient.therapistName || userName,
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
        },
        { id: 'user-current', name: userName, role: userRole }
      );
      onSaved(newLog);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar la bitácora de supervisión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-clinical-dark text-white p-5 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-clinical-teal" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-clinical-teal">
                Supervisión Clínica · Modelo Arezzo (TBE)
              </span>
              <h2 className="text-base font-bold mt-0.5">
                Nueva Bitácora de Supervisión: {patient.name}
              </h2>
              <p className="text-xs text-slate-300">
                Terapeuta: <b>{patient.therapistName || userName}</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">

          {/* Fila 1: Supervisor, Cédula, Sesión, Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Supervisor Clínico</label>
              <input
                type="text"
                required
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Cédula Profesional</label>
              <input
                type="text"
                required
                value={supervisorLicense}
                onChange={e => setSupervisorLicense(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Sesión Supervisada</label>
              <input
                type="number"
                min="1"
                required
                value={sessionNumber}
                onChange={e => setSessionNumber(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-bold focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Fecha Supervisión</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
          </div>

          {/* Fila 2: Diagnóstico Estratégico (SPR y TS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
                Sistema Perceptivo-Reactivo (SPR)
              </label>
              <select
                value={spr}
                onChange={e => setSpr(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white font-bold focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              >
                <option value="SPR Fóbico">SPR Fóbico</option>
                <option value="SPR Obsesivo-Compulsivo">SPR Obsesivo-Compulsivo</option>
                <option value="SPR Paranoide">SPR Paranoide</option>
                <option value="SPR Depresivo">SPR Depresivo</option>
                <option value="SPR Dismórfico">SPR Dismórfico</option>
                <option value="SPR Hipocondríaco">SPR Hipocondríaco</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
                Trastorno Estratégico (TS)
              </label>
              <select
                value={ts}
                onChange={e => setTs(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white font-bold focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              >
                <option value="Ataque de Pánico">Ataque de Pánico</option>
                <option value="Agorafobia">Agorafobia</option>
                <option value="Fobia Social">Fobia Social</option>
                <option value="Trastorno Obsesivo Compulsivo">Trastorno Obsesivo Compulsivo</option>
                <option value="Ansiedad Generalizada">Ansiedad Generalizada</option>
                <option value="Duelo Bloqueado">Duelo Bloqueado</option>
                <option value="Trastorno de la Alimentación">Trastorno de la Alimentación</option>
              </select>
            </div>
          </div>

          {/* Fila 3: Definición del Problema y Situación Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
                Definición del Problema y Solución Intentada
              </label>
              <textarea
                rows={2}
                value={problemDefinition}
                onChange={e => setProblemDefinition(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
                Situación Clínica Actual
              </label>
              <textarea
                rows={2}
                value={currentSituation}
                onChange={e => setCurrentSituation(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
          </div>

          {/* Fila 4: Problema del Terapeuta, Reestructuración (RST), Prescripciones (PX), Efecto (EFF) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              Maniobras Terapéuticas y Evolución Técnica
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 text-[10px] uppercase mb-1">
                  Problema del Terapeuta (Dificultades en Sesión)
                </label>
                <input
                  type="text"
                  value={therapistProblem}
                  onChange={e => setTherapistProblem(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] uppercase mb-1">
                  Reestructuración (RST)
                </label>
                <input
                  type="text"
                  value={rst}
                  onChange={e => setRst(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] uppercase mb-1">
                  Prescripciones / Tareas Asignadas (PX)
                </label>
                <input
                  type="text"
                  value={px}
                  onChange={e => setPx(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] uppercase mb-1">
                  Efecto Observado o Esperado (EFF)
                </label>
                <input
                  type="text"
                  value={eff}
                  onChange={e => setEff(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Fila 5: Duda planteada y Bloqueos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-amber-800 uppercase text-[10px] mb-1">
                Duda Técnica del Terapeuta
              </label>
              <textarea
                rows={2}
                value={doubt}
                onChange={e => setDoubt(e.target.value)}
                className="w-full p-2.5 border border-amber-200 bg-amber-50/30 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block font-bold text-rose-800 uppercase text-[10px] mb-1">
                Bloqueo Detectado en el Caso (Blocking)
              </label>
              <textarea
                rows={2}
                value={blocking}
                onChange={e => setBlocking(e.target.value)}
                className="w-full p-2.5 border border-rose-200 bg-rose-50/30 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          </div>

          {/* Fila 6: Observaciones y Recomendaciones del Supervisor */}
          <div className="space-y-3 bg-teal-50/40 border border-teal-200 rounded-xl p-4">
            <span className="font-bold text-clinical-teal uppercase tracking-wider text-[10px] block">
              Dictamen y Recomendaciones del Supervisor
            </span>
            <div>
              <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">
                Observaciones Clínicas del Supervisor
              </label>
              <textarea
                rows={2}
                required
                value={observations}
                onChange={e => setObservations(e.target.value)}
                className="w-full p-2.5 border border-teal-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">
                Recomendaciones Prescriptivas y Maniobras de Cierre
              </label>
              <textarea
                rows={2}
                required
                value={recommendations}
                onChange={e => setRecommendations(e.target.value)}
                className="w-full p-2.5 border border-teal-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-clinical-teal font-medium"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-clinical-teal" />
              <span>Firmar y Guardar Bitácora de Supervisión</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
