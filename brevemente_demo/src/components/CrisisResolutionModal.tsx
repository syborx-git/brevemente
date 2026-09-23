import React, { useState } from 'react';
import {
  AlertTriangle, Phone, PhoneCall, ShieldAlert, CheckCircle2,
  FileText, User, Clock, HeartHandshake, ShieldCheck, X,
  ExternalLink, Sparkles, AlertOctagon, Send
} from 'lucide-react';
import {
  Patient, RiskAlert, Role, ContactOutcome, AssessedRiskLevel,
  CrisisResolutionDetails, CrisisIncident
} from '../types/clinical';
import { riskSimulationService } from '../services/riskSimulationService';
import { recordService } from '../services/recordService';
import { patientService } from '../services/patientService';

interface CrisisResolutionModalProps {
  alert: RiskAlert;
  patient?: Patient;
  userName: string;
  userRole: Role;
  onClose: () => void;
  onResolved: (updatedAlert: RiskAlert) => void;
}

export const CrisisResolutionModal: React.FC<CrisisResolutionModalProps> = ({
  alert,
  patient,
  userName,
  userRole,
  onClose,
  onResolved
}) => {
  // Estado del formulario clínico
  const [contactOutcome, setContactOutcome] = useState<ContactOutcome>('paciente_directo');
  const [riskLevelAssessed, setRiskLevelAssessed] = useState<AssessedRiskLevel>('bajo');
  const [actionsTaken, setActionsTaken] = useState<string[]>([
    'Contención verbal y desescalamiento de angustia',
    'Maniobra o prescripción estratégica aplicada'
  ]);
  const [clinicalNote, setClinicalNote] = useState<string>(
    'Se estableció contacto telefónico inmediato con la paciente. Se aplicaron técnicas de contención estratégica y reestructuración cognitiva del síntoma. La paciente reporta disminución progresiva de la ansiedad y estabilidad física.'
  );
  const [patientInstructions, setPatientInstructions] = useState<string>(
    'Tu terapeuta ha atendido tu aviso de crisis. El caso ha sido registrado y estabilizado. Recuerda mantener tus pautas de descanso y realizar tus prescripciones asignadas. Si reaparecen síntomas, los teléfonos de guardia continúan disponibles 24/7.'
  );
  const [updatePatientRisk, setUpdatePatientRisk] = useState<boolean>(false);
  const [newPatientRiskLevel, setNewPatientRiskLevel] = useState<'bajo' | 'medio' | 'alto'>('medio');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lista de posibles acciones clínicas
  const clinicalActionOptions = [
    'Contención verbal y desescalamiento de angustia',
    'Maniobra o prescripción estratégica aplicada (desbloqueo de pánico, peor fantasía)',
    'Verificación de la red de apoyo inmediata (familiar o acompañante)',
    'Notificación a Persona de Apoyo / Representante legal',
    'Coordinación con servicios de urgencias médicas / 911',
    'Notificación y alineación con supervisor clínico de guardia',
    'Agendamiento de sesión de seguimiento prioritaria'
  ];

  // Plantillas rápidas de redacción clínica
  const quickTemplates = [
    {
      label: '⚡ Desescalado / Pánico contenido',
      note: 'Contacto telefónico establecido con la paciente. Presentaba crisis de angustia aguda con taquicardia y miedo a perder el control. Se aplicó reestructuración estratégica y técnica de desbloqueo respiratorio. Tras la intervención, la paciente reporta remisión de síntomas y queda acompañada.',
      outcome: 'paciente_directo' as ContactOutcome,
      risk: 'bajo' as AssessedRiskLevel
    },
    {
      label: '⚡ Pulsación accidental / Falsa alarma',
      note: 'Se contactó a la paciente de manera prioritaria. Manifiesta haber activado el botón de crisis de forma accidental al manipular el dispositivo. No se evidencia sintomatología ansiosa ni descompensación activa. Se brindan palabras de tranquilidad.',
      outcome: 'falsa_alarma' as ContactOutcome,
      risk: 'bajo' as AssessedRiskLevel
    },
    {
      label: '⚡ Derivación a urgencias',
      note: 'Contacto establecido con paciente y persona de apoyo. Debido a la persistencia de crisis de angustia severa y descompensación clínica, se orienta y coordina derivación presencial inmediata al centro de atención de urgencias.',
      outcome: 'paciente_directo' as ContactOutcome,
      risk: 'alto' as AssessedRiskLevel
    }
  ];

  const handleToggleAction = (action: string) => {
    if (actionsTaken.includes(action)) {
      setActionsTaken(actionsTaken.filter(a => a !== action));
    } else {
      setActionsTaken([...actionsTaken, action]);
    }
  };

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    setClinicalNote(tpl.note);
    setContactOutcome(tpl.outcome);
    setRiskLevelAssessed(tpl.risk);
  };

  const handleResolveCrisis = async () => {
    if (!clinicalNote.trim()) {
      window.alert('Es obligatorio ingresar la Nota Clínica de Intervención en Crisis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resolutionDetails: CrisisResolutionDetails = {
        contactOutcome,
        riskLevelAssessed,
        actionsTaken,
        clinicalNote: clinicalNote.trim(),
        patientInstructions: patientInstructions.trim(),
        nextStep: riskLevelAssessed === 'inminente' || riskLevelAssessed === 'alto'
          ? 'derivacion_urgencias'
          : 'seguimiento_habitual',
        updatedPatientRiskLevel: updatePatientRisk ? newPatientRiskLevel : undefined
      };

      // 1. Resolver la alerta en el servicio de riesgo y auditoría
      const resolved = riskSimulationService.resolveAlert(
        alert.id,
        { id: 'user-current', name: userName, role: userRole },
        resolutionDetails
      );

      // 2. Registrar en el expediente clínico del paciente
      const crisisIncident: CrisisIncident = {
        id: `crisis-inc-${Date.now()}`,
        alertId: alert.id,
        timestamp: alert.timestamp,
        resolvedAt: new Date().toISOString(),
        resolvedBy: userName,
        role: userRole,
        reason: alert.message,
        resolutionDetails
      };

      await recordService.addCrisisIncident(alert.patientId, crisisIncident);

      // 3. Si se solicitó actualizar el nivel de riesgo del paciente
      if (updatePatientRisk && patient) {
        await patientService.update({
          ...patient,
          riskLevel: newPatientRiskLevel
        });
      }

      if (resolved) {
        onResolved(resolved);
      }
      onClose();
    } catch (err) {
      console.error('Error al resolver la alerta de crisis:', err);
      window.alert('Ocurrió un error al registrar la resolución. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientPhone = patient?.phone || patient?.telefonoPaciente || '+52 55 1234 5678';
  const rawPhone = patientPhone.replace(/[^0-9]/g, '');
  const supportPerson = patient?.representante;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">

        {/* HEADER DE EMERGENCIA */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 shrink-0 flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Protocolo Clínico de Resolución de Crisis
                </span>
                <span className="text-[10px] bg-red-800/60 px-2 py-0.5 rounded font-mono font-bold">
                  ID: {alert.id}
                </span>
              </div>
              <h2 className="text-lg font-extrabold mt-1 tracking-tight">
                Atención y Resolución: {alert.patientName}
              </h2>
              <p className="text-xs text-white/85 font-medium mt-0.5 flex items-center gap-2">
                <span>{alert.note}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 inline" />
                  {new Date(alert.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DESPLAZABLE */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">

          {/* MENSAJE DE LA ALERTA */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-red-900 block text-[11px] uppercase tracking-wide">
                Alerta de Urgencia Emitida:
              </span>
              <p className="text-xs text-red-800 font-semibold mt-0.5 leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>

          {/* FICHA DE CONTACTO RÁPIDO Y LÍNEAS DE AUXILIO */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block border-b border-slate-200 pb-2">
              Canales de Comunicación Prioritaria
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Contacto con el paciente */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-clinical-accent" />
                    <span className="font-bold text-clinical-dark">{alert.patientName}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                    Paciente
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono font-bold">
                  {patientPhone}
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`tel:${patientPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-clinical-teal hover:bg-[#258280] text-white rounded-md text-[11px] font-bold shadow-sm transition-all"
                  >
                    <Phone className="w-3 h-3" />
                    Llamar al paciente
                  </a>
                  <a
                    href={`https://wa.me/${rawPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-md text-[11px] font-bold shadow-sm transition-all"
                    title="Abrir WhatsApp"
                  >
                    <ExternalLink className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Persona de apoyo / Representante legal o Líneas de Guardia */}
              {supportPerson ? (
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-bold text-clinical-dark truncate">{supportPerson.nombreCompleto}</span>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                      {supportPerson.parentesco}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono font-bold">
                    {supportPerson.telefono}
                  </div>
                  <div className="pt-1">
                    <a
                      href={`tel:${supportPerson.telefono}`}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[11px] font-bold shadow-sm transition-all"
                    >
                      <PhoneCall className="w-3 h-3" />
                      Llamar a persona de apoyo
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-700 block">Líneas de Auxilio Clínico (24/7):</span>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Guardia BreveMente:</span>
                    <a href="tel:+525590008000" className="font-mono font-bold text-clinical-accent hover:underline">
                      +52 55 9000 8000
                    </a>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Línea de la Vida (Nac.):</span>
                    <a href="tel:8009112000" className="font-mono font-bold text-rose-600 hover:underline">
                      800 911 2000
                    </a>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Emergencias Generales:</span>
                    <a href="tel:911" className="font-mono font-bold text-red-600 hover:underline">
                      911
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PASO 1: RESULTADO DEL CONTACTO */}
          <div className="space-y-2.5">
            <label className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              1. Resultado de la Comunicación Establecida <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'paciente_directo' as ContactOutcome,
                  title: 'Contacto Directo con Paciente',
                  desc: 'Se habló por teléfono con el paciente y se evaluó verbalmente.'
                },
                {
                  id: 'persona_apoyo' as ContactOutcome,
                  title: 'Contacto con Red / Familiar',
                  desc: 'El paciente fue auxiliado y se conversó con persona de apoyo.'
                },
                {
                  id: 'falsa_alarma' as ContactOutcome,
                  title: 'Falsa Alarma / Involuntaria',
                  desc: 'Pulsación accidental del botón. Paciente confirma bienestar.'
                },
                {
                  id: 'sin_respuesta' as ContactOutcome,
                  title: 'Sin Respuesta al Contacto',
                  desc: 'No contestó. Se activó protocolo externo de localización.'
                }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setContactOutcome(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    contactOutcome === opt.id
                      ? 'border-clinical-teal bg-teal-50/40 text-clinical-dark ring-2 ring-clinical-teal/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{opt.title}</span>
                    {contactOutcome === opt.id && (
                      <CheckCircle2 className="w-4 h-4 text-clinical-teal shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* PASO 2: NIVEL DE RIESGO EVALUADO POST-INTERVENCIÓN */}
          <div className="space-y-2.5">
            <label className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              2. Nivel de Riesgo Evaluado en la Intervención <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'bajo' as AssessedRiskLevel, label: 'Bajo / Desescalado', color: 'emerald' },
                { id: 'medio' as AssessedRiskLevel, label: 'Moderado', color: 'amber' },
                { id: 'alto' as AssessedRiskLevel, label: 'Alto', color: 'rose' },
                { id: 'inminente' as AssessedRiskLevel, label: 'Crítico / Inminente', color: 'red' }
              ].map((lvl) => {
                const selected = riskLevelAssessed === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setRiskLevelAssessed(lvl.id)}
                    className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition-all ${
                      selected
                        ? 'bg-slate-900 text-white border-slate-900 shadow'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 3: ACCIONES CLÍNICAS REALIZADAS */}
          <div className="space-y-2.5">
            <label className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              3. Acciones e Intervenciones Realizadas (Checklist)
            </label>
            <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
              {clinicalActionOptions.map((action, idx) => {
                const checked = actionsTaken.includes(action);
                return (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 cursor-pointer select-none p-1.5 rounded-lg hover:bg-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleAction(action)}
                      className="mt-0.5 rounded text-clinical-teal focus:ring-clinical-teal border-slate-300 w-3.5 h-3.5"
                    />
                    <span className={`text-[11px] leading-tight ${checked ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {action}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* PASO 4: NOTA CLÍNICA DE CONTINGENCIA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
                4. Nota Clínica de Intervención en Crisis (Expediente & Auditoría) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Sparkles className="w-3 h-3 text-clinical-teal" />
                <span>Plantillas rápidas:</span>
              </div>
            </div>

            {/* Botones de plantillas */}
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[10px] transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="Describa el estado psicopatológico del paciente durante el contacto, intervenciones efectuadas, acuerdos y condición final..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-clinical-accent focus:outline-none leading-relaxed bg-white"
            />
          </div>

          {/* PASO 5: PAUTAS PARA EL PORTAL DEL PACIENTE */}
          <div className="space-y-2">
            <label className="font-bold text-clinical-dark uppercase tracking-wider text-[10px] block">
              5. Pautas e Indicaciones para el Portal del Paciente
            </label>
            <p className="text-[10px] text-slate-500">
              Este mensaje reemplazará la alerta roja en el portal del paciente por una confirmación tranquilizadora de que su caso fue atendido.
            </p>
            <textarea
              rows={2}
              value={patientInstructions}
              onChange={(e) => setPatientInstructions(e.target.value)}
              placeholder="Instrucciones tranquilizadoras que verá el paciente en su portal..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-clinical-accent focus:outline-none leading-relaxed bg-teal-50/20"
            />
          </div>

          {/* PASO 6: ACTUALIZAR NIVEL DE RIESGO DEL PACIENTE */}
          {patient && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="font-bold text-clinical-dark block text-xs">
                  Reclasificación del Nivel de Riesgo General
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Nivel actual en ficha: <b className="uppercase text-clinical-dark">{patient.riskLevel}</b>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={updatePatientRisk}
                    onChange={(e) => setUpdatePatientRisk(e.target.checked)}
                    className="rounded text-clinical-teal focus:ring-clinical-teal border-slate-300 w-3.5 h-3.5"
                  />
                  <span>Actualizar a:</span>
                </label>
                <select
                  disabled={!updatePatientRisk}
                  value={newPatientRiskLevel}
                  onChange={(e) => setNewPatientRiskLevel(e.target.value as 'bajo' | 'medio' | 'alto')}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                    updatePatientRisk ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <option value="bajo">Riesgo Bajo</option>
                  <option value="medio">Riesgo Medio</option>
                  <option value="alto">Riesgo Alto</option>
                </select>
              </div>
            </div>
          )}

          {/* FIRMA Y RESPONSABILIDAD */}
          <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-600 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-clinical-teal shrink-0" />
              <span>
                Resolución firmada por <b className="text-clinical-dark">{userName}</b> ({userRole}) con validez para expediente y auditoría.
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 shrink-0">
              {new Date().toLocaleDateString('es-MX')}
            </span>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar / Mantener Abierto
          </button>

          <button
            type="button"
            onClick={handleResolveCrisis}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Registrando resolución...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Firmar y Concluir Resolución de Caso</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
