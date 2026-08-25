import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, X, Send, BookOpen, ShieldAlert, Check, 
  AlertTriangle, ArrowRight, CornerDownLeft, Eye, RotateCcw, PenTool 
} from 'lucide-react';
import { Role } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';

interface SendaSidebarPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role;
  userName: string;
  patientName?: string;
  activeProtocol?: string;
  onAcceptSuggestion?: (text: string) => void;
}

interface SuggestionState {
  text: string;
  source: string;
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
}

export const SendaSidebarPanel: React.FC<SendaSidebarPanelProps> = ({
  isOpen,
  onClose,
  userRole,
  userName,
  patientName,
  activeProtocol,
  onAcceptSuggestion
}) => {
  const navigate = useNavigate();
  const isAcademic = window.location.hash.includes('/campus');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'senda'; text: string; citation?: string }>>([
    { sender: 'senda', text: 'Hola. Soy Senda - Inteligencia asistiva. Estoy analizando el caso activo de salud mental. ¿Deseas que busquemos protocolos autorizados, redactemos un borrador o auditemos notas clínicas?' }
  ]);

  // Borrador diferenciado local para el doble paso
  const [suggestion, setSuggestion] = useState<SuggestionState>({
    text: 'Con base en el Protocolo Ataque de Pánico (TBE-P-01), se sugiere prescribir la maniobra de la Peor Fantasía (Worry-Time) de 30 minutos a las 18:00 para disolver la paradoja del control.',
    source: 'Manual TBE Arezzo, Sección 1.2 (TBE-P-01)',
    status: 'pending'
  });

  const [editText, setEditText] = useState(suggestion.text);

  // Inicializar chat en base al contexto (Clínico vs Formativo)
  useEffect(() => {
    if (isAcademic) {
      setChatHistory([
        { sender: 'senda', text: 'Hola. Soy Senda Formativa, en modalidad formativa y académica del Campus. Puedo explicarte conceptos del corpus TBE (como soluciones intentadas o el SPR), crear preguntas de práctica para tus exámenes o guiar tu estudio.' }
      ]);
    } else {
      setChatHistory([
        { sender: 'senda', text: 'Hola. Soy Senda - Inteligencia asistiva. Estoy analizando el caso activo de salud mental. ¿Deseas que busquemos protocolos autorizados, redactemos un borrador o auditemos notas clínicas?' }
      ]);
    }
  }, [isAcademic]);

  useEffect(() => {
    if (activeProtocol) {
      setSuggestion({
        text: `Con base en el Protocolo de ${activeProtocol}, se sugieren las maniobras correspondientes a la fase de intervención estratégica para disolver las soluciones intentadas.`,
        source: `Manual TBE oficial (${activeProtocol === 'Ataque de Pánico' ? 'TBE-P-01' : 'TBE-P-02'})`,
        status: 'pending'
      });
      setEditText(`Con base en el Protocolo de ${activeProtocol}...`);
    }
  }, [activeProtocol]);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { sender: 'user' as const, text: inputText };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // Auditoría
    auditLogService.addLog(
      'Consulta a Senda',
      `Terapeuta consultó a Senda en panel lateral: "${currentInput.substring(0, 30)}..."`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );

    // Respuesta IA simulada
    setTimeout(() => {
      let sendaText = '';
      let citation = '';

      if (isAcademic) {
        const lowerInput = currentInput.toLowerCase();
        if (lowerInput.includes('solucion') || lowerInput.includes('solución')) {
          sendaText = 'Las Soluciones Intentadas Redundantes son los esfuerzos reiterados que realiza el paciente o su entorno para resolver el problema, pero que paradójicamente lo mantienen y alimentan. En TBE, el objetivo es bloquear estas soluciones para desbloquear el sistema.';
          citation = 'Manual TBE Arezzo, Sección 1.1';
        } else if (lowerInput.includes('spr') || lowerInput.includes('perceptivo')) {
          sendaText = 'El Sistema Perceptivo-Reactivo (SPR) describe cómo percibe una persona la realidad y cómo reacciona en consecuencia. Se divide en tres esferas: relación consigo mismo, con los demás y con el mundo. Los trastornos clínicos se derivan de un SPR rígido y disfuncional.';
          citation = 'Epistemología TBE (Nardone & Watzlawick)';
        } else if (lowerInput.includes('pregunta') || lowerInput.includes('práctica') || lowerInput.includes('practica')) {
          sendaText = 'Pregunta de práctica:\n¿Cuál es la maniobra prescrita por Giorgio Nardone para el TOC de verificación basado en control?\nA) La peor fantasía\nB) El ritual del control paradojal (hacerlo voluntariamente para anular la compulsión)\nC) La evitación total.';
          citation = 'Rúbrica de Evaluación de Competencias TBE';
        } else {
          sendaText = 'En el contexto de formación, puedo aclararte conceptos de la Terapia Breve Estratégica o generar preguntas de práctica. Recuerda que no puedo revelarte datos de pacientes reales ni modificar calificaciones.';
          citation = 'Campus BreveMente Guía Formativa';
        }
      } else {
        sendaText = 'Analizado el corpus de Terapia Breve Estratégica, te sugiero revisar las conductas de evitación del paciente. Toda intervención técnica requiere tu criterio y validación.';
        citation = 'Corpus General BreveMente';

        if (currentInput.toLowerCase().includes('pánico') || currentInput.toLowerCase().includes('panico')) {
          sendaText = 'Para el Ataque de Pánico, el protocolo de Giorgio Nardone prescribe el "Diario de a bordo" en primera sesión y la "Peor Fantasía" a partir de la segunda. El objetivo es bloquear la petición de ayuda y canalizar la ansiedad.';
          citation = 'Manual TBE Arezzo (TBE-P-01)';
        }
      }

      setChatHistory(prev => [...prev, { sender: 'senda', text: sendaText, citation }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleAccept = () => {
    const finalText = suggestion.status === 'editing' ? editText : suggestion.text;
    
    if (onAcceptSuggestion) {
      onAcceptSuggestion(finalText);
    }
    
    setSuggestion(prev => ({ ...prev, status: 'accepted' }));
    
    // Registrar en auditoría
    auditLogService.addLog(
      'Aceptación de sugerencia IA',
      `Aceptó e inyectó sugerencia de Senda en el borrador de notas. Fuente: ${suggestion.source}`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('Sugerencia inyectada como borrador en las notas de sesión. Recuerda que sigue requiriendo tu validación humana final.');
  };

  const handleReject = () => {
    setSuggestion(prev => ({ ...prev, status: 'rejected' }));
    
    // Registrar en auditoría
    auditLogService.addLog(
      'Rechazo de sugerencia IA',
      `Rechazó borrador sugerido por Senda.`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('Sugerencia rechazada y archivada.');
  };

  const handleEdit = () => {
    setEditText(suggestion.text);
    setSuggestion(prev => ({ ...prev, status: 'editing' }));
  };

  const handleUndo = () => {
    setSuggestion(prev => ({ ...prev, status: 'pending' }));
    if (onAcceptSuggestion) {
      onAcceptSuggestion(''); // limpiar borrador
    }
    auditLogService.addLog(
      'Deshacer inserción IA',
      `Deshizo la inyección de borrador de Senda.`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slideInRight text-xs text-slate-650">
      {/* Cabecera */}
      <div className="bg-clinical-dark p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Isotipo cerebral mini */}
          <svg viewBox="0 0 100 100" fill="none" className="h-6 w-6 shrink-0 text-[#75AFBC] animate-pulse">
            <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M50 20C33.4315 20 20 33.4315 20 50C20 62 28 72 38 77" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 20C66.5685 20 80 33.4315 80 50C80 62 72 72 62 77" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
          </svg>
          <div>
            <h3 className="font-extrabold text-white leading-none">Senda</h3>
            <span className="text-[9px] text-slate-300 font-semibold block mt-0.5">Senda - Inteligencia asistiva</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-white p-1"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contexto del Expediente */}
      {(patientName || activeProtocol) && (
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 font-semibold text-clinical-dark flex flex-wrap gap-x-3 gap-y-1 shrink-0">
          {patientName && <span>Paciente: <span className="underline">{patientName}</span></span>}
          {activeProtocol && <span>Protocolo: <span className="underline">{activeProtocol}</span></span>}
        </div>
      )}

      {/* Cuerpo de Mensajes e Interacciones */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Chat Feed */}
        <div className="space-y-3.5">
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div 
                className={`p-3 rounded-xl leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-[#75AFBC] text-white rounded-tr-none' 
                    : 'bg-[#F4F4F4] text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                <p className="font-medium">{msg.text}</p>
                {msg.citation && (
                  <span className="text-[8px] font-bold block mt-1 text-clinical-dark uppercase">
                    Fuente: {msg.citation}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <span className="text-slate-400 font-semibold italic animate-pulse block">
              Senda está procesando...
            </span>
          )}
        </div>

        {/* BORRADOR CLINICO DIFERENCIADO (DOBLE PASO) */}
        {!isAcademic && suggestion.status !== 'rejected' && (
          <div 
            className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3"
            data-tour="brifi-ai-suggestion"
          >
            <div className="flex items-center gap-1.5 font-bold text-clinical-dark">
              <Sparkles className="w-4 h-4 text-[#75AFBC]" />
              <span>Borrador sugerido por Senda</span>
            </div>

            {/* Visualización de la sugerencia (editable) */}
            {suggestion.status === 'editing' ? (
              <textarea
                rows={4}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-700 focus:outline-none"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-100 font-medium">
                {suggestion.text}
              </p>
            )}

            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Fuente: {suggestion.source}</span>
            </div>

            {/* Aviso de Validación */}
            <div className="bg-amber-50 border border-amber-100 p-2 rounded text-[10px] text-amber-800 font-medium leading-normal flex items-start gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Requiere revisión y confirmación del terapeuta antes de guardarse en el expediente.</span>
            </div>

            {/* Acciones de Validación */}
            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200">
              {suggestion.status === 'pending' && (
                <>
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-2.5 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded font-bold shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aceptar e Insertar
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded font-semibold text-slate-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-2.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded font-semibold"
                  >
                    Rechazar
                  </button>
                </>
              )}

              {suggestion.status === 'editing' && (
                <>
                  <button
                    onClick={() => {
                      setSuggestion(prev => ({ ...prev, text: editText, status: 'pending' }));
                      handleAccept();
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-[#75AFBC] text-white rounded font-bold shadow-sm"
                  >
                    Guardar y Aceptar
                  </button>
                  <button
                    onClick={() => setSuggestion(prev => ({ ...prev, status: 'pending' }))}
                    className="px-2.5 py-1.5 border border-slate-200 rounded font-semibold"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {suggestion.status === 'accepted' && (
                <div className="w-full flex items-center justify-between bg-emerald-50 text-emerald-800 p-2 rounded-lg font-bold border border-emerald-150">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Borrador Insertado
                  </span>
                  <button
                    onClick={handleUndo}
                    className="text-[10px] underline text-slate-500 hover:text-slate-750 flex items-center gap-0.5 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Deshacer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isAcademic && (
          <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-3 font-semibold">
            <div className="flex items-center gap-1.5 font-bold text-clinical-dark">
              <Sparkles className="w-4 h-4 text-[#75AFBC]" />
              <span>Ayuda del Campus Senda</span>
            </div>
            <p className="text-slate-655 font-bold leading-normal">
              Prueba a preguntarme sobre:
            </p>
            <div className="flex flex-col gap-1.5">
              <button 
                type="button"
                onClick={() => { setInputText('Explicar Soluciones Intentadas'); }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-[#75AFBC] rounded text-[10px] font-bold text-slate-600 text-left shadow-sm"
              >
                1. Soluciones Intentadas en TBE
              </button>
              <button 
                type="button"
                onClick={() => { setInputText('Explicar el SPR'); }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-[#75AFBC] rounded text-[10px] font-bold text-slate-600 text-left shadow-sm"
              >
                2. ¿Qué es el Sistema Perceptivo-Reactivo?
              </button>
              <button 
                type="button"
                onClick={() => { setInputText('Dame una pregunta de práctica'); }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-[#75AFBC] rounded text-[10px] font-bold text-slate-600 text-left shadow-sm"
              >
                3. Pregunta de Práctica
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input de Preguntas */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-[#F4F4F4]">
        <input
          type="text"
          placeholder="Pregúntale a Senda..."
          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          className="bg-[#75AFBC] hover:bg-[#6099a5] text-white p-2 rounded-lg font-bold shadow shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Botón de acceso a pantalla completa */}
      <div className="p-2 border-t border-slate-100 text-center bg-slate-50 shrink-0">
        <button
          onClick={() => {
            onClose();
            navigate('/senda');
          }}
          className="text-[10px] font-bold text-[#75AFBC] hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          Abrir espacio completo de Senda
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
