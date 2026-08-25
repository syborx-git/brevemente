import React, { useState } from 'react';
import { FileText, Send, Paperclip, Download, ShieldCheck, HelpCircle } from 'lucide-react';
import { Role, Patient } from '../types/clinical';
import { auditLogService } from '../services/auditLogService';

interface ReportsProps {
  userRole: Role;
  patients: Patient[];
  userName: string;
}

export const Reports: React.FC<ReportsProps> = ({ userRole, patients, userName }) => {
  const [selectedPatientId, setSelectedPatientId] = useState('patient-1');
  const activePatient = patients.find(p => p.id === selectedPatientId);

  // Form states
  const [profName, setProfName] = useState(userName);
  const [license, setLicense] = useState('CED-8849302-MX');
  const [address, setAddress] = useState('Av. Universidad 402, CDMX');
  const [phone, setPhone] = useState('+52 55 9999 8888');
  const [email, setEmail] = useState('consultorio.silva@email.com');
  const [periodStart, setPeriodStart] = useState('2026-08-01');
  const [periodEnd, setPeriodEnd] = useState('2026-08-24');
  const [totalSessions, setTotalSessions] = useState(3);
  const [frequency, setFrequency] = useState('Semanal');
  const [modality, setModality] = useState('Sesiones en Línea (Videollamada)');
  const [symptoms, setSymptoms] = useState('Crisis agudas de ansiedad, agorafobia leve y evitación conductual.');
  const [evolution, setEvolution] = useState('Favorable. Disminución del 80% de crisis agudas espontáneas tras prescripciones de reestructuración paradójica (Worry Time).');
  const [recommendations, setRecommendations] = useState('Continuar exposiciones controladas autónomas y bitácoras de tareas.');
  const [placeDate, setPlaceDate] = useState('Ciudad de México, a 24 de Agosto de 2026');

  // Preview / actions simulation
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);

    // Registrar en auditoría
    auditLogService.addLog(
      'Generación de constancia',
      `Generó borrador de constancia psicoterapéutica para el paciente ${activePatient?.name}.`,
      'reporte',
      { id: 'user-current', name: userName, role: userRole }
    );
  };

  const handleDownloadPdf = () => {
    // Registrar en auditoría
    auditLogService.addLog(
      'Descarga de PDF',
      `Descargó constancia en formato PDF inmutable para el paciente ${activePatient?.name}. Acceso de impresión registrado.`,
      'reporte',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('📥 PDF descargado de forma simulada en tu dispositivo local.');
  };

  const handleSendPatient = () => {
    // Registrar en auditoría
    auditLogService.addLog(
      'Envío de constancia',
      `Envió link digital de constancia cifrada al WhatsApp del paciente ${activePatient?.name}.`,
      'seguridad',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('✓ Enviado: Mensaje y constancia de tratamiento clínica enviada al WhatsApp del paciente.');
  };

  const handleAnexRecord = () => {
    // Registrar en auditoría
    auditLogService.addLog(
      'Actualización de expediente',
      `Anexó constancia psicoterapéutica oficial en la sección de documentos del expediente de ${activePatient?.name}.`,
      'expediente',
      { id: 'user-current', name: userName, role: userRole }
    );
    alert('✓ Anexado: Constancia clínica anexada al expediente del paciente de forma histórica.');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-clinical-dark">Reportes y Constancias Médicas</h2>
          <p className="text-xs text-clinical-textMuted">
            Genera e imprime constancias clínicas oficiales, recetas psicotrópicas o informes periciales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Constancia */}
        <form onSubmit={handleGenerate} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-clinical-accent" />
            <h3 className="text-sm font-bold text-clinical-dark">Generar Constancia Psicoterapéutica</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Paciente Asignado:</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none text-clinical-dark font-semibold"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Cédula Profesional:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nombre Especialista:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Dirección Consultorio:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Email de Contacto:</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Teléfono:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Inicio Atención:</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Fin Atención:</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Total Sesiones:</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={totalSessions}
                onChange={(e) => setTotalSessions(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Frecuencia:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Modalidad:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Cuadro de Síntomas Detectado:</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Evolución Clínica:</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              value={evolution}
              onChange={(e) => setEvolution(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Lugar y Fecha:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={placeDate}
                onChange={(e) => setPlaceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Recomendaciones Finales:</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow transition-colors"
            >
              Generar Vista Previa
            </button>
          </div>
        </form>

        {/* Vista Previa del PDF */}
        <div className="space-y-4">
          {showPreview && activePatient ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Hoja de Constancia */}
              <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-md font-serif text-slate-800 text-[10px] space-y-6 leading-relaxed relative overflow-hidden max-w-full">
                {/* Membrete */}
                <div className="text-center font-sans border-b-2 border-clinical-accent pb-4">
                  <h1 className="text-base font-extrabold text-clinical-dark tracking-wider uppercase">BreveMente - Servicios Clínicos</h1>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase tracking-widest">{modality}</span>
                  <div className="flex justify-between items-center text-[8px] text-slate-500 font-semibold mt-3 max-w-md mx-auto">
                    <span>Cédula: {license}</span>
                    <span>Email: {email}</span>
                    <span>Teléfono: {phone}</span>
                  </div>
                </div>

                {/* Título constancia */}
                <div className="text-center font-sans">
                  <h2 className="text-xs font-bold text-clinical-dark uppercase tracking-widest">Constancia Psicoterapéutica</h2>
                </div>

                {/* Cuerpo texto */}
                <div className="space-y-4">
                  <p>
                    A quien corresponda:
                  </p>
                  <p>
                    Por medio de la presente, el suscrito especialista hace constar que el paciente de nombre{' '}
                    <span className="font-bold text-clinical-dark font-sans">{activePatient.name}</span>, con fecha de nacimiento{' '}
                    {activePatient.birthDate}, ha recibido tratamiento psicoterapéutico especializado en esta clínica.
                  </p>
                  <p>
                    El periodo de atención comprendió del <span className="font-bold">{periodStart}</span> al{' '}
                    <span className="font-bold">{periodEnd}</span>, completando un total de{' '}
                    <span className="font-bold">{totalSessions} sesiones</span> de psicoterapia con una frecuencia{' '}
                    <span className="font-bold">{frequency}</span> y bajo la modalidad <span className="font-bold">{modality}</span>.
                  </p>
                  <p>
                    El tratamiento se enfocó en resolver un cuadro clínico de: <span className="font-bold">{symptoms}</span>. 
                    Durante el proceso terapéutico, el paciente ha mostrado la siguiente evolución: <span className="italic">{evolution}</span>.
                  </p>
                  <p>
                    Se extienden las siguientes sugerencias clínicas de egreso: {recommendations}.
                  </p>
                  <p className="pt-2 text-right">
                    {placeDate}.
                  </p>
                </div>

                {/* Firma */}
                <div className="pt-8 text-center max-w-xs mx-auto space-y-1">
                  <div className="h-0.5 w-40 bg-slate-300 mx-auto" />
                  <span className="font-sans font-bold text-clinical-dark block">{profName}</span>
                  <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-widest">Terapeuta Responsable</span>
                  <span className="text-[8px] font-mono text-slate-500 font-bold block">Firma Criptográfica: MOCK-SIGN-UUID-884920</span>
                </div>

                {/* Sello de seguridad */}
                <div className="absolute right-4 bottom-4 w-12 h-12 border-2 border-emerald-500 text-emerald-500 rounded-full flex flex-col items-center justify-center font-sans font-bold text-[6px] tracking-tight uppercase rotate-12 opacity-80 select-none">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  BreveMente
                </div>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-3 gap-2 shrink-0 text-xs">
                <button
                  onClick={handleSendPatient}
                  className="flex items-center justify-center gap-1.5 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar WhatsApp
                </button>
                <button
                  onClick={handleAnexRecord}
                  className="flex items-center justify-center gap-1.5 p-2 bg-clinical-teal hover:bg-clinical-tealHover text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Anexar Expediente
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center justify-center gap-1.5 p-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-xs shadow-sm h-full flex flex-col justify-center items-center gap-2">
              <FileText className="w-8 h-8 text-slate-300" />
              <span>Rellena los datos de la constancia a la izquierda y presiona &ldquo;Generar Vista Previa&rdquo; para visualizar el documento oficial.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
