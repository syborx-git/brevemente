import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, Calendar, FolderHeart, MessageSquareCode, 
  BookOpen, FileText, Eye, BarChart3, ShieldAlert, 
  Settings, LogOut, Activity, GraduationCap, ArrowRightLeft, Check, X 
} from 'lucide-react';
import { Role, CounterReferral } from '../types/clinical';
import { Logo } from './Logo';
import { counterReferralService, COUNTER_REFERRAL_CHANGED } from '../services/counterReferralService';
import { patientService } from '../services/patientService';

interface SidebarProps {
  userRole: Role;
  userName: string;
  currentTherapistId?: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, userName, currentTherapistId, onLogout }) => {
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
        { path: '/', label: 'Panel Principal', icon: Home, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/mi-consulta', label: getPracticeLabel(userRole), icon: Activity, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] }
      ]
    },
    {
      title: 'OPERACIÓN CLÍNICA',
      items: [
        { path: '/pacientes', label: 'Pacientes', icon: Users, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/agenda', label: 'Agenda', icon: Calendar, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor', 'patient'] },
        { path: '/expedientes', label: 'Expedientes', icon: FolderHeart, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor'] },
        { path: '/biblioteca', label: 'Biblioteca Clínica', icon: BookOpen, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] },
        { path: '/leva', label: 'LEVA', subtitle: 'Inteligencia asistiva', icon: MessageSquareCode, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] }
      ]
    },
    {
      title: 'FORMACIÓN Y DESARROLLO',
      items: [
        { path: '/campus', label: 'Campus BreveMente', icon: GraduationCap, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] },
        { path: '/desempeno', label: 'Mi Desarrollo Profesional', icon: BarChart3, roles: ['admin_platform', 'admin_clinical', 'therapist', 'supervisor', 'student'] }
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { path: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin_platform', 'admin_clinical', 'therapist', 'assistant', 'supervisor'] },
        { path: '/auditoria', label: 'Auditoría y Seguridad', icon: ShieldAlert, roles: ['admin_platform', 'admin_clinical', 'supervisor'] }
      ]
    }
  ];

  // ── Inbox de contra-referencias ─────────────────────────────────────────────
  const [showInbox, setShowInbox] = useState(false);
  const [incomingReferrals, setIncomingReferrals] = useState<CounterReferral[]>([]);

  const canSeeInbox = ['therapist', 'admin_clinical', 'admin_platform', 'supervisor'].includes(userRole);

  useEffect(() => {
    const refresh = () => setIncomingReferrals(counterReferralService.getIncomingForRole(userRole, currentTherapistId));
    refresh();
    window.addEventListener(COUNTER_REFERRAL_CHANGED, refresh);
    return () => window.removeEventListener(COUNTER_REFERRAL_CHANGED, refresh);
  }, [userRole, currentTherapistId]);

  const handleAcceptReferral = async (ref: CounterReferral) => {
    await counterReferralService.resolve(ref.id, 'aceptada', { id: 'user-current', name: userName, role: userRole });
    // Push simulado por WhatsApp con los detalles del nuevo terapeuta
    const patient = await patientService.getById(ref.patientId);
    const phoneDigits = (patient?.phone || '').replace(/\D/g, '');
    if (phoneDigits) {
      const message = `Hola ${ref.patientName}, te informamos desde BreveMente que tu contra-referencia fue aprobada ✅. Tu nuevo terapeuta es ${ref.toTherapistName}. Pronto nos pondremos en contacto para agendar tu primera cita.`;
      window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleRejectReferral = async (ref: CounterReferral) => {
    if (!confirm(`¿Declinar la contra-referencia de ${ref.patientName} solicitada por ${ref.fromTherapistName}?`)) return;
    await counterReferralService.resolve(ref.id, 'rechazada', { id: 'user-current', name: userName, role: userRole });
  };

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

      {/* Inbox de Contra-referencias */}
      {canSeeInbox && (
        <div className="px-4 pb-3 shrink-0">
          <button
            onClick={() => setShowInbox(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-semibold text-xs text-left"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span className="font-bold flex-1">Contra-referencias</span>
            {incomingReferrals.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {incomingReferrals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Panel de solicitudes entrantes */}
      {showInbox && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowInbox(false)}>
          <div
            className="h-full w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slideInRight text-xs text-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-clinical-dark p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-clinical-accent" />
                <div>
                  <h3 className="font-bold">Contra-referencias entrantes</h3>
                  <span className="text-[9px] text-slate-300 block">Solicitudes dirigidas a ti</span>
                </div>
              </div>
              <button onClick={() => setShowInbox(false)} className="text-slate-300 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {incomingReferrals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-500">Sin solicitudes pendientes.</p>
                </div>
              ) : (
                incomingReferrals.map((ref) => (
                  <div key={ref.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-clinical-dark">{ref.patientName}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">Solicitada</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      De <b className="text-slate-700">{ref.fromTherapistName}</b> → <b className="text-slate-700">{ref.toTherapistName}</b>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-bold text-slate-500">Motivo: </span>{ref.reason}
                    </p>
                    {ref.clinicalSummary && (
                      <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">"{ref.clinicalSummary}"</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptReferral(ref)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button
                        onClick={() => handleRejectReferral(ref)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg font-bold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Declinar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
