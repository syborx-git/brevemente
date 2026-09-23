import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Patient } from '../types/clinical';
import { ConsentModal } from '../components/ConsentModal';
import { auditLogService } from '../services/auditLogService';

interface IntakeFormProps {
  patients: Patient[];
  onUpdatePatient: (pat: Patient) => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ patients, onUpdatePatient }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id') || 'patient-2'; // Default a Carlos Mendoza si no hay ID
  const patient = patients.find(p => p.id === patientId);

  // Form states
  const [name, setName] = useState(patient?.name || '');
  const [phone, setPhone] = useState(patient?.phone || '');
  const [email, setEmail] = useState(patient?.email || '');
  const [birthDate, setBirthDate] = useState(patient?.birthDate || '1995-01-01');
  const [curp, setCurp] = useState(patient?.curp || '');
  const [motif, setMotif] = useState(patient?.motif || '');
  const [registryMode, setRegistryMode] = useState<'ia' | 'manual'>('ia');

  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!patient) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white border border-slate-200 rounded-xl text-center">
        <p className="text-red-500 font-bold text-sm">Error: Paciente no encontrado</p>
        <button 
          onClick={() => navigate('/agenda')}
          className="mt-4 px-4 py-2 bg-clinical-accent text-white rounded text-xs font-semibold"
        >
          Ir a la Agenda
        </button>
      </div>
    );
  }

  const handleOpenConsent = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConsentOpen(true);
  };

  const handleAcceptConsent = (selectedMode: 'ia' | 'manual') => {
    setRegistryMode(selectedMode);
    setIsConsentOpen(false);

    // Actualizar datos del paciente en el listado
    const updatedPatient: Patient = {
      ...patient,
      name,
      phone,
      email,
      birthDate,
      curp,
      motif,
      registryMode: selectedMode,
      status: 'activo' // pasa a activo al firmar consentimiento
    };

    onUpdatePatient(updatedPatient);

    // Registrar en auditoría
    auditLogService.addLog(
      'Consentimiento firmado',
      `El paciente ${name} firmó digitalmente el consentimiento informado. Modo de registro autorizado: ${selectedMode === 'ia' ? 'Grabación e IA' : 'Manual'}.`,
      'seguridad',
      { id: patient.id, name: name, role: 'patient' }
    );

    auditLogService.addLog(
      'Actualización de expediente',
      `Paciente completó historia clínica (Intake) de ingreso. Estado: Activo.`,
      'expediente',
      { id: patient.id, name: name, role: 'patient' }
    );

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white border border-slate-200 rounded-xl text-center space-y-5 shadow-lg animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-clinical-dark">¡Firma de Consentimiento Exitosa!</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Tus datos médicos y de privacidad han sido registrados de forma segura y cifrada en el sistema de **BreveMente**. 
          Tu terapeuta ha sido notificado y tu expediente clínico ya se encuentra activo para tu primera consulta.
        </p>
        <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-500 max-w-xs mx-auto border border-slate-100">
          <span>Modo de expediente: </span>
          <span className="font-bold text-clinical-dark uppercase">
            {registryMode === 'ia' ? 'Con grabación e IA asistida' : 'Manual (Sin grabación)'}
          </span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-clinical-accent text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-clinical-accentHover transition-colors"
        >
          Volver al Inicio del Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6 my-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-clinical-teal/10 p-2.5 rounded-lg text-clinical-teal border border-clinical-teal/20">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-clinical-dark">Historia Clínica y Admisión Clínico-Médica</h2>
          <p className="text-xs text-slate-500">Por favor, rellene sus datos con veracidad. Toda la información es confidencial.</p>
        </div>
      </div>

      <form onSubmit={handleOpenConsent} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Nombre Completo:</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-teal bg-slate-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">CURP:</label>
            <input
              type="text"
              required
              placeholder="18 caracteres"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Teléfono Celular:</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-teal bg-slate-50"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Correo Electrónico:</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-teal bg-slate-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Fecha de Nacimiento:</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-teal"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Describa brevemente el motivo principal de su consulta (¿Qué le sucede?):</label>
          <textarea
            rows={4}
            required
            placeholder="Ej. Siento opresión en el pecho e incapacidad para respirar ante juntas laborales, esto me sucede hace 3 meses..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-teal"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
        </div>

        {/* Info Privacidad Preliminar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-2.5">
          <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-700 block">Compromiso de Privacidad</span>
            <p className="text-slate-500 leading-relaxed">
              Los datos recabados en este formulario clínico constituyen información altamente confidencial resguardada bajo la ley nacional de protección de datos de salud mental. Ninguna información será divulgada fuera del circuito de atención médica autorizado.
            </p>
          </div>
        </div>

        {/* Botón enviar */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-5 py-2.5 bg-clinical-teal hover:bg-clinical-tealHover text-white rounded-lg font-bold shadow transition-colors flex items-center gap-1.5"
          >
            Proceder a Firmar Consentimiento
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </form>

      {/* Modal Consentimiento */}
      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        patientName={name}
        onAccept={handleAcceptConsent}
      />
    </div>
  );
};
