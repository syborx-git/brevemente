import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Agenda } from './pages/Agenda';
import { ClinicalRecord } from './pages/ClinicalRecord';
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
import { hasPermission } from './utils/permissions';

const USER_NAMES: Record<Role, string> = {
  admin_platform: 'Ing. Rodrigo Pérez',
  admin_clinical: 'Dra. Patricia Ortiz',
  therapist: 'Dr. Alejandro Silva',
  assistant: 'Marta Gómez',
  supervisor: 'Dra. Isabel Cárdenas',
  patient: 'Sofía Martínez',
  student: 'Carlos Mendoza',
  academic_coordinator: 'Dra. Patricia Ortiz'
};

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('therapist');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Estados de la Demo y Brifi
  const [activeTour, setActiveTour] = useState<'executiva' | 'clinica' | 'academic' | 'none'>('none');
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isSendaOpen, setIsSendaOpen] = useState(false);

  // Carga inicial y listeners de eventos de demo
  const loadLocalData = () => {
    setPatients(JSON.parse(localStorage.getItem('brevemente_patients') || '[]'));
    setAppointments(JSON.parse(localStorage.getItem('brevemente_appointments') || '[]'));
  };

  useEffect(() => {
    const localPatients = localStorage.getItem('brevemente_patients');
    const localAppointments = localStorage.getItem('brevemente_appointments');

    if (!localPatients) {
      localStorage.setItem('brevemente_patients', JSON.stringify(mockPatients));
    }
    if (!localAppointments) {
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

  const handleAddPatient = (newPat: Patient) => {
    const updated = [...patients, newPat];
    setPatients(updated);
    localStorage.setItem('brevemente_patients', JSON.stringify(updated));
  };

  const handleUpdatePatient = (updatedPat: Patient) => {
    const updated = patients.map(p => p.id === updatedPat.id ? updatedPat : p);
    setPatients(updated);
    localStorage.setItem('brevemente_patients', JSON.stringify(updated));
  };

  const handleAddAppointment = (newApp: Appointment) => {
    const updated = [...appointments, newApp];
    setAppointments(updated);
    localStorage.setItem('brevemente_appointments', JSON.stringify(updated));
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
                          />
                        ) : (
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
                          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-xs text-slate-650 space-y-4">
                            <h3 className="text-sm font-bold text-clinical-dark border-b border-slate-100 pb-2">Configuración General de BreveMente</h3>
                            <p>Configuración de consultorios, firmas digitales criptográficas y parámetros del motor de protocolos.</p>
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-clinical-accent">
                              Esta sección es una simulación. En producción se podrán configurar integraciones, bases de datos y APIs.
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
