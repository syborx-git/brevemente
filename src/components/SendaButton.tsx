import React from 'react';

interface SendaButtonProps {
  onClick: () => void;
  hasNotification?: boolean;
}

export const SendaButton: React.FC<SendaButtonProps> = ({ onClick, hasNotification = false }) => {
  return (
    <div className="fixed bottom-6 right-6 z-40" data-tour="brifi-widget">
      {/* Tooltip */}
      <div className="absolute right-0 bottom-14 bg-clinical-dark text-white text-[10px] font-bold py-1 px-2.5 rounded-md shadow-lg opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-slate-700">
        Pregúntale a Senda
      </div>

      <button
        onClick={onClick}
        className="bg-[#75AFBC] hover:bg-[#6099a5] text-white p-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group relative border border-teal-300/30"
      >
        {/* Isotipo cerebral */}
        <svg viewBox="0 0 100 100" fill="none" className="h-6 w-6 shrink-0 text-white animate-pulse">
          <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M50 20C33.4315 20 20 33.4315 20 50C20 62 28 72 38 77" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 20C66.5685 20 80 33.4315 80 50C80 62 72 72 62 77" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
        </svg>

        <span className="hidden sm:inline font-bold text-xs tracking-wider pr-1">Senda</span>

        {/* Notificación pendiente */}
        {hasNotification && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};
