import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent {
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
    especialidad: ''
  };
  mensajeError = '';

  resetModalAbierto = false;
  resetUsuario: UsuarioAdmin | null = null;
  resetResultado: string | null = null;
  resetCopiado = false;

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
    this.formulario = { nombre: '', email: '', rol: 'therapist', estado: 'activo', cedula: '', especialidad: '' };
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
      especialidad: u.especialidad ?? ''
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
    this.resetResultado = this.generarTemporal();
    this.resetCopiado = false;
    this.resetModalAbierto = true;
  }

  cerrarReset(): void {
    this.resetModalAbierto = false;
    this.resetUsuario = null;
    this.resetResultado = null;
    this.resetCopiado = false;
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

  private generarTemporal(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 12; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return `Bv-${out}`;
  }

  guardar(): void {
    const nombre = this.formulario.nombre.trim();
    const email = this.formulario.email.trim();
    if (!nombre || !email) {
      this.mensajeError = 'Nombre y correo son obligatorios.';
      return;
    }

    if (this.modo === 'alta') {
      this.usuarios.unshift({
        id: `u-${Date.now()}`,
        nombre,
        email,
        rol: this.formulario.rol,
        estado: this.formulario.estado,
        cedula: this.formulario.cedula.trim() || undefined,
        especialidad: this.formulario.especialidad.trim() || undefined,
        ultimaActividad: 'ahora'
      });
    } else {
      const u = this.usuarios.find((x) => x.id === this.editandoId);
      if (!u) {
        return;
      }
      // Restricción de negocio: no suspender/desactivar al último admin activo.
      if (u.rol === 'admin_platform' && u.estado === 'activo' && this.formulario.estado !== 'activo') {
        const adminsActivos = this.usuarios.filter((x) => x.rol === 'admin_platform' && x.estado === 'activo').length;
        if (adminsActivos <= 1) {
          this.mensajeError = 'No puedes suspender al último administrador activo de la plataforma.';
          return;
        }
      }
      u.nombre = nombre;
      u.email = email;
      u.rol = this.formulario.rol;
      u.estado = this.formulario.estado;
      u.cedula = this.formulario.cedula.trim() || undefined;
      u.especialidad = this.formulario.especialidad.trim() || undefined;
    }
    this.cerrarModal();
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
