import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CorpusDocument {
  id: string;
  title: string;
  protocolCode: string;
  category: string;
  content: string;
  sourceReference?: string;
  createdAt?: string;
}

export interface DocumentChunk {
  chunkIndex: number;
  title: string;
  content: string;
  wordCount: number;
}

export interface DocumentConversionPreview {
  filename: string;
  extension: string;
  pageCount: number;
  wordCount: number;
  markdown: string;
  sections: string[];
  chunkCount: number;
  chunks: DocumentChunk[];
}

export interface PublishDocumentRequest {
  title: string;
  protocolCode: string;
  category: string;
  markdownContent: string;
  sourceReference?: string;
  chunks?: DocumentChunk[];
}

@Injectable({
  providedIn: 'root'
})
export class EducarLevaService {
  private readonly baseUrl = `${environment.apiBaseUrl}/leva/corpus`;

  constructor(private readonly http: HttpClient) {}

  listarDocumentos(): Observable<CorpusDocument[]> {
    return this.http.get<CorpusDocument[]>(`${this.baseUrl}/protocols`);
  }

  limpiarCache(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/cache/evict`, {});
  }

  subirDocumento(formData: FormData): Observable<CorpusDocument> {
    return this.http.post<CorpusDocument>(`${this.baseUrl}/documents/upload`, formData);
  }

  previsualizarConversion(file: File): Observable<DocumentConversionPreview> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentConversionPreview>(`${this.baseUrl}/documents/preview-convert`, formData);
  }

  publicarDocumento(request: PublishDocumentRequest): Observable<CorpusDocument> {
    return this.http.post<CorpusDocument>(`${this.baseUrl}/documents/publish`, request);
  }
}

