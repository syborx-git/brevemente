import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FolderHeart, Activity, FileText, Volume2, Mic, Square,
  Sparkles, Plus, Save, AlertTriangle, TrendingUp, GitBranch,
  ShieldAlert, Clipboard, User, Heart, AlertOctagon, Check,
  Lock, ShieldCheck, UserCheck, CreditCard, Trash2, MessageCircle,
  BookOpen, CheckCircle2, Paperclip, Download, Eye
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

import {
  Role, Patient, ClinicalRecord as ClinicalRecordType, Session, AuditLog, Payment,
  SupervisionLog, PhysicalCertificateLog
} from '../types/clinical';
import { ProtocolDecisionPanel } from '../components/ProtocolDecisionPanel';
import { RiskAlertBanner } from '../components/RiskAlertBanner';
import { auditLogService } from '../services/auditLogService';
import { riskSimulationService } from '../services/riskSimulationService';
import { supervisionRequestService } from '../services/supervisionRequestService';
import { supervisionLogService } from '../services/supervisionLogService';
import { physicalCertificateService } from '../services/physicalCertificateService';
import { recordService } from '../services/recordService';
import { sessionService } from '../services/sessionService';
import { patientService } from '../services/patientService';
import { paymentService } from '../services/paymentService';
import { therapistService } from '../services/therapistService';
import { isActionBlockedByLegalConsent, LEGAL_CONSENT_TOOLTIP, checkAgingMinorPatients } from '../utils/legalConsent';
import { SupervisionLogModal } from '../components/SupervisionLogModal';
import { RegisterPhysicalCertificateModal } from '../components/RegisterPhysicalCertificateModal';
import { PhysicalCertificateDetailModal } from '../components/PhysicalCertificateDetailModal';

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

  // Verificación de bloqueo legal de grabación
  const legalBlockCheck = isActionBlockedByLegalConsent(activePatient);
  const isRecordingBlocked = legalBlockCheck.isBlocked;
  const [reconsentimientoFormalizado, setReconsentimientoFormalizado] = useState(false);
  const [isFormalizingReconsent, setIsFormalizingReconsent] = useState(false);
  const requiresReconsentimiento =
    !reconsentimientoFormalizado &&
    !!activePatient &&
    checkAgingMinorPatients([activePatient]).length > 0;

  // Al cambiar de paciente, se reinicia el estado local del reconsentimiento
  useEffect(() => {
    setReconsentimientoFormalizado(false);
  }, [patientId]);
  const [showConsentSignModal, setShowConsentSignModal] = useState(false);
  const [repSignatureName, setRepSignatureName] = useState('');
  const [signatureError, setSignatureError] = useState('');

  // Estados locales para simular persistencia
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecordType | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'datos' | 'tbe' | 'psiquiatria' | 'auditoria' | 'pagos' | 'supervision' | 'constancias'>('datos');
  const [tbeSubTab, setTbeSubTab] = useState<'dx' | 'sesiones' | 'vc' | 'vg' | 'rst'>('sesiones');
  const [activeSessionDetail, setActiveSessionDetail] = useState<Session | null>(null);
  // Prescripción seleccionada para ver su compliance (EFF, ADD, OSS, RSS)
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);

  // ── Bitácoras de Supervisión ───────────────────────────────────────────────
  const [supervisionLogs, setSupervisionLogs] = useState<SupervisionLog[]>([]);
  const [showSupervisionModal, setShowSupervisionModal] = useState(false);

  useEffect(() => {
    if (!activePatient) return;
    const refresh = () => setSupervisionLogs(supervisionLogService.getByPatientId(activePatient.id));
    refresh();
    window.addEventListener('brevemente_supervision_log_changed', refresh);
    return () => window.removeEventListener('brevemente_supervision_log_changed', refresh);
  }, [patientId, activePatient]);

  // ── Registro de Constancias Físicas ────────────────────────────────────────
  const [physicalCertificates, setPhysicalCertificates] = useState<PhysicalCertificateLog[]>([]);
  const [showRegisterCertModal, setShowRegisterCertModal] = useState(false);
  const [selectedPhysicalCert, setSelectedPhysicalCert] = useState<PhysicalCertificateLog | null>(null);

  useEffect(() => {
    if (!activePatient) return;
    const refresh = () => setPhysicalCertificates(physicalCertificateService.getByPatientId(activePatient.id));
    refresh();
    window.addEventListener('brevemente_physical_certificate_changed', refresh);
    return () => window.removeEventListener('brevemente_physical_certificate_changed', refresh);
  }, [patientId, activePatient]);

  // ── Registro de pagos (Pestaña Pagos) ───────────────────────────────────────
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState<{
    concept: string; amount: string; date: string;
    method: Payment['method']; status: Payment['status']; notes: string;
  }>({ concept: '', amount: '', date: '', method: 'transferencia', status: 'pagado', notes: '' });
  const canManagePayments = therapistService.canManagePayments(userRole);

  // ── Regla de negocio: recordatorio de pago por WhatsApp ─────────────────────
  // REGLA DE NEGOCIO (ver therapistService.canManagePayments):
  //   el recordatorio lo envía quien gestiona la facturación:
  //   terapeuta SIN asistente → sí; terapeuta CON asistente → lo hace su asistente.
  // TODAVÍA NO CONECTADA → en demo se muestra SIEMPRE.
  // Cuando exista el backend, reemplazar por:
  //   const showPaymentReminder = therapistService.canManagePayments(userRole);
  const showPaymentReminder: boolean = true;

  // Cargar pagos del paciente activo y reaccionar a cambios
  useEffect(() => {
    if (!activePatient) return;
    const refresh = () => setPayments(paymentService.getByPatientId(activePatient.id));
    refresh();
    window.addEventListener('brevemente_payment_changed', refresh);
    return () => window.removeEventListener('brevemente_payment_changed', refresh);
  }, [patientId, activePatient]);

  const totalCobrado = payments.filter(p => p.status === 'pagado').reduce((s, p) => s + p.amount, 0);
  const totalPendiente = payments.filter(p => p.status === 'pendiente' || p.status === 'parcial').reduce((s, p) => s + p.amount, 0);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    const amount = parseFloat(newPayment.amount);
    if (!newPayment.concept.trim() || !newPayment.date || isNaN(amount) || amount < 0) {
      alert('Completa concepto, monto y fecha del pago.');
      return;
    }
    paymentService.addPayment({
      patientId: activePatient.id,
      patientName: activePatient.name,
      concept: newPayment.concept.trim(),
      amount,
      date: newPayment.date,
      method: newPayment.method,
      status: newPayment.status,
      notes: newPayment.notes || undefined,
    }, { id: 'user-current', name: userName, role: userRole });
    setShowPaymentModal(false);
    setNewPayment({ concept: '', amount: '', date: '', method: 'transferencia', status: 'pagado', notes: '' });
  };

  const handleSendPaymentReminder = (pay: Payment) => {
    const phoneDigits = (activePatient?.phone || '').replace(/\D/g, '');
    if (!phoneDigits) {
      alert('El paciente no tiene teléfono registrado.');
      return;
    }
    const message = `Hola ${pay.patientName}, te recordamos que tienes un pago pendiente de $${pay.amount} MXN por "${pay.concept}". ¿Podrías realizar el pago? Gracias.`;
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, '_blank');
    auditLogService.addLog(
      'Recordatorio de pago',
      `Envió recordatorio de pago por WhatsApp a ${pay.patientName} por "${pay.concept}" ($${pay.amount} MXN).`,
      'pagos',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  const handleSignRepresentativeConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !activePatient.representante) return;

    if (!repSignatureName.trim()) {
      setSignatureError('Debe ingresar el nombre completo del representante legal para firmar.');
      return;
    }

    const updatedPatient: Patient = {
      ...activePatient,
      consentimientoRepresentanteFirmado: true
    };

    await patientService.update(updatedPatient);
    activePatient.consentimientoRepresentanteFirmado = true;

    // Registrar en auditoría
    auditLogService.addLog(
      'Firma de consentimiento de representante',
      `El representante legal ${activePatient.representante.nombreCompleto} formalizó la firma de consentimiento informado para ${activePatient.name}. Acciones clínicas desbloqueadas.`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );

    setShowConsentSignModal(false);
    setRepSignatureName('');
    setSignatureError('');
    alert('✓ Consentimiento del representante legal formalizado con éxito. Grabación, citas y constancias habilitadas.');
  };

  const handleFormalizeAutonomousReconsent = async () => {
    if (!activePatient || isFormalizingReconsent) return;
    setIsFormalizingReconsent(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const updatedPatient: Patient = {
        ...activePatient,
        capacidadConsentimiento: {
          ...activePatient.capacidadConsentimiento,
          estado: 'AUTONOMO',
          determinadoPor: userName,
          fechaDeterminacion: today,
          fechaRevision: null,
          motivo: 'Reconsentimiento autónomo formalizado al cumplir 18 años.'
        },
        representante: null,
        pendienteReconsentimiento: false,
        notificacionesRepresentanteRevocadas: true
      };

      await patientService.update(updatedPatient);

      // Reflejo inmediato en UI (mismo patrón que la firma del representante)
      activePatient.capacidadConsentimiento.estado = 'AUTONOMO';
      activePatient.representante = null;
      activePatient.pendienteReconsentimiento = false;
      activePatient.notificacionesRepresentanteRevocadas = true;

      auditLogService.addLog(
        'Reconsentimiento autónomo',
        `Se formalizó el reconsentimiento autónomo de ${activePatient.name} al cumplir 18 años. Notificaciones al representante revocadas.`,
        'expediente',
        { id: 'user-current', name: userName, role: userRole }
      );

      setReconsentimientoFormalizado(true);

      alert('✓ Reconsentimiento autónomo formalizado. El expediente pasa a régimen autónomo y la alerta de mayoría de edad queda resuelta.');
    } finally {
      setIsFormalizingReconsent(false);
    }
  };

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
  const [newSessPhase, setNewSessPhase] = useState('Desbloqueo');
  const [newSessProtocol, setNewSessProtocol] = useState('Ataque de Pánico');
  const [newSessDxOp, setNewSessDxOp] = useState('SPR Fóbico');
  const [newSessTrastorno, setNewSessTrastorno] = useState('');
  const [newSessPx, setNewSessPx] = useState<string[]>([]);
  const [newSessF1, setNewSessF1] = useState('');
  const [newSessF2, setNewSessF2] = useState('');
  const [newSessOss, setNewSessOss] = useState('');
  const [newSessAdd, setNewSessAdd] = useState('100%');
  const [newSessCumplimiento, setNewSessCumplimiento] = useState('');
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

  // Valoración Global (VG) local — binaria (esfera señalada o no)
  const [vgHistory, setVgHistory] = useState<Array<{
    sessionNum: number;
    yo: boolean;
    demas: boolean;
    mundo: boolean;
  }>>([
    { sessionNum: 1, yo: true, demas: false, mundo: false },
    { sessionNum: 2, yo: true, demas: true, mundo: false }
  ]);

  const [newVgYo, setNewVgYo] = useState(false);
  const [newVgDemas, setNewVgDemas] = useState(false);
  const [newVgMundo, setNewVgMundo] = useState(false);

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
    // Cargar historial de sesiones a través del servicio
    sessionService.getByPatientId(patientId).then((sessions) => {
      if (sessions.length === 0) {
        // No hay sesiones guardadas: usar mocks iniciales (solo demo)
        const initialSess = [
          {
            id: 'session-1-1',
            patientId: 'patient-1',
            number: 1,
            date: '2026-08-10',
            phase: 'Definición del problema',
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
            phase: 'Desbloqueo',
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
        setSessions(sessions);
        if (sessions.length > 0) setActiveSessionDetail(sessions[sessions.length - 1]);
      }
    });

    // Cargar ficha a través del servicio
    recordService.getByPatientId(patientId).then((record) => {
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

      setClinicalRecord(record || mockRecord);
    });

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



  // Escuchar inyecciones de LEVA
  useEffect(() => {
    const handleLevaInject = (e: Event) => {
      const text = (e as CustomEvent).detail;
      setNewSessNotes(prev => {
        if (!text) {
          setIsNotesGeneratedByIa(false);
          return '';
        }
        setIsNotesGeneratedByIa(true);
        return prev ? `${prev}\n\n[Sugerencia LEVA (Borrador)]: ${text}` : `[Sugerencia LEVA (Borrador)]: ${text}`;
      });
    };
    window.addEventListener('brevemente_leva_inject', handleLevaInject);
    return () => {
      window.removeEventListener('brevemente_leva_inject', handleLevaInject);
    };
  }, []);

  const handleStartRecording = () => {
    if (isRecordingBlocked) {
      alert(LEGAL_CONSENT_TOOLTIP);
      return;
    }
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
      // [Opción B] La IA no fuerza la fase: hereda la fase activa del tratamiento
      setNewSessPhase(sessions.length > 0 ? sessions[sessions.length - 1].phase : 'Definición del problema');
      setNewSessProtocol('Ataque de Pánico');
      setNewSessDxOp('SPR Fóbico');
      setNewSessPx(['Diario de abordo', 'WF 30 min']);
      setNewSessF1('La fantasía del peor escenario: "Míralo a los ojos y el fantasma desaparecerá."');
      setNewSessF2('Prescribir el síntoma en un horario fijo a las 18:00.');
      setNewSessOss('Paciente describe mejorías notables en su rutina de tarde tras practicar la peor fantasía.');
      setNewSessAdd('90%');
      setNewSessCumplimiento('adherencia');
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

  // [DEMO] Disparador de un clic para simular una señal de riesgo en presentaciones
  const handleSimulateRisk = () => {
    if (!activePatient) return;
    const demoNote =
      'La paciente se mostró muy angustiada y mencionó en dos ocasiones que en los momentos más difíciles ha pensado en hacerse daño y que a veces siente que ya no puede más.';
    setNewSessNotes(demoNote);
    const risk = riskSimulationService.checkTextForRisk(demoNote);
    if (risk.isRisk) {
      setActiveRiskAlert({ isRisk: true, message: risk.reason });
      setIsNotesGeneratedByIa(true);
    }
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

  // [Opción B] Override manual de fase (registrado en auditoría para trazabilidad)
  const handleManualPhaseChange = (phase: string) => {
    setNewSessPhase(phase);
    auditLogService.addLog(
      'Ajuste manual de fase clínica',
      `El profesional fijó manualmente la fase de la sesión de ${activePatient?.name} en "${phase}" (Protocolo: ${newSessProtocol}).`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );
  };


  // [Opción B] Al abrir el formulario, la nueva sesión HEREDA la fase de la última sesión
  const handleStartNewSession = () => {
    const lastPhase = sessions.length > 0
      ? sessions[sessions.length - 1].phase
      : 'Definición del problema';
    setNewSessPhase(lastPhase);
    setIsCreatingSession(true);
  };


  const handleSaveSession = async (e: React.FormEvent) => {
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
      trastorno: newSessTrastorno || undefined,
      px: newSessPx,
      f1: newSessF1,
      f2: newSessF2,
      oss: newSessOss,
      add: newSessAdd,
      cumplimiento: newSessCumplimiento,
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

    // Guardar a través del servicio (la "costura")
    await sessionService.saveByPatientId(patientId, updatedSessions);

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

  const handleSaveDx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalRecord) return;

    await recordService.saveByPatientId(patientId, clinicalRecord);

    // Registrar en auditoría
    auditLogService.addLog(
      'Actualización de expediente',
      `Actualizó el Diagnóstico Estratégico (DX) del paciente ${activePatient?.name}`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );

    alert('Diagnóstico estratégico actualizado.');
  };

  const handleSavePsychiatry = async (e: React.FormEvent) => {
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

    await recordService.saveByPatientId(patientId, updatedRecord);

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
    Reacciones: getVcValue(vc.reacciones),
    Crisis: getVcValue(vc.crisis)
  }));

  const vgChartData = vgHistory.map(vg => ({
    name: `Sesión ${vg.sessionNum}`,
    Yo: vg.yo ? 10 : 0,
    Demás: vg.demas ? 10 : 0,
    Mundo: vg.mundo ? 10 : 0,
  }));

  // Obtener logs de auditoría locales para este paciente
  const patientLogs = auditLogService.getLogs().filter(log =>
    log.details.includes(activePatient?.name || '')
  );

  return (
    <div className="space-y-6">
      {/* Risk alert banner (sticky: te sigue al hacer scroll) */}
      {activeRiskAlert && activePatient && (
        <div className="sticky top-0 z-40">
          <RiskAlertBanner
            patientName={activePatient.name}
            message={activeRiskAlert.message}
            onEscalate={handleEscalateRisk}
            userRole={userRole}
          />
        </div>
      )}

      {/* Selector de Expedientes (carpetas horizontales) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FolderHeart className="w-4 h-4 text-clinical-accent" />
          <span className="text-xs font-bold text-clinical-dark uppercase tracking-wider">Expedientes</span>
          <span className="text-[10px] text-slate-400">({patients.length})</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-3">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/expedientes?id=${p.id}`)}
                className={`shrink-0 w-44 text-left p-3 rounded-xl border-2 shadow-sm transition-all cursor-pointer ${p.id === patientId
                  ? 'border-clinical-accent bg-clinical-accent/5'
                  : 'border-slate-200 bg-white hover:border-[#75AFBC]'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-clinical-accent/10 border border-clinical-accent/20 flex items-center justify-center shrink-0">
                    <FolderHeart className="w-4 h-4 text-clinical-accent" />
                  </div>
                  <div className="min-w-0">
                    <span className={`font-bold text-xs block truncate ${p.id === patientId ? 'text-clinical-accent' : 'text-clinical-dark'}`}>
                      {p.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block capitalize">{p.status}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${p.riskLevel === 'alto' ? 'bg-red-500' : p.riskLevel === 'medio' ? 'bg-amber-500' : 'bg-green-500'}`}
                    title={`Riesgo ${p.riskLevel}`}
                  />
                  <span className="text-[9px] text-slate-500 truncate">{p.therapistName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

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
                  <span className={`w-2.5 h-2.5 rounded-full ${clinicalRecord.riskLevel === 'alto' ? 'bg-red-500' :
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
              <span className={`text-[10px] px-2.5 py-1 border rounded-md font-bold uppercase ${activePatient?.registryMode === 'ia'
                ? 'bg-clinical-teal/10 border-clinical-teal/30 text-clinical-teal'
                : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                {activePatient?.registryMode === 'ia' ? 'Grabación e IA activa' : '100% Manual'}
              </span>
              <button
                onClick={() => {
                  if (!activePatient) return;
                  supervisionRequestService.createRequest(
                    activePatient.id,
                    activePatient.name,
                    'Caso que requiere revisión del supervisor clínico.',
                    { id: 'therapist-1', name: userName, role: userRole }
                  );
                  alert('✓ Solicitud de supervisión enviada al supervisor clínico y registrada en la bitácora de auditoría.');
                }}
                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold shadow-sm transition-colors"
              >
                📋 Solicitar Supervisión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Contingencia y Crisis Resueltas */}
      {clinicalRecord?.crisisHistory && clinicalRecord.crisisHistory.length > 0 && (
        <div className="bg-red-50/40 border border-red-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-red-200/70 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-red-900 text-xs uppercase tracking-wider">
                Eventos de Contingencia y Crisis Resueltas ({clinicalRecord.crisisHistory.length})
              </h3>
            </div>
            <span className="text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded uppercase">
              Expediente Clínico Oficial
            </span>
          </div>

          <div className="space-y-2.5">
            {clinicalRecord.crisisHistory.map((inc) => (
              <div key={inc.id} className="bg-white border border-red-150 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-800">
                    Intervención: {inc.reason}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(inc.resolvedAt).toLocaleString('es-MX')} · Atendido por {inc.resolvedBy}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-slate-700 text-[11px] leading-relaxed">
                  <b className="text-slate-800 block mb-0.5">Nota de intervención clínica:</b>
                  {inc.resolutionDetails?.clinicalNote}
                </div>
                {inc.resolutionDetails?.actionsTaken && inc.resolutionDetails.actionsTaken.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {inc.resolutionDetails.actionsTaken.map((act, i) => (
                      <span key={i} className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        ✓ {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ficha de Representación Legal y Consentimiento */}
      {activePatient && (activePatient.representante || activePatient.capacidadConsentimiento?.estado !== 'AUTONOMO') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-clinical-accent" />
              <h3 className="font-bold text-clinical-dark text-xs uppercase tracking-wider">
                Régimen Legal y Capacidad de Consentimiento
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${activePatient.capacidadConsentimiento?.estado === 'REPRESENTADO_POR_EDAD'
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : activePatient.capacidadConsentimiento?.estado === 'REPRESENTADO_POR_CONDICION'
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
              {activePatient.capacidadConsentimiento?.estado === 'REPRESENTADO_POR_EDAD'
                ? 'Menor de edad'
                : activePatient.capacidadConsentimiento?.estado === 'REPRESENTADO_POR_CONDICION'
                  ? 'Con persona de apoyo'
                  : 'Pendiente de determinación'}
            </span>
          </div>

          {requiresReconsentimiento && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] font-extrabold text-amber-800 block">
                    Paciente en mayoría de edad — requiere reconsentimiento autónomo
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    Al cumplir 18 años, el consentimiento del representante queda revocado y el paciente debe formalizar su propio consentimiento.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFormalizeAutonomousReconsent}
                disabled={isFormalizingReconsent}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-1 shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Formalizar reconsentimiento autónomo
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {activePatient.representante && (
              <>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Representante / Apoyo:</span>
                  <span className="font-bold text-clinical-dark">{activePatient.representante.nombreCompleto}</span>
                  <span className="text-[10px] text-slate-500 block">
                    ({activePatient.representante.parentesco === 'PERSONA_DE_APOYO' ? 'Persona de apoyo designada' : activePatient.representante.parentesco})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Contacto:</span>
                  <span className="font-semibold text-slate-700">{activePatient.representante.telefono}</span>
                  <span className="text-[10px] text-slate-400 block">{activePatient.representante.correo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Acreditación:</span>
                  <span className="font-semibold text-slate-700">
                    {activePatient.representante.documentoIdentificacion ? '✓ ID Oficial' : 'Sin ID'} • {activePatient.representante.documentoVinculo ? '✓ Vínculo' : 'Sin acreditar'}
                  </span>
                  {activePatient.representante.otroProgenitorInformado && (
                    <span className="text-[10px] text-slate-500 block">
                      Otro progenitor informado: {activePatient.representante.otroProgenitorInformado === 'SI' ? 'Sí' : activePatient.representante.otroProgenitorInformado === 'NO' ? 'No' : 'No aplica'}
                    </span>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Consentimiento:</span>
                <span className={`text-[11px] font-bold ${activePatient.consentimientoRepresentanteFirmado ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {activePatient.consentimientoRepresentanteFirmado ? '✓ Formalizado y Válido' : 'Pendiente de Formalización'}
                </span>
              </div>
              {!activePatient.consentimientoRepresentanteFirmado && activePatient.representante && (
                <button
                  type="button"
                  onClick={() => setShowConsentSignModal(true)}
                  className="mt-2 px-3 py-1.5 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Formalizar Consentimiento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Principales */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('datos')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${activeTab === 'datos'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          Datos de Admisión e Historia Clínica
        </button>
        <button
          onClick={() => setActiveTab('psiquiatria')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${activeTab === 'psiquiatria'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          Tratamiento Psiquiátrico
        </button>
        <button
          onClick={() => setActiveTab('tbe')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${activeTab === 'tbe'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          Tratamiento Psicoterapéutico TBE
        </button>

        <button
          onClick={() => setActiveTab('pagos')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${activeTab === 'pagos'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          Pagos
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all ${activeTab === 'auditoria'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          Auditoría del Expediente
        </button>

        <button
          onClick={() => setActiveTab('supervision')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all flex items-center gap-1.5 ${activeTab === 'supervision'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          <span>Bitacoras Supervisión</span>
          {supervisionLogs.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'supervision' ? 'bg-clinical-accent/15 text-clinical-accent' : 'bg-slate-100 text-slate-500'}`}>
              {supervisionLogs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('constancias')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition-all flex items-center gap-1.5 ${activeTab === 'constancias'
            ? 'border-clinical-accent text-clinical-accent'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
        >
          <span>Constancias</span>
          {physicalCertificates.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'constancias' ? 'bg-clinical-accent/15 text-clinical-accent' : 'bg-slate-100 text-slate-500'}`}>
              {physicalCertificates.length}
            </span>
          )}
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
                    onChange={(e) => setClinicalRecord({ ...clinicalRecord, motif: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Descripción de la Conducta Sintomática:</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                    value={clinicalRecord.description || ''}
                    onChange={(e) => setClinicalRecord({ ...clinicalRecord, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Trastorno Estratégico Clasificado:</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                    value={clinicalRecord.trastornoEstrategico || ''}
                    onChange={(e) => setClinicalRecord({ ...clinicalRecord, trastornoEstrategico: e.target.value })}
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
                    onChange={(e) => setClinicalRecord({ ...clinicalRecord, evolutionType: e.target.value as any })}
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
                    onChange={(e) => setClinicalRecord({ ...clinicalRecord, objectivePatient: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Objetivos del Terapeuta:</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                    value={clinicalRecord.objectiveTherapist || ''}
                    onChange={(e) => setClinicalRecord({ ...clinicalRecord, objectiveTherapist: e.target.value })}
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
                      onClick={handleStartNewSession}
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
                        className={`p-3.5 cursor-pointer text-xs transition-all flex items-center justify-between ${activeSessionDetail?.id === sess.id && !isCreatingSession
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

                        {/* Alerta de bloqueo normativo si aplica */}
                        {isRecordingBlocked && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Grabación de sesión bloqueada:</span>
                              <span>{LEGAL_CONSENT_TOOLTIP}</span>
                            </div>
                          </div>
                        )}

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
                                disabled={isRecordingBlocked}
                                title={isRecordingBlocked ? LEGAL_CONSENT_TOOLTIP : 'Haga click para iniciar'}
                                onClick={handleStartRecording}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow ${isRecordingBlocked
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                  : 'bg-clinical-risk text-white hover:opacity-90'
                                  }`}
                              >
                                {isRecordingBlocked ? <Lock className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
                        onAdvancePhase={(nextPhase) => {
                          setNewSessPhase(nextPhase);
                          auditLogService.addLog(
                            'Avance de fase clínica',
                            `Se avanzó la fase del tratamiento de ${activePatient?.name} a "${nextPhase}" (Protocolo: ${newSessProtocol}). Condición de avance confirmada por el profesional.`,
                            'sesion',
                            { id: 'user-current', name: userName, role: userRole }
                          );
                        }}
                      />
                    )}

                    {/* CAMPOS CLÍNICOS EDITABLES */}
                    {(sessionMode === 'manual' || aiValidated) && (
                      <div className="space-y-4">
                        {/* [Opción B] Fase del tratamiento: se hereda, se puede avanzar o ajustar manualmente */}
                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">
                            Fase del tratamiento:
                            <span className="ml-2 text-[10px] text-slate-400 font-normal">
                              (se hereda de la última sesión · puedes ajustarla manualmente)
                            </span>
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                            value={newSessPhase}
                            onChange={(e) => handleManualPhaseChange(e.target.value)}
                          >
                            <option value="Definición del problema">Definición del problema</option>
                            <option value="Desbloqueo">Desbloqueo</option>
                            <option value="Consolidación">Consolidación</option>
                            <option value="Cierre">Cierre</option>
                          </select>
                        </div>

                        {/* Selector de Protocolo, DX.OP y Trastorno */}
                        {(sessionMode === 'manual' || aiValidated) && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">
                                Trastorno:
                                <span className="ml-2 text-[10px] text-slate-400 font-normal">(especificar si el protocolo no está disponible)</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. Trastorno de Ansiedad Generalizada, Fobia específica..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                                value={newSessTrastorno}
                                onChange={(e) => setNewSessTrastorno(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">RST 1 (F1):</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                              value={newSessF1}
                              onChange={(e) => setNewSessF1(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">RST 2 (F2):</label>
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
                                ✨ Borrador sugerido por LEVA
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

                        {/* [DEMO] Botón para simular señal de riesgo en presentaciones */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleSimulateRisk}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            🎬 Simular señal de riesgo (demo)
                          </button>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-semibold mb-1">Cumplimiento:</label>
                          <select
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                            value={newSessCumplimiento}
                            onChange={(e) => setNewSessCumplimiento(e.target.value)}
                          >
                            <option value="">Seleccionar cumplimiento...</option>
                            <option value="adherencia">Adherencia (ADD)</option>
                            <option value="observancia">Observancia (OSS)</option>
                            <option value="resistencia">Resistencia (RSS)</option>
                          </select>
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
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">Reacciones:</label>
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVcReacciones}
                                onChange={(e) => setNewVcReacciones(e.target.value)}
                              >
                                <option value="Sin cambios">Sin cambios</option>
                                <option value="Mejoría leve">Mejoría leve</option>
                                <option value="Mejoría significativa">Mejoría significativa</option>
                                <option value="Empeoramiento">Empeoramiento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">Síntomas:</label>
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVcSintomas}
                                onChange={(e) => setNewVcSintomas(e.target.value)}
                              >
                                <option value="Sin cambios">Sin cambios</option>
                                <option value="Mejoría leve">Mejoría leve</option>
                                <option value="Mejoría significativa">Mejoría significativa</option>
                                <option value="Empeoramiento">Empeoramiento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-0.5">Crisis:</label>
                              <select
                                className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                value={newVcCrisis}
                                onChange={(e) => setNewVcCrisis(e.target.value)}
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
                            Valoración Global (Señalar esferas)
                          </span>
                          <div className="grid grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={newVgYo}
                                onChange={(e) => setNewVgYo(e.target.checked)}
                                className="w-4 h-4 accent-clinical-accent"
                              />
                              <span className="font-semibold text-slate-600 text-xs">YO (Cuerpo/Trabajo)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={newVgDemas}
                                onChange={(e) => setNewVgDemas(e.target.checked)}
                                className="w-4 h-4 accent-clinical-accent"
                              />
                              <span className="font-semibold text-slate-600 text-xs">DEMÁS (Familia/Pareja)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={newVgMundo}
                                onChange={(e) => setNewVgMundo(e.target.checked)}
                                className="w-4 h-4 accent-clinical-accent"
                              />
                              <span className="font-semibold text-slate-600 text-xs">MUNDO (Sociedad)</span>
                            </label>
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
                        {activeSessionDetail.trastorno && (
                          <div className="sm:col-span-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Trastorno:</span>
                            <span className="text-sm font-bold text-clinical-dark block">{activeSessionDetail.trastorno}</span>
                          </div>
                        )}
                      </div>

                      {/* Prescripciones Asignadas */}
                      <div className="space-y-1.5">
                        <span className="text-clinical-dark font-bold block">
                          Prescripciones / Tareas Asignadas (PX):
                          <span className="ml-2 text-[9px] text-slate-400 font-normal">clic para ver compliance</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {activeSessionDetail.px.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              title="Ver compliance de la indicación"
                              onClick={() => setSelectedPrescription(p)}
                              className="px-2.5 py-1 bg-clinical-teal/10 border border-clinical-teal/20 text-clinical-teal rounded font-bold uppercase text-[10px] cursor-pointer hover:bg-clinical-teal/20 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Foco cognitivo y reestructuraciones */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                          <span className="font-bold text-clinical-dark block">RST 1 (F1):</span>
                          <p className="italic mt-1 text-slate-700">&ldquo;{activeSessionDetail.f1}&rdquo;</p>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                          <span className="font-bold text-clinical-dark block">RST 2 (F2):</span>
                          <p className="italic mt-1 text-slate-700">&ldquo;{activeSessionDetail.f2}&rdquo;</p>
                        </div>
                      </div>

                      {/* Notas de la Sesión */}
                      <div className="space-y-1">
                        <span className="text-clinical-dark font-bold block">Notas Clínicas / Síntesis de la Sesión:</span>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                          {activeSessionDetail.notes}
                        </div>
                      </div>

                      {/* Observaciones próxima sesión */}
                      <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="font-bold text-slate-500 block">Situación general actual:</span>
                          <p className="mt-0.5">{activeSessionDetail.situation}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block">Observaciones próxima sesión:</span>
                          <p className="mt-0.5">{activeSessionDetail.observationsNextSession}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-bold block text-[9px] uppercase">Cumplimiento</span>
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
                      <Line type="monotone" dataKey="Reacciones" stroke="rgb(182, 12, 234)" strokeWidth={2} />
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
                  <h3 className="text-xs font-bold text-clinical-dark uppercase">Comparativo Valoración Global (Esferas Señaladas)</h3>
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
                        <span className="font-bold text-clinical-dark block">RST:</span>
                        <p className="italic text-slate-700 mt-1">&ldquo;{sess.f1}&rdquo;</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-100">
                        <span className="font-bold text-clinical-dark block">Efecto Terapéutico (Reestructuración):</span>
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
      {/* PESTAÑA: PAGOS */}
      {activeTab === 'pagos' && activePatient && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-clinical-accent" />
              <h3 className="text-sm font-bold text-clinical-dark">Registro de Pagos</h3>
            </div>
            {canManagePayments ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar pago
              </button>
            ) : (
              <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded-full font-bold uppercase">
                Solo lectura · gestionado por el asistente
              </span>
            )}
          </div>

          {/* Resumen tipo Excel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold text-emerald-700">Total cobrado</p>
              <p className="text-lg font-bold text-emerald-800">${totalCobrado.toLocaleString('es-MX')} MXN</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold text-amber-700">Total pendiente</p>
              <p className="text-lg font-bold text-amber-800">${totalPendiente.toLocaleString('es-MX')} MXN</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold text-slate-500">Registros</p>
              <p className="text-lg font-bold text-slate-700">{payments.length}</p>
            </div>
          </div>

          {/* Tabla de pagos */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Registrado por</th>
                  {canManagePayments && <th className="p-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={canManagePayments ? 7 : 6} className="p-6 text-center text-slate-400">
                      Sin pagos registrados para este paciente.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-slate-500">{pay.date}</td>
                      <td className="p-3 font-semibold text-clinical-dark">{pay.concept}</td>
                      <td className="p-3 text-right font-bold">${pay.amount.toLocaleString('es-MX')}</td>
                      <td className="p-3 capitalize">{pay.method}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${pay.status === 'pagado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            pay.status === 'pendiente' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              pay.status === 'parcial' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {pay.status}
                          </span>
                          {(pay.status === 'pendiente' || pay.status === 'parcial') && showPaymentReminder && (
                            <button
                              onClick={() => handleSendPaymentReminder(pay)}
                              className="flex items-center gap-1 px-2 py-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full text-[9px] font-bold shadow-sm transition-all"
                              title="Enviar recordatorio de pago por WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Recordatorio
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">{pay.registeredBy}</td>
                      {canManagePayments && (
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={pay.status}
                              onChange={(e) => paymentService.updatePaymentStatus(pay.id, e.target.value as Payment['status'], { id: 'user-current', name: userName, role: userRole })}
                              className="border border-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-clinical-accent"
                            >
                              <option value="pagado">Pagado</option>
                              <option value="pendiente">Pendiente</option>
                              <option value="parcial">Parcial</option>
                              <option value="reembolsado">Reembolsado</option>
                            </select>
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar este pago? Esta acción no se puede deshacer.')) {
                                  paymentService.deletePayment(pay.id, { id: 'user-current', name: userName, role: userRole });
                                }
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded transition-colors"
                              title="Eliminar pago"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: BITÁCORAS DE SUPERVISIÓN */}
      {activeTab === 'supervision' && activePatient && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 text-xs text-slate-700 animate-fadeIn">
          {/* Cabecera de Supervisión */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-clinical-teal/10 border border-clinical-teal/20 flex items-center justify-center text-clinical-teal shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-clinical-dark flex items-center gap-2">
                  Bitácoras de Supervisión Clínica · {activePatient.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {supervisionLogs.length} {supervisionLogs.length === 1 ? 'bitácora' : 'bitácoras'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Trazabilidad de dictámenes técnicos, maniobras estratégicas y recomendaciones del supervisor clínico.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  supervisionRequestService.createRequest(
                    activePatient.id,
                    activePatient.name,
                    'Solicitud de supervisión clínica generada desde el módulo de bitácoras del expediente.',
                    { id: 'user-current', name: userName, role: userRole }
                  );
                  alert('✓ Solicitud de supervisión enviada al supervisor clínico de guardia y registrada en auditoría.');
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Clipboard className="w-3.5 h-3.5 text-amber-600" />
                <span>Solicitar Supervisión</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSupervisionModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-clinical-teal" />
                <span> Nueva Bitácora</span>
              </button>
            </div>
          </div>

          {/* Tarjetas resumen de supervisión */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Supervisor Principal</span>
              <span className="font-bold text-clinical-dark text-xs block">
                {supervisionLogs[0]?.supervisorName || 'Dra. Isabel Cárdenas'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {supervisionLogs[0]?.supervisorLicense || 'CED-9988221-MX'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Última Revisión Técnica</span>
              <span className="font-bold text-clinical-dark text-xs block">
                {supervisionLogs[0]?.date ? new Date(supervisionLogs[0].date).toLocaleDateString('es-MX', { dateStyle: 'long' }) : 'Sin revisiones'}
              </span>
              <span className="text-[10px] text-clinical-teal font-bold block">
                {supervisionLogs[0] ? `Sesión ${supervisionLogs[0].sessionNumber} supervisada` : 'Pendiente'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Estado del Caso</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-800 text-xs">Supervisión al día</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Modelo Arezzo TBE</span>
            </div>
          </div>

          {/* Listado de Bitácoras */}
          <div className="space-y-4">
            <span className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              Historial Cronológico de Bitácoras
            </span>

            {supervisionLogs.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium">No se han registrado bitácoras de supervisión para este paciente.</p>
                <button
                  type="button"
                  onClick={() => setShowSupervisionModal(true)}
                  className="px-4 py-2 bg-clinical-teal text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Registrar Primera Bitácora
                </button>
              </div>
            ) : (
              supervisionLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Fila superior: Sesión, Fecha, Supervisor */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-clinical-dark text-white font-mono font-bold rounded-lg text-xs">
                        Sesión {log.sessionNumber}
                      </span>
                      <span className="font-bold text-clinical-dark text-sm">
                        Supervisión por {log.supervisorName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {log.supervisorLicense}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Fecha: <b>{log.date}</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar la bitácora de la Sesión ${log.sessionNumber}?`)) {
                            supervisionLogService.deleteLog(log.id, { id: 'user-current', name: userName, role: userRole });
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-red-600 transition-colors"
                        title="Eliminar bitácora"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Diagnóstico Estratégico Arezzo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Sistema Perceptivo-Reactivo</span>
                      <span className="font-bold text-clinical-dark text-xs block mt-0.5">{log.spr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Trastorno Estratégico (TS)</span>
                      <span className="font-bold text-clinical-teal text-xs block mt-0.5">{log.ts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Terapeuta Evaluado</span>
                      <span className="font-semibold text-slate-700 text-xs block mt-0.5">{log.therapistName}</span>
                    </div>
                  </div>

                  {/* Definición del problema & Situación actual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Definición del Problema & Solución Intentada
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">{log.problemDefinition}</p>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Situación Clínica Actual
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">{log.currentSituation}</p>
                    </div>
                  </div>

                  {/* Maniobras TBE: Reestructuración, Prescripciones, Efecto */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-slate-100 p-3 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Reestructuración (RST)</span>
                      <p className="text-slate-800 font-semibold mt-1 text-[11px]">{log.rst || '—'}</p>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Prescripciones (PX)</span>
                      <p className="text-clinical-dark font-bold mt-1 text-[11px]">{log.px || '—'}</p>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Efecto Observado (EFF)</span>
                      <p className="text-emerald-800 font-bold mt-1 text-[11px]">{log.eff || '—'}</p>
                    </div>
                  </div>

                  {/* Dudas y Bloqueos */}
                  {(log.doubt || log.blocking) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {log.doubt && (
                        <div className="bg-amber-50/40 border border-amber-200 rounded-lg p-3 text-[11px]">
                          <span className="font-bold text-amber-900 block mb-0.5">Duda Clínica del Terapeuta:</span>
                          <p className="text-amber-800 leading-normal">{log.doubt}</p>
                        </div>
                      )}
                      {log.blocking && (
                        <div className="bg-rose-50/40 border border-rose-200 rounded-lg p-3 text-[11px]">
                          <span className="font-bold text-rose-900 block mb-0.5">Bloqueo Identificado en el Caso:</span>
                          <p className="text-rose-800 leading-normal">{log.blocking}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dictamen y Recomendaciones del Supervisor */}
                  <div className="bg-teal-50/40 border border-teal-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-clinical-teal shrink-0" />
                      <span className="font-bold text-clinical-dark uppercase tracking-wide text-[10px]">
                        Dictamen y Recomendaciones del Supervisor
                      </span>
                    </div>
                    {log.observations && (
                      <p className="text-slate-700 leading-relaxed">
                        <b className="text-clinical-dark font-semibold">Observaciones: </b>{log.observations}
                      </p>
                    )}
                    {log.recommendations && (
                      <div className="bg-white border border-teal-200 rounded-lg p-3 text-slate-800 font-medium">
                        <b className="text-clinical-teal block mb-0.5">Recomendaciones prescriptivas:</b>
                        {log.recommendations}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: CONSTANCIAS (CONTROL Y REGISTRO EN FÍSICO) */}
      {activeTab === 'constancias' && activePatient && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 text-xs text-slate-700 animate-fadeIn">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-clinical-dark shrink-0">
                <FileText className="w-5 h-5 text-clinical-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-clinical-dark flex items-center gap-2">
                  Registro de Constancias Físicas Emitidas · {activePatient.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {physicalCertificates.length} {physicalCertificates.length === 1 ? 'constancia' : 'constancias'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Control documental y archivo de constancias, justificantes e informes expedidos en papel con firma autógrafa.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRegisterCertModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span> Registrar Constancia Física</span>
            </button>
          </div>

          {/* Banner informativo legal y normativo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed text-slate-600">
            <ShieldCheck className="w-5 h-5 text-clinical-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-clinical-dark block text-xs mb-0.5">
                Normativa de Expedición Documental y Cédula Profesional (NOM-004-SSA3-2012)
              </span>
              <p className="text-[11px] text-slate-500">
                Por seguridad jurídica y confidencialidad en salud mental, las constancias oficiales son expedidas directamente en físico con firma autógrafa del profesional tratante en papelería membretada. Este módulo mantiene la bitácora de folios entregados, fechas, destinatarios y copia de resguardo en el expediente.
              </p>
            </div>
          </div>

          {/* Tabla / Listado de Constancias Físicas */}
          <div className="space-y-3">
            <span className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              Historial de Constancias Físicas Entregadas
            </span>

            {physicalCertificates.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium">No se han registrado constancias físicas emitidas para este paciente.</p>
                <button
                  type="button"
                  onClick={() => setShowRegisterCertModal(true)}
                  className="px-4 py-2 bg-clinical-accent text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Registrar Primera Constancia
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {physicalCertificates.map((cert) => (
                  <div key={cert.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-clinical-dark font-mono font-bold rounded text-[10px] border border-slate-200">
                          {cert.physicalFolio}
                        </span>
                        <span className="font-bold text-clinical-dark text-xs">
                          {cert.type === 'psicoterapeutica' ? 'Constancia Psicoterapéutica' :
                            cert.type === 'psiquiatrica' ? 'Constancia Psiquiátrica' :
                              cert.type === 'asistencia' ? 'Constancia de Asistencia' :
                                cert.type === 'informe_pericial' ? 'Informe Clínico / Pericial' : 'Justificante Médico'}
                        </span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                          ✓ Entregada en físico
                        </span>
                        {cert.scanFileName && (
                          <span className="text-[9px] bg-teal-50 text-clinical-teal border border-teal-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Paperclip className="w-2.5 h-2.5" />
                            Escaneo adjunto
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span>Destinatario: <b className="text-slate-700">{cert.recipient}</b></span>
                        <span>•</span>
                        <span>Expedida el: <b className="text-slate-700">{cert.issueDate}</b></span>
                        <span>•</span>
                        <span>Firmante: <b className="text-slate-700">{cert.issuerName}</b> ({cert.issuerLicense})</span>
                        <span>•</span>
                        <span>Sesiones: <b className="text-slate-700">{cert.sessionsCount}</b></span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        "{cert.clinicalSummary}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedPhysicalCert(cert)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver Ficha de Registro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar del registro la constancia ${cert.physicalFolio}?`)) {
                            physicalCertificateService.deleteCertificateRecord(cert.id, { id: 'user-current', name: userName, role: userRole });
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showPaymentModal && activePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-clinical-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-clinical-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Registrar Pago · {activePatient.name}</h3>
              </div>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddPayment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sesión 3 · Seguimiento"
                  value={newPayment.concept}
                  onChange={(e) => setNewPayment({ ...newPayment, concept: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">Monto (MXN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="800"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">Método</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">Estado</label>
                  <select
                    value={newPayment.status}
                    onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as Payment['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="parcial">Parcial</option>
                    <option value="reembolsado">Reembolsado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">Notas (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Referencia, folio, observaciones..."
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow-sm">
                  Guardar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Formalizar Consentimiento del Representante Legal */}
      {showConsentSignModal && activePatient && activePatient.representante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-clinical-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-clinical-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Formalizar Consentimiento del Representante</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentSignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSignRepresentativeConsent} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                El consentimiento informado para <b>{activePatient.name}</b> será formalizado por su representante legal o persona de apoyo: <b>{activePatient.representante.nombreCompleto}</b> ({activePatient.representante.parentesco === 'PERSONA_DE_APOYO' ? 'persona de apoyo designada' : activePatient.representante.parentesco.toLowerCase()}).
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-clinical-dark block">Alcance del consentimiento:</span>
                <p>• Autorización de tratamiento psicoterapéutico en Terapia Breve Estratégica.</p>
                <p>• Habilitación de grabación de sesiones y asistencia documental con IA.</p>
                <p>• Habilitación de confirmación de citas y emisión de constancias.</p>
              </div>

              <div>
                <label className="block font-bold text-clinical-dark uppercase tracking-wider mb-1">
                  Firma Digital (Escribe el nombre completo del representante):
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Ej. ${activePatient.representante.nombreCompleto}`}
                  value={repSignatureName}
                  onChange={(e) => {
                    setRepSignatureName(e.target.value);
                    setSignatureError('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-clinical-accent focus:outline-none font-semibold text-clinical-dark"
                />
              </div>

              {signatureError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold text-[11px]">
                  {signatureError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConsentSignModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow-sm"
                >
                  Confirmar Firma y Desbloquear Acciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compliance de la Indicación */}
      {selectedPrescription && activeSessionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-clinical-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-clinical-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Compliance de la Indicación</h3>
              </div>
              <button type="button" onClick={() => setSelectedPrescription(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Prescripción / Tarea:</span>
                <span className="font-bold text-clinical-dark block mt-1">{selectedPrescription}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Efecto (EFF)</span>
                  <span className="text-sm font-bold text-clinical-dark block mt-1">{activeSessionDetail.eff || '—'}</span>
                </div>
                <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Adherencia (ADD)</span>
                  <span className="text-sm font-bold text-clinical-dark block mt-1">{activeSessionDetail.add || '—'}</span>
                </div>
              </div>

              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <span className="text-slate-400 font-bold block text-[9px] uppercase">Observaciones del Terapeuta (OSS)</span>
                <p className="text-slate-700 mt-1 leading-relaxed">{activeSessionDetail.oss || '—'}</p>
              </div>

              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <span className="text-slate-400 font-bold block text-[9px] uppercase">Resonancia (RSS)</span>
                <p className="text-slate-700 mt-1 leading-relaxed">{activeSessionDetail.rss || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Bitácora de Supervisión */}
      {showSupervisionModal && activePatient && (
        <SupervisionLogModal
          patient={activePatient}
          userName={userName}
          userRole={userRole}
          sessionCount={sessions.length}
          onClose={() => setShowSupervisionModal(false)}
          onSaved={() => {
            setSupervisionLogs(supervisionLogService.getByPatientId(activePatient.id));
          }}
        />
      )}

      {/* Modal Registrar Constancia Física */}
      {showRegisterCertModal && activePatient && (
        <RegisterPhysicalCertificateModal
          patient={activePatient}
          userName={userName}
          userRole={userRole}
          sessionCount={sessions.length}
          onClose={() => setShowRegisterCertModal(false)}
          onSaved={() => {
            setPhysicalCertificates(physicalCertificateService.getByPatientId(activePatient.id));
          }}
        />
      )}

      {/* Modal Detalle de Constancia Física */}
      {selectedPhysicalCert && (
        <PhysicalCertificateDetailModal
          certificate={selectedPhysicalCert}
          onClose={() => setSelectedPhysicalCert(null)}
        />
      )}
    </div>
  );
};
