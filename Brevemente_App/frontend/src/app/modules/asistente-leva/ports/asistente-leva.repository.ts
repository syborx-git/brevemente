import { Observable } from 'rxjs';

export interface FuenteCitada {
  protocolCode: string;
  title: string;
  category: string;
  sourceReference?: string;
}

export interface MensajeLeva {
  id: string;
  remitente: 'TERAPEUTA' | 'LEVA';
  contenido: string;
  sugerenciaEstratagema?: string;
  fuentesCitadas?: FuenteCitada[];
  groundedInCorpus?: boolean;
  timestamp: string;
  cargando?: boolean;
}

export abstract class AsistenteLevaRepository {
  abstract obtenerHistorial(): Observable<MensajeLeva[]>;
  abstract enviarConsulta(mensaje: string, protocoloFiltro?: string): Observable<MensajeLeva>;
  abstract consultarStream(mensaje: string, protocoloFiltro?: string): Observable<{ token?: string; done?: boolean; error?: string }>;
}
