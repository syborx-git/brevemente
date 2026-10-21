import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupervisionRepository } from '../ports/supervision.repository';
import { SupervisionLog } from '../../../core/types/clinical.types';

@Injectable({
  providedIn: 'root'
})
export class SupervisionHttpAdapter implements SupervisionRepository {
  private readonly apiUrl = '/api/v1/supervision';

  constructor(private readonly http: HttpClient) {}

  listarLogs(): Observable<SupervisionLog[]> {
    return this.http.get<SupervisionLog[]>(this.apiUrl);
  }

  agregarLog(log: Omit<SupervisionLog, 'id'>): Observable<SupervisionLog> {
    return this.http.post<SupervisionLog>(this.apiUrl, log);
  }
}
