import { Sparkles, Play, Compass, ShieldAlert, Award, GraduationCap } from 'lucide-react';
import { Logo } from './Logo';

interface DemoLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: (tourType: 'executiva' | 'clinica' | 'academic' | 'none') => void;
}

export const DemoLauncher: React.FC<DemoLauncherProps> = ({ isOpen, onClose, onStartTour }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-scaleUp">
        {/* Banner Superior */}
        <div className="bg-clinical-dark p-6 text-white text-center space-y-3 relative">
          <div className="mx-auto w-fit bg-slate-800 p-2 rounded-xl border border-slate-700">
            <Logo type="horizontal-oscuro" className="h-10" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-wide uppercase">Portal de Demostración Comercial</h2>
            <p className="text-[10px] text-slate-300 font-semibold mt-1">
              Explora las capacidades e innovación de la plataforma BreveMente
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 text-xs text-slate-655">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900 leading-normal font-semibold">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Información Importante</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Esta plataforma es un prototipo interactivo de alta fidelidad. Todos los datos, grabaciones, análisis de IA y diagnósticos son **100% simulados y ficticios** con fines demostrativos.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-clinical-dark block text-center">¿Cómo deseas explorar BreveMente hoy?</span>
            
            <div className="grid grid-cols-1 gap-2.5">
              {/* Opción Demo Ejecutiva */}
              <button
                onClick={() => onStartTour('executiva')}
                className="w-full flex items-start gap-3 p-3.5 border-2 border-slate-100 hover:border-clinical-accent bg-slate-50 hover:bg-white rounded-xl text-left transition-all group"
              >
                <div className="bg-clinical-accent/10 text-clinical-accent p-2 rounded-lg group-hover:bg-clinical-accent group-hover:text-white transition-all shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-clinical-dark text-xs block group-hover:text-clinical-accent transition-colors">
                    Demo Ejecutiva (3–5 min)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal font-semibold">
                    Recorrido comercial de alto valor. Muestra métricas de dashboard, agenda, Senda y auditoría clínica.
                  </span>
                </div>
              </button>

              {/* Opción Demo Clínica */}
              <button
                onClick={() => onStartTour('clinica')}
                className="w-full flex items-start gap-3 p-3.5 border-2 border-slate-100 hover:border-clinical-teal bg-slate-50 hover:bg-white rounded-xl text-left transition-all group"
              >
                <div className="bg-clinical-teal/10 text-clinical-teal p-2 rounded-lg group-hover:bg-clinical-teal group-hover:text-white transition-all shrink-0">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-clinical-dark text-xs block group-hover:text-clinical-teal transition-colors">
                    Demo Clínica Completa (8–12 min)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal font-semibold">
                    Flujo clínico completo: admisión, consentimiento de grabación, sesión asistida por IA, supervisión y analíticas.
                  </span>
                </div>
              </button>

              {/* Opción Demo Formación y Supervisión */}
              <button
                onClick={() => onStartTour('academic')}
                className="w-full flex items-start gap-3 p-3.5 border-2 border-slate-100 hover:border-indigo-500 bg-slate-50 hover:bg-white rounded-xl text-left transition-all group"
              >
                <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-clinical-dark text-xs block group-hover:text-indigo-600 transition-colors">
                    Demo Formación y Supervisión (6–8 min)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal font-semibold">
                    Tercera capa estratégica: simulador con IA, actas de cohortes, visualizador de audio anotado y certificados.
                  </span>
                </div>
              </button>

              {/* Opción Explorar Libre */}
              <button
                onClick={() => onStartTour('none')}
                className="w-full flex items-start gap-3 p-3.5 border-2 border-slate-100 hover:border-slate-400 bg-slate-50 hover:bg-white rounded-xl text-left transition-all group"
              >
                <div className="bg-slate-200 text-slate-650 p-2 rounded-lg group-hover:bg-slate-350 transition-all shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-clinical-dark text-xs block font-semibold">
                    Explorar Libremente
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal font-semibold">
                    Cierra la guía y te permite hacer click, cambiar de roles y probar todas las vistas del prototipo por tu cuenta.
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
