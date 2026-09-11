import React, { useEffect, useState } from "react";
import {
  CalendarCheck, CreditCard, Pill, MessageCircle, Phone,
  ChevronDown, ChevronUp, ExternalLink, User, Clock,
  CheckCircle2, XCircle, AlertCircle, Ban
} from "lucide-react";
import { Appointment, Patient, Session } from "../types/clinical";
import { sessionService } from "../services/sessionService";

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

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => setContactModal("asistente")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar asistente
          </button>
          <button
            onClick={() => setContactModal("terapeuta")}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Phone className="w-4 h-4 text-slate-500" />
            Contactar terapeuta
          </button>
        </div>
      </div>

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
