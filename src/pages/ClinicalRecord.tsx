import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FolderHeart, Activity, FileText, Volume2, Mic, Square, 
  Sparkles, Plus, Save, AlertTriangle, TrendingUp, GitBranch, 
  ShieldAlert, Clipboard, User, Heart, AlertOctagon, Check 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

import { Role, Patient, ClinicalRecord as ClinicalRecordType, Session, AuditLog } from '../types/clinical';
import { ProtocolDecisionPanel } from '../components/ProtocolDecisionPanel';
import { RiskAlertBanner } from '../components/RiskAlertBanner';
import { auditLogService } from '../services/auditLogService';
import { riskSimulationService } from '../services/riskSimulationService';

interface ClinicalRecordProps {
  userRole: Role;
  patients: Patient[];
  userName: string;
}

export const ClinicalRecord: React.FC<ClinicalRecordProps> = ({ userRole, patients, userName }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const patientId = searchParams.get('id') || 'patient-1'; // Por defecto Sofía Martínez
  const activePatient = patients.find(p => p.id === patientId);

  // Estados locales para simular persistencia
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecordType | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'datos' | 'tbe' | 'psiquiatria' | 'auditoria'>('tbe');
  const [tbeSubTab, setTbeSubTab] = useState<'dx' | 'sesiones' | 'vc' | 'vg' | 'rst'>('sesiones');
  const [activeSessionDetail, setActiveSessionDetail] = useState<Session | null>(null);

  // Estados para creación de nueva sesión
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionMode, setSessionMode] = useState<'ia' | 'manual'>('ia');
  
  // Audio e IA simulation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<any>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);

  // Campos de formulario nueva sesión
  const [newSessPhase, setNewSessPhase] = useState('Intervención');
  const [newSessProtocol, setNewSessProtocol] = useState('Ataque de Pánico');
  const [newSessDxOp, setNewSessDxOp] = useState('SPR Fóbico');
  const [newSessPx, setNewSessPx] = useState<string[]>([]);
  const [newSessF1, setNewSessF1] = useState('');
  const [newSessF2, setNewSessF2] = useState('');
  const [newSessOss, setNewSessOss] = useState('');
  const [newSessAdd, setNewSessAdd] = useState('100%');
  const [newSessRss, setNewSessRss] = useState('Mejoría significativa');
  const [newSessEff, setNewSessEff] = useState('');
  const [newSessNotes, setNewSessNotes] = useState('');
  const [newSessObsNext, setNewSessObsNext] = useState('');
  const [newSessSituation, setNewSessSituation] = useState('');
  const [isNotesGeneratedByIa, setIsNotesGeneratedByIa] = useState(false);

  // Riesgo clínico en la sesión
  const [activeRiskAlert, setActiveRiskAlert] = useState<{ isRisk: boolean; message: string } | null>(null);

  // Valoración del Cambio (VC) por sesión local
  const [vcHistory, setVcHistory] = useState<Array<{
    sessionNum: number;
    percepcion: string;
    pensamientos: string;
    sensaciones: string;
    reacciones: string;
    sintomas: string;
    crisis: string;
  }>>([
    { sessionNum: 1, percepcion: 'Marcador de inicio', pensamientos: 'Marcador de inicio', sensaciones: 'Marcador de inicio', reacciones: 'Marcador de inicio', sintomas: 'Marcador de inicio', crisis: 'Marcador de inicio' },
    { sessionNum: 2, percepcion: 'Mejoría leve', pensamientos: 'Sin cambios', sensaciones: 'Mejoría leve', reacciones: 'Mejoría leve', sintomas: 'Mejoría leve', crisis: 'Mejoría leve' }
  ]);

  // Nueva entrada VC para la sesión actual
  const [newVcPercepcion, setNewVcPercepcion] = useState('Mejoría significativa');
  const [newVcPensamientos, setNewVcPensamientos] = useState('Mejoría leve');
  const [newVcSensaciones, setNewVcSensaciones] = useState('Mejoría significativa');
  const [newVcReacciones, setNewVcReacciones] = useState('Mejoría significativa');
  const [newVcSintomas, setNewVcSintomas] = useState('Mejoría significativa');
  const [newVcCrisis, setNewVcCrisis] = useState('Mejoría significativa');

  // Valoración Global (VG) local
  const [vgHistory, setVgHistory] = useState<Array<{
    sessionNum: number;
    yo: number; // 1-10
    demas: number;
    mundo: number;
  }>>([
    { sessionNum: 1, yo: 3, demas: 4, mundo: 2 },
    { sessionNum: 2, yo: 5, demas: 5, mundo: 4 }
  ]);

  const [newVgYo, setNewVgYo] = useState(7);
  const [newVgDemas, setNewVgDemas] = useState(7);
  const [newVgMundo, setNewVgMundo] = useState(6);

  // DX Psiquiátrico / Farmacológico local
  const [psyDxNosologico, setPsyDxNosologico] = useState('Trastorno de Pánico [F41.0]');
  const [psyDsm5, setPsyDsm5] = useState('300.01 Trastorno de Pánico');
  const [psyCie11, setPsyCie11] = useState('6B01 Trastorno de Pánico');
  const [psyPrognosis, setPsyPrognosis] = useState<'excelente' | 'bueno' | 'reservado' | 'malo'>('bueno');
  const [psyPlan, setPsyPlan] = useState('Monitoreo de fármacos y co-tratamiento psicoterapéutico.');
  const [drugs, setDrugs] = useState<Array<{ id: string; name: string; doseMorning: string; doseAfternoon: string; doseNight: string; eff: string; notes: string }>>([
    { id: 'drug-1', name: 'Sertralina 50mg', doseMorning: '1 tableta', doseAfternoon: '0', doseNight: '0', eff: 'Bueno', notes: 'Ligera cefalea los primeros días.' },
    { id: 'drug-2', name: 'Alprazolam 0.25mg', doseMorning: '0', doseAfternoon: '0', doseNight: '1 tableta', eff: 'Excelente inductor sueño', notes: 'Uso condicionado a crisis agudas.' }
  ]);

  // Cargar datos del paciente
  useEffect(() => {
    // Cargar historial de sesiones simulado
    const allSessions = JSON.parse(localStorage.getItem('brevemente_sessions') || '{}');
    if (!allSessions[patientId]) {
      // Cargar mocks iniciales si no hay en localStorage
      const initialSess = [
        {
          id: 'session-1-1',
          patientId: 'patient-1',
          number: 1,
          date: '2026-08-10',
          phase: 'Socialización',
          protocol: 'Ataque de Pánico',
          dxOp: 'SPR Fóbico',
          px: ['Diario de abordo', 'Cómo empeorar'],
          f1: 'Redefinición del control: "Quien busca el control, lo pierde; quien lo entrega, lo gana."',
          f2: 'Evitación que confirma el peligro.',
          oss: 'Paciente muy receptiva. Se identificó la solución intentada de pedir ayuda a su madre y esposo.',
          add: '100%',
          rss: 'Mejoría leve',
          eff: 'Bueno',
          notes: 'La paciente reporta que escribir en el diario de abordo redujo la duración de la crisis de 20 a 5 minutos.',
          observationsNextSession: 'Profundizar en la maniobra de "cómo empeorar" para bloquear el control voluntario.',
          situation: 'Estable con crisis de menor intensidad.',
          status: 'validado' as const
        },
        {
          id: 'session-1-2',
          patientId: 'patient-1',
          number: 2,
          date: '2026-08-17',
          phase: 'Intervención',
          protocol: 'Ataque de Pánico',
          dxOp: 'SPR Fóbico',
          px: ['Diario de abordo', 'WF 30 min'],
          f1: 'La fantasía del peor escenario: "Míralo a los ojos y el fantasma desaparecerá."',
          f2: 'Prescribir el síntoma en un horario fijo.',
          oss: 'Se prescribe la Peor Fantasía (Worry-Time / WF 30 min) de 30 minutos diarios a las 18:00.',
          add: '80%',
          rss: 'Mejoría significativa',
          eff: 'Excelente',
          notes: 'Al colocarse voluntariamente en el peor escenario durante 30 minutos, la paciente reporta que le costaba sentir miedo y terminaba relajándose.',
          observationsNextSession: 'Evaluar autonomía al salir sola a la calle sin pedir ayuda.',
          situation: 'Muy mejorada. Solo reporta un amago de crisis en la semana.',
          status: 'validado' as const
        }
      ];
      
      const sess = patientId === 'patient-1' ? initialSess : [];
      setSessions(sess);
      if (sess.length > 0) setActiveSessionDetail(sess[sess.length - 1]);
    } else {
      setSessions(allSessions[patientId]);
      if (allSessions[patientId].length > 0) setActiveSessionDetail(allSessions[patientId][allSessions[patientId].length - 1]);
    }

    // Cargar ficha
    const allRecords = JSON.parse(localStorage.getItem('brevemente_clinical_records') || '{}');
    const mockRecord: ClinicalRecordType = {
      patientId: patientId,
      patientName: activePatient?.name || 'Paciente',
      folio: patientId === 'patient-1' ? 'EXP-8849' : 'EXP-9012',
      startDate: activePatient?.registrationDate || '2026-08-20',
      age: patientId === 'patient-1' ? 28 : 35,
      therapistName: 'Dr. Alejandro Silva',
      status: 'Activo - En Tratamiento',
      riskLevel: activePatient?.riskLevel || 'bajo',
      modality: patientId === 'patient-1' ? 'online' : 'presencial',
      motif: activePatient?.motif || 'Motivo de consulta inicial.',
      description: patientId === 'patient-1' 
        ? 'Paciente femenina de 28 años que refiere inicio de crisis de angustia súbitas hace 3 meses. Asocia síntomas con miedo a desmayarse en público y perder el control. Ha evitado lugares concurridos.'
        : 'Paciente masculino de 35 años que reporta bloqueos de habla al exponer en público.',
      trastornoEstrategico: patientId === 'patient-1' ? 'Ataque de Pánico' : 'Miedo a hablar en público',
      firstAppearance: 'Hace 3 meses tras periodo de alto estrés.',
      precipitatingFactors: 'Alta demanda y discusiones de trabajo.',
      evolutionType: 'episódico',
      dxOpInicial: 'SPR Fóbico',
      sprInicial: 'Marcador de inicio',
      objectivePatient: 'Poder salir a trabajar y estar sola en su casa sin temor.',
      objectiveTherapist: 'Reestructurar la percepción de peligro físico, disolver la paradoja del control que hace perder el control.'
    };
    
    setClinicalRecord(allRecords[patientId] || mockRecord);

    // Cargar modo inicial
    if (activePatient) {
      setSessionMode(activePatient.registryMode);
    }
  }, [patientId, activePatient]);

  // Temporizador para grabación de audio
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } else {
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
    return () => {
      if (recordingInterval) clearInterval(recordingInterval);
    };
  }, [isRecording]);



  // Escuchar inyecciones de Senda
  useEffect(() => {
    const handleSendaInject = (e: Event) => {
      const text = (e as CustomEvent).detail;
      setNewSessNotes(prev => {
        if (!text) {
          setIsNotesGeneratedByIa(false);
          return '';
        }
        setIsNotesGeneratedByIa(true);
        return prev ? `${prev}\n\n[Sugerencia Senda (Borrador)]: ${text}` : `[Sugerencia Senda (Borrador)]: ${text}`;
      });
    };
    window.addEventListener('brevemente_brifi_inject', handleSendaInject);
    return () => {
      window.removeEventListener('brevemente_brifi_inject', handleSendaInject);
    };
  }, []);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setAudioBlobUrl(null);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setAudioBlobUrl('blob:http://localhost:5173/mock-audio-uuid');
    
    // Registrar evento de grabación en la auditoría
    auditLogService.addLog(
      'Grabación de audio',
      `Inició y detuvo la grabación de audio para la nota clínica del paciente ${activePatient?.name}. Duración: ${recordingSeconds}s.`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  const handleAiProcess = () => {
    setIsAiProcessing(true);
    setTimeout(() => {
      setIsAiProcessing(false);
      setAiValidated(true);

      // Pre-llenar campos clínicos con datos simulados
      setNewSessPhase('Intervención');
      setNewSessProtocol('Ataque de Pánico');
      setNewSessDxOp('SPR Fóbico');
      setNewSessPx(['Diario de abordo', 'WF 30 min']);
      setNewSessF1('La fantasía del peor escenario: "Míralo a los ojos y el fantasma desaparecerá."');
      setNewSessF2('Prescribir el síntoma en un horario fijo a las 18:00.');
      setNewSessOss('Paciente describe mejorías notables en su rutina de tarde tras practicar la peor fantasía.');
      setNewSessAdd('90%');
      setNewSessRss('Mejoría significativa');
      setNewSessEff('Excelente respuesta');
      setNewSessObsNext('Programar exposición autónoma en transporte público.');
      
      // Texto que gatillará la detección de riesgo clínico simulado
      const notesWithRisk = 'La paciente refiere haber estado estable, sin embargo, en momentos de frustración extrema describe ideación de escape recurrente, mencionando un par de veces el deseo de lastimarse física o emocionalmente si la presión continúa.';
      setNewSessNotes(notesWithRisk);
      setNewSessSituation('Evolución favorable del cuadro fóbico con alerta preventiva de cansancio.');

      // Chequear riesgo
      const riskCheck = riskSimulationService.checkTextForRisk(notesWithRisk);
      if (riskCheck.isRisk) {
        setActiveRiskAlert({ isRisk: true, message: riskCheck.reason });
      }

      // Registrar uso de IA en auditoría
      auditLogService.addLog(
        'Uso de Asistente IA',
        `El sistema procesó el audio grabado y autocompletó los campos clínicos de la sesión de ${activePatient?.name} mediante IA.`,
        'ia',
        { id: 'user-current', name: userName, role: userRole }
      );
    }, 2000);
  };

  const handleEscalateRisk = () => {
    if (activeRiskAlert && activePatient) {
      riskSimulationService.escalateRisk(
        activePatient.id,
        activePatient.name,
        activeRiskAlert.message,
        { id: 'therapist-1', name: userName, role: userRole }
      );
      alert('⚠️ ALERTA: Caso escalado con éxito al supervisor clínico de guardia y registrado en auditoría.');
      setActiveRiskAlert(null);
    }
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();

    const newSessionNumber = sessions.length + 1;
    const newSession: Session = {
      id: `session-${patientId}-${Date.now()}`,
      patientId: patientId,
      number: newSessionNumber,
      date: new Date().toISOString().split('T')[0],
      phase: newSessPhase,
      protocol: newSessProtocol,
      dxOp: newSessDxOp,
      px: newSessPx,
      f1: newSessF1,
      f2: newSessF2,
      oss: newSessOss,
      add: newSessAdd,
      rss: newSessRss,
      eff: newSessEff,
      notes: newSessNotes,
      observationsNextSession: newSessObsNext,
      situation: newSessSituation,
      status: 'validado',
      audioDuration: audioBlobUrl ? `${recordingSeconds}s` : undefined
    };

    // Actualizar historial local de sesiones
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setActiveSessionDetail(newSession);

    // Guardar en localStorage
    const allSessions = JSON.parse(localStorage.getItem('brevemente_sessions') || '{}');
    allSessions[patientId] = updatedSessions;
    localStorage.setItem('brevemente_sessions', JSON.stringify(allSessions));

    // Agregar entrada de Valoración de Cambio para esta sesión
    const updatedVc = [
      ...vcHistory,
      {
        sessionNum: newSessionNumber,
        percepcion: newVcPercepcion,
        pensamientos: newVcPensamientos,
        sensaciones: newVcSensaciones,
        reacciones: newVcReacciones,
        sintomas: newVcSintomas,
        crisis: newVcCrisis
      }
    ];
    setVcHistory(updatedVc);

    // Agregar entrada de Valoración Global para esta sesión
    const updatedVg = [
      ...vgHistory,
      {
        sessionNum: newSessionNumber,
        yo: newVgYo,
        demas: newVgDemas,
        mundo: newVgMundo
      }
    ];
    setVgHistory(updatedVg);

    // Registrar en auditoría
    auditLogService.addLog(
      'Edición de sesión',
      `Creó y validó la Sesión ${newSessionNumber} para ${activePatient?.name} (Protocolo: ${newSessProtocol}).`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );

    // Cerrar formulario y resetear
    setIsCreatingSession(false);
    setAudioBlobUrl(null);
    setRecordingSeconds(0);
    setAiValidated(false);
    setActiveRiskAlert(null);
    alert('Sesión guardada y validada con éxito.');
  };

  const handleSaveDx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalRecord) return;

    localStorage.setItem('brevemente_clinical_records', JSON.stringify({
      ...JSON.parse(localStorage.getItem('brevemente_clinical_records') || '{}'),
      [patientId]: clinicalRecord
    }));

    // Registrar en auditoría
    auditLogService.addLog(
      'Actualización de expediente',
      `Actualizó el Diagnóstico Estratégico (DX) del paciente ${activePatient?.name}`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );

    alert('Diagnóstico estratégico actualizado.');
  };

  const handleSavePsychiatry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalRecord) return;

    const updatedRecord = {
      ...clinicalRecord,
      dxNosologico: psyDxNosologico,
      dsm5: psyDsm5,
      cie11: psyCie11,
      prognosis: psyPrognosis,
      treatmentPlan: psyPlan,
      drugsList: drugs
    };

    setClinicalRecord(updatedRecord);

    const allRecords = JSON.parse(localStorage.getItem('brevemente_clinical_records') || '{}');
    allRecords[patientId] = updatedRecord;
    localStorage.setItem('brevemente_clinical_records', JSON.stringify(allRecords));

    // Registrar en auditoría
    auditLogService.addLog(
      'Actualización de expediente',
      `Actualizó el tratamiento y diagnóstico psiquiátrico de ${activePatient?.name}`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );

    alert('Tratamiento psiquiátrico guardado con éxito.');
  };

  // Convertir Valoración del Cambio a puntos numéricos para la gráfica
  // Marcador de inicio = 1, Sin cambios = 2, Mejoría leve = 3, Mejoría significativa = 4, Empeoramiento = 0, Recaída = 0
  const getVcValue = (text: string) => {
    if (text === 'Marcador de inicio') return 1;
    if (text === 'Sin cambios') return 2;
    if (text === 'Mejoría leve') return 3;
    if (text === 'Mejoría significativa') return 4;
    if (text === 'Nuevo patrón') return 4.5;
    return 0; // Empeoramiento/Recaída
  };

  const vcChartData = vcHistory.map(vc => ({
    name: `Sesión ${vc.sessionNum}`,
    Percepción: getVcValue(vc.percepcion),
    Pensamientos: getVcValue(vc.pensamientos),
    Sensaciones: getVcValue(vc.sensaciones),
    Sintomas: getVcValue(vc.sintomas),
    Crisis: getVcValue(vc.crisis)
  }));

  const vgChartData = vgHistory.map(vg => ({
    name: `Sesión ${vg.sessionNum}`,
    Yo: vg.yo,
    Demás: vg.demas,
    Mundo: vg.mundo,
    // Promedio global del cambio para contrastar
    PromedioVC: ((vg.yo + vg.demas + vg.mundo) / 3).toFixed(1)
  }));

  // Obtener logs de auditoría locales para este paciente
  const patientLogs = auditLogService.getLogs().filter(log => 
    log.details.includes(activePatient?.name || '')
  );

  return (
    <div className="space-y-6">
      {/* Risk alert banner */}
      {activeRiskAlert && activePatient && (
        <RiskAlertBanner
          patientName={activePatient.name}
          message={activeRiskAlert.message}
          onEscalate={handleEscalateRisk}
          userRole={userRole}
        />
      )}

      {/* Ficha Cabecera Paciente */}
      {clinicalRecord && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-clinical-accent/10 border border-clinical-accent/20 rounded-full flex items-center justify-center text-clinical-accent">
                <FolderHeart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-clinical-dark">{activePatient?.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 border rounded-full font-bold uppercase bg-slate-50 border-slate-200 text-slate-500">
                    Folio: {clinicalRecord.folio}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    clinicalRecord.riskLevel === 'alto' ? 'bg-red-500' :
                    clinicalRecord.riskLevel === 'medio' ? 'bg-amber-500' : 'bg-green-500'
                  }`} title={`Riesgo ${clinicalRecord.riskLevel}`} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] text-clinical-textMuted font-medium">
                  <span>Edad: {clinicalRecord.age} años</span>
                  <span>•</span>
                  <span>Inicio: {clinicalRecord.startDate}</span>
                  <span>•</span>
                  <span>Modalidad: <span className="capitalize">{clinicalRecord.modality}</span></span>
                  <span>•</span>
                  <span>Terapeuta: {clinicalRecord.therapistName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Registro:</span>
              <span className={`text-[10px] px-2.5 py-1 border rounded-md font-bold uppercase ${
                activePatient?.registryMode === 'ia'
                  ? 'bg-clinical-teal/10 border-clinical-teal/30 text-clinical-teal'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {activePatient?.registryMode === 'ia' ? 'Grabación e IA activa' : '100% Manual'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Principales */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('tbe')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'tbe'
              ? 'border-clinical-accent text-clinical-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Tratamiento Psicoterapéutico TBE
        </button>
        <button
          onClick={() => setActiveTab('psiquiatria')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'psiquiatria'
              ? 'border-clinical-accent text-clinical-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Tratamiento Psiquiátrico
        </button>
        <button
          onClick={() => setActiveTab('datos')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'datos'
              ? 'border-clinical-accent text-clinical-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Datos de Admisión e Historia Clínica
        </button>
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'auditoria'
              ? 'border-clinical-accent text-clinical-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Auditoría del Expediente
        </button>
      </div>

      {/* PESTAÑA: TBE */}
      {activeTab === 'tbe' && (
        <div className="space-y-6">
          {/* Subtabs TBE */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg w-fit text-xs font-semibold">
            <button
              onClick={() => { setTbeSubTab('dx'); setIsCreatingSession(false); }}
              className={`px-3 py-1.5 rounded-md transition-all ${tbeSubTab === 'dx' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              DX Estratégico
            </button>
            <button
              onClick={() => { setTbeSubTab('sesiones'); }}
              className={`px-3 py-1.5 rounded-md transition-all ${tbeSubTab === 'sesiones' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sesiones ({sessions.length})
            </button>
            <button
              onClick={() => { setTbeSubTab('vc'); setIsCreatingSession(false); }}
              className={`px-3 py-1.5 rounded-md transition-all ${tbeSubTab === 'vc' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Valoración del Cambio
            </button>
            <button
              onClick={() => { setTbeSubTab('vg'); setIsCreatingSession(false); }}
              className={`px-3 py-1.5 rounded-md transition-all ${tbeSubTab === 'vg' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Valoración Global (YO / DEMÁS)
            </button>
            <button
              onClick={() => { setTbeSubTab('rst'); setIsCreatingSession(false); }}
              className={`px-3 py-1.5 rounded-md transition-all ${tbeSubTab === 'rst' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Reestructuraciones (RST)
            </button>
          </div>

          {/* SUBTABS - CONTENIDO */}
          
          {/* DX ESTRATÉGICO */}
          {tbeSubTab === 'dx' && clinicalRecord && (
            <form onSubmit={handleSaveDx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GitBranch className="w-5 h-5 text-clinical-accent" />
                <h3 className="text-sm font-bold text-clinical-dark">Diagnóstico Clínico Estratégico</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Motivo de Consulta (Textual):</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                    value={clinicalRecord.motif || ''}
                    onChange={(e) => setClinicalRecord({...clinicalRecord, motif: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Descripción de la Conducta Sintomática:</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                    value={clinicalRecord.description || ''}
                    onChange={(e) => setClinicalRecord({...clinicalRecord, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Trastorno Estratégico Clasificado:</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                    value={clinicalRecord.trastornoEstrategico || ''}
                    onChange={(e) => setClinicalRecord({...clinicalRecord, trastornoEstrategico: e.target.value})}
                  >
                    <option value="Ataque de Pánico">Ataque de Pánico</option>
                    <option value="Miedo a perder el control tipo 1: hablar en público">Miedo a hablar en público</option>
                    <option value="Trastorno Obsesivo Compulsivo (TOC)">Trastorno Obsesivo Compulsivo (TOC)</option>
                    <option value="Depresión">Depresión Tipo 1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Evolución Temporal del Problema:</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                    value={clinicalRecord.evolutionType || 'progresivo'}
                    onChange={(e) => setClinicalRecord({...clinicalRecord, evolutionType: e.target.value as any})}
                  >
                    <option value="progresivo">Progresivo</option>
                    <option value="agudo">Agudo</option>
                    <option value="crónico">Crónico</option>
                    <option value="episódico">Episódico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Objetivos del Paciente:</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                    value={clinicalRecord.objectivePatient || ''}
                    onChange={(e) => setClinicalRecord({...clinicalRecord, objectivePatient: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Objetivos del Terapeuta:</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                    value={clinicalRecord.objectiveTherapist || ''}
                    onChange={(e) => setClinicalRecord({...clinicalRecord, objectiveTherapist: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  Guardar DX Estratégico
                </button>
              </div>
            </form>
          )}

          {/* SESIONES TBE */}
          {tbeSubTab === 'sesiones' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Historial de Sesiones */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-fit">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
                  <span className="font-bold text-xs text-clinical-dark uppercase">Historial Clínico</span>
                  {['admin_platform', 'admin_clinical', 'therapist'].includes(userRole) && !isCreatingSession && (
                    <button
                      onClick={() => setIsCreatingSession(true)}
                      className="px-2 py-1 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded text-[10px] font-bold shadow flex items-center gap-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nueva Sesión
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {sessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No hay sesiones registradas para este paciente.
                    </div>
                  ) : (
                    sessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => {
                          setActiveSessionDetail(sess);
                          setIsCreatingSession(false);
                        }}
                        className={`p-3.5 cursor-pointer text-xs transition-all flex items-center justify-between ${
                          activeSessionDetail?.id === sess.id && !isCreatingSession
                            ? 'bg-blue-50/50 border-l-4 border-clinical-accent font-semibold'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="text-clinical-dark block">Sesión {sess.number}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Fecha: {sess.date}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                          {sess.phase}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Columna Derecha: Detalle o Creación */}
              <div className="lg:col-span-2">
                {isCreatingSession ? (
                  /* Formulario de nueva sesión */
                  <form onSubmit={handleSaveSession} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-clinical-dark">Registro de Sesión {sessions.length + 1}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Formulario asistido y estructurado</p>
                      </div>
                      <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold">
                        <button
                          type="button"
                          className={`px-2 py-1 rounded transition-all ${sessionMode === 'ia' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500'}`}
                          onClick={() => setSessionMode('ia')}
                        >
                          Grabación e IA
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 rounded transition-all ${sessionMode === 'manual' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500'}`}
                          onClick={() => setSessionMode('manual')}
                        >
                          Modo Manual
                        </button>
                      </div>
                    </div>

                    {/* MODO IA */}
                    {sessionMode === 'ia' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 text-clinical-dark font-bold">
                          <Volume2 className="w-4 h-4 text-clinical-accent" />
                          <span>Simulador de Grabación y Procesamiento de IA</span>
                        </div>
                        <p className="text-slate-500 leading-relaxed text-[11px]">
                          Graba la interacción de la sesión (o una porción) y permite al Asistente IA rellenar el expediente, mapeando protocolos y diagnosticando conductas según el modelo Arezzo.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-3.5">
                          {/* Botón micrófono */}
                          <div className="flex items-center gap-2.5">
                            {isRecording ? (
                              <button
                                type="button"
                                onClick={handleStopRecording}
                                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all border-4 border-red-100 animate-pulse shadow"
                              >
                                <Square className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleStartRecording}
                                className="w-12 h-12 rounded-full bg-clinical-risk text-white flex items-center justify-center hover:opacity-90 transition-all shadow"
                              >
                                <Mic className="w-5 h-5" />
                              </button>
                            )}

                            <div>
                              <span className="font-bold text-clinical-dark block">
                                {isRecording ? 'Grabando Audio...' : audioBlobUrl ? 'Audio Grabado' : 'Haga click para iniciar'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                {isRecording 
                                  ? `Tiempo: ${Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:${(recordingSeconds % 60).toString().padStart(2, '0')}`
                                  : audioBlobUrl ? `Duración: ${recordingSeconds}s` : 'Sin audio registrado'}
                              </span>
                            </div>
                          </div>

                          {/* Botón IA */}
                          {audioBlobUrl && !isAiProcessing && (
                            <button
                              type="button"
                              onClick={handleAiProcess}
                              className="px-4 py-2 bg-clinical-teal hover:bg-clinical-tealHover text-white rounded-lg font-bold shadow flex items-center gap-1.5 ml-auto animate-bounce"
                            >
                              <Sparkles className="w-4 h-4 text-amber-300" />
                              IA Rellena Expediente
                            </button>
                          )}

                          {isAiProcessing && (
                            <div className="flex items-center gap-2 ml-auto text-clinical-teal font-semibold animate-pulse">
                              <Sparkles className="w-4 h-4 text-clinical-teal animate-spin" />
                              Procesando transcripción y detectando protocolo...
                            </div>
                          )}
                        </div>

                        {aiValidated && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-clinical-accent flex items-start gap-2">
                            <ShieldAlert className="w-4.5 h-4.5 text-clinical-accent shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">✓ Datos Sugeridos por IA</span>
                              <p className="mt-0.5 leading-relaxed text-slate-600">
                                La información generada por IA debe ser revisada y validada por el profesional clínico antes de guardar definitivamente la sesión.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PANEL DE DECISIÓN DE MOTOR DE PROTOCOLOS (Para ambos modos) */}
                    {(sessionMode === 'manual' || aiValidated) && (
                      <ProtocolDecisionPanel
                        selectedProtocol={newSessProtocol}
                        selectedDxOp={newSessDxOp}
                        currentPhase={newSessPhase}
                        selectedPx={newSessPx}
                        onChangePx={setNewSessPx}
                        onLogAudit={(action, details) => {
                          auditLogService.addLog(
                            action,
                            details,
                            'seguridad',
                            { id: 'user-current', name: userName, role: userRole }
                          );
                        }}
                      />
                    )}

                    {/* CAMPOS CLÍNICOS EDITABLES */}
                    {(sessionMode === 'manual' || aiValidated) && (
                      <div className="space-y-4">
                        {/* Selector de Protocolo y DX.OP para manual */}
                        {sessionMode === 'manual' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">Fase:</label>
                              <select
                                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newSessPhase}
                                onChange={(e) => setNewSessPhase(e.target.value)}
                              >
                                <option value="Socialización">Socialización</option>
                                <option value="Intervención">Intervención</option>
                                <option value="Consolidación">Consolidación</option>
                                <option value="Cierre">Cierre</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">Protocolo:</label>
                              <select
                                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newSessProtocol}
                                onChange={(e) => setNewSessProtocol(e.target.value)}
                              >
                                <option value="Ataque de Pánico">Ataque de Pánico</option>
                                <option value="Miedo a perder el control tipo 1: hablar en público">Miedo a hablar en público</option>
                                <option value="Trastorno Obsesivo Compulsivo (TOC)">Trastorno Obsesivo Compulsivo (TOC)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">Diagnóstico Operativo (Dx.Op):</label>
                              <select
                                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newSessDxOp}
                                onChange={(e) => setNewSessDxOp(e.target.value)}
                              >
                                <option value="SPR Fóbico">SPR Fóbico</option>
                                <option value="SPR Fóbico Obsesivo">SPR Fóbico Obsesivo</option>
                                <option value="SPR Obsesivo Fóbico">SPR Obsesivo Fóbico</option>
                                <option value="SPR Obsesivo">SPR Obsesivo</option>
                                <option value="SPR Paranoico">SPR Paranoico</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Frase Foco 1 (F1):</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessF1}
                              onChange={(e) => setNewSessF1(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Frase Foco 2 (F2):</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessF2}
                              onChange={(e) => setNewSessF2(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1 flex items-center">
                            Notas Clínicas y Reporte del Paciente:
                            {isNotesGeneratedByIa && (
                              <span className="ml-2 px-2 py-0.5 bg-teal-50 border border-teal-200 text-clinical-teal font-bold uppercase text-[8px] rounded">
                                ✨ Borrador sugerido por Senda
                              </span>
                            )}
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                            value={newSessNotes}
                            onChange={(e) => {
                              setNewSessNotes(e.target.value);
                              // Detectar riesgo dinámicamente si se escribe
                              const risk = riskSimulationService.checkTextForRisk(e.target.value);
                              if (risk.isRisk) {
                                setActiveRiskAlert({ isRisk: true, message: risk.reason });
                              } else {
                                setActiveRiskAlert(null);
                              }
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Observaciones del Terapeuta (OSS):</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessOss}
                              onChange={(e) => setNewSessOss(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Adherencia a Tareas (ADD):</label>
                            <select
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                              value={newSessAdd}
                              onChange={(e) => setNewSessAdd(e.target.value)}
                            >
                              <option value="100%">100% Adherencia</option>
                              <option value="80%">80% Adherencia</option>
                              <option value="50%">50% Adherencia</option>
                              <option value="0%">0% No realizado</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Efecto de Maniobras (EFF):</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessEff}
                              onChange={(e) => setNewSessEff(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* PANEL DE CAPTURA VALORACIÓN DEL CAMBIO (VC) PARA ESTA SESIÓN */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                          <span className="font-bold text-clinical-dark flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-clinical-teal" />
                            Valoración del Cambio para esta Sesión
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">Percepción:</label>
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVcPercepcion}
                                onChange={(e) => setNewVcPercepcion(e.target.value)}
                              >
                                <option value="Sin cambios">Sin cambios</option>
                                <option value="Mejoría leve">Mejoría leve</option>
                                <option value="Mejoría significativa">Mejoría significativa</option>
                                <option value="Nuevo patrón">Nuevo patrón</option>
                                <option value="Empeoramiento">Empeoramiento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">Pensamientos:</label>
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVcPensamientos}
                                onChange={(e) => setNewVcPensamientos(e.target.value)}
                              >
                                <option value="Sin cambios">Sin cambios</option>
                                <option value="Mejoría leve">Mejoría leve</option>
                                <option value="Mejoría significativa">Mejoría significativa</option>
                                <option value="Empeoramiento">Empeoramiento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">Sensaciones:</label>
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVcSensaciones}
                                onChange={(e) => setNewVcSensaciones(e.target.value)}
                              >
                                <option value="Sin cambios">Sin cambios</option>
                                <option value="Mejoría leve">Mejoría leve</option>
                                <option value="Mejoría significativa">Mejoría significativa</option>
                                <option value="Empeoramiento">Empeoramiento</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* PANEL DE CAPTURA VALORACIÓN GLOBAL (VG) PARA ESTA SESIÓN */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                          <span className="font-bold text-clinical-dark flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-clinical-accent" />
                            Valoración Global (Nivel de Satisfacción 1-10)
                          </span>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">YO (Cuerpo/Trabajo):</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVgYo}
                                onChange={(e) => setNewVgYo(parseInt(e.target.value) || 5)}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">DEMÁS (Familia/Pareja):</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVgDemas}
                                onChange={(e) => setNewVgDemas(parseInt(e.target.value) || 5)}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">MUNDO (Sociedad):</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVgMundo}
                                onChange={(e) => setNewVgMundo(parseInt(e.target.value) || 5)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Situación Actual General:</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessSituation}
                              onChange={(e) => setNewSessSituation(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Observaciones Próxima Sesión:</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessObsNext}
                              onChange={(e) => setNewSessObsNext(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
                        onClick={() => setIsCreatingSession(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={sessionMode === 'ia' && !aiValidated}
                        className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        Validar y Guardar Sesión
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Visualizador de Detalle de Sesión Seleccionada */
                  activeSessionDetail ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 text-xs text-slate-600 leading-relaxed">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-clinical-dark">Detalle de Sesión {activeSessionDetail.number}</h3>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Fecha de registro: {activeSessionDetail.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-clinical-accent border border-blue-100 rounded font-bold uppercase text-[10px]">
                            Fase: {activeSessionDetail.phase}
                          </span>
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-clinical-teal border border-emerald-100 rounded font-bold uppercase text-[10px]">
                            {activeSessionDetail.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Info de TBE asignado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Protocolo Clínico TBE:</span>
                          <span className="text-sm font-bold text-clinical-dark block">{activeSessionDetail.protocol}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Diagnóstico Operativo (Dx.OP):</span>
                          <span className="text-sm font-bold text-clinical-dark block">{activeSessionDetail.dxOp}</span>
                        </div>
                      </div>

                      {/* Notas de la Sesión */}
                      <div className="space-y-1">
                        <span className="text-clinical-dark font-bold block">Notas Clínicas / Síntesis de la Sesión:</span>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                          {activeSessionDetail.notes}
                        </div>
                      </div>

                      {/* Prescripciones Asignadas */}
                      <div className="space-y-1.5">
                        <span className="text-clinical-dark font-bold block">Prescripciones / Tareas Asignadas (PX):</span>
                        <div className="flex flex-wrap gap-2">
                          {activeSessionDetail.px.map((p, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-clinical-teal/10 border border-clinical-teal/20 text-clinical-teal rounded font-bold uppercase text-[10px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Foco cognitivo y reestructuraciones */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                          <span className="font-bold text-clinical-dark block">Frase Foco 1 (F1):</span>
                          <p className="italic mt-1 text-slate-700">&ldquo;{activeSessionDetail.f1}&rdquo;</p>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                          <span className="font-bold text-clinical-dark block">Frase Foco 2 (F2):</span>
                          <p className="italic mt-1 text-slate-700">&ldquo;{activeSessionDetail.f2}&rdquo;</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-bold block text-[9px] uppercase">Adherencia</span>
                          <span className="text-xs font-bold text-clinical-dark block mt-1">{activeSessionDetail.add}</span>
                        </div>
                        <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-bold block text-[9px] uppercase">Resonancia</span>
                          <span className="text-xs font-bold text-clinical-dark block mt-1">{activeSessionDetail.rss}</span>
                        </div>
                        <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-bold block text-[9px] uppercase">Efecto Maniobras</span>
                          <span className="text-xs font-bold text-clinical-dark block mt-1">{activeSessionDetail.eff}</span>
                        </div>
                        <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-bold block text-[9px] uppercase">Audio</span>
                          <span className="text-xs font-bold text-clinical-dark block mt-1">{activeSessionDetail.audioDuration || 'Sin grabar'}</span>
                        </div>
                      </div>

                      {/* Observaciones próxima sesión */}
                      <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="font-bold text-slate-500 block">Situación general actual:</span>
                          <p className="mt-0.5">{activeSessionDetail.situation}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block">Indicación próxima sesión:</span>
                          <p className="mt-0.5">{activeSessionDetail.observationsNextSession}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                      Selecciona una sesión en la lista para ver el reporte detallado.
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* VALORACIÓN DEL CAMBIO (VC) CHART */}
          {tbeSubTab === 'vc' && (
            <div className="space-y-6">
              {/* Gráfico */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-clinical-dark uppercase">Evolución de Valoración del Cambio (VC) por Sesión</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Escala: Marcador Inicio (1) → Sin cambios (2) → Mejoría leve (3) → Mejoría Significativa (4) → Nuevo Patrón (4.5)
                  </span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vcChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Percepción" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Pensamientos" stroke="#0d9488" strokeWidth={2} />
                      <Line type="monotone" dataKey="Sensaciones" stroke="#4f46e5" strokeWidth={2} />
                      <Line type="monotone" dataKey="Sintomas" stroke="#ea580c" strokeWidth={2} />
                      <Line type="monotone" dataKey="Crisis" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reglas e Historial */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-xs text-clinical-dark uppercase">
                  Registro de Criterios Clínicos por Sesión
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Sesión</th>
                        <th className="p-3">Percepción</th>
                        <th className="p-3">Pensamientos</th>
                        <th className="p-3">Sensaciones</th>
                        <th className="p-3">Reacciones</th>
                        <th className="p-3">Síntomas</th>
                        <th className="p-3">Crisis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {vcHistory.map((vc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-clinical-dark">Sesión {vc.sessionNum}</td>
                          <td className="p-3">{vc.percepcion}</td>
                          <td className="p-3">{vc.pensamientos}</td>
                          <td className="p-3">{vc.sensaciones}</td>
                          <td className="p-3">{vc.reacciones}</td>
                          <td className="p-3">{vc.sintomas}</td>
                          <td className="p-3">{vc.crisis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VALORACIÓN GLOBAL (VG) YO/DEMÁS/MUNDO */}
          {tbeSubTab === 'vg' && (
            <div className="space-y-6">
              {/* Gráfico comparativo */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-clinical-dark uppercase">Comparativo Valoración Global (Satisfacción 1-10)</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Esferas de la vida: Yo (Cuerpo/Mente) vs Demás (Pareja/Familia) vs Mundo (Sociedad)</span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vgChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Yo" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Demás" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Mundo" fill="#ea580c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Explicación de los Criterios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
                  <span className="font-bold text-clinical-dark block border-b border-slate-100 pb-2 mb-2">Esfera: YO</span>
                  <p className="text-slate-500 leading-relaxed">
                    Mide el grado de estabilidad, cuidado físico, deporte, estudio, desempeño laboral y contención emocional interna que describe el paciente sesión a sesión.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
                  <span className="font-bold text-clinical-dark block border-b border-slate-100 pb-2 mb-2">Esfera: DEMÁS</span>
                  <p className="text-slate-500 leading-relaxed">
                    Evalúa la calidad del vínculo afectivo con su pareja, relación con los hijos, dinámica familiar de origen, y red de amigos.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
                  <span className="font-bold text-clinical-dark block border-b border-slate-100 pb-2 mb-2">Esfera: MUNDO</span>
                  <p className="text-slate-500 leading-relaxed">
                    Califica la interacción con la sociedad, adaptación a eventos situacionales externos (cambios de residencia, economía, crisis laborales).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REESTRUCTURACIONES (RST) */}
          {tbeSubTab === 'rst' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-clinical-dark uppercase">
                Historial de Reestructuraciones Esenciales (RST)
              </div>
              <div className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 space-y-2 hover:bg-slate-55/20">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-clinical-accent">Sesión {sess.number}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Fecha: {sess.date}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 leading-relaxed mt-1">
                      <div className="bg-slate-50 p-3 rounded border border-slate-100">
                        <span className="font-bold text-clinical-dark block">Intervención Lingüística (F1):</span>
                        <p className="italic text-slate-700 mt-1">&ldquo;{sess.f1}&rdquo;</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-100">
                        <span className="font-bold text-clinical-dark block">Efecto Terapéutico (F2 / Reestructuración):</span>
                        <p className="italic text-slate-700 mt-1">&ldquo;{sess.f2}&rdquo;</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: PSIQUIATRÍA */}
      {activeTab === 'psiquiatria' && (
        <form onSubmit={handleSavePsychiatry} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 text-xs text-slate-600">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-clinical-accent" />
            <h3 className="text-sm font-bold text-clinical-dark">Expediente Médico Psiquiátrico</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Diagnóstico Nosológico Clínico:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                value={psyDxNosologico}
                onChange={(e) => setPsyDxNosologico(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Criterio DSM-5TR:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                value={psyDsm5}
                onChange={(e) => setPsyDsm5(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Criterio CIE-11:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                value={psyCie11}
                onChange={(e) => setPsyCie11(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Pronóstico de Evolución:</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-semibold text-clinical-dark"
                value={psyPrognosis}
                onChange={(e) => setPsyPrognosis(e.target.value as any)}
              >
                <option value="excelente">Excelente</option>
                <option value="bueno">Bueno</option>
                <option value="reservado">Reservado</option>
                <option value="malo">Malo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">Plan de Tratamiento Farmacológico:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                value={psyPlan}
                onChange={(e) => setPsyPlan(e.target.value)}
              />
            </div>
          </div>

          {/* Fármacos Prescritos por Sesión */}
          <div className="space-y-3">
            <span className="font-bold text-clinical-dark block border-b border-slate-100 pb-2">Esquema Psicotrópico Farmacológico</span>
            
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">Psicofármaco</th>
                    <th className="p-3 text-center">Mañana</th>
                    <th className="p-3 text-center">Tarde</th>
                    <th className="p-3 text-center">Noche</th>
                    <th className="p-3">Efecto Secundario (EFF)</th>
                    <th className="p-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {drugs.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-bold text-clinical-dark">{d.name}</td>
                      <td className="p-3 text-center">{d.doseMorning}</td>
                      <td className="p-3 text-center">{d.doseAfternoon}</td>
                      <td className="p-3 text-center">{d.doseNight}</td>
                      <td className="p-3 text-clinical-risk">{d.eff}</td>
                      <td className="p-3 text-slate-500">{d.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simulación IA Resumen de Fármacos */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-clinical-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-clinical-dark block">Análisis Clínico de Adherencia Farmacológica (Sugerencia IA)</span>
                <p className="mt-1 leading-relaxed text-slate-600">
                  La paciente mantiene estabilidad y adherencia alta al tratamiento psicotrópico. La disminución de dosis nocturnas de Benzodiazepinas (Alprazolam) en un 25% correlaciona favorablemente con la realización exitosa de las prescripciones conductuales (Peor Fantasía) y disminución del pánico basal.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Guardar Expediente Psiquiátrico
            </button>
          </div>
        </form>
      )}

      {/* PESTAÑA: DATOS GENERALES */}
      {activeTab === 'datos' && activePatient && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clipboard className="w-5 h-5 text-clinical-accent" />
            <h3 className="text-sm font-bold text-clinical-dark">Ficha de Admisión e Historia Clínica Completa</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Nombre Completo:</span>
              <span className="text-xs font-bold text-clinical-dark block mt-0.5">{activePatient.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">CURP:</span>
              <span className="text-xs font-mono font-bold text-slate-600 block mt-0.5">{activePatient.curp}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Contacto Móvil:</span>
              <span className="text-xs font-medium text-slate-700 block mt-0.5">{activePatient.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Correo Electrónico:</span>
              <span className="text-xs font-medium text-slate-700 block mt-0.5">{activePatient.email}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha de Registro en BreveMente:</span>
              <span className="text-xs font-medium text-slate-700 block mt-0.5">{activePatient.registrationDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha de Nacimiento:</span>
              <span className="text-xs font-medium text-slate-700 block mt-0.5">{activePatient.birthDate}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="text-clinical-dark font-bold block">Motivo Inicial de Consulta Reportado:</span>
            <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-lg">
              {activePatient.motif}
            </div>
          </div>

          {/* Estatus Consentimiento */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-clinical-dark block">Consentimiento Informado Aceptado</span>
                <span className="text-[10px] text-slate-400">Firmado digitalmente el {activePatient.registrationDate}</span>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/intake?id=${activePatient.id}`)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded font-semibold text-[10px] transition-colors"
            >
              Ver Documento de Privacidad Firmado
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA: AUDITORÍA DEL EXPEDIENTE */}
      {activeTab === 'auditoria' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-clinical-dark">Registro Seguro de Auditoría del Expediente</h3>
            </div>
            <span className="text-[9px] bg-red-100 text-red-800 font-bold border border-red-200 px-2 py-0.5 rounded uppercase">
              HIPAA / Confidencialidad
            </span>
          </div>

          <p className="text-slate-500 leading-relaxed">
            A continuación se listan de forma inmutable todas las acciones, accesos, lecturas y modificaciones realizadas por el cuerpo médico y administrativo sobre los registros clínicos de este paciente.
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-slate-150">
              {patientLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No hay registros de auditoría asociados a este expediente en esta sesión.
                </div>
              ) : (
                patientLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-clinical-dark font-bold">{log.userName}</span>
                        <span className="text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase bg-slate-100 border-slate-200 text-slate-500">
                          {log.role.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-clinical-accent bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold uppercase">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-normal">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 font-bold">
                      {new Date(log.timestamp).toLocaleString('es-MX')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
