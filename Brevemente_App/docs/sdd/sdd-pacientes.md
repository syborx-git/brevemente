# SDD-003: Software Design Document — Módulo Pacientes (SDOP)

- **Módulo**: `pacientes`
- **Código SDD**: `SDD-003`
- **Versión**: 1.0.0
- **Fecha**: 2026-09-24
- **Estado**: APROBADO PARA IMPLEMENTACIÓN
- **Alineación Normativa**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), GAP-PAC (Reporte de Brechas)
- **Rol**: Lead Software Architect

---

## 1. Plan de Reutilización: Entidades JPA y DTOs a Extender

Siguiendo el principio rector de SDOP (**"Reutilizar y adaptar antes de proponer código nuevo"**), no se descartará ni reemplazará el esquema previo de base de datos. Se extiende la base existente para cerrar las brechas detectadas en `gap-report-pacientes.md`.

### 1.1 Inventario de Reutilización
1. **Tabla PostgreSQL `pacientes` (`V1__init_schema.sql`)**:
   - **Campos ya existentes a reutilizar**: `id`, `nombre`, `apellidos`, `curp`, `fecha_nacimiento`, `edad_calculada`, `telefono`, `email`, `estado_consentimiento`, `persona_de_apoyo_nombre`, `persona_de_apoyo_contacto`, `created_at`, `updated_at`.
   - **Estrategia de Extensión**: Añadir columnas complementarias mediante migración evolutiva Flyway `V3__extend_pacientes_schema.sql` sin romper constraints existentes ni claves foráneas hacia `expedientes_clinicos` o `citas`.
2. **Tabla `terapeutas` (`V1` y `V2`)**:
   - Se reutilizan los registros semilla `ter-001` (Dra. Sofía Ramírez) y `ter-002` (Mtro. Alejandro Mendoza) como llaves foráneas para el terapeuta titular asignado al paciente.
3. **Frontend Inmutable**:
   - `ports/paciente.repository.ts`: Interfaz inmutable que define el contrato.
   - `pacientes.component.html` y `pacientes.component.scss`: **100% INTACTOS** (Regla de Oro de UI).

---

## 2. Migración Flyway: Script SQL `V3__extend_pacientes_schema.sql`

- **Consecutivo Oficial**: `V3` (sucede a `V1__init_schema.sql` y `V2__seed_clinical_data.sql`).
- **Ubicación**: `Brevemente_App/backend/src/main/resources/db/migration/V3__extend_pacientes_schema.sql`.
- **Propiedades**: Idempotente, seguro para entornos PostgreSQL existentes y con actualización de registros semilla.

```sql
-- =============================================================================
-- Migración V3: Extensión de Esquema para Directorio de Pacientes (SDOP)
-- Alineado con SDD-003 y gap-report-pacientes.md
-- =============================================================================

-- 1. Agregar columnas requeridas por el frontend clínico de pacientes
ALTER TABLE pacientes
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'activo',
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10) DEFAULT 'bajo',
    ADD COLUMN IF NOT EXISTS registry_mode VARCHAR(10) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS session_frequency VARCHAR(20) DEFAULT 'semanal',
    ADD COLUMN IF NOT EXISTS quien_completa_registro VARCHAR(30) DEFAULT 'PACIENTE',
    ADD COLUMN IF NOT EXISTS motivo_consulta TEXT,
    ADD COLUMN IF NOT EXISTS terapeuta_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS fecha_determinacion_consentimiento DATE,
    ADD COLUMN IF NOT EXISTS motivo_determinacion_consentimiento TEXT,
    ADD COLUMN IF NOT EXISTS representante_parentesco VARCHAR(30),
    ADD COLUMN IF NOT EXISTS representante_correo VARCHAR(150),
    ADD COLUMN IF NOT EXISTS consentimiento_representante_firmado BOOLEAN DEFAULT FALSE;

-- 2. Restricción de Clave Foránea hacia terapeutas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_pacientes_terapeuta'
    ) THEN
        ALTER TABLE pacientes
            ADD CONSTRAINT fk_pacientes_terapeuta
            FOREIGN KEY (terapeuta_id) REFERENCES terapeutas(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Índices de Búsqueda y Filtrado
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_pacientes_risk_level ON pacientes(risk_level);
CREATE INDEX IF NOT EXISTS idx_pacientes_terapeuta ON pacientes(terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_estado_consentimiento ON pacientes(estado_consentimiento);

-- 4. Actualización de Semilla Existente (V2) con los nuevos campos clínicos
UPDATE pacientes
SET status = 'activo',
    risk_level = 'medio',
    registry_mode = 'ia',
    session_frequency = 'semanal',
    quien_completa_registro = 'FAMILIAR_O_APOYO',
    motivo_consulta = 'Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.',
    terapeuta_id = 'ter-001',
    fecha_determinacion_consentimiento = '2026-08-10',
    motivo_determinacion_consentimiento = 'Menor de 18 años calculado automáticamente',
    representante_parentesco = 'MADRE',
    representante_correo = 'claudia.santos@familia.mx',
    consentimiento_representante_firmado = TRUE
WHERE id = 'pac-001';

UPDATE pacientes
SET status = 'activo',
    risk_level = 'alto',
    registry_mode = 'manual',
    session_frequency = 'quincenal',
    quien_completa_registro = 'PACIENTE',
    motivo_consulta = 'Crisis de pánico con agorafobia incipiente en transporte público.',
    terapeuta_id = 'ter-001',
    fecha_determinacion_consentimiento = '2026-08-15',
    consentimiento_representante_firmado = FALSE
WHERE id = 'pac-002';

UPDATE pacientes
SET status = 'pendiente',
    risk_level = 'bajo',
    registry_mode = 'manual',
    session_frequency = 'mensual',
    quien_completa_registro = 'PACIENTE',
    motivo_consulta = 'Evaluación diagnóstica inicial TBE y valoración de cambio.',
    terapeuta_id = 'ter-002',
    fecha_determinacion_consentimiento = '2026-08-20',
    consentimiento_representante_firmado = FALSE
WHERE id = 'pac-003';

-- 5. Semilla adicional para cubrir todos los filtros de la demo interactiva (Completado y Archivados)
INSERT INTO pacientes (
    id, nombre, apellidos, curp, fecha_nacimiento, edad_calculada,
    telefono, email, estado_consentimiento, status, risk_level,
    registry_mode, session_frequency, quien_completa_registro, motivo_consulta,
    terapeuta_id, fecha_determinacion_consentimiento, consentimiento_representante_firmado
) VALUES (
    'pac-004', 'Roberto', 'Valdés Garza', 'VARR791201HDFZZ01', '1979-12-01', 46,
    '+52 55 8765 4321', 'roberto.valdes@email.com', 'AUTONOMO', 'completado', 'bajo',
    'manual', 'mensual', 'PACIENTE', 'Problemas de pareja y comunicación destructiva resueltos en 8 sesiones.',
    'ter-002', '2026-07-01', TRUE
) ON CONFLICT (id) DO NOTHING;
```

---

## 3. Especificación Backend en Spring Boot 3 (Java 21)

### 3.1 Estructura de Paquetes
```text
com.syborx.brevemente
├── controller
│   ├── PacienteController.java
│   └── config
│       └── WebCorsConfig.java
├── domain
│   └── model
│       ├── PacienteEntity.java
│       └── TerapeutaEntity.java
├── dto
│   ├── CapacidadConsentimientoDTO.java
│   ├── RepresentanteLegalDTO.java
│   ├── PacienteResponseDTO.java
│   ├── PacienteCreateRequest.java
│   └── PacientePatchRequest.java
├── mapper
│   └── PacienteMapper.java
├── repository
│   ├── PacienteRepository.java
│   └── TerapeutaRepository.java
└── service
    └── PacienteService.java
```

---

### 3.2 Entidades JPA (`domain/model`)

#### `PacienteEntity.java`
```java
package com.syborx.brevemente.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PacienteEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "apellidos", length = 100, nullable = false)
    private String apellidos;

    @Column(name = "curp", length = 18, unique = true)
    private String curp;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "edad_calculada", nullable = false)
    private Integer edadCalculada;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "estado_consentimiento", length = 30, nullable = false)
    private String estadoConsentimiento;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "risk_level", length = 10)
    private String riskLevel;

    @Column(name = "registry_mode", length = 10)
    private String registryMode;

    @Column(name = "session_frequency", length = 20)
    private String sessionFrequency;

    @Column(name = "quien_completa_registro", length = 30)
    private String quienCompletaRegistro;

    @Column(name = "motivo_consulta", columnDefinition = "TEXT")
    private String motivoConsulta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "terapeuta_id")
    private TerapeutaEntity terapeuta;

    // Metadatos de consentimiento
    @Column(name = "fecha_determinacion_consentimiento")
    private LocalDate fechaDeterminacionConsentimiento;

    @Column(name = "motivo_determinacion_consentimiento", columnDefinition = "TEXT")
    private String motivoDeterminacionConsentimiento;

    // Metadatos de representante / persona de apoyo
    @Column(name = "persona_de_apoyo_nombre", length = 200)
    private String personaDeApoyoNombre;

    @Column(name = "persona_de_apoyo_contacto", length = 100)
    private String personaDeApoyoContacto;

    @Column(name = "representante_parentesco", length = 30)
    private String representanteParentesco;

    @Column(name = "representante_correo", length = 150)
    private String representanteCorreo;

    @Column(name = "consentimiento_representante_firmado")
    private Boolean consentimientoRepresentanteFirmado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
```

---

### 3.3 Contratos DTO (Records en Java 21)

#### `CapacidadConsentimientoDTO.java`
```java
package com.syborx.brevemente.dto;

public record CapacidadConsentimientoDTO(
    String estado,
    String determinadoPor,
    String fechaDeterminacion,
    String fechaRevision,
    String motivo
) {}
```

#### `RepresentanteLegalDTO.java`
```java
package com.syborx.brevemente.dto;

public record RepresentanteLegalDTO(
    String nombreCompleto,
    String parentesco,
    String telefono,
    String correo,
    Object documentoIdentificacion,
    Object documentoVinculo,
    String otroProgenitorInformado
) {}
```

#### `PacienteResponseDTO.java` (Espejo 100% simétrico con `Patient` de Angular)
```java
package com.syborx.brevemente.dto;

public record PacienteResponseDTO(
    String id,
    String name,
    String phone,
    String email,
    String birthDate,
    String curp,
    String registrationDate,
    String status,
    String riskLevel,
    String registryMode,
    String motif,
    String therapistId,
    String therapistName,
    String fechaNacimiento,
    Integer edadCalculada,
    CapacidadConsentimientoDTO capacidadConsentimiento,
    String quienCompletaRegistro,
    RepresentanteLegalDTO representante,
    String telefonoPaciente,
    Boolean consentimientoRepresentanteFirmado,
    String sessionFrequency
) {}
```

#### `PacienteCreateRequest.java`
```java
package com.syborx.brevemente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PacienteCreateRequest(
    @NotBlank(message = "El nombre es obligatorio")
    String name,

    String phone,
    String email,

    @NotBlank(message = "La fecha de nacimiento es obligatoria")
    String birthDate,

    @Size(max = 18, message = "El CURP no puede exceder 18 caracteres")
    String curp,

    String status,
    String riskLevel,
    String registryMode,
    String motif,
    String therapistId,
    String therapistName,
    String fechaNacimiento,
    Integer edadCalculada,
    CapacidadConsentimientoDTO capacidadConsentimiento,
    String quienCompletaRegistro,
    RepresentanteLegalDTO representante,
    String telefonoPaciente,
    Boolean consentimientoRepresentanteFirmado,
    String sessionFrequency
) {}
```

#### `PacientePatchRequest.java`
```java
package com.syborx.brevemente.dto;

public record PacientePatchRequest(
    String name,
    String phone,
    String email,
    String status,
    String riskLevel,
    String motif,
    String sessionFrequency,
    CapacidadConsentimientoDTO capacidadConsentimiento,
    RepresentanteLegalDTO representante,
    Boolean consentimientoRepresentanteFirmado
) {}
```

---

### 3.4 Capa de Mapeo (`mapper/PacienteMapper.java`)
Convierte bidireccionalmente entre entidad y DTOs, encapsulando:
1. **Separación de Nombre**: Divide `name` en primer nombre y apellidos. Si no se puede dividir, asigna el valor a `nombre` y deja `apellidos` vacío.
2. **Reconstrucción de Nombre**: Concatena `nombre + " " + apellidos.trim()` en la respuesta.
3. **Cálculo de Edad**: Si `edadCalculada` es nula en la creación, se calcula con `java.time.Period.between(fechaNacimiento, LocalDate.now()).getYears()`.

---

### 3.5 Repositorio y Servicio (`repository` & `service`)

#### `PacienteRepository.java`
```java
package com.syborx.brevemente.repository;

import com.syborx.brevemente.domain.model.PacienteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<PacienteEntity, String> {
    Optional<PacienteEntity> findByCurp(String curp);
    boolean existsByCurp(String curp);
}
```

#### `PacienteService.java`
- Métodos del Servicio:
  - `List<PacienteResponseDTO> listarTodos()`
  - `PacienteResponseDTO obtenerPorId(String id)`
  - `PacienteResponseDTO crearPaciente(PacienteCreateRequest req)`
  - `PacienteResponseDTO actualizarPaciente(String id, PacientePatchRequest cambios)`
- Reglas de Validación Clínica:
  - Si edad calculada < 18 y el estado de consentimiento no se definió, se fuerza a `REPRESENTADO_POR_EDAD`.
  - Generación de ID: `pac-{UUID}` para persistencia uniforme.

---

### 3.6 Controlador REST (`controller/PacienteController.java`)

```java
package com.syborx.brevemente.controller;

import com.syborx.brevemente.dto.PacienteCreateRequest;
import com.syborx.brevemente.dto.PacientePatchRequest;
import com.syborx.brevemente.dto.PacienteResponseDTO;
import com.syborx.brevemente.service.PacienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService pacienteService;

    @GetMapping
    public ResponseEntity<List<PacienteResponseDTO>> listar() {
        return ResponseEntity.ok(pacienteService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PacienteResponseDTO> buscarPorId(@PathVariable String id) {
        return ResponseEntity.ok(pacienteService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<PacienteResponseDTO> crear(@Valid @RequestBody PacienteCreateRequest request) {
        PacienteResponseDTO creado = pacienteService.crearPaciente(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PacienteResponseDTO> actualizar(
            @PathVariable String id,
            @RequestBody PacientePatchRequest cambios
    ) {
        return ResponseEntity.ok(pacienteService.actualizarPaciente(id, cambios));
    }
}
```

*Nota sobre URLs*: Dado que en `application.yml` está configurado `server.servlet.context-path: /api/v1`, la ruta resultante expuesta por Spring Boot es **`/api/v1/pacientes`**, coincidiendo exactamente con la URL del `PacienteHttpAdapter` de Angular.

---

## 4. Angular: Estructura de la Clase `PacienteHttpAdapter`

Ubicación: `Brevemente_App/frontend/src/app/modules/pacientes/adapters/paciente-http.adapter.ts`.

### 4.1 Requisitos del Adaptador
1. Implementar estrictamente `PacienteRepository`.
2. Usar `HttpClient` de `@angular/common/http`.
3. Inyección transparente en `pacientes.component.ts` a través de la bandera `environment.features.pacientesBackend`.

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { PacienteRepository } from '../ports/paciente.repository';
import { Patient } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class PacienteHttpAdapter implements PacienteRepository {
  private readonly apiUrl = '/api/v1/pacientes';

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('[PacienteHttpAdapter] Error al listar pacientes:', err);
        return throwError(() => new Error('Error al consultar el directorio de pacientes en el backend'));
      })
    );
  }

  buscarPorId(id: string): Observable<Patient | null> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        if (err.status === 404) return [null];
        console.error(`[PacienteHttpAdapter] Error al buscar paciente ${id}:`, err);
        return throwError(() => new Error('Error al obtener el expediente del paciente'));
      })
    );
  }

  crear(paciente: Omit<Patient, 'id'>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, paciente).pipe(
      catchError(err => {
        console.error('[PacienteHttpAdapter] Error al registrar paciente:', err);
        return throwError(() => new Error('No se pudo registrar el paciente en el servidor'));
      })
    );
  }

  actualizar(id: string, cambios: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.apiUrl}/${id}`, cambios).pipe(
      catchError(err => {
        console.error(`[PacienteHttpAdapter] Error al actualizar paciente ${id}:`, err);
        return throwError(() => new Error('No se pudo actualizar el paciente en el servidor'));
      })
    );
  }
}
```

---

## 5. Matriz de Trazabilidad y Criterios de Aceptación (DoD)

| Requisito / GAP | Criterio de Aceptación | Método de Verificación |
| :--- | :--- | :--- |
| **GAP-PAC-01 & 04** | Flyway `V3` migra exitosamente agregando `status`, `risk_level`, `motivo_consulta`, etc. | `mvn compile` y logs de arranque Flyway sin errores. |
| **GAP-PAC-02 & 03** | Endpoints `GET`, `POST`, `PATCH /api/v1/pacientes` responden 200/201 con DTO idéntico a `Patient`. | Pruebas REST unitarias con `MockMvc`. |
| **GAP-PAC-05** | Formato de fecha `YYYY-MM-DD` y nombre completo serializados sin errores de deserialización. | Inspección de payload JSON en llamadas HTTP. |
| **UI Inmutable** | `pacientes.component.html` y `pacientes.component.scss` permanecen con cero modificaciones de git. | `git status` y `git diff`. |
| **Dual Adapter** | Al activar `environment.features.pacientesBackend: true`, la tabla de Angular consume datos de Spring Boot/PostgreSQL. | Prueba en navegador / Playwright en `http://localhost:4200/`. |
