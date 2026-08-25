import React from 'react';
import { AlertOctagon, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Role } from '../types/clinical';

interface RiskAlertBannerProps {
  patientName: string;
  message: string;
  onEscalate?: () => void;
  onResolve?: () => void;
  userRole: Role;
  isResolved?: boolean;
}

export const RiskAlertBanner: React.FC<RiskAlertBannerProps> = ({
  patientName,
  message,
  onEscalate,
  onResolve,
  userRole,
  isResolved = false
}) => {
  if (isResolved) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="bg-red-100 p-2 rounded-lg text-red-600 shrink-0 mt-0.5 md:mt-0">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
            ⚠️ ALERTA DE RIESGO CLÍNICO DETECTADO
          </span>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            Paciente: <span className="underline">{patientName}</span>
          </p>
          <p className="text-xs text-red-700 mt-1">
            Motivo detectado: &ldquo;{message}&rdquo;
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        {onEscalate && (
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Escalar a Supervisor
          </button>
        )}
        
        {onResolve && (userRole === 'supervisor' || userRole === 'therapist' || userRole === 'admin_clinical') && (
          <button
            onClick={onResolve}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-300 hover:bg-red-100 text-red-800 rounded-lg text-xs font-semibold transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Marcar Resuelto
          </button>
        )}
      </div>
    </div>
  );
};
