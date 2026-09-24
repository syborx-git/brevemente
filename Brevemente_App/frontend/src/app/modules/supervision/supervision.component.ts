import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SupervisionRepository } from './ports/supervision.repository';
import { SupervisionLocalStorageAdapter } from './adapters/supervision-localstorage.adapter';
import { SupervisionHttpAdapter } from './adapters/supervision-http.adapter';
import { SupervisionLog } from '../../core/types/clinical.types';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-supervision',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: SupervisionRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.supervisionBackend
          ? new SupervisionHttpAdapter(http)
          : new SupervisionLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './supervision.component.html',
  styleUrl: './supervision.component.scss'
})
export class SupervisionComponent implements OnInit {
  logs: SupervisionLog[] = [];
  showModal = false;

  newSupervisor = 'Dra. Isabel Cárdenas';
  newPatient = 'Mateo Herrera Santos';
  newSessionNumber = 2;
  newTrastorno = 'Fobia de Rendimiento';
  newReestructuracion = 'Romper el círculo vicioso de la evitación reasegurada';
  newPrescripcion = 'Prescripción de la media hora de lo peor';

  constructor(
    private readonly supervisionRepo: SupervisionRepository,
    public readonly roleService: RoleStateService
  ) {}

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.supervisionRepo.listarLogs().subscribe(l => this.logs = l);
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  guardarLog(): void {
    const nuevo: Omit<SupervisionLog, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      supervisorName: this.newSupervisor,
      supervisorLicense: 'CED-SUP-45129',
      patientId: 'patient-1',
      patientName: this.newPatient,
      therapistId: 'therapist-1',
      therapistName: this.roleService.currentUserName,
      sessionNumber: this.newSessionNumber,
      problemDefinition: 'Bloqueo fóbico en situaciones de examen',
      currentSituation: 'Angustia anticipatoria',
      spr: 'Fóbico - obsesivo',
      ts: this.newTrastorno,
      therapistProblem: 'Dificultad para lograr que el paciente complete la tarea',
      rst: this.newReestructuracion,
      px: this.newPrescripcion,
      eff: 'Excelente respuesta en casos similares',
      doubt: 'Ninguna',
      blocking: 'Bajo',
      observations: 'Revisión rigurosa de la adherencia del paciente.',
      recommendations: 'No flexibilizar la prescripción durante los primeros 7 días.'
    };

    this.supervisionRepo.agregarLog(nuevo).subscribe(() => {
      this.cargarLogs();
      this.closeModal();
    });
  }
}
