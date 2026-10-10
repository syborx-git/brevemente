import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BitacoraNueva, ConstanciaNueva, ExpedienteRepository, PagoNuevo } from './ports/expediente.repository';
import { ExpedienteLocalStorageAdapter } from './adapters/expediente-localstorage.adapter';
import { ExpedienteHttpAdapter } from './adapters/expediente-http.adapter';
import {
  AuditLog,
  ClinicalRecord,
  Patient,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PhysicalCertificateLog,
  PhysicalCertificateType,
  Session,
  SupervisionLog,
  SupervisionRequest,
  VcEntry,
  VgEntry
} from '../../core/types/clinical.types';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-expediente-clinico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CdkTrapFocus],
  providers: [
    {
      provide: ExpedienteRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.expedienteClinicoBackend
          ? new ExpedienteHttpAdapter(http)
          : new ExpedienteLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './expediente-clinico.component.html',
  styleUrl: './expediente-clinico.component.scss'
})
export class ExpedienteClinicoComponent implements OnInit {
  pacienteId: string = 'patient-1';
  patient: Patient | null = null;
  record: ClinicalRecord | null = null;
  sessions: Session[] = [];
  pacientes: Patient[] = [];
  pagos: Payment[] = [];
  constancias: PhysicalCertificateLog[] = [];
  auditoria: AuditLog[] = [];
  bitacoras: SupervisionLog[] = [];
  solicitudes: SupervisionRequest[] = [];

  activeTab: 'datos' | 'psiquiatria' | 'tbe' | 'pagos' | 'auditoria' | 'supervision' | 'constancias' = 'datos';
  tbeSubTab: 'dx' | 'sesiones' | 'vc' | 'vg' | 'rst' = 'dx';
  selectedSession: Session | null = null;

  // Modal Nueva Sesión
  showSessionModal = false;
  newSessionProtocol = 'Trastornos Fóbicos y de Pánico (Protocolo Nardone)';
  newSessionPrescripcion = '';
  newSessionNotes = '';

  // Captura VC / VG en Nueva Sesión
  newVcPercepcion = 'Mejoría significativa';
  newVcPensamientos = 'Mejoría leve';
  newVcSensaciones = 'Mejoría significativa';
  newVcReacciones = 'Mejoría significativa';
  newVcSintomas = 'Mejoría significativa';
  newVcCrisis = 'Mejoría significativa';
  newVgYo = false;
  newVgDemas = false;
  newVgMundo = false;

  // Estado Modal Pagos
  showPaymentModal = false;
  isSubmittingPayment = false;
  newPayment = {
    concept: '',
    amount: 800,
    date: new Date().toISOString().split('T')[0],
    method: 'transferencia' as PaymentMethod,
    status: 'pagado' as PaymentStatus,
    notes: ''
  };

  // Estado Modal Constancias
  showConstanciaModal = false;
  isSubmittingConstancia = false;
  selectedConstancia: PhysicalCertificateLog | null = null;
  newConstancia = {
    physicalFolio: '',
    issueDate: new Date().toISOString().split('T')[0],
    type: 'psicoterapeutica' as PhysicalCertificateType,
    issuerName: '',
    issuerLicense: 'CED-8849302-MX',
    recipient: 'A quien corresponda',
    purpose: 'Acreditación formal de asistencia y continuidad a tratamiento psicoterapéutico',
    periodCovered: '',
    sessionsCount: 1,
    clinicalSummary: '',
    deliveredTo: '',
    scanFileName: '',
    hasPhysicalProof: true
  };

  // Estado Modal Bitácora de Supervisión
  showBitacoraModal = false;
  isSubmittingBitacora = false;
  newBitacora = {
    date: new Date().toISOString().split('T')[0],
    supervisorName: 'Dra. Isabel Cárdenas',
    supervisorLicense: 'CED-9988221-MX',
    sessionNumber: 1,
    spr: 'SPR Fóbico',
    ts: 'Ataque de Pánico',
    problemDefinition: '',
    currentSituation: 'Evolución favorable con reducción de síntomas tras prescripciones estratégicas iniciales.',
    therapistProblem: 'Dificultad para desmontar la solución intentada de pedir ayuda continua a la familia.',
    rst: 'Fantasía del peor escenario y redefinición paradójica del síntoma.',
    px: 'Worry-Time (WF 30 min) a las 18:00 hrs + Diario de a Bordo.',
    eff: 'Disminución de crisis espontáneas y aumento de autonomía personal.',
    doubt: '¿En qué momento retirar el acompañante familiar al salir a la calle?',
    blocking: 'Miedo a perder el control en transporte público.',
    observations: 'El terapeuta maneja adecuadamente el lenguaje hipnótico e indirecto. Debe mantener la postura no juzgadora.',
    recommendations: 'Prescribir simulacros voluntarios en trayectos cortos sin anunciar a los familiares. Monitorear adherencia en la siguiente sesión.'
  };

  // Audio Simulator State
  isRecording = false;
  recordingSeconds = 0;
  private recordingInterval: any = null;
  transcriptText = '';
  levaAdvice = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly expedienteRepo: ExpedienteRepository,
    public readonly roleService: RoleStateService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.pacienteId = params.get('id') || 'patient-1';
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.expedienteRepo.listarPacientes().subscribe(p => this.pacientes = p);
    this.expedienteRepo.obtenerPaciente(this.pacienteId).subscribe(p => {
      this.patient = p;
      if (p) {
        if (!this.newConstancia.issuerName) {
          this.newConstancia.issuerName = p.therapistName || 'Dr. Carlos Mendoza';
        }
        if (!this.newConstancia.deliveredTo) {
          this.newConstancia.deliveredTo = `${p.name} (en mano propia)`;
        }
        if (!this.newConstancia.periodCovered) {
          this.newConstancia.periodCovered = `10 de Agosto de 2026 al ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        }
        if (!this.newConstancia.clinicalSummary) {
          this.newConstancia.clinicalSummary = `Se hace constar en documento físico oficial que el/la paciente ${p.name} se encuentra bajo proceso terapéutico activo en este centro, habiendo cumplido con regularidad y adherencia a sus sesiones programadas.`;
        }
        if (!this.newBitacora.problemDefinition) {
          this.newBitacora.problemDefinition = `Cuadro fóbico agudo con evitación situacional. Motivo: "${p.motif || 'Crisis de ansiedad'}"`;
        }
      }
    });
    this.expedienteRepo.obtenerExpediente(this.pacienteId).subscribe(r => this.record = r);
    this.expedienteRepo.obtenerSesiones(this.pacienteId).subscribe(s => {
      this.sessions = s;
      if (!this.selectedSession && s.length > 0) {
        this.selectedSession = s[0];
      }
      this.newConstancia.sessionsCount = s.length > 0 ? s.length : 1;
      this.newBitacora.sessionNumber = s.length > 0 ? s.length : 1;
    });
    this.expedienteRepo.listarPagos(this.pacienteId).subscribe(p => this.pagos = p);
    this.expedienteRepo.listarConstancias(this.pacienteId).subscribe(c => this.constancias = c);
    this.expedienteRepo.listarAuditoria(this.pacienteId).subscribe(a => this.auditoria = a);
    this.expedienteRepo.listarBitacoras(this.pacienteId).subscribe(b => this.bitacoras = b);
    this.expedienteRepo.listarSolicitudes(this.pacienteId).subscribe(s => this.solicitudes = s);
  }

  get totalCobrado(): number {
    return this.pagos
      .filter(p => p.status === 'pagado')
      .reduce((acc, p) => acc + p.amount, 0);
  }

  get totalPendiente(): number {
    return this.pagos
      .filter(p => p.status === 'pendiente' || p.status === 'parcial')
      .reduce((acc, p) => acc + p.amount, 0);
  }

  vcValue(text: string | null | undefined): number {
    if (text === 'Marcador de inicio') return 1;
    if (text === 'Sin cambios') return 2;
    if (text === 'Mejoría leve') return 3;
    if (text === 'Mejoría significativa') return 4;
    if (text === 'Nuevo patrón') return 4.5;
    return 0;
  }

  get vcSeries(): Array<{ label: string; color: string; points: string }> {
    const keys: Array<'percepcion' | 'pensamientos' | 'sensaciones' | 'reacciones' | 'sintomas' | 'crisis'> =
      ['percepcion', 'pensamientos', 'sensaciones', 'reacciones', 'sintomas', 'crisis'];
    const labels = ['Percepción', 'Pensamientos', 'Sensaciones', 'Reacciones', 'Síntomas', 'Crisis'];
    const colors = ['#0284c7', '#0d9488', '#4f46e5', '#b30cea', '#ea580c', '#ef4444'];
    const n = this.sessions.length;
    if (n === 0) return [];
    const W = 600, H = 200, PAD = 24, MAXV = 4.5;
    return keys.map((k, i) => {
      const pts = this.sessions.map((s, idx) => {
        const x = PAD + (idx * (W - 2 * PAD)) / Math.max(n - 1, 1);
        const v = this.vcValue((s.valoracionCambio as any)?.[k]);
        const y = H - PAD - (v / MAXV) * (H - 2 * PAD);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return { label: labels[i], color: colors[i], points: pts };
    });
  }

  get vgBars(): Array<{ x: number; y: number; w: number; h: number; color: string }> {
    const n = this.sessions.length;
    if (n === 0) return [];
    const W = 600, H = 160, PAD = 24;
    const groupW = (W - 2 * PAD) / Math.max(n, 1);
    const barW = Math.min(20, (groupW - 8) / 3);
    const colors: Record<string, string> = { yo: '#0284c7', demas: '#0d9488', mundo: '#ea580c' };
    const bars: Array<{ x: number; y: number; w: number; h: number; color: string }> = [];
    this.sessions.forEach((s, i) => {
      const gx = PAD + i * groupW + (groupW - 3 * barW - 8) / 2;
      ['yo', 'demas', 'mundo'].forEach((k, j) => {
        const on = (s.valoracionGlobal as any)?.[k] === true;
        const h = on ? H - 2 * PAD : 4;
        const y = H - PAD - h;
        bars.push({ x: gx + j * (barW + 4), y, w: barW, h, color: colors[k] });
      });
    });
    return bars;
  }

  setTab(tab: 'datos' | 'psiquiatria' | 'tbe' | 'pagos' | 'auditoria' | 'supervision' | 'constancias'): void {
    this.activeTab = tab;
  }

  setTbeSubTab(sub: 'dx' | 'sesiones' | 'vc' | 'vg' | 'rst'): void {
    this.tbeSubTab = sub;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showPaymentModal) { this.closePaymentModal(); return; }
    if (this.showConstanciaModal) { this.closeConstanciaModal(); return; }
    if (this.showBitacoraModal) { this.closeBitacoraModal(); return; }
    if (this.selectedConstancia) { this.cerrarDetalleConstancia(); return; }
    if (this.showSessionModal) { this.closeSessionModal(); }
  }

  firmarConsentimiento(): void {
    this.expedienteRepo.firmarConsentimiento(this.pacienteId).subscribe(() => {
      this.cargarDatos();
    });
  }

  // Audio recording simulation
  toggleRecording(): void {
    if (this.isRecording) {
      clearInterval(this.recordingInterval);
      this.isRecording = false;
      this.transcriptText = "Transcripción completada: 'El paciente refiere que al salir a la calle siente opresión torácica y busca inmediatamente el contacto de su madre. Intenta calmar la respiración pero el intento genera mayor hiperventilación.'";
      this.levaAdvice = "LEVA detectó la tentativa de solución redundante: 'Intentar controlar conscientemente las reacciones espontáneas'. Sugerencia TBE: Prescribir la Peor Fantasía o Declaración del Miedo.";
    } else {
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.transcriptText = 'Grabando y transcribiendo en tiempo real...';
      this.levaAdvice = '';
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
      }, 1000);
    }
  }

  openSessionModal(): void {
    this.showSessionModal = true;
    this.newSessionPrescripcion = '';
    this.newSessionNotes = '';
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
  }

  guardarDx(): void {
    if (!this.record) return;
    this.expedienteRepo.actualizarExpediente(this.pacienteId, {
      motif: this.record.motif,
      description: this.record.description,
      trastornoEstrategico: this.record.trastornoEstrategico,
      firstAppearance: this.record.firstAppearance,
      precipitatingFactors: this.record.precipitatingFactors,
      evolutionType: this.record.evolutionType,
      dxOpInicial: this.record.dxOpInicial,
      sprInicial: this.record.sprInicial,
      objectivePatient: this.record.objectivePatient,
      objectiveTherapist: this.record.objectiveTherapist
    }).subscribe(r => this.record = r);
  }

  guardarPsiquiatria(): void {
    if (!this.record) return;
    this.expedienteRepo.actualizarExpediente(this.pacienteId, {
      dxNosologico: this.record.dxNosologico,
      dsm5: this.record.dsm5,
      cie11: this.record.cie11,
      comorbilidad: this.record.comorbilidad,
      differentialDx: this.record.differentialDx,
      treatmentPlan: this.record.treatmentPlan,
      prognosis: this.record.prognosis,
      favorableFactors: this.record.favorableFactors,
      unfavorableFactors: this.record.unfavorableFactors,
      drugsUsage: this.record.drugsUsage,
      drugsList: this.record.drugsList
    }).subscribe(r => this.record = r);
  }

  solicitarSupervision(): void {
    this.expedienteRepo.crearSolicitud(this.pacienteId, 'Solicitud de supervisión clínica generada desde el expediente.')
      .subscribe(() => {
        this.expedienteRepo.listarSolicitudes(this.pacienteId).subscribe(s => this.solicitudes = s);
      });
  }

  guardarSesion(): void {
    // El backend devuelve sesiones en orden ascendente; el siguiente número
    // debe derivarse del MÁXIMO (no de sessions[0]).
    const nextNum = this.sessions.length > 0
      ? Math.max(...this.sessions.map(s => s.number)) + 1
      : 1;
    const vc: VcEntry = {
      sessionNum: nextNum,
      percepcion: this.newVcPercepcion,
      pensamientos: this.newVcPensamientos,
      sensaciones: this.newVcSensaciones,
      reacciones: this.newVcReacciones,
      sintomas: this.newVcSintomas,
      crisis: this.newVcCrisis
    };
    const vg: VgEntry = {
      sessionNum: nextNum,
      yo: this.newVgYo,
      demas: this.newVgDemas,
      mundo: this.newVgMundo
    };

    const nueva: Omit<Session, 'id' | 'patientId' | 'status'> = {
      number: nextNum,
      date: new Date().toISOString().split('T')[0],
      phase: 'Intervención Estratégica',
      protocol: this.newSessionProtocol,
      dxOp: this.record?.dxOpInicial || 'Fobia de Rendimiento',
      px: [this.newSessionPrescripcion || 'Prescripción de confrontación paradójica'],
      f1: 'Foco en la extinción del control',
      f2: 'Reestructuración analógica',
      oss: this.newSessionNotes || 'Sesión enfocada en la adherencia a la prescripción previa.',
      add: 'Alta adherencia reportada',
      rss: 'Disminución de la angustia anticipatoria',
      eff: 'Desarticulación gradual de la evitación',
      notes: this.newSessionNotes,
      observationsNextSession: 'Revisar bitácora de la peor fantasía.',
      situation: 'En proceso',
      valoracionCambio: vc,
      valoracionGlobal: vg
    };

    this.expedienteRepo.agregarSesion(this.pacienteId, nueva).subscribe({
      next: () => {
        this.cargarDatos();
        this.closeSessionModal();
        this.activeTab = 'tbe';
        this.tbeSubTab = 'sesiones';
      },
      error: (err) => {
        console.error(err);
        alert('Error al registrar la nueva sesión');
      }
    });
  }

  // --- MÉTODOS DE PAGOS ---
  openPaymentModal(): void {
    this.newPayment = {
      concept: `Sesión ${this.sessions.length + 1} - Psicoterapia TBE`,
      amount: 800,
      date: new Date().toISOString().split('T')[0],
      method: 'transferencia',
      status: 'pagado',
      notes: ''
    };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  registrarPago(): void {
    if (!this.newPayment.concept.trim()) {
      alert('Por favor ingrese el concepto del pago.');
      return;
    }
    if (isNaN(this.newPayment.amount) || this.newPayment.amount < 0) {
      alert('Por favor ingrese un monto válido (>= 0).');
      return;
    }
    if (!this.newPayment.date) {
      alert('Por favor ingrese la fecha del pago.');
      return;
    }

    this.isSubmittingPayment = true;
    const pagoNuevo: PagoNuevo = {
      patientId: this.pacienteId,
      concept: this.newPayment.concept.trim(),
      amount: Number(this.newPayment.amount),
      date: this.newPayment.date,
      method: this.newPayment.method,
      status: this.newPayment.status,
      notes: this.newPayment.notes?.trim() || undefined
    };

    this.expedienteRepo.registrarPago(pagoNuevo).subscribe({
      next: () => {
        this.isSubmittingPayment = false;
        this.closePaymentModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.isSubmittingPayment = false;
        console.error(err);
        alert('Error al registrar el pago en el servidor.');
      }
    });
  }

  cambiarEstadoPago(pago: Payment, nuevoEstado: PaymentStatus): void {
    this.expedienteRepo.cambiarEstadoPago(pago.id, nuevoEstado).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => {
        console.error(err);
        alert('Error al actualizar el estado del pago.');
      }
    });
  }

  eliminarPago(pago: Payment): void {
    if (!confirm(`¿Eliminar el pago "${pago.concept}" de $${pago.amount} MXN? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.expedienteRepo.eliminarPago(pago.id).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => {
        console.error(err);
        alert('Error al eliminar el pago.');
      }
    });
  }

  enviarRecordatorioPago(pago: Payment): void {
    const rawPhone = (this.patient?.phone || '').replace(/\D/g, '');
    if (!rawPhone) {
      alert('El paciente no tiene teléfono registrado.');
      return;
    }
    const patientName = this.patient?.name || 'Estimado/a paciente';
    const message = `Hola ${patientName}, te recordamos que tienes un pago pendiente de $${pago.amount} MXN por "${pago.concept}". ¿Podrías realizar el pago? Gracias.`;
    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // --- MÉTODOS DE CONSTANCIAS FÍSICAS ---
  openConstanciaModal(): void {
    const randomFolio = `CONST-2026-${Math.floor(Math.random() * 900 + 100)}-FIS`;
    this.newConstancia = {
      physicalFolio: randomFolio,
      issueDate: new Date().toISOString().split('T')[0],
      type: 'psicoterapeutica',
      issuerName: this.patient?.therapistName || 'Dr. Carlos Mendoza',
      issuerLicense: 'CED-8849302-MX',
      recipient: 'A quien corresponda',
      purpose: 'Acreditación formal de asistencia y continuidad a tratamiento psicoterapéutico',
      periodCovered: `10 de Agosto de 2026 al ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      sessionsCount: this.sessions.length > 0 ? this.sessions.length : 1,
      clinicalSummary: `Se hace constar en documento físico oficial que el/la paciente ${this.patient?.name || ''} se encuentra bajo proceso terapéutico activo en este centro, habiendo cumplido con regularidad y adherencia a sus sesiones programadas.`,
      deliveredTo: `${this.patient?.name || ''} (en mano propia)`,
      scanFileName: '',
      hasPhysicalProof: true
    };
    this.showConstanciaModal = true;
  }

  closeConstanciaModal(): void {
    this.showConstanciaModal = false;
  }

  handleSimulateFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.newConstancia.scanFileName = file.name;
    }
  }

  registrarConstancia(): void {
    if (!this.newConstancia.hasPhysicalProof) {
      alert('Debe confirmar que el documento fue emitido físicamente y firmado en papel.');
      return;
    }
    if (!this.newConstancia.physicalFolio.trim()) {
      alert('Por favor ingrese el folio del documento físico.');
      return;
    }

    this.isSubmittingConstancia = true;
    const payload: ConstanciaNueva = {
      patientId: this.pacienteId,
      physicalFolio: this.newConstancia.physicalFolio.trim(),
      issueDate: this.newConstancia.issueDate,
      type: this.newConstancia.type,
      issuerName: this.newConstancia.issuerName.trim(),
      issuerLicense: this.newConstancia.issuerLicense.trim(),
      recipient: this.newConstancia.recipient.trim(),
      purpose: this.newConstancia.purpose.trim(),
      periodCovered: this.newConstancia.periodCovered.trim(),
      sessionsCount: Number(this.newConstancia.sessionsCount) || 1,
      clinicalSummary: this.newConstancia.clinicalSummary.trim(),
      digitalScanUrl: this.newConstancia.scanFileName.trim() ? this.newConstancia.scanFileName.trim() : undefined,
      scanFileName: this.newConstancia.scanFileName.trim() ? this.newConstancia.scanFileName.trim() : undefined,
      deliveredTo: this.newConstancia.deliveredTo.trim()
    };

    this.expedienteRepo.registrarConstancia(payload).subscribe({
      next: () => {
        this.isSubmittingConstancia = false;
        this.closeConstanciaModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.isSubmittingConstancia = false;
        console.error(err);
        alert('Error al registrar la constancia física en el expediente. Verifique que el folio no esté duplicado.');
      }
    });
  }

  verDetalleConstancia(cert: PhysicalCertificateLog): void {
    this.selectedConstancia = cert;
  }

  cerrarDetalleConstancia(): void {
    this.selectedConstancia = null;
  }

  anularConstancia(cert: PhysicalCertificateLog): void {
    if (!confirm(`¿Anular del registro la constancia con folio ${cert.physicalFolio}?`)) {
      return;
    }
    this.expedienteRepo.anularConstancia(cert.id).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => {
        console.error(err);
        alert('Error al anular la constancia.');
      }
    });
  }

  simularDescargarEscaneo(scanFileName?: string): void {
    alert(`📥 Descargando respaldo escaneado: "${scanFileName || 'constancia_escaneada.pdf'}"`);
  }

  // --- MÉTODOS DE BITÁCORAS DE SUPERVISIÓN ---
  openBitacoraModal(): void {
    this.newBitacora = {
      date: new Date().toISOString().split('T')[0],
      supervisorName: 'Dra. Isabel Cárdenas',
      supervisorLicense: 'CED-9988221-MX',
      sessionNumber: this.sessions.length > 0 ? this.sessions.length : 1,
      spr: 'SPR Fóbico',
      ts: 'Ataque de Pánico',
      problemDefinition: `Cuadro fóbico agudo con evitación situacional. Motivo: "${this.patient?.motif || 'Crisis de ansiedad'}"`,
      currentSituation: 'Evolución favorable con reducción de síntomas tras prescripciones estratégicas iniciales.',
      therapistProblem: 'Dificultad para desmontar la solución intentada de pedir ayuda continua a la familia.',
      rst: 'Fantasía del peor escenario y redefinición paradójica del síntoma.',
      px: 'Worry-Time (WF 30 min) a las 18:00 hrs + Diario de a Bordo.',
      eff: 'Disminución de crisis espontáneas y aumento de autonomía personal.',
      doubt: '¿En qué momento retirar el acompañante familiar al salir a la calle?',
      blocking: 'Miedo a perder el control en transporte público.',
      observations: 'El terapeuta maneja adecuadamente el lenguaje hipnótico e indirecto. Debe mantener la postura no juzgadora.',
      recommendations: 'Prescribir simulacros voluntarios en trayectos cortos sin anunciar a los familiares. Monitorear adherencia en la siguiente sesión.'
    };
    this.showBitacoraModal = true;
  }

  closeBitacoraModal(): void {
    this.showBitacoraModal = false;
  }

  registrarBitacora(): void {
    this.isSubmittingBitacora = true;
    const therapistId = this.roleService.terapeutaIds[0] || this.patient?.therapistId || 'therapist-1';
    const payload: BitacoraNueva = {
      date: this.newBitacora.date,
      supervisorName: this.newBitacora.supervisorName.trim(),
      supervisorLicense: this.newBitacora.supervisorLicense.trim(),
      patientId: this.pacienteId,
      therapistId: therapistId,
      sessionNumber: Number(this.newBitacora.sessionNumber) || 1,
      problemDefinition: this.newBitacora.problemDefinition.trim(),
      currentSituation: this.newBitacora.currentSituation.trim(),
      spr: this.newBitacora.spr,
      ts: this.newBitacora.ts,
      therapistProblem: this.newBitacora.therapistProblem.trim(),
      rst: this.newBitacora.rst.trim(),
      px: this.newBitacora.px.trim(),
      eff: this.newBitacora.eff.trim(),
      doubt: this.newBitacora.doubt.trim(),
      blocking: this.newBitacora.blocking.trim(),
      observations: this.newBitacora.observations.trim(),
      recommendations: this.newBitacora.recommendations.trim()
    };

    this.expedienteRepo.registrarBitacora(payload).subscribe({
      next: () => {
        this.isSubmittingBitacora = false;
        this.closeBitacoraModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.isSubmittingBitacora = false;
        console.error(err);
        alert('Error al guardar la bitácora de supervisión en el servidor.');
      }
    });
  }

  eliminarBitacora(log: SupervisionLog): void {
    if (!confirm(`¿Eliminar la bitácora de la Sesión ${log.sessionNumber}?`)) {
      return;
    }
    this.expedienteRepo.eliminarBitacora(log.id).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => {
        console.error(err);
        alert('Error al eliminar la bitácora de supervisión.');
      }
    });
  }
}
