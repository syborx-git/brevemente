import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PacienteRepository } from './ports/paciente.repository';
import { PacienteLocalStorageAdapter } from './adapters/paciente-localstorage.adapter';
import { PacienteHttpAdapter } from './adapters/paciente-http.adapter';
import { Patient, ParentescoRepresentante } from '../../core/types/clinical.types';
import { formatEstadoConsentimientoLabel } from '../../core/utils/consentimiento.utils';
import { evaluateCurpDateMismatch, parseCurpBirthDate } from '../../core/utils/curp.utils';
import { RoleStateService } from '../../core/services/role-state.service';
import { DashboardRepository, SedeDTO, TerapeutaDTO } from '../dashboard/ports/dashboard.repository';
import { DashboardHttpAdapter } from '../dashboard/adapters/dashboard-http.adapter';
import { DashboardLocalStorageAdapter } from '../dashboard/adapters/dashboard-localstorage.adapter';
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
    },
    {
      provide: DashboardRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.dashboardBackend
          ? new DashboardHttpAdapter(http)
          : new DashboardLocalStorageAdapter();
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
  newEmail = '';
  newMotif = '';
  newRfc = '';
  newSexo: 'M' | 'F' | 'LGTB+' | null = null;
  newLugarNacimiento = '';
  newEstadoCivil = '';
  newEscolaridad = '';
  newOcupacion = '';
  newReligion = '';
  // Domicilio
  newCalle = '';
  newColonia = '';
  newCp = '';
  newMunicipio = '';
  newEstadoDomicilio = '';
  newTelCasa = '';
  newTelCelular = '';
  newTelTrabajo = '';
  // Contacto de emergencia
  newCeNombre = '';
  newCeParentesco = '';
  newCeTelefono = '';
  // Persona de apoyo (representante)
  newPersonaApoyoNombre = '';
  newPersonaApoyoTelefono = '';
  newParentescoApoyo: ParentescoRepresentante = 'MADRE';
  newCorreoRepresentante = '';
  // Asignación
  newSedeId = '';
  newTherapistId = '';
  sedes: SedeDTO[] = [];
  terapeutas: TerapeutaDTO[] = [];

  calculatedAge: number | null = null;
  isMinor: boolean = false;
  curpMismatchWarning: string | null = null;

  constructor(
    private readonly pacienteRepo: PacienteRepository,
    private readonly roleService: RoleStateService,
    private readonly dashboardRepo: DashboardRepository
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.dashboardRepo.obtenerCatalogos().subscribe(c => {
      this.sedes = c.sedes || [];
      this.terapeutas = c.terapeutas || [];
    });
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
      this.curpMismatchWarning = null;
      return;
    }
    const birth = new Date(this.newFechaNacimiento + 'T00:00:00');
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    this.calculatedAge = age;
    this.isMinor = age < 18;

    if (this.newCurp.length === 18) {
      this.curpMismatchWarning = evaluateCurpDateMismatch(this.newCurp, this.newFechaNacimiento);
    } else {
      this.curpMismatchWarning = null;
    }
  }

  /** Paridad con la demo: autocompleta la fecha de nacimiento desde la CURP. */
  onCurpChange(): void {
    this.newCurp = (this.newCurp || '').toUpperCase();

    const parsed = parseCurpBirthDate(this.newCurp);
    if (this.newCurp.length === 18 && parsed.isValid && parsed.birthDate) {
      this.newFechaNacimiento = parsed.birthDate;
      this.onFechaNacimientoChange();
      this.curpMismatchWarning = null;
      return;
    }

    if (this.newCurp.length === 18 && this.newFechaNacimiento) {
      this.curpMismatchWarning = evaluateCurpDateMismatch(this.newCurp, this.newFechaNacimiento);
    } else if (this.newCurp.length < 18) {
      this.curpMismatchWarning = null;
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newNombre = '';
    this.newCurp = '';
    this.newFechaNacimiento = '';
    this.newEmail = '';
    this.newMotif = '';
    this.newRfc = '';
    this.newSexo = null;
    this.newLugarNacimiento = '';
    this.newEstadoCivil = '';
    this.newEscolaridad = '';
    this.newOcupacion = '';
    this.newReligion = '';
    this.newCalle = '';
    this.newColonia = '';
    this.newCp = '';
    this.newMunicipio = '';
    this.newEstadoDomicilio = '';
    this.newTelCasa = '';
    this.newTelCelular = '';
    this.newTelTrabajo = '';
    this.newCeNombre = '';
    this.newCeParentesco = '';
    this.newCeTelefono = '';
    this.newPersonaApoyoNombre = '';
    this.newPersonaApoyoTelefono = '';
    this.newParentescoApoyo = 'MADRE';
    this.newCorreoRepresentante = '';
    this.newSedeId = '';
    this.newTherapistId = this.roleService.terapeutaIds.length === 1 ? this.roleService.terapeutaIds[0] : '';
    this.calculatedAge = null;
    this.isMinor = false;
    this.curpMismatchWarning = null;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  guardarPaciente(): void {
    const curp = (this.newCurp || '').trim().toUpperCase();
    if (!this.newNombre || !this.newFechaNacimiento) return;
    if (curp.length !== 18) {
      this.curpMismatchWarning = 'La CURP es obligatoria y debe tener exactamente 18 caracteres.';
      return;
    }

    const age = this.calculatedAge ?? 25;
    const isUnder18 = age < 18;

    const telefonoPrincipal = this.newTelCelular || this.newTelCasa || this.newTelTrabajo || '';

    const nuevo: Omit<Patient, 'id'> = {
      name: this.newNombre,
      phone: telefonoPrincipal,
      email: this.newEmail || '',
      birthDate: this.newFechaNacimiento,
      curp,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'activo',
      riskLevel: 'bajo',
      registryMode: 'manual',
      motif: this.newMotif || 'Motivo no especificado',
      therapistId: this.newTherapistId || '',
      therapistName: this.terapeutaNombreSeleccionado(),
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
      representante: isUnder18 ? {
        nombreCompleto: this.newPersonaApoyoNombre || '',
        parentesco: this.newParentescoApoyo,
        telefono: this.newPersonaApoyoTelefono || '',
        correo: this.newCorreoRepresentante || '',
        documentoIdentificacion: null,
        documentoVinculo: null,
        otroProgenitorInformado: null
      } : null,
      telefonoPaciente: telefonoPrincipal,
      consentimientoRepresentanteFirmado: false,
      sessionFrequency: 'semanal',
      rfc: this.newRfc || undefined,
      sexo: this.newSexo ?? undefined,
      lugarNacimiento: this.newLugarNacimiento || undefined,
      estadoCivil: this.newEstadoCivil || undefined,
      escolaridad: this.newEscolaridad || undefined,
      ocupacion: this.newOcupacion || undefined,
      religion: this.newReligion || undefined,
      domicilio: {
        calleNumero: this.newCalle || '',
        colonia: this.newColonia || '',
        codigoPostal: this.newCp || '',
        municipio: this.newMunicipio || '',
        estadoDomicilio: this.newEstadoDomicilio || '',
        telefonoCasa: this.newTelCasa || null,
        telefonoCelular: this.newTelCelular || null,
        telefonoTrabajo: this.newTelTrabajo || null
      },
      contactoEmergencia: {
        nombre: this.newCeNombre || '',
        parentesco: this.newCeParentesco || '',
        telefono: this.newCeTelefono || ''
      },
      sedeId: this.newSedeId || undefined
    };

    this.pacienteRepo.crear(nuevo).subscribe({
      next: () => {
        this.cargarPacientes();
        this.closeCreateModal();
      },
      error: (err) => {
        alert('No se pudo registrar el paciente: ' + (err?.message || err));
      }
    });
  }

  private terapeutaNombreSeleccionado(): string {
    const t = this.terapeutas.find(x => x.id === this.newTherapistId);
    if (t) return t.nombre;
    if (this.newTherapistId && this.roleService.terapeutaIds.includes(this.newTherapistId)) {
      return this.roleService.currentUserName;
    }
    return '';
  }

  formatEstadoConsentimiento(estado?: string | null): string {
    return formatEstadoConsentimientoLabel(estado);
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
