import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, Clock, User, Phone } from 'lucide-react';
import { RiskAlert } from '../types/clinical';

interface CrisisIncidentDetailModalProps {
  alert: RiskAlert;
  onClose: () => void;
}

export const CrisisIncidentDetailModal: React.FC<CrisisIncidentDetailModalProps> = ({
  alert,
  onClose
}) => {
  const details = alert.resolutionDetails;

  const contactOutcomeLabel: Record<string, string> = {
    paciente_directo: 'Contacto Directo con Paciente',
    persona_apoyo: 'Contacto con Persona de Apoyo / Familiar',
    sin_respuesta: 'Sin Respuesta (Protocolo Externo)',
    falsa_alarma: 'Falsa Alarma o Pulsación Involuntaria'
  };

  const riskBadgeColor: Record<string, string> = {
    bajo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medio: 'bg-amber-100 text-amber-800 border-amber-200',
    alto: 'bg-rose-100 text-rose-800 border-rose-200',
    inminente: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-slate-900 text-white p-5 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                  Caso Resuelto y Auditado
                </span>
                <span className="text-[10px] font-mono text-slate-400">ID: {alert.id}</span>
              </div>
              <h2 className="text-base font-bold mt-1">Acta de Resolución Clínica: {alert.patientName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Atendido por <b className="text-white">{alert.resolvedBy || 'Especialista clínico'}</b>
                {alert.resolvedAt && (
                  <span> · {new Date(alert.resolvedAt).toLocaleString('es-MX')}</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">

          {/* Motivo original de la alerta */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Motivo de Escalado Inicial</span>
            <p className="font-semibold text-slate-700">{alert.message}</p>
            <span className="text-[10px] text-slate-500 block">
              Registrado: {new Date(alert.timestamp).toLocaleString('es-MX')}
            </span>
          </div>

          {details ? (
            <>
              {/* Triaje y Nivel de Riesgo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Canal de Contacto</span>
                  <span className="font-bold text-clinical-dark block text-xs">
                    {contactOutcomeLabel[details.contactOutcome] || details.contactOutcome}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Nivel de Riesgo Evaluado</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase ${riskBadgeColor[details.riskLevelAssessed] || 'bg-slate-100 text-slate-800'}`}>
                    {details.riskLevelAssessed}
                  </span>
                </div>
              </div>

              {/* Acciones clínicas */}
              {details.actionsTaken && details.actionsTaken.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Acciones e Intervenciones Ejecutadas
                  </span>
                  <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                    {details.actionsTaken.map((act, i) => (
                      <div key={i} className="flex items-start gap-2 text-emerald-950 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota Clínica de Intervención */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Nota Clínica de Intervención (Expediente Legal)
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium leading-relaxed">
                  {details.clinicalNote}
                </div>
              </div>

              {/* Pautas para el paciente */}
              {details.patientInstructions && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Indicaciones Enviadas al Portal del Paciente
                  </span>
                  <div className="bg-teal-50/40 border border-teal-200 rounded-xl p-3 text-clinical-dark font-medium leading-relaxed italic">
                    "{details.patientInstructions}"
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-slate-400 italic">
              Este caso fue resuelto en una versión anterior sin registro de protocolo detallado.
            </div>
          )}

          {/* Sello de cierre */}
          <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Certificado digital de atención en crisis BreveMente</span>
            <span className="font-mono text-[10px]">Trazabilidad ✓</span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
