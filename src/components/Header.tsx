import React from "react";
import { Shield, User, ChevronDown, Check } from "lucide-react";
import { Role, Patient } from "../types/clinical";

interface HeaderProps {
  currentRole: Role;
  onChangeRole: (role: Role) => void;
  userName: string;
  onStartDemo: () => void;
  patients?: Patient[];
  currentPatientId?: string;
  onChangePatient?: (patientId: string) => void;
}

const ROLES_INFO: Record<Role, { name: string; color: string }> = {
  admin_platform: { name: "Administrador de Plataforma", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  admin_clinical: { name: "Administrador Clinico", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  therapist: { name: "Dr. / Terapeuta", color: "bg-blue-100 text-blue-800 border-blue-200" },
  assistant: { name: "Asistente Clinico", color: "bg-orange-100 text-orange-800 border-orange-200" },
  supervisor: { name: "Supervisor Clinico", color: "bg-purple-100 text-purple-800 border-purple-200" },
  patient: { name: "Paciente (Simulador)", color: "bg-slate-100 text-slate-800 border-slate-200" },
  student: { name: "Alumno (En Formacion)", color: "bg-teal-100 text-teal-800 border-teal-200" },
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  userName,
  onStartDemo,
  patients = [],
  currentPatientId,
  onChangePatient,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = React.useState(false);

  const rolesList: { value: Role; label: string }[] = [
    { value: "therapist", label: "Terapeuta (Especialista)" },
    { value: "assistant", label: "Asistente / Secretaria" },
    { value: "supervisor", label: "Supervisor Clinico" },
    { value: "student", label: "Alumno (En Formacion)" },
    { value: "admin_clinical", label: "Administrador Clinico" },
    { value: "admin_platform", label: "Administrador Plataforma" },
    { value: "patient", label: "Paciente (Vistas de Ingreso)" },
  ];

  const currentPatient = patients.find((p) => p.id === currentPatientId);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none relative z-40">
      {/* Seccion Izquierda */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          Dato Clinico Sensible. Acceso Auditado.
        </div>
      </div>

      {/* Seccion Derecha */}
      <div className="flex items-center gap-4">
        {/* Boton Iniciar Demo */}
        <button
          onClick={onStartDemo}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg text-xs font-bold shadow-sm transition-all"
        >
          Iniciar demo
        </button>

        {/* Selector de Paciente - solo visible en rol patient */}
        {currentRole === "patient" && patients.length > 0 && onChangePatient && (
          <div className="relative" data-tour="demo-patient">
            <button
              onClick={() => setShowPatientDropdown(!showPatientDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#25D366]/40 bg-green-50 hover:bg-green-100 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <span className="text-[10px] text-green-700 font-bold uppercase">Simulando:</span>
              <span className="text-slate-800 font-medium">
                {currentPatient?.name ?? "Seleccionar paciente"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPatientDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPatientDropdown(false)} />
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ver portal como paciente
                  </div>
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onChangePatient(p.id);
                        setShowPatientDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left font-semibold text-slate-700 transition-colors"
                    >
                      <div>
                        <span className="block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {p.status} &middot; {p.therapistName}
                        </span>
                      </div>
                      {currentPatientId === p.id && (
                        <Check className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Selector de Roles */}
        <div className="relative" data-tour="demo-roles">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <span className="text-[10px] text-slate-400 font-bold uppercase">Demo Rol:</span>
            <span className="text-slate-800 font-medium">{ROLES_INFO[currentRole].name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cambiar Vista de Demostracion
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
                      <Check className="w-3.5 h-3.5 text-[#75AFBC]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Separador */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Info del usuario */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block">{userName}</span>
            <span className={`text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase ${ROLES_INFO[currentRole].color}`}>
              {ROLES_INFO[currentRole].name}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#75AFBC]/10 border border-[#75AFBC]/20 flex items-center justify-center text-[#75AFBC] font-bold text-sm">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
