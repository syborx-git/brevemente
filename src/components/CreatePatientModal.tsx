import React, { useState, useEffect } from 'react';
import { 
  X, User, Shield, CheckCircle, AlertTriangle, FileText, 
  Upload, ChevronRight, ChevronLeft, Calendar, Mail, Phone, Lock
} from 'lucide-react';
import { 
  Patient, Role, QuienCompletaRegistro, ParentescoRepresentante, 
  RepresentanteLegal, ArchivoAdjunto 
} from '../types/clinical';
import { 
  parseCurpBirthDate, calculateAge, evaluateCurpDateMismatch, 
  determineCapacityState 
} from '../utils/legalConsent';
import { therapistSettingsService } from '../services/therapistSettingsService';
import { auditLogService } from '../services/auditLogService';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: Patient) => void;
  userName: string;
  userRole: Role;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  userName,
  userRole
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // --- PASO 1: Identificación ---
  const [nombre, setNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [quienCompletaRegistro, setQuienCompletaRegistro] = useState<QuienCompletaRegistro>('PACIENTE');

  // Advertencias paso 1
  const [curpMismatchWarning, setCurpMismatchWarning] = useState<string | null>(null);
  const [minAgeWarning, setMinAgeWarning] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Configuración del terapeuta
  const [edadMinimaAtencion, setEdadMinimaAtencion] = useState<number>(0);

  // --- PASO 2: Representación Legal ---
  const [repNombre, setRepNombre] = useState('');
  const [repParentesco, setRepParentesco] = useState<ParentescoRepresentante>('MADRE');
  const [repTelefono, setRepTelefono] = useState('');
  const [repCorreo, setRepCorreo] = useState('');
  const [docIdentificacion, setDocIdentificacion] = useState<ArchivoAdjunto | null>(null);
  const [docVinculo, setDocVinculo] = useState<ArchivoAdjunto | null>(null);
  const [otroProgenitorInformado, setOtroProgenitorInformado] = useState<'SI' | 'NO' | 'NO_APLICA' | null>('NO_APLICA');
  const [telefonoPacienteOpcional, setTelefonoPacienteOpcional] = useState('');
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Carga de configuración inicial
  useEffect(() => {
    if (isOpen) {
      setEdadMinimaAtencion(therapistSettingsService.getEdadMinimaAtencion());
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setNombre('');
    setCurp('');
    setFechaNacimiento('');
    setCorreo('');
    setTelefono('');
    setQuienCompletaRegistro('PACIENTE');
    setCurpMismatchWarning(null);
    setMinAgeWarning(null);
    setStep1Error(null);

    setRepNombre('');
    setRepParentesco('MADRE');
    setRepTelefono('');
    setRepCorreo('');
    setDocIdentificacion(null);
    setDocVinculo(null);
    setOtroProgenitorInformado('NO_APLICA');
    setTelefonoPacienteOpcional('');
    setStep2Error(null);
  };

  // Cálculo de edad derivado
  const edadCalculada = fechaNacimiento ? calculateAge(fechaNacimiento) : 0;

  // Lógica de autocompletado y validación de CURP
  const handleCurpChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setCurp(uppercaseVal);

    if (uppercaseVal.length === 18) {
      const parsed = parseCurpBirthDate(uppercaseVal);
      if (parsed.isValid && parsed.birthDate) {
        // Autocompletar fecha de nacimiento
        setFechaNacimiento(parsed.birthDate);
        setCurpMismatchWarning(null);

        // Validar edad mínima configurada
        const age = calculateAge(parsed.birthDate);
        if (edadMinimaAtencion > 0 && age < edadMinimaAtencion) {
          setMinAgeWarning(
            'Este paciente está por debajo de la edad mínima que configuraste para tu consulta. Puedes continuar si es tu criterio.'
          );
        } else {
          setMinAgeWarning(null);
        }
        return;
      }
    }

    // Si tiene fecha previa y la CURP es válida pero diferente
    if (uppercaseVal.length === 18 && fechaNacimiento) {
      const mismatch = evaluateCurpDateMismatch(uppercaseVal, fechaNacimiento);
      setCurpMismatchWarning(mismatch);
    }
  };

  const handleFechaNacimientoChange = (val: string) => {
    setFechaNacimiento(val);

    // Validar discrepancia con CURP existente
    if (curp.length === 18) {
      const mismatch = evaluateCurpDateMismatch(curp, val);
      setCurpMismatchWarning(mismatch);
    } else {
      setCurpMismatchWarning(null);
    }

    // Validar advertencia de edad mínima
    const age = calculateAge(val);
    if (edadMinimaAtencion > 0 && age < edadMinimaAtencion) {
      setMinAgeWarning(
        'Este paciente está por debajo de la edad mínima que configuraste para tu consulta. Puedes continuar si es tu criterio.'
      );
    } else {
      setMinAgeWarning(null);
    }
  };

  // Determinar si se requiere paso 2 (menor de edad o familiar completando)
  const requiresStep2 = edadCalculada < 18 || quienCompletaRegistro === 'FAMILIAR_O_APOYO';

  // Manejador del paso 1 al siguiente
  const handleStep1Next = () => {
    if (!nombre.trim()) {
      setStep1Error('El nombre completo es obligatorio.');
      return;
    }
    if (!fechaNacimiento) {
      setStep1Error('La fecha de nacimiento es obligatoria.');
      return;
    }
    if (!correo.trim()) {
      setStep1Error('El correo electrónico es obligatorio.');
      return;
    }
    if (!telefono.trim()) {
      setStep1Error('El teléfono es obligatorio.');
      return;
    }

    setStep1Error(null);

    // Si requiere representación legal -> Paso 2; sino -> Paso 3 directo
    if (requiresStep2) {
      // Si el paciente ya capturó teléfono en paso 1, inicializar el opcional
      setTelefonoPacienteOpcional(telefono);
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  // Manejador del paso 2 al siguiente
  const handleStep2Next = () => {
    if (!repNombre.trim()) {
      setStep2Error('El nombre completo del representante o persona de apoyo es obligatorio.');
      return;
    }
    if (!repTelefono.trim()) {
      setStep2Error('El teléfono de contacto del representante es obligatorio.');
      return;
    }
    if (!repCorreo.trim()) {
      setStep2Error('El correo electrónico del representante es obligatorio.');
      return;
    }

    setStep2Error(null);
    setCurrentStep(3);
  };

  // Ayuda contextual del documento de vínculo según parentesco
  const getDocumentoVinculoHelp = () => {
    switch (repParentesco) {
      case 'MADRE':
      case 'PADRE':
        return 'Acta de nacimiento del menor para acreditar el parentesco con la madre o el padre.';
      case 'TUTOR_LEGAL':
        return 'Resolución judicial o carta de tutela legal debidamente expedida.';
      case 'PERSONA_DE_APOYO':
        return 'Sin documento obligatorio para persona de apoyo designada.';
      default:
        return '';
    }
  };

  // Simulación de carga de archivos
  const handleSimulatedFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (doc: ArchivoAdjunto | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      });
    }
  };

  // Guardar paciente definitivo (Paso 3)
  const handleSavePatient = () => {
    const patientId = `patient-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    // Determinar estado de capacidad normativo
    const capacidadConsentimiento = determineCapacityState(edadCalculada, quienCompletaRegistro);

    let representanteData: RepresentanteLegal | null = null;
    if (requiresStep2) {
      representanteData = {
        nombreCompleto: repNombre.trim(),
        parentesco: repParentesco,
        telefono: repTelefono.trim(),
        correo: repCorreo.trim(),
        documentoIdentificacion: docIdentificacion,
        documentoVinculo: docVinculo,
        otroProgenitorInformado: (repParentesco === 'MADRE' || repParentesco === 'PADRE') ? otroProgenitorInformado : null
      };
    }

    const newPatient: Patient = {
      id: patientId,
      name: nombre.trim(),
      phone: requiresStep2 ? (telefonoPacienteOpcional.trim() || repTelefono.trim()) : telefono.trim(),
      email: correo.trim(),
      birthDate: fechaNacimiento,
      curp: curp.trim() || `CURP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      registrationDate: today,
      status: 'pendiente',
      riskLevel: 'bajo',
      registryMode: 'ia',
      motif: 'Ingreso inicial clínico',
      therapistId: 'therapist-1',
      therapistName: 'Dr. Alejandro Silva',

      // Campos normativos de representación legal
      fechaNacimiento,
      edadCalculada,
      capacidadConsentimiento,
      quienCompletaRegistro,
      representante: representanteData,
      telefonoPaciente: requiresStep2 ? (telefonoPacienteOpcional.trim() || null) : telefono.trim(),
      consentimientoRepresentanteFirmado: false // Inicialmente sin formalizar
    };

    // --- REGISTRO EN AUDITORÍA ---
    const auditUser = { id: 'user-current', name: userName, role: userRole };

    // 1. Creación del expediente con su estado inicial
    auditLogService.addLog(
      'Creación de expediente',
      `Expediente creado para ${newPatient.name} (CURP: ${newPatient.curp}). Estado legal inicial: ${capacidadConsentimiento.estado}.`,
      'expediente',
      auditUser
    );

    // 2. Captura o modificación del representante
    if (representanteData) {
      const parentescoLabel = 
        representanteData.parentesco === 'PERSONA_DE_APOYO' ? 'persona de apoyo designada' : representanteData.parentesco.toLowerCase();
      auditLogService.addLog(
        'Captura de representante',
        `Se registró como representante legal a ${representanteData.nombreCompleto} con vínculo de ${parentescoLabel} para ${newPatient.name}.`,
        'expediente',
        auditUser
      );

      // 3. Carga de cada documento
      if (docIdentificacion) {
        auditLogService.addLog(
          'Carga de documento legal',
          `Cargó identificación oficial de representante (${docIdentificacion.name}) en el expediente de ${newPatient.name}.`,
          'expediente',
          auditUser
        );
      }
      if (docVinculo) {
        auditLogService.addLog(
          'Carga de documento legal',
          `Cargó documento de acreditación de vínculo (${docVinculo.name}) en el expediente de ${newPatient.name}.`,
          'expediente',
          auditUser
        );
      }
    }

    // 4. Cualquier cambio o fijación del estado de capacidad
    auditLogService.addLog(
      'Determinación de capacidad',
      `Capacidad de consentimiento establecida en ${capacidadConsentimiento.estado}. Motivo: ${capacidadConsentimiento.motivo || 'Autonomía estándar por mayoría de edad'}.`,
      'expediente',
      auditUser
    );

    // Guardar en servicio y estado
    onAddPatient(newPatient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-clinical-dark text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg text-clinical-accent">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Crear Paciente — Expediente Clínico</h2>
              <span className="text-[10px] text-slate-300 block">Flujo de Identificación y Representación Legal BreveMente</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Progreso de 3 Pasos */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 shrink-0">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {/* Paso 1 */}
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 1 
                  ? 'bg-clinical-accent text-white shadow-sm ring-2 ring-clinical-accent/30' 
                  : currentStep > 1 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[11px] font-bold text-clinical-dark block">Identificación</span>
                <span className="text-[9px] text-slate-400 block">Datos del paciente</span>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-3 transition-colors ${currentStep > 1 ? 'bg-teal-500' : 'bg-slate-200'}`} />

            {/* Paso 2 */}
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 2 
                  ? 'bg-clinical-accent text-white shadow-sm ring-2 ring-clinical-accent/30' 
                  : currentStep > 2 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[11px] font-bold text-clinical-dark block">Representación</span>
                <span className="text-[9px] text-slate-400 block">
                  {requiresStep2 ? 'Requerida' : 'Opcional / Salto'}
                </span>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-3 transition-colors ${currentStep === 3 ? 'bg-teal-500' : 'bg-slate-200'}`} />

            {/* Paso 3 */}
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 3 
                  ? 'bg-clinical-accent text-white shadow-sm ring-2 ring-clinical-accent/30' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                3
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[11px] font-bold text-clinical-dark block">Confirmación</span>
                <span className="text-[9px] text-slate-400 block">Estado y bloqueos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-650 space-y-4">

          {/* ======================= PASO 1: IDENTIFICACIÓN ======================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <User className="w-4 h-4 text-clinical-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-clinical-dark text-xs">Paso 1 — Datos de Identificación del Paciente</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Captura los datos oficiales del paciente. La CURP autocompleta la fecha de nacimiento y calcula la edad de forma objetiva.
                  </p>
                </div>
              </div>

              {step1Error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{step1Error}</span>
                </div>
              )}

              {/* Grid Campos Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nombre completo */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sofía Martínez López"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                {/* CURP */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    CURP (18 caracteres)
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    placeholder="Ej. MAVS980514MDFRR09"
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-clinical-accent focus:outline-none tracking-wider"
                    value={curp}
                    onChange={(e) => handleCurpChange(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Al ingresar 18 caracteres se autocompleta la fecha de nacimiento.
                  </span>
                </div>

                {/* Fecha de nacimiento (Obligatorio) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider">
                      Fecha de Nacimiento <span className="text-red-500">*</span>
                    </label>
                    {fechaNacimiento && (
                      <span className="text-[10px] font-bold text-clinical-dark bg-slate-100 px-2 py-0.5 rounded">
                        Edad: {edadCalculada} {edadCalculada === 1 ? 'año' : 'años'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                      value={fechaNacimiento}
                      onChange={(e) => handleFechaNacimientoChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="paciente@ejemplo.com"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Teléfono del Paciente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+52 55 1234 5678"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Advertencia no bloqueante por discrepancia de CURP y fecha manual */}
              {curpMismatchWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Aviso de discrepancia:</span>
                    <span>{curpMismatchWarning}</span>
                  </div>
                </div>
              )}

              {/* Advertencia no bloqueante por edad mínima configurada del clínico */}
              {minAgeWarning && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg flex items-start gap-2 text-xs">
                  <Shield className="w-4 h-4 text-clinical-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Criterio de edad mínima de atención:</span>
                    <span>{minAgeWarning}</span>
                  </div>
                </div>
              )}

              {/* Pregunta neutral obligatoria al pie del paso 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-4">
                <span className="font-bold text-clinical-dark text-xs block">
                  ¿La persona está en situación de dependencia y requiere asistencia? <span className="text-red-500">*</span>
                </span>
                
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="quienCompleta"
                      value="PACIENTE"
                      checked={quienCompletaRegistro === 'PACIENTE'}
                      onChange={() => setQuienCompletaRegistro('PACIENTE')}
                      className="w-4 h-4 text-clinical-accent focus:ring-clinical-accent"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      No
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="quienCompleta"
                      value="FAMILIAR_O_APOYO"
                      checked={quienCompletaRegistro === 'FAMILIAR_O_APOYO'}
                      onChange={() => setQuienCompletaRegistro('FAMILIAR_O_APOYO')}
                      className="w-4 h-4 text-clinical-accent focus:ring-clinical-accent"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Si
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ======================= PASO 2: REPRESENTACIÓN LEGAL ======================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Encabezado contextual según el caso */}
              <div className="bg-blue-50 border-l-4 border-clinical-accent p-3.5 rounded-r-xl flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-clinical-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-clinical-dark text-xs">Paso 2 — Representación Legal y Consentimiento</h3>
                  <p className="text-[11px] text-clinical-dark/90 mt-1 font-medium">
                    {edadCalculada < 18
                      ? 'Este paciente es menor de edad. Se requieren los datos de la madre, el padre o el tutor legal para el consentimiento informado.'
                      : 'Registraste que otra persona está completando este registro. Captura sus datos para que el clínico pueda validarlos en la primera sesión.'}
                  </p>
                </div>
              </div>

              {step2Error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{step2Error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nombre completo del representante */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Nombre del Representante o Persona de Apoyo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen López García"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                    value={repNombre}
                    onChange={(e) => setRepNombre(e.target.value)}
                  />
                </div>

                {/* Parentesco (select) */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Parentesco / Relación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={repParentesco}
                    onChange={(e) => setRepParentesco(e.target.value as ParentescoRepresentante)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none bg-white"
                  >
                    <option value="MADRE">Madre</option>
                    <option value="PADRE">Padre</option>
                    <option value="TUTOR_LEGAL">Tutor legal</option>
                    <option value="PERSONA_DE_APOYO">Persona de apoyo designada</option>
                  </select>
                </div>

                {/* Teléfono del representante */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Teléfono del Representante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+52 55 9988 7766"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                    value={repTelefono}
                    onChange={(e) => setRepTelefono(e.target.value)}
                  />
                </div>

                {/* Correo del representante */}
                <div>
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Correo del Representante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="representante@ejemplo.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                    value={repCorreo}
                    onChange={(e) => setRepCorreo(e.target.value)}
                  />
                </div>

                {/* Teléfono del paciente (ahora opcional) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-clinical-dark uppercase tracking-wider mb-1">
                    Teléfono del paciente, si cuenta con uno <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Dejar vacío si el menor o persona atendida no tiene número propio"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-clinical-accent focus:outline-none"
                    value={telefonoPacienteOpcional}
                    onChange={(e) => setTelefonoPacienteOpcional(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo informativo si parentesco es MADRE o PADRE */}
              {(repParentesco === 'MADRE' || repParentesco === 'PADRE') && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <span className="font-bold text-clinical-dark text-xs block">
                    ¿El otro progenitor está informado del tratamiento?
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Campo informativo no bloqueante para fines de registro en el expediente.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {(['SI', 'NO', 'NO_APLICA'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="otroProgenitor"
                          value={opt}
                          checked={otroProgenitorInformado === opt}
                          onChange={() => setOtroProgenitorInformado(opt)}
                          className="w-3.5 h-3.5 text-clinical-accent"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {opt === 'SI' ? 'Sí' : opt === 'NO' ? 'No' : 'No aplica'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Cargas de Documentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Identificación oficial */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-clinical-dark text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-clinical-accent" />
                      Identificación Oficial
                    </span>
                    {docIdentificacion && (
                      <button 
                        type="button" 
                        onClick={() => setDocIdentificacion(null)}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">INE, Pasaporte o Cédula Profesional del representante.</p>

                  {docIdentificacion ? (
                    <div className="p-2 bg-white border border-teal-200 rounded-lg text-teal-800 font-semibold text-[11px] flex items-center justify-between">
                      <span className="truncate">{docIdentificacion.name}</span>
                      <span className="text-[9px] bg-teal-50 px-1.5 py-0.5 rounded uppercase">Cargado</span>
                    </div>
                  ) : (
                    <label className="border border-dashed border-slate-300 hover:border-clinical-accent bg-white rounded-lg p-3 text-center block cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <span className="text-[11px] text-clinical-dark font-semibold block">Seleccionar archivo</span>
                      <span className="text-[9px] text-slate-400">PDF, JPG o PNG (máx. 10MB)</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleSimulatedFileUpload(e, setDocIdentificacion)}
                      />
                    </label>
                  )}
                </div>

                {/* Documento de vínculo */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-clinical-dark text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-clinical-accent" />
                      Documento de Vínculo Legal
                    </span>
                    {docVinculo && (
                      <button 
                        type="button" 
                        onClick={() => setDocVinculo(null)}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{getDocumentoVinculoHelp()}</p>

                  {docVinculo ? (
                    <div className="p-2 bg-white border border-teal-200 rounded-lg text-teal-800 font-semibold text-[11px] flex items-center justify-between">
                      <span className="truncate">{docVinculo.name}</span>
                      <span className="text-[9px] bg-teal-50 px-1.5 py-0.5 rounded uppercase">Cargado</span>
                    </div>
                  ) : (
                    <label className="border border-dashed border-slate-300 hover:border-clinical-accent bg-white rounded-lg p-3 text-center block cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <span className="text-[11px] text-clinical-dark font-semibold block">Seleccionar archivo</span>
                      <span className="text-[9px] text-slate-400">PDF o Imagen del documento</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleSimulatedFileUpload(e, setDocVinculo)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= PASO 3: CONFIRMACIÓN ======================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-clinical-dark text-xs">Paso 3 — Resumen del Expediente y Estado Legal</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verifica la información registrada antes de crear el expediente. Revisa el estado de consentimiento asignado.
                  </p>
                </div>
              </div>

              {/* Ficha Resumen Paciente */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="font-bold text-clinical-dark text-xs block border-b border-slate-100 pb-2 uppercase tracking-wider">
                  Datos del Paciente
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Nombre:</span>
                    <span className="font-bold text-clinical-dark">{nombre}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">CURP:</span>
                    <span className="font-mono font-semibold text-slate-600">{curp || 'No especificada'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Nacimiento / Edad:</span>
                    <span className="font-semibold text-slate-700">{fechaNacimiento} ({edadCalculada} años)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Correo:</span>
                    <span className="font-semibold text-slate-700">{correo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Teléfono:</span>
                    <span className="font-semibold text-slate-700">
                      {requiresStep2 ? (telefonoPacienteOpcional || 'No cuenta con número propio') : telefono}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Completado por:</span>
                    <span className="font-semibold text-slate-700">
                      {quienCompletaRegistro === 'PACIENTE' ? 'El propio paciente' : 'Familiar o persona de apoyo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ficha Resumen Representante (si aplica) */}
              {requiresStep2 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-clinical-dark text-xs block border-b border-slate-100 pb-2 uppercase tracking-wider">
                    Representante Legal / Persona de Apoyo
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Nombre:</span>
                      <span className="font-bold text-clinical-dark">{repNombre}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Parentesco:</span>
                      <span className="font-semibold text-slate-700">
                        {repParentesco === 'PERSONA_DE_APOYO' ? 'Persona de apoyo designada' : repParentesco}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Contacto:</span>
                      <span className="font-semibold text-slate-700">{repTelefono} / {repCorreo}</span>
                    </div>
                    {(repParentesco === 'MADRE' || repParentesco === 'PADRE') && (
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Otro progenitor informado:</span>
                        <span className="font-semibold text-slate-700">
                          {otroProgenitorInformado === 'SI' ? 'Sí' : otroProgenitorInformado === 'NO' ? 'No' : 'No aplica'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Documentos:</span>
                      <span className="font-semibold text-slate-700">
                        {docIdentificacion ? '✓ ID oficial' : 'Sin ID'} • {docVinculo ? '✓ Vínculo' : 'Sin acreditación'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dictamen del Estado de Capacidad Inicial */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-clinical-dark text-xs uppercase tracking-wider">
                    Estado Inicial del Expediente
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    edadCalculada < 18
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : quienCompletaRegistro === 'FAMILIAR_O_APOYO'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {edadCalculada < 18
                      ? 'REPRESENTADO_POR_EDAD'
                      : quienCompletaRegistro === 'FAMILIAR_O_APOYO'
                        ? 'PENDIENTE_DETERMINACION'
                        : 'AUTONOMO'}
                  </span>
                </div>

                {/* Explicación de Bloqueos Operativos */}
                {requiresStep2 ? (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Acciones bloqueadas hasta formalizar consentimiento del representante:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1 font-medium">
                      <li>Confirmar cita en la agenda</li>
                      <li>Iniciar grabación de sesión (Modo IA)</li>
                      <li>Generar constancias médicas o psicoterapéuticas</li>
                    </ul>
                    <p className="text-[10px] text-amber-800 pt-1">
                      El guardado del expediente <b>no</b> se bloquea por falta de documentos. Los bloqueos se liberarán en cuanto el clínico o representante formalice la firma de consentimiento en el expediente.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>El paciente cuenta con plena autonomía legal. No se aplican bloqueos de representación.</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer con Botones de Navegación */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 3) {
                    setCurrentStep(requiresStep2 ? 2 : 1);
                  } else if (currentStep === 2) {
                    setCurrentStep(1);
                  }
                }}
                className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleStep1Next}
                className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                Continuar
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleStep2Next}
                className="px-4 py-2 bg-clinical-accent hover:bg-clinical-accentHover text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                Continuar a Confirmación
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleSavePatient}
                className="px-5 py-2 bg-clinical-dark hover:bg-clinical-darkLight text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-clinical-accent" />
                Crear y Guardar Expediente
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
