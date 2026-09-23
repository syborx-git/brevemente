import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Filter,
  MapPin, Video, AlertTriangle, MessageSquare, Clipboard, User,
  PlusCircle, RefreshCw, X, ShieldAlert, Sparkles, Check, CheckSquare, Lock
} from 'lucide-react';
import { Role, Appointment, Patient, Holiday } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';
import { appointmentService } from '../services/appointmentService';
import { holidayService } from '../services/holidayService';
import { isActionBlockedByLegalConsent, LEGAL_CONSENT_TOOLTIP, calculateAge } from '../utils/legalConsent';
import { addDays, addMonths, addYears, startOfWeek, startOfMonth, daysInMonth, dayName, monthName, monthOf, parseISO } from '../utils/dateUtils';

interface AgendaProps {
  userRole: Role;
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (app: Appointment) => void;
  onAddPatient: (pat: Patient) => void;
  onDeleteAppointment: (id: string) => void;
  userName: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const APPOINTMENT_STATUS_CONFIG: Record<Appointment['status'], { label: string; color: string }> = {
  confirmada: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800' },
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
  completada: { label: 'Completada', color: 'bg-teal-100 text-teal-800' },
  cancelada: { label: 'Cancelada', color: 'bg-slate-100 text-slate-600' },
  ausente: { label: 'No asistió', color: 'bg-red-100 text-red-800' },
  no_presentado: { label: 'No se presentó: Contactar', color: 'bg-red-100 text-red-800 border border-red-300' },
  solicita_reagendar: { label: 'Solicita reagendar: pendiente', color: 'bg-amber-100 text-amber-800 border border-amber-300' },
};

export const Agenda: React.FC<AgendaProps> = ({
  userRole,
  appointments: initialAppointments,
  patients,
  onAddAppointment,
  onAddPatient,
  onDeleteAppointment,
  userName
}) => {
  const navigate = useNavigate();

  // Estados
  const [viewLevel, setViewLevel] = useState<'dia' | 'semana' | 'mes' | 'anio'>('dia');
  const [anchorDate, setAnchorDate] = useState('2026-08-24'); // fecha foco del calendario
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filtros
  const [filterTherapist, setFilterTherapist] = useState('all');
  const [filterOffice, setFilterOffice] = useState('all');
  const [filterModality, setFilterModality] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form nueva cita / paciente
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState('2026-08-24');
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<'primera' | 'seguimiento' | 'cierre' | 'supervision' | 'evaluacion'>('seguimiento');
  const [appModality, setAppModality] = useState<'presencial' | 'online'>('online');
  const [office, setOffice] = useState('Consultorio A');

  // Form nuevo paciente
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [motif, setMotif] = useState('');

  // Whatsapp simulated link
  const [whatsappTriggerId, setWhatsappTriggerId] = useState<string | null>(null);

  // Reprogramación local en el Drawer
  const [reprogrammingTime, setReprogrammingTime] = useState('10:00');
  const [reprogrammingDate, setReprogrammingDate] = useState('2026-08-24');

  // ── Navegación jerárquica del calendario ────────────────────────────────────
  const weekStart = startOfWeek(anchorDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { name: dayName(d), date: d };
  });
  const year = parseInt(anchorDate.slice(0, 4), 10);
  const month = monthOf(anchorDate);
  const monthLabel = monthName(year, month);
  const monthStart = startOfMonth(anchorDate);
  const monthDayCount = daysInMonth(year, month);
  const leadingBlanks = (parseISO(monthStart).getDay() + 6) % 7; // alinear día 1 con su día de la semana (lunes primero)

  const periodLabel =
    viewLevel === 'anio' ? `Año ${year}` :
      viewLevel === 'mes' ? `${monthLabel} ${year}` :
        viewLevel === 'dia' ? `${dayName(anchorDate)}, ${anchorDate}` :
          `Semana del ${weekDays[0].date.slice(8, 10)} al ${weekDays[6].date.slice(8, 10)} de ${monthLabel}, ${year}`;

  const goPrev = () => {
    if (viewLevel === 'dia') setAnchorDate(addDays(anchorDate, -1));
    else if (viewLevel === 'semana') setAnchorDate(addDays(anchorDate, -7));
    else if (viewLevel === 'mes') setAnchorDate(addMonths(anchorDate, -1));
    else if (viewLevel === 'anio') setAnchorDate(addYears(anchorDate, -1));
  };

  const goNext = () => {
    if (viewLevel === 'dia') setAnchorDate(addDays(anchorDate, 1));
    else if (viewLevel === 'semana') setAnchorDate(addDays(anchorDate, 7));
    else if (viewLevel === 'mes') setAnchorDate(addMonths(anchorDate, 1));
    else if (viewLevel === 'anio') setAnchorDate(addYears(anchorDate, 1));
  };

  const zoomOut = () => {
    if (viewLevel === 'dia') setViewLevel('semana');
    else if (viewLevel === 'semana') setViewLevel('mes');
    else if (viewLevel === 'mes') setViewLevel('anio');
  };

  const zoomIn = (date: string, level: 'dia' | 'semana' | 'mes' | 'anio') => {
    setAnchorDate(date);
    setViewLevel(level);
  };

  const goToday = () => {
    setAnchorDate('2026-08-24');
    setViewLevel('dia');
  };

  // Paciente de hoy (Carlos Mendoza es el patient-2)
  const patient2 = patients.find(p => p.id === 'patient-2');

  // ── Calendario festivo y días personales ────────────────────────────────────
  const [holidays, setHolidays] = useState<Holiday[]>(holidayService.getHolidays());
  const [blockHolidays, setBlockHolidays] = useState<boolean>(holidayService.getBlockHolidays());

  useEffect(() => {
    const refreshHolidays = () => setHolidays(holidayService.getHolidays());
    const refreshSettings = () => setBlockHolidays(holidayService.getBlockHolidays());
    window.addEventListener('brevemente_holidays_changed', refreshHolidays);
    window.addEventListener('brevemente_holiday_settings_changed', refreshSettings);
    return () => {
      window.removeEventListener('brevemente_holidays_changed', refreshHolidays);
      window.removeEventListener('brevemente_holiday_settings_changed', refreshSettings);
    };
  }, []);

  const getHolidayForDate = (date: string): Holiday | undefined =>
    holidays.find(h => h.date === date);

  const isBlockedDate = (date: string): boolean => {
    const h = getHolidayForDate(date);
    if (!h) return false;
    if (h.type === 'personal') return true; // siempre bloquea
    return blockHolidays;                    // oficial: solo si el toggle está ON
  };

  const anchorHoliday = getHolidayForDate(anchorDate);
  // Modal de día personal
  const [showPersonalDayModal, setShowPersonalDayModal] = useState(false);
  const [personalDayDate, setPersonalDayDate] = useState('2026-08-24');
  const [personalDayName, setPersonalDayName] = useState('');

  const handleAddPersonalDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalDayDate) {
      alert('Selecciona una fecha.');
      return;
    }
    holidayService.addPersonalHoliday(
      personalDayDate,
      personalDayName,
      { id: 'user-current', name: userName, role: userRole }
    );
    setShowPersonalDayModal(false);
    setPersonalDayName('');
  };

  // Filtrar citas según Permisos y Roles (Requerimiento Crítico 1.8 y 1.4)
  const allowedAppointments = initialAppointments.filter(app => {
    if (userRole === 'patient') {
      // El paciente SOLO puede ver sus propias citas
      return app.patientId === 'patient-2';
    }
    return true;
  });

  // Filtrar citas según controles de cabecera
  const filteredAppointments = allowedAppointments.filter(app => {
    const pat = patients.find(p => p.id === app.patientId);

    const matchesTherapist = filterTherapist === 'all' || (pat && pat.therapistName.includes(filterTherapist));
    const matchesModality = filterModality === 'all' || (pat && pat.registryMode === filterModality);

    // Filtro por estado
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'confirmada' && app.status === 'confirmada') ||
      (filterStatus === 'pendiente' && app.status === 'pendiente') ||
      (filterStatus === 'riesgo' && pat && pat.riskLevel === 'alto') ||
      (filterStatus === 'intake_pendiente' && pat && pat.status === 'pendiente');

    return matchesTherapist && matchesModality && matchesStatus;
  });

  const handleSelectAppointment = (app: Appointment) => {
    setSelectedApp(app);
    setReprogrammingTime(app.time);
    setReprogrammingDate(app.date);
    setIsEditing(false);

    // Auditoría de acceso a detalle
    auditLogService.addLog(
      'Acceso a cita',
      `Visualizó el detalle de la cita de ${app.patientName} el ${app.date} a las ${app.time}`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlockedDate(date)) {
      const h = getHolidayForDate(date);
      alert(`No se puede agendar el ${date}: ${h?.name} (día no laborable).`);
      return;
    }

    let patientId = selectedPatientId;
    let patientName = name;

    if (isNewPatient) {
      patientId = `patient-${Date.now()}`;
      const calculatedAge = calculateAge(birthDate);
      const newPatient: Patient = {
        id: patientId,
        name,
        phone,
        email,
        birthDate,
        fechaNacimiento: birthDate,
        edadCalculada: calculatedAge,
        curp: 'CURP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        riskLevel: 'bajo',
        registryMode: 'ia',
        motif,
        therapistId: 'therapist-1',
        therapistName: 'Dr. Alejandro Silva',
        quienCompletaRegistro: 'PACIENTE',
        capacidadConsentimiento: {
          estado: calculatedAge >= 18 ? 'AUTONOMO' : 'REPRESENTADO_POR_EDAD',
          determinadoPor: null,
          fechaDeterminacion: new Date().toISOString().split('T')[0],
          fechaRevision: null,
          motivo: calculatedAge >= 18 ? null : 'Menor de edad registrado desde agenda'
        },
        representante: null,
        telefonoPaciente: phone,
        consentimientoRepresentanteFirmado: calculatedAge >= 18
      };
      onAddPatient(newPatient);

      auditLogService.addLog(
        'Creación de paciente',
        `Registró nuevo paciente desde agenda: ${name}`,
        'expediente',
        { id: 'user-current', name: userName, role: userRole }
      );
    }

    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      patientId,
      patientName,
      time,
      date,
      type: type as any,
      status: 'pendiente'
    };

    onAddAppointment(newApp);

    // Registrar cita en auditoría
    auditLogService.addLog(
      'Creación de cita',
      `Agendó nueva cita para ${patientName} el ${date} a las ${time}`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );

    setWhatsappTriggerId(patientId);
    setShowAddModal(false);

    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setSelectedPatientId('');
    setIsNewPatient(false);
  };

    const handleReprogram = async () => {
    if (!selectedApp) return;

    const updatedApp: Appointment = {
      ...selectedApp,
      time: reprogrammingTime,
      date: reprogrammingDate,
      status: 'pendiente' // al reagendar, la cita queda pendiente de confirmación
    };

    await appointmentService.update(updatedApp);

    // Reflejo local inmediato (mismo patrón que handleConfirmAppointment)
    selectedApp.time = reprogrammingTime;
    selectedApp.date = reprogrammingDate;
    selectedApp.status = 'pendiente';

    // Registrar en auditoría
    auditLogService.addLog(
      'Reprogramación de cita',
      `Cita reprogramada para ${selectedApp.patientName}. Nueva fecha: ${reprogrammingDate} a las ${reprogrammingTime}`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );

    alert('Cita reprogramada con éxito.');
    setSelectedApp(null);
  };

  const handleConfirmAppointment = async (app: Appointment) => {
    const pat = patients.find(p => p.id === app.patientId);
    const blockCheck = isActionBlockedByLegalConsent(pat);
    if (blockCheck.isBlocked) {
      alert(blockCheck.tooltip);
      return;
    }

    const updated = { ...app, status: 'confirmada' as const };
    await appointmentService.update(updated);
    app.status = 'confirmada';
    setSelectedApp({ ...app, status: 'confirmada' });

    auditLogService.addLog(
      'Confirmación de cita',
      `Confirmó la cita en agenda de ${app.patientName} para el ${app.date} a las ${app.time}`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );

    alert(`✓ Cita de ${app.patientName} confirmada con éxito.`);
  };

  const handlePushPatient = (app: Appointment) => {
    const pat = patients.find(p => p.id === app.patientId);
    const phoneDigits = (pat?.phone || '').replace(/\D/g, '');
    if (!phoneDigits) {
      alert('El paciente no tiene teléfono registrado.');
      return;
    }
    const message = `Hola ${app.patientName}, te contactamos de BreveMente. Notamos que no pudiste asistir a tu cita del ${app.date}. ¿Deseas reagendarla?`;
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, '_blank');
    auditLogService.addLog(
      'Contacto a paciente',
      `Envió push por WhatsApp a ${app.patientName} por inasistencia (${app.date}).`,
      'sesion',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  // Buscar pacientes existentes
  const filteredPatientsSearch = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector de Vistas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Agenda y Calendario Clínico</h2>
          <p className="text-xs text-clinical-textMuted">
            Planifica tus consultas, valida el estado legal de los pacientes y audita accesos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {['admin_platform', 'admin_clinical', 'therapist', 'assistant'].includes(userRole) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Cita
            </button>
          )}
        </div>
      </div>

      {/* Banner de WhatsApp e Intake Paciente Carlos Mendoza (Paso de Demo) */}
      {whatsappTriggerId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow animate-fadeIn" data-tour="whatsapp-simulation-btn">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                ✓ SIMULACIÓN DE INTAKE POR WHATSAPP ENVIADA
              </span>
              <p className="text-xs text-slate-700 mt-1 leading-normal font-medium">
                Link de consentimiento legal e historia clínica enviado al celular del paciente.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/intake?id=${whatsappTriggerId}`)}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Llenar Intake (Simulador Paciente)
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtros de la Agenda */}
      {userRole !== 'patient' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-400" />
            Filtros:
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Profesional:</label>
            <select
              className="px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none"
              value={filterTherapist}
              onChange={(e) => setFilterTherapist(e.target.value)}
            >
              <option value="all">Todos los terapeutas</option>
              <option value="Silva">Dr. Alejandro Silva</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Consultorio:</label>
            <select
              className="px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none"
              value={filterOffice}
              onChange={(e) => setFilterOffice(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="Consultorio A">Consultorio A</option>
              <option value="Consultorio B">Consultorio B</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Expediente:</label>
            <select
              className="px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none"
              value={filterModality}
              onChange={(e) => setFilterModality(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="ia">IA Asistida</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Estado Especial:</label>
            <select
              className="px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Ninguno</option>
              <option value="confirmada">Confirmada</option>
              <option value="pendiente">Pendiente</option>
              <option value="riesgo">Riesgo Clínico Alto</option>
              <option value="intake_pendiente">Admisión/Intake Pendiente</option>
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={blockHolidays}
                onChange={(e) => holidayService.setBlockHolidays(e.target.checked)}
                className="w-4 h-4 accent-clinical-accent"
              />
              <span className="font-semibold text-slate-600">Bloquear festivos para agendar</span>
            </label>
            <button
              onClick={() => setShowPersonalDayModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg font-bold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Día personal
            </button>
          </div>
        </div>
      )}

      {/* Modal de Día Personal */}
      {showPersonalDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Agregar Día Personal</h3>
            <form onSubmit={handleAddPersonalDay}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={personalDayDate}
                  onChange={(e) => setPersonalDayDate(e.target.value)}
                  className="border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-clinical-accent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={personalDayName}
                  onChange={(e) => setPersonalDayName(e.target.value)}
                  className="border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-clinical-accent"
                  placeholder="Nombre del día personal"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPersonalDayModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-md text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accent-hover text-white rounded-md transition-colors"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contenedor del Calendario y Detalle en Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Renderizado de la Vista del Calendario */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">
          {/* Navegación del Período */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <button
                onClick={zoomOut}
                disabled={viewLevel === 'anio'}
                title={viewLevel === 'anio' ? 'Nivel máximo' : 'Alejar (subir de nivel)'}
                className={`p-1 rounded text-slate-600 transition-colors ${viewLevel === 'anio' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
              >
                <ChevronLeft className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={goPrev}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-clinical-dark uppercase">
                {periodLabel}
              </span>
              <button
                onClick={goNext}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={goToday}
              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold text-slate-600 transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* VISTA SEMANAL */}
          {viewLevel === 'semana' && (
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                    <th className="p-3 w-16 text-center border-r border-slate-100">Horario</th>
                    {weekDays.map((day) => {
                      const dayHoliday = getHolidayForDate(day.date);
                      return (
                        <th key={day.date} className="p-3 text-center border-r border-slate-100 last:border-r-0">
                          {day.name}
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            {day.date.slice(8, 10)} {monthName(parseInt(day.date.slice(0, 4), 10), parseInt(day.date.slice(5, 7), 10)).slice(0, 3)}
                          </span>
                          {dayHoliday && (
                            <span className={`block text-[8px] font-bold mt-0.5 truncate ${dayHoliday.type === 'personal' ? 'text-violet-500' : 'text-red-600'}`}>
                              ● {dayHoliday.name}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[10px] relative">
                  {HOURS.map((hour) => {
                    const isTime12 = hour === '12:00';
                    return (
                      <tr key={hour} className="h-16 hover:bg-slate-50/20 relative">
                        <td className="p-3 text-center border-r border-slate-150 font-bold text-slate-400 align-top">
                          {hour}
                        </td>

                        {weekDays.map((day) => {
                          // Buscar citas en este día y esta hora
                          const slotApps = filteredAppointments.filter(app =>
                            app.date === day.date && app.time.split(':')[0] === hour.split(':')[0]
                          );

                          return (
                            <td
                              key={day.date}
                              className="border-r border-slate-150 last:border-r-0 p-1.5 align-top relative group"
                              style={{ width: '13%' }}
                            >
                              {/* Línea horaria simulada de hora actual a las 12:00 Lunes */}
                              {isTime12 && day.date === weekDays[0].date && (
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-400 z-10 pointer-events-none flex items-center">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute -left-1" />
                                </div>
                              )}

                              {slotApps.map((app) => {
                                const pat = patients.find(p => p.id === app.patientId);
                                const isCarlos = app.patientId === 'patient-2';

                                // Conflict validation (colisión)
                                const isConflict = slotApps.length > 1;

                                // Colores por frecuencia de sesiones del paciente
                                let borderClass = 'border-l-4 border-l-[#75AFBC] border border-slate-200';
                                if (pat?.sessionFrequency === 'semanal') {
                                  borderClass = 'border-l-4 border-l-green-500 border border-green-200 bg-green-50/50';
                                } else if (pat?.sessionFrequency === 'quincenal') {
                                  borderClass = 'border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50/50';
                                } else if (pat?.sessionFrequency === 'mensual') {
                                  borderClass = 'border-l-4 border-l-blue-600 border border-blue-200 bg-blue-50/40';
                                }

                                return (
                                  <div
                                    key={app.id}
                                    onClick={() => handleSelectAppointment(app)}
                                    data-tour={isCarlos ? 'agenda-carlos-mendoza' : undefined}
                                    className={`p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col gap-1 overflow-hidden h-full ${borderClass} ${isConflict ? 'border-dashed border-amber-400 ring-1 ring-amber-300' : ''
                                      }`}
                                  >
                                    <div className="flex items-center justify-between font-bold text-clinical-dark">
                                      <span className="truncate">{app.patientName}</span>
                                      {pat?.riskLevel === 'alto' && (
                                        <ShieldAlert className="w-3 h-3 text-red-500 shrink-0 animate-pulse" />
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] text-slate-400">
                                      <span className="font-semibold">{app.type.toUpperCase()}</span>
                                      <span className="font-bold">
                                        {appModality === 'online' ? 'VIRTUAL' : 'SALA A'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA MENSUAL */}
          {viewLevel === 'mes' && (
            <div className="p-4 grid grid-cols-7 gap-1 text-center bg-slate-50 font-bold">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="py-2 text-[10px] text-slate-400">{d}</div>
              ))}

              {/* Espacios vacíos para alinear el día 1 con su día de la semana */}
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div key={`blank-${i}`} className="min-h-20 rounded p-1.5 bg-slate-50/50" />
              ))}

              {Array.from({ length: monthDayCount }, (_, i) => {
                const dayNum = i + 1;
                const dayDate = `${anchorDate.slice(0, 7)}-${dayNum.toString().padStart(2, '0')}`;
                const dayApps = filteredAppointments.filter(a => a.date === dayDate);
                const holiday = getHolidayForDate(dayDate);

                return (
                  <div
                    key={dayDate}
                    onClick={() => zoomIn(dayDate, 'dia')}
                    className={`min-h-20 rounded p-1.5 text-left flex flex-col justify-between cursor-pointer transition-colors border ${holiday
                      ? holiday.type === 'personal'
                        ? 'bg-violet-50 border-violet-200 hover:border-violet-300'
                        : 'bg-slate-100 border-red-300 hover:border-red-400 border-l-4 border-l-red-500'
                      : 'bg-white border-slate-150 hover:border-[#75AFBC]'
                      }`}
                  >
                    <span className={`font-bold ${holiday ? (holiday.type === 'personal' ? 'text-violet-500' : 'text-red-600') : 'text-slate-400'}`}>{dayNum}</span>
                    {holiday && (
                      <span className={`text-[7px] font-bold truncate ${holiday.type === 'personal' ? 'text-violet-600' : 'text-red-600'}`}>
                        {holiday.name}
                      </span>
                    )}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayApps.slice(0, 2).map(app => {
                        const mPat = patients.find(p => p.id === app.patientId);
                        const freqClass =
                          mPat?.sessionFrequency === 'semanal' ? 'bg-green-50 border-l-green-500' :
                            mPat?.sessionFrequency === 'quincenal' ? 'bg-amber-50 border-l-amber-500' :
                              mPat?.sessionFrequency === 'mensual' ? 'bg-blue-50 border-l-blue-600' :
                                'bg-slate-50 border-l-[#75AFBC]';
                        return (
                          <div
                            key={app.id}
                            onClick={(e) => { e.stopPropagation(); handleSelectAppointment(app); }}
                            className={`border-l-2 px-1 py-0.5 rounded text-[8px] truncate font-semibold text-clinical-dark cursor-pointer ${freqClass}`}
                          >
                            {app.time} - {app.patientName}
                          </div>
                        );
                      })}
                      {dayApps.length > 2 && (
                        <span className="text-[7px] text-slate-400 font-bold block">+{dayApps.length - 2} más</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA DIARIA */}
          {viewLevel === 'dia' && (
            <div className="divide-y divide-slate-100 p-4 space-y-2">
              <div className="text-xs font-bold text-clinical-dark uppercase border-b border-slate-100 pb-2">
                {dayName(anchorDate)}, {anchorDate}
              </div>
              {anchorHoliday && (
                <div className={`text-[10px] font-bold px-3 py-2 rounded-lg border ${anchorHoliday.type === 'personal'
                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                  : 'bg-slate-100 text-red-700 border-red-300'
                  }`}>
                  {anchorHoliday.type === 'personal' ? '🟣' : '🔴'} {anchorHoliday.name} — día no laborable
                </div>
              )}
              {HOURS.map((hour) => {
                const hourApps = filteredAppointments.filter(a => a.date === anchorDate && a.time.split(':')[0] === hour.split(':')[0]);
                return (
                  <div key={hour} className="py-3 flex items-start gap-4 hover:bg-slate-50/50">
                    <span className="w-16 font-bold text-slate-400 text-xs shrink-0">{hour}</span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hourApps.map(app => {
                        const pat = patients.find(p => p.id === app.patientId);
                        const freqBorder =
                          pat?.sessionFrequency === 'semanal' ? 'border-l-4 border-l-green-500' :
                            pat?.sessionFrequency === 'quincenal' ? 'border-l-4 border-l-amber-500' :
                              pat?.sessionFrequency === 'mensual' ? 'border-l-4 border-l-blue-600' :
                                'border-l-4 border-l-[#75AFBC]';
                        const statusConf = APPOINTMENT_STATUS_CONFIG[app.status] || { label: app.status, color: 'bg-slate-100 text-slate-500' };
                        return (
                          <div
                            key={app.id}
                            onClick={() => handleSelectAppointment(app)}
                            className={`bg-white border border-slate-200 rounded-lg p-3 cursor-pointer shadow-sm hover:border-[#75AFBC] transition-all ${freqBorder}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-clinical-dark block">{app.patientName}</span>
                                <span className="text-[10px] text-slate-400">{app.type.toUpperCase()} • {pat?.registryMode === 'ia' ? 'IA ACTIVA' : 'MANUAL'}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${statusConf.color}`}>
                                {statusConf.label}
                              </span>
                            </div>

                            {['therapist', 'assistant', 'admin_clinical', 'admin_platform', 'supervisor'].includes(userRole) && (
                              <div className="flex gap-2 mt-2">
                                {app.status === 'no_presentado' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePushPatient(app); }}
                                    className="flex items-center gap-1 px-2 py-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded text-[10px] font-bold transition-colors"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Contactar
                                  </button>
                                )}
                                {app.status === 'solicita_reagendar' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSelectAppointment(app); }}
                                    className="flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Reagendar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA ANUAL */}
          {viewLevel === 'anio' && (
            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const monthKey = `${year}-${String(m).padStart(2, '0')}`;
                const monthCount = filteredAppointments.filter(a => a.date.startsWith(monthKey)).length;
                return (
                  <div
                    key={m}
                    onClick={() => zoomIn(`${monthKey}-01`, 'mes')}
                    className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-[#75AFBC] transition-colors shadow-sm"
                  >
                    <span className="text-xs font-bold text-clinical-dark block capitalize">{monthName(year, m)}</span>
                    <span className="text-[10px] text-slate-400">{monthCount} cita{monthCount !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel lateral: Leyenda e Instrucciones */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit text-xs text-slate-600 leading-relaxed">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <CalendarIcon className="w-4 h-4 text-[#75AFBC]" />
            <span className="font-bold text-clinical-dark uppercase">Frecuencia de Sesiones</span>
          </div>

          <div className="space-y-3 font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-50 border border-green-300 rounded border-l-4 border-l-green-500 shrink-0" />
              <span>Semanal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-50 border border-amber-300 rounded border-l-4 border-l-amber-500 shrink-0" />
              <span>Quincenal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded border-l-4 border-l-blue-600 shrink-0" />
              <span>Mensual</span>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER LATERAL: DETALLE DE CITA */}
      {selectedApp && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slideInRight text-xs text-slate-650">
          <div className="bg-clinical-dark p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-clinical-accent" />
              <div>
                <h3 className="font-bold">Detalle de Consulta</h3>
                <span className="text-[9px] text-slate-300 block">BreveMente Clinical Workflow</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedApp(null)}
              className="text-slate-300 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Cuerpo del Drawer */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 leading-normal">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Paciente:</span>
              <span className="text-sm font-extrabold text-clinical-dark block">{selectedApp.patientName}</span>
            </div>

            {/* Ficha de Estado Consentimiento/Intake */}
            {(() => {
              const selectedAppPatient = patients.find(p => p.id === selectedApp.patientId);
              const appointmentBlockCheck = isActionBlockedByLegalConsent(selectedAppPatient);
              const isAppBlocked = appointmentBlockCheck.isBlocked;

              return (
                <>
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                    <span className="font-bold text-clinical-dark block border-b border-slate-200 pb-1 mb-1">Estatus del Paciente</span>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${selectedAppPatient?.status === 'pendiente' ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <span>Historia Clínica: <b>{selectedAppPatient?.status === 'pendiente' ? 'Pendiente' : 'Completa'}</b></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${selectedAppPatient?.consentimientoRepresentanteFirmado === false ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <span>Consentimiento: <b>{selectedAppPatient?.consentimientoRepresentanteFirmado === false ? 'Pendiente Rep.' : 'Firmado'}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Confirmación de Cita con Bloqueo Normativo */}
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-clinical-dark">Estado de Confirmación</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${selectedApp.status === 'confirmada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {selectedApp.status === 'confirmada' ? '✓ Confirmada' : 'Pendiente'}
                      </span>
                    </div>

                    {isAppBlocked && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[10px] flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Acción Bloqueada:</span>
                          <span>{LEGAL_CONSENT_TOOLTIP}</span>
                        </div>
                      </div>
                    )}

                    {selectedApp.status === 'pendiente' && (
                      <button
                        type="button"
                        disabled={isAppBlocked}
                        title={isAppBlocked ? LEGAL_CONSENT_TOOLTIP : 'Confirmar esta cita en la agenda'}
                        onClick={() => handleConfirmAppointment(selectedApp)}
                        className={`w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs ${isAppBlocked
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                      >
                        {isAppBlocked ? <Lock className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                        Confirmar Cita en Agenda
                      </button>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Reprogramación */}
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
              <span className="font-bold text-clinical-dark block">Reprogramación de Fecha y Hora</span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Fecha:</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none text-[10px] font-semibold"
                    value={reprogrammingDate}
                    onChange={(e) => setReprogrammingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Horario:</label>
                  <input
                    type="time"
                    className="w-full px-2 py-1 border border-slate-200 bg-white rounded focus:outline-none text-[10px] font-semibold"
                    value={reprogrammingTime}
                    onChange={(e) => setReprogrammingTime(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleReprogram}
                className="w-full py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded font-bold transition-colors shadow-sm"
              >
                Guardar Reprogramación
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Uso de IA autorizado por consentimiento:</span>
              <span className="font-bold text-clinical-dark uppercase">
                {patients.find(p => p.id === selectedApp.patientId)?.registryMode === 'ia' ? 'Grabación y Notas con IA' : 'Modo Manual / Resguardo Estricto'}
              </span>
            </div>
          </div>

          {/* Footer del Drawer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0 flex gap-2">
            {patients.find(p => p.id === selectedApp.patientId)?.status !== 'pendiente' && (
              <button
                onClick={() => {
                  setSelectedApp(null);
                  navigate(`/expedientes?id=${selectedApp.patientId}`);
                }}
                className="flex-1 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg font-bold shadow-sm text-center"
              >
                Atender / Abrir Expediente
              </button>
            )}
            <button
              onClick={() => setSelectedApp(null)}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg font-bold text-slate-500 hover:bg-slate-100"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar la cita de ${selectedApp.patientName}?`)) {
                  onDeleteAppointment(selectedApp.id);
                  setSelectedApp(null);
                }
              }}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg font-bold"
            >
              Eliminar cita
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREAR CITA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-clinical-dark text-white rounded-t-xl">
              <h3 className="text-xs font-bold uppercase flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#75AFBC]" />
                Agendar Consulta Médica
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg font-semibold text-center text-slate-500">
                <button
                  type="button"
                  className={`py-1 rounded transition-all ${!isNewPatient ? 'bg-white text-clinical-dark shadow-sm' : ''}`}
                  onClick={() => setIsNewPatient(false)}
                >
                  Buscar Existente
                </button>
                <button
                  type="button"
                  className={`py-1 rounded transition-all ${isNewPatient ? 'bg-white text-clinical-dark shadow-sm' : ''}`}
                  onClick={() => setIsNewPatient(true)}
                >
                  Registrar Paciente Nuevo
                </button>
              </div>

              {!isNewPatient ? (
                <div className="space-y-1">
                  <label className="block text-slate-500 font-semibold mb-1">Buscar Paciente:</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    placeholder="Escribe nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && filteredPatientsSearch.length > 0 && !selectedPatientId && (
                    <div className="border border-slate-200 bg-white rounded shadow-inner max-h-24 overflow-y-auto divide-y divide-slate-100">
                      {filteredPatientsSearch.map(p => (
                        <div
                          key={p.id}
                          className="p-2 hover:bg-slate-50 cursor-pointer font-semibold text-slate-700"
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setName(p.name);
                            setSearchTerm(p.name);
                          }}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Nombre Completo:</label>
                      <input
                        type="text"
                        required
                        className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded focus:outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-0.5">Teléfono:</label>
                      <input
                        type="tel"
                        required
                        className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded focus:outline-none"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-0.5">Fecha:</label>
                  <input
                    type="date"
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {(() => {
                    const h = getHolidayForDate(date);
                    if (!h) return null;
                    return (
                      <span className={`block text-[9px] font-bold mt-1 ${isBlockedDate(date) ? 'text-red-600' : 'text-slate-400'}`}>
                        {isBlockedDate(date) ? `⚠️ ${h.name} — no se puede agendar` : `ℹ️ ${h.name} (no laborable, bloqueo desactivado)`}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-0.5">Horario:</label>
                  <input
                    type="time"
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-0.5">Tipo:</label>
                  <select
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded focus:outline-none"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    <option value="primera">Primera vez</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="cierre">Cierre</option>
                    <option value="supervision">Supervisión</option>
                    <option value="evaluacion">Evaluación</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-100"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBlockedDate(date)}
                  className={`px-4 py-2 rounded-lg font-bold shadow ${isBlockedDate(date) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-clinical-dark text-white hover:bg-clinical-darkLight'}`}
                >
                  Registrar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Día Personal */}
      {showPersonalDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-violet-600 text-white rounded-t-xl">
              <h3 className="text-xs font-bold uppercase flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                Día Personal (no laborable)
              </h3>
              <button onClick={() => setShowPersonalDayModal(false)} className="text-violet-200 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPersonalDay} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-0.5">Fecha:</label>
                <input
                  type="date"
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                  value={personalDayDate}
                  onChange={(e) => setPersonalDayDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-0.5">Motivo:</label>
                <input
                  type="text"
                  placeholder="Ej. Vacaciones, asunto personal, congreso..."
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                  value={personalDayName}
                  onChange={(e) => setPersonalDayName(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                ⚠️ Este día quedará <b>bloqueado para agendar citas</b> y se marcará en morado en el calendario.
              </p>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-100"
                  onClick={() => setShowPersonalDayModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold shadow"
                >
                  Guardar día personal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
