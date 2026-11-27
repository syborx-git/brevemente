import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Patient, Appointment } from '../../core/types/clinical.types';

type Tab = 'pacientes' | 'citas' | 'expedientes';

/**
 * Visión Global (D-14): data clínica global de la plataforma para el
 * administrador unificado. No aplica alcance de terapeuta y no duplica
 * los KPIs del Dashboard de Plataforma.
 */
@Component({
  selector: 'app-vision-global',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vision-global.component.html',
  styleUrl: './vision-global.component.scss'
})
export class VisionGlobalComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/vision-global';

  pacientes: Patient[] = [];
  citas: Appointment[] = [];
  cargando = true;
  error: string | null = null;

  tab: Tab = 'pacientes';

  // Filtros de pacientes
  buscarPaciente = '';
  filtroEstado = 'todos';
  filtroRiesgo = 'todos';

  // Filtros de citas
  buscarCita = '';
  filtroEstadoCita = 'todos';
  filtroDesde = '';
  filtroHasta = '';

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.http.get<Patient[]>(`${this.baseUrl}/pacientes`).subscribe({
      next: (res) => {
        this.pacientes = res ?? [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el directorio global de pacientes.';
        this.cargando = false;
      }
    });

    this.http.get<Appointment[]>(`${this.baseUrl}/citas`).subscribe({
      next: (res) => {
        this.citas = res ?? [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la agenda global de citas.';
        this.cargando = false;
      }
    });
  }

  get pacientesFiltrados(): Patient[] {
    const q = this.buscarPaciente.trim().toLowerCase();
    return this.pacientes.filter((p) => {
      const coincideTexto =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.curp?.toLowerCase().includes(q) ||
        p.therapistName?.toLowerCase().includes(q);
      const coincideEstado = this.filtroEstado === 'todos' || p.status === this.filtroEstado;
      const coincideRiesgo = this.filtroRiesgo === 'todos' || p.riskLevel === this.filtroRiesgo;
      return coincideTexto && coincideEstado && coincideRiesgo;
    });
  }

  get citasFiltradas(): Appointment[] {
    const q = this.buscarCita.trim().toLowerCase();
    return this.citas.filter((c) => {
      const coincideTexto =
        !q ||
        c.patientName?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q);
      const coincideEstado = this.filtroEstadoCita === 'todos' || c.status === this.filtroEstadoCita;
      const coincideDesde = !this.filtroDesde || (c.date ?? '') >= this.filtroDesde;
      const coincideHasta = !this.filtroHasta || (c.date ?? '') <= this.filtroHasta;
      return coincideTexto && coincideEstado && coincideDesde && coincideHasta;
    });
  }

  /** Un expediente existe por paciente (alta automática); el listado global es el directorio. */
  get expedientesFiltrados(): Patient[] {
    return this.pacientesFiltrados;
  }
}
