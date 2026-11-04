import React, { useState, useEffect } from 'react';
import { Save, User, Building2, Stethoscope, Settings as SettingsIcon, Check, Plus, Trash2, Star } from 'lucide-react';
import { Role, SessionDuration, TerapeutaSede } from '../types/clinical';
import { therapistSettingsService } from '../services/therapistSettingsService';
import { sedesService } from '../services/sedesService';
import { configHistorialService } from '../services/configHistorialService';

interface ConfiguracionProps {
  userRole: Role;
  userName: string;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ userRole, userName }) => {
  const [settings, setSettings] = useState(() => therapistSettingsService.getSettings());
  const [saved, setSaved] = useState(false);
  const [assignedSedes, setAssignedSedes] = useState<TerapeutaSede[]>(() => sedesService.getAssigned());
  const [nuevaSedeId, setNuevaSedeId] = useState('');
  const [savingSedes, setSavingSedes] = useState(false);
  const [historial, setHistorial] = useState(() => configHistorialService.getHistorial());
  const sedes = sedesService.getAll();

  useEffect(() => {
    setSettings(therapistSettingsService.getSettings());
  }, []);

  const sedesDisponibles = sedes.filter(s => !assignedSedes.some(as => as.id === s.id));

  const update = (patch: Partial<typeof settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      // Registrar cambios de campos simples en el historial
      Object.entries(patch).forEach(([campo, valorNuevo]) => {
        const valorAnterior = (prev as unknown as Record<string, unknown>)[campo];
        if (String(valorAnterior ?? '') !== String(valorNuevo ?? '')) {
          configHistorialService.addCambio(
            campo,
            valorAnterior == null ? null : String(valorAnterior),
            valorNuevo == null ? null : String(valorNuevo),
            userName
          );
        }
      });
      therapistSettingsService.updateSettings(patch);
      return next;
    });
    setHistorial(configHistorialService.getHistorial());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    therapistSettingsService.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const agregarSede = () => {
    if (!nuevaSedeId) return;
    const sede = sedes.find(s => s.id === nuevaSedeId);
    if (!sede || assignedSedes.some(s => s.id === sede.id)) return;
    const esPrincipal = assignedSedes.length === 0;
    const next = [...assignedSedes, { id: sede.id, nombre: sede.nombre, esPrincipal }];
    setAssignedSedes(next);
    setNuevaSedeId('');
    configHistorialService.addCambio('sedes', null, sede.nombre, userName);
    setHistorial(configHistorialService.getHistorial());
  };

  const quitarSede = (sedeId: string) => {
    const removida = assignedSedes.find(s => s.id === sedeId);
    const next = assignedSedes.filter(s => s.id !== sedeId);
    setAssignedSedes(next);
    if (removida) {
      configHistorialService.addCambio('sedes', removida.nombre, null, userName);
      setHistorial(configHistorialService.getHistorial());
    }
  };

  const marcarPrincipal = (sedeId: string) => {
    const next = assignedSedes.map(s => ({ ...s, esPrincipal: s.id === sedeId }));
    setAssignedSedes(next);
    const sede = assignedSedes.find(s => s.id === sedeId);
    if (sede) {
      configHistorialService.addCambio('sede principal', null, sede.nombre, userName);
      setHistorial(configHistorialService.getHistorial());
    }
  };

  const guardarSedes = () => {
    setSavingSedes(true);
    sedesService.saveAssigned(assignedSedes);
    setTimeout(() => {
      setSavingSedes(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 400);
  };

  const etiquetaCampo = (campo: string): string => {
    const map: Record<string, string> = {
      therapistName: 'Nombre del terapeuta',
      license: 'Cédula profesional',
      specialty: 'Especialidad',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      defaultSessionDuration: 'Duración por defecto',
      costoPrimeraSesion: 'Costo primera sesión',
      costoSeguimiento: 'Costo seguimiento',
      edadMinimaAtencion: 'Edad mínima de atención',
      consultorioDefault: 'Consultorio por defecto',
      firmaDigitalHabilitada: 'Firma digital',
      sedes: 'Sedes de atención',
      'sede principal': 'Sede principal'
    };
    return map[campo] ?? campo;
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs text-slate-600">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <SettingsIcon className="w-5 h-5 text-clinical-accent" />
          <h2 className="text-sm font-bold text-clinical-dark">Configuración General de BreveMente</h2>
        </div>
        <p className="text-slate-400">Parámetros del terapeuta, tarifas y resguardo legal. Los cambios se persisten en almacenamiento local de la demo.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
        {/* Datos profesionales */}
        <div className="space-y-4">
          <span className="font-bold text-clinical-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-clinical-accent" /> Datos Profesionales
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nombre del terapeuta:</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.therapistName} onChange={(e) => update({ therapistName: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Cédula profesional:</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.license} onChange={(e) => update({ license: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Especialidad:</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.specialty} onChange={(e) => update({ specialty: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Correo electrónico:</label>
              <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.email} onChange={(e) => update({ email: e.target.value })} />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Teléfono:</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Tarifas y duración */}
        <div className="space-y-4">
          <span className="font-bold text-clinical-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Stethoscope className="w-4 h-4 text-clinical-accent" /> Tarifas y Duración de Sesión
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Duración por defecto (min):</label>
              <select className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none" value={settings.defaultSessionDuration} onChange={(e) => update({ defaultSessionDuration: Number(e.target.value) as SessionDuration })}>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Costo primera sesión (MXN):</label>
              <input type="number" min={0} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.costoPrimeraSesion} onChange={(e) => update({ costoPrimeraSesion: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Costo seguimiento (MXN):</label>
              <input type="number" min={0} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.costoSeguimiento} onChange={(e) => update({ costoSeguimiento: Number(e.target.value) || 0 })} />
            </div>
          </div>
        </div>

        {/* Criterio clínico y resguardo legal */}
        <div className="space-y-4">
          <span className="font-bold text-clinical-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <SettingsIcon className="w-4 h-4 text-clinical-accent" /> Criterio Clínico y Resguardo Legal
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Edad mínima de atención (años):</label>
              <input type="number" min={0} max={99} className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.edadMinimaAtencion} onChange={(e) => update({ edadMinimaAtencion: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Consultorio por defecto:</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-accent" value={settings.consultorioDefault ?? ''} onChange={(e) => update({ consultorioDefault: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" className="accent-clinical-accent" checked={settings.firmaDigitalHabilitada ?? true} onChange={(e) => update({ firmaDigitalHabilitada: e.target.checked })} />
              <span className="font-semibold text-slate-600">Firma digital habilitada</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          {saved && <span className="flex items-center gap-1 text-emerald-600 font-bold"><Check className="w-4 h-4" /> Guardado</span>}
          <button type="submit" className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>
      </form>

      {/* Sedes de Atención (editables) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <span className="font-bold text-clinical-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-clinical-accent" /> Sedes de Atención
        </span>
        <p className="text-slate-400 text-[11px]">Catálogo disponible (lectura): {sedes.map(s => s.nombre).join(' · ')}</p>

        {assignedSedes.length === 0 && (
          <p className="text-slate-400 italic text-[11px]">Sin sedes asignadas. Agrega al menos una sede de atención.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {assignedSedes.map(sede => (
            <div
              key={sede.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${sede.esPrincipal ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
            >
              <span className="font-semibold text-slate-700">{sede.nombre}</span>
              {sede.esPrincipal && <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5"><Star className="w-3 h-3" />PRINCIPAL</span>}
              {!sede.esPrincipal && (
                <button onClick={() => marcarPrincipal(sede.id)} className="text-[10px] font-semibold text-clinical-accent hover:underline">
                  Marcar principal
                </button>
              )}
              <button onClick={() => quitarSede(sede.id)} className="text-[10px] font-semibold text-red-500 hover:underline flex items-center gap-0.5">
                <Trash2 className="w-3 h-3" /> Quitar
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Agregar sede</label>
            <select value={nuevaSedeId} onChange={(e) => setNuevaSedeId(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
              <option value="">Selecciona…</option>
              {sedesDisponibles.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <button type="button" onClick={agregarSede} disabled={!nuevaSedeId} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
          <button type="button" onClick={guardarSedes} disabled={savingSedes} className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {savingSedes ? 'Guardando…' : 'Guardar Sedes'}
          </button>
        </div>
      </div>

      {/* Historial de Cambios */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <span className="font-bold text-clinical-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <SettingsIcon className="w-4 h-4 text-clinical-accent" /> Historial de Cambios
        </span>
        {historial.length === 0 && <p className="text-slate-400 italic text-[11px]">Aún no hay cambios registrados.</p>}
        {historial.length > 0 && (
          <ul className="space-y-2">
            {historial.map(h => (
              <li key={h.id} className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-700">{etiquetaCampo(h.campo)}</div>
                  <div className="text-[11px] text-slate-500">
                    <span className="line-through text-red-400">{h.valorAnterior ?? '—'}</span>
                    <span className="mx-1">→</span>
                    <span className="font-semibold text-emerald-600">{h.valorNuevo ?? '—'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-semibold text-slate-600">{h.usuarioNombre || 'Sistema'}</div>
                  <div className="text-[10px] text-slate-400">{new Date(h.fecha).toLocaleString('es-MX')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
