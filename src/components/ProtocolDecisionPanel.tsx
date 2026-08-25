import React, { useState } from 'react';
import { GitBranch, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ProtocolDecisionPanelProps {
  selectedProtocol: string;
  selectedDxOp: string;
  currentPhase: string;
  selectedPx: string[];
  onChangePx: (px: string[]) => void;
  onLogAudit: (action: string, details: string) => void;
}

const PROTOCOL_DATABASE: Record<string, {
  phases: string[];
  dxOpMatches: string[];
  suggestedManeuvers: Record<string, string[]>;
  advanceCondition: Record<string, string>;
}> = {
  'Ataque de Pánico': {
    phases: ['Socialización', 'Intervención', 'Consolidación', 'Cierre'],
    dxOpMatches: ['SPR Fóbico', 'SPR Fóbico Obsesivo', 'SPR Obsesivo Fóbico'],
    suggestedManeuvers: {
      'Socialización': ['Diario de abordo', 'Cómo empeorar'],
      'Intervención': ['Diario de abordo', 'WF 30 min', 'WF 5 veces x 5 min', 'WF preventivo - necesidad'],
      'Consolidación': ['Exposición controlada', 'Diario de abordo residual', 'Disminución de citas'],
      'Cierre': ['Seguimiento a 3 meses', 'Seguimiento a 6 meses', 'Alta definitiva']
    },
    advanceCondition: {
      'Socialización': 'Reducción de crisis agudas o contención mediante registro del Diario de a bordo.',
      'Intervención': 'Extinción de crisis espontáneas mediante la práctica de la Peor Fantasía (Worry-Time).',
      'Consolidación': 'Evidencia de autonomía completa y desaparición de conductas de evitación.',
      'Cierre': 'Mantenimiento del equilibrio a lo largo del tiempo.'
    }
  },
  'Miedo a perder el control tipo 1: hablar en público': {
    phases: ['Socialización', 'Intervención', 'Cierre'],
    dxOpMatches: ['SPR Fóbico', 'SPR Paranoico'],
    suggestedManeuvers: {
      'Socialización': ['Declarar el secreto', 'Cómo empeorar'],
      'Intervención': ['Declarar el secreto', 'Exposición voluntaria corta', 'Temblor intencional'],
      'Cierre': ['Seguimiento', 'Alta']
    },
    advanceCondition: {
      'Socialización': 'Aceptación de la declaración voluntaria y reducción del bloqueo inicial.',
      'Intervención': 'Exposiciones exitosas sin evitación.',
      'Cierre': 'Autonomía en exposiciones públicas.'
    }
  }
};

export const ProtocolDecisionPanel: React.FC<ProtocolDecisionPanelProps> = ({
  selectedProtocol,
  selectedDxOp,
  currentPhase,
  selectedPx,
  onChangePx,
  onLogAudit
}) => {
  const [justification, setJustification] = useState('');
  const [showJustification, setShowJustification] = useState(false);

  const protocolData = PROTOCOL_DATABASE[selectedProtocol] || {
    phases: ['Fase única'],
    dxOpMatches: [],
    suggestedManeuvers: { 'Fase única': ['General TBE'] },
    advanceCondition: { 'Fase única': 'Criterio clínico del terapeuta' }
  };

  const suggested = protocolData.suggestedManeuvers[currentPhase] || [];
  const advanceConditionText = protocolData.advanceCondition[currentPhase] || 'Criterio general';

  // Verificar si hay desviación del diagnóstico operativo
  const isDxOpDeviated = selectedDxOp && protocolData.dxOpMatches.length > 0 && !protocolData.dxOpMatches.includes(selectedDxOp);

  // Verificar si las prescripciones seleccionadas se desvían de las sugeridas
  const deviatedPx = selectedPx.filter(p => !suggested.includes(p) && p !== 'Otro');
  const isPxDeviated = deviatedPx.length > 0;
  const isDeviated = isDxOpDeviated || isPxDeviated;

  const handleTogglePx = (pxName: string) => {
    let nextPx = [...selectedPx];
    if (nextPx.includes(pxName)) {
      nextPx = nextPx.filter(p => p !== pxName);
    } else {
      nextPx.push(pxName);
    }
    onChangePx(nextPx);

    // Si hay desviación, mostrar el input de justificación
    const isNowDeviated = nextPx.some(p => !suggested.includes(p)) || isDxOpDeviated;
    if (isNowDeviated) {
      setShowJustification(true);
    } else {
      setShowJustification(false);
    }
  };

  const handleSaveJustification = () => {
    if (justification.trim()) {
      onLogAudit(
        'Justificación de Desviación de Protocolo',
        `Protocolo: ${selectedProtocol}. Fase: ${currentPhase}. Justificación: "${justification}". Dx.Op: ${selectedDxOp}. Px: ${selectedPx.join(', ')}`
      );
      alert('Justificación clínica registrada en la bitácora de auditoría.');
      setShowJustification(false);
    } else {
      alert('Debe ingresar una justificación clínica válida.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-clinical-accent" />
          <h3 className="text-sm font-bold text-clinical-dark">Motor de Protocolo Clínico TBE</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-clinical-accent rounded-full border border-blue-100">
          Protocolo Activo: {selectedProtocol || 'Ninguno'}
        </span>
      </div>

      {/* Grid de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Info Fase */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
          <span className="font-semibold text-slate-500 block">Fase del Modelo TBE:</span>
          <span className="text-sm font-bold text-clinical-dark block">{currentPhase}</span>
          <span className="text-slate-400 block mt-2 font-medium">Condición de Avance:</span>
          <span className="text-slate-600 block leading-relaxed">{advanceConditionText}</span>
        </div>

        {/* Diagnósticos Operativos Permitidos */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
          <span className="font-semibold text-slate-500 block">Diagnóstico Operativo (Dx.OP):</span>
          <span className="text-sm font-bold text-clinical-dark block">{selectedDxOp || 'Sin seleccionar'}</span>
          <span className="text-slate-400 block mt-2 font-medium">Dx.OP Sugeridos para {selectedProtocol}:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {protocolData.dxOpMatches.map(dx => (
              <span 
                key={dx} 
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedDxOp === dx 
                    ? 'bg-clinical-teal/10 border-clinical-teal text-clinical-teal'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                {dx}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas de Desviación */}
      {isDeviated && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                ⚠️ DESVIACIÓN DEL PROTOCOLO ESTÁNDAR
              </span>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Se detectaron parámetros fuera de la guía clínica estándar para <b>{selectedProtocol} ({currentPhase})</b>.
                {isDxOpDeviated && <span className="block mt-1">• El Diagnóstico Operativo &quot;{selectedDxOp}&quot; no coincide con el estándar.</span>}
                {isPxDeviated && <span className="block mt-0.5">• Prescripciones no estándar seleccionadas: &quot;{deviatedPx.join(', ')}&quot;.</span>}
              </p>
            </div>
          </div>

          {/* Justificación obligatoria */}
          {(showJustification || !justification) && (
            <div className="border-t border-amber-200 pt-2.5 mt-1 space-y-2">
              <label className="block text-[11px] font-semibold text-amber-900">
                Justificación clínica requerida (se grabará en la bitácora de auditoría):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Paciente presenta alta resistencia y amerita intervenciones directas..."
                  className="flex-1 px-3 py-1.5 border border-amber-300 bg-white rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <button
                  onClick={handleSaveJustification}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Registrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prescripciones / Maniobras */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-clinical-teal" />
          Prescripciones / Maniobras Sugeridas (Fase: {currentPhase}):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggested.map((pxName) => {
            const isChecked = selectedPx.includes(pxName);
            return (
              <div
                key={pxName}
                onClick={() => handleTogglePx(pxName)}
                className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between ${
                  isChecked
                    ? 'bg-clinical-accent/5 border-clinical-accent text-clinical-accent font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="rounded border-slate-300 text-clinical-accent focus:ring-clinical-accent w-3.5 h-3.5"
                  />
                  <span className="text-xs">{pxName}</span>
                </div>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
            );
          })}

          {/* Opción de agregar otra prescripción */}
          <div
            onClick={() => handleTogglePx('Intervención personalizada')}
            className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between ${
              selectedPx.includes('Intervención personalizada')
                ? 'bg-amber-50 border-amber-400 text-amber-800 font-semibold'
                : 'bg-white border-dashed border-slate-300 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPx.includes('Intervención personalizada')}
                readOnly
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span className="text-xs">
                {selectedPx.includes('Intervención personalizada') ? 'Intervención personalizada (Desviación)' : '+ Agregar otra prescripción'}
              </span>
            </div>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
