import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AsistenteLevaRepository, MensajeLeva } from '../ports/asistente-leva.repository';

const SEED_MENSAJES: MensajeLeva[] = [
  {
    id: 'msg-001',
    remitente: 'LEVA',
    contenido: 'Hola Dra. Sofía. Soy LEVA, tu asistente clínico en Terapia Breve Estratégica. ¿En qué caso o estratagema te apoyo hoy?',
    timestamp: '2026-09-22T09:00:00'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AsistenteLevaLocalStorageAdapter implements AsistenteLevaRepository {
  private readonly storageKey = 'brevemente_leva_mock';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(SEED_MENSAJES));
    }
  }

  private getStored(): MensajeLeva[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  obtenerHistorial(): Observable<MensajeLeva[]> {
    return of(this.getStored());
  }

  enviarConsulta(mensaje: string, protocoloFiltro?: string): Observable<MensajeLeva> {
    const items = this.getStored();
    const userMsg: MensajeLeva = {
      id: `msg-${Date.now()}-user`,
      remitente: 'TERAPEUTA',
      contenido: mensaje,
      timestamp: new Date().toISOString()
    };
    items.push(userMsg);

    const levaReply: MensajeLeva = {
      id: `msg-${Date.now()}-leva`,
      remitente: 'LEVA',
      contenido: `Analizado bajo el modelo TBE: Se sugiere explorar si la tentativa de solución reiterada está alimentando el problema. Considera la prescripción paradójica correspondiente.`,
      sugerenciaEstratagema: 'La peor fantasía / Declaración del secreto',
      timestamp: new Date().toISOString()
    };
    items.push(levaReply);
    localStorage.setItem(this.storageKey, JSON.stringify(items));

    return of(levaReply);
  }

  consultarStream(mensaje: string, protocoloFiltro?: string): Observable<{ token?: string; done?: boolean; error?: string }> {
    return new Observable(observer => {
      const tokens = [
        'Analizando ', 'el caso ', 'bajo el ', 'modelo de Giorgio Nardone... ',
        'Se detecta ', 'tentativa redundante ', 'de control. ',
        'Recomendación: ', 'Prescripción paradójica.'
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < tokens.length) {
          observer.next({ token: tokens[i] });
          i++;
        } else {
          clearInterval(interval);
          observer.next({ done: true });
          observer.complete();
        }
      }, 150);

      return () => clearInterval(interval);
    });
  }
}
