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
    <div className="bg-red-600 text-white rounded-lg shadow-lg px-3 py-2 flex flex-col gap-1.5 text-xs">
      {/* Fila 1: aviso compacto + acciones */}
      <div className="flex items-center gap-2 flex-wrap">
        <AlertOctagon className="w-4 h-4 text-white shrink-0" />
        <span className="font-extrabold uppercase tracking-wide text-[10px] shrink-0">⚠ Alerta de riesgo</span>
        <span className="font-semibold">Paciente: <span className="underline">{patientName}</span></span>
        <span className="hidden xl:inline text-red-100 truncate max-w-xs">&ldquo;{message}&rdquo;</span>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {onEscalate && (
            <button
              onClick={onEscalate}
              className="flex items-center gap-1 px-2.5 py-1 bg-white text-red-700 rounded font-bold text-[10px] shadow-sm transition-all hover:bg-red-50"
            >
              <ArrowUpRight className="w-3 h-3" />
              Escalar
            </button>
          )}
          {onResolve && (userRole === 'supervisor' || userRole === 'therapist' || userRole === 'admin_clinical') && (
            <button
              onClick={onResolve}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-800 border border-red-500 text-white rounded font-bold text-[10px] transition-all hover:bg-red-700"
            >
              <CheckCircle2 className="w-3 h-3" />
              Resuelto
            </button>
          )}
        </div>
      </div>

      {/* Fila 2 (delgada): recursos de crisis siempre visibles */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-red-100 font-semibold">
        <span>Recursos de atención inmediata (24/7):</span>
        <span>Línea de la Vida <b className="text-white">800 911 2000</b></span>
        <span>·</span>
        <span>Guardia BreveMente <b className="text-white">+52 55 9000 8000</b></span>
      </div>
    </div>
  );

};
