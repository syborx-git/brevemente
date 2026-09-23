import { Observable } from 'rxjs';

export interface MensajeLeva {
  id: string;
  remitente: 'TERAPEUTA' | 'LEVA';
  contenido: string;
  sugerenciaEstratagema?: string;
  timestamp: string;
}

export abstract class AsistenteLevaRepository {
  abstract obtenerHistorial(): Observable<MensajeLeva[]>;
  abstract enviarConsulta(mensaje: string): Observable<MensajeLeva>;
}
