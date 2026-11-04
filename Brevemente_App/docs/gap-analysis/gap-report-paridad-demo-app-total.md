# GAP Report: Paridad Total DEMO (React) ↔ APP REAL (Angular)

- **Fecha**: 2026-11-03
- **Alcance**: Todo el sistema, módulo por módulo, tab por tab
- **Estado**: AUDITADO (STRICT READ-ONLY)
- **Método**: 6 auditorías paralelas de solo lectura comparando UI, campos, filtros, tablas, modales y datos de seed.
- **Dirección**: la DEMO (`brevemente_demo`) debe reflejar fielmente a la APP REAL (`Brevemente_App/frontend`).

---

## 0. Inventario de rutas y mapeo

| # | Módulo | APP (Angular) | DEMO (React) |
| :-- | :-- | :-- | :-- |
| 1 | Dashboard | `/dashboard` | `/` |
| 2 | Pacientes | `/pacientes` | `/pacientes` |
| 3 | Expediente clínico | `/expedientes`, `/expedientes/:id` | `/expedientes` |
| 4 | Agenda | `/agenda` | `/agenda` |
| 5 | Asistente LEVA | `/asistente-leva` | `/leva` |
| 6 | Supervisión | `/supervision` | `/supervision` |
| 7 | Biblioteca | `/biblioteca` | `/biblioteca` |
| 8 | Campus | `/campus` | `/campus` |
| 9 | Desempeño | `/desempeno` | `/desempeno` |
| 10 | Configuración | `/configuracion` | `/configuracion` |
| 11 | Auditoría y seguridad | `/auditoria` | `/auditoria` |
| 12 | Mi Consulta | `/mi-consulta` | `/mi-consulta` |
| 13 | Portal del paciente | `/mi-historial` | `/mi-historial` |
| 14 | Login | `/login` | — (demo usa selector de rol en header) |
| — | Intake / Consentimiento | (vive en `pacientes` + `expediente-clinico`) | `/intake` (`IntakeForm.tsx`) |

**Conclusión de cobertura**: 13 de 14 módulos mapean 1:1. La demo no tiene `login` (usa selector de rol); la app no tiene intake orientado al paciente como ruta separada (el consentimiento vive en pacientes/expediente).

---

## 1. Hallazgo transversal (IMPORTANTE)

La paridad **no es unidireccional**. La auditoría encontró:

- **Brechas APP → DEMO** (lo que la demo NO tiene): sobre todo en **Expediente** (examen mental, datos generales, VC semáforo, edición inline de sesión), **Pacientes** (alta con RFC/domicilio/contacto/sede), **Agenda** (banner normativo, cancelación con WhatsApp, consultorio), **Configuración** (sedes editables, historial de cambios).
- **Brechas DEMO → APP** (lo que la DEMO tiene de más): en **Mi Consulta** (modales de crisis, acordeón secundario, botones de acción), **Supervisión** (pestaña de revisión de grabaciones, panel de casos pendientes), **Auditoría** (búsqueda, filtro, resolución de alertas, actas), **Campus** (4 tabs completos vs placeholder), **Desempeño** (4 subtabs vs 1).

> **Implicación**: en varios módulos la APP REAL está más "maqueteada" que la DEMO. Si el objetivo es que la DEMO refleje la APP, primero hay que decidir qué lado es la fuente de verdad por módulo. Ver §5.

---

## 2. Matriz de brechas por módulo

### 2.1 Dashboard
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| D-01 | MISSING | Botones de cabecera "Nuevo Paciente" y "Agendar Cita" no existen en la demo | Alta |
| D-02 | INCORRECT | Cabecera: app usa "Nuevo Paciente"/"Agendar Cita"; demo usa "Demo Guiada"; LEVA apunta a `/leva` vs `/asistente-leva` | Media |
| D-03 | INCORRECT | Filtro de **periodo**: en la app está oculto en cabecera y movido dentro de la gráfica; en la demo está en cabecera | Alta |
| D-04 | PARTIAL | Filtro de **terapeuta**: app solo admin/supervisor; demo siempre visible | Media |
| D-05 | INCORRECT | Filtro de **protocolo**: app 2 opciones hardcodeadas inconsistentes con su propia gráfica | Alta |
| D-06/D-07/D-15 | DATA | Catálogos de terapeutas y protocolos distintos (demo = semilla pac-*/ter-*; app = Dr. Silva/Patricia + 4 protocolos) | Alta |
| D-08 | DATA | Gráfica "Casos por Protocolo": app 4 barras; demo 3 | Media |
| D-09/D-10 | INCORRECT | Drilldown "Pacientes": app CURP·edad y truncado a 4; demo motivo truncado y lista completa | Media |
| D-11 | INCORRECT | Drilldown "Citas": app solo citas de hoy; demo citas filtradas | Baja |
| D-12/D-13 | DATA | Alerta de Mayoría de Edad: app la activa con seed (Leonardo, 18); demo no la activa con ningún paciente | Alta |
| D-14 | INCORRECT | Modalidad en filtros: app mayúsculas; demo minúsculas | Baja |
| D-16 | INCORRECT | Vista paciente "Hoy, 24 de Agosto 2026" hardcodeado en app; demo dinámico | Baja |
| D-17 | INCORRECT | "Pendientes → Ver todos": app → `/pacientes`; demo → `/expedientes` | Baja |
| D-18 | DATA | Gráfica "Citas completadas": app meses fijos; demo últimos 3 meses reales | Baja |

### 2.2 Mi Consulta
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| C-01 | MISSING | Badge "Simulación" de la app | Baja |
| C-03 | MISSING | Botones de acción ("Atender/Preparar", "Detener y procesar", "Redactar nota") NO navegan en la app; la demo sí navega | Alta |
| C-06 | INCORRECT | Agenda del día: app modalidad real; demo "Presencial" hardcodeado | Media |
| C-07…C-14 | DEMO→APP | Acordeón de información secundaria, modales CrisisResolution/CrisisIncident, botón "Atender Solicitud", control por rol, "Revisar e Insertar Borrador": presentes en demo, ausentes en app | Alta |
| C-15 | DATA | Seed de pacientes/terapeutas distinto | Alta |

### 2.3 Expediente Clínico (el más grande)
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| GEN-01 | INCORRECT | Demo agrega tab "Contra-referencia" (no existe en app) | Baja |
| GEN-02 | INCORRECT | Sub-tab por defecto: app `tbe→dx`; demo `tbe→sesiones` | Baja |
| GEN-03 | MISSING | Header: botones globales "+ Registrar Sesión TBE" y "Consultar con LEVA" | Media |
| TBE-02 | MISSING | **Edición inline de sesión** (Fase, Significado, DX operativo, SPR) | Alta |
| TBE-03 | MISSING | Campo de sesión `significado` | Media |
| TBE-05/TBE-06 | MISSING | **VC semáforo tipado** (5 estados: marcador inicial/sin mejoría, mejoría leve, mejoría significativa, recaída, nuevo patrón) + componente | Alta |
| TBE-10 | PARTIAL | Criterios: app usa acordeón por categoría + select de opciones conductuales; demo lista texto libre | Media |
| PSQ-01 | PARTIAL | Psicofármacos agrupados: app 6 grupos; demo 9 categorías | Media |
| PSQ-02/PSQ-05 | PARTIAL | Fármacos/Drogas: app radio No/Sí + `drugsUsage`/`usoDrogas`; demo solo lista | Media |
| DATOS-02 | MISSING | generales → sección **"Establecimiento"** (CLUES, licencia, tipo) | Alta |
| DATOS-04 | PARTIAL | generales → Datos del Paciente: app 11 campos; demo dispersos en ficha | Alta |
| DATOS-05/06/07 | MISSING | generales → **Domicilio editable**, **Contacto de Emergencia editable**, **Responsable Legal** | Alta |
| DATOS-08 | MISSING | generales → botón "Guardar Datos Generales" | Media |
| DATOS-09 | PARTIAL | **Examen del Estado Mental**: app 9 secciones × parámetros + evaluación de riesgo (6 ítems) + síntesis (5 ítems) + modales; demo solo 10 textareas | Alta |
| DATOS-13 | INCORRECT | ficha → Identificación: campo-set distinto | Alta |
| DATOS-14/DATOS-15 | PARTIAL | ficha → Tratamientos/Fármacos: app radio No/Sí + select "Resultado" + límites; demo listas simples | Media |
| PAGOS/CONS/SUP | DATA | Seed visible: demo trae pagos/constancia/bitácora; adaptador local Angular vacío (backend provee) | Media |

### 2.4 Agenda
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| AG-01 | MISSING | Banner "Control Normativo" (menores sin consentimiento → bloqueada/pendiente) | Alta |
| AG-02 | MISSING | Selector de vistas segmentado (Día/Semana/Mes/Año) | Media |
| AG-03 | MISSING | Campo "Consultorio" (A/B) en nueva cita + `office` en modelo | Media |
| AG-04 | MISSING | Aviso de bloqueo normativo dentro del modal de agendar | Media |
| AG-05 | MISSING | Flujo "Cancelar cita" con modal + "Notificar por WhatsApp" | Alta |
| AG-07 | MISSING | Indicador "Bloqueada por Normativa" en tarjeta de cita | Media |
| AG-09 | PARTIAL | Selector de paciente: app dropdown con edad; demo búsqueda por nombre | Media |
| AG-13 | INCORRECT | Tipo de sesión: app 3 opciones largas; demo 5 opciones | Media |
| AG-14 | INCORRECT | Enum modalidad mayúsculas vs minúsculas | Media |
| AG-18/AG-19 | DATA | Seed: app 18 citas históricas con `ausente`/`no_presentado`/`solicita_reagendar`/`exenta`; demo solo 8 citas "hoy"/mañana | Media |

### 2.5 Pacientes
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| PA-01 | MISSING | Columna "Edad" (+ tag "(Menor)") | Media |
| PA-02/PA-03 | MISSING | Sub-línea "Apoyo: {nombre}" y badge "Autónomo" | Media |
| PA-04 | MISSING | Modal alta: RFC, Sexo, Lugar Nacimiento, Estado Civil, Escolaridad, Ocupación, Religión, Motivo | Alta |
| PA-05/PA-06 | MISSING | Secciones **Domicilio** y **Contacto de Emergencia** en el alta | Alta |
| PA-07 | MISSING | Selectores Sede y Terapeuta desde catálogos | Media |
| PA-08 | MISSING | Validación CURP obligatoria (18 caracteres) | Media |
| PA-13 | INCORRECT | Etiquetas de Capacidad Jurídica y colores | Media |
| PA-17 | INCORRECT | Acción por fila: app enlace único; demo condiciona + "Eliminar" | Media |
| PA-18 | DATA | Seed: app 6 pacientes con más estados; demo 4 | Media |

### 2.6 Supervisión
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| SUP-03 | MISSING | En demo el formulario de creación no tiene disparador (`setIsCreating(true)` no existe) | Alta |
| SUP-04 | MISSING | Campo "Prescripción de Intervención" (`px`) en el modal | Alta |
| SUP-07…SUP-16 | INCORRECT | Labels (Caso/Paciente, Nº Sesión, Trastorno Estratégico, Reestructuración Acordada) y seed divergen | Media |
| — | DEMO→APP | Demo tiene pestaña "Revisión de Grabaciones" + panel "Casos Pendientes"; ausentes en app | — |

### 2.7 Auditoría
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| AUD-02 | INCORRECT | App tabla con columnas Usuario/Acción/Detalle/Categoría/Cuándo; demo lista de tarjetas | Media |
| AUD-04 | INCORRECT | Categorías: app clave cruda; demo etiquetas con color | Media |
| AUD-05…AUD-07 | DATA | Seed de auditoría distinto | Media |
| — | DEMO→APP | Demo tiene búsqueda, filtro, resolución de alertas, actas; app es mock estático | — |

### 2.8 Configuración
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| CONF-07 | INCORRECT | Duración: app input numérico libre; demo select 30/45/60 | Media |
| CONF-10 | MISSING | Sección **"Sedes de Atención" editable** (agregar/quitar/marcar principal/guardar) | Alta |
| CONF-11 | MISSING | Badge "PRINCIPAL" y estado vacío de sedes | Media |
| CONF-12 | MISSING | Sección **"Historial de Cambios"** | Alta |
| CONF-14…CONF-20 | DATA | Seed divergente (nombre, cédula, especialidad, teléfono, duración 50, costo seguimiento, edad mínima 12) | Media |

### 2.9 Biblioteca / Campus / Desempeño / LEVA
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| LIB-02/LIB-03 | DATA | Seed: app "Manual de Prescripciones Paradójicas" y "Protocolo de Fobia de Rendimiento"; demo otros documentos | Media |
| CAM-04…CAM-07 | MISSING | KPIs de Campus (Simulaciones Aprobadas, Certificados Emitidos, Supervisiones Programadas) ausentes en demo | Media |
| DES-03/DES-05 | MISSING | KPIs "Citas Mensuales 110" e "Índice de Fidelidad 8.4" ausentes en demo | Media |
| DES-07 | INCORRECT | App solo implementa 1 subtab de Desempeño; demo los 4 completos | Alta |
| LEV-04 | MISSING | Grid de 4 herramientas clínicas rápidas (Analizar Tentativa, Peor Fantasía, Declaración del Secreto, Reestructuración Analógica) | Alta |
| LEV-05 | MISSING | Campo "Estratagema Recomendada" en respuestas | Media |
| LEV-10 | MISSING | Arquitectura dual LocalStorage/HTTP con feature flag | Media |

### 2.10 Portal del Paciente / Intake
| ID | Tipo | Descripción | Severidad |
| :-- | :-- | :-- | :-- |
| PA-01 (portal) | MISSING | Repositorio/adaptador HTTP con feature flag (`pacientePortalBackend`) | Media |
| IC-01…IC-12 | MISSING | Alta de paciente: RFC, Sexo, Lugar Nacimiento, Estado Civil, Escolaridad, Ocupación, Religión, Domicilio, Contacto Emergencia, Sede | Alta |
| IC-13 | INCORRECT | `registryMode` al crear: app `manual`; demo `ia` | Media |
| IC-14 | INCORRECT | Validación CURP: app bloquea; demo genera temporal | Media |
| IC-16/IC-17 | DATA | Faltan seeds `REPRESENTADO_POR_CONDICION` y `PENDIENTE_DETERMINACION` | Media |
| — | DEMO→APP | Demo tiene intake orientado al paciente (`IntakeForm` + consentimiento IA/manual + firma) que la app no tiene como flujo separado | — |

---

## 3. Resumen ejecutivo

**Lo que de verdad le falta a la DEMO (prioridad de cierre):**
1. **Expediente → Examen del Estado Mental** completo (9 secciones con parámetros, evaluación de riesgo de 6 ítems, síntesis, modales) — hoy son 10 textareas planas.
2. **Expediente → Datos Generales**: Establecimiento, Domicilio editable, Contacto de Emergencia, Responsable Legal, botón Guardar.
3. **Expediente → VC con semáforo de 5 estados** (con "Marcador inicial/Sin mejoría" y "Recaída") y **edición inline de sesión** (+ campo `significado`).
4. **Pacientes → alta completa**: RFC, Sexo, Lugar Nacimiento, Estado Civil, Escolaridad, Ocupación, Religión, Domicilio, Contacto de Emergencia, Sede, CURP obligatoria.
5. **Agenda**: banner normativo, flujo de cancelación con WhatsApp, consultorio A/B, selector de vistas.
6. **Configuración**: sedes editables + historial de cambios.
7. **LEVA**: 4 herramientas rápidas + "Estratagema Recomendada".
8. **Dashboard**: botones "Nuevo Paciente"/"Agendar Cita", filtro de periodo dentro de la gráfica.

**Donde la DEMO tiene MÁS que la APP (requiere decisión, no borrar a ciegas):**
- Mi Consulta (modales de crisis, acordeón secundario, navegación de botones).
- Supervisión (revisión de grabaciones, casos pendientes).
- Auditoría (búsqueda/filtro/resolución/actas).
- Campus y Desempeño (tabs completos vs placeholders).
- Intake orientado al paciente.

---

## 4. Recomendaciones

1. **Fijar la fuente de verdad por módulo**. Sugerencia: APP = verdad para *Expediente, Pacientes, Agenda, Configuración, LEVA, Dashboard* (están más alineadas al backend); DEMO = verdad para *Mi Consulta, Supervisión, Auditoría, Campus, Desempeño, Intake* (la demo ya los tiene completos y la app está maqueteada). Confirmar con el equipo antes de implementar.
2. **Ejecutar por bloques** con `demo-gap-implementation`: primero Expediente (mayor densidad), luego Pacientes+Agenda, luego Configuración+LEVA+Dashboard.
3. **Consolidar seed**: unificar catálogos (terapeutas, protocolos, documentos) en un solo lugar para que no vuelvan a divergir.
4. **Verificar contra backend** los módulos cuyo adaptador Angular local está vacío (Pagos, Constancias, Bitácoras, Auditoría): confirmar qué provee el backend real antes de replicar en demo.

---

## 5. Estado
- [x] Auditoría completa (14 módulos)
- [ ] Decisión de fuente de verdad por módulo
- [ ] Implementación de brechas APP→DEMO
