# Control del documento

| Campo | Detalle |
|---|---|
| **Producto** | BreveMente — Plataforma Clínica de Terapia Breve Estratégica |
| **Documento** | Manual de Usuario |
| **Versión** | 1.0 |
| **Fecha de emisión** | 22 de octubre de 2026 |
| **Emitido por** | SyborX |
| **Ámbito** | Primer Hito Entregable |
| **Audiencia** | Personal clínico: terapeutas, supervisores, coordinación clínica y personal administrativo |

**Historial de versiones**

| Versión | Fecha | Descripción del cambio | Emitido por |
|---|---|---|---|
| 1.0 | 22/10/2026 | Emisión inicial del Manual de Usuario | SyborX |

:::callout
**Aviso de confidencialidad.** Este documento contiene información sobre procesos clínicos y de operación institucional. Su contenido está dirigido exclusivamente al personal autorizado de la organización. Queda prohibida su reproducción total o parcial, así como su distribución a terceros, sin autorización expresa y por escrito de SyborX.
:::

:::

# 1. Introducción

## 1.1 Propósito del manual

Este manual describe el funcionamiento de **BreveMente**, el sistema de gestión clínica de Terapia Breve Estratégica, desde la perspectiva de quien lo utiliza día a día: el personal clínico y administrativo de la institución.

El objetivo es que cualquier profesional pueda, sin asistencia técnica previa:

- Acceder al sistema y ubicarse en la sección que necesita.
- Registrar y dar seguimiento a pacientes.
- Planificar y documentar sesiones.
- Consultar protocolos y manuales de tratamiento.
- Generar constancias e informes clínicos.
- Apoyarse en el asistente clínico LEVA sin delegar el juicio profesional.

## 1.2 Alcance

El manual cubre los módulos operativos del sistema:

1. Panel Principal (Centro de Control)
2. Mi Consulta
3. Pacientes
4. Agenda
5. Expedientes
6. Biblioteca Clínica
7. LEVA — Inteligencia asistiva
8. Campus BreveMente
9. Mi Desarrollo Profesional
10. Configuración
11. Auditoría y Seguridad
12. Reportes y Constancias
13. Contra-referencias
14. Portal del Paciente

Quedan fuera del alcance de este documento los procedimientos administrativos internos de la institución, la política de recursos humanos y la operación de infraestructura tecnológica.

## 1.3 A quién está dirigido

| Perfil del lector | Uso recomendado del manual |
|---|---|
| **Dr. / Terapeuta** | Capítulos 5 a 11 y 16. Consulta diaria de agenda, expedientes y documentación de sesión |
| **Supervisor Clínico** | Capítulos 5 a 11 y 17. Revisión de casos, supervisión y contra-referencias |
| **Administrador Clínico** | Capítulos 4 a 18. Supervisión operativa global |
| **Administrador de Plataforma** | Documento completo |
| **Asistente Clínico** | Capítulos 5, 7 y 8. Gestión de pacientes y agenda |
| **Paciente** | Capítulo 19 |
| **Alumno en formación** | Capítulos 10, 11 y 12 |

## 1.4 Convenciones del documento

- **Figura N**: imagen ilustrativa del sistema. Todas las figuras están numeradas de forma consecutiva y listadas en el Índice de Figuras.
- **Nota**: aclaración operativa que conviene conocer antes de ejecutar una acción.
- **Importante**: advertencia sobre una acción con impacto clínico, legal o sobre la información del paciente.
- Los nombres de botones y campos aparecen **en negrita** tal como se muestran en pantalla.
- Los perfiles de usuario se citan con su nombre completo: **Dr. / Terapeuta**, **Supervisor Clínico**, **Administrador Clínico**, **Administrador de Plataforma**, **Asistente Clínico**, **Paciente** y **Alumno en Formación**.

:::

# 2. Acceso al sistema

## 2.1 Requisitos técnicos

| Elemento | Requisito |
|---|---|
| Navegador | Chrome, Edge, Firefox o Safari en versión reciente |
| Resolución mínima | 1366 × 768 px (recomendado 1440 × 900 o superior) |
| Conexión | Acceso a la red institucional con salida al servidor del sistema |
| Sesión | Una sola sesión activa por profesional |

:::callout
El sistema solicita **no compartir credenciales**. Cada acceso queda registrado en el módulo de Auditoría y Seguridad asociado al perfil que inició sesión.
:::

## 2.2 Ingreso y perfil activo

Al iniciar, el sistema presenta el **Panel Principal** con el perfil del profesional ya cargado. La barra superior identifica en todo momento:

- El **aviso permanente** *DATO CLÍNICO SENSIBLE. ACCESO AUDITADO*, que recuerda que toda la información mostrada está protegida y es trazable.
- El **perfil activo** del profesional (nombre y rol).
- El **selector de perfil**, que permite consultar el sistema con la vista de otro rol cuando el usuario tiene atribuciones para ello.

:::figure figuras/01_barra-superior-perfil.png
Figura 1. Barra superior: aviso de acceso auditado, selector de perfil y datos del profesional activo.
:::

:::note
El selector de perfil muestra los siete perfiles disponibles en el sistema. El acceso efectivo a cada módulo depende de los permisos del perfil seleccionado (ver Capítulo 4).
:::

## 2.3 Elementos permanentes de la barra superior

| Elemento | Función |
|---|---|
| Aviso *Dato clínico sensible* | Recordatorio permanente de confidencialidad y auditoría |
| **Ver como** | Permite consultar la operación de otro terapeuta del equipo (perfil Terapeuta y administradores) |
| **Perfil** | Cambia la vista entre los perfiles habilitados |
| Nombre y rol | Identificación del usuario activo |
| **Cerrar Sesión** | Finaliza la sesión y vuelve a la pantalla de acceso |

:::important
Al terminar la jornada, cierre sesión con **Cerrar Sesión**. Cerrar el navegador sin cerrar sesión deja el expediente visible para el siguiente usuario del equipo.
:::

:::

# 3. Navegación general

## 3.1 Estructura del menú lateral

Toda la operación del sistema se organiza en un menú lateral fijo, dividido en cuatro secciones funcionales. El elemento activo se resalta en color turquesa.

:::figure figuras/02_menu-terapeuta.png
Figura 2. Menú lateral del perfil Dr. / Terapeuta con las cuatro secciones funcionales.
:::

| Sección | Módulos |
|---|---|
| **INICIO** | Panel Principal · Mi Consulta |
| **OPERACIÓN CLÍNICA** | Pacientes · Agenda · Expedientes · Biblioteca Clínica · LEVA |
| **FORMACIÓN Y DESARROLLO** | Campus BreveMente · Mi Desarrollo Profesional |
| **ADMINISTRACIÓN** | Configuración · Auditoría y Seguridad |

En el pie del menú se ubican dos accesos transversales: **Contra-referencias** (bandeja de solicitudes de derivación entre terapeutas) y **Cerrar Sesión**.

## 3.2 Adaptación del menú al perfil

El menú **no es idéntico para todos los perfiles**: se genera según los permisos. Un Administrador de Plataforma ve la operación completa de la institución y el módulo de auditoría.

:::figure figuras/03_menu-admin-plataforma.png
Figura 3. Menú lateral del perfil Administrador de Plataforma: acceso a la operación completa y a Auditoría y Seguridad.
:::

Un Asistente Clínico, en cambio, sólo ve las secciones necesarias para la gestión administrativa de pacientes y agenda.

:::figure figuras/04_menu-asistente.png
Figura 4. Menú lateral del perfil Asistente Clínico: acceso restringido a Pacientes, Agenda y Configuración.
:::

:::note
Si un módulo no aparece en su menú, su perfil no tiene atribución sobre él. La matriz completa de accesos se encuentra en el Anexo A.
:::

## 3.3 Asistente LEVA

En la esquina inferior derecha de todas las pantallas aparece el botón flotante **LEVA**. Al pulsarlo se abre el asistente clínico en cualquier momento de la operación, sin perder el contexto de la pantalla en la que se encuentra el profesional.

## 3.4 Navegación entre módulos

- Haga clic en cualquier elemento del menú lateral para cambiar de módulo.
- Al seleccionar un paciente en **Pacientes** o en la **Agenda**, el sistema traslada al **Expediente** correspondiente.
- Los indicadores del **Panel Principal** son accesos directos: por ejemplo, **Clic para ver agenda** abre la Agenda en el día en curso.

:::

# 4. Perfiles de usuario y permisos

## 4.1 Los siete perfiles del sistema

| Perfil | Denominación en el sistema | Función principal |
|---|---|---|
| Administrador de Plataforma | *Administrador de Plataforma* | Gobierno integral del sistema y de la operación institucional |
| Administrador Clínico | *Administrador Clínico* | Coordinación de la operación clínica y de los equipos |
| Dr. / Terapeuta | *Dr. / Terapeuta* | Atención directa, documentación de sesión y seguimiento de casos |
| Asistente Clínico | *Asistente Clínico* | Gestión de pacientes, agenda y admisión |
| Supervisor Clínico | *Supervisor Clínico* | Supervisión de casos, calidad técnica y contra-referencias |
| Paciente | *Paciente* | Consulta de sus propias citas e historial |
| Alumno en Formación | *Alumno en Formación* | Formación, biblioteca y desarrollo de competencias |

## 4.2 Matriz de acceso por módulo

| Módulo | Adm. Plataforma | Adm. Clínico | Terapeuta | Asistente | Supervisor | Paciente | Alumno |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Panel Principal | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Mi Consulta | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Pacientes | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Agenda | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Expedientes | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Biblioteca Clínica | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| LEVA | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| Campus BreveMente | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| Mi Desarrollo Profesional | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| Configuración | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Auditoría y Seguridad | ✔ | ✔ | — | — | ✔ | — | — |
| Reportes y Constancias | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Portal del Paciente | — | — | — | — | — | ✔ | — |

:::note
Los administradores conservan la capacidad de consultar la operación de cualquier terapeuta mediante el selector **Ver como** de la barra superior.
:::

## 4.3 El mismo módulo, tres lecturas

El módulo de trabajo diario cambia de nombre y de contenido según el perfil que lo abre. Esta es una decisión de diseño: cada rol ve lo que necesita para decidir.

| Perfil | Nombre del módulo | Enfoque |
|---|---|---|
| Dr. / Terapeuta | **Mi Consulta** | Su propia sesión del día y sus pendientes |
| Administrador Clínico | **Mi Operación** | Coordinación de la operación clínica de su unidad |
| Administrador de Plataforma | **Operación Clínica** | Operación global de la institución |
| Supervisor Clínico | **Mi Supervisión** | Casos que supervisa y calidad técnica |

:::figure figuras/08_mi-consulta-operacion.png
Figura 5. Vista *Mi Operación* del perfil Administrador Clínico sobre el módulo de trabajo diario.
:::

:::figure figuras/07_mi-consulta-supervision.png
Figura 6. Vista *Mi Supervisión* del perfil Supervisor Clínico: seguimiento de casos supervisados y bitácoras.
:::

## 4.4 Perfil Paciente

El perfil Paciente no comparte el menú lateral del personal clínico. Al ingresar, el sistema lo sitúa directamente en su **Portal del Paciente**, con una interfaz simplificada: sus próximas citas, su historial y un acceso directo de contacto con su terapeuta. La pantalla se describe en el Capítulo 19.

## 4.5 Perfil Alumno en Formación

El perfil Alumno en Formación ingresa al **Campus BreveMente** con su expediente académico, su ruta curricular y sus certificaciones. No tiene acceso a expedientes clínicos de pacientes. La vista se describe en el Capítulo 12.

:::

# 5. Panel Principal (Centro de Control)

El Panel Principal es la primera pantalla que ve el profesional al ingresar. Concentra, en una sola vista, el estado de la operación clínica del día: alertas, indicadores, la siguiente sesión y los pendientes que no pueden esperar.

:::figure figuras/05_panel-principal.png
Figura 7. Panel Principal: Centro de Control BreveMente.
:::

## 5.1 Encabezado y actualización

El encabezado indica el nombre del módulo, su propósito y la marca temporal de la última actualización de los datos. El botón **LEVA** abre el asistente clínico desde esta misma pantalla.

## 5.2 Filtros globales

La barra de filtros segmenta toda la información del panel:

| Filtro | Qué permite acotar |
|---|---|
| **Todas las Modalidades** | Presencial, en línea o mixta |
| **Todas las Sedes** | Sede o consultorio de atención |
| **Este mes** | Periodo de análisis (mes, trimestre, año) |
| **Todos los Terapeutas** | Profesional responsable |
| **Todos los Protocolos** | Protocolo clínico TBE aplicado |

El botón **Limpiar filtros** restablece la vista completa.

## 5.3 Perspectiva clínica unificada

Es el área de análisis principal del panel. Permite seleccionar el ángulo analítico que se desea proyectar en el viewport: citas completadas en el histórico, distribución por protocolo, efectividad de resolución y adherencia al modelo, entre otros.

:::note
El selector *Citas completadas (Histórico)* es el ángulo que aparece por defecto. Al cambiarlo, el gráfico se reconstruye con la serie correspondiente y conserva los filtros activos.
:::

## 5.4 Alertas clínicas

El panel destaca las alertas que exigen una decisión profesional y no pueden quedar en segundo plano. La alerta de **mayoría de edad** aparece cuando un paciente atendido como menor cumple 18 años: el expediente pasa a requerir la formalización del consentimiento autónomo y el sistema prepara la revocación de las notificaciones dirigidas al representante legal.

:::important
La alerta de mayoría de edad tiene implicaciones legales. Debe atenderse desde **Ver Expediente**, revisando el bloque de consentimientos antes de la siguiente sesión del paciente.
:::

## 5.5 Indicadores operativos

Cuatro tarjetas resumen la operación del día:

| Indicador | Lectura |
|---|---|
| **Citas programadas** | Total del día e indicación de cuántas están confirmadas. Enlaza a la Agenda |
| **Pacientes activos** | Pacientes en tratamiento y porcentaje de ocupación de la capacidad instalada |
| **Pendientes clínicos** | Tareas de documentación o admisión sin cerrar, frente al límite semanal |
| **Alertas de riesgo** | Número de alertas de riesgo clínico vigentes y su nivel |

## 5.6 Acción operativa dominante

El sistema identifica la siguiente sesión clínico-estratégica y la presenta como **acción operativa dominante**: paciente, protocolo, modalidad, tipo de sesión, duración, estado del intake y del consentimiento de grabación, modo asistencial de LEVA y terapeuta responsable. Desde aquí se ejecuta **Preparar Sesión** sin necesidad de navegar a otro módulo.

## 5.7 Agenda del día y pendientes prioritarios

Dos paneles cierran la vista:

- **Agenda del día**: las sesiones de la jornada con hora, paciente, tipo, modalidad y estado (Completada, Confirmada, No se presentó).
- **Pendientes prioritarios**: admisiones inconclusas e historias clínicas o consentimientos faltantes, con el motivo y el nivel de prioridad.

:::

# 6. Mi Consulta

Mi Consulta es el espacio de trabajo del terapeuta. Responde a una pregunta concreta: *¿qué me toca hacer ahora?*

:::figure figuras/06_mi-consulta.png
Figura 8. Mi Consulta: próxima sesión, agenda del día, pendientes urgentes y borradores de LEVA.
:::

## 6.1 Estados de la próxima sesión

La tarjeta superior avanza por cuatro estados conforme transcurre la sesión:

| Estado | Significado operativo |
|---|---|
| **Por iniciar** | La sesión está agendada y el expediente listo para abrirse |
| **En curso** | La sesión fue iniciada y se encuentra en desarrollo |
| **Finalizada** | La sesión concluyó; procede la documentación |
| **Nota pendiente** | La sesión terminó sin nota clínica registrada |

:::important
El estado **Nota pendiente** es el único que exige una acción inmediata del terapeuta: mientras la nota no se registre, el expediente queda incompleto y así se refleja en el indicador de pendientes clínicos del Panel Principal.
:::

## 6.2 Bloque de la sesión clínico-estratégica

Antes de abrir el expediente, el sistema muestra el contexto mínimo necesario para conducir la sesión: paciente activo, motivo y protocolo, número de sesión, estado del intake, estado del consentimiento de grabación y disponibilidad del modo asistencial LEVA.

:::callout
Si el consentimiento de grabación no está firmado, el sistema bloquea las acciones que dependen de ella. El bloqueo es de carácter legal y no puede omitirse desde la interfaz.
:::

## 6.3 Agenda del día y pendientes urgentes

- **Agenda de hoy**: relación cronológica de sesiones con tipo, modalidad, duración y estado.
- **Requieren atención urgente**: casos que, por estado clínico o administrativo, no admiten espera. Cuando no existen, el sistema lo indica expresamente.

## 6.4 Borradores de LEVA

Los borradores documentales que LEVA ha preparado para sesiones previas quedan listados aquí, con el caso, el número de sesión y el contenido sugerido. El botón **Revisar e Insertar Borrador** traslada el texto a la nota clínica para revisión y edición del profesional.

:::important
Un borrador de LEVA nunca se incorpora automáticamente a la nota. Toda inserción pasa por la revisión del terapeuta, conforme al principio de humano en el circuito.
:::

:::

# 7. Pacientes

## 7.1 Directorio de pacientes

El módulo **Pacientes** concentra el directorio institucional. Cada fila reúne los datos que intervienen en la decisión clínica y administrativa.

:::figure figuras/09_directorio-pacientes.png
Figura 9. Directorio de Pacientes: estado de tratamiento, representación legal, nivel de riesgo y estatus de pago.
:::

| Columna | Contenido |
|---|---|
| **Nombre paciente** | Identificación del paciente |
| **CURP / Folio** | Clave única de registro |
| **Contacto** | Teléfono y correo electrónico |
| **Registro** | Fecha de alta en el sistema |
| **Estado** | Activo o Pendiente |
| **Representación** | Mayoría de edad, menor de edad o pendiente de determinación |
| **Riesgo** | Nivel de riesgo clínico |
| **Estatus de pago** | Situación administrativa del tratamiento |
| **Acciones** | Accesos a expediente y baja del registro |

## 7.2 Búsqueda de pacientes

El buscador filtra en tiempo real por nombre, CURP, correo electrónico o teléfono, sin necesidad de presionar ninguna tecla adicional.

:::figure figuras/10_pacientes-busqueda.png
Figura 10. Búsqueda por nombre: el directorio se filtra en tiempo real.
:::

## 7.3 Alta de un paciente

El alta se inicia con el botón **Crear Paciente** (disponible para Administrador de Plataforma, Administrador Clínico, Dr. / Terapeuta y Asistente Clínico).

:::figure figuras/11_pacientes-alta.png
Figura 11. Formulario de alta de paciente.
:::

Pasos:

1. Pulse **Crear Paciente**. Se abre el formulario de alta.
2. Capture los datos de identificación y contacto del paciente.
3. Registre la fecha de nacimiento: el sistema determina con ella la mayoría de edad y el tipo de representación legal.
4. Confirme el alta. El paciente aparece de inmediato en el directorio con estado **Pendiente**.

:::note
Si la edad calculada es inferior al parámetro de **edad mínima por criterio de consulta** configurado por el clínico (ver Capítulo 14), el sistema emite una advertencia no bloqueante. La advertencia informa, no impide el registro.
:::

## 7.4 Historia clínica y admisión

La historia clínica y admisión clínico-médica recaba la información que sustenta el tratamiento. Es requisito para que el paciente pase de **Pendiente** a **Activo**.

:::figure figuras/12_pacientes-historia-clinica.png
Figura 12. Historia clínica y admisión clínico-médica.
:::

Campos del formulario:

- Nombre completo
- CURP
- Teléfono celular
- Correo electrónico
- Fecha de nacimiento
- Motivo principal de consulta

Al pie se presenta el **Compromiso de Privacidad**: los datos recabados constituyen información confidencial resguardada bajo la ley nacional de protección de datos de salud mental y no se divulgan fuera del circuito de atención autorizado. El botón **Proceder a Firmar Consentimiento** avanza a la firma digital.

:::important
Sin historia clínica completa y consentimiento firmado, el paciente permanece como pendiente de admisión y el sistema lo señala en los pendientes prioritarios del Panel Principal y de Mi Consulta.
:::

## 7.5 Acciones sobre un paciente

| Acción | Resultado |
|---|---|
| **Ver Expediente** | Abre el expediente clínico completo del paciente (Capítulo 9) |
| **Eliminar** | Retira el registro del directorio. Requiere confirmación y queda registrado en auditoría |

:::callout
La baja de un paciente no elimina su historial de accesos: el módulo de Auditoría conserva la traza de quién consultó el expediente y cuándo.
:::

:::

# 8. Agenda

## 8.1 Vista de la agenda clínica

La Agenda concentra la planificación de sesiones, la validación del estado legal del paciente y la auditoría de accesos. Se abre por defecto en la vista **Día** sobre la fecha de trabajo.

:::figure figuras/13_agenda-dia.png
Figura 13. Agenda y Calendario Clínico en vista de día.
:::

## 8.2 Filtros de la agenda

| Filtro | Opciones |
|---|---|
| **Profesional** | Todos los terapeutas o un profesional específico |
| **Consultorio** | Todos, Consultorio A, Consultorio B |
| **Expediente / IA** | Modo asistencial: IA Asistida o Manual |
| **Estado** | Confirmada, Pendiente, Riesgo Clínico Alto, Admisión/Intake Pendiente |

Las casillas **Bloquear festivos para agendar** y **Día personal** impiden que el sistema ofrezca horarios no disponibles al crear una cita.

## 8.3 Estados de una cita

| Estado | Lectura |
|---|---|
| **Confirmada** | El paciente confirmó su asistencia |
| **Pendiente** | Sin confirmación registrada |
| **Completada** | La sesión se llevó a cabo |
| **Cancelada** | La cita fue cancelada |
| **No asistió** | El paciente no se presentó |
| **No se presentó: Contactar** | Inasistencia con acción de contacto requerida |
| **Solicita reagendar: pendiente** | El paciente pidió reprogramación; falta gestión |

## 8.4 Creación de una cita

1. Pulse **Nueva Cita**.
2. Seleccione al paciente (o registre uno nuevo desde el mismo formulario).
3. Defina fecha, hora, tipo de sesión, duración, modalidad y consultorio.
4. Guarde la cita. El sistema valida traslapes de horario antes de confirmar.

:::figure figuras/14_agenda-nueva-cita.png
Figura 14. Formulario de creación de una nueva cita.
:::

:::important
El sistema impide agendar sesiones sobre un paciente cuya situación legal no esté resuelta —por ejemplo, consentimiento de grabación faltante— y muestra el motivo exacto del bloqueo junto al campo.
:::

## 8.5 Detalle de una cita

Al seleccionar una cita se despliega su detalle: datos del paciente, profesional, modalidad, estado, acciones de contacto y acceso directo al expediente.

:::figure figuras/15_agenda-detalle-cita.png
Figura 15. Detalle de una cita agendada.
:::

## 8.6 Frecuencia de sesiones

El panel inferior permite consultar y ajustar la frecuencia de seguimiento del caso: **Semanal**, **Quincenal** o **Mensual**. La frecuencia seleccionada alimenta la planeación y los indicadores de adherencia al modelo.

:::

# 9. Expedientes

## 9.1 Estructura del módulo

El módulo **Expedientes** es el expediente clínico electrónico. Se organiza en dos niveles: una lista de expedientes a la izquierda y el expediente activo al centro.

:::figure figuras/16_expedientes-general.png
Figura 16. Expedientes: listado lateral y expediente activo con ficha de admisión e historia clínica.
:::

Cada expediente muestra folio, edad, fecha de inicio, modalidad, terapeuta responsable y el estado del registro de grabación e IA.

## 9.2 Pestañas del expediente

| Pestaña | Contenido |
|---|---|
| **Datos de Admisión e Historia Clínica** | Identificación, contacto, registro, nacimiento, motivo inicial y consentimiento informado |
| **Tratamiento Psiquiátrico** | Valoraciones y seguimiento psiquiátrico del caso |
| **Tratamiento Psicoterapéutico TBE** | Sesiones, notas clínicas y maniobras del protocolo |
| **Pagos** | Movimientos y estatus administrativo del tratamiento |
| **Auditoría del Expediente** | Traza de accesos y modificaciones |
| **Bitácoras Supervisión** | Registro de las supervisiones recibidas sobre el caso |
| **Constancias** | Documentos clínicos emitidos |
| **Contra-referencia** | Solicitudes de derivación asociadas al caso |

## 9.3 Tratamiento psicoterapéutico TBE

Es el corazón clínico del expediente. Registra el avance del protocolo sesión a sesión: motivo trabajado, maniobras aplicadas, prescripciones, evolución y observaciones.

:::figure figuras/17_expedientes-psicoterapia.png
Figura 17. Pestaña de Tratamiento Psicoterapéutico TBE con el registro de sesiones.
:::

:::important
La nota de sesión es un documento clínico. Debe redactarse en la misma jornada de la sesión: un expediente con nota pendiente se refleja como pendiente clínico en todos los paneles operativos.
:::

## 9.4 Pagos

Concentra el registro administrativo del tratamiento: conceptos, montos y estado de cuenta del paciente.

:::figure figuras/18_expedientes-pagos.png
Figura 18. Pestaña de Pagos del expediente.
:::

## 9.5 Auditoría del expediente

Muestra la traza de accesos: quién consultó el expediente, cuándo y con qué motivo. Es la evidencia documental del principio de acceso auditado.

:::figure figuras/19_expedientes-auditoria.png
Figura 19. Auditoría del Expediente: registro de accesos y consultas.
:::

## 9.6 Constancias y bitácoras de supervisión

- **Bitácoras Supervisión**: consigna las sesiones de supervisión que el caso ha tenido, con supervisor, fecha y acuerdos.
- **Constancias**: agrupa los documentos clínicos emitidos desde el módulo de Reportes.

## 9.7 Solicitar supervisión de un caso

El botón **Solicitar Supervisión** envía el caso a la bandeja del Supervisor Clínico. La solicitud queda registrada en la bitácora del expediente y en el módulo de supervisión.

**Recomendación de uso:** solicite supervisión ante casos con riesgo clínico alto, estancamiento del protocolo o decisiones que excedan el marco habitual de intervención. La solicitud deja traza y protege tanto al paciente como al profesional.

:::

# 10. Biblioteca Clínica

## 10.1 Catálogo documental

La Biblioteca Digital Clínica reúne el corpus científico del modelo: manuales técnicos y protocolos de intervención oficiales.

:::figure figuras/20_biblioteca-catalogo.png
Figura 20. Biblioteca Digital Clínica: manuales técnicos y protocolos.
:::

Cada documento se identifica con su clave (**TBE-M** para manuales, **TBE-P** para protocolos), su tipo documental y una síntesis de su contenido. Todos los registros indican **Acceso clínico autorizado**.

## 10.2 Filtros por tipo documental

Los filtros **Todos**, **Manuales TBE** y **Protocolos Clínicos** acotan el catálogo.

:::figure figuras/21_biblioteca-filtro-protocolos.png
Figura 21. Catálogo filtrado por Protocolos Clínicos.
:::

## 10.3 Consulta de un documento

El botón **Consultar** abre el documento en una ventana de lectura con su resumen técnico y el contenido del corpus de referencia.

:::figure figuras/22_biblioteca-documento.png
Figura 22. Lectura de un protocolo clínico desde la Biblioteca.
:::

:::important
El contenido de la Biblioteca es propiedad intelectual de BreveMente. La ventana de lectura lo advierte expresamente y prohíbe su distribución. No capture ni comparta pantallas de estos documentos fuera del circuito institucional.
:::

:::

# 11. LEVA — Inteligencia asistiva

## 11.1 Qué es LEVA

LEVA es el asistente clínico y documental del sistema. Apoya al profesional en tres tareas concretas:

1. Localizar manuales y protocolos dentro del corpus autorizado.
2. Redactar propuestas de nota clínica y sugerencias documentales.
3. Señalar riesgos clínicos que requieren atención.

:::figure figuras/23_leva-general.png
Figura 23. LEVA: asistente clínico y documental, con aviso permanente sobre el uso de inteligencia artificial.
:::

## 11.2 Principio rector: humano en el circuito

El sistema declara de forma permanente que la inteligencia artificial:

- **no diagnostica** de forma autónoma,
- **no prescribe**,
- **no sustituye** el juicio clínico.

Toda sugerencia documental, manual o protocolo propuesto por LEVA debe ser verificado y validado por el especialista humano. Las respuestas de LEVA se identifican con la marca *Asistente IA* y la hora de emisión.

## 11.3 Sugerencias rápidas

La franja superior ofrece consultas predefinidas para los escenarios de mayor demanda:

| Sugerencia | Uso |
|---|---|
| **Prescripciones Ataque de Pánico** | Recupera las prescripciones del protocolo correspondiente |
| **Intervenciones en TOC** | Recupera maniobras del protocolo de TOC |
| **Probar alerta de riesgo** | Ejecuta la verificación de señales de riesgo del caso activo |

:::figure figuras/24_leva-sugerencia.png
Figura 24. LEVA respondiendo a una sugerencia sobre prescripciones del protocolo de ataque de pánico.
:::

## 11.4 Alertas de riesgo

Cuando el caso presenta señales de riesgo, LEVA las destaca de forma visible y propone el escalamiento correspondiente.

:::figure figuras/25_leva-alerta-riesgo.png
Figura 25. Alerta de riesgo emitida por LEVA durante la conversación.
:::

:::important
Una alerta de riesgo de LEVA **no reemplaza** el protocolo de escalamiento clínico institucional. Ante una alerta: valore el caso, registre la decisión en la nota clínica y, si corresponde, solicite supervisión desde el expediente.
:::

## 11.5 Buenas prácticas de uso

- Formule consultas con el contexto clínico mínimo necesario (protocolo, sesión, motivo).
- Verifique siempre la fuente citada antes de aplicar una maniobra.
- No introduzca datos identificatorios innecesarios del paciente en la conversación.
- Registre en la nota clínica qué sugerencia se aplicó y por qué.

:::

# 12. Campus BreveMente

## 12.1 Área de formación y calidad

El Campus concentra la capacitación del personal clínico, la supervisión técnica y las certificaciones oficiales del modelo.

:::figure figuras/26_campus-dashboard.png
Figura 26. Campus BreveMente: Mi Dashboard con avance curricular y mapa de competencias.
:::

## 12.2 Mi Dashboard

| Elemento | Contenido |
|---|---|
| **Perfil académico** | Nombre, expediente académico y diplomado activo |
| **Avance curricular** | Porcentaje del diplomado en curso |
| **Mapa de competencias clínicas** | Comparación entre el nivel actual y la meta en cada competencia TBE |
| **G.P.A. / Calificación** | Promedio acumulado |
| **Horas de formación** | Horas completadas frente a las requeridas |
| **Módulos aprobados** | Módulos cerrados del diplomado |
| **Estatus global** | Situación académica del profesional |

El **Mapa de competencias clínicas** evalúa ocho competencias: Ev. Estratégica, Diálogo Estratégico, Protocolos, Prescripciones, Reestructuración, Riesgo Clínico, Documentación y Ética y Privacidad.

## 12.3 Avisos del coordinador académico

El panel de avisos comunica indicaciones vigentes del coordinador, con fecha de actualización. Incluye recordatorios sobre consentimientos, prácticas y requisitos de evaluación. Deben leerse antes de cualquier actividad evaluable.

## 12.4 Ruta curricular

La pestaña **Ruta Curricular** presenta la secuencia de módulos del diplomado, sus requisitos y el estado de avance de cada uno.

:::figure figuras/27_campus-ruta-curricular.png
Figura 27. Ruta Curricular del diplomado.
:::

## 12.5 Certificaciones

La pestaña **Certificaciones** reúne las credenciales obtenidas y las que se encuentran en proceso, con su vigencia.

:::figure figuras/28_campus-certificaciones.png
Figura 28. Certificaciones del profesional.
:::

## 12.6 Retroalimentación del supervisor

Al pie del dashboard aparece la última retroalimentación recibida, con el texto del evaluador, su nombre y la fecha. Es el insumo directo para el plan de mejora individual.

:::

# 13. Mi Desarrollo Profesional

## 13.1 Descripción

El módulo integra el desempeño clínico, la adherencia técnica a protocolos, la capacitación académica y las bitácoras de supervisión en una sola vista anual.

:::figure figuras/30_desempeno-resultados.png
Figura 29. Mi Desarrollo Profesional: resultados clínicos del año.
:::

## 13.2 Indicadores de resultados clínicos

| Indicador | Lectura |
|---|---|
| **Efectividad de resolución (TBE)** | Porcentaje de casos con mejoría o alta definitiva |
| **Promedio de sesiones por caso** | Sesiones promedio para resolver un caso; el límite clínico estratégico TBE es menor a 10 |
| **Tasa de deserción (drop out)** | Pacientes que abandonan voluntariamente el tratamiento |

El **Historial de consultas mensuales** proyecta las citas completadas mes a mes, y la **distribución de resultados de casos** desglosa casos resueltos, mejorados, invariables y abandonos.

## 13.3 Fidelidad al modelo TBE

Evalúa qué tan apegada es la práctica del profesional al modelo estratégico: uso de maniobras, secuencia de fases y adherencia a protocolo.

:::figure figuras/31_desempeno-fidelidad.png
Figura 30. Pestaña de Fidelidad al Modelo (TBE).
:::

## 13.4 Formación y competencias

Vincula el desempeño con la formación: módulos cursados, competencias desarrolladas y su evolución en el periodo.

:::figure figuras/32_desempeno-formacion.png
Figura 31. Pestaña de Formación y Competencias.
:::

## 13.5 Supervisiones recibidas

Registra las supervisiones del periodo con supervisor, fecha y foco de revisión, además de la retroalimentación asociada.

:::figure figuras/33_desempeno-supervisiones.png
Figura 32. Pestaña de Supervisiones Recibidas.
:::

:::note
El indicador de **año** (2026 / 2025) permite comparar el desempeño entre periodos sin perder la serie histórica.
:::

:::

# 14. Configuración

## 14.1 Parámetros de atención y criterio clínico

El módulo de Configuración reúne los parámetros del terapeuta, las reglas de admisión y el resguardo legal.

:::figure figuras/34_configuracion.png
Figura 33. Configuración General: parámetros de atención.
:::

## 14.2 Edad mínima por criterio de consulta

Define el umbral de edad de atención preferente, expresado en años cumplidos:

- Si el valor es **0**, no existe límite de edad mínima.
- Si un paciente registrado tiene una edad inferior al parámetro, el sistema emite una **advertencia no bloqueante** en el paso 1 de creación del paciente.
- El parámetro se sincroniza en tiempo real en el almacenamiento seguro de la sesión.

:::important
La advertencia de edad mínima es informativa, no restrictiva: el sistema advierte al profesional y deja la decisión clínica en sus manos. Aun así, conviene documentar el criterio aplicado cuando se registra un paciente por debajo del umbral configurado.
:::

:::

# 15. Auditoría y Seguridad

## 15.1 Registro de accesos

El módulo de Auditoría y Seguridad expone la traza de actividad del sistema: accesos a expedientes, consultas, modificaciones y eventos relevantes, con usuario, perfil, fecha y hora.

:::figure figuras/35_auditoria-seguridad.png
Figura 34. Auditoría y Seguridad: registro de actividad del sistema.
:::

## 15.2 Uso institucional del registro

| Escenario | Utilidad del registro |
|---|---|
| Revisión de accesos indebidos | Identifica quién consultó un expediente y con qué motivo |
| Respaldo documental | Aporta evidencia ante una reclamación del paciente |
| Supervisión de calidad | Permite verificar el cumplimiento de los protocolos de acceso |

:::callout
El registro de auditoría es de sólo consulta. Ningún perfil puede alterar ni eliminar sus entradas desde la interfaz.
:::

:::

# 16. Reportes y Constancias

## 16.1 Generación de constancias

El módulo **Reportes y Constancias Médicas** emite documentos clínicos oficiales: constancias psicoterapéuticas, informes y documentos periciales.

:::figure figuras/36_reportes-formulario.png
Figura 35. Formulario de generación de constancia psicoterapéutica.
:::

## 16.2 Datos de la constancia

| Bloque | Campos |
|---|---|
| **Paciente** | Paciente asignado |
| **Profesional** | Cédula profesional, nombre del especialista, dirección de consultorio, correo y teléfono |
| **Tratamiento** | Inicio y fin de atención, total de sesiones, frecuencia y modalidad |
| **Clínica** | Cuadro de síntomas detectado y evolución clínica |
| **Cierre** | Lugar y fecha, y recomendaciones finales |

## 16.3 Vista previa y emisión

El botón **Generar Vista Previa** construye el documento con los datos capturados, listo para revisión antes de su impresión o entrega.

:::figure figuras/37_reportes-vista-previa.png
Figura 36. Vista previa de la constancia antes de su emisión.
:::

:::important
Revise la vista previa antes de emitir. Una constancia emitida con datos incorrectos debe corregirse y volver a generarse: el documento anterior queda registrado en el expediente.
:::

:::

# 17. Supervisión clínica

## 17.1 Mi Supervisión

El perfil Supervisor Clínico accede al módulo de trabajo diario con la vista **Mi Supervisión**, orientada al seguimiento de los casos que tiene a su cargo y a la revisión de la calidad técnica de las intervenciones.

:::figure figuras/07_mi-consulta-supervision.png
Figura 37. Vista Mi Supervisión del perfil Supervisor Clínico.
:::

## 17.2 Información secundaria de supervisión y formación

El bloque de **Información Secundaria** amplía la vista con los indicadores de supervisión y formación asociados a los casos supervisados.

:::figure figuras/38_supervision-info-secundaria.png
Figura 38. Información Secundaria: supervisión y formación del supervisor.
:::

## 17.3 Solicitudes de supervisión

Las solicitudes enviadas desde el expediente (**Solicitar Supervisión**) llegan a la bandeja del supervisor con el caso, el motivo y el terapeuta solicitante. Al resolverlas, el sistema registra el acuerdo en la bitácora del expediente.

:::

# 18. Contra-referencias

## 18.1 Bandeja de contra-referencias

La contra-referencia es la derivación de un paciente de un terapeuta a otro. El acceso se ubica en el pie del menú lateral y muestra, junto al nombre, el número de solicitudes pendientes.

:::figure figuras/39_contra-referencias.png
Figura 39. Bandeja de contra-referencias entrantes.
:::

Cada solicitud indica:

- Paciente
- Terapeuta de origen y terapeuta destino
- Motivo de la derivación
- Resumen clínico del caso (cuando se adjunta)
- Estado de la solicitud

## 18.2 Aceptar o declinar una contra-referencia

1. Abra **Contra-referencias** en el menú lateral.
2. Revise el motivo y el resumen clínico de la solicitud.
3. Pulse **Aceptar** para asumir el caso o **Declinar** para rechazarlo, indicando el motivo.
4. El sistema notifica al paciente y al terapeuta de origen, y deja traza en el expediente.

:::important
Al aceptar una contra-referencia usted asume la responsabilidad clínica del caso. Revise el expediente completo antes de aceptar.
:::

:::

# 19. Portal del Paciente

## 19.1 Vista del paciente

El Portal del Paciente es la interfaz que el paciente utiliza para consultar su tratamiento. Es de sólo lectura: no permite reprogramar ni cancelar citas.

:::figure figuras/40_portal-paciente.png
Figura 40. Portal del Paciente: próximas citas, historial y contacto con el terapeuta.
:::

## 19.2 Contenido del portal

| Elemento | Función |
|---|---|
| **Saludo y terapeuta asignado** | Identifica al profesional responsable del caso |
| **Botón de Crisis** | Acceso destacado para situaciones de urgencia |
| **Contactar asistente** | Canal directo con el equipo administrativo |
| **Próximas citas** | Fecha, hora, duración, tipo y estado (incluido el estado de pago) |
| **Historial de citas** | Sesiones anteriores con su estado y situación de pago |

:::important
El portal indica expresamente que, para reprogramar o cancelar una cita, el paciente debe contactar al asistente o a su terapeuta. El paciente no puede modificar su agenda por sí mismo.
:::

:::

# 20. Flujos de trabajo de referencia

## 20.1 Flujo integral de atención

El siguiente diagrama resume el recorrido completo de un paciente en el sistema, desde la admisión hasta el cierre del caso.

:::mermaid flujo-atencion | Figura 41. Flujo integral de atención al paciente en BreveMente.
flowchart TD
    A["Admisión del paciente<br/>Historia clínico-médica"] --> B["Firma del consentimiento<br/>informado y de grabación"]
    B --> C{"¿Expediente completo?"}
    C -- "No" --> D["Pendiente de admisión<br/>visible en alertas operativas"]
    D --> B
    C -- "Sí" --> E["Paciente ACTIVO<br/>en el directorio"]
    E --> F["Agendamiento de la cita<br/>Agenda"]
    F --> G["Preparación de la sesión<br/>Mi Consulta"]
    G --> H["Sesión clínica<br/>estado En curso"]
    H --> I["Nota clínica en el expediente<br/>Tratamiento Psicoterapéutico TBE"]
    I --> J{"¿Requiere supervisión<br/>o contra-referencia?"}
    J -- "Supervisión" --> K["Solicitar Supervisión<br/>bitácora del expediente"]
    J -- "Contra-referencia" --> L["Derivación a otro terapeuta<br/>bandeja de contra-referencias"]
    J -- "No" --> M{"¿Objetivo terapéutico<br/>cumplido?"}
    K --> M
    M -- "No" --> F
    M -- "Sí" --> N["Constancia de cierre<br/>Reportes y Constancias"]
    N --> O["Alta del caso<br/>historial conservado"]
:::

## 20.2 Flujo de admisión y consentimiento

1. El paciente se registra en el directorio (**Crear Paciente**) con estado **Pendiente**.
2. Se completa la **Historia clínica y admisión clínico-médica**.
3. Se firma el **consentimiento informado** y, cuando corresponde, el de grabación.
4. El sistema valida el expediente y cambia el estado a **Activo**.
5. El paciente queda disponible para agendar en la **Agenda**.

:::note
Mientras el expediente no esté completo, el sistema mantiene el caso en los **pendientes prioritarios** del Panel Principal y bloquea las acciones que dependen del consentimiento.
:::

## 20.3 Flujo de sesión y documentación

1. **Mi Consulta** identifica la próxima sesión y su estado.
2. El terapeuta pulsa **Atender / Preparar Sesión**.
3. La sesión pasa a **En curso**; al concluir, a **Finalizada**.
4. Se registra la nota clínica en la pestaña **Tratamiento Psicoterapéutico TBE**.
5. Si la nota no se registra, el estado del caso pasa a **Nota pendiente** y se refleja como pendiente clínico.

## 20.4 Flujo de alerta de riesgo

:::mermaid alerta-riesgo | Figura 42. Escalamiento de una alerta de riesgo clínico.
flowchart TD
    A["Señal de riesgo detectada<br/>en sesión o por LEVA"] --> B["Valoración clínica inmediata<br/>por el terapeuta"]
    B --> C{"¿Riesgo inminente?"}
    C -- "Sí" --> D["Activar protocolo de urgencia<br/>institucional"]
    D --> E["Registrar la decisión<br/>en la nota clínica"]
    C -- "No" --> F["Solicitar Supervisión<br/>desde el expediente"]
    F --> G["Supervisor revisa el caso<br/>y registra acuerdos"]
    G --> H["Bitácora de supervisión<br/>actualizada"]
    E --> I["Seguimiento en la<br/>siguiente sesión"]
    H --> I
:::

## 20.5 Mapa de navegación del sistema

:::mermaid mapa-navegacion | Figura 43. Mapa de navegación: módulos del sistema por sección funcional.
flowchart LR
    INICIO["INICIO"] --> PP["Panel Principal"]
    INICIO --> MC["Mi Consulta<br/>Mi Operación<br/>Mi Supervisión"]
    OPE["OPERACIÓN CLÍNICA"] --> PA["Pacientes"]
    OPE --> AG["Agenda"]
    OPE --> EX["Expedientes"]
    OPE --> BI["Biblioteca Clínica"]
    OPE --> LE["LEVA"]
    FOR["FORMACIÓN Y DESARROLLO"] --> CA["Campus BreveMente"]
    FOR --> DE["Mi Desarrollo Profesional"]
    ADM["ADMINISTRACIÓN"] --> CF["Configuración"]
    ADM --> AU["Auditoría y Seguridad"]
    PA --> EX
    AG --> EX
    EX --> RE["Reportes y Constancias"]
:::

:::

# 21. Glosario

| Término | Definición |
|---|---|
| **TBE** | Terapia Breve Estratégica. Modelo de intervención en el que se sustenta el sistema |
| **LEVA** | Asistente clínico y documental del sistema. Apoya la consulta documental y la redacción, sin sustituir el juicio clínico |
| **Intake** | Proceso de admisión del paciente: historia clínica inicial y consentimientos |
| **Protocolo** | Secuencia estandarizada de fases y maniobras para un cuadro clínico específico (clave TBE-P) |
| **Manual técnico** | Documento de fundamentación teórica del modelo (clave TBE-M) |
| **Contra-referencia** | Derivación de un paciente de un terapeuta a otro, con motivación clínica registrada |
| **Nota pendiente** | Estado de una sesión concluida sin nota clínica registrada |
| **Pendiente clínico** | Tarea de documentación o admisión sin cerrar que el sistema reporta como alerta operativa |
| **Representación legal** | Condición del paciente menor de edad o con representante designado |
| **Consentimiento de grabación** | Autorización expresa del paciente para registrar audio de la sesión |
| **Humano en el circuito** | Principio por el cual toda sugerencia de la inteligencia artificial debe ser validada por el profesional |
| **Día personal** | Bloqueo de agenda que impide agendar sesiones en una fecha determinada |
| **Estatus de pago** | Situación administrativa del tratamiento del paciente |
| **Alta del caso** | Cierre del tratamiento con constancia emitida |
| **Drop out** | Abandono voluntario del tratamiento por parte del paciente |

:::

# Anexo A. Matriz de permisos por módulo y perfil

| Módulo | Adm. Plataforma | Adm. Clínico | Terapeuta | Asistente | Supervisor | Paciente | Alumno |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Panel Principal | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Mi Consulta / Mi Operación / Mi Supervisión | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Pacientes | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Agenda | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Expedientes | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Biblioteca Clínica | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| LEVA | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| Campus BreveMente | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| Mi Desarrollo Profesional | ✔ | ✔ | ✔ | — | ✔ | — | ✔ |
| Configuración | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Auditoría y Seguridad | ✔ | ✔ | — | — | ✔ | — | — |
| Reportes y Constancias | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Portal del Paciente | — | — | — | — | — | ✔ | — |

**Atribuciones adicionales por perfil**

| Atribución | Adm. Plataforma | Adm. Clínico | Terapeuta | Asistente | Supervisor | Paciente | Alumno |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Alta de pacientes | ✔ | ✔ | ✔ | ✔ | — | — | — |
| Creación de citas | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Registro de nota clínica | — | — | ✔ | — | — | — | — |
| Solicitar supervisión | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Emitir constancias | ✔ | ✔ | ✔ | — | ✔ | — | — |
| Modificar parámetros clínicos | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Consultar auditoría | ✔ | ✔ | — | — | ✔ | — | — |
| Recibir contra-referencias | ✔ | ✔ | ✔ | — | ✔ | — | — |

# Anexo B. Inventario de pantallas

| # | Pantalla | Sección | Capítulo |
|---|---|---|---|
| 1 | Panel Principal | INICIO | 5 |
| 2 | Mi Consulta / Mi Operación / Mi Supervisión | INICIO | 6 y 17 |
| 3 | Directorio de Pacientes | OPERACIÓN CLÍNICA | 7 |
| 4 | Alta de paciente | OPERACIÓN CLÍNICA | 7 |
| 5 | Historia clínica y admisión | OPERACIÓN CLÍNICA | 7 |
| 6 | Agenda y Calendario Clínico | OPERACIÓN CLÍNICA | 8 |
| 7 | Nueva cita | OPERACIÓN CLÍNICA | 8 |
| 8 | Expedientes | OPERACIÓN CLÍNICA | 9 |
| 9 | Biblioteca Clínica | OPERACIÓN CLÍNICA | 10 |
| 10 | LEVA | OPERACIÓN CLÍNICA | 11 |
| 11 | Campus BreveMente | FORMACIÓN Y DESARROLLO | 12 |
| 12 | Mi Desarrollo Profesional | FORMACIÓN Y DESARROLLO | 13 |
| 13 | Configuración | ADMINISTRACIÓN | 14 |
| 14 | Auditoría y Seguridad | ADMINISTRACIÓN | 15 |
| 15 | Reportes y Constancias | ADMINISTRACIÓN | 16 |
| 16 | Contra-referencias | Transversal | 18 |
| 17 | Portal del Paciente | Transversal | 19 |

# Anexo C. Preguntas frecuentes

**No veo un módulo en mi menú. ¿Por qué?**
El menú se construye a partir de los permisos del perfil activo. Consulte la matriz del Anexo A; si su función requiere acceso adicional, solicítelo a su Administrador Clínico.

**El sistema no me deja agendar una cita.**
Verifique dos condiciones: que el paciente tenga el expediente completo con consentimiento firmado, y que el horario no esté bloqueado por festivo o día personal. El sistema muestra el motivo exacto del bloqueo.

**¿Puedo cerrar sesión sin registrar la nota?**
Sí, pero la sesión quedará en estado **Nota pendiente** y el caso aparecerá como pendiente clínico en el Panel Principal hasta que la nota se registre.

**¿LEVA puede firmar o emitir documentos por mí?**
No. LEVA propone texto y localiza documentación; la validación, la firma y la responsabilidad clínica son del profesional.

**¿Quién puede ver el expediente de un paciente?**
Sólo los perfiles con atribución sobre Expedientes y el profesional responsable del caso. Todo acceso queda registrado en la auditoría del expediente.

**¿Cómo corrijo una constancia mal emitida?**
Genere una nueva constancia con los datos corregidos. La anterior permanece registrada en el expediente como antecedente documental.

**¿Qué hago si un paciente cumple 18 años durante el tratamiento?**
El Panel Principal mostrará la alerta de mayoría de edad. Abra **Ver Expediente**, formalice el consentimiento autónomo y confirme la revocación de las notificaciones al representante.

# Anexo D. Soporte

| Canal | Uso |
|---|---|
| Administrador Clínico de su unidad | Dudas operativas, permisos y accesos |
| Mesa de soporte de SyborX | Incidentes técnicos, errores del sistema y solicitudes de cambio |

Al reportar un incidente, incluya: módulo, pantalla, acción realizada, mensaje mostrado y hora aproximada del evento. Esta información permite localizar el registro correspondiente en el módulo de Auditoría.

