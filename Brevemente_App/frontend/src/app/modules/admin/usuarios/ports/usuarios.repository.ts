import { Observable } from 'rxjs';

export type EstadoUsuario = 'activo' | 'suspendido' | 'inactivo';

export interface UsuarioAdminBackend {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string[];
  estado: string;
  cedulaProfesional?: string;
  especialidad?: string;
  terapeutaIds: string[];
  ultimoAcceso?: string;
  creadoEn?: string;
}

export interface ResumenUsuarios {
  items: UsuarioAdminBackend[];
  total: number;
  page: number;
  size: number;
}

export interface UsuarioCreado {
  usuario: UsuarioAdminBackend;
  passwordTemporal: string;
}

export interface CrearUsuarioPayload {
  nombre: string;
  apellidos: string;
  email: string;
  roles: string[];
  estado: string;
  cedulaProfesional?: string;
  especialidad?: string;
}

export interface EditarUsuarioPayload {
  nombre: string;
  apellidos: string;
  email: string;
  roles: string[];
  cedulaProfesional?: string;
  especialidad?: string;
  passwordConfirmacion: string;
}

export interface CambiarEstadoPayload {
  estado: string;
  passwordConfirmacion: string;
}

export interface ResetPasswordPayload {
  passwordConfirmacion: string;
}

export abstract class UsuariosAdminRepository {
  abstract listar(q: string, rol: string, estado: string, page: number, size: number): Observable<ResumenUsuarios>;
  abstract crear(payload: CrearUsuarioPayload): Observable<UsuarioCreado>;
  abstract editar(id: string, payload: EditarUsuarioPayload): Observable<UsuarioAdminBackend>;
  abstract cambiarEstado(id: string, payload: CambiarEstadoPayload): Observable<UsuarioAdminBackend>;
  abstract resetPassword(id: string, payload: ResetPasswordPayload): Observable<{ passwordTemporal: string }>;
}
