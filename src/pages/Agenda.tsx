import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Filter, 
  MapPin, Video, AlertTriangle, MessageSquare, Clipboard, User, 
  PlusCircle, RefreshCw, X, ShieldAlert, Sparkles, Check, CheckSquare 
} from 'lucide-react';
import { Role, Appointment, Patient } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';

interface AgendaProps {
  userRole: Role;
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (app: Appointment) => void;
  onAddPatient: (pat: Patient) => void;
  userName: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const DAYS = [
  { name: 'Lunes', date: '2026-08-24' },
  { name: 'Martes', date: '2026-08-25' },
  { name: 'Miércoles', date: '2026-08-26' },
  { name: 'Jueves', date: '2026-08-27' },
  { name: 'Viernes', date: '2026-08-28' },
  { name: 'Sábado', date: '2026-08-29' },
  { name: 'Domingo', date: '2026-08-30' }
];

export const Agenda: React.FC<AgendaProps> = ({
  userRole,
  appointments: initialAppointments,
  patients,
  onAddAppointment,
  onAddPatient,
  userName
}) => {
  const navigate = useNavigate();

  // Estados
  const [calendarView, setCalendarView] = useState<'mes' | 'semana' | 'dia'>('semana');
  const [currentDateIndex, setCurrentDateIndex] = useState(0); // 0 representa la semana del 24 de agosto
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

  // Paciente de hoy (Carlos Mendoza es el patient-2)
  const patient2 = patients.find(p => p.id === 'patient-2');

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

    let patientId = selectedPatientId;
    let patientName = name;

    if (isNewPatient) {
      patientId = `patient-${Date.now()}`;
      const newPatient: Patient = {
        id: patientId,
        name,
        phone,
        email,
        birthDate,
        curp: 'CURP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        riskLevel: 'bajo',
        registryMode: 'ia',
        motif,
        therapistId: 'therapist-1',
        therapistName: 'Dr. Alejandro Silva'
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

  const handleReprogram = () => {
    if (!selectedApp) return;

    selectedApp.time = reprogrammingTime;
    selectedApp.date = reprogrammingDate;
    
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
          {/* Selector de vistas */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold" data-tour="calendar-view">
            <button
              onClick={() => setCalendarView('mes')}
              className={`px-3 py-1.5 rounded-md transition-all ${calendarView === 'mes' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Mes
            </button>
            <button
              onClick={() => setCalendarView('semana')}
              className={`px-3 py-1.5 rounded-md transition-all ${calendarView === 'semana' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setCalendarView('dia')}
              className={`px-3 py-1.5 rounded-md transition-all ${calendarView === 'dia' ? 'bg-white text-clinical-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Día
            </button>
          </div>

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
                onClick={() => setCurrentDateIndex(prev => prev - 1)}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-clinical-dark uppercase">
                {calendarView === 'mes' ? 'Agosto 2026' : 'Semana del 24 al 30 de Agosto, 2026'}
              </span>
              <button 
                onClick={() => setCurrentDateIndex(prev => prev + 1)}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setCurrentDateIndex(0)}
              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold text-slate-600 transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* VISTA SEMANAL */}
          {calendarView === 'semana' && (
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                    <th className="p-3 w-16 text-center border-r border-slate-100">Horario</th>
                    {DAYS.map((day) => (
                      <th key={day.date} className="p-3 text-center border-r border-slate-100 last:border-r-0">
                        {day.name}
                        <span className="block text-[9px] text-slate-400 mt-0.5">{day.date.split('-')[2]} Ago</span>
                      </th>
                    ))}
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
                        
                        {DAYS.map((day) => {
                          // Buscar citas en este día y esta hora
                          const slotApps = filteredAppointments.filter(app => 
                            app.date === day.date && app.time === hour
                          );

                          return (
                            <td 
                              key={day.date} 
                              className="border-r border-slate-150 last:border-r-0 p-1.5 align-top relative group"
                              style={{ width: '13%' }}
                            >
                              {/* Línea horaria simulada de hora actual a las 12:00 Lunes */}
                              {isTime12 && day.date === '2026-08-24' && (
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-400 z-10 pointer-events-none flex items-center">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute -left-1" />
                                </div>
                              )}

                              {slotApps.map((app) => {
                                const pat = patients.find(p => p.id === app.patientId);
                                const isCarlos = app.patientId === 'patient-2';
                                
                                // Conflict validation (colisión)
                                const isConflict = slotApps.length > 1;

                                // Colores y bordes accesibles de acuerdo al tipo y riesgo
                                let borderClass = 'border-l-4 border-l-[#75AFBC] border border-slate-200';
                                if (pat?.riskLevel === 'alto') {
                                  borderClass = 'border-l-4 border-l-red-500 border border-red-200 bg-red-50/50';
                                } else if (pat?.status === 'pendiente') {
                                  borderClass = 'border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50/50';
                                } else if (app.type === 'primera') {
                                  borderClass = 'border-l-4 border-l-blue-600 border border-blue-200 bg-blue-50/40';
                                }

                                return (
                                  <div
                                    key={app.id}
                                    onClick={() => handleSelectAppointment(app)}
                                    data-tour={isCarlos ? 'agenda-carlos-mendoza' : undefined}
                                    className={`p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col gap-1 overflow-hidden h-full ${borderClass} ${
                                      isConflict ? 'border-dashed border-amber-400 ring-1 ring-amber-300' : ''
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
          {calendarView === 'mes' && (
            <div className="p-4 grid grid-cols-7 gap-1 text-center bg-slate-50 font-bold">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="py-2 text-[10px] text-slate-400">{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = i + 1;
                const dayDate = `2026-08-${dayNum.toString().padStart(2, '0')}`;
                const dayApps = filteredAppointments.filter(a => a.date === dayDate);
                
                return (
                  <div key={i} className="bg-white border border-slate-150 min-h-20 rounded p-1.5 text-left flex flex-col justify-between">
                    <span className="font-bold text-slate-400">{dayNum}</span>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayApps.slice(0, 2).map(app => (
                        <div 
                          key={app.id}
                          onClick={() => handleSelectAppointment(app)}
                          className="bg-blue-50 border-l-2 border-clinical-accent px-1 py-0.5 rounded text-[8px] truncate font-semibold text-clinical-dark cursor-pointer"
                        >
                          {app.time} - {app.patientName}
                        </div>
                      ))}
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
          {calendarView === 'dia' && (
            <div className="divide-y divide-slate-100 p-4 space-y-2">
              {HOURS.map((hour) => {
                const hourApps = filteredAppointments.filter(a => a.date === '2026-08-24' && a.time === hour);
                return (
                  <div key={hour} className="py-3 flex items-start gap-4 hover:bg-slate-50/50">
                    <span className="w-16 font-bold text-slate-400 text-xs shrink-0">{hour}</span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hourApps.map(app => {
                        const pat = patients.find(p => p.id === app.patientId);
                        return (
                          <div 
                            key={app.id} 
                            onClick={() => handleSelectAppointment(app)}
                            className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer shadow-sm hover:border-[#75AFBC] transition-all flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-clinical-dark block">{app.patientName}</span>
                              <span className="text-[10px] text-slate-400">{app.type.toUpperCase()} • {pat?.registryMode === 'ia' ? 'IA ACTIVA' : 'MANUAL'}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">{app.status}</span>
                          </div>
                        );
                      })}
                    </div>
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
            <span className="font-bold text-clinical-dark uppercase">Estados de Cita</span>
          </div>

          <div className="space-y-3 font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded border-l-4 border-l-red-500 shrink-0" />
              <span>Riesgo clínico elevado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded border-l-4 border-l-amber-500 shrink-0" />
              <span>Intake/Consentimiento pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded border-l-4 border-l-blue-600 shrink-0" />
              <span>Primera consulta de valoración</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border border-slate-200 rounded border-l-4 border-l-[#75AFBC] shrink-0" />
              <span>Seguimiento estándar (TBE)</span>
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
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
              <span className="font-bold text-clinical-dark block border-b border-slate-200 pb-1 mb-1">Estatus del Paciente</span>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${patients.find(p => p.id === selectedApp.patientId)?.status === 'pendiente' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <span>Historia Clínica: <b>{patients.find(p => p.id === selectedApp.patientId)?.status === 'pendiente' ? 'Pendiente' : 'Completa'}</b></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${patients.find(p => p.id === selectedApp.patientId)?.status === 'pendiente' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <span>Consentimiento: <b>{patients.find(p => p.id === selectedApp.patientId)?.status === 'pendiente' ? 'Pendiente' : 'Firmado'}</b></span>
                </div>
              </div>
            </div>

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
                  className="px-4 py-2 bg-clinical-dark text-white rounded-lg font-bold shadow hover:bg-clinical-darkLight"
                >
                  Registrar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
