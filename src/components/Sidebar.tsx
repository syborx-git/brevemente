import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, Calendar, FolderHeart, MessageSquareCode, 
  BookOpen, FileText, Eye, BarChart3, ShieldAlert, 
  Settings, LogOut, Activity, GraduationCap 
} from 'lucide-react';
import { Role } from '../types/clinical';
import { Logo } from './Logo';

interface SidebarProps {
  userRole: Role;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, onLogout }) => {
  const getPracticeLabel = (role: Role): string => {
    if (role === 'supervisor') return 'Mi Supervisión';
    if (role === 'admin_clinical') return 'Mi Operación';
    if (role === 'admin_platform') return 'Operación Clínica';
    return 'Mi Consulta';
  };

  const sections = [
    {
      title: 'INICIO',
      items: [
        { path: '/', label: 'Panel Principal', icon: Home, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'academic_coordinator'] },
        { path: '/mi-consulta', label: getPracticeLabel(userRole), icon: Activity, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] }
      ]
    },
    {
      title: 'OPERACIÓN CLÍNICA',
      items: [
        { path: '/pacientes', label: 'Pacientes', icon: Users, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/agenda', label: 'Agenda', icon: Calendar, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'patient'] },
        { path: '/expedientes', label: 'Expedientes', icon: FolderHeart, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] },
        { path: '/biblioteca', label: 'Biblioteca Clínica', icon: BookOpen, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'] },
        { path: '/senda', label: 'Senda', subtitle: 'Inteligencia asistiva', icon: MessageSquareCode, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'] }
      ]
    },
    {
      title: 'FORMACIÓN Y DESARROLLO',
      items: [
        { path: '/campus', label: 'Campus BreveMente', icon: GraduationCap, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'] },
        { path: '/desempeno', label: 'Mi Desarrollo Profesional', icon: BarChart3, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student', 'academic_coordinator'] }
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { path: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'academic_coordinator'] },
        { path: '/auditoria', label: 'Auditoría y Seguridad', icon: ShieldAlert, roles: ['admin_platform', 'admin_clinical', 'supervisor', 'academic_coordinator'] }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-clinical-dark text-white flex flex-col shrink-0 h-screen shadow-lg border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-center">
        <Logo type="horizontal-oscuro" className="h-10" />
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {sections.map((section, sIdx) => {
          // Filtrar items visibles en esta sección
          const visibleItems = section.items.filter(item => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-3">
                {section.title}
              </span>
              <nav className="space-y-1">
                {visibleItems.map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-semibold text-xs leading-normal ${
                        isActive
                          ? 'bg-[#75AFBC] text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-bold">{item.label}</span>
                      {'subtitle' in item && (
                        <span className="text-[8px] text-slate-500 font-medium block mt-0.5 group-hover:text-slate-300">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </NavLink>
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-semibold text-xs text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
