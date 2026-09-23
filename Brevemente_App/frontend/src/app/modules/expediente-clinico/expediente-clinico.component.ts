import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ExpedienteRepository } from './ports/expediente.repository';
import { ExpedienteLocalStorageAdapter } from './adapters/expediente-localstorage.adapter';
import { ExpedienteHttpAdapter } from './adapters/expediente-http.adapter';
import { ClinicalRecord, Patient, Session } from '../../core/types/clinical.types';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-expediente-clinico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [
    {
      provide: ExpedienteRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.expedienteClinicoBackend
          ? new ExpedienteHttpAdapter(http)
          : new ExpedienteLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './expediente-clinico.component.html',
  styleUrl: './expediente-clinico.component.scss'
})
export class ExpedienteClinicoComponent implements OnInit {
  pacienteId: string = 'patient-1';
  patient: Patient | null = null;
  record: ClinicalRecord | null = null;
  sessions: Session[] = [];

  activeTab: 'formulacion' | 'sesiones' | 'audio' | 'legal' = 'formulacion';

  // Modal Nueva Sesión
  showSessionModal = false;
  newSessionProtocol = 'Trastornos Fóbicos y de Pánico (Protocolo Nardone)';
  newSessionEstratagema = 'Peor fantasía / Paradoja de control';
  newSessionPrescripcion = '';
  newSessionNotes = '';

  // Audio Simulator State
  isRecording = false;
  recordingSeconds = 0;
  private recordingInterval: any = null;
  transcriptText = '';
  levaAdvice = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly expedienteRepo: ExpedienteRepository,
    public readonly roleService: RoleStateService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.pacienteId = params.get('id') || 'patient-1';
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.expedienteRepo.obtenerPaciente(this.pacienteId).subscribe(p => this.patient = p);
    this.expedienteRepo.obtenerExpediente(this.pacienteId).subscribe(r => this.record = r);
    this.expedienteRepo.obtenerSesiones(this.pacienteId).subscribe(s => this.sessions = s);
  }

  setTab(tab: 'formulacion' | 'sesiones' | 'audio' | 'legal'): void {
    this.activeTab = tab;
  }

  firmarConsentimiento(): void {
    this.expedienteRepo.firmarConsentimiento(this.pacienteId).subscribe(() => {
      this.cargarDatos();
    });
  }

  // Audio recording simulation
  toggleRecording(): void {
    if (this.isRecording) {
      clearInterval(this.recordingInterval);
      this.isRecording = false;
      this.transcriptText = "Transcripción completada: 'El paciente refiere que al salir a la calle siente opresión torácica y busca inmediatamente el contacto de su madre. Intenta calmar la respiración pero el intento genera mayor hiperventilación.'";
      this.levaAdvice = "LEVA detectó la tentativa de solución redundante: 'Intentar controlar conscientemente las reacciones espontáneas'. Sugerencia TBE: Prescribir la Peor Fantasía o Declaración del Miedo.";
    } else {
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.transcriptText = 'Grabando y transcribiendo en tiempo real...';
      this.levaAdvice = '';
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
      }, 1000);
    }
  }

  openSessionModal(): void {
    this.showSessionModal = true;
    this.newSessionPrescripcion = '';
    this.newSessionNotes = '';
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
  }

  guardarSesion(): void {
    const nextNum = (this.sessions.length > 0 ? this.sessions[0].number + 1 : 1);
    const nueva: Omit<Session, 'id'> = {
      patientId: this.pacienteId,
      number: nextNum,
      date: new Date().toISOString().split('T')[0],
      phase: 'Intervención Estratégica',
      protocol: this.newSessionProtocol,
      dxOp: this.record?.dxOpInicial || 'Fobia de Rendimiento',
      px: [this.newSessionPrescripcion || 'Prescripción de confrontación paradójica'],
      f1: 'Foco en la extinción del control',
      f2: 'Reestructuración analógica',
      oss: this.newSessionNotes || 'Sesión enfocada en la adherencia a la prescripción previa.',
      add: 'Alta adherencia reportada',
      rss: 'Disminución de la angustia anticipatoria',
      eff: 'Desarticulación gradual de la evitación',
      notes: this.newSessionNotes,
      observationsNextSession: 'Revisar bitácora de la peor fantasía.',
      situation: 'En proceso',
      status: 'validado'
    };

    this.expedienteRepo.agregarSesion(this.pacienteId, nueva).subscribe(() => {
      this.cargarDatos();
      this.closeSessionModal();
      this.activeTab = 'sesiones';
    });
  }
}
