import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { EditarUsuarioPayload, UsuariosAdminRepository, UsuarioAdminBackend } from './ports/usuarios.repository';
import { UsuariosHttpAdapter } from './adapters/usuarios-http.adapter';

type RolPlataforma =
  | 'admin_platform'
  | 'admin_clinical'
  | 'supervisor'
  | 'therapist'
  | 'assistant'
  | 'patient'
  | 'student';

type EstadoUsuario = 'activo' | 'suspendido' | 'inactivo';

interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  rol: RolPlataforma;
  estado: EstadoUsuario;
  cedula?: string;
  especialidad?: string;
  ultimaActividad: string;
}

interface RolOpcion {
  clave: RolPlataforma;
  etiqueta: string;
}

interface EstadoOpcion {
  clave: EstadoUsuario;
  etiqueta: string;
}

/**
 * Módulo 2 — Gestión de Usuarios y Roles (vista previa frontend).
 * Datos mock; se conectará al backend cuando exista (permiso ADMIN_USUARIOS).
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{ provide: UsuariosAdminRepository, useClass: UsuariosHttpAdapter }],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  private readonly repo = inject(UsuariosAdminRepository);
  readonly roles: RolOpcion[] = [
    { clave: 'admin_platform', etiqueta: 'Admin Plataforma' },
    { clave: 'admin_clinical', etiqueta: 'Admin Clínico' },
    { clave: 'supervisor', etiqueta: 'Supervisor' },
    { clave: 'therapist', etiqueta: 'Terapeuta' },
    { clave: 'assistant', etiqueta: 'Asistente' },
    { clave: 'patient', etiqueta: 'Paciente' },
    { clave: 'student', etiqueta: 'Estudiante' }
  ];

  readonly estados: EstadoOpcion[] = [
    { clave: 'activo', etiqueta: 'Activo' },
    { clave: 'suspendido', etiqueta: 'Suspendido' },
    { clave: 'inactivo', etiqueta: 'Inactivo' }
  ];

  readonly permisosPorRol: Record<RolPlataforma, string[]> = {
    admin_platform: ['ADMIN_DASHBOARD_LEER', 'ADMIN_USUARIOS', 'ADMIN_SEDES', 'ADMIN_AUDITORIA'],
    admin_clinical: ['DASHBOARD_LEER', 'EXPEDIENTES_LEER', 'AGENDA_GESTIONAR'],
    supervisor: ['SUPERVISION_LEER', 'DASHBOARD_LEER'],
    therapist: ['MI_CONSULTA_LEER', 'MI_CONSULTA_EDITAR', 'EXPEDIENTES_LEER'],
    assistant: ['AGENDA_GESTIONAR', 'LEVA_ASISTENTE'],
    patient: ['PORTAL_PACIENTE'],
    student: ['OBSERVADOR']
  };

  usuarios: UsuarioAdmin[] = [
    { id: 'u-1', nombre: 'Administrador Plataforma', email: 'admin@brevemente.org', rol: 'admin_platform', estado: 'activo', ultimaActividad: 'hoy · 08:10' },
    { id: 'u-2', nombre: 'Dra. Sofía Ramírez Lozano', email: 'sofia.ramirez@brevemente.org', rol: 'therapist', estado: 'activo', cedula: '1234567', especialidad: 'Psiquiatría', ultimaActividad: 'hoy · 09:12' },
    { id: 'u-3', nombre: 'Mtro. Alejandro Mendoza Garza', email: 'alejandro.mendoza@brevemente.org', rol: 'therapist', estado: 'suspendido', cedula: '2345678', especialidad: 'Psicología clínica', ultimaActividad: 'hace 3 días' },
    { id: 'u-4', nombre: 'Lic. Carmen Ortega', email: 'carmen.ortega@brevemente.org', rol: 'assistant', estado: 'activo', ultimaActividad: 'ayer · 17:45' },
    { id: 'u-5', nombre: 'Dra. Isabel Cárdenas', email: 'isabel.cardenas@brevemente.org', rol: 'supervisor', estado: 'activo', ultimaActividad: 'hoy · 07:30' },
    { id: 'u-6', nombre: 'Dr. Luis Herrera', email: 'luis.herrera@brevemente.org', rol: 'therapist', estado: 'inactivo', cedula: '3456789', especialidad: 'Psicología clínica', ultimaActividad: 'hace 2 meses' },
    { id: 'u-7', nombre: 'Mtro. Diego Fuentes', email: 'diego.fuentes@brevemente.org', rol: 'therapist', estado: 'activo', cedula: '4567890', especialidad: 'Psicología clínica', ultimaActividad: 'ayer · 12:20' },
    { id: 'u-8', nombre: 'Lic. Regina Salazar', email: 'regina.salazar@brevemente.org', rol: 'admin_clinical', estado: 'activo', ultimaActividad: 'hoy · 06:55' },
    { id: 'u-9', nombre: 'Mtra. Paola Delgado', email: 'paola.delgado@brevemente.org', rol: 'assistant', estado: 'activo', ultimaActividad: 'ayer · 10:05' },
    { id: 'u-10', nombre: 'Est. Iván Navarro', email: 'ivan.navarro@brevemente.org', rol: 'student', estado: 'activo', ultimaActividad: 'hace 5 días' }
  ];

  busqueda = '';
  filtroRol: RolPlataforma | 'todos' = 'todos';
  filtroEstado: EstadoUsuario | 'todos' = 'todos';

  modalAbierto = false;
  modo: 'alta' | 'edicion' = 'alta';
  editandoId: string | null = null;
  formulario = {
    nombre: '',
    email: '',
    rol: 'therapist' as RolPlataforma,
    estado: 'activo' as EstadoUsuario,
    cedula: '',
    especialidad: '',
    passwordConfirmacion: ''
  };
  mensajeError = '';

  resetModalAbierto = false;
  resetUsuario: UsuarioAdmin | null = null;
  resetResultado: string | null = null;
  resetCopiado = false;
  resetPaso: 'confirmacion' | 'resultado' = 'confirmacion';
  resetPasswordConfirmacion = '';
  resetMensajeError = '';

  private triggerElement: HTMLElement | null = null;

  get usuariosFiltrados(): UsuarioAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.usuarios.filter((u) => {
      const matchQ = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRol = this.filtroRol === 'todos' || u.rol === this.filtroRol;
      const matchEstado = this.filtroEstado === 'todos' || u.estado === this.filtroEstado;
      return matchQ && matchRol && matchEstado;
    });
  }

  esAdminActual(u: UsuarioAdmin): boolean {
    return u.email === 'admin@brevemente.org';
  }

  abrirAlta(): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.modo = 'alta';
    this.editandoId = null;
    this.formulario = { nombre: '', email: '', rol: 'therapist', estado: 'activo', cedula: '', especialidad: '', passwordConfirmacion: '' };
    this.mensajeError = '';
    this.modalAbierto = true;
  }

  abrirEdicion(u: UsuarioAdmin): void {
    if (this.esAdminActual(u)) {
      return;
    }
    this.triggerElement = document.activeElement as HTMLElement;
    this.modo = 'edicion';
    this.editandoId = u.id;
    this.formulario = {
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      estado: u.estado,
      cedula: u.cedula ?? '',
      especialidad: u.especialidad ?? '',
      passwordConfirmacion: ''
    };
    this.mensajeError = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.mensajeError = '';
    if (this.triggerElement) {
      this.triggerElement.focus();
      this.triggerElement = null;
    }
  }

  abrirReset(u: UsuarioAdmin): void {
    if (this.esAdminActual(u)) {
      return;
    }
    this.triggerElement = document.activeElement as HTMLElement;
    this.resetUsuario = u;
    this.resetPaso = 'confirmacion';
    this.resetPasswordConfirmacion = '';
    this.resetMensajeError = '';
    this.resetResultado = null;
    this.resetCopiado = false;
    this.resetModalAbierto = true;
  }

  cerrarReset(): void {
    this.resetModalAbierto = false;
    this.resetUsuario = null;
    this.resetResultado = null;
    this.resetCopiado = false;
    this.resetPaso = 'confirmacion';
    this.resetPasswordConfirmacion = '';
    this.resetMensajeError = '';
    if (this.triggerElement) {
      this.triggerElement.focus();
      this.triggerElement = null;
    }
  }

  async copiarTemporal(): Promise<void> {
    if (!this.resetResultado) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.resetResultado);
    } catch {
      // Entornos sin Clipboard API: la clave queda visible para copia manual.
    }
    this.resetCopiado = true;
  }

  confirmarReset(): void {
    if (!this.resetUsuario) {
      return;
    }
    const pwd = this.resetPasswordConfirmacion.trim();
    if (!pwd) {
      this.resetMensajeError = 'Escribe tu contraseña para confirmar.';
      return;
    }
    this.repo.resetPassword(this.resetUsuario.id, { passwordConfirmacion: pwd }).subscribe({
      next: (res) => {
        this.resetResultado = res.passwordTemporal;
        this.resetCopiado = false;
        this.resetPaso = 'resultado';
      },
      error: () => {
        this.resetMensajeError = 'No se pudo restablecer la contraseña (verifica tu contraseña).';
      }
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.repo.listar('', 'todos', 'todos', 0, 100).subscribe({
      next: (r) => {
        this.usuarios = r.items.map((u) => this.mapearUsuario(u));
      },
      error: () => {}
    });
  }

  private mapearUsuario(u: UsuarioAdminBackend): UsuarioAdmin {
    return {
      id: u.id,
      nombre: `${u.nombre} ${u.apellidos}`.trim(),
      email: u.email,
      rol: (u.roles[0] as RolPlataforma) ?? 'therapist',
      estado: (u.estado as EstadoUsuario) ?? 'activo',
      cedula: u.cedulaProfesional,
      especialidad: u.especialidad,
      ultimaActividad: this.formatearFecha(u.ultimoAcceso ?? u.creadoEn ?? '')
    };
  }

  private formatearFecha(iso: string): string {
    if (!iso) { return ''; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) { return 'ahora'; }
    if (diffMin < 60) { return `hace ${diffMin} min`; }
    const horas = Math.floor(diffMin / 60);
    if (horas < 24) { return `hoy · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
    const dias = Math.floor(horas / 24);
    if (dias === 1) { return 'ayer'; }
    if (dias < 7) { return `hace ${dias} días`; }
    return d.toLocaleDateString('es-MX');
  }

  private dividirNombre(nombreCompleto: string): { nombre: string; apellidos: string } {
    const parts = nombreCompleto.split(/\s+/).filter(Boolean);
    if (parts.length === 0) { return { nombre: '', apellidos: '' }; }
    return { nombre: parts[0], apellidos: parts.slice(1).join(' ') || 'Sin apellido' };
  }

  guardar(): void {
    const nombre = this.formulario.nombre.trim();
    const email = this.formulario.email.trim();
    if (!nombre || !email) {
      this.mensajeError = 'Nombre y correo son obligatorios.';
      return;
    }

    if (this.modo === 'alta') {
      const { nombre: n, apellidos } = this.dividirNombre(nombre);
      this.repo.crear({
        nombre: n,
        apellidos,
        email,
        roles: [this.formulario.rol],
        estado: this.formulario.estado,
        cedulaProfesional: this.formulario.cedula.trim() || undefined,
        especialidad: this.formulario.especialidad.trim() || undefined
      }).subscribe({
        next: (res) => {
          this.cerrarModal();
          this.cargarUsuarios();
          this.resetUsuario = this.mapearUsuario(res.usuario);
          this.resetResultado = res.passwordTemporal;
          this.resetCopiado = false;
          this.resetModalAbierto = true;
        },
        error: () => {
          this.mensajeError = 'No se pudo crear el usuario (revisa correo o cédula).';
        }
      });
      return;
    }

    // Edición conectada al backend (requiere passwordConfirmacion — D12).
    const u = this.usuarios.find((x) => x.id === this.editandoId);
    if (!u) {
      return;
    }
    if (u.rol === 'admin_platform' && u.estado === 'activo' && this.formulario.estado !== 'activo') {
      const adminsActivos = this.usuarios.filter((x) => x.rol === 'admin_platform' && x.estado === 'activo').length;
      if (adminsActivos <= 1) {
        this.mensajeError = 'No puedes suspender al último administrador activo de la plataforma.';
        return;
      }
    }
    const pwd = this.formulario.passwordConfirmacion.trim();
    if (!pwd) {
      this.mensajeError = 'Escribe tu contraseña para confirmar los cambios.';
      return;
    }
    const { nombre: n, apellidos } = this.dividirNombre(nombre);
    const payload: EditarUsuarioPayload = {
      nombre: n,
      apellidos,
      email,
      roles: [this.formulario.rol],
      cedulaProfesional: this.formulario.cedula.trim() || undefined,
      especialidad: this.formulario.especialidad.trim() || undefined,
      passwordConfirmacion: pwd
    };
    const id = this.editandoId as string;
    const estadoCambiado = this.formulario.estado !== u.estado;

    this.repo.editar(id, payload)
      .pipe(
        switchMap(() => estadoCambiado
          ? this.repo.cambiarEstado(id, { estado: this.formulario.estado, passwordConfirmacion: pwd })
          : of(null))
      )
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: () => {
          this.mensajeError = 'No se pudo guardar (verifica tu contraseña).';
        }
      });
  }

  esTerapeuta(): boolean {
    return this.formulario.rol === 'therapist';
  }

  rolLabel(clave: RolPlataforma): string {
    return this.roles.find((r) => r.clave === clave)?.etiqueta ?? clave;
  }

  estadoLabel(clave: EstadoUsuario): string {
    return this.estados.find((e) => e.clave === clave)?.etiqueta ?? clave;
  }

  estadoClase(estado: EstadoUsuario): string {
    switch (estado) {
      case 'activo':
        return 'bg-emerald-100 text-emerald-700';
      case 'suspendido':
        return 'bg-amber-100 text-amber-700';
      case 'inactivo':
        return 'bg-slate-100 text-slate-500';
    }
  }

  iniciales(nombre: string): string {
    const clean = nombre.replace(/^(Dr\.|Dra\.|Lic\.|Mtro\.|Mtra\.|Ing\.|Est\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.resetModalAbierto) {
      this.cerrarReset();
      return;
    }
    if (this.modalAbierto) {
      this.cerrarModal();
    }
  }
}
