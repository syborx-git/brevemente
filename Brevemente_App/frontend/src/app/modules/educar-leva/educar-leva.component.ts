import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EducarLevaService,
  CorpusDocument,
  DocumentConversionPreview,
  PublishDocumentRequest
} from './services/educar-leva.service';

@Component({
  selector: 'app-educar-leva',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Metadatos del protocolo
  title = '';
  protocolCode = '';
  category = 'PROTOCOLO_TBE';
  sourceReference = '';
  archivoSeleccionado: File | null = null;
  nombreArchivo = '';

  readonly categorias = [
    { value: 'PROTOCOLO_TBE', label: 'Protocolo Clínico TBE' },
    { value: 'MANUAL_TECNICO', label: 'Manual Técnico Arezzo' },
    { value: 'GUIA_FARMACOLOGICA', label: 'Guía Farmacológica / Psiquiátrica' },
    { value: 'CASO_SUPERVISADO', label: 'Caso Clínico Supervisado' }
  ];

  constructor(private readonly educarService: EducarLevaService) {}

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
      this.protocolCode = 'TBE-' + baseName.toUpperCase().replace(/\s+/g, '-').slice(0, 15);
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
        this.mensajeExito = `¡Protocolo "${docCreado.title}" [${docCreado.protocolCode}] aprobado y publicado exitosamente en el corpus cerrado de LEVA!`;
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
}
