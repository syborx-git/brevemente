const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/frontend/node_modules/playwright');

const DOCS = 'c:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/docs/manual';
const MD = path.join(DOCS, 'MANUAL-USUARIO.md');
const HTML = path.join(DOCS, 'build', 'manual.html');
const PDF = path.join(DOCS, 'MANUAL-USUARIO.pdf');
const MERMAID_JS = 'file:///C:/proyectos_Syborx/Brevemente_Demo/brevemente/_ui_audit/build/node_modules/mermaid/dist/mermaid.min.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Conversión Markdown → HTML ───────────────────────────────────────────────
function convert(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  const toc = [];
  const figures = [];
  let i = 0;
  let figCount = 0;
  let usedIds = new Set();

  const pushHeading = (level, text) => {
    let id = slug(text);
    let k = 2;
    while (usedIds.has(id)) id = slug(text) + '-' + k++;
    usedIds.add(id);
    if (level <= 2) toc.push({ level, text, id });
    out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
  };

  while (i < lines.length) {
    const line = lines[i];

    // Page break
    if (/^:::pagebreak\s*$/.test(line)) { out.push('<div class="pagebreak"></div>'); i++; continue; }

    // Figure — formato multilínea (ruta \n caption \n :::) o en una sola línea con "|"
    let m = line.match(/^:::figure\s+(\S+)\s*(?:\|\s*(.*))?$/);
    if (m) {
      const src = m[1];
      let caption = (m[2] || '').trim();
      i++;
      if (!caption) {
        while (i < lines.length && !lines[i].trim()) i++;
        caption = (lines[i] || '').trim();
        i++;
      }
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) i++;
      i++;
      const capNum = (caption.match(/Figura (\d+)\./) || [])[1] || '?';
      const id = `fig-${capNum}`;
      out.push(
        `<figure id="${id}"><img src="${src}" alt="${esc(caption)}"/><figcaption>${inline(caption)}</figcaption></figure>`
      );
      figures.push({ num: parseInt(capNum, 10), caption, id });
      continue;
    }

    // Mermaid
    m = line.match(/^:::mermaid\s+(\S+)\s*\|\s*(.+)$/);
    if (m) {
      const name = m[1];
      const caption = m[2].trim();
      const capNum = (caption.match(/Figura (\d+)\./) || [])[1] || '?';
      const id = `fig-${capNum}`;
      i++;
      const code = [];
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      out.push(
        `<figure class="diagram" id="${id}"><div class="mermaid" data-name="${name}">${esc(code.join('\n'))}</div>` +
        `<figcaption>${inline(caption)}</figcaption></figure>`
      );
      figures.push({ num: parseInt(capNum, 10), caption, id });
      continue;
    }

    // Callout / note / important
    m = line.match(/^:::(callout|note|important)\s*$/);
    if (m) {
      const kind = m[1];
      i++;
      const body = [];
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) { body.push(lines[i]); i++; }
      i++;
      const label = { callout: 'Nota', note: 'Nota', important: 'Importante' }[kind];
      const inner = body.join(' ').trim();
      out.push(`<div class="callout ${kind}"><span class="callout-label">${label}</span><p>${inline(inner)}</p></div>`);
      continue;
    }

    // Headings
    m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) { pushHeading(m[1].length, m[2].trim()); i++; continue; }

    // Table
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const header = line.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      const th = header.map((h) => `<th>${inline(h)}</th>`).join('');
      const tb = rows
        .map((r) => '<tr>' + r.map((c) => {
          const center = /^:?-+:$/.test(c) ? '' : '';
          const isCheck = c === '✔' || c === '—';
          return `<td class="${isCheck ? 'mark' : ''}">${inline(c)}${center}</td>`;
        }).join('') + '</tr>')
        .join('');
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`);
      continue;
    }

    // Lists
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      out.push('<ul>' + items.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push('<ol>' + items.map((x) => `<li>${inline(x)}</li>`).join('') + '</ol>');
      continue;
    }

    // Blank
    if (/^\s*$/.test(line)) { i++; continue; }

    // Paragraph
    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#|\||:::|---)/.test(lines[i].trim())) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    else i++;
  }

  return { html: out.join('\n'), toc, figures, figCount };
}

// ── Plantilla ────────────────────────────────────────────────────────────────
const CSS = `
@page { size: A4; margin: 20mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 10.2pt; line-height: 1.55; color: #1f2937;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1 { font-size: 19pt; color: #0f2a3d; margin: 0 0 10pt; padding-bottom: 5pt;
     border-bottom: 2.5pt solid #75afbc; break-before: page; break-after: avoid; }
h2 { font-size: 13pt; color: #123b52; margin: 16pt 0 6pt; break-after: avoid; }
h3 { font-size: 11pt; color: #123b52; margin: 12pt 0 4pt; break-after: avoid; }
p { margin: 0 0 7pt; text-align: justify; orphans: 3; widows: 3; }
ul, ol { margin: 0 0 8pt 0; padding-left: 16pt; }
li { margin-bottom: 3pt; }
strong { color: #0f2a3d; }
code { background: #eef3f6; border-radius: 3px; padding: 1px 4px; font-size: 9pt; color: #0f4c5c; }
table { width: 100%; border-collapse: collapse; margin: 6pt 0 12pt; font-size: 8.8pt; break-inside: avoid; }
th { background: #0f2a3d; color: #fff; text-align: left; padding: 5pt 6pt; font-weight: 600; font-size: 8.6pt; }
td { padding: 4.5pt 6pt; border-bottom: 0.6pt solid #dbe4ea; vertical-align: top; }
tbody tr:nth-child(even) { background: #f5f8fa; }
td.mark { text-align: center; color: #0f7a8c; font-weight: 700; }
figure { margin: 10pt 0 14pt; break-inside: avoid; text-align: center; }
figure img { max-width: 100%; max-height: 178mm; border: 0.7pt solid #cfdae1;
             border-radius: 3pt; box-shadow: 0 2pt 6pt rgba(15,42,61,.10); }
figure.diagram { background: #fbfcfd; border: 0.7pt solid #dbe4ea; border-radius: 4pt; padding: 8pt 6pt; }
figure.diagram svg { max-width: 100%; height: auto; }
figcaption { font-size: 8.6pt; color: #4b6474; margin-top: 5pt; font-style: italic; text-align: center; }
.callout { border-left: 3pt solid #75afbc; background: #f2f8fa; padding: 7pt 10pt; margin: 8pt 0 12pt;
           break-inside: avoid; border-radius: 0 3pt 3pt 0; }
.callout.note { border-left-color: #7aa5c4; background: #f3f6fa; }
.callout.important { border-left-color: #c2410c; background: #fdf5f0; }
.callout-label { display: block; font-size: 8pt; font-weight: 700; letter-spacing: .08em;
                 text-transform: uppercase; color: #0f4c5c; margin-bottom: 2pt; }
.callout.important .callout-label { color: #b03a06; }
.callout p { margin: 0; }
.pagebreak { break-after: page; }

/* Portada */
.cover { height: 247mm; display: flex; flex-direction: column; justify-content: space-between;
         text-align: left; page-break-after: always; }
.cover-top { border-top: 5pt solid #0f2a3d; padding-top: 10mm; }
.cover-brand { font-size: 30pt; font-weight: 700; color: #0f2a3d; letter-spacing: -0.5pt; margin: 0; }
.cover-brand span { color: #75afbc; }
.cover-claim { font-size: 9pt; letter-spacing: .18em; text-transform: uppercase; color: #6b7f8d; margin-top: 4pt; }
.cover-main { margin-top: 42mm; }
.cover-title { font-size: 40pt; font-weight: 300; color: #123b52; margin: 0; line-height: 1.1; }
.cover-rule { width: 46mm; height: 3pt; background: #75afbc; margin: 10mm 0 8mm; }
.cover-sub { font-size: 11pt; color: #4b6474; margin: 0; }
.cover-meta { display: table; font-size: 10pt; color: #1f2937; margin-top: 14mm; }
.cover-meta div { display: table-row; }
.cover-meta span { display: table-cell; padding: 2.5pt 0; }
.cover-meta .k { color: #6b7f8d; width: 34mm; text-transform: uppercase; font-size: 8pt; letter-spacing: .1em; }
.cover-foot { border-top: 0.8pt solid #cfdae1; padding-top: 6mm; font-size: 8.6pt; color: #6b7f8d;
              display: flex; justify-content: space-between; }

/* Índice */
.toc h1 { break-before: auto; }
.toc ul { list-style: none; padding: 0; margin: 0; }
.toc li { margin: 0; }
.toc .l1 { font-weight: 600; font-size: 10pt; margin-top: 7pt; color: #0f2a3d; }
.toc .l2 { font-size: 9.2pt; margin-left: 7mm; color: #3f5b6b; }
.toc a { color: inherit; text-decoration: none; }
.toc .l2::before { content: ""; }
.figindex ul { list-style: none; padding: 0; margin: 0; font-size: 9pt; }
.figindex li { margin-bottom: 3.5pt; color: #3f5b6b; }
.figindex a { color: #0f4c5c; text-decoration: none; }
.figindex .n { font-weight: 700; color: #0f2a3d; }
`;

function buildHtml(body, front, toc, figures) {
  const tocHtml = toc.map((t) =>
    `<li class="l${t.level}"><a href="#${t.id}">${inline(t.text)}</a></li>`
  ).join('');

  const figHtml = figures.map((f) =>
    `<li><a href="#${f.id}"><span class="n">Figura ${f.num}.</span> ${esc(f.caption.replace(/^Figura \d+\.\s*/, ''))}</a></li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/>
<base href="file:///${DOCS.replace(/\\/g, '/')}/"/>
<title>BreveMente — Manual de Usuario</title>
<style>${CSS}</style>
</head><body>

<section class="cover">
  <div class="cover-top">
    <p class="cover-brand">Breve<span>Mente</span></p>
    <p class="cover-claim">Plataforma Clínica de Terapia Breve Estratégica</p>
  </div>
  <div class="cover-main">
    <p class="cover-title">Manual<br/>de Usuario</p>
    <div class="cover-rule"></div>
    <p class="cover-sub">Guía operativa para el personal clínico y administrativo</p>
    <div class="cover-meta">
      <div><span class="k">Versión</span><span>1.0</span></div>
      <div><span class="k">Fecha</span><span>22 de octubre de 2026</span></div>
      <div><span class="k">Emitido por</span><span>SyborX</span></div>
    </div>
  </div>
  <div class="cover-foot">
    <span>Documento confidencial — Uso interno institucional</span>
    <span>SyborX</span>
  </div>
</section>

<section class="frontmatter">
${front}
</section>

<section class="toc">
  <h1 id="indice">Índice</h1>
  <ul>${tocHtml}</ul>
</section>

<section class="figindex">
  <h1 id="indice-figuras">Índice de figuras</h1>
  <ul>${figHtml}</ul>
</section>

${body}

</body></html>`;
}

// ── Ejecución ────────────────────────────────────────────────────────────────
(async () => {
  const md = fs.readFileSync(MD, 'utf8').replace(/^\uFEFF/, '');

  // Separar la sección de control del documento (front matter: primera sección) del resto
  const h1s = [...md.matchAll(/^# /gm)].map((m) => m.index);
  const cut = h1s.length > 1 ? h1s[1] : md.length;
  const frontMd = md.slice(0, cut);
  const bodyMd = md.slice(cut);

  const frontParts = convert(frontMd);
  const parts = convert(bodyMd);
  const toc = [...frontParts.toc, ...parts.toc];
  const figures = [...frontParts.figures, ...parts.figures];
  const html = frontParts.html + '\n' + parts.html;

  fs.mkdirSync(path.dirname(HTML), { recursive: true });
  fs.writeFileSync(HTML, buildHtml(parts.html, frontParts.html, toc, figures), 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + HTML.replace(/\\/g, '/'), { waitUntil: 'load' });

  // Render de Mermaid
  await page.addScriptTag({ url: MERMAID_JS });
  await page.evaluate(async () => {
    // @ts-ignore
    window.mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose',
      fontFamily: 'Segoe UI, Arial, sans-serif', flowchart: { htmlLabels: true, curve: 'basis' } });
    // @ts-ignore
    await window.mermaid.run({ nodes: Array.from(document.querySelectorAll('.mermaid')) });
  });
  await page.waitForTimeout(1200);

  // Rasterizar cada diagrama a PNG para garantizar que se imprima en el PDF
  const names = await page.evaluate(() => Array.from(document.querySelectorAll('.mermaid')).map((d) => d.getAttribute('data-name')));
  for (const name of names) {
    const file = path.join(DOCS, 'figuras', `diagrama-${name}.png`);
    const svg = page.locator(`.mermaid[data-name="${name}"] svg`).first();
    await svg.screenshot({ path: file, timeout: 20000 });
    await page.evaluate(([nm, src]) => {
      const cont = document.querySelector(`.mermaid[data-name="${nm}"]`);
      if (!cont) return;
      const el = cont.querySelector('svg');
      if (!el) return;
      const img = document.createElement('img');
      img.src = src;
      img.setAttribute('alt', 'diagrama');
      cont.replaceChild(img, el);
    }, [name, `figuras/diagrama-${name}.png`]);
  }
  await page.waitForTimeout(600);
  await page.evaluate(() => Promise.all(Array.from(document.images).map((i) => (i.complete ? Promise.resolve(1) : new Promise((r) => { i.onload = r; i.onerror = r; })))));
  const svgCount = names.length;
  const imgStats = await page.evaluate(() => {
    const imgs = Array.from(document.images);
    return { total: imgs.length, loaded: imgs.filter((i) => i.naturalWidth > 0).length, broken: imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute('src')) };
  });

  await page.pdf({
    path: PDF,
    format: 'A4',
    printBackground: true,
    outline: true,
    tagged: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#8ba0ad;padding:0 16mm;display:flex;justify-content:space-between;">
        <span>BreveMente · Manual de Usuario</span><span>Versión 1.0 · 22/10/2026</span></div>`,
    footerTemplate: `<div style="width:100%;font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#8ba0ad;padding:0 16mm;display:flex;justify-content:space-between;">
        <span>SyborX — Documento confidencial</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
    margin: { top: '20mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });

  await browser.close();
  const kb = (fs.statSync(PDF).size / 1024).toFixed(0);
  const buf = fs.readFileSync(PDF).toString('latin1');
  const pages = (buf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`HTML: ${HTML}`);
  console.log(`PDF: ${PDF} (${kb} KB)`);
  console.log(`Imágenes: ${imgStats.loaded}/${imgStats.total} cargadas`, imgStats.broken.length ? 'ROTAS: ' + imgStats.broken.join(',') : '');
  console.log(`Páginas: ${pages}`);
  console.log(`Figuras en índice: ${figures.length} | SVG Mermaid renderizados: ${svgCount}`);
  console.log('Secciones en índice:', toc.length);
})();

