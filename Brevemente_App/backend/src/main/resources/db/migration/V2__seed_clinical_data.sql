-- =============================================================================
-- Migración V2: Semilla de datos clínicos de referencia (Basada en brevemente_demo)
-- =============================================================================

INSERT INTO terapeutas (id, nombre, apellidos, email, cedula_profesional, especialidad, activo)
VALUES 
('ter-001', 'Dra. Sofía', 'Ramírez Lozano', 'sofia.ramirez@brevemente.org', 'CED-782190-PSIC', 'Terapia Breve Estratégica', TRUE),
('ter-002', 'Mtro. Alejandro', 'Mendoza Garza', 'alejandro.mendoza@brevemente.org', 'CED-451293-PSIC', 'Supervisión Clínica y TBE', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pacientes (id, nombre, apellidos, curp, fecha_nacimiento, edad_calculada, telefono, email, estado_consentimiento, persona_de_apoyo_nombre)
VALUES
('pac-001', 'Mateo', 'Herrera Santos', 'HESM081105HDFRNT01', '2008-11-05', 17, '+52 55 1234 5678', 'contacto.mateo@familia.mx', 'REPRESENTADO_POR_EDAD', 'Claudia Santos (Madre)'),
('pac-002', 'Valeria', 'Gómez Fuentes', 'GOFV950412MDFRRR03', '1995-04-12', 31, '+52 55 8765 4321', 'valeria.gomez@empresa.mx', 'FIRMADO_TITULAR', NULL),
('pac-003', 'Emiliano', 'Díaz Corona', 'DICE020719HDFLRM09', '2002-07-19', 24, '+52 55 3344 5566', 'emiliano.diaz@universidad.mx', 'PENDIENTE_RECONSENTIMIENTO', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expedientes_clinicos (id, paciente_id, terapeuta_asignado_id, motivo_consulta, intentos_solucion, objetivo_terapeutico, diagnostico_operativo, estatus_expediente)
VALUES
('exp-001', 'pac-001', 'ter-001', 'Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.', 'Evitación activa, solicitar cambio de fechas, rumiación continua.', 'Desarticular la evitación fóbica e instaurar confrontación estratagémica.', 'Fobia de rendimiento / Ansiedad de ejecución', 'ACTIVO'),
('exp-002', 'pac-002', 'ter-001', 'Crisis de pánico con agorafobia incipiente en transporte público.', 'Uso continuo de amuletos, acompañamiento permanente, respiración compulsiva.', 'Extinguir la tentativa de control que genera descontrol.', 'Trastorno de Pánico con Agorafobia', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;
