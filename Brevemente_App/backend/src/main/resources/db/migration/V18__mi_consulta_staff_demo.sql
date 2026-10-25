-- =============================================================================
-- Migración V18: Mi Consulta (staff) — permiso de alertas + seed demo
-- Sucede a V1..V17. Idempotente.
-- =============================================================================

-- 1. Permiso ALERTAS_GESTIONAR (resolución de alertas de crisis por el staff) --
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-025', 'ALERTAS_GESTIONAR', 'CONSULTA',
     'Resolver alertas de crisis y seguridad clínica de los pacientes (staff)')
ON CONFLICT (codigo) DO NOTHING;

-- Roles con permiso de resolución: admin_platform, admin_clinical, therapist,
-- supervisor. No se otorga a assistant (rol-004) ni patient (rol-006).
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.id
FROM (VALUES ('rol-001'), ('rol-002'), ('rol-003'), ('rol-005')) AS r(rol_id)
CROSS JOIN permisos p
WHERE p.codigo = 'ALERTAS_GESTIONAR'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 2. Seed de citas "hoy" para el terapeuta demo (GAP-MC-09) -------------------
-- 2026-10-21 es miércoles laborable. pac-002 es adulta (FIRMADO_TITULAR): no
-- activa el bloqueo normativo (a diferencia de pac-001, menor).
INSERT INTO citas (id, paciente_id, terapeuta_id, expediente_id,
                   fecha_hora_inicio, fecha_hora_fin, tipo_cita, modalidad,
                   estado_cita, duracion_minutos, consultorio, payment_status,
                   bloqueada_por_normativa)
VALUES
    ('cit-200','pac-002','ter-001','exp-002',
     '2026-10-21T09:00:00-06:00','2026-10-21T09:45:00-06:00','seguimiento','PRESENCIAL',
     'confirmada',45,'A','pendiente',FALSE),
    ('cit-201','pac-002','ter-001','exp-002',
     '2026-10-21T11:00:00-06:00','2026-10-21T11:30:00-06:00','seguimiento','ONLINE',
     'pendiente',30,NULL,'pendiente',FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed de alerta de crisis activa (GAP-MC-04) ------------------------------
INSERT INTO alerta_paciente (id, paciente_id, tipo, mensaje, estado, created_at) VALUES
    ('alerta-pac-002','pac-002','crisis',
     'ALERTA ROJA: El paciente activó el Botón de Crisis de emergencia desde su portal.',
     'activa','2026-10-21T08:00:00-06:00')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed de sesión borrador vinculada a la cita de hoy (GAP-MC-06) -----------
-- exp-002 ya tiene sesiones numero 1 y 2 → numero 3 respeta ux_sesiones_expediente_numero.
INSERT INTO sesiones (id, expediente_id, numero, fecha, status, creado_por_id, cita_id, notas) VALUES
    ('ses-005','exp-002',3,'2026-10-21','borrador','ter-001','cit-200',
     'Borrador sugerido por LEVA: prescribir la maniobra de la peor fantasía de 30 minutos.')
ON CONFLICT (id) DO NOTHING;
