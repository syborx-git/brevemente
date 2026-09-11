import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Agenda } from './pages/Agenda';
import { ClinicalRecord } from './pages/ClinicalRecord';
import { PatientDashboard } from './pages/PatientDashboard';

import { AIAssistant } from './pages/AIAssistant';
import { Library } from './pages/Library';
import { Reports } from './pages/Reports';
import { Supervision } from './pages/Supervision';
import { Analytics } from './pages/Analytics';
import { SecurityAudit } from './pages/SecurityAudit';
import { IntakeForm } from './pages/IntakeForm';
import { Campus } from './pages/Campus';
import { MiConsulta } from './pages/MiConsulta';

// Componentes Demo y Senda
import { DemoLauncher } from './components/DemoLauncher';
import { GuidedDemo } from './components/GuidedDemo';
import { SendaButton } from './components/SendaButton';
import { SendaSidebarPanel } from './components/SendaSidebarPanel';

import { Role, Patient, Appointment } from './types/clinical';
import { mockPatients, mockAppointments } from './data/mockData';
import { auditLogService } from './services/auditLogService';
import { demoStateService } from './services/demoStateService';
import { patientService } from './services/patientService';
import { appointmentService } from './services/appointmentService';
import { recordService } from './services/recordService';
import { sessionService } from './services/sessionService';
import { hasPermission } from './utils/permissions';


import { therapistSettingsService } from './services/therapistSettingsService';

const USER_NAMES: Record<Role, string> = {
  admin_platform: 'Ing. Rodrigo Pérez',
  admin_clinical: 'Dra. Patricia Ortiz',
  therapist: 'Dr. Alejandro Silva',
  assistant: 'Marta Gómez',
  supervisor: 'Dra. Isabel Cárdenas',
  patient: 'Sofía Martínez',
  student: 'Carlos Mendoza'
};

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('therapist');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [edadMinimaConfig, setEdadMinimaConfig] = useState<number>(0);
  // Paciente actualmente simulado en la vista de demo de paciente
  const [currentPatientId, setCurrentPatientId] = useState<string>('patient-1');

  // Estados de la Demo y Brifi
  const [activeTour, setActiveTour] = useState<'executiva' | 'clinica' | 'academic' | 'none'>('none');
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isSendaOpen, setIsSendaOpen] = useState(false);

  // Carga inicial y listeners de eventos de demo
  const loadLocalData = async () => {
    setPatients(await patientService.getAll());
    setAppointments(await appointmentService.getAll());
    setEdadMinimaConfig(therapistSettingsService.getEdadMinimaAtencion());
  };

  useEffect(() => {
    const localPatients = localStorage.getItem('brevemente_patients');
    const localAppointments = localStorage.getItem('brevemente_appointments');

    let parsedPatients: Patient[] = [];
    if (localPatients) {
      try {
        parsedPatients = JSON.parse(localPatients);
      } catch {
        parsedPatients = [];
      }
    }

    // Si no existen o si provienen de la versión anterior sin capacidadConsentimiento, actualizar con mockPatients
    if (!localPatients || parsedPatients.length === 0 || !parsedPatients.some(p => p.capacidadConsentimiento)) {
      localStorage.setItem('brevemente_patients', JSON.stringify(mockPatients));
    }

    // Migración de citas: si no existen o no tienen paymentStatus, recargar con mockAppointments enriquecidos
    let parsedAppointments: Appointment[] = [];
    if (localAppointments) {
      try { parsedAppointments = JSON.parse(localAppointments); } catch { parsedAppointments = []; }
    }
    if (!localAppointments || parsedAppointments.length === 0 || !parsedAppointments.some(a => a.paymentStatus)) {
      localStorage.setItem('brevemente_appointments', JSON.stringify(mockAppointments));
    }
    loadLocalData();


    // Listeners para sincronizar estado de demo
    const handleDemoReset = () => {
      loadLocalData();
      setActiveTour('none');
      setCurrentDemoStep(0);
    };

    const handleStepChange = (e: Event) => {
      setCurrentDemoStep((e as CustomEvent).detail);
    };

    const handleTourChange = (e: Event) => {
      setActiveTour((e as CustomEvent).detail);
    };

    window.addEventListener('brevemente_demo_reset', handleDemoReset);
    window.addEventListener('brevemente_demo_step_change', handleStepChange);
    window.addEventListener('brevemente_demo_tour_change', handleTourChange);

    return () => {
      window.removeEventListener('brevemente_demo_reset', handleDemoReset);
      window.removeEventListener('brevemente_demo_step_change', handleStepChange);
      window.removeEventListener('brevemente_demo_tour_change', handleTourChange);
    };
  }, []);

  const handleAddPatient = async (newPat: Patient) => {
    await patientService.create(newPat);
    setPatients([...patients, newPat]);
  };

  const handleUpdatePatient = async (updatedPat: Patient) => {
    await patientService.update(updatedPat);
    setPatients(patients.map(p => p.id === updatedPat.id ? updatedPat : p));
  };

  const handleDeletePatient = async (id: string) => {
    // 1. Borrar al paciente
    await patientService.remove(id);
    // 2. Borrar sus citas (¡el removeByPatientId que creaste para esto!)
    await appointmentService.removeByPatientId(id);
    // 3. Borrar su expediente y sesiones a través de los servicios (la "costura")
    await recordService.removeByPatientId(id);
    await sessionService.removeByPatientId(id);
    // 4. Actualizar la interfaz
    setPatients(patients.filter(p => p.id !== id));
    setAppointments(appointments.filter(a => a.patientId !== id));
  };

  const handleAddAppointment = async (newApp: Appointment) => {
    await appointmentService.create(newApp);
    setAppointments([...appointments, newApp]);
  };

  const handleDeleteAppointment = async (id: string) => {
    await appointmentService.remove(id);
    setAppointments(appointments.filter(a => a.id !== id));
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    auditLogService.addLog(
      'Cambio de Rol (Demo)',
      `Simuló cambio de acceso al rol: ${role.toUpperCase().replace('_', ' ')}`,
      'seguridad',
      { id: 'system-demo', name: USER_NAMES[role], role: role }
    );
  };

  const handleLogout = () => {
    auditLogService.addLog(
      'Salida del sistema',
      'El usuario cerró sesión voluntariamente',
      'seguridad',
      { id: 'user-current', name: USER_NAMES[currentRole], role: currentRole }
    );
    alert('Sesión cerrada (Simulación del prototipo).');
  };

  // Demo Control
  const handleStartTour = (tourType: 'executiva' | 'clinica' | 'academic' | 'none') => {
    setIsLauncherOpen(false);
    if (tourType !== 'none') {
      demoStateService.setActiveTour(tourType);
      demoStateService.setActiveStep(1);

      // Registrar log auditoría
      auditLogService.addLog(
        'Inicio de Demo Guiada',
        `Inició la demo guiada en modalidad: ${tourType.toUpperCase()}`,
        'seguridad',
        { id: 'system-demo', name: USER_NAMES[currentRole], role: currentRole }
      );
    } else {
      demoStateService.setActiveTour('none');
      demoStateService.setActiveStep(0);
    }
  };

  const handleCloseTour = () => {
    demoStateService.setActiveTour('none');
    demoStateService.setActiveStep(0);
  };

  return (
    <Router>
      <Routes>
        {/* Flujo de Paciente (Intake) sin Layout general */}
        <Route
          path="/intake"
          element={
            <div className="min-h-screen bg-slate-100 py-10 px-4">
              <IntakeForm patients={patients} onUpdatePatient={handleUpdatePatient} />
            </div>
          }
        />

        {/* Layout de Profesionales */}
        <Route
          path="/*"
          element={
            <div className="flex h-screen overflow-hidden bg-clinical-bg">
              {/* Sidebar Izquierda (Solo renderiza si el rol no es paciente, o si está autorizado) */}
              {hasPermission(currentRole, 'dashboard') && (
                <Sidebar userRole={currentRole} onLogout={handleLogout} />
              )}

              {/* Contenedor Principal */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Cabecera */}
                <Header
                  currentRole={currentRole}
                  onChangeRole={handleRoleChange}
                  userName={USER_NAMES[currentRole]}
                  onStartDemo={() => setIsLauncherOpen(true)}
                  patients={patients}
                  currentPatientId={currentPatientId}
                  onChangePatient={setCurrentPatientId}
                />

                {/* Área de Contenido */}
                <main className="flex-1 overflow-y-auto p-6">
                  <Routes>
                    {/* Dashboard de Inicio */}
                    <Route
                      path="/"
                      element={
                        hasPermission(currentRole, 'dashboard') ? (
                          <Dashboard
                            userRole={currentRole}
                            appointments={appointments}
                            patients={patients}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : currentRole === 'student' ? (
                          <Navigate to="/campus" replace />
                        ) : currentRole === 'patient' ? (
                          <Navigate to="/mi-historial" replace />
                        ) : (
                          <Navigate to="/agenda" replace />
                        )
                      }
                    />

                    {/* Campus BreveMente */}
                    <Route
                      path="/campus"
                      element={
                        hasPermission(currentRole, 'campus') ? (
                          <Campus
                            userRole={currentRole}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Mi Consulta */}
                    <Route
                      path="/mi-consulta"
                      element={
                        !['student', 'patient'].includes(currentRole) ? (
                          <MiConsulta
                            userRole={currentRole}
                            appointments={appointments}
                            patients={patients}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Directorio de Pacientes */}
                    <Route
                      path="/pacientes"
                      element={
                        hasPermission(currentRole, 'patients') ? (
                          <Patients
                            userRole={currentRole}
                            patients={patients}
                            userName={USER_NAMES[currentRole]}
                            onDeletePatient={handleDeletePatient}
                            onAddPatient={handleAddPatient}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Portal del Paciente — Historial de Citas */}
                    <Route
                      path="/mi-historial"
                      element={
                        hasPermission(currentRole, 'historial_paciente') ? (() => {
                          const activePatient = patients.find(p => p.id === currentPatientId) ?? patients[0];
                          return activePatient ? (
                            <PatientDashboard
                              patient={activePatient}
                              appointments={appointments}
                              userName={activePatient.name}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                              No hay pacientes registrados en el sistema.
                            </div>
                          );
                        })() : (
                          <Navigate to="/" replace />
                        )
                      }
                    />
                    {/* Agenda */}
                    <Route
                      path="/agenda"
                      element={
                        hasPermission(currentRole, 'agenda') ? (
                          <Agenda
                            userRole={currentRole}
                            appointments={appointments}
                            patients={patients}
                            onAddAppointment={handleAddAppointment}
                            onAddPatient={handleAddPatient}
                            onDeleteAppointment={handleDeleteAppointment}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Expedientes */}
                    <Route
                      path="/expedientes"
                      element={
                        hasPermission(currentRole, 'expedientes') ? (
                          <ClinicalRecord
                            userRole={currentRole}
                            patients={patients}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Senda - Redirección e Integración completa */}
                    <Route path="/ia-assistant" element={<Navigate to="/senda" replace />} />
                    <Route path="/brifi" element={<Navigate to="/senda" replace />} />

                    <Route
                      path="/senda"
                      element={
                        hasPermission(currentRole, 'senda') ? (
                          <AIAssistant
                            userRole={currentRole}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Biblioteca Digital */}
                    <Route
                      path="/biblioteca"
                      element={
                        hasPermission(currentRole, 'biblioteca') ? (
                          <Library
                            userRole={currentRole}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Reportes y Constancias */}
                    <Route
                      path="/reportes"
                      element={
                        hasPermission(currentRole, 'reportes') ? (
                          <Reports
                            userRole={currentRole}
                            patients={patients}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Bitácora de Supervisión */}
                    <Route
                      path="/supervision"
                      element={
                        hasPermission(currentRole, 'supervision') ? (
                          <Supervision
                            userRole={currentRole}
                            patients={patients}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Tu Desempeño */}
                    <Route
                      path="/desempeno"
                      element={
                        hasPermission(currentRole, 'desempeno') ? (
                          <Analytics
                            userRole={currentRole}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Auditoría y Seguridad */}
                    <Route
                      path="/auditoria"
                      element={
                        hasPermission(currentRole, 'auditoria') ? (
                          <SecurityAudit
                            userRole={currentRole}
                            userName={USER_NAMES[currentRole]}
                          />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Configuración */}
                    <Route
                      path="/configuracion"
                      element={
                        hasPermission(currentRole, 'configuracion') ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-xs text-slate-650 space-y-6">
                            <div>
                              <h3 className="text-sm font-bold text-clinical-dark border-b border-slate-100 pb-2">
                                Configuración General de BreveMente
                              </h3>
                              <p className="text-slate-400 mt-1">
                                Parámetros del terapeuta, reglas de admisión y resguardo legal.
                              </p>
                            </div>

                            {/* Parámetros del Terapeuta */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                              <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider block border-b border-slate-200 pb-2">
                                Parámetros de Atención y Criterio Clínico
                              </span>

                              <div className="max-w-md space-y-2">
                                <label className="block font-bold text-clinical-dark text-xs">
                                  Edad mínima por criterio de consulta (años cumplidos):
                                </label>
                                <p className="text-[11px] text-slate-500">
                                  Define el umbral de edad de atención preferente. Si un paciente registrado tiene una edad menor a este parámetro, el sistema emitirá una advertencia no bloqueante en el paso 1 de creación.
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={edadMinimaConfig}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      setEdadMinimaConfig(val);
                                      therapistSettingsService.setEdadMinimaAtencion(val);
                                    }}
                                    className="w-24 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-clinical-dark focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                                  />
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    {edadMinimaConfig === 0 ? '(0 = Sin límite de edad mínima)' : `Aviso si menor a ${edadMinimaConfig} años`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-clinical-accent">
                              Esta sección sincroniza en tiempo real los parámetros del clínico en almacenamiento seguro de sesión.
                            </div>
                          </div>
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>

              {/* Botón flotante y panel derecho de Senda */}
              {hasPermission(currentRole, 'senda') && (
                <>
                  <SendaButton
                    onClick={() => setIsSendaOpen(true)}
                    hasNotification={activeTour !== 'none'}
                  />
                  <SendaSidebarPanel
                    isOpen={isSendaOpen}
                    onClose={() => setIsSendaOpen(false)}
                    userRole={currentRole}
                    userName={USER_NAMES[currentRole]}
                    patientName="Sofía Martínez"
                    activeProtocol="Ataque de Pánico"
                    onAcceptSuggestion={(text) => {
                      // Dispara evento global de inyección para ClinicalRecord
                      window.dispatchEvent(new CustomEvent('brevemente_brifi_inject', { detail: text }));
                    }}
                  />
                </>
              )}

              {/* Componente Overlay de la Demo Guiada */}
              <GuidedDemo
                activeTour={activeTour}
                currentStep={currentDemoStep}
                onChangeStep={(step) => demoStateService.setActiveStep(step)}
                onCloseTour={handleCloseTour}
                userRole={currentRole}
                onChangeRole={handleRoleChange}
              />

              {/* Launcher Modal de Selección de Demo */}
              <DemoLauncher
                isOpen={isLauncherOpen}
                onClose={() => setIsLauncherOpen(false)}
                onStartTour={handleStartTour}
              />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
