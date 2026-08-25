import React from 'react';
import { Shield, User, ChevronDown, Check } from 'lucide-react';
import { Role } from '../types/clinical';

interface HeaderProps {
  currentRole: Role;
  onChangeRole: (role: Role) => void;
  userName: string;
  onStartDemo: () => void;
}

const ROLES_INFO: Record<Role, { name: string; color: string }> = {
  admin_platform: { name: 'Administrador de Plataforma', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  admin_clinical: { name: 'Administrador Clínico', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  therapist: { name: 'Dr. / Terapeuta', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  assistant: { name: 'Asistente Clínico', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  supervisor: { name: 'Supervisor Clínico', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  patient: { name: 'Paciente (Simulador)', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  student: { name: 'Alumno (En Formación)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  academic_coordinator: { name: 'Coordinador Académico', color: 'bg-amber-100 text-amber-800 border-amber-200' }
};

export const Header: React.FC<HeaderProps> = ({ currentRole, onChangeRole, userName, onStartDemo }) => {
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);

  const rolesList: { value: Role; label: string }[] = [
    { value: 'therapist', label: 'Terapeuta (Especialista)' },
    { value: 'assistant', label: 'Asistente / Secretaria' },
    { value: 'supervisor', label: 'Supervisor Clínico' },
    { value: 'student', label: 'Alumno (En Formación)' },
    { value: 'academic_coordinator', label: 'Coordinador Académico' },
    { value: 'admin_clinical', label: 'Administrador Clínico' },
    { value: 'admin_platform', label: 'Administrador Plataforma' },
    { value: 'patient', label: 'Paciente (Vistas de Ingreso)' }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none relative z-40">
      {/* Sección Izquierda - Alerta de Confidencialidad */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          Dato Clínico Sensible. Acceso Auditado.
        </div>
      </div>

      {/* Sección Derecha - Selector de Roles y Usuario */}
      <div className="flex items-center gap-4">
        {/* Botón Iniciar Demo */}
        <button
          onClick={onStartDemo}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg text-xs font-bold shadow-sm transition-all"
        >
          ▶ Iniciar demo
        </button>

        {/* Selector de Roles Discreto (Para demostración) */}
        <div className="relative" data-tour="demo-roles">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <span className="text-[10px] text-slate-400 font-bold uppercase">Demo Rol:</span>
            <span className="text-clinical-dark font-medium">{ROLES_INFO[currentRole].name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cambiar Vista de Demostración
                </div>
                {rolesList.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => {
                      onChangeRole(role.value);
                      setShowRoleDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left font-semibold text-slate-700 transition-colors"
                  >
                    <span>{role.label}</span>
                    {currentRole === role.value && (
                      <Check className="w-3.5 h-3.5 text-clinical-accent" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Separador */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Info del Profesional */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="text-xs font-bold text-clinical-dark block">{userName}</span>
            <span className={`text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase ${ROLES_INFO[currentRole].color}`}>
              {ROLES_INFO[currentRole].name}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-clinical-accent/10 border border-clinical-accent/20 flex items-center justify-center text-clinical-accent font-bold text-sm">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
