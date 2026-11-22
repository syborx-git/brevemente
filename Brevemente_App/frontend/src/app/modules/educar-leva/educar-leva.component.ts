import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleStateService } from '../../core/services/role-state.service';
import { CasosFuenteLevaComponent } from './casos-fuente/casos-fuente-leva.component';
import {
  EducarLevaService,
  CorpusDocument,
  DocumentConversionPreview,
  PublishDocumentRequest
} from './services/educar-leva.service';

@Component({
  selector: 'app-educar-leva',
  standalone: true,
  imports: [CommonModule, FormsModule, CasosFuenteLevaComponent],
  templateUrl: './educar-leva.component.html',
  styleUrl: './educar-leva.component.scss'
})
export class EducarLevaComponent implements OnInit {
  documentos: CorpusDocument[] = [];
  cargando = false;
  convirtiendo = false;
  publicando = false;
  evictingCache = false;

  mensajeExito = '';
  mensajeError = '';

  // Modo Split-Screen (Humano al Mando)
  modoRevision = false;
  tabVisualizacion: 'editor' | 'chunks' = 'editor';
  previewData: DocumentConversionPreview | null = null;
  markdownEditado = '';

  // Selector de Modo de Creación: Archivo vs Asistente LEVA IA
  modoCreacion: 'archivo' | 'asistente_ia' | 'casos_fuente' = 'archivo';

  // Formulario Clínico del Asistente LEVA para Diseñar Protocolos Faltantes
  formProtocoloIa = {
    problemaClinico: '',
    sprTentativo: 'Fóbico (Miedo paroxístico, evitación y delegación)',
    tentativasSolucionTexto: '',
    estratagemaSugerida: '',
    poblacionContexto: 'Adultos en general',
    libroReferencia: 'Escuela de Arezzo - Modelo Giorgio Nardone'
  };
  generandoProtocoloIa = false;

  readonly sprOpciones = [
    { value: 'Fóbico (Miedo paroxístico, evitación y delegación)', label: 'Fóbico (Miedo paroxístico, evitación y delegación de auxilio)' },
    { value: 'Obsesivo-Compulsivo (Rituales / Control)', label: 'Obsesivo-Compulsivo (Rituales preventivos, reparatorios o mágicos)' },
    { value: 'Duda Patológica (Bucle Racional)', label: 'Duda Patológica (Búsqueda incesante de certeza y respuestas racionales)' },
    { value: 'Depresivo / Desilusionado (Renuncia)', label: 'Depresivo / Desilusionado (Renuncia tras esfuerzo o pérdida asumida)' },
    { value: 'Trastorno de la Alimentación / Atracón', label: 'Trastorno Alimentario (Atracón, vómito o control dietético)' },
    { value: 'Paranoico / Persecutorio', label: 'Paranoico / Persecutorio (Hipervigilancia y sospecha reactiva)' }
  ];

  readonly estratagemasSugeridasRapidas = [
    'La Peor Fantasía (Saturación paradójica del miedo)',
    'El Espejo Líquido (Exposición visual matutina sin contacto)',
    'Diario de a Bordo (Registro inmediato de conatos de crisis)',
    'Prescripción del Síntoma / Contraritual 1=5',
    'La Pequeña Infracción Placentera Diaria',
    'La Media Hora de la Queja / Desahogo',
    'La Carta de Despedida / Odio'
  ];

  // Selector de Tipo de Carga
  tipoCarga: 'protocolo' | 'libro' = 'protocolo';

  // Metadatos del protocolo o libro
  title = '';
  protocolCode = '';
  category = 'PROTOCOLO_TBE';
  sourceReference = '';
  archivoSeleccionado: File | null = null;
  nombreArchivo = '';

  // Filtro de Pestañas del Corpus Publicado
  tabCorpus: 'todos' | 'protocolos' | 'libros' | 'guias' = 'todos';

  // Estados de Ver, Editar y Eliminar de la tabla
  documentoDetalle: CorpusDocument | null = null;

  documentoEnEdicion: CorpusDocument | null = null;
  editTitle = '';
  editProtocolCode = '';
  editCategory = 'PROTOCOLO_TBE';
  editSourceReference = '';
  editContent = '';
  guardandoEdicion = false;

  documentoParaEliminar: CorpusDocument | null = null;
  eliminando = false;

  readonly categorias = [
    { value: 'PROTOCOLO_TBE', label: 'Protocolo Clínico TBE' },
    { value: 'LIBRO_CLINICO', label: 'Libro o Tratado Clínico Extenso' },
    { value: 'MANUAL_TECNICO', label: 'Manual Técnico Arezzo / Nardone' },
    { value: 'GUIA_DIAGNOSTICA', label: 'Guía Diagnóstica DSM-5TR / CIE-11' },
    { value: 'GUIA_FARMACOLOGICA', label: 'Guía Farmacológica / Psiquiátrica' },
    { value: 'CASO_SUPERVISADO', label: 'Caso Clínico Supervisado' }
  ];

  constructor(
    private readonly educarService: EducarLevaService,
    private readonly roleState: RoleStateService
  ) {}

  cambiarTipoCarga(tipo: 'protocolo' | 'libro'): void {
    this.tipoCarga = tipo;
    if (tipo === 'libro') {
      this.category = 'LIBRO_CLINICO';
      if (this.protocolCode.startsWith('TBE-')) {
        this.protocolCode = 'LIB-' + this.protocolCode.replace(/^TBE-/, '');
      } else if (!this.protocolCode) {
        this.protocolCode = 'LIB-';
      }
    } else {
      this.category = 'PROTOCOLO_TBE';
      if (this.protocolCode.startsWith('LIB-')) {
        this.protocolCode = 'TBE-' + this.protocolCode.replace(/^LIB-/, '');
      } else if (!this.protocolCode) {
        this.protocolCode = 'TBE-';
      }
    }
  }

  aplicarEstratagemaRapida(estratagema: string): void {
    this.formProtocoloIa.estratagemaSugerida = estratagema;
  }

  generarProtocoloConLeva(): void {
    if (!this.formProtocoloIa.problemaClinico?.trim()) {
      this.mensajeError = 'Por favor ingresa el nombre del problema clínico o trastorno a protocolizar.';
      return;
    }

    this.generandoProtocoloIa = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const tentativas = this.formProtocoloIa.tentativasSolucionTexto
      ? this.formProtocoloIa.tentativasSolucionTexto.split(/[\n,]+/).map(t => t.trim()).filter(t => t.length > 0)
      : [];

    this.educarService.generarBorradorProtocolo({
      problemaClinico: this.formProtocoloIa.problemaClinico.trim(),
      sprTentativo: this.formProtocoloIa.sprTentativo,
      tentativasSolucionObservadas: tentativas,
      estratagemaSugerida: this.formProtocoloIa.estratagemaSugerida?.trim(),
      poblacionContexto: this.formProtocoloIa.poblacionContexto?.trim(),
      libroReferencia: this.formProtocoloIa.libroReferencia?.trim()
    }).subscribe({
      next: (res) => {
        this.generandoProtocoloIa = false;
        this.title = res.title;
        this.protocolCode = res.protocolCode;
        this.category = res.category || 'PROTOCOLO_TBE';
        this.sourceReference = res.sourceReference;
        this.markdownEditado = res.markdownContent;
        this.nombreArchivo = `${res.protocolCode}.md (Diseñado con LEVA Copilot)`;

        const words = res.markdownContent ? res.markdownContent.split(/\s+/).length : 250;
        this.previewData = {
          filename: `${res.protocolCode}.md`,
          extension: 'md',
          pageCount: 2,
          wordCount: words,
          markdown: res.markdownContent,
          sections: [
            '1. Objetivo Clínico y Diana TBE',
            '2. Sistema Perceptivo-Reactivo',
            '3. Tentativas de Solución Redundantes',
            '4. Punto Clave y Estratagema Central',
            '5. Prescripciones Estratégicas Operativas',
            '6. Reestructuración de Arezzo',
            '7. Fases de Intervención'
          ],
          chunkCount: res.chunks?.length || 0,
          chunks: res.chunks || []
        };

        this.modoRevision = true;
        this.mensajeExito = `Protocolo "${res.title}" diseñado con éxito por LEVA. Revisa los campos y el contenido antes de publicar.`;
      },
      error: (err) => {
        this.generandoProtocoloIa = false;
        this.mensajeError = err.error?.message || err.message || 'Error al generar el borrador de protocolo con LEVA.';
      }
    });
  }

  esLibro(doc: CorpusDocument): boolean {
    const cat = (doc.category || '').toUpperCase();
    const code = (doc.protocolCode || '').toUpperCase();
    const title = (doc.title || '').toLowerCase();
    return cat === 'LIBRO_CLINICO' || cat === 'MANUAL_TECNICO' || code.startsWith('LIB-') || title.includes('libro') || title.includes('tratado');
  }

  esGuia(doc: CorpusDocument): boolean {
    const cat = (doc.category || '').toUpperCase();
    const code = (doc.protocolCode || '').toUpperCase();
    return cat === 'GUIA_DIAGNOSTICA' || cat === 'GUIA_FARMACOLOGICA' || code.startsWith('DSM') || code.startsWith('CIE');
  }

  esProtocolo(doc: CorpusDocument): boolean {
    return !this.esLibro(doc) && !this.esGuia(doc);
  }

  contarProtocolos(): number {
    return this.documentos.filter(d => this.esProtocolo(d)).length;
  }

  contarLibros(): number {
    return this.documentos.filter(d => this.esLibro(d)).length;
  }

  contarGuias(): number {
    return this.documentos.filter(d => this.esGuia(d)).length;
  }

  get documentosFiltrados(): CorpusDocument[] {
    if (this.tabCorpus === 'protocolos') {
      return this.documentos.filter(d => this.esProtocolo(d));
    }
    if (this.tabCorpus === 'libros') {
      return this.documentos.filter(d => this.esLibro(d));
    }
    if (this.tabCorpus === 'guias') {
      return this.documentos.filter(d => this.esGuia(d));
    }
    return this.documentos;
  }

  get puedeAdministrar(): boolean {
    return this.roleState.esAdmin() || this.roleState.esSupervisor() || this.roleState.esTerapeuta();
  }

  ngOnInit(): void {
    this.cargarCorpus();
  }

  cargarCorpus(): void {
    this.cargando = true;
    this.educarService.listarDocumentos().subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No se pudo cargar la lista del corpus clínico.';
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  private procesarArchivo(file: File): void {
    const validExts = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExts.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      this.mensajeError = 'Formato no soportado. Por favor sube un archivo PDF, DOCX, DOC o TXT.';
      return;
    }

    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;
    this.mensajeError = '';
    this.mensajeExito = '';

    // Autollenado inteligente de título y código sugerido
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!this.title) {
      this.title = baseName;
    }
    if (!this.sourceReference) {
      this.sourceReference = file.name;
    }
    if (!this.protocolCode) {
      const prefix = this.tipoCarga === 'libro' ? 'LIB-' : 'TBE-';
      this.protocolCode = prefix + baseName.toUpperCase().replace(/\s+/g, '-').slice(0, 15);
    }

    // Iniciar extracción determinista hacia Markdown con PyMuPDF4LLM / Mammoth
    this.convirtiendo = true;
    this.educarService.previsualizarConversion(file).subscribe({
      next: (preview) => {
        this.convirtiendo = false;
        this.previewData = preview;
        this.markdownEditado = preview.markdown;
        this.modoRevision = true;
      },
      error: (err) => {
        this.convirtiendo = false;
        this.mensajeError = err.error?.message || err.message || 'Error al procesar y convertir el archivo a Markdown.';
      }
    });
  }

  descartarRevision(): void {
    this.modoRevision = false;
    this.previewData = null;
    this.markdownEditado = '';
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.mensajeError = '';
  }

  publicarProtocolo(): void {
    if (!this.title.trim() || !this.protocolCode.trim() || !this.markdownEditado.trim()) {
      this.mensajeError = 'Por favor completa el título, código de protocolo y asegúrate de que el Markdown no esté vacío.';
      return;
    }

    this.publicando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const payload: PublishDocumentRequest = {
      title: this.title.trim(),
      protocolCode: this.protocolCode.trim().toUpperCase(),
      category: this.category,
      markdownContent: this.markdownEditado,
      sourceReference: this.sourceReference.trim() || this.nombreArchivo,
      chunks: this.previewData?.chunks || []
    };

    this.educarService.publicarDocumento(payload).subscribe({
      next: (docCreado) => {
        this.publicando = false;
        const tipoLabel = this.esLibro(docCreado) ? 'Libro/Tratado' : 'Protocolo';
        this.mensajeExito = `¡${tipoLabel} "${docCreado.title}" [${docCreado.protocolCode}] aprobado y publicado exitosamente en el corpus cerrado de LEVA!`;
        this.descartarRevision();
        this.cargarCorpus();
      },
      error: (err) => {
        this.publicando = false;
        this.mensajeError = err.error?.message || 'Error al publicar el protocolo en la base de conocimiento.';
      }
    });
  }

  limpiarCache(): void {
    this.evictingCache = true;
    this.educarService.limpiarCache().subscribe({
      next: () => {
        this.evictingCache = false;
        this.mensajeExito = 'Caché de inferencia de LEVA invalidada con éxito.';
      },
      error: () => {
        this.evictingCache = false;
        this.mensajeError = 'No se pudo limpiar la caché.';
      }
    });
  }

  // --- Operaciones de Consulta, Edición y Eliminación del Corpus ---

  verDetalle(doc: CorpusDocument): void {
    this.documentoDetalle = doc;
  }

  cerrarDetalle(): void {
    this.documentoDetalle = null;
  }

  iniciarEdicion(doc: CorpusDocument): void {
    this.documentoEnEdicion = doc;
    this.editTitle = doc.title;
    this.editProtocolCode = doc.protocolCode;
    this.editCategory = doc.category;
    this.editSourceReference = doc.sourceReference || '';
    this.editContent = doc.content;
    this.mensajeError = '';
  }

  cancelarEdicion(): void {
    this.documentoEnEdicion = null;
    this.editTitle = '';
    this.editProtocolCode = '';
    this.editContent = '';
  }

  guardarEdicion(): void {
    if (!this.documentoEnEdicion) return;

    if (!this.editTitle.trim() || !this.editProtocolCode.trim() || !this.editContent.trim()) {
      this.mensajeError = 'El título, código de protocolo y contenido no pueden estar vacíos.';
      return;
    }

    this.guardandoEdicion = true;
    this.mensajeError = '';

    const payload: PublishDocumentRequest = {
      title: this.editTitle.trim(),
      protocolCode: this.editProtocolCode.trim().toUpperCase(),
      category: this.editCategory,
      markdownContent: this.editContent.trim(),
      sourceReference: this.editSourceReference.trim() || 'Manual Clínico TBE'
    };

    this.educarService.actualizarDocumento(this.documentoEnEdicion.id, payload).subscribe({
      next: (docActualizado) => {
        this.guardandoEdicion = false;
        this.mensajeExito = `Protocolo "${docActualizado.title}" [${docActualizado.protocolCode}] actualizado correctamente.`;
        this.cancelarEdicion();
        this.cargarCorpus();
      },
      error: (err) => {
        this.guardandoEdicion = false;
        this.mensajeError = err.error?.message || 'Error al actualizar el protocolo.';
      }
    });
  }

  solicitarEliminar(doc: CorpusDocument): void {
    this.documentoParaEliminar = doc;
    this.mensajeError = '';
  }

  cancelarEliminar(): void {
    this.documentoParaEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.documentoParaEliminar) return;

    this.eliminando = true;
    const doc = this.documentoParaEliminar;

    this.educarService.eliminarDocumento(doc.id).subscribe({
      next: () => {
        this.eliminando = false;
        const tipoLabel = this.esLibro(doc) ? 'Libro/Tratado' : 'Protocolo';
        this.mensajeExito = `${tipoLabel} "${doc.title}" [${doc.protocolCode}] eliminado del corpus clínico.`;
        this.documentoParaEliminar = null;
        this.cargarCorpus();
      },
      error: (err) => {
        this.eliminando = false;
        this.mensajeError = err.error?.message || 'Error al eliminar el protocolo del corpus.';
      }
    });
  }
}
