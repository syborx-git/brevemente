# Manual de Usuario — pipeline de generación

Scripts que producen `Brevemente_App/docs/manual/MANUAL-USUARIO.pdf`.

```
Brevemente_App/docs/manual/
├── MANUAL-USUARIO.md      ← fuente editable (Markdown)
├── MANUAL-USUARIO.pdf     ← entregable
├── figuras/               ← 40 capturas + 3 diagramas (PNG)
└── build/manual.html      ← HTML intermedio usado para el PDF
```

## Requisitos

```powershell
# 1) Sistema corriendo en local
cd ..\..\Brevemente_App\..\brevemente_demo      # demo/portal React
npm run dev -- --port 5199

# 2) Dependencias del pipeline (instaladas en esta carpeta)
npm install mermaid@11 pdfjs-dist @napi-rs/canvas
```

Playwright se toma de `Brevemente_App/frontend/node_modules/playwright`.

## 1. Capturar las figuras

```powershell
node capture.js          # todas
node capture.js 07       # solo las que empiezan por "07"
```

- Navega con un navegador real, recorre el flujo de cada módulo y captura `1440 × 1800` @1.5x.
- **Saneamiento**: elimina de la interfaz cualquier leyenda del entorno de revisión
  (`Iniciar demo`, `Demo Guiado`, `DEMO ROL:`, `Simular WhatsApp`, etc.).
- **Verificación**: si queda cualquier término prohibido en el texto visible, la captura se descarta
  y se anota el error en `_capture-log.json`.

## 2. Generar el PDF

```powershell
node build.js
```

El script:

1. Convierte `MANUAL-USUARIO.md` a HTML (tablas, figuras, avisos, diagramas).
2. Numera y lista automáticamente el **Índice de figuras**.
3. Renderiza los diagramas Mermaid y los rasteriza a `figuras/diagrama-*.png`.
4. Exporta a PDF A4 con encabezado, pie, numeración de páginas, enlaces internos y marcadores.

## 3. Verificar el resultado

```powershell
node extract.js
```

Comprueba: número de páginas, secciones obligatorias presentes, páginas con imagen,
páginas casi vacías y **ausencia total** de los términos prohibidos en el texto del PDF.

## Diagramas

Los diagramas están en el Markdown como bloques `:::mermaid nombre | Figura N. Título`.
Se renderizan con Mermaid y se incrustan como imagen, de modo que el PDF no depende de
JavaScript ni de fuentes externas al abrirse.
