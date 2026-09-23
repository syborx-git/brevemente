import React from 'react';
import { FileText, X, CheckCircle2, ShieldCheck, Download, Calendar, User, Building, Paperclip, Eye } from 'lucide-react';
import { PhysicalCertificateLog } from '../types/clinical';

interface PhysicalCertificateDetailModalProps {
  certificate: PhysicalCertificateLog;
  onClose: () => void;
}

export const PhysicalCertificateDetailModal: React.FC<PhysicalCertificateDetailModalProps> = ({
  certificate,
  onClose
}) => {
  const typeLabelMap: Record<string, string> = {
    psicoterapeutica: 'Constancia de Tratamiento Psicoterapéutico',
    psiquiatrica: 'Constancia de Tratamiento Psiquiátrico / Farmacológico',
    asistencia: 'Constancia de Asistencia a Citas',
    informe_pericial: 'Informe Clínico / Pericial',
    justificante: 'Justificante Médico / Terapéutico'
  };

  const handleSimulateDownloadScan = () => {
    alert(`📥 Descargando respaldo escaneado: "${certificate.scanFileName || 'constancia_escaneada.pdf'}"`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-slate-900 text-white p-5 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clinical-teal/20 border border-clinical-teal/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-clinical-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-clinical-teal/20 text-clinical-teal px-2 py-0.5 rounded">
                  Ficha de Control Documental Físico
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Folio: {certificate.physicalFolio}
                </span>
              </div>
              <h2 className="text-base font-bold mt-1">
                {typeLabelMap[certificate.type] || certificate.type}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Paciente: <b>{certificate.patientName}</b> · Expedida el {certificate.issueDate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">

          {/* Estado de entrega física */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 text-xs block">
                  Documento Físico Entregado en Consultorio
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Receptor: <b>{certificate.deliveredTo}</b>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
              Archivo Vigente
            </span>
          </div>

          {/* Grid de Metadatos: Especialista y Destinatario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Médico / Especialista Firmante</span>
              <span className="font-bold text-clinical-dark text-xs block">{certificate.issuerName}</span>
              <span className="text-[11px] text-slate-500 font-mono block">Cédula: {certificate.issuerLicense}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Destinatario Asentado</span>
              <span className="font-bold text-clinical-dark text-xs block">{certificate.recipient}</span>
              <span className="text-[11px] text-slate-500 block truncate">Motivo: {certificate.purpose}</span>
            </div>
          </div>

          {/* Periodo y sesiones acreditadas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Periodo Acreditado en Papel</span>
              <span className="font-semibold text-slate-800 text-xs">{certificate.periodCovered}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sesiones Acreditadas</span>
              <span className="font-bold text-clinical-teal text-sm">{certificate.sessionsCount} sesiones</span>
            </div>
          </div>

          {/* Síntesis Clínica asentada */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Síntesis Clínica Asentada en el Documento Físico
            </span>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 leading-relaxed font-medium bg-slate-50/40">
              {certificate.clinicalSummary}
            </div>
          </div>

          {/* Archivo escaneado adjunto si existe */}
          {certificate.scanFileName && (
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-clinical-teal shrink-0" />
                <div>
                  <span className="font-bold text-clinical-dark text-xs block">
                    Copia Digitalizada del Documento Firmado
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {certificate.scanFileName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimulateDownloadScan}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-clinical-teal hover:bg-[#258280] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Escaneo
              </button>
            </div>
          )}

          {/* Trazabilidad en Auditoría */}
          <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>
              Registrado en expediente por <b>{certificate.registeredBy}</b>
            </span>
            <span className="font-mono text-[10px]">
              {new Date(certificate.registeredAt).toLocaleString('es-MX')}
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};
