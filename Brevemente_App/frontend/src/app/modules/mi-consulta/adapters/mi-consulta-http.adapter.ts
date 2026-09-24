import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConsultaConfig, MiConsultaRepository } from '../ports/mi-consulta.repository';

@Injectable({
  providedIn: 'root'
})
export class MiConsultaHttpAdapter implements MiConsultaRepository {
  private readonly apiUrl = '/api/v1/mi-consulta';

  constructor(private readonly http: HttpClient) {}

  obtenerConfig(): Observable<ConsultaConfig> {
    return this.http.get<ConsultaConfig>(this.apiUrl);
  }

  guardarConfig(config: ConsultaConfig): Observable<ConsultaConfig> {
    return this.http.put<ConsultaConfig>(this.apiUrl, config);
  }
}
