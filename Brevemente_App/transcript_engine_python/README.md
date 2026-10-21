# 🎙️ Brevemente Transcription Engine

Microservicio independiente, desacoplado y autónomo desarrollado en **Python 3.11+**, **FastAPI** y **faster-whisper** (motor CTranslate2). Diseñado para operar como el motor de transcripción de alta eficiencia consumido por el backend principal en **Java Spring Boot**.

---

## 🏛️ Principios de Arquitectura

1. **Agnóstico al Dominio:**  
   El servicio no contiene ninguna lógica de negocio médica ni referencias a usuarios, historias clínicas o pacientes. Su única responsabilidad es transformar flujos de audio en texto estructurado con timestamps y métricas de confianza.

2. **Pre-carga del Modelo (Model Pre-loading / Warm-up):**  
   El modelo de Whisper se descarga e instancia una única vez durante el ciclo de vida de inicio de FastAPI (`lifespan`). Permanece caliente en RAM/VRAM para responder sin penalización de latencia en peticiones subsecuentes.

3. **Concurrencia Estricta y Protección OOM:**  
   Controlado mediante `asyncio.Semaphore`. Las peticiones que exceden el límite configurado (`MAX_CONCURRENT_TRANSCRIPTIONS`) esperan en cola asíncrona sin bloquear el event loop ni agotar los recursos de CPU/RAM del servidor.

4. **Integración con Spring Boot & PostgreSQL JSONB:**  
   La estructura de respuesta DTO coincide al 100% con la estructura requerida para almacenamiento directo en columnas `JSONB` de Postgres mediante Spring Data JPA.

5. **Seguridad Interna:**  
   Todas las rutas de transcripción validan el encabezado `X-Internal-API-Key`.

---

## 📂 Estructura del Proyecto

```text
transcript_engine_python/
├── app/
│   ├── __init__.py
│   ├── main.py              # Inicialización de FastAPI, lifespan y logging
│   ├── config.py            # Configuración pydantic-settings (.env)
│   ├── dependencies.py      # Autenticación X-Internal-API-Key e inyección del modelo
│   ├── services/
│   │   ├── __init__.py
│   │   └── whisper_service.py # Core faster-whisper, semáforos y thread pool
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── transcription.py # Modelos Pydantic v2 (Request, Response, Segment)
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           └── endpoints.py # Rutas de la API (/transcribe, /sync, /health)
├── .env.example
├── .env
├── Dockerfile              # Optimizado para CPU / Hetzner Cloud
├── Dockerfile.gpu          # Soporte para NVIDIA CUDA
├── requirements.txt
└── README.md
```

---

## ⚙️ Variables de Entorno (`.env`)

| Variable | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | string | `"Brevemente Transcription Engine"` | Nombre descriptivo del microservicio |
| `ENV` | string | `"development"` | Entorno (`development` / `production`) |
| `PORT` | integer | `8000` | Puerto ASGI expuesto |
| `INTERNAL_API_KEY` | string | `"dev-secret-api-key-change-in-prod"` | Token secreto compartido con Spring Boot |
| `WHISPER_MODEL_SIZE` | string | `"base"` | Tamaño del modelo (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `WHISPER_DEVICE` | string | `"cpu"` | Dispositivo de cómputo (`cpu` o `cuda`) |
| `WHISPER_COMPUTE_TYPE`| string | `"int8"` | Precisión (`int8`, `float32` para CPU; `float16` para GPU) |
| `WHISPER_DOWNLOAD_ROOT`| string | `"./models_cache"` | Carpeta local donde se cachean los pesos del modelo |
| `WHISPER_CPU_THREADS` | integer | `4` | Hilos dedicados por transcripción en CPU (evita thrashing) |
| `WHISPER_NUM_WORKERS` | integer | `1` | Workers de lectura/decodificación de audio |
| `WHISPER_BEAM_SIZE` | integer | `2` | Búsqueda por haz (2x más rápido para audios largos) |
| `WHISPER_USE_BATCHED` | boolean | `true` | Activa BatchedInferencePipeline (acelera audios 3x-5x) |
| `WHISPER_BATCH_SIZE` | integer | `8` | Tamaño del lote de ventanas de audio en inferencia |
| `WHISPER_CONDITION_ON_PREVIOUS_TEXT`| boolean | `false` | Anti-alucinación: previene bucles de repetición en 60 min |
| `WHISPER_VAD_MIN_SILENCE_DURATION_MS`| integer | `500` | Filtro VAD: descarta silencios superiores a 500ms |
| `MAX_CONCURRENT_TRANSCRIPTIONS` | integer | `2` | Número máximo de transcripciones paralelas permitidas |
| `TEMP_DIR` | string | `"./tmp/transcriptions"` | Directorio temporal de almacenamiento de audios |
| `CALLBACK_TIMEOUT_SECONDS` | float | `30.0` | Timeout HTTP para disparar el Webhook hacia Spring Boot |

---

## 🔌 Especificación de la API

### 1. `POST /v1/transcribe` (Asíncrono con Webhook)
Recibe la orden de transcripción, retorna **inmediatamente** un código `202 Accepted` y procesa en segundo plano. Al terminar, envía un `POST` al `callback_url` indicado.

**Headers:**
- `X-Internal-API-Key: <INTERNAL_API_KEY>`

**Body (Multipart Form-Data o JSON):**
- `file`: Archivo binario de audio (mp3, wav, m4a, ogg, etc.)
- *o* `file_path`: Ruta absoluta dentro de un volumen compartido (string)
- `task_id` (string, obligatorio): Identificador UUID generado por Spring Boot.
- `callback_url` (string, opcional): Endpoint de Spring Boot a notificar con el resultado.
- `language` (string, opcional, defecto `es`): Código ISO (ej. `es`, `en`) o `auto`.

**Respuesta Inmediata (HTTP 202):**
```json
{
  "task_id": "c1f8a8b2-4d2a-4b91-9e8c-3a1b2c3d4e5f",
  "status": "PROCESSING"
}
```

---

### 2. `POST /v1/transcribe/sync` (Síncrono Directo)
Espera a que el audio sea procesado bajo el semáforo y devuelve el resultado completo en la respuesta HTTP `200 OK`. Recomendado para audios cortos o pruebas manuales.

**Headers:**
- `X-Internal-API-Key: <INTERNAL_API_KEY>`

---

### 3. `GET /v1/health` (Health Check)
Supervisión del estado del modelo y monitoreo de la saturación del semáforo.

**Respuesta (HTTP 200):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "base",
  "device": "cpu",
  "compute_type": "int8",
  "concurrency": {
    "max": 2,
    "active": 0,
    "available": 2
  }
}
```

---

## 📦 Contrato de Salida (Compatible con PostgreSQL `JSONB`)

Tanto la respuesta síncrona como la carga útil enviada al `callback_url` de Spring Boot entregan este formato:

### Transcripción Exitosa (`COMPLETED`):
```json
{
  "task_id": "c1f8a8b2-4d2a-4b91-9e8c-3a1b2c3d4e5f",
  "status": "COMPLETED",
  "duration_seconds": 1845.20,
  "language_detected": "es",
  "full_text": "Transcripción unificada del contenido del audio...",
  "segments": [
    {
      "id": 0,
      "speaker": "SPEAKER_00",
      "start": 0.00,
      "end": 4.52,
      "text": " Buenos días, ¿cómo has estado esta semana?",
      "confidence": 0.94
    },
    {
      "id": 1,
      "speaker": "SPEAKER_01",
      "start": 4.52,
      "end": 9.10,
      "text": " Hola, he sentido bastante ansiedad por el trabajo.",
      "confidence": 0.98
    }
  ],
  "error_message": null
}
```

### Transcripción Fallida (`FAILED`):
```json
{
  "task_id": "c1f8a8b2-4d2a-4b91-9e8c-3a1b2c3d4e5f",
  "status": "FAILED",
  "duration_seconds": 0.0,
  "language_detected": null,
  "full_text": null,
  "segments": [],
  "error_message": "Audio format unsupported or corrupted stream"
}
```

---

## ☕ Integración en Spring Boot (Ejemplo)

### 1. Entidad JPA con JSONB:
```java
@Entity
@Table(name = "transcription_tasks")
public class TranscriptionTask {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    private TaskStatus status; // PROCESSING, COMPLETED, FAILED

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private TranscriptionResultPayload resultPayload;

    private Instant createdAt;
    private Instant completedAt;
}
```

### 2. DTO de Recepción de Webhook en Spring Boot:
```java
public record TranscriptionResultPayload(
    UUID task_id,
    String status,
    Double duration_seconds,
    String language_detected,
    String full_text,
    List<SegmentDto> segments,
    String error_message
) {}

public record SegmentDto(
    Integer id,
    String speaker,
    Double start,
    Double end,
    String text,
    Double confidence
) {}
```

### 3. Controller de Callback en Spring Boot:
```java
@RestController
@RequestMapping("/api/v1/internal/transcriptions")
public class TranscriptionWebhookController {

    @PostMapping("/callback")
    public ResponseEntity<Void> handleCallback(
        @RequestHeader("X-Internal-API-Key") String internalApiKey,
        @RequestBody TranscriptionResultPayload payload
    ) {
        // 1. Validar internalApiKey
        // 2. Actualizar estado y guardar payload en la columna JSONB
        // 3. Notificar via WebSocket/SSE al frontend si aplica
        return ResponseEntity.ok().build();
    }
}
```

---

## 🚀 Despliegue y Ejecución

### Opción 1: Ejecución Local con Python (Entorno Virtual)

```bash
# 1. Crear y activar entorno virtual
python -m venv venv

# En Windows PowerShell:
.\venv\Scripts\Activate.ps1
# En Linux/macOS:
source venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Iniciar el servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Nota:** En Windows y Linux, asegúrate de tener `ffmpeg` instalado en tu sistema (`winget install Gyan.FFmpeg` o `sudo apt install ffmpeg`).

---

### Opción 2: Contenedor Docker (Producción CPU en Hetzner Cloud)

```bash
# Construir la imagen
docker build -t brevemente-transcription-engine:latest .

# Ejecutar el contenedor
docker run -d \
  --name transcription-engine \
  -p 8000:8000 \
  -v $(pwd)/models_cache:/app/models_cache \
  -e INTERNAL_API_KEY="mi_super_secreto_de_produccion" \
  -e MAX_CONCURRENT_TRANSCRIPTIONS=2 \
  -e WHISPER_MODEL_SIZE="base" \
  brevemente-transcription-engine:latest
```

---

### Opción 3: Contenedor Docker con GPU (NVIDIA CUDA)

```bash
# Construir la imagen para GPU
docker build -f Dockerfile.gpu -t brevemente-transcription-gpu:latest .

# Ejecutar con soporte para GPU
docker run -d \
  --gpus all \
  --name transcription-engine-gpu \
  -p 8000:8000 \
  -v $(pwd)/models_cache:/app/models_cache \
  -e INTERNAL_API_KEY="mi_super_secreto_de_produccion" \
  -e WHISPER_MODEL_SIZE="medium" \
  -e WHISPER_DEVICE="cuda" \
  -e WHISPER_COMPUTE_TYPE="float16" \
  brevemente-transcription-gpu:latest
```

---

---

## 🧪 Pruebas Interactivas con Swagger UI

FastAPI incluye **Swagger UI** interactivo listo para probar los endpoints directamente desde tu navegador:

👉 **URL de Swagger UI:** `http://localhost:8000/docs`  
👉 **URL de ReDoc (Documentación alternativa):** `http://localhost:8000/redoc`

### ¿Cómo probar desde Swagger UI?
1. Inicia el microservicio (`uvicorn app.main:app --port 8000 --reload` o mediante Docker).
2. Abre `http://localhost:8000/docs` en tu navegador.
3. Haz clic en el botón verde **Authorize 🔓** (arriba a la derecha).
4. En el campo **X-Internal-API-Key**, ingresa tu clave secreta (por defecto: `dev-secret-api-key-change-in-prod`) y presiona **Authorize**. La clave se recordará automáticamente en tu navegador.
5. Despliega cualquier endpoint (por ejemplo `POST /v1/transcribe/sync`):
   - Haz clic en **Try it out**.
   - En el campo `file`, selecciona cualquier archivo de audio de prueba (`.mp3`, `.wav`, etc.) desde tu computadora.
   - Especifica un `task_id` (o usa el UUID de ejemplo ya sugerido).
   - Haz clic en el botón azul **Execute**.
6. Observa la respuesta HTTP `200` con el texto completo, segmentos con timestamps y confianza en tiempo real.

---

## 💻 Pruebas Alternativas con cURL

### Probar Health Check:
```bash
curl -X GET http://localhost:8000/v1/health
```

### Probar Transcripción Asíncrona (Subiendo archivo):
```bash
curl -X POST http://localhost:8000/v1/transcribe \
  -H "X-Internal-API-Key: dev-secret-api-key-change-in-prod" \
  -F "file=@/ruta/a/mi_audio.mp3" \
  -F "task_id=c1f8a8b2-4d2a-4b91-9e8c-3a1b2c3d4e5f" \
  -F "callback_url=http://localhost:8080/api/v1/internal/transcriptions/callback" \
  -F "language=es"
```

### Probar Transcripción Síncrona:
```bash
curl -X POST http://localhost:8000/v1/transcribe/sync \
  -H "X-Internal-API-Key: dev-secret-api-key-change-in-prod" \
  -F "file=@/ruta/a/mi_audio.mp3" \
  -F "task_id=c1f8a8b2-4d2a-4b91-9e8c-3a1b2c3d4e5f" \
  -F "language=es"
```
