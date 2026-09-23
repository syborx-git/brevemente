import React, { useState } from 'react';
import { FileText, X, CheckCircle2, Upload, AlertCircle, ShieldCheck, Calendar, User } from 'lucide-react';
import { Patient, Role, PhysicalCertificateLog, PhysicalCertificateType } from '../types/clinical';
import { physicalCertificateService } from '../services/physicalCertificateService';

interface RegisterPhysicalCertificateModalProps {
  patient: Patient;
  userName: string;
  userRole: Role;
  sessionCount: number;
  onClose: () => void;
  onSaved: (cert: PhysicalCertificateLog) => void;
}

export const RegisterPhysicalCertificateModal: React.FC<RegisterPhysicalCertificateModalProps> = ({
  patient,
  userName,
  userRole,
  sessionCount,
  onClose,
  onSaved
}) => {
  const [physicalFolio, setPhysicalFolio] = useState(
    `CONST-2026-${Math.floor(Math.random() * 900 + 100)}-FIS`
  );
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<PhysicalCertificateType>('psicoterapeutica');
  const [issuerName, setIssuerName] = useState(patient.therapistName || userName);
  const [issuerLicense, setIssuerLicense] = useState('CED-8849302-MX');
  const [recipient, setRecipient] = useState('A quien corresponda');
  const [purpose, setPurpose] = useState('Acreditación formal de asistencia y continuidad a tratamiento psicoterapéutico');
  const [periodCovered, setPeriodCovered] = useState(
    `10 de Agosto de 2026 al ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
  );
  const [sessionsCount, setSessionsCount] = useState(sessionCount > 0 ? sessionCount : 3);
  const [clinicalSummary, setClinicalSummary] = useState(
    `Se hace constar en documento físico oficial que la paciente ${patient.name} se encuentra bajo proceso terapéutico activo en este centro, habiendo cumplido con regularidad y adherencia a sus sesiones programadas.`
  );
  const [deliveredTo, setDeliveredTo] = useState(`${patient.name} (en mano propia)`);
  const [scanFileName, setScanFileName] = useState<string>('');
  const [hasPhysicalProof, setHasPhysicalProof] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPhysicalProof) {
      alert('Debe confirmar que el documento fue emitido físicamente y firmado en papel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCert = physicalCertificateService.addCertificateRecord(
        {
          patientId: patient.id,
          patientName: patient.name,
          physicalFolio: physicalFolio.trim(),
          issueDate,
          type,
          issuerName: issuerName.trim(),
          issuerLicense: issuerLicense.trim(),
          recipient: recipient.trim(),
          purpose: purpose.trim(),
          periodCovered: periodCovered.trim(),
          sessionsCount,
          clinicalSummary: clinicalSummary.trim(),
          deliveredTo: deliveredTo.trim(),
          digitalScanUrl: scanFileName.trim() ? scanFileName.trim() : undefined,
          scanFileName: scanFileName.trim() ? scanFileName.trim() : undefined,
          status: 'entregada_en_fisico',
          registeredBy: userName
        },
        { id: 'user-current', name: userName, role: userRole }
      );

      onSaved(newCert);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al registrar la constancia física en el expediente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanFileName(file.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clinical-teal/20 border border-clinical-teal/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-clinical-teal" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-clinical-teal">
                Control Documental en Físico
              </span>
              <h2 className="text-base font-bold mt-0.5">
                Registrar Constancia Emitida en Físico
              </h2>
              <p className="text-xs text-slate-300">
                Paciente: <b>{patient.name}</b> · Folio: <span className="font-mono text-white font-bold">{physicalFolio}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">

          {/* Aviso médico legal */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Bitácora de Control y Archivo Médico</span>
              Este formulario registra en el expediente oficial la entrega física de constancias o justificantes elaborados y firmados en papel por los doctores. No sustituye el documento físico original.
            </div>
          </div>

          {/* Fila 1: Folio, Fecha, Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Folio del Documento Físico</label>
              <input
                type="text"
                required
                value={physicalFolio}
                onChange={e => setPhysicalFolio(e.target.value)}
                placeholder="Ej. CONST-2026-084-FIS"
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Fecha de Expedición en Papel</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Tipo de Constancia Física</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PhysicalCertificateType)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              >
                <option value="psicoterapeutica">Constancia Psicoterapéutica</option>
                <option value="psiquiatrica">Constancia Psiquiátrica</option>
                <option value="asistencia">Constancia de Asistencia a Citas</option>
                <option value="informe_pericial">Informe Clínico / Pericial</option>
                <option value="justificante">Justificante Médico / Terapéutico</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Especialista firmante y Cédula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
                Especialista que Firma en Físico
              </label>
              <input
                type="text"
                required
                value={issuerName}
                onChange={e => setIssuerName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
                Cédula Profesional Asentada
              </label>
              <input
                type="text"
                required
                value={issuerLicense}
                onChange={e => setIssuerLicense(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
              />
            </div>
          </div>

          {/* Fila 3: Destinatario y Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
                Destinatario / Dirigida a
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="Ej. A quien corresponda, Facultad de Medicina UNAM..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
                Motivo de Solicitud por el Paciente
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Ej. Trámite escolar, justificación laboral..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              />
            </div>
          </div>

          {/* Fila 4: Periodo y Sesiones acreditadas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
                Periodo Acreditado en el Documento
              </label>
              <input
                type="text"
                required
                value={periodCovered}
                onChange={e => setPeriodCovered(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
                Sesiones Acreditadas
              </label>
              <input
                type="number"
                min="1"
                required
                value={sessionsCount}
                onChange={e => setSessionsCount(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-bold"
              />
            </div>
          </div>

          {/* Fila 5: Resumen de lo asentado en físico */}
          <div>
            <label className="block font-bold text-clinical-dark uppercase text-[10px] mb-1">
              Síntesis Clínica de lo Asentado en el Documento Físico
            </label>
            <textarea
              rows={3}
              required
              value={clinicalSummary}
              onChange={e => setClinicalSummary(e.target.value)}
              placeholder="Describa brevemente el diagnóstico, pronóstico o texto medular plasmado en el papel..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-clinical-teal leading-relaxed"
            />
          </div>

          {/* Fila 6: Entregado a & Escaneo de Respaldo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
                Persona que Recibió el Documento en Físico
              </label>
              <input
                type="text"
                required
                value={deliveredTo}
                onChange={e => setDeliveredTo(e.target.value)}
                placeholder="Ej. Sofía Martínez (paciente)"
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">
                Escaneo / Fotografía del Documento Firmado (Opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 p-2 bg-white border border-dashed border-slate-300 hover:border-clinical-teal rounded-lg text-[11px] font-semibold text-slate-600 transition-colors truncate">
                  <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{scanFileName || 'Seleccionar archivo escaneado...'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleSimulateFileSelect}
                    className="hidden"
                  />
                </label>
                {scanFileName && (
                  <button
                    type="button"
                    onClick={() => setScanFileName('')}
                    className="p-2 text-slate-400 hover:text-red-600 text-xs"
                    title="Quitar archivo"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Checkbox de confirmación de entrega en físico */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasPhysicalProof}
              onChange={e => setHasPhysicalProof(e.target.checked)}
              className="mt-0.5 rounded text-clinical-teal focus:ring-clinical-teal border-slate-300 w-4 h-4"
            />
            <span className="text-[11px] text-amber-950 font-semibold leading-tight">
              Certifico que esta constancia fue expedida físicamente en papelería membretada oficial de la clínica, con firma autógrafa del profesional y entregada conforme a la normativa clínica.
            </span>
          </label>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasPhysicalProof}
              className="flex items-center gap-2 px-5 py-2.5 bg-clinical-teal hover:bg-[#258280] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Guardar en Archivo del Expediente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
