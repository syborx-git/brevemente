import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, FolderHeart, MessageSquare, ShieldAlert } from 'lucide-react';
import { Patient, Role } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';

interface PatientsProps {
  userRole: Role;
  patients: Patient[];
  userName: string;
}

export const Patients: React.FC<PatientsProps> = ({ userRole, patients, userName }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenRecord = (patientId: string, patientName: string) => {
    // Registrar en auditoría
    auditLogService.addLog(
      'Acceso a expediente',
      `Accedió al expediente de ${patientName} desde la sección de directorio de pacientes`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );
    navigate(`/expedientes?id=${patientId}`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Directorio de Pacientes</h2>
          <p className="text-xs text-clinical-textMuted">
            Búsqueda de expedientes, estados de tratamiento y niveles de riesgo clínico.
          </p>
        </div>
        
        {['admin_platform', 'admin_clinical', 'therapist', 'assistant'].includes(userRole) && (
          <button
            onClick={() => navigate('/agenda')}
            className="flex items-center gap-1.5 px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Crear Paciente
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CURP, correo o teléfono..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-clinical-accent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Listado de Pacientes */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                <th className="p-4">Nombre Paciente</th>
                <th className="p-4">CURP / Folio</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Registro</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Riesgo</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron pacientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const riskColor = 
                    p.riskLevel === 'alto' ? 'bg-red-100 text-red-800 border-red-200' :
                    p.riskLevel === 'medio' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                    'bg-green-100 text-green-800 border-green-200';

                  const statusColor = 
                    p.status === 'activo' ? 'bg-blue-100 text-blue-800' :
                    p.status === 'completado' ? 'bg-teal-100 text-teal-800' :
                    p.status === 'archivado' ? 'bg-slate-100 text-slate-800' :
                    'bg-amber-100 text-amber-800';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-clinical-dark">
                        {p.name}
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-500">
                        {p.curp}
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="block">{p.phone}</span>
                          <span className="block text-slate-400 text-[10px]">{p.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        {p.registrationDate}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${riskColor}`}>
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'pendiente' ? (
                            <button
                              onClick={() => navigate(`/intake?id=${p.id}`)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded font-semibold transition-colors flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Simular WhatsApp
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRecord(p.id, p.name)}
                              className="px-2.5 py-1 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded font-semibold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <FolderHeart className="w-3.5 h-3.5" />
                              Ver Expediente
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
