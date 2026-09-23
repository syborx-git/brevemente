import React, { useState } from 'react';

interface LogoProps {
  type: 'horizontal-claro' | 'horizontal-oscuro' | 'vertical' | 'brain' | 'favicon';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ type, className = 'h-8' }) => {
  const [hasError, setHasError] = useState(false);

  // NOTA: Rutas oficiales de assets para sustitución posterior
  const logoSrcs = {
    'horizontal-claro': '/assets/logos/logo-horizontal-claro.png',
    'horizontal-oscuro': '/assets/logos/logo-horizontal-oscuro.png',
    'vertical': '/assets/logos/logo-vertical.png',
    'brain': '/assets/logos/logo-brain.png',
    'favicon': '/assets/logos/favicon.ico'
  };

  const handleImgError = () => {
    setHasError(true);
  };

  if (hasError) {
    // FALLBACK FIEL SVG EN CASO DE AUSENCIA DE ARCHIVOS FÍSICOS (TEMPORAL)
    // Símbolo Cerebral + Letras de Identidad
    if (type === 'brain' || type === 'favicon') {
      return (
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={className}
        >
          {/* Isotipo cerebral oficial (Hemisferio lógico y creativo con sinapsis) */}
          <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" fill="#75AFBC" fillOpacity="0.2" />
          <path d="M50 20C33.4315 20 20 33.4315 20 50C20 62 28 72 38 77" stroke="#304768" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 20C66.5685 20 80 33.4315 80 50C80 62 72 72 62 77" stroke="#75AFBC" strokeWidth="4" strokeLinecap="round" />
          {/* Conexión central (Sinapsis) */}
          <path d="M50 25V75" stroke="#304768" strokeWidth="3" strokeDasharray="3 3" />
          <circle cx="50" cy="35" r="4" fill="#75AFBC" />
          <circle cx="50" cy="50" r="4" fill="#304768" />
          <circle cx="50" cy="65" r="4" fill="#75AFBC" />
        </svg>
      );
    }

    const isDarkBg = type === 'horizontal-oscuro';
    const primaryColor = isDarkBg ? '#FFFFFF' : '#304768';
    const accentColor = '#75AFBC';

    return (
      <div className={`flex items-center gap-2 font-sans select-none ${className}`}>
        {/* Isotipo cerebral mini */}
        <svg viewBox="0 0 100 100" fill="none" className="h-6 w-6 shrink-0">
          <path d="M50 85C66.5685 85 80 71.5685 80 55C80 40.5 70 30 50 30C30 30 20 40.5 20 55C20 71.5685 33.4315 85 50 85Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M50 20C33.4315 20 20 33.4315 20 50C20 62 28 72 38 77" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
          <path d="M50 20C66.5685 20 80 33.4315 80 50C80 62 72 72 62 77" stroke={accentColor} strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="50" r="6" fill={primaryColor} />
        </svg>
        {type !== 'vertical' ? (
          <span className="font-extrabold text-sm tracking-wide shrink-0" style={{ color: primaryColor }}>
            Breve<span style={{ color: accentColor }}>Mente</span>
          </span>
        ) : (
          <div className="flex flex-col text-center">
            <span className="font-extrabold text-xs tracking-wide" style={{ color: primaryColor }}>BreveMente</span>
            <span className="text-[7px] font-bold tracking-widest uppercase" style={{ color: accentColor }}>Clínica</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <img 
      src={logoSrcs[type]} 
      alt="BreveMente Logo" 
      className={className} 
      onError={handleImgError}
    />
  );
};
