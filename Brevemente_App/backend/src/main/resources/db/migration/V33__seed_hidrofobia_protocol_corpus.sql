-- =============================================================================
-- Migración V33: Seed de Protocolo Clínico TBE: Hidrofobia y Ansiedad Acuática
-- Inserta documento maestro en clinical_corpus_documents y sus fragmentos semánticos
-- en clinical_corpus_chunks para el motor RAG de LEVA Copilot.
-- =============================================================================

-- 1. Insertar o actualizar el protocolo maestro en clinical_corpus_documents
INSERT INTO clinical_corpus_documents (id, title, protocol_code, category, content, source_reference)
VALUES (
    'corp-tbe-004',
    'Protocolo Clínico TBE: Hidrofobia y Ansiedad Acuática',
    'TBE-PROTOCOLO-HIDRO',
    'PROTOCOLO_TBE',
    'OBJETIVO: Interrumpir la tentativa de solución redundante de evitación fóbica y delegación de auxilio al aproximarse a medios acuáticos, lavabos o inmersión. ' ||
    'SISTEMA PERCEPTIVO-REACTIVO: Fóbico (Miedo paroxístico ante la proximidad o contacto con agua). El paciente intenta controlar deliberadamente reacciones fisiológicas involuntarias (respiración, pulso, temblor), lo que desencadena una escalada simbiótica hacia el pánico, refugiándose en la delegación de tareas higiénicas a familiares y la huida inmediata. ' ||
    'TENTATIVAS DE SOLUCIÓN COMUNES: ' ||
    '1) Evitación activa y absoluta de lavabos llenos, regaderas, albercas y cuerpos de agua. ' ||
    '2) Delegación constante de tareas de aseo y auxilio a familiares para no enfrentar el estímulo fóbico. ' ||
    '3) Intentos infructuosos de control racional previo e hipervigilancia de sensaciones somáticas ante la idea del agua. ' ||
    'PUNTO CLAVE Y ESTRATAGEMAS TBE: ' ||
    'a) La Estratagema de "El Espejo Líquido": Prescripción paradójica donde el paciente se coloca diariamente a las 8:00 AM exactamente durante 5 minutos frente a un lavabo lleno con agua en reposo, mirando únicamente el reflejo en la superficie sin tocar el agua, anotando en una libreta cada sensación experimentada. El miedo mirado de frente se transforma en valor; la saturación visual controlada desarma el circuito fóbico sin permitir la huida. ' ||
    'b) Bloqueo de la delegación familiar: Instruir a la familia a declarar su afecto pero negarse a suplir al paciente en el contacto elemental con el agua, cancelando el beneficio secundario de la invalidez asumida. ' ||
    'REESTRUCTURACIÓN DE AREZZO: Quien pide auxilio confirma en cada acto su incapacidad; el agua no ahoga a quien aprende a mirar su superficie.',
    'Escuela de TBE Arezzo - Protocolos Específicos para Fobias Fisiológicas'
)
ON CONFLICT (protocol_code) DO UPDATE
SET title = EXCLUDED.title,
    content = EXCLUDED.content,
    source_reference = EXCLUDED.source_reference;

-- 2. Limpiar fragmentos previos si existieran para evitar violaciones de clave foránea o duplicación
DELETE FROM clinical_corpus_chunks
WHERE protocol_code = 'TBE-PROTOCOLO-HIDRO'
   OR id IN ('chk-tbe-004-1', 'chk-tbe-004-2');

-- 3. Insertar fragmentos semánticos (chunks) vinculando dinámicamente con el ID real del documento
INSERT INTO clinical_corpus_chunks (id, document_id, protocol_code, chunk_index, title, content, word_count)
SELECT
    'chk-tbe-004-1',
    id,
    'TBE-PROTOCOLO-HIDRO',
    0,
    'Hidrofobia: SPR, Bucle de Evitación y Tentativas Redundantes',
    'OBJETIVO: Interrumpir la tentativa de evitación fóbica y delegación de auxilio ante el agua. SISTEMA PERCEPTIVO-REACTIVO: Fóbico. El paciente intenta controlar deliberadamente reacciones fisiológicas involuntarias, desencadenando una escalada simbiótica hacia el pánico. TENTATIVAS DE SOLUCIÓN COMUNES: 1) Evitación activa de lavabos, regaderas y agua. 2) Delegación constante de auxilio a familiares. 3) Hipervigilancia somática ante la aproximación a medios acuáticos.',
    60
FROM clinical_corpus_documents
WHERE protocol_code = 'TBE-PROTOCOLO-HIDRO'
LIMIT 1;

INSERT INTO clinical_corpus_chunks (id, document_id, protocol_code, chunk_index, title, content, word_count)
SELECT
    'chk-tbe-004-2',
    id,
    'TBE-PROTOCOLO-HIDRO',
    1,
    'Hidrofobia: Punto Clave y Prescripción de El Espejo Líquido',
    'PUNTO CLAVE Y ESTRATAGEMA CENTRAL TBE: La Prescripción de "El Espejo Líquido". Colocarse diariamente a las 8:00 AM exactamente durante 5 minutos frente a un lavabo lleno con agua en reposo, mirando únicamente el reflejo en la superficie sin tocar el agua y anotando en una libreta cada sensación experimentada. La saturación visual controlada desarma la escalada de pánico. Bloqueo de la delegación familiar: cancelar el auxilio que confirma la invalidez asumida.',
    75
FROM clinical_corpus_documents
WHERE protocol_code = 'TBE-PROTOCOLO-HIDRO'
LIMIT 1;

-- 4. Catálogo de protocolos para expedientes
INSERT INTO protocolos (id, nombre, activo)
VALUES ('prot-hidrofobia', 'Hidrofobia y Ansiedad Acuática', TRUE)
ON CONFLICT (id) DO NOTHING;
