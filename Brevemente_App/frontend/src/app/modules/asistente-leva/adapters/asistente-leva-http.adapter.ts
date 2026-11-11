import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { AsistenteLevaRepository, MensajeLeva, FuenteCitada } from '../ports/asistente-leva.repository';
import { environment } from '../../../../environments/environment';

interface CorpusQueryResponsePayload {
  query: string;
  answer: string;
  citedSources: FuenteCitada[];
  groundedInCorpus: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenteLevaHttpAdapter implements AsistenteLevaRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/leva/corpus`;
  private readonly storageKey = 'brevemente_leva_history_cache';

  constructor(
    private readonly http: HttpClient,
    private readonly zone: NgZone
  ) {}

  obtenerHistorial(): Observable<MensajeLeva[]> {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        return of(JSON.parse(raw));
      } catch {
        // Ignorar error de parsing
      }
    }
    return of([
      {
        id: 'msg-init',
        remitente: 'LEVA',
        contenido: 'Hola. Soy LEVA, tu copiloto clínico en Terapia Breve Estratégica (Modelo Arezzo/Nardone). El corpus cerrado está activo y conectado.',
        timestamp: new Date().toISOString()
      }
    ]);
  }

  enviarConsulta(mensaje: string, protocoloFiltro?: string): Observable<MensajeLeva> {
    const body = {
      query: mensaje,
      protocolFilter: protocoloFiltro || null
    };

    return this.http.post<CorpusQueryResponsePayload>(`${this.baseUrl}/query`, body).pipe(
      map(res => {
        const respuestaLeva: MensajeLeva = {
          id: `msg-${Date.now()}-leva`,
          remitente: 'LEVA',
          contenido: res.answer,
          fuentesCitadas: res.citedSources,
          groundedInCorpus: res.groundedInCorpus,
          sugerenciaEstratagema: res.citedSources && res.citedSources.length > 0
            ? res.citedSources.map(s => s.title).join(' · ')
            : undefined,
          timestamp: new Date().toISOString()
        };
        return respuestaLeva;
      })
    );
  }

  consultarStream(mensaje: string, protocoloFiltro?: string): Observable<{ token?: string; done?: boolean; error?: string }> {
    return new Observable(observer => {
      const url = new URL(`${window.location.origin}${this.baseUrl}/query/stream`);
      url.searchParams.set('query', mensaje);
      if (protocoloFiltro) {
        url.searchParams.set('protocolFilter', protocoloFiltro);
      }

      const eventSource = new EventSource(url.toString(), { withCredentials: true });

      eventSource.onmessage = (event) => {
        this.zone.run(() => {
          if (event.data === '[DONE]') {
            observer.next({ done: true });
            eventSource.close();
            observer.complete();
          } else {
            observer.next({ token: event.data });
          }
        });
      };

      eventSource.onerror = (err) => {
        this.zone.run(() => {
          eventSource.close();
          if (eventSource.readyState === EventSource.CLOSED) {
            observer.next({ done: true });
            observer.complete();
          } else {
            observer.error(err);
          }
        });
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
