import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TipoSede = 'publico' | 'privado' | 'social';
type EstadoLicencia = 'vigente' | 'por_vencer' | 'vencida';

interface TerapeutaSede {
  id: string;
  nombre: string;
}

interface SedeEstablecimiento {
  id: string;
  nombre: string;
  clues: string;
  licenciaSanitaria: string;
  licenciaEstado: EstadoLicencia;
  tipo: TipoSede;
  direccion: string;
  ciudad: string;
  principal: boolean;
  terapeutas: TerapeutaSede[];
}

/**
 * Módulo 3 — Sedes y Establecimientos (vista previa frontend).
 * Datos mock; se conectará al backend cuando exista (permiso ADMIN_SEDES).
 */
@Component({
  selector: 'app-sedes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sedes.component.html',
  styleUrl: './sedes.component.scss'
})
export class SedesComponent {
  readonly tipos: { clave: TipoSede; etiqueta: string }[] = [
    { clave: 'publico', etiqueta: 'Público' },
    { clave: 'privado', etiqueta: 'Privado' },
    { clave: 'social', etiqueta: 'Social' }
  ];

  readonly estadosLicencia: { clave: EstadoLicencia; etiqueta: string }[] = [
    { clave: 'vigente', etiqueta: 'Vigente' },
    { clave: 'por_vencer', etiqueta: 'Por vencer' },
    { clave: 'vencida', etiqueta: 'Vencida' }
  ];

  readonly catalogoTerapeutas: TerapeutaSede[] = [
    { id: 'ter-001', nombre: 'Dra. Sofía Ramírez Lozano' },
    { id: 'ter-002', nombre: 'Mtro. Alejandro Mendoza Garza' },
    { id: 'ter-003', nombre: 'Dra. Isabel Cárdenas' },
    { id: 'ter-004', nombre: 'Dr. Luis Herrera' },
    { id: 'ter-005', nombre: 'Dra. Mariana Ríos' },
    { id: 'ter-006', nombre: 'Mtro. Diego Fuentes' },
    { id: 'ter-007', nombre: 'Dra. Valeria Salas' },
    { id: 'ter-008', nombre: 'Mtro. Ricardo Téllez' }
  ];

  sedes: SedeEstablecimiento[] = [
    {
      id: 'sede-centro',
      nombre: 'Centro',
      clues: 'CLUES-09001',
      licenciaSanitaria: 'LS-2024-0001',
      licenciaEstado: 'vigente',
      tipo: 'privado',
      direccion: 'Av. Reforma 123, Col. Centro',
      ciudad: 'Ciudad de México',
      principal: true,
      terapeutas: [
        { id: 'ter-001', nombre: 'Dra. Sofía Ramírez Lozano' },
        { id: 'ter-002', nombre: 'Mtro. Alejandro Mendoza Garza' },
        { id: 'ter-004', nombre: 'Dr. Luis Herrera' }
      ]
    },
    {
      id: 'sede-norte',
      nombre: 'Norte',
      clues: 'CLUES-09002',
      licenciaSanitaria: 'LS-2024-0002',
      licenciaEstado: 'por_vencer',
      tipo: 'publico',
      direccion: 'Calz. Vallejo 456, Col. Lindavista',
      ciudad: 'Ciudad de México',
      principal: false,
      terapeutas: [
        { id: 'ter-003', nombre: 'Dra. Isabel Cárdenas' },
        { id: 'ter-006', nombre: 'Mtro. Diego Fuentes' }
      ]
    },
    {
      id: 'sede-sur',
      nombre: 'Sur',
      clues: 'CLUES-09003',
      licenciaSanitaria: 'LS-2023-0003',
      licenciaEstado: 'vencida',
      tipo: 'social',
      direccion: 'Av. División del Norte 789, Col. Coyoacán',
      ciudad: 'Ciudad de México',
      principal: false,
      terapeutas: [{ id: 'ter-005', nombre: 'Dra. Mariana Ríos' }]
    }
  ];

  busqueda = '';
  filtroTipo: TipoSede | 'todos' = 'todos';

  modalAbierto = false;
  modo: 'alta' | 'edicion' = 'alta';
  editandoId: string | null = null;
  formulario = {
    nombre: '',
    tipo: 'privado' as TipoSede,
    clues: '',
    licenciaSanitaria: '',
    licenciaEstado: 'vigente' as EstadoLicencia,
    direccion: '',
    ciudad: '',
    principal: false,
    terapeutaIds: [] as string[]
  };
  mensajeError = '';

  private triggerElement: HTMLElement | null = null;

  get sedesFiltradas(): SedeEstablecimiento[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.sedes.filter((s) => {
      const matchQ =
        !q ||
        s.nombre.toLowerCase().includes(q) ||
        s.clues.toLowerCase().includes(q) ||
        s.ciudad.toLowerCase().includes(q);
      const matchTipo = this.filtroTipo === 'todos' || s.tipo === this.filtroTipo;
      return matchQ && matchTipo;
    });
  }

  abrirAlta(): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.modo = 'alta';
    this.editandoId = null;
    this.formulario = {
      nombre: '',
      tipo: 'privado',
      clues: '',
      licenciaSanitaria: '',
      licenciaEstado: 'vigente',
      direccion: '',
      ciudad: '',
      principal: false,
      terapeutaIds: []
    };
    this.mensajeError = '';
    this.modalAbierto = true;
  }

  abrirEdicion(s: SedeEstablecimiento): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.modo = 'edicion';
    this.editandoId = s.id;
    this.formulario = {
      nombre: s.nombre,
      tipo: s.tipo,
      clues: s.clues,
      licenciaSanitaria: s.licenciaSanitaria,
      licenciaEstado: s.licenciaEstado,
      direccion: s.direccion,
      ciudad: s.ciudad,
      principal: s.principal,
      terapeutaIds: s.terapeutas.map((t) => t.id)
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

  toggleTerapeuta(id: string): void {
    const i = this.formulario.terapeutaIds.indexOf(id);
    if (i >= 0) {
      this.formulario.terapeutaIds.splice(i, 1);
    } else {
      this.formulario.terapeutaIds.push(id);
    }
  }

  guardar(): void {
    const nombre = this.formulario.nombre.trim();
    const clues = this.formulario.clues.trim();
    if (!nombre || !clues) {
      this.mensajeError = 'Nombre y CLUES son obligatorios.';
      return;
    }

    const terapeutas = this.catalogoTerapeutas.filter((t) => this.formulario.terapeutaIds.includes(t.id));

    if (this.modo === 'alta') {
      this.sedes.unshift({
        id: `sede-${Date.now()}`,
        nombre,
        clues,
        licenciaSanitaria: this.formulario.licenciaSanitaria.trim(),
        licenciaEstado: this.formulario.licenciaEstado,
        tipo: this.formulario.tipo,
        direccion: this.formulario.direccion.trim(),
        ciudad: this.formulario.ciudad.trim(),
        principal: this.formulario.principal,
        terapeutas
      });
    } else {
      const s = this.sedes.find((x) => x.id === this.editandoId);
      if (!s) {
        return;
      }
      s.nombre = nombre;
      s.clues = clues;
      s.licenciaSanitaria = this.formulario.licenciaSanitaria.trim();
      s.licenciaEstado = this.formulario.licenciaEstado;
      s.tipo = this.formulario.tipo;
      s.direccion = this.formulario.direccion.trim();
      s.ciudad = this.formulario.ciudad.trim();
      s.principal = this.formulario.principal;
      s.terapeutas = terapeutas;
    }

    // Restricción: solo una sede principal a la vez.
    if (this.formulario.principal) {
      this.sedes.forEach((x) => {
        if (x.id !== this.editandoId) {
          x.principal = false;
        }
      });
    }

    this.cerrarModal();
  }

  tipoLabel(clave: TipoSede): string {
    return this.tipos.find((t) => t.clave === clave)?.etiqueta ?? clave;
  }

  tipoClase(clave: TipoSede): string {
    switch (clave) {
      case 'publico':
        return 'bg-sky-100 text-sky-700';
      case 'privado':
        return 'bg-violet-100 text-violet-700';
      case 'social':
        return 'bg-emerald-100 text-emerald-700';
    }
  }

  licenciaClase(estado: EstadoLicencia): string {
    switch (estado) {
      case 'vigente':
        return 'bg-emerald-100 text-emerald-700';
      case 'por_vencer':
        return 'bg-amber-100 text-amber-700';
      case 'vencida':
        return 'bg-red-100 text-red-700';
    }
  }

  licenciaLabel(estado: EstadoLicencia): string {
    return this.estadosLicencia.find((e) => e.clave === estado)?.etiqueta ?? estado;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalAbierto) {
      this.cerrarModal();
    }
  }
}
