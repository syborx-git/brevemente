import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CambiarEstadoPayload,
  CrearUsuarioPayload,
  EditarUsuarioPayload,
  ResetPasswordPayload,
  ResumenUsuarios,
  UsuarioAdminBackend,
  UsuarioCreado,
  UsuariosAdminRepository
} from '../ports/usuarios.repository';

@Injectable({ providedIn: 'root' })
export class UsuariosHttpAdapter extends UsuariosAdminRepository {
  private readonly apiUrl = '/api/v1/admin/usuarios';

  constructor(private readonly http: HttpClient) {
    super();
  }

  listar(q: string, rol: string, estado: string, page: number, size: number): Observable<ResumenUsuarios> {
    const params = new HttpParams()
      .set('q', q)
      .set('rol', rol)
      .set('estado', estado)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<ResumenUsuarios>(this.apiUrl, { params });
  }

  crear(payload: CrearUsuarioPayload): Observable<UsuarioCreado> {
    return this.http.post<UsuarioCreado>(this.apiUrl, payload);
  }

  editar(id: string, payload: EditarUsuarioPayload): Observable<UsuarioAdminBackend> {
    return this.http.put<UsuarioAdminBackend>(`${this.apiUrl}/${id}`, payload);
  }

  cambiarEstado(id: string, payload: CambiarEstadoPayload): Observable<UsuarioAdminBackend> {
    return this.http.patch<UsuarioAdminBackend>(`${this.apiUrl}/${id}/estado`, payload);
  }

  resetPassword(id: string, payload: ResetPasswordPayload): Observable<{ passwordTemporal: string }> {
    return this.http.post<{ passwordTemporal: string }>(`${this.apiUrl}/${id}/password-temporal`, payload);
  }
}
