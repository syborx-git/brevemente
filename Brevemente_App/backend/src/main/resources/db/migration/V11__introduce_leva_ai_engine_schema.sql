-- =============================================================================
-- Migración V7: Esquema del Motor de Inteligencia Clínica LEVA (SDOP)
-- Introducción de Tareas de Transcripción, Propuestas Clínicas Human-in-the-Loop,
-- Detección de Riesgo y Corpus Clínico Cerrado (TBE / DSM-5TR / CIE-11).
-- =============================================================================

-- 1. Tabla de Tareas de Transcripción de Audio --------------------------------
CREATE TABLE IF NOT EXISTS transcription_tasks (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES citas(id) ON DELETE SET NULL,
    paciente_id VARCHAR(36) REFERENCES pacientes(id) ON DELETE SET NULL,
    terapeuta_id VARCHAR(36) REFERENCES terapeutas(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    audio_file_name VARCHAR(255),
    duration_seconds NUMERIC(10, 2) DEFAULT 0.0,
    language_detected VARCHAR(10),
    raw_result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transcription_tasks_session ON transcription_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_transcription_tasks_status  ON transcription_tasks(status);

-- 2. Tabla de Propuestas Clínicas LEVA (Human-in-the-Loop & Riesgo) ------------
CREATE TABLE IF NOT EXISTS leva_clinical_proposals (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES transcription_tasks(id) ON DELETE CASCADE,
    cita_id VARCHAR(36) REFERENCES citas(id) ON DELETE SET NULL,
    paciente_id VARCHAR(36) REFERENCES pacientes(id) ON DELETE SET NULL,
    terapeuta_id VARCHAR(36) REFERENCES terapeutas(id) ON DELETE SET NULL,
    human_review_status VARCHAR(30) NOT NULL DEFAULT 'PROPOSED',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'NONE',
    risk_alert_details JSONB,
    structured_proposal JSONB NOT NULL,
    approved_data JSONB,
    reviewed_by_id VARCHAR(36) REFERENCES terapeutas(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leva_proposals_task    ON leva_clinical_proposals(task_id);
CREATE INDEX IF NOT EXISTS idx_leva_proposals_cita    ON leva_clinical_proposals(cita_id);
CREATE INDEX IF NOT EXISTS idx_leva_proposals_status  ON leva_clinical_proposals(human_review_status);
CREATE INDEX IF NOT EXISTS idx_leva_proposals_risk    ON leva_clinical_proposals(risk_level);

-- 3. Tabla de Corpus Clínico Cerrado (TBE / Manuales / DSM-5TR / CIE-11) -------
CREATE TABLE IF NOT EXISTS clinical_corpus_documents (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    protocol_code VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    source_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_corpus_code     ON clinical_corpus_documents(protocol_code);
CREATE INDEX IF NOT EXISTS idx_clinical_corpus_category ON clinical_corpus_documents(category);

-- 4. Semilla de Protocolos de Terapia Breve Estratégica (TBE) y Guías Clínicas --
INSERT INTO clinical_corpus_documents (id, title, protocol_code, category, content, source_reference)
VALUES
(
    'corp-tbe-001',
    'Protocolo TBE: Ataque de Pánico y Agorafobia',
    'TBE-PANICO-01',
    'PROTOCOLO_TBE',
    'OBJETIVO: Interrumpir la tentativa de solución redundante de evitación y control que hace perder el control. ' ||
    'SISTEMA PERCEPTIVO-REACTIVO: Fóbico. El sujeto intenta controlar sus reacciones fisiológicas espontáneas, ' ||
    'lo que provoca una escalada simbiótica hacia el pánico. ' ||
    'TENTATIVAS DE SOLUCIÓN COMUNES: 1) Evitación sistemática de situaciones y lugares. 2) Búsqueda continua de ayuda y acompañamiento. 3) Hipervigilancia de sensaciones somáticas. ' ||
    'ESTRATAGEMAS Y PRESCRIPCIONES: ' ||
    'a) La Peor Fantasía: Dedicar exactamente media hora diaria en un lugar seguro a imaginar los peores temores hasta saturar la respuesta fóbica ("El miedo mirado a la cara se convierte en valor, el miedo evitado se convierte en pánico"). ' ||
    'b) Diario de a Bordo: Registrar en una pequeña libreta en el momento exacto los síntomas para desviar el foco atencional cognitivo. ' ||
    'REESTRUCTURACIÓN: Quien pide ayuda confirma su incapacidad.',
    'G. Nardone - Miedo, Pánico, Fobias (2000)'
),
(
    'corp-tbe-002',
    'Protocolo TBE: Trastorno Obsesivo-Compulsivo (TOC)',
    'TBE-TOC-02',
    'PROTOCOLO_TBE',
    'OBJETIVO: Doblegar los rituales compulsivos preventivos y propiciatorios. ' ||
    'SISTEMA PERCEPTIVO-REACTIVO: Obsesivo-persecutorio. El sujeto siente que si no realiza el ritual algo catastrófico ocurrirá. ' ||
    'TENTATIVAS DE SOLUCIÓN COMUNES: 1) Ejecución repetitiva de rituales de limpieza, comprobación o conteo mental. 2) Delegación de rituales a seres queridos. 3) Búsqueda de reaseguración. ' ||
    'ESTRATAGEMAS Y PRESCRIPCIONES: ' ||
    'a) Prescripción del Síntoma / Contraritual: Si realizas el ritual 1 vez, estás obligado a realizarlo 5 veces en el mismo momento. Si no lo haces 5 veces, no lo puedes hacer ninguna ("Violación de la regla o multiplicación del ritual"). ' ||
    'b) Bloqueo de respuestas familiares de complicidad.',
    'G. Nardone & Portelli - Obsesiones, Compulsiones, Manías (2013)'
),
(
    'corp-tbe-003',
    'Protocolo TBE: Depresión Reactiva y Desesperanza',
    'TBE-DEPRESION-03',
    'PROTOCOLO_TBE',
    'OBJETIVO: Movilizar la inacción y reestructurar la creencia de incapacidad irreparable tras una pérdida o fracaso. ' ||
    'SISTEMA PERCEPTIVO-REACTIVO: Depresivo/Desilusionado. El sujeto ha renunciado a luchar tras constatar que nada cambia. ' ||
    'TENTATIVAS DE SOLUCIÓN COMUNES: 1) Aislamiento social y encamamiento. 2) Rumiación sobre el pasado. 3) Queja constante sin acción. ' ||
    'ESTRATAGEMAS Y PRESCRIPCIONES: ' ||
    'a) Cómo Empeorar (Il Come Peggiorare): Preguntarse cada mañana: "¿Qué podría hacer o pensar hoy voluntariamente para empeorar aún más mi situación?". Genera aversión y reactividad contraria. ' ||
    'b) La pequeña transgresión placentera diaria no planificada.',
    'Watzlawick & Nardone - Terapia Breve: Filosofía y Arte (1997)'
),
(
    'corp-dsm-004',
    'Criterios Diagnósticos DSM-5TR: Trastorno de Ansiedad Generalizada y Pánico',
    'DSM5TR-ANSIEDAD-04',
    'GUIA_DIAGNOSTICA',
    'CRITERIOS PRINCIPALES ANSIEDAD GENERALIZADA (TAG): ' ||
    'A. Ansiedad y preocupación excesiva persistente durante un mínimo de 6 meses sobre diversos acontecimientos. ' ||
    'B. Dificultad para controlar el estado de preocupación. ' ||
    'C. Al menos 3 de los siguientes síntomas: 1) Inquietud o impaciencia. 2) Fatiga precoz. 3) Dificultad para concentrarse. 4) Irritabilidad. 5) Tensión muscular. 6) Alteraciones del sueño. ' ||
    'CRITERIOS TRASTORNO DE PÁNICO: ' ||
    'Aparición súbita de miedo intenso que alcanza su máxima expresión en minutos acompañado de palpitaciones, sudoración, temblores, disnea, sensación de asfixia y miedo a morir o perder el control.',
    'American Psychiatric Association - DSM-5-TR (2022)'
),
(
    'corp-cie-005',
    'Clasificación CIE-11: 6B00 Trastorno de Ansiedad Generalizada y Trastornos Depresivos',
    'CIE11-6B00-05',
    'GUIA_DIAGNOSTICA',
    'CÓDIGO 6B00: Trastorno de ansiedad generalizada caracterizado por ansiedad marcada y preocupación aprensiva persistente generalizada. ' ||
    'CÓDIGO 6A70: Episodio depresivo único (leve, moderado o grave con o sin síntomas psicóticos). ' ||
    'REGLA CLÍNICA DE SEGURIDAD: En presencia de ideación o planes suicidas, activar de inmediato protocolo de salvaguarda y derivación médica prioritaria.',
    'Organización Mundial de la Salud - CIE-11 (2022)'
)
ON CONFLICT (protocol_code) DO NOTHING;
