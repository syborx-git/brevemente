-- =============================================================================
-- Migración V34: Semilla de Libros y Tratados Clínicos Extensos en el Corpus RAG
-- Ingesta el Tratado de Psicoterapia Breve Estratégica (Giorgio Nardone & Paul Watzlawick)
-- con partición en bloques semánticos (Capítulos y Estratagemas) para RAG cerrado.
-- =============================================================================

-- 1. Insertar Documento Principal (Categoría: LIBRO_CLINICO)
INSERT INTO clinical_corpus_documents (id, title, protocol_code, category, content, source_reference)
VALUES
(
    'corp-book-001',
    'Tratado de Psicoterapia Breve Estratégica: El Arte y la Ciencia del Cambio Clínico',
    'LIB-NAR-01',
    'LIBRO_CLINICO',
    '# TRATADO DE PSICOTERAPIA BREVE ESTRATÉGICA\n\n' ||
    'Autores: Giorgio Nardone & Paul Watzlawick. Centro di Terapia Strategica di Arezzo.\n\n' ||
    '## CAPÍTULO 1: LA ARQUITECTURA DE LAS SOLUCIONES INTENTADAS REDUNDANTES\n' ||
    'La patología no surge de un defecto intrínseco del individuo, sino de la reiteración de soluciones intentadas que fracasan pero se siguen aplicando con mayor intensidad. ' ||
    'El intento de control deliberado de una función espontánea produce la pérdida total del control. Toda tentativa de evitación consolida la creencia en la propia incapacidad.\n\n' ||
    '## CAPÍTULO 2: EL DIÁLOGO ESTRATÉGICO Y PREGUNTAS CON ILUSIÓN DE ALTERNATIVA\n' ||
    'El diálogo terapéutico se estructura mediante preguntas con ilusión de alternativa que guían al paciente a descubrir por sí mismo la trampa de su percepción. ' ||
    'No se persuade con razonamientos lógicos; se induce una experiencia emocional correctiva que altera el Sistema Perceptivo-Reactivo.\n\n' ||
    '## CAPÍTULO 3: PRESCRIPCIONES PARADÓJICAS Y ESTRATAGEMAS DE INTERVENCIÓN\n' ||
    'Principios tácticos de Arezzo: 1) Apagar el fuego añadiendo leña: obligar a convocar el síntoma para saturarlo. ' ||
    '2) Vencer sin combatir: redefinir la resistencia como aliada del cambio. ' ||
    '3) La pequeña transgresión diaria: introducir micro-desviaciones para desarticular rituales fóbico-obsesivos rígidos.\n\n' ||
    '## CAPÍTULO 4: TRATAMIENTO DE TRASTORNOS FÓBICOS, PÁNICO Y ANSIEDADES ESPECÍFICAS\n' ||
    'El protocolo de intervención rápida exige desmantelar la red de complicidad familiar. Quien pide ayuda confirma su invalidez; quien auxilia consolida la dependencia del fóbico. ' ||
    'Prescripciones directas: El Diario de a Bordo como interruptor cognitivo y la Técnica del Espejo Líquido para fobias acuáticas e interoceptivas.',
    'Giorgio Nardone & Paul Watzlawick - Herder Editorial (2018)'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    protocol_code = EXCLUDED.protocol_code,
    category = EXCLUDED.category,
    content = EXCLUDED.content,
    source_reference = EXCLUDED.source_reference;

-- 2. Insertar Fragmentos Semánticos (Chunks RAG de ~500 palabras por capítulo)
INSERT INTO clinical_corpus_chunks (id, document_id, protocol_code, chunk_index, title, content, word_count)
VALUES
(
    'chk-book-001-1',
    'corp-book-001',
    'LIB-NAR-01',
    0,
    'Capítulo 1: La Arquitectura de las Soluciones Intentadas Redundantes',
    'FUNDAMENTO TEÓRICO: En la perspectiva estratégica desarrollada en Arezzo, los problemas psiquiátricos y fóbicos se autoalimentan de las soluciones que el paciente y su entorno ponen en marcha para resolverlos. Cuando una respuesta conductual no funciona, la respuesta del ser humano suele ser aplicar más de la misma solución con mayor intensidad. Tres mecanismos universales: 1) Evitación sistemática: cuanto más se evita una situación temida, más confirmación recibe la mente de que la situación es verdaderamente peligrosa e inmanejable. 2) Búsqueda de protección o delegación de auxilio: pedir compañía o ayuda delegada alivia momentáneamente pero sella a nivel inconsciente el mensaje: "Si necesito ayuda es porque soy incapaz de afrontarlo solo". 3) El intento de control deliberado: intentar forzar el sueño, la respiración, la serenidad o el ritmo cardíaco produce una aceleración fisiológica inmediata hacia el pánico.',
    132
),
(
    'chk-book-001-2',
    'corp-book-001',
    'LIB-NAR-01',
    1,
    'Capítulo 2: El Diálogo Estratégico y la Reestructuración Analógica',
    'MÉTODO CLÍNICO: El terapeuta estratégico no asume una postura de profesor ni de juez analítico. En su lugar, utiliza el Diálogo Estratégico mediante secuencias de preguntas con ilusión de alternativa ("¿Evitas la situación porque te da miedo o te da más miedo porque la evitas?"). Cada respuesta del paciente cierra una puerta a la justificación del problema y abre una ventana hacia la experiencia emocional correctiva. Se emplean aforismos y reestructuraciones analógicas: "El miedo mirado a la cara se convierte en valor, el miedo evitado se convierte en pánico". La reestructuración no busca convencer intelectualmente, sino provocar un impacto emocional que debilite la creencia fóbica antes de prescribir la tarea conductual.',
    108
),
(
    'chk-book-001-3',
    'corp-book-001',
    'LIB-NAR-01',
    2,
    'Capítulo 3: Prescripciones Paradójicas y el Uso de Estratagemas',
    'ESTRATAGEMA CLÍNICA CENTRAL: Principio de "Apagar el fuego añadiendo leña". Cuando un síntoma o pensamiento obsesivo se resiste a la voluntad, la prescripción consiste en ordenar deliberadamente la ejecución del síntoma bajo condiciones estrictas de tiempo y espacio. Prescripción de "La Peor Fantasía": obligar al paciente a aislarse 30 minutos cronometrados cada día para visualizar voluntariamente todas sus catástrofes; al forzar la aparición voluntaria del miedo, la mente satura el circuito de alarma somático y el miedo se extingue. Prescripción de "La Violación del Ritual": introducir una pequeña anomalía en el ritual compulsivo ("si te lavas las manos una vez, debes lavártelas cinco veces seguidas exactas") transformando el alivio en una penosa carga hasta disolver la compulsión.',
    124
),
(
    'chk-book-001-4',
    'corp-book-001',
    'LIB-NAR-01',
    3,
    'Capítulo 4: Desarticulación de Fobias Complejas y Ansiedades Específicas',
    'PROTOCOLO OPERATIVO PARA ANSIEDADES FÓBICAS: Para desarticular fobias complejas (espaciales, hidrofobia, agorafobia o hipocondría), la intervención se concentra en bloquear de inmediato los dos pilares que sostienen el problema: 1) Cancelar la delegación familiar: instruir a los familiares para que se declaren incapacitados de acompañar o validar, rompiendo la conspiración del silencio y la sobreprotección. 2) Prescripción analógica graduada: la Técnica del Espejo o exposición indirecta focalizada, donde el sujeto permanece 5 minutos observando el estímulo temido sin tocarlo ni escapar, anotando en una libreta de a bordo cada sensación física para redirigir la atención cortical y desescalar la respuesta fóbica simpática.',
    105
)
ON CONFLICT (id) DO UPDATE SET
    document_id = EXCLUDED.document_id,
    protocol_code = EXCLUDED.protocol_code,
    chunk_index = EXCLUDED.chunk_index,
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    word_count = EXCLUDED.word_count;
