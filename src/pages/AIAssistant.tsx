import React, { useState, useEffect } from 'react';
import { Sparkles, Send, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Role } from '../types/clinical';
import { mockAIAnswers } from '../data/mockData';
import { auditLogService } from '../services/auditLogService';
import { riskSimulationService } from '../services/riskSimulationService';
import { RiskAlertBanner } from '../components/RiskAlertBanner';

interface AIAssistantProps {
  userRole: Role;
  userName: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  citation?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ userRole, userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hola, soy Senda - Inteligencia asistiva de BreveMente. Puedo apoyarte en la búsqueda de manuales, protocolos, sugerencias documentales de notas clínicas y reestructuraciones sobre casos del corpus autorizado. ¿En qué te puedo asistir hoy?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRiskAlert, setActiveRiskAlert] = useState<{ isRisk: boolean; message: string } | null>(null);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Registrar en auditoría
    auditLogService.addLog(
      'Uso de Asistente IA',
      `Consultó al Asistente IA Senda sobre: "${textToSend.substring(0, 40)}..."`,
      'ia',
      { id: 'user-current', name: userName, role: userRole }
    );

    // Simular retraso de la IA
    setTimeout(() => {
      let aiText = mockAIAnswers.default;
      let citation = 'BreveMente Corpus General';

      const lowerText = textToSend.toLowerCase();

      // Detección de riesgo clínico simulado
      const riskCheck = riskSimulationService.checkTextForRisk(lowerText);
      if (riskCheck.isRisk) {
        aiText = mockAIAnswers.risk;
        setActiveRiskAlert({ isRisk: true, message: riskCheck.reason });
      } else if (lowerText.includes('pánico') || lowerText.includes('panico') || lowerText.includes('ansiedad')) {
        aiText = mockAIAnswers.panic;
        citation = 'Protocolo Ataque de Pánico, Manual TBE (TBE-P-01)';
      } else if (lowerText.includes('toc') || lowerText.includes('obsesivo')) {
        aiText = mockAIAnswers.ocd;
        citation = 'Manual TOC TBE (TBE-M-02)';
      }

      // Reemplazar Brifi por Senda en el texto final si existe
      aiText = aiText.replace(/Brifi/g, 'Senda');

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString(),
        citation: citation
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleEscalateRisk = () => {
    if (activeRiskAlert) {
      riskSimulationService.escalateRisk(
        'patient-1',
        'Sofía Martínez',
        `Alerta de crisis detectada en consulta de IA: "${activeRiskAlert.message}"`,
        { id: 'therapist-1', name: userName, role: userRole }
      );
      alert('⚠️ ALERTA: Riesgo escalado y archivado exitosamente para supervisión.');
      setActiveRiskAlert(null);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]" data-tour="senda-assistant-chat">
      {/* Risk banner */}
      {activeRiskAlert && (
        <RiskAlertBanner
          patientName="Sofía Martínez"
          message={activeRiskAlert.message}
          onEscalate={handleEscalateRisk}
          userRole={userRole}
        />
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#75AFBC] animate-pulse" />
            Senda - Inteligencia asistiva
          </h2>
          <p className="text-xs text-clinical-textMuted">
            Asistencia clínica y documental de Terapia Breve Estratégica de BreveMente.
          </p>
        </div>
      </div>

      {/* Advertencia del circuito clínico */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Aviso sobre el Uso de Inteligencia Artificial Clínico-Médica</span>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            La IA no diagnostica de forma autónoma, no prescribe ni sustituye el juicio clínico. Todas las sugerencias documentales de manuales y protocolos sugeridos por el asistente deben ser verificadas y validadas por el especialista humano bajo el principio de &ldquo;humano en el circuito&rdquo;.
          </p>
        </div>
      </div>

      {/* Área del Chat */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Chips sugerencias */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 overflow-x-auto shrink-0 select-none">
          <span className="py-1 shrink-0">Sugerencias rápidas:</span>
          <button 
            onClick={() => handleSendMessage('Sugerencias de tareas para Ataque de Pánico')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shrink-0"
          >
            Prescripciones Ataque de Pánico
          </button>
          <button 
            onClick={() => handleSendMessage('Intervención de prescripción paradójica en TOC')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shrink-0"
          >
            Intervenciones en TOC
          </button>
          <button 
            onClick={() => handleSendMessage('Tengo un paciente que menciona ideas de suicidio')}
            className="px-2.5 py-1 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-full transition-colors shrink-0"
          >
            Probar alerta de riesgo
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div 
                className={`p-3.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-clinical-accent text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                
                {msg.citation && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-[9px] font-bold text-clinical-teal uppercase">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Fuente sugerida: {msg.citation}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-semibold mt-1 px-1">
                {msg.sender === 'user' ? 'Tú' : 'Asistente IA'} - {msg.timestamp}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 font-semibold text-[10px] animate-pulse">
              <Sparkles className="w-4 h-4 text-clinical-teal animate-spin" />
              El asistente está formulando la respuesta clínica...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
          className="p-3 border-t border-slate-200 flex gap-2 shrink-0 bg-slate-50"
        >
          <input
            type="text"
            placeholder="Pregunta sobre manuales, maniobras de protocolos o introduce notas para auditar..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-clinical-teal"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-clinical-teal hover:bg-clinical-tealHover text-white rounded-lg font-bold shadow flex items-center justify-center shrink-0 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
