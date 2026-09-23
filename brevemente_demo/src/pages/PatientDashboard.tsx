import React, { useEffect, useState } from "react";
import {
  CalendarCheck, CreditCard, Pill, MessageCircle, Phone,
  ChevronDown, ChevronUp, ExternalLink, User, Clock,
  CheckCircle2, XCircle, AlertCircle, Ban
} from "lucide-react";
import { Appointment, Patient, Session, RiskAlert } from "../types/clinical";
import { sessionService } from "../services/sessionService";
import { riskSimulationService } from "../services/riskSimulationService";
import { therapistService } from "../services/therapistService";

interface PatientDashboardProps {
  patient: Patient;
  appointments: Appointment[];
  userName: string;
}

const APPOINTMENT_TYPE_LABEL: Record<Appointment["type"], string> = {
  primera: "Primera sesion",
  seguimiento: "Seguimiento",
  cierre: "Sesion de cierre",
};

const ATTENDANCE_CONFIG: Record<
  Appointment["status"],
  { label: string; color: string; Icon: React.ElementType }
> = {
  completada: { label: "Completada", color: "bg-teal-100 text-teal-800 border-teal-200", Icon: CheckCircle2 },
  confirmada: { label: "Proxima cita", color: "bg-blue-100 text-blue-800 border-blue-200", Icon: CalendarCheck },
  pendiente: { label: "Por confirmar", color: "bg-amber-100 text-amber-800 border-amber-200", Icon: Clock },
  cancelada: { label: "Cancelada", color: "bg-slate-100 text-slate-600 border-slate-200", Icon: Ban },
  ausente: { label: "No asistio", color: "bg-red-100 text-red-800 border-red-200", Icon: XCircle },
  no_presentado: { label: "No se presentó", color: "bg-red-100 text-red-800 border-red-300", Icon: XCircle },
  solicita_reagendar: { label: "Solicita reagendar", color: "bg-amber-100 text-amber-800 border-amber-300", Icon: Clock },
};

const PAYMENT_CONFIG: Record<
  NonNullable<Appointment["paymentStatus"]>,
  { label: string; color: string; Icon: React.ElementType }
> = {
  pagada: { label: "Pagada", color: "bg-green-100 text-green-800 border-green-200", Icon: CheckCircle2 },
  pendiente: { label: "Pendiente de pago", color: "bg-amber-100 text-amber-800 border-amber-200", Icon: AlertCircle },
  exenta: { label: "Exenta", color: "bg-slate-100 text-slate-600 border-slate-200", Icon: CreditCard },
};

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

interface ContactModalProps {
  contactType: "asistente" | "terapeuta";
  patientName: string;
  onClose: () => void;
}

const WHATSAPP_NUMBERS = {
  asistente: "525511223344",
  terapeuta: "525599887766",
};

const ContactModal: React.FC<ContactModalProps> = ({ contactType, patientName, onClose }) => {
  const [message, setMessage] = useState(
    `Hola, soy ${patientName}. Me gustaria solicitar informacion para reprogramar mi cita. Podrian ayudarme?`
  );

  const handleOpenWhatsApp = () => {
    const number = WHATSAPP_NUMBERS[contactType];
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#25D366] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Contactar por WhatsApp</p>
            <p className="text-green-100 text-xs capitalize">
              {contactType === "asistente" ? "Asistente del consultorio" : "Tu terapeuta"}
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Puedes editar el mensaje antes de enviarlo. Se abrira WhatsApp en una nueva pestana.
          </p>
          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 resize-none focus:ring-2 focus:ring-[#25D366] focus:outline-none min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AppointmentRowProps {
  appointment: Appointment;
  sessions: Session[];
}

const AppointmentRow: React.FC<AppointmentRowProps> = ({ appointment, sessions }) => {
  const [expanded, setExpanded] = useState(false);

  const attendance = ATTENDANCE_CONFIG[appointment.status];
  const payment = appointment.paymentStatus ? PAYMENT_CONFIG[appointment.paymentStatus] : null;

  const matchedSession = sessions.find(
    (s) => s.date === appointment.date && s.patientId === appointment.patientId
  );

  const prescriptions = matchedSession?.px ?? [];
  const hasPrescriptions = prescriptions.length > 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 ${hasPrescriptions ? "cursor-pointer hover:bg-slate-50/60" : ""} transition-colors ${expanded ? "bg-slate-50" : ""}`}
        onClick={() => hasPrescriptions && setExpanded(!expanded)}
      >
        <div className="min-w-[160px]">
          <p className="text-xs font-bold text-clinical-dark capitalize">{formatDate(appointment.date)}</p>
          <p className="text-[10px] text-slate-400">{appointment.time} hrs &middot; {APPOINTMENT_TYPE_LABEL[appointment.type]}</p>
        </div>

        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${attendance.color}`}>
          <attendance.Icon className="w-3 h-3 shrink-0" />
          {attendance.label}
        </span>

        {payment ? (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${payment.color}`}>
            <payment.Icon className="w-3 h-3 shrink-0" />
            {payment.label}
          </span>
        ) : (
          <span className="text-slate-300 text-[10px] font-bold">Sin info de pago</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {hasPrescriptions && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-clinical-accent/10 text-clinical-accent rounded-full text-[10px] font-bold">
              <Pill className="w-3 h-3" />
              {prescriptions.length} prescripcion{prescriptions.length > 1 ? "es" : ""}
            </span>
          )}
          {hasPrescriptions && (
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasPrescriptions && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Pill className="w-3 h-3 text-clinical-accent" />
            Prescripciones asignadas en esta sesion
          </p>
          <ul className="space-y-1">
            {prescriptions.map((px: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="w-5 h-5 bg-clinical-accent/10 text-clinical-accent rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {px}
              </li>
            ))}
          </ul>
          {matchedSession?.notes && (
            <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Nota de seguimiento</p>
              <p className="text-xs text-slate-600">{matchedSession.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  appointments,
  userName,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contactModal, setContactModal] = useState<"asistente" | "terapeuta" | null>(null);

  useEffect(() => {
    sessionService.getByPatientId(patient.id).then(setSessions);
  }, [patient.id]);

  // Alertas de riesgo activas para ESTE paciente (conexión alerta ↔ portal)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>(riskSimulationService.getAlerts());
  useEffect(() => {
    const refresh = () => setRiskAlerts(riskSimulationService.getAlerts());
    window.addEventListener('brevemente_risk_alert_added', refresh);
    return () => window.removeEventListener('brevemente_risk_alert_added', refresh);
  }, []);
  const activePatientAlerts = riskAlerts.filter(a => a.patientId === patient.id && !a.resolved);

  // Alerta de crisis resuelta más reciente
  const [dismissedResolvedAlertId, setDismissedResolvedAlertId] = useState<string | null>(null);
  const resolvedPatientCrisis = riskAlerts
    .filter(a => a.patientId === patient.id && a.resolved && a.message.includes('ALERTA ROJA'))
    .sort((a, b) => new Date(b.resolvedAt || b.timestamp).getTime() - new Date(a.resolvedAt || a.timestamp).getTime())[0];

  const showResolvedBanner = Boolean(
    resolvedPatientCrisis &&
    resolvedPatientCrisis.id !== dismissedResolvedAlertId &&
    activePatientAlerts.length === 0
  );

  // ¿Ya se envió un aviso de crisis activo (sin resolver)? Evita alertas repetidas.
  const hasActiveCrisisAlert = activePatientAlerts.some(
    (a) => a.message.includes('ALERTA ROJA')
  );

  // Botón de contacto según el directorio del terapeuta:
  // si tiene asistente → se contacta al asistente; si no → directo al terapeuta.
  const contactTarget: "asistente" | "terapeuta" =
    therapistService.hasAssistant(patient.therapistId) ? "asistente" : "terapeuta";


  // Botón de crisis: el paciente escala una alerta y notifica al equipo clínico
  const handleEmergencyCrisis = () => {
    if (hasActiveCrisisAlert) return; // ya hay un aviso de crisis sin resolver
    riskSimulationService.escalateRisk(
      patient.id,
      patient.name,
      'ALERTA ROJA: El paciente activó el Botón de Crisis de emergencia desde su portal.',
      { id: patient.id, name: patient.name, role: 'patient' }
    );
    alert('⚠️ Se notificó a tu terapeuta y al equipo de guardia. Un profesional se comunicará contigo de forma prioritaria.');
  };

  const patientAppointments = appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const upcomingAppointments = patientAppointments.filter(
    (a) => a.status === "confirmada" || a.status === "pendiente"
  );
  const pastAppointments = patientAppointments.filter(
    (a) => a.status !== "confirmada" && a.status !== "pendiente"
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-clinical-accent/10 border-2 border-clinical-accent/20 flex items-center justify-center">
            <User className="w-7 h-7 text-clinical-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-clinical-dark">Hola, {userName}</h2>
            <p className="text-xs text-slate-500">
              Terapeuta asignado:{" "}
              <span className="font-semibold text-slate-700">{patient.therapistName}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">{patient.motif}</p>
          </div>
        </div>

        {/* Acciones: crisis + un solo canal de contacto según el terapeuta */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={handleEmergencyCrisis}
            disabled={hasActiveCrisisAlert}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${hasActiveCrisisAlert
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
              }`}
          >
            <AlertCircle className="w-4 h-4" />
            {hasActiveCrisisAlert ? "Aviso enviado al equipo" : "⚠️ Botón de Crisis"}
          </button>
          {contactTarget === "asistente" ? (
            <button
              onClick={() => setContactModal("asistente")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar asistente
            </button>
          ) : (
            <button
              onClick={() => setContactModal("terapeuta")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Phone className="w-4 h-4 text-slate-500" />
              Contactar terapeuta
            </button>
          )}
        </div>
      </div>

      {/* Alerta de riesgo activa (conexión alerta ↔ portal del paciente) */}
      {activePatientAlerts.length > 0 && (
        <section className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-800 text-sm">Aviso de seguridad clínica</h3>
          </div>
          <p className="text-xs text-red-700 leading-relaxed">
            Tu equipo clínico fue notificado de una situación que requiere atención y ya está al tanto.
            Si lo necesitas, puedes contactar a tu terapeuta o asistente de inmediato.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setContactModal("terapeuta")}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              Contactar terapeuta
            </button>
            <button
              onClick={() => setContactModal("asistente")}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar asistente
            </button>
          </div>
          <div className="bg-white/70 border border-red-200 rounded-xl p-3 text-[11px] text-red-900 space-y-1">
            <span className="font-bold block">Recursos de apoyo inmediato (24/7):</span>
            <div>📞 Línea de la Vida (Nacional): 800 911 2000</div>
            <div>📞 Guardia BreveMente: +52 55 9000 8000</div>
          </div>
        </section>
      )}

      {/* Aviso de crisis atendida y estabilizada */}
      {showResolvedBanner && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900 text-sm">Tu aviso de crisis fue atendido</h3>
            </div>
            <button
              onClick={() => setDismissedResolvedAlertId(resolvedPatientCrisis.id)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors"
            >
              Entendido / Cerrar aviso ✕
            </button>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            Tu reporte fue atendido y registrado por <b>{resolvedPatientCrisis.resolvedBy || 'tu especialista'}</b>
            {resolvedPatientCrisis.resolvedAt && (
              <span> el {new Date(resolvedPatientCrisis.resolvedAt).toLocaleDateString('es-MX')} a las {new Date(resolvedPatientCrisis.resolvedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs</span>
            )}. La situación ha sido catalogada como estabilizada.
          </p>
          {resolvedPatientCrisis.resolutionDetails?.patientInstructions && (
            <div className="bg-white/90 border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider block">
                Indicaciones de seguimiento de tu terapeuta:
              </span>
              <p className="italic font-medium leading-relaxed">
                "{resolvedPatientCrisis.resolutionDetails.patientInstructions}"
              </p>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-emerald-700 pt-1">
            <span>Si vuelves a requerir auxilio, las líneas 24/7 y el botón de crisis continúan a tu disposición.</span>
            <span className="font-bold">Línea de la Vida: 800 911 2000</span>
          </div>
        </section>
      )}

      {/* Proximas citas */}
      {upcomingAppointments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-clinical-accent" />
            <h3 className="text-sm font-bold text-clinical-dark">Proximas Citas</h3>
          </div>
          <div className="space-y-2">
            {upcomingAppointments.map((app) => (
              <AppointmentRow key={app.id} appointment={app} sessions={sessions} />
            ))}
          </div>
        </section>
      )}

      {/* Historial */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-clinical-dark">Historial de Citas</h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {pastAppointments.length} sesion{pastAppointments.length !== 1 ? "es" : ""}
          </span>
        </div>

        {pastAppointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Aun no hay citas en el historial.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastAppointments.map((app) => (
              <AppointmentRow key={app.id} appointment={app} sessions={sessions} />
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-[10px] text-slate-400 px-4">
        Esta vista es de solo lectura. Para reprogramar o cancelar una cita, contacta al asistente o a tu terapeuta.
      </p>

      {contactModal && (
        <ContactModal
          contactType={contactModal}
          patientName={userName}
          onClose={() => setContactModal(null)}
        />
      )}
    </div>
  );
};
