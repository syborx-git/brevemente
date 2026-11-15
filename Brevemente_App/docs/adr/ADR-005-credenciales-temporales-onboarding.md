# ADR-005: Mecanismo único de credenciales temporales y onboarding obligatorio

- **Estado**: Aceptado
- **Fecha**: 2026-11-09
- **Autor**: Syborx / Lead
- **Alineación**: ADR-001 (Hexagonal), ADR-003 (Backend/OpenAPI); complementa el flujo de autenticación JWT existente
- **Relacionado**: SDD de credenciales-onboarding (pendiente), SDD Módulo 2 Usuarios (pendiente), gap-report-vista-admin-plataforma-1 §5.3

---

## Contexto del Problema

BreveMente es un **sistema cerrado** (sin registro público): las cuentas las crean actores internos.

- `admin_platform` crea cuentas de staff (terapeuta, asistente, supervisor, admin clínico, etc.).
- Los **terapeutas** crean cuentas de **pacientes**.

Hoy el sistema carece de un flujo estandarizado de restablecimiento de contraseña, y al dar de alta una cuenta no existe forma homogénea de que el usuario defina su primera contraseña. Además, se decidió **no incorporar servicios de correo electrónico ni SMS/WhatsApp en esta fase**, por no existir aún planeación del uso de esos servicios.

Se necesita un mecanismo **único, seguro y sin envío de mensajes** que cubra tres escenarios:

1. Alta de staff por parte del admin.
2. Restablecimiento de contraseña de staff (por parte del admin).
3. Alta de paciente por parte del terapeuta.

---

## Decisión

Adoptar un único mecanismo de credenciales basado en **contraseña temporal + cambio obligatorio**:

- Toda cuenta nueva nace con una **contraseña temporal generada por el sistema** y el flag `debe_cambiar_password = true`.
- La contraseña temporal se muestra **una sola vez** al actor que crea la cuenta (admin para staff; terapeuta para pacientes), quien la entrega al usuario por un canal fuera del sistema (en persona, teléfono, chat interno).
- En el **primer login** con la temporal, el sistema detecta el flag y **redirige obligatoriamente a un onboarding** donde el usuario define su contraseña definitiva. Al completarlo, el flag se limpia.
- El onboarding es **un solo componente reutilizable** para todos los roles (staff y pacientes).

### Regla de seguridad (no negociable)

**Nunca permitir llegar al onboarding sin una credencial previa válida.**

Se rechaza explícitamente el "login sin contraseña" (acceder al onboarding solo con el correo/usuario), porque permitiría apropiación de cuenta (account takeover) con solo conocer o adivinar el identificador.

### Propiedades de la contraseña temporal

- Generada con `SecureRandom` (no `Math.random`); longitud y complejidad mínimas.
- **Uso restringido al onboarding**: válida solo para autenticarse y cambiar la contraseña; cualquier otro uso queda bloqueado por el filtro. Sigue siendo válida hasta completar el onboarding o expirar (TTL).
- **Caducidad (TTL)**: si no se usa en el plazo definido, expira y el actor debe generar una nueva.
- Almacenada como **hash** (bcrypt/argon2); nunca en texto plano ni mostrada más de una vez.

### Control de acceso server-side

- Mientras `debe_cambiar_password = true`, toda petición autenticada responde un código específico (`403` con detalle "debes cambiar tu contraseña") o redirección al onboarding; el usuario no accede a ninguna funcionalidad hasta definir su clave.
- El guard se implementa en **backend** (no solo en la UI del frontend).

### Auditoría

Registrar en `auditoria_gestion`:

- Quién generó la temporal (admin/terapeuta), a quién, cuándo y por qué método.
- Cuándo se consumió la temporal (primer login) y cuándo se completó el onboarding.

### Responsabilidad del terapeuta (pacientes)

Para pacientes, el terapeuta es **responsable de entregar la contraseña temporal y de su confidencialidad**. Es una decisión explícita de negocio (sistema cerrado con personal clínico de confianza). La auditoría proporciona trazabilidad ante un uso indebido.

---

## Alternativas consideradas y rechazadas

| Alternativa | Motivo de rechazo |
| :--- | :--- |
| **Login sin contraseña → onboarding directo** (flag sin credencial previa) | Permite apropiación de cuenta con solo conocer/adivinar el identificador. |
| **Correo electrónico (enlace de restablecimiento)** | No hay planeación del servicio de envío en esta fase. Se podrá reintroducir después detrás de un puerto de notificaciones, sin tocar el dominio. |
| **WhatsApp / SMS (OTP)** | Costo por mensaje, requisitos de Meta/operador y mayor complejidad. Revisitar en fase futura. |
| **El admin/terapeuta fija directamente la contraseña final** | El actor conocería la contraseña definitiva del usuario (ruptura de no-repudiación y confidencialidad). |

---

## Consecuencias

### Positivas

- Un solo flujo para staff y pacientes, un solo flag y un solo componente de onboarding.
- El admin/terapeuta **nunca conoce la contraseña final** del usuario/paciente.
- Funciona **sin** servicios de correo ni SMS.
- Trazabilidad completa por auditoría.

### Negativas / riesgos

- **Ventana de suplantación**: el generador podría usar la temporal antes de entregarla. Mitigada con un solo uso + auditoría + confianza en el personal clínico (riesgo aceptado y documentado).
- Dependencia de un canal **fuera de banda** para entregar la temporal (en persona/teléfono). Aceptable en un sistema cerrado.

---

## Notas de implementación

- **Base de datos**: columna `debe_cambiar_password` en `usuarios` (+ estado de temporal/TTL) y tabla `auditoria_gestion`.
- **Backend**: endpoints de generación de temporal (admin y terapeuta), validación en login, guard de "debe cambiar contraseña" y cambio de contraseña obligatorio.
- **Frontend**: componente `onboarding-cambio-password` reutilizable, integrado en el login de staff y en el portal del paciente.
- **Detalle técnico**: ver SDD de credenciales-onboarding (pendiente de redacción).
