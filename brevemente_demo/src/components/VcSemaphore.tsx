import React from 'react';
import { VC_ESCALA, VcEstado, VC_ESTADO_A_TEXTO, vcEstadoDeTexto } from '../services/vcEscala';

interface VcSemaphoreProps {
  value: string | null;
  onChange: (texto: string) => void;
  readOnly?: boolean;
}

/**
 * Selector visual de 5 estados de Valoración del Cambio (semáforo).
 * Trabaja con los strings legados de VcEntry (persistencia) y traduce
 * internamente a los estados tipados.
 */
export const VcSemaphore: React.FC<VcSemaphoreProps> = ({ value, onChange, readOnly }) => {
  const estado = vcEstadoDeTexto(value);
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Valoración del Cambio">
      {(Object.entries(VC_ESCALA) as Array<[VcEstado, { etiqueta: string; color: string; orden: number }]>).map(([clave, meta]) => (
        <button
          key={clave}
          type="button"
          role="radio"
          aria-checked={estado === clave}
          disabled={readOnly}
          onClick={() => onChange(VC_ESTADO_A_TEXTO[clave])}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold transition-all ${estado === clave ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'}`}
          style={{ borderColor: meta.color, color: meta.color, background: estado === clave ? meta.color + '22' : '#ffffff' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
          {meta.etiqueta}
        </button>
      ))}
    </div>
  );
};

/** Chip de solo lectura para mostrar el estado VC en tablas. */
export const VcChip: React.FC<{ value: string | null }> = ({ value }) => {
  const estado = vcEstadoDeTexto(value);
  if (!estado) return <span className="text-slate-400">—</span>;
  const meta = VC_ESCALA[estado];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold" style={{ borderColor: meta.color, color: meta.color, background: meta.color + '18' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.etiqueta}
    </span>
  );
};
