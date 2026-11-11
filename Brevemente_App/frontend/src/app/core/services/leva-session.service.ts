import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, throwError, of } from 'rxjs';
import { switchMap, catchError, takeWhile, tap, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type TaskStatus = 'PENDIENTE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DialogueTurn {
  speaker: 'Terapeuta' | 'Paciente' | string;
  text: string;
  timestampStart?: number;
  timestampEnd?: number;
}

export interface StructuredProposalData {
  diagnosticoOperativo?: string;
  sistemaPerceptivoReactivo?: string;
  tentativasSolucionRedundantes?: string[];
  reestructuracionesPropuestas?: string[];
  prescripcionesEstrategicas?: string[];
  valoracionDelCambio?: string;
  estratagemaAplicada?: string;
  reaccionPaciente?: string;
  notaEvolucionSoap?: string;
  dialogue?: DialogueTurn[];
}

export interface RiskAssessment {
  level: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  hasSuicideRisk: boolean;
  hasSelfHarmRisk: boolean;
  hasViolenceRisk: boolean;
  alertNotes?: string;
}

export interface LevaProposalResponse {
  proposalId: string;
  taskId: string;
  sessionId: string;
  pacienteId?: string;
  terapeutaId?: string;
  humanReviewStatus: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  riskAlertDetails?: RiskAssessment;
  structuredProposal: StructuredProposalData;
  approvedData?: StructuredProposalData;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface TranscriptionTask {
  id: string;
  sessionId: string;
  pacienteId?: string;
  terapeutaId?: string;
  status: TaskStatus;
  audioFileName?: string;
  durationSeconds?: number;
  languageDetected?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  rawResult?: {
    fullText?: string;
    segments?: any[];
  };
}

export interface ApproveProposalRequest {
  reviewedById: string;
  approvedData: StructuredProposalData;
}

@Injectable({
  providedIn: 'root'
})
export class LevaSessionService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Sube el archivo grabado en multipart a Spring Boot
   */
  public uploadSessionAudio(
    sessionId: string,
    audioBlob: Blob,
    fileName: string = 'sesion_clinica.webm',
    language: string = 'es'
  ): Observable<TranscriptionTask> {
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    formData.append('language', language);

    return this.http.post<TranscriptionTask>(
      `${this.apiUrl}/leva/sessions/${sessionId}/transcribe`,
      formData
    );
  }

  /**
   * Consulta el estado de la tarea de transcripción
   */
  public getTaskStatus(sessionId: string): Observable<TranscriptionTask> {
    return this.http.get<TranscriptionTask>(`${this.apiUrl}/leva/sessions/${sessionId}/task`);
  }

  /**
   * Obtiene la propuesta clínica generada por LEVA
   */
  public getProposal(sessionId: string): Observable<LevaProposalResponse> {
    return this.http.get<LevaProposalResponse>(`${this.apiUrl}/leva/sessions/${sessionId}/proposal`);
  }

  /**
   * Sella y aprueba oficialmente la propuesta clínica (Human-in-the-Loop)
   */
  public approveProposal(sessionId: string, request: ApproveProposalRequest): Observable<LevaProposalResponse> {
    return this.http.post<LevaProposalResponse>(`${this.apiUrl}/leva/sessions/${sessionId}/approve`, request);
  }

  /**
   * Polling inteligente que monitorea la tarea hasta que LEVA finaliza o detecta error
   */
  public pollSessionAnalysis(
    sessionId: string,
    intervalMs: number = 2500,
    maxWaitSeconds: number = 90
  ): Observable<{ completed: boolean; proposal?: LevaProposalResponse; task?: TranscriptionTask; error?: string }> {
    const startTime = Date.now();

    return timer(0, intervalMs).pipe(
      switchMap(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > maxWaitSeconds) {
          return throwError(() => new Error('Tiempo de espera agotado mientras Whisper/LEVA procesaban el audio.'));
        }

        // Primero verificamos el estado de la tarea en Spring Boot
        return this.getTaskStatus(sessionId).pipe(
          switchMap(task => {
            if (task.status === 'FAILED') {
              return throwError(() => new Error(task.errorMessage || 'El motor de transcripción falló al procesar el audio.'));
            }
            if (task.status === 'COMPLETED') {
              // Si la tarea terminó, consultamos la propuesta estructurada
              return this.getProposal(sessionId).pipe(
                map(proposal => ({ completed: true, proposal, task })),
                catchError(() => of({ completed: true, task }))
              );
            }
            // Sigue en proceso (PENDIENTE o PROCESSING)
            return of({ completed: false, task });
          }),
          catchError(err => {
            // Si el endpoint de tarea da 404 o falla, intentamos consultar directamente la propuesta
            return this.getProposal(sessionId).pipe(
              map(proposal => ({ completed: true, proposal })),
              catchError(() => of({ completed: false }))
            );
          })
        );
      }),
      takeWhile(res => !res.completed, true)
    );
  }
}
