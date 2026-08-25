import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Trash2, Calendar, FileClock, ShieldCheck, AlertOctagon } from 'lucide-react';
import { Role, AuditLog, RiskAlert } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';
import { riskSimulationService } from '../services/riskSimulationService';

interface SecurityAuditProps {
  userRole: Role;
  userName: string;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({ userRole, userName }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadData = () => {
    setLogs(auditLogService.getLogs());
    setAlerts(riskSimulationService.getAlerts());
  };

  useEffect(() => {
    loadData();
    
    // Escuchar eventos en vivo de nuevos logs o alertas
    const handleLogAdded = () => loadData();
    window.addEventListener('brevemente_audit_log_added', handleLogAdded);
    window.addEventListener('brevemente_risk_alert_added', handleLogAdded);
    
    return () => {
      window.removeEventListener('brevemente_audit_log_added', handleLogAdded);
      window.removeEventListener('brevemente_risk_alert_added', handleLogAdded);
    };
  }, []);

  const handleClearLogs = () => {
    if (confirm('¿Está seguro de que desea vaciar la bitácora de auditoría histórica? Esta acción quedará registrada.')) {
      auditLogService.clearLogs();
      auditLogService.addLog(
        'Vaciado de Auditoría',
        'Se purgó de forma voluntaria el historial de logs de auditoría',
        'seguridad',
        { id: 'user-current', name: userName, role: userRole }
      );
      loadData();
    }
  };

  const handleResolveAlert = (alertId: string) => {
    riskSimulationService.resolveAlert(alertId, { id: 'supervisor-1', name: userName, role: userRole });
    loadData();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Auditoría y Seguridad Clínica</h2>
          <p className="text-xs text-clinical-textMuted">
            Monitoreo en tiempo real de accesos, consentimiento legal, uso de IA y alertas de riesgo crítico.
          </p>
        </div>
        
        {userRole === 'admin_platform' && (
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vaciar Bitácora
          </button>
        )}
      </div>

      {/* Sección Alertas de Riesgo Crítico Activas */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600 animate-bounce" />
            <span className="text-xs font-bold text-red-800 uppercase tracking-wide">
              Alertas de Riesgo Activas (Escaladas a Supervisor)
            </span>
          </div>

          <div className="divide-y divide-red-100 bg-white border border-red-150 rounded-lg overflow-hidden text-xs">
            {activeAlerts.map(a => (
              <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-clinical-dark text-xs block">
                    Paciente: {a.patientName} (Escalado hace: {new Date(a.timestamp).toLocaleTimeString()})
                  </span>
                  <p className="text-red-700 leading-normal font-medium">{a.message}</p>
                  <span className="text-[10px] text-slate-400 block">{a.note}</span>
                </div>

                {['supervisor', 'admin_clinical', 'therapist'].includes(userRole) && (
                  <button
                    onClick={() => handleResolveAlert(a.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow shrink-0 transition-colors"
                  >
                    Marcar como Atendido
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid del Log y Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col text-xs text-slate-600">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileClock className="w-4 h-4 text-clinical-accent" />
            <h3 className="font-bold text-clinical-dark uppercase">Bitácora General de Trazabilidad</h3>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por usuario o acción..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas las Categorías</option>
              <option value="expediente">Expediente</option>
              <option value="sesion">Sesión</option>
              <option value="ia">Asistencia IA</option>
              <option value="reporte">Reportes</option>
              <option value="seguridad">Seguridad y Firma</option>
              <option value="riesgo">Riesgo Clínico</option>
            </select>
          </div>
        </div>

        {/* Tabla Logs */}
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[450px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No hay logs registrados con los criterios seleccionados.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const catColors: Record<AuditLog['category'], string> = {
                expediente: 'bg-blue-50 text-blue-700 border-blue-150',
                sesion: 'bg-slate-100 text-slate-700 border-slate-200',
                ia: 'bg-teal-50 text-clinical-teal border-teal-150',
                reporte: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                seguridad: 'bg-purple-50 text-purple-700 border-purple-150',
                riesgo: 'bg-red-50 text-red-700 border-red-150'
              };
              
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-clinical-dark">{log.userName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 border bg-slate-100 rounded text-slate-400 font-bold uppercase">
                        {log.role.replace('_', ' ')}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className={`px-2 py-0.5 border rounded-[4px] font-bold text-[9px] uppercase ${catColors[log.category]}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium leading-normal">{log.details}</p>
                  </div>
                  
                  <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                    {new Date(log.timestamp).toLocaleString('es-MX')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
