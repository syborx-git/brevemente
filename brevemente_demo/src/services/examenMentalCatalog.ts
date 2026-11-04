/**
 * Catálogos del Examen del Estado Mental (SDD-HC-3).
 * Espejo de EXAMEN_SECCIONES / EXAMEN_RIESGO_ITEMS / EXAMEN_SINTESIS_ITEMS
 * del fullstack (expediente-clinico.component.ts).
 */

export interface ExamenParametro {
  clave: string;
  etiqueta: string;
  queEvaluar: string;
  descriptores: string;
}

export interface ExamenSeccion {
  clave: string;
  titulo: string;
  parametros: ExamenParametro[];
}

export const EXAMEN_SECCIONES: ExamenSeccion[] = [
  {
    clave: 'aparienciaConducta', titulo: 'Apariencia y conducta',
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
    clave: 'concienciaSensorio', titulo: 'Conciencia y sensorio',
    parametros: [
      { clave: 'nivelConciencia', etiqueta: 'Nivel de conciencia', queEvaluar: 'Alerta y respuesta a estímulos.', descriptores: 'Alerta / Somnoliento / Obnubilado / Estuporoso' },
      { clave: 'orientación', etiqueta: 'Orientación', queEvaluar: 'Ubicación en tiempo, lugar y persona.', descriptores: 'Orientado / Desorientado' },
      { clave: 'atenciónConcentración', etiqueta: 'Atención y concentración', queEvaluar: 'Capacidad de enfocar y sostener la atención.', descriptores: 'Conservada / Distraído / Disminuida' }
    ]
  },
  {
    clave: 'lenguajeHabla', titulo: 'Lenguaje y habla',
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
    clave: 'afectividad', titulo: 'Afectividad',
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
    clave: 'pensamiento', titulo: 'Pensamiento',
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
    clave: 'sensopercepción', titulo: 'Sensopercepción',
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
    clave: 'funcionesCognoscitivas', titulo: 'Funciones cognoscitivas',
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
    clave: 'juicioIntrospección', titulo: 'Juicio e introspección',
    parametros: [
      { clave: 'juicioRealidad', etiqueta: 'Juicio de realidad', queEvaluar: 'Discriminación de lo real.', descriptores: 'Conservado / Alterado' },
      { clave: 'juicioCríticoSocial', etiqueta: 'Juicio crítico y social', queEvaluar: 'Adecuación a normas sociales.', descriptores: 'Conservado / Alterado' },
      { clave: 'introspección', etiqueta: 'Introspección', queEvaluar: 'Conciencia de la propia enfermedad.', descriptores: 'Adecuada / Parcial / Nula' },
      { clave: 'controlImpulsos', etiqueta: 'Control de impulsos', queEvaluar: 'Capacidad de diferir la gratificación.', descriptores: 'Conservado / Disminuido / Ausente' },
      { clave: 'confiabilidad', etiqueta: 'Confiabilidad', queEvaluar: 'Veracidad de la información aportada.', descriptores: 'Fiable / Dudosa / No fiable' }
    ]
  },
  {
    clave: 'funcionesFisiológicas', titulo: 'Funciones fisiológicas',
    parametros: [
      { clave: 'sueño', etiqueta: 'Sueño', queEvaluar: 'Patrón de sueño.', descriptores: 'Normal / Insomnio / Hipersomnia / Pesadillas' },
      { clave: 'apetitoPeso', etiqueta: 'Apetito y peso', queEvaluar: 'Ingesta y variación ponderal.', descriptores: 'Normal / Aumentado / Disminuido' },
      { clave: 'libido', etiqueta: 'Libido', queEvaluar: 'Deseo sexual.', descriptores: 'Normal / Aumentada / Disminuida' }
    ]
  }
];

export const EXAMEN_RIESGO_ITEMS: Array<{ clave: string; etiqueta: string }> = [
  { clave: 'suicida', etiqueta: 'Suicida' },
  { clave: 'autolesión', etiqueta: 'Autolesión' },
  { clave: 'heteroagresivo', etiqueta: 'Heteroagresivo' },
  { clave: 'abandonoAutocuidado', etiqueta: 'Abandono de autocuidado' },
  { clave: 'vulnerabilidad', etiqueta: 'Vulnerabilidad' },
  { clave: 'fugaAbandono', etiqueta: 'Fuga o abandono' }
];

export const EXAMEN_SINTESIS_ITEMS: Array<{ clave: string; etiqueta: string }> = [
  { clave: 'resumenHallazgos', etiqueta: 'Resumen de hallazgos' },
  { clave: 'integraciónSindromática', etiqueta: 'Integración sindromática' },
  { clave: 'impresiónDiagnóstica', etiqueta: 'Impresión diagnóstica' },
  { clave: 'conductaASeguir', etiqueta: 'Conducta a seguir' },
  { clave: 'nombreFirmaEvaluador', etiqueta: 'Nombre y firma del evaluador' }
];
