import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PacienteRepository } from './ports/paciente.repository';
import { PacienteLocalStorageAdapter } from './adapters/paciente-localstorage.adapter';
import { PacienteHttpAdapter } from './adapters/paciente-http.adapter';
import { Patient } from '../../core/types/clinical.types';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [
    {
      provide: PacienteRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.pacientesBackend
          ? new PacienteHttpAdapter(http)
          : new PacienteLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.scss'
})
export class PacientesComponent implements OnInit {
  pacientes: Patient[] = [];
  searchTerm: string = '';
  statusFilter: string = 'todos';
  consentFilter: string = 'TODOS';

  // Modal de Creación
  showCreateModal = false;
  newNombre = '';
  newCurp = '';
  newFechaNacimiento = '';
  newTelefono = '';
  newEmail = '';
  newMotif = '';
  newPersonaApoyoNombre = '';
  newPersonaApoyoTelefono = '';

  calculatedAge: number | null = null;
  isMinor: boolean = false;

  constructor(private readonly pacienteRepo: PacienteRepository) {}

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.pacienteRepo.listar().subscribe((data) => {
      this.pacientes = data;
    });
  }

  get filteredPacientes(): Patient[] {
    return this.pacientes.filter((p) => {
      const matchSearch = !this.searchTerm ||
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.curp.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchStatus = this.statusFilter === 'todos' || p.status === this.statusFilter;
      const matchConsent = this.consentFilter === 'TODOS' || p.capacidadConsentimiento.estado === this.consentFilter;

      return matchSearch && matchStatus && matchConsent;
    });
  }

  onFechaNacimientoChange(): void {
    if (!this.newFechaNacimiento) {
      this.calculatedAge = null;
      this.isMinor = false;
      return;
    }
    const birth = new Date(this.newFechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    this.calculatedAge = age;
    this.isMinor = age < 18;
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newNombre = '';
    this.newCurp = '';
    this.newFechaNacimiento = '';
    this.newTelefono = '';
    this.newEmail = '';
    this.newMotif = '';
    this.newPersonaApoyoNombre = '';
    this.newPersonaApoyoTelefono = '';
    this.calculatedAge = null;
    this.isMinor = false;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  guardarPaciente(): void {
    if (!this.newNombre || !this.newFechaNacimiento) return;

    const age = this.calculatedAge ?? 25;
    const isUnder18 = age < 18;

    const nuevo: Omit<Patient, 'id'> = {
      name: this.newNombre,
      phone: this.newTelefono || '+52 55 0000 0000',
      email: this.newEmail || 'contacto@brevemente.org',
      birthDate: this.newFechaNacimiento,
      curp: this.newCurp || 'CURP-GENERADO-01',
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'activo',
      riskLevel: 'bajo',
      registryMode: 'manual',
      motif: this.newMotif || 'Motivo no especificado',
      therapistId: 'therapist-1',
      therapistName: 'Dr. Alejandro Silva',
      fechaNacimiento: this.newFechaNacimiento,
      edadCalculada: age,
      capacidadConsentimiento: {
        estado: isUnder18 ? 'REPRESENTADO_POR_EDAD' : 'AUTONOMO',
        determinadoPor: null,
        fechaDeterminacion: new Date().toISOString().split('T')[0],
        fechaRevision: null,
        motivo: isUnder18 ? 'Menor de 18 años calculado automáticamente' : null
      },
      quienCompletaRegistro: isUnder18 ? 'FAMILIAR_O_APOYO' : 'PACIENTE',
      representante: isUnder18 && this.newPersonaApoyoNombre ? {
        nombreCompleto: this.newPersonaApoyoNombre,
        parentesco: 'MADRE',
        telefono: this.newPersonaApoyoTelefono || '+52 55 1111 2222',
        correo: 'apoyo@familia.mx',
        documentoIdentificacion: null,
        documentoVinculo: null,
        otroProgenitorInformado: null
      } : null,
      telefonoPaciente: this.newTelefono,
      consentimientoRepresentanteFirmado: false,
      sessionFrequency: 'semanal'
    };

    this.pacienteRepo.crear(nuevo).subscribe(() => {
      this.cargarPacientes();
      this.closeCreateModal();
    });
  }

  getBadgeConsentClass(estado: string): string {
    switch (estado) {
      case 'AUTONOMO': return 'bg-emerald-100 text-emerald-800';
      case 'REPRESENTADO_POR_EDAD': return 'bg-amber-100 text-amber-800';
      case 'REPRESENTADO_POR_CONDICION': return 'bg-purple-100 text-purple-800';
      case 'PENDIENTE_DETERMINACION': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getRiskClass(level: string): string {
    switch (level) {
      case 'alto': return 'bg-red-100 text-red-800 font-bold';
      case 'medio': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}
