import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BitacoraNueva, ConstanciaNueva, ExpedienteRepository, PagoNuevo, SesionParcial } from './ports/expediente.repository';
import { ExpedienteLocalStorageAdapter } from './adapters/expediente-localstorage.adapter';
import { ExpedienteHttpAdapter } from './adapters/expediente-http.adapter';
import {
  Antecedentes,
  AuditLog,
  CategoriaPsicofarmaco,
  ClinicalRecord,
  CriterioCategoria,
  CriterioClinico,
  Establecimiento,
  ExamenMental,
  HábitoPresente,
  OpcionConductual,
  Patient,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PhysicalCertificateLog,
  PhysicalCertificateType,
  RiesgoHeteroagresivo,
  RiesgoSuicida,
  Session,
  SupervisionLog,
  SupervisionRequest,
  VcEntry,
  VgEntry
} from '../../core/types/clinical.types';
import { VcEstado, vcEstadoDeTexto, VC_ESTADO_A_TEXTO, VC_ESCALA } from '../../core/constants/vc-escala';
import { VcSemaphoreComponent } from './components/vc-semaphore/vc-semaphore.component';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

const ANTECEDENTES_VACIO: Antecedentes = {
  personalesPatológicos: {
    médicos: '', quirúrgicos: '', traumáticos: '', alérgicos: '', transfusionales: '', hospitalizaciones: ''
  },
  personalesNoPatológicos: {
    tabaquismo: { presente: false, cantidad: '', tiempo: '' },
    alcoholismo: { presente: false, cantidad: '', frecuencia: '' },
    toxicomanías: { presente: false, tipo: '', tiempo: '' },
    actividadFísica: '',
    alimentación: ''
  },
  heredoFamiliares: {
    enfermedadesMentales: '', enfermedadesCrónicas: '', suicidiosIntentos: '', adicciones: ''
  }
};

interface ExamenParametro {
  clave: string;
  etiqueta: string;
  queEvaluar: string;
  descriptores: string;
}

interface ExamenSeccion {
  clave: string;
  titulo: string;
  parametros: ExamenParametro[];
}

const EXAMEN_SECCIONES: ExamenSeccion[] = [
  {
    clave: 'aparienciaConducta',
    titulo: 'Apariencia y conducta',
    parametros: [
      { clave: 'aspectoGeneral', etiqueta: 'Aspecto general', queEvaluar: 'Presentación, higiene, aliño y complexión.', descriptores: 'Adecuado / Descuidado / Extravagante / Emaciado' },
      { clave: 'actitudEntrevista', etiqueta: 'Actitud ante la entrevista', queEvaluar: 'Disposición y colaboración del paciente.', descriptores: 'Cooperador / Hostil / Evasivo / Seductor' },
      { clave: 'contactoVisual', etiqueta: 'Contacto visual', queEvaluar: 'Cantidad y calidad del contacto ocular.', descriptores: 'Mantenido / Evitado / Fijo / Perdido' },
      { clave: 'actividadPsicomotora', etiqueta: 'Actividad psicomotora', queEvaluar: 'Nivel de actividad global.', descriptores: 'Normal / Hiperactivo / Inhibido / Catatónico' },
      { clave: 'movimientosAnormales', etiqueta: 'Movimientos anormales', queEvaluar: 'Tics, estereotipias y temblores.', descriptores: 'Ausentes / Tics / Temblor / Discinesias' },
      { clave: 'posturaMarcha', etiqueta: 'Postura y marcha', queEvaluar: 'Alineación corporal y deambulación.', descriptores: 'Normal / Encorvada / Rígida / Inestable' }
    ]
  },
  {
    clave: 'concienciaSensorio',
    titulo: 'Conciencia y sensorio',
    parametros: [
      { clave: 'nivelConciencia', etiqueta: 'Nivel de conciencia', queEvaluar: 'Alerta y respuesta a estímulos.', descriptores: 'Alerta / Somnoliento / Obnubilado / Estuporoso' },
      { clave: 'orientación', etiqueta: 'Orientación', queEvaluar: 'Ubicación en tiempo, lugar y persona.', descriptores: 'Orientado / Desorientado' },
      { clave: 'atenciónConcentración', etiqueta: 'Atención y concentración', queEvaluar: 'Capacidad de enfocar y sostener la atención.', descriptores: 'Conservada / Distraído / Disminuida' }
    ]
  },
  {
    clave: 'lenguajeHabla',
    titulo: 'Lenguaje y habla',
    parametros: [
      { clave: 'cantidad', etiqueta: 'Cantidad', queEvaluar: 'Producción verbal espontánea.', descriptores: 'Normal / Verborreico / Pobre / Mutista' },
      { clave: 'velocidadRitmo', etiqueta: 'Velocidad y ritmo', queEvaluar: 'Fluidez del discurso.', descriptores: 'Normal / Taquilalia / Bradilalia / Bloqueos' },
      { clave: 'volumenProsodia', etiqueta: 'Volumen y prosodia', queEvaluar: 'Intensidad y entonación del habla.', descriptores: 'Normal / Elevado / Disminuido / Monótono' },
      { clave: 'articulaciónFluidez', etiqueta: 'Articulación y fluidez', queEvaluar: 'Pronunciación y continuidad del discurso.', descriptores: 'Clara / Disártrico / Tartamudeo' },
      { clave: 'comprensiónDenominaciónRepetición', etiqueta: 'Comprensión, denominación y repetición', queEvaluar: 'Integridad de funciones lingüísticas.', descriptores: 'Conservadas / Alteradas' },
      { clave: 'alteracionesParticulares', etiqueta: 'Alteraciones particulares', queEvaluar: 'Neologismos, parafasias y ecolalia.', descriptores: 'Ninguna / Neologismos / Parafasias / Ecolalia' }
    ]
  },
  {
    clave: 'afectividad',
    titulo: 'Afectividad',
    parametros: [
      { clave: 'estadoÁnimo', etiqueta: 'Estado de ánimo', queEvaluar: 'Tono afectivo predominante.', descriptores: 'Eutímico / Deprimido / Eufórico / Irritable / Ansioso' },
      { clave: 'afecto', etiqueta: 'Afecto', queEvaluar: 'Expresión emocional observable.', descriptores: 'Adecuado / Aplanado / Embotado / Lábil' },
      { clave: 'rangoIntensidad', etiqueta: 'Rango e intensidad', queEvaluar: 'Amplitud de la expresión afectiva.', descriptores: 'Normal / Restringido / Amplio / Intenso' },
      { clave: 'estabilidad', etiqueta: 'Estabilidad', queEvaluar: 'Constancia del afecto durante la entrevista.', descriptores: 'Estable / Lábil' },
      { clave: 'congruenciaAdecuación', etiqueta: 'Congruencia y adecuación', queEvaluar: 'Coherencia del afecto con el contenido.', descriptores: 'Congruente / Incongruente' },
      { clave: 'reactividad', etiqueta: 'Reactividad', queEvaluar: 'Respuesta afectiva ante estímulos.', descriptores: 'Reactivo / Poco reactivo / No reactivo' }
    ]
  },
  {
    clave: 'pensamiento',
    titulo: 'Pensamiento',
    parametros: [
      { clave: 'curso', etiqueta: 'Curso', queEvaluar: 'Velocidad y continuidad del pensamiento.', descriptores: 'Normal / Acelerado / Lentificado / Bloqueado' },
      { clave: 'forma', etiqueta: 'Forma', queEvaluar: 'Organización lógica del pensamiento.', descriptores: 'Lógico / Circunstancial / Tangencial / Descarrilado' },
      { clave: 'ideasDelirantes', etiqueta: 'Ideas delirantes', queEvaluar: 'Creencias falsas fijas e irreductibles.', descriptores: 'Ausentes / Persecutorias / Referenciales / Somáticas / Grandiosas' },
      { clave: 'fenómenosPasividad', etiqueta: 'Fenómenos de pasividad', queEvaluar: 'Vivencia de control externo del pensamiento.', descriptores: 'Ausentes / Inserción / Robo / Difusión del pensamiento' },
      { clave: 'ideasSobrevaloradas', etiqueta: 'Ideas sobrevaloradas', queEvaluar: 'Creencias con fuerte carga afectiva.', descriptores: 'Ausentes / Presentes' },
      { clave: 'obsesionesCompulsiones', etiqueta: 'Obsesiones y compulsiones', queEvaluar: 'Ideas intrusivas y rituales asociados.', descriptores: 'Ausentes / Obsesiones / Compulsiones' },
      { clave: 'fobiasPreocupacionesRumiaciones', etiqueta: 'Fobias, preocupaciones y rumiaciones', queEvaluar: 'Temores y pensamientos recurrentes.', descriptores: 'Ausentes / Presentes' },
      { clave: 'ideaciónSuicidaAutolesivaHomicida', etiqueta: 'Ideación suicida, autolesiva u homicida', queEvaluar: 'Pensamientos de daño hacia sí mismo o a otros.', descriptores: 'Ausente / Pasiva / Activa / Con plan' }
    ]
  },
  {
    clave: 'sensopercepción',
    titulo: 'Sensopercepción',
    parametros: [
      { clave: 'alucinaciones', etiqueta: 'Alucinaciones', queEvaluar: 'Percepciones sin objeto real.', descriptores: 'Ausentes / Auditivas / Visuales / Táctiles / Olfatorias' },
      { clave: 'pseudoalucinacionesAlucinosis', etiqueta: 'Pseudoalucinaciones y alucinosis', queEvaluar: 'Percepciones reconocidas como irreales.', descriptores: 'Ausentes / Presentes' },
      { clave: 'ilusiones', etiqueta: 'Ilusiones', queEvaluar: 'Distorsiones de un estímulo real.', descriptores: 'Ausentes / Presentes' },
      { clave: 'despersonalizaciónDesrealización', etiqueta: 'Despersonalización y desrealización', queEvaluar: 'Vivencia de extrañeza de sí mismo o del entorno.', descriptores: 'Ausentes / Presentes' },
      { clave: 'conductaAlucinatoria', etiqueta: 'Conducta alucinatoria', queEvaluar: 'Conductas derivadas de la alucinación.', descriptores: 'Ausente / Soliloquios / Respuesta a estímulos internos' },
      { clave: 'otrasDistorsiones', etiqueta: 'Otras distorsiones', queEvaluar: 'Otras alteraciones perceptivas.', descriptores: 'Ninguna / Otras' }
    ]
  },
  {
    clave: 'funcionesCognoscitivas',
    titulo: 'Funciones cognoscitivas',
    parametros: [
      { clave: 'memoriaInmediata', etiqueta: 'Memoria inmediata', queEvaluar: 'Retención a corto plazo.', descriptores: 'Conservada / Alterada' },
      { clave: 'memoriaReciente', etiqueta: 'Memoria reciente', queEvaluar: 'Evocación de hechos recientes.', descriptores: 'Conservada / Alterada' },
      { clave: 'memoriaRemota', etiqueta: 'Memoria remota', queEvaluar: 'Evocación de hechos pasados.', descriptores: 'Conservada / Alterada' },
      { clave: 'cálculo', etiqueta: 'Cálculo', queEvaluar: 'Ejecución de operaciones aritméticas.', descriptores: 'Conservado / Alterado' },
      { clave: 'abstracción', etiqueta: 'Abstracción', queEvaluar: 'Pensamiento simbólico y de semejanzas.', descriptores: 'Conservada / Concreta / Alterada' },
      { clave: 'visoespacialPraxiasGnosias', etiqueta: 'Visoespacial, praxias y gnosias', queEvaluar: 'Organización espacial y ejecución motora.', descriptores: 'Conservadas / Alteradas' },
      { clave: 'funcionesEjecutivas', etiqueta: 'Funciones ejecutivas', queEvaluar: 'Planeación, juicio y flexibilidad.', descriptores: 'Conservadas / Alteradas' },
      { clave: 'inteligenciaCaudal', etiqueta: 'Inteligencia y caudal', queEvaluar: 'Nivel intelectual estimado.', descriptores: 'Promedio / Superior / Inferior' }
    ]
  },
  {
    clave: 'juicioIntrospección',
    titulo: 'Juicio e introspección',
    parametros: [
      { clave: 'juicioRealidad', etiqueta: 'Juicio de realidad', queEvaluar: 'Discriminación de lo real.', descriptores: 'Conservado / Alterado' },
      { clave: 'juicioCríticoSocial', etiqueta: 'Juicio crítico y social', queEvaluar: 'Adecuación a normas sociales.', descriptores: 'Conservado / Alterado' },
      { clave: 'introspección', etiqueta: 'Introspección', queEvaluar: 'Conciencia de la propia enfermedad.', descriptores: 'Adecuada / Parcial / Nula' },
      { clave: 'controlImpulsos', etiqueta: 'Control de impulsos', queEvaluar: 'Capacidad de diferir la gratificación.', descriptores: 'Conservado / Disminuido / Ausente' },
      { clave: 'confiabilidad', etiqueta: 'Confiabilidad', queEvaluar: 'Veracidad de la información aportada.', descriptores: 'Fiable / Dudosa / No fiable' }
    ]
  },
  {
    clave: 'funcionesFisiológicas',
    titulo: 'Funciones fisiológicas',
    parametros: [
      { clave: 'sueño', etiqueta: 'Sueño', queEvaluar: 'Patrón de sueño.', descriptores: 'Normal / Insomnio / Hipersomnia / Pesadillas' },
      { clave: 'apetitoPeso', etiqueta: 'Apetito y peso', queEvaluar: 'Ingesta y variación ponderal.', descriptores: 'Normal / Aumentado / Disminuido' },
      { clave: 'libido', etiqueta: 'Libido', queEvaluar: 'Deseo sexual.', descriptores: 'Normal / Aumentada / Disminuida' }
    ]
  }
];

const EXAMEN_RIESGO_ITEMS: Array<{ clave: string; etiqueta: string }> = [
  { clave: 'suicida', etiqueta: 'Suicida' },
  { clave: 'autolesión', etiqueta: 'Autolesión' },
  { clave: 'heteroagresivo', etiqueta: 'Heteroagresivo' },
  { clave: 'abandonoAutocuidado', etiqueta: 'Abandono de autocuidado' },
  { clave: 'vulnerabilidad', etiqueta: 'Vulnerabilidad' },
  { clave: 'fugaAbandono', etiqueta: 'Fuga o abandono' }
];

const EXAMEN_SINTESIS_ITEMS: Array<{ clave: string; etiqueta: string }> = [
  { clave: 'resumenHallazgos', etiqueta: 'Resumen de hallazgos' },
  { clave: 'integraciónSindromática', etiqueta: 'Integración sindromática' },
  { clave: 'impresiónDiagnóstica', etiqueta: 'Impresión diagnóstica' },
  { clave: 'conductaASeguir', etiqueta: 'Conducta a seguir' },
  { clave: 'nombreFirmaEvaluador', etiqueta: 'Nombre y firma del evaluador' }
];

@Component({
  selector: 'app-expediente-clinico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CdkTrapFocus, VcSemaphoreComponent],
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

  activeTab: 'datos' | 'psiquiatria' | 'tbe' | 'pagos' | 'auditoria' | 'supervision' | 'constancias' = 'tbe';
  tbeSubTab: 'dx' | 'sesiones' | 'vc' | 'vg' | 'rst' | 'criterios' = 'dx';
  datosSubTab: 'generales' | 'historia' | 'ficha' = 'generales';
  psiquiatriaSubTab: 'esquema' | 'expediente' = 'expediente';
  selectedSession: Session | null = null;

  // Historia Clínica (estructurada — SDD-HC-3)
  antecedentes: Antecedentes | null = null;
  antecedentesDraft: Antecedentes | null = null;
  editandoPatologicos = false;
  editandoNoPatologicos = false;
  editandoHeredoFamiliares = false;
  editandoRiesgo = false;
  riesgoDraft: {
    riesgoSuicida: RiesgoSuicida | null;
    riesgoSuicidaEspecificar: string;
    riesgoHeteroagresivo: RiesgoHeteroagresivo | null;
    riesgoHeteroagresivoEspecificar: string;
    otrosRiesgos: string;
  } = {
    riesgoSuicida: null,
    riesgoSuicidaEspecificar: '',
    riesgoHeteroagresivo: null,
    riesgoHeteroagresivoEspecificar: '',
    otrosRiesgos: ''
  };
  categoriasPsicofarmacos: CategoriaPsicofarmaco[] = [];
  establecimiento: Establecimiento | null = null;

  // Examen Mental (SDD-HC-3)
  showExamenModal = false;
  showResultadosModal = false;
  examenDraft: ExamenMental = {};
  readonly examenSecciones = EXAMEN_SECCIONES;
  readonly examenRiesgoItems = EXAMEN_RIESGO_ITEMS;
  readonly examenSintesisItems = EXAMEN_SINTESIS_ITEMS;

  // Edición inline de sesión (#102/#103/#104)
  editingField: 'fase' | 'significado' | 'dxOp' | 'spr' | null = null;
  isSavingField = false;

  // Criterios clínicos por sesión (#106/#107/#108)
  criterios: CriterioClinico[] = [];
  opcionesConductuales: OpcionConductual[] = [];
  criteriosAbiertos: Set<string> = new Set(['conductual']);
  categoriasCriterio: CriterioCategoria[] = [
    'conductual', 'racionalizaciones_intelectualizaciones', 'comparaciones', 'imagenes_intrusivas', 'otro'
  ];
  catalogoFases = ['Definición del problema', 'Desbloqueo', 'Consolidación', 'Cierre'];
  catalogoSpr = ['SPR Fóbico', 'SPR Obsesivo-Compulsivo', 'SPR Paranoide', 'SPR Depresivo', 'SPR Dismórfico', 'SPR Hipocondríaco'];

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
      const id = params.get('id');
      if (id) {
        this.pacienteId = id;
        this.cargarDatos();
        return;
      }
      // Ruta /expedientes (sin id): selecciona el primer paciente del caseload.
      this.expedienteRepo.listarPacientes().subscribe(pacientes => {
        this.pacienteId = pacientes.length > 0 ? pacientes[0].id : 'patient-1';
        this.cargarDatos();
      });
    });
  }

  cargarDatos(): void {
    this.expedienteRepo.listarPacientes().subscribe(p => this.pacientes = p);
    this.expedienteRepo.obtenerPaciente(this.pacienteId).subscribe(p => {
      this.patient = p;
      if (p) {
        if (!p.domicilio) p.domicilio = { calleNumero: '', colonia: '', codigoPostal: '', municipio: '', estadoDomicilio: '', telefonoCasa: null, telefonoCelular: null, telefonoTrabajo: null };
        if (!p.contactoEmergencia) p.contactoEmergencia = { nombre: '', parentesco: '', telefono: '' };
        if (p.sedeId) {
          this.expedienteRepo.obtenerSede(p.sedeId).subscribe(s => this.establecimiento = s);
        }
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
    this.expedienteRepo.obtenerExpediente(this.pacienteId).subscribe(r => {
      this.record = r;
      this.antecedentes = r?.antecedentes ?? null;
    });
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
    this.expedienteRepo.listarCategoriasPsicofarmacos().subscribe(c => this.categoriasPsicofarmacos = c);
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

  setTbeSubTab(sub: 'dx' | 'sesiones' | 'vc' | 'vg' | 'rst' | 'criterios'): void {
    this.tbeSubTab = sub;
    if (sub === 'criterios') {
      this.cargarCriterios();
    }
  }

  setDatosSubTab(sub: 'generales' | 'historia' | 'ficha'): void {
    this.datosSubTab = sub;
  }

  setPsiquiatriaSubTab(sub: 'esquema' | 'expediente'): void {
    this.psiquiatriaSubTab = sub;
  }

  // --- Edición inline de sesión (#102, #103, #104) ---
  iniciarEdicion(campo: 'fase' | 'significado' | 'dxOp' | 'spr'): void {
    if (!this.roleService.hasPermission('EXPEDIENTE_ESCRIBIR')) return;
    this.editingField = campo;
  }

  cancelarEdicion(): void {
    this.editingField = null;
    this.isSavingField = false;
  }

  guardarEdicion(): void {
    if (!this.selectedSession || !this.editingField) return;
    const parcial: SesionParcial = {};
    switch (this.editingField) {
      case 'fase': parcial.phase = this.selectedSession.phase; break;
      case 'significado': parcial.significado = this.selectedSession.significado; break;
      case 'dxOp': parcial.dxOp = this.selectedSession.dxOp; break;
      case 'spr': parcial.spr = this.selectedSession.spr; break;
    }
    this.isSavingField = true;
    this.expedienteRepo.actualizarSesion(this.selectedSession.id, parcial).subscribe({
      next: (sesion) => {
        this.selectedSession = { ...this.selectedSession, ...sesion };
        const i = this.sessions.findIndex(x => x.id === sesion.id);
        if (i >= 0) this.sessions[i] = sesion;
        this.cancelarEdicion();
      },
      error: () => this.cancelarEdicion()
    });
  }

  // --- Criterios clínicos (#106, #107, #108) ---
  cargarCriterios(): void {
    if (!this.selectedSession) return;
    this.expedienteRepo.listarCriteriosSesion(this.selectedSession.id).subscribe(c => this.criterios = c);
    this.expedienteRepo.listarOpcionesConductuales().subscribe(o => this.opcionesConductuales = o);
  }

  toggleCriterio(categoria: string): void {
    if (this.criteriosAbiertos.has(categoria)) this.criteriosAbiertos.delete(categoria);
    else this.criteriosAbiertos.add(categoria);
  }

  valorCriterio(categoria: string): string {
    return this.criterios.find(c => c.categoria === categoria)?.valor ?? '';
  }

  setCriterioValor(categoria: CriterioCategoria, valor: string): void {
    const existente = this.criterios.find(c => c.categoria === categoria);
    if (existente) existente.valor = valor;
    else this.criterios.push({ categoria, valor });
  }

  guardarCriterios(): void {
    if (!this.selectedSession) return;
    this.expedienteRepo.guardarCriteriosSesion(this.selectedSession.id, this.criterios).subscribe(c => this.criterios = c);
  }

  estadoVc(texto: string | null | undefined): VcEstado | null {
    return vcEstadoDeTexto(texto);
  }

  vcMeta(texto: string | null | undefined): { etiqueta: string; color: string } | null {
    const e = vcEstadoDeTexto(texto);
    if (!e) return null;
    const m = VC_ESCALA[e];
    return { etiqueta: m.etiqueta, color: m.color };
  }

  setEstadoVc(campo: 'percepcion' | 'pensamientos' | 'sensaciones' | 'reacciones' | 'sintomas' | 'crisis', estado: VcEstado): void {
    const texto = VC_ESTADO_A_TEXTO[estado];
    if (campo === 'percepcion') this.newVcPercepcion = texto;
    else if (campo === 'pensamientos') this.newVcPensamientos = texto;
    else if (campo === 'sensaciones') this.newVcSensaciones = texto;
    else if (campo === 'reacciones') this.newVcReacciones = texto;
    else if (campo === 'sintomas') this.newVcSintomas = texto;
    else this.newVcCrisis = texto;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showPaymentModal) { this.closePaymentModal(); return; }
    if (this.showConstanciaModal) { this.closeConstanciaModal(); return; }
    if (this.showBitacoraModal) { this.closeBitacoraModal(); return; }
    if (this.selectedConstancia) { this.cerrarDetalleConstancia(); return; }
    if (this.showSessionModal) { this.closeSessionModal(); return; }
    if (this.showExamenModal) { this.cerrarExamen(); return; }
    if (this.showResultadosModal) { this.cerrarResultados(); }
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

  guardarDatosGenerales(): void {
    if (!this.patient) return;
    this.expedienteRepo.actualizarPaciente(this.pacienteId, {
      email: this.patient.email,
      rfc: this.patient.rfc,
      sexo: this.patient.sexo,
      lugarNacimiento: this.patient.lugarNacimiento,
      estadoCivil: this.patient.estadoCivil,
      escolaridad: this.patient.escolaridad,
      ocupacion: this.patient.ocupacion,
      religion: this.patient.religion,
      domicilio: this.patient.domicilio,
      contactoEmergencia: this.patient.contactoEmergencia
    }).subscribe(p => { if (p) this.patient = p; });
    if (this.record) {
      this.expedienteRepo.actualizarExpediente(this.pacienteId, {
        tipoExpediente: this.record.tipoExpediente,
        fechaApertura: this.record.fechaApertura
      }).subscribe(r => this.record = r);
    }
  }

  // --- Historia Clínica estructurada (SDD-HC-3) ---
  get personalesPatologicos() {
    return this.antecedentes?.personalesPatológicos ?? ANTECEDENTES_VACIO.personalesPatológicos;
  }

  get personalesNoPatologicos() {
    return this.antecedentes?.personalesNoPatológicos ?? ANTECEDENTES_VACIO.personalesNoPatológicos;
  }

  get heredoFamiliares() {
    return this.antecedentes?.heredoFamiliares ?? ANTECEDENTES_VACIO.heredoFamiliares;
  }

  get draftPatologicos() {
    return this.antecedentesDraft?.personalesPatológicos ?? ANTECEDENTES_VACIO.personalesPatológicos;
  }

  get draftNoPatologicos() {
    return this.antecedentesDraft?.personalesNoPatológicos ?? ANTECEDENTES_VACIO.personalesNoPatológicos;
  }

  get draftHeredoFamiliares() {
    return this.antecedentesDraft?.heredoFamiliares ?? ANTECEDENTES_VACIO.heredoFamiliares;
  }

  // Acceso por clave para el template (el parser de Angular no admite acentos en identificadores)
  antPat(clave: string): string { return (this.personalesPatologicos as any)[clave] ?? ''; }
  draftAntPat(clave: string): string { return (this.draftPatologicos as any)[clave] ?? ''; }
  setAntPat(clave: string, valor: string): void { (this.draftPatologicos as any)[clave] = valor; }

  antNoPat(clave: string): string { return (this.personalesNoPatologicos as any)[clave] ?? ''; }
  draftAntNoPat(clave: string): string { return (this.draftNoPatologicos as any)[clave] ?? ''; }
  setAntNoPat(clave: string, valor: string): void { (this.draftNoPatologicos as any)[clave] = valor; }

  antHer(clave: string): string { return (this.heredoFamiliares as any)[clave] ?? ''; }
  draftAntHer(clave: string): string { return (this.draftHeredoFamiliares as any)[clave] ?? ''; }
  setAntHer(clave: string, valor: string): void { (this.draftHeredoFamiliares as any)[clave] = valor; }

  habitoActual(clave: string): HábitoPresente | undefined {
    return (this.personalesNoPatologicos as any)[clave];
  }

  draftHabito(clave: string): HábitoPresente {
    const h: any = (this.draftNoPatologicos as any)[clave];
    return h && typeof h === 'object' ? h : { presente: false, cantidad: '', tiempo: '', frecuencia: '', tipo: '' };
  }

  habitoResumen(habito: HábitoPresente | undefined): string {
    if (!habito?.presente) return 'No';
    const detalle = [habito.cantidad, habito.tiempo, habito.frecuencia, habito.tipo]
      .filter(x => !!x && !!x.trim()).join(' · ');
    return 'Sí' + (detalle ? ' — ' + detalle : '');
  }

  private clonarAntecedentes(a: Antecedentes | null): Antecedentes {
    const base: Antecedentes = JSON.parse(JSON.stringify(ANTECEDENTES_VACIO));
    if (!a) return base;
    base.personalesPatológicos = { ...base.personalesPatológicos, ...(a.personalesPatológicos ?? {}) };
    base.personalesNoPatológicos = {
      tabaquismo: { ...base.personalesNoPatológicos.tabaquismo, ...(a.personalesNoPatológicos?.tabaquismo ?? {}) },
      alcoholismo: { ...base.personalesNoPatológicos.alcoholismo, ...(a.personalesNoPatológicos?.alcoholismo ?? {}) },
      toxicomanías: { ...base.personalesNoPatológicos.toxicomanías, ...(a.personalesNoPatológicos?.toxicomanías ?? {}) },
      actividadFísica: a.personalesNoPatológicos?.actividadFísica ?? '',
      alimentación: a.personalesNoPatológicos?.alimentación ?? ''
    };
    base.heredoFamiliares = { ...base.heredoFamiliares, ...(a.heredoFamiliares ?? {}) };
    return base;
  }

  hasPatologicosData(): boolean {
    return Object.values(this.personalesPatologicos).some(v => !!v && !!v.trim());
  }

  hasNoPatologicosData(): boolean {
    const n = this.personalesNoPatologicos;
    return !!n.tabaquismo?.presente || !!n.alcoholismo?.presente || !!n.toxicomanías?.presente
      || !!(n.actividadFísica?.trim()) || !!(n.alimentación?.trim());
  }

  hasHeredoFamiliaresData(): boolean {
    return Object.values(this.heredoFamiliares).some(v => !!v && !!v.trim());
  }

  hasRiesgoData(): boolean {
    return !!this.record?.riesgoSuicida || !!this.record?.riesgoHeteroagresivo
      || !!(this.record?.riesgoSuicidaEspecificar?.trim())
      || !!(this.record?.riesgoHeteroagresivoEspecificar?.trim())
      || !!(this.record?.otrosRiesgos?.trim());
  }

  hasExamenMentalData(): boolean {
    const em: any = this.record?.examenMental;
    if (!em) return false;
    return Object.keys(em).some(seccion => {
      const val = em[seccion];
      if (val && typeof val === 'object') {
        return Object.values(val).some((v: any) => {
          if (v && typeof v === 'object') {
            return Object.values(v).some(x => x !== null && x !== undefined && x !== '');
          }
          return v !== null && v !== undefined && v !== '';
        });
      }
      return false;
    });
  }

  get examenImpresionDiagnostica(): string {
    return (this.record?.examenMental as any)?.síntesis?.impresiónDiagnóstica ?? '';
  }

  get examenFechaTexto(): string {
    const f = this.record?.fechaExamenMental;
    if (!f) return '';
    return new Date(`${f}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  editarAntecedentes(card: 'patologicos' | 'noPatologicos' | 'heredoFamiliares'): void {
    if (!this.roleService.hasPermission('EXPEDIENTE_ESCRIBIR')) return;
    this.antecedentesDraft = this.clonarAntecedentes(this.antecedentes);
    if (card === 'patologicos') this.editandoPatologicos = true;
    else if (card === 'noPatologicos') this.editandoNoPatologicos = true;
    else this.editandoHeredoFamiliares = true;
  }

  cancelarAntecedentes(): void {
    this.editandoPatologicos = false;
    this.editandoNoPatologicos = false;
    this.editandoHeredoFamiliares = false;
    this.antecedentesDraft = null;
  }

  guardarAntecedentes(): void {
    if (!this.antecedentesDraft) return;
    this.expedienteRepo.actualizarExpediente(this.pacienteId, { antecedentes: this.antecedentesDraft }).subscribe(r => {
      this.record = r;
      this.antecedentes = r?.antecedentes ?? null;
      this.cancelarAntecedentes();
    });
  }

  editarRiesgo(): void {
    if (!this.roleService.hasPermission('EXPEDIENTE_ESCRIBIR')) return;
    this.riesgoDraft = {
      riesgoSuicida: this.record?.riesgoSuicida ?? null,
      riesgoSuicidaEspecificar: this.record?.riesgoSuicidaEspecificar ?? '',
      riesgoHeteroagresivo: this.record?.riesgoHeteroagresivo ?? null,
      riesgoHeteroagresivoEspecificar: this.record?.riesgoHeteroagresivoEspecificar ?? '',
      otrosRiesgos: this.record?.otrosRiesgos ?? ''
    };
    this.editandoRiesgo = true;
  }

  cancelarRiesgo(): void {
    this.editandoRiesgo = false;
  }

  guardarRiesgo(): void {
    this.expedienteRepo.actualizarExpediente(this.pacienteId, {
      riesgoSuicida: this.riesgoDraft.riesgoSuicida ?? undefined,
      riesgoSuicidaEspecificar: this.riesgoDraft.riesgoSuicidaEspecificar,
      riesgoHeteroagresivo: this.riesgoDraft.riesgoHeteroagresivo ?? undefined,
      riesgoHeteroagresivoEspecificar: this.riesgoDraft.riesgoHeteroagresivoEspecificar,
      otrosRiesgos: this.riesgoDraft.otrosRiesgos
    }).subscribe(r => {
      this.record = r;
      this.editandoRiesgo = false;
    });
  }

  // --- Examen Mental (SDD-HC-3) ---
  abrirExamen(): void {
    const prev: any = this.record?.examenMental;
    this.examenDraft = prev && Object.keys(prev).length > 0 ? JSON.parse(JSON.stringify(prev)) : {};
    this.showExamenModal = true;
  }

  cerrarExamen(): void {
    this.showExamenModal = false;
  }

  hallazgoTexto(seccion: string, parametro: string): string {
    const s: any = (this.examenDraft as any)[seccion];
    return s && typeof s[parametro] === 'string' ? s[parametro] : '';
  }

  setHallazgoTexto(seccion: string, parametro: string, valor: string): void {
    const d: any = this.examenDraft;
    if (!d[seccion]) d[seccion] = {};
    d[seccion][parametro] = valor;
  }

  riesgoNivel(clave: string): string {
    const item: any = (this.examenDraft as any).evaluaciónRiesgo?.[clave];
    return item && typeof item === 'object' ? (item.nivel ?? '') : '';
  }

  setRiesgoNivel(clave: string, nivel: string): void {
    const d: any = this.examenDraft;
    if (!d.evaluaciónRiesgo) d.evaluaciónRiesgo = {};
    if (!d.evaluaciónRiesgo[clave] || typeof d.evaluaciónRiesgo[clave] !== 'object') {
      d.evaluaciónRiesgo[clave] = { nivel: '', hallazgo: '' };
    }
    d.evaluaciónRiesgo[clave].nivel = nivel;
  }

  riesgoHallazgo(clave: string): string {
    const item: any = (this.examenDraft as any).evaluaciónRiesgo?.[clave];
    return item && typeof item === 'object' ? (item.hallazgo ?? '') : '';
  }

  setRiesgoHallazgo(clave: string, hallazgo: string): void {
    const d: any = this.examenDraft;
    if (!d.evaluaciónRiesgo) d.evaluaciónRiesgo = {};
    if (!d.evaluaciónRiesgo[clave] || typeof d.evaluaciónRiesgo[clave] !== 'object') {
      d.evaluaciónRiesgo[clave] = { nivel: '', hallazgo: '' };
    }
    d.evaluaciónRiesgo[clave].hallazgo = hallazgo;
  }

  sintesisTexto(clave: string): string {
    const s: any = (this.examenDraft as any).síntesis;
    return s && typeof s[clave] === 'string' ? s[clave] : '';
  }

  setSintesisTexto(clave: string, valor: string): void {
    const d: any = this.examenDraft;
    if (!d.síntesis) d.síntesis = {};
    d.síntesis[clave] = valor;
  }

  guardarExamen(): void {
    const examenMental: ExamenMental = JSON.parse(JSON.stringify(this.examenDraft));
    this.expedienteRepo.actualizarExpediente(this.pacienteId, {
      examenMental,
      fechaExamenMental: new Date().toISOString().split('T')[0]
    }).subscribe(r => {
      this.record = r;
      this.showExamenModal = false;
    });
  }

  verResultados(): void {
    if (!this.hasExamenMentalData()) return;
    const prev: any = this.record?.examenMental;
    this.examenDraft = prev ? JSON.parse(JSON.stringify(prev)) : {};
    this.showResultadosModal = true;
  }

  cerrarResultados(): void {
    this.showResultadosModal = false;
  }

  agregarFarmaco(): void {
    if (!this.record) return;
    const drugs = [...(this.record.drugsList || [])];
    drugs.push({ id: `drug-${Date.now()}`, name: '', doseMorning: '', doseAfternoon: '', doseNight: '', eff: '', notes: '', categoria: 'otros' });
    this.record.drugsList = drugs;
  }
  eliminarFarmaco(drugId: string): void {
    if (!this.record) return;
    this.record.drugsList = (this.record.drugsList || []).filter(d => d.id !== drugId);
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
    alert(`Descargando respaldo escaneado: "${scanFileName || 'constancia_escaneada.pdf'}"`);
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
