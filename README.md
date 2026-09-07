# BreveMente

Prototipo navegable de la plataforma BreveMente para operación clínica, Terapia Breve Estratégica, formación, supervisión y asistencia mediante Senda.

## Requisitos

- Node.js 18 o superior
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilación

```bash
npm run build
```

## Representación Legal y Capacidad de Consentimiento

El sistema implementa un modelo unificado de capacidad de consentimiento informado:
- **Edad objetiva**: Calculada automáticamente por el sistema desde la fecha de nacimiento (autocompletada mediante CURP de 18 caracteres).
- **Capacidad clínica**: Criterio reservado al clínico tratante en la admisión médica/psicoterapéutica; el formulario de creación nunca indaga sobre diagnósticos o condiciones psiquiátricas ni permite autodeclaraciones de capacidad disminuida.
- **Nomenclatura ética obligatoria**: Uso estricto de `PERSONA_DE_APOYO` ("persona de apoyo designada"). Se descarta absolutamente cualquier terminología lesiva ("interdicción", "incapacitado", "incompetente").

### Bloqueos Operativos Normativos
Mientras un expediente mantenga el estado `REPRESENTADO_POR_EDAD` o `PENDIENTE_DETERMINACION` sin que el representante formalice la firma de consentimiento en el expediente, el sistema bloquea con controles deshabilitados y tooltip explicativo:
1. Confirmar cita en la agenda
2. Iniciar grabación de sesión (Modo Asistido IA)
3. Generar y descargar constancias clínicas o psicoterapéuticas

Tooltip normativo: *"Falta el consentimiento del representante legal. Complétalo en el expediente para habilitar esta acción."*

### Alerta de Mayoría de Edad
El sistema detecta a pacientes que alcanzan los 18 años habiendo nacido en estado `REPRESENTADO_POR_EDAD`, emitiendo una alerta prioritaria en el tablero del clínico, marcando el expediente como pendiente de reconsentimiento autónomo y preparando la revocación de notificaciones al representante legal.

### Pendiente de Validación con el Área Legal de BreveMente
Se deja documentado que los siguientes tres puntos siguen abiertos con el departamento jurídico y están sujetos a ajuste normativo:
1. **Consentimiento monoparental vs. biparental**: Si basta el consentimiento de un solo progenitor o se requieren ambos para tratamientos en menores.
2. **Asentimiento informado del menor**: La edad a partir de la cual se solicita formalmente el asentimiento del propio menor de edad en adición al consentimiento del representante.
3. **Desacoplamiento contractual**: Si la aceptación de términos y condiciones de la plataforma tecnológica se separa del consentimiento informado para el tratamiento clínico.

## Importante

Este repositorio contiene un prototipo con datos ficticios. No debe utilizarse para almacenar información real de pacientes ni como sistema clínico de producción.
