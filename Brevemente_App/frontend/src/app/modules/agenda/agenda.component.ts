import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AgendaRepository } from './ports/agenda.repository';
import { AgendaLocalStorageAdapter } from './adapters/agenda-localstorage.adapter';
import { AgendaHttpAdapter } from './adapters/agenda-http.adapter';
import { Appointment, Patient } from '../../core/types/clinical.types';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [
    {
      provide: AgendaRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.agendaBackend
          ? new AgendaHttpAdapter(http)
          : new AgendaLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent implements OnInit {
  citas: Appointment[] = [];
  pacientes: Patient[] = [];
  viewMode: 'semana' | 'dia' = 'semana';

  showNewModal = false;
  selectedPatientId = '';
  newTime = '10:00';
  newDate = new Date().toISOString().split('T')[0];
  newType: 'primera' | 'seguimiento' | 'cierre' = 'seguimiento';

  constructor(private readonly agendaRepo: AgendaRepository) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.agendaRepo.listarCitas().subscribe(c => this.citas = c);
    this.agendaRepo.obtenerPacientes().subscribe(p => {
      this.pacientes = p;
      if (p.length > 0 && !this.selectedPatientId) {
        this.selectedPatientId = p[0].id;
      }
    });
  }

  isPatientBlocked(patientId: string): boolean {
    const p = this.pacientes.find(item => item.id === patientId);
    if (!p) return false;
    return p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado;
  }

  get selectedPatient(): Patient | undefined {
    return this.pacientes.find(p => p.id === this.selectedPatientId);
  }

  openNewModal(): void {
    this.showNewModal = true;
  }

  closeNewModal(): void {
    this.showNewModal = false;
  }

  guardarCita(): void {
    const p = this.selectedPatient;
    if (!p) return;

    const nueva: Omit<Appointment, 'id'> = {
      patientId: p.id,
      patientName: p.name,
      time: this.newTime,
      date: this.newDate,
      type: this.newType,
      status: this.isPatientBlocked(p.id) ? 'pendiente' : 'confirmada',
      paymentStatus: 'pendiente'
    };

    this.agendaRepo.agendarCita(nueva).subscribe(() => {
      this.cargarDatos();
      this.closeNewModal();
    });
  }

  cambiarEstado(cita: Appointment, nuevoEstado: Appointment['status']): void {
    this.agendaRepo.actualizarEstadoCita(cita.id, nuevoEstado).subscribe(() => {
      this.cargarDatos();
    });
  }
}
