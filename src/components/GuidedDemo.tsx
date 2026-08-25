import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, X, RotateCcw } from 'lucide-react';
import { Role } from '../types/clinical';
import { EXECUTIVE_TOUR, CLINICAL_TOUR, ACADEMIC_TOUR } from '../services/demoTours';
import { demoStateService } from '../services/demoStateService';

interface GuidedDemoProps {
  activeTour: 'executiva' | 'clinica' | 'academic' | 'none';
  currentStep: number;
  onChangeStep: (step: number) => void;
  onCloseTour: () => void;
  userRole: Role;
  onChangeRole: (role: Role) => void;
}

export const GuidedDemo: React.FC<GuidedDemoProps> = ({
  activeTour,
  currentStep,
  onChangeStep,
  onCloseTour,
  userRole,
  onChangeRole
}) => {
  const navigate = useNavigate();

  // Todos los Hooks deben estar definidos de forma incondicional al inicio del componente
  const tourSteps = activeTour === 'executiva' 
    ? EXECUTIVE_TOUR 
    : activeTour === 'academic' 
    ? ACADEMIC_TOUR 
    : CLINICAL_TOUR;
  const activeStepObj = tourSteps.find(s => s.stepIndex === currentStep);

  // Efecto 1: Navegación de rutas y ajuste de roles automático para la demo
  useEffect(() => {
    if (activeTour === 'none' || !activeStepObj) return;

    // Redirección de ruta si no coincide
    const currentHash = window.location.hash.replace('#', '');
    const cleanRoute = activeStepObj.route.split('?')[0];
    const currentClean = currentHash.split('?')[0];

    if (currentClean !== cleanRoute && activeStepObj.route !== '/intake') {
      navigate(activeStepObj.route);
    } else if (activeStepObj.route.includes('/intake')) {
      navigate(activeStepObj.route);
    }

    // Ajuste de roles automatizado en pasos específicos para la fluidez
    if (activeTour === 'clinica') {
      if (currentStep === 6 && userRole !== 'patient') {
        onChangeRole('patient');
      } else if (currentStep === 7 && userRole !== 'therapist') {
        onChangeRole('therapist');
      }
    } else if (activeTour === 'academic') {
      if (currentStep === 1 && userRole !== 'student') {
        onChangeRole('student');
      } else if (currentStep === 7 && userRole !== 'supervisor') {
        onChangeRole('supervisor');
      } else if (currentStep === 11 && userRole !== 'academic_coordinator') {
        onChangeRole('academic_coordinator');
      }
    }
  }, [activeStepObj, currentStep, activeTour, navigate, onChangeRole, userRole]);

  // Efecto 2: Resaltado visual en el DOM del elemento objetivo
  useEffect(() => {
    if (activeTour === 'none' || !activeStepObj) return;

    // Esperar a que la página cargue el DOM
    const timer = setTimeout(() => {
      const target = document.querySelector(activeStepObj.targetSelector) as HTMLElement;
      if (target) {
        target.classList.add('ring-4', 'ring-[#75AFBC]', 'ring-offset-2', 'relative', 'z-50', 'transition-all');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);

    return () => {
      if (activeStepObj) {
        const target = document.querySelector(activeStepObj.targetSelector) as HTMLElement;
        if (target) {
          target.classList.remove('ring-4', 'ring-[#75AFBC]', 'ring-offset-2', 'relative', 'z-50', 'transition-all');
        }
      }
    };
  }, [activeStepObj, currentStep, activeTour]);

  // Retornos condicionales de renderizado (permitidos por React después de declarar los hooks)
  if (activeTour === 'none') return null;
  if (!activeStepObj) return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length) {
      onChangeStep(currentStep + 1);
    } else {
      // Finalizar
      alert('Has finalizado la Demo Guiada con éxito. Puedes continuar explorando libremente.');
      onCloseTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      onChangeStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    if (confirm('¿Deseas reiniciar el recorrido y restaurar todos los datos simulados a su estado original?')) {
      demoStateService.restoreToInitialState();
      onChangeStep(1);
      onChangeRole('therapist');
    }
  };

  return (
    <>
      {/* Backdrop oscuro selectivo (Z-index 45) */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-40 pointer-events-none" />

      {/* Tarjeta Contextual de la Demo (Flotante) */}
      <div className="fixed bottom-6 left-6 z-[100] w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-2xl p-5 space-y-4 animate-slideIn">
        {/* Header Tarjeta */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-[#75AFBC] p-1 rounded-md text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Demo: {activeTour === 'executiva' ? 'Ejecutiva' : activeTour === 'academic' ? 'Formación y Supervisión' : 'Clínica'}
              </span>
              <span className="text-xs font-bold text-clinical-dark block">
                Paso {currentStep} de {tourSteps.length}
              </span>
            </div>
          </div>
          <button 
            onClick={onCloseTour}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="Cerrar Demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explicación Narrada por Senda */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            {/* Isotipo cerebral mini */}
            <svg viewBox="0 0 100 100" fill="none" className="h-6 w-6 shrink-0 text-[#75AFBC] mt-0.5 animate-pulse">
              <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M50 20C33.4315 20 20 33.4315 20 50C20 62 28 72 38 77" stroke="#304768" strokeWidth="6" strokeLinecap="round" />
              <path d="M50 20C66.5685 20 80 33.4315 80 50C80 62 72 72 62 77" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="50" r="6" fill="#304768" />
            </svg>
            <div>
              <span className="text-[10px] font-bold text-[#75AFBC] uppercase tracking-wider block">Senda dice:</span>
              <span className="text-[11px] font-bold text-clinical-dark block mt-0.5">{activeStepObj.title}</span>
              <p className="text-slate-600 text-xs mt-1 leading-normal font-medium">
                {activeStepObj.explanation}
              </p>
            </div>
          </div>

          {/* Beneficio destacado */}
          <div className="bg-[#75AFBC]/10 border-l-4 border-[#75AFBC] p-2.5 rounded-r-lg text-[10px] text-clinical-dark flex items-start gap-2">
            <span className="font-bold shrink-0">Valor comercial:</span>
            <p className="font-semibold">{activeStepObj.benefit}</p>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 font-semibold p-1.5 transition-colors"
            title="Reiniciar y restaurar datos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 rounded-lg font-bold text-slate-650 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Atrás
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#75AFBC] hover:bg-[#6099a5] text-white rounded-lg font-bold shadow-sm transition-colors"
            >
              {currentStep === tourSteps.length ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
