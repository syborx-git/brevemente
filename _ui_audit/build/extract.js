const fs = require('fs');

(async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const PDF = 'c:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/docs/manual/MANUAL-USUARIO.pdf';
  const data = new Uint8Array(fs.readFileSync(PDF));
  const doc = await pdfjs.getDocument({ data, standardFontDataUrl: require('path').join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/') + '/' }).promise;

  const rows = [];
  let all = '';
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    const text = tc.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
    const ops = await page.getOperatorList();
    const hasImg = ops.fnArray.some((f) => f === 85 || f === 86 || f === 82 || f === 83);
    rows.push({ p: n, chars: text.length, img: hasImg, head: text.slice(0, 70) });
    all += '\n' + text;
  }

  // páginas con muy poco contenido (posible espacio desperdiciado)
  const sparse = rows.filter((r) => !r.img && r.chars < 380);
  console.log('TOTAL páginas:', doc.numPages);
  console.log('Páginas con imagen:', rows.filter((r) => r.img).length);
  console.log('Páginas escasas (sin imagen y <380 chars):', sparse.length);
  sparse.slice(0, 40).forEach((r) => console.log(`  p${r.p} (${r.chars} car.) ${r.head}`));

  console.log('\n--- Chequeo de contenido ---');
  const must = [
    'Control del documento', 'Índice', 'Índice de figuras', '1. Introducción', 'Acceso al sistema',
    'Navegación general', 'Perfiles de usuario y permisos', 'Panel Principal', 'Mi Consulta', 'Pacientes',
    'Agenda', 'Expedientes', 'Biblioteca Clínica', 'LEVA', 'Campus BreveMente', 'Mi Desarrollo Profesional',
    'Configuración', 'Auditoría y Seguridad', 'Reportes y Constancias', 'Supervisión clínica',
    'Contra-referencias', 'Portal del Paciente', 'Flujos de trabajo de referencia', 'Glosario',
    'Anexo A', 'Anexo B', 'Anexo C', 'Anexo D',
  ];
  must.forEach((m) => console.log((all.includes(m) ? 'OK  ' : 'FALTA ') + m));

  const banned = all.match(/demo|demostrac\w*|simul\w*|prototip\w*|mock/gi);
  console.log('\nTérminos prohibidos en el texto del PDF:', banned ? [...new Set(banned)].join(', ') : 'NINGUNO');
})();
