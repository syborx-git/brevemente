# BreveMente - Workspace SDOP

Monorepositorio para la plataforma clínica **BreveMente** (Terapia Breve Estratégica), organizado bajo la metodología **SDOP (Spec-Driven / Software Development Operations Protocol)** de Syborx.

---

## Estructura del Workspace

```text
brevemente/
├── .mcp/
│   └── mcp.json                         # Servidores MCP (Playwright + PostgreSQL)
│
├── brevemente_demo/                     # Maqueta / Prototipo funcional React + Vite (Referencia visual)
│   ├── src/                             # Código fuente original de la demo
│   ├── package.json
│   └── vite.config.ts
│
└── Brevemente_App/                      # Aplicación Productiva SDOP
    ├── .agents/
    │   └── skills/                      # Skills SDOP para Antigravity IDE
    │       ├── sdop-governance/SKILL.md
    │       └── sdop-hexagonal/SKILL.md
    │
    ├── frontend/                        # Frontend Angular (Arquitectura Hexagonal)
    │   └── src/app/modules/
    │       ├── pacientes/               # Ports & Dual Adapters (LocalStorage / Mock & HTTP REST)
    │       ├── expediente-clinico/
    │       ├── agenda/
    │       └── asistente-leva/
    │
    ├── backend/                         # Backend Spring Boot (Java 21)
    │   └── src/main/resources/db/migration/  # Migraciones Flyway V1 & V2
    │
    └── docs/                            # Gobernanza y Documentación Técnica
        ├── adr/                         # Architecture Decision Records
        ├── sdd/                         # Software Design Documents por módulo
        └── gap-analysis/                # Auditoría de paridad y validación Playwright
```

---

## Guía Rápida de Ejecución

### 1. Consultar la Demo / Maqueta React Original
```bash
cd brevemente_demo
npm run dev
```

### 2. Frontend Angular (`Brevemente_App/frontend`)
```bash
cd Brevemente_App/frontend
npm install
npm start
```

### 3. Backend Spring Boot (`Brevemente_App/backend`)
```bash
cd Brevemente_App/backend
mvn spring-boot:run
```
