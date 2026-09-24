import React, { useState } from 'react';
import { Shield, FileText, CheckSquare, Square, PenTool } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onAccept: (registryMode: 'ia' | 'manual') => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onClose, patientName, onAccept }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedRecording, setAcceptedRecording] = useState(true);
  const [signatureName, setSignatureName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError('Debe aceptar los términos de privacidad y consentimiento informado.');
      return;
    }
    if (!signatureName.trim()) {
      setError('Debe ingresar su nombre completo como firma digital.');
      return;
    }
    
    // Si acepta grabación, el modo de registro es 'ia', sino 'manual'
    onAccept(acceptedRecording ? 'ia' : 'manual');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-clinical-dark text-white">
          <Shield className="w-6 h-6 text-clinical-accent" />
          <div>
            <h2 className="text-xl font-bold">Consentimiento Informado y Privacidad</h2>
            <p className="text-xs text-slate-300">BreveMente - Sistema de Terapia Breve Estratégica</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="bg-blue-50 border-l-4 border-clinical-accent p-4 rounded-r-lg text-xs text-clinical-dark flex items-start gap-3">
            <FileText className="w-5 h-5 text-clinical-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Importante para: {patientName}</span>
              <p className="mt-1">
                Este documento es un registro legal e institucional del consentimiento para recibir servicios de salud mental y el tratamiento de sus datos clínicos sensibles según las normas de confidencialidad médica.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-clinical-dark text-base">1. Tratamiento Psicoterapéutico TBE</h3>
            <p>
              El tratamiento se basará en el modelo de Terapia Breve Estratégica, el cual se enfoca en resolver problemas clínicos mediante intervenciones focalizadas en fases y prescripciones de tareas. El número promedio de sesiones suele ser inferior a 10.
            </p>

            <h3 className="font-semibold text-clinical-dark text-base">2. Confidencialidad y Seguridad de Datos</h3>
            <p>
              Todos sus datos clínicos, diagnósticos operativos, sesiones y datos de identificación personal están estrictamente protegidos. El acceso a su expediente clínico está restringido únicamente al terapeuta asignado, supervisor clínico y médicos psiquiatras autorizados en el circuito clínico, quedando registrado cada acceso en una bitácora de auditoría segura.
            </p>

            <h3 className="font-semibold text-clinical-dark text-base">3. Uso de Asistencia Documental por IA</h3>
            <p>
              Para optimizar la documentación de sus expedientes y el seguimiento de tareas, el terapeuta puede utilizar una herramienta de transcripción y estructuración de notas clínicas asistida por Inteligencia Artificial. La IA opera en un entorno cerrado y local, no almacena datos de forma pública y no sustituye de ninguna forma el criterio o la supervisión directa del terapeuta humano.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4 space-y-4">
            {/* Checkbox Términos */}
            <div 
              className="flex items-start gap-3 cursor-pointer select-none"
              onClick={() => setAcceptedTerms(!acceptedTerms)}
            >
              {acceptedTerms ? (
                <CheckSquare className="w-5 h-5 text-clinical-accent shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <span className="text-xs text-slate-700">
                Acepto los términos de consentimiento informado para el tratamiento psicoterapéutico y autorizo el resguardo confidencial de mi expediente según las políticas de privacidad.
              </span>
            </div>

            {/* Checkbox Grabación */}
            <div 
              className="flex items-start gap-3 cursor-pointer select-none bg-slate-50 p-3 rounded-lg border border-slate-100"
              onClick={() => setAcceptedRecording(!acceptedRecording)}
            >
              {acceptedRecording ? (
                <CheckSquare className="w-5 h-5 text-clinical-teal shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <span className="font-semibold text-clinical-dark block">Autorizo la grabación de audio y análisis con IA asistencial</span>
                <span className="text-slate-500">
                  Permite al sistema grabar partes de la sesión para transcribirlas y pre-llenar los campos clínicos automáticamente bajo supervisión del terapeuta. Si se desmarca, el registro será 100% manual.
                </span>
              </div>
            </div>

            {/* Firma digital */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5 text-slate-500" />
                Firma Digital (Nombre Completo del Paciente):
              </label>
              <input
                type="text"
                placeholder="Escribe tu nombre completo para firmar"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                value={signatureName}
                onChange={(e) => {
                  setSignatureName(e.target.value);
                  setError('');
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-clinical-risk font-semibold bg-red-50 p-2.5 rounded-lg">
                {error}
              </p>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-clinical-accent text-white rounded-lg text-xs font-semibold hover:bg-clinical-accentHover transition-colors"
              >
                Firmar y Confirmar Consentimiento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
