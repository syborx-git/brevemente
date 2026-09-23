import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AsistenteLevaRepository, MensajeLeva } from '../ports/asistente-leva.repository';

@Injectable({
  providedIn: 'root'
})
export class AsistenteLevaHttpAdapter implements AsistenteLevaRepository {
  private readonly apiUrl = '/api/v1/asistente-leva';

  constructor(private http: HttpClient) {}

  obtenerHistorial(): Observable<MensajeLeva[]> {
    return this.http.get<MensajeLeva[]>(`${this.apiUrl}/historial`);
  }

  enviarConsulta(mensaje: string): Observable<MensajeLeva> {
    return this.http.post<MensajeLeva>(`${this.apiUrl}/consulta`, { mensaje });
  }
}
