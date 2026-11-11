import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LevaProposalResponse,
  LevaSessionService,
  StructuredProposalData,
  ApproveProposalRequest
} from '../../../../core/services/leva-session.service';

@Component({
  selector: 'app-leva-proposal-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leva-proposal-review.component.html',
  styleUrls: ['./leva-proposal-review.component.scss']
})
export class LevaProposalReviewComponent implements OnInit, OnChanges {
  @Input({ required: true }) proposal!: LevaProposalResponse;
  @Input({ required: true }) sessionId!: string;
  @Input() therapistId: string = 'LIC-CARLOS-MENDOZA';
  @Input() therapistName: string = 'Dr. Carlos Mendoza';
  @Input() therapistLicense: string = 'CED-9988221-MX';
  @Input() readOnly: boolean = false;

  @Output() approved = new EventEmitter<LevaProposalResponse>();
  @Output() rejected = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  // Modelo de datos editable en pantalla
  editableData: StructuredProposalData = {
    diagnosticoOperativo: '',
    sistemaPerceptivoReactivo: '',
    tentativasSolucionRedundantes: [],
    reestructuracionesPropuestas: [],
    prescripcionesEstrategicas: [],
    valoracionDelCambio: '',
    estratagemaAplicada: '',
    reaccionPaciente: '',
    notaEvolucionSoap: '',
    dialogue: []
  };

  // Estados de interfaz
  isApproving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showDialogue = false;
  activeTab: 'clinico' | 'soap' | 'dialogo' = 'clinico';

  // Inputs temporales para agregar nuevos elementos a listas
  newTentativa: string = '';
  newPrescripcion: string = '';
  newReestructuracion: string = '';

  // Opciones estándar de Sistemas Perceptivo-Reactivos TBE (Arezzo/Nardone)
  readonly sprOptions: string[] = [
    'SPR Fóbico (Miedo / Ataque de Pánico)',
    'SPR Obsesivo-Compulsivo (Duda Patológica / Rituales)',
    'SPR Depresivo (Renuncia / Desesperanza)',
    'SPR Dismórfico / Control Corporal',
    'SPR Alimentario (Anorexia / Bulimia / Vomiting / Binge)',
    'SPR Paranoico / Persecutorio',
    'SPR Hipocondríaco / Angustia por la Salud',
    'SPR Relacional / Bloqueo en la Comunicación Familiar'
  ];

  constructor(private readonly levaSessionService: LevaSessionService) {}

  ngOnInit(): void {
    this.syncEditableData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proposal'] && this.proposal) {
      this.syncEditableData();
    }
  }

  /**
   * Inicializa o sincroniza la copia de trabajo editable a partir de la propuesta
   */
  private syncEditableData(): void {
    if (!this.proposal) return;

    // Si ya fue aprobada, usamos approvedData; si está en PROPOSED, usamos structuredProposal
    const source = (this.isApproved && this.proposal.approvedData)
      ? this.proposal.approvedData
      : (this.proposal.structuredProposal || {});

    this.editableData = {
      diagnosticoOperativo: source.diagnosticoOperativo || '',
      sistemaPerceptivoReactivo: source.sistemaPerceptivoReactivo || '',
      tentativasSolucionRedundantes: source.tentativasSolucionRedundantes ? [...source.tentativasSolucionRedundantes] : [],
      reestructuracionesPropuestas: source.reestructuracionesPropuestas ? [...source.reestructuracionesPropuestas] : [],
      prescripcionesEstrategicas: source.prescripcionesEstrategicas ? [...source.prescripcionesEstrategicas] : [],
      valoracionDelCambio: source.valoracionDelCambio || '',
      estratagemaAplicada: source.estratagemaAplicada || '',
      reaccionPaciente: source.reaccionPaciente || '',
      notaEvolucionSoap: source.notaEvolucionSoap || '',
      dialogue: source.dialogue ? [...source.dialogue] : []
    };
  }

  get isApproved(): boolean {
    return this.proposal?.humanReviewStatus === 'APPROVED';
  }

  get isProposed(): boolean {
    return this.proposal?.humanReviewStatus === 'PROPOSED';
  }

  get isRejected(): boolean {
    return this.proposal?.humanReviewStatus === 'REJECTED';
  }

  get hasRiskAlert(): boolean {
    return !!this.proposal?.riskLevel && this.proposal.riskLevel !== 'BAJO';
  }

  // --- Manejadores de listas dinámicas ---

  addTentativa(): void {
    const val = this.newTentativa.trim();
    if (!val) return;
    if (!this.editableData.tentativasSolucionRedundantes) {
      this.editableData.tentativasSolucionRedundantes = [];
    }
    this.editableData.tentativasSolucionRedundantes.push(val);
    this.newTentativa = '';
  }

  removeTentativa(index: number): void {
    this.editableData.tentativasSolucionRedundantes?.splice(index, 1);
  }

  addPrescripcion(): void {
    const val = this.newPrescripcion.trim();
    if (!val) return;
    if (!this.editableData.prescripcionesEstrategicas) {
      this.editableData.prescripcionesEstrategicas = [];
    }
    this.editableData.prescripcionesEstrategicas.push(val);
    this.newPrescripcion = '';
  }

  removePrescripcion(index: number): void {
    this.editableData.prescripcionesEstrategicas?.splice(index, 1);
  }

  addReestructuracion(): void {
    const val = this.newReestructuracion.trim();
    if (!val) return;
    if (!this.editableData.reestructuracionesPropuestas) {
      this.editableData.reestructuracionesPropuestas = [];
    }
    this.editableData.reestructuracionesPropuestas.push(val);
    this.newReestructuracion = '';
  }

  removeReestructuracion(index: number): void {
    this.editableData.reestructuracionesPropuestas?.splice(index, 1);
  }

  /**
   * Restablece los datos editables a lo que LEVA sugirió originalmente
   */
  restablecerSugerenciaOriginal(): void {
    if (!this.proposal?.structuredProposal) return;
    const orig = this.proposal.structuredProposal;
    this.editableData = {
      diagnosticoOperativo: orig.diagnosticoOperativo || '',
      sistemaPerceptivoReactivo: orig.sistemaPerceptivoReactivo || '',
      tentativasSolucionRedundantes: orig.tentativasSolucionRedundantes ? [...orig.tentativasSolucionRedundantes] : [],
      reestructuracionesPropuestas: orig.reestructuracionesPropuestas ? [...orig.reestructuracionesPropuestas] : [],
      prescripcionesEstrategicas: orig.prescripcionesEstrategicas ? [...orig.prescripcionesEstrategicas] : [],
      valoracionDelCambio: orig.valoracionDelCambio || '',
      estratagemaAplicada: orig.estratagemaAplicada || '',
      reaccionPaciente: orig.reaccionPaciente || '',
      notaEvolucionSoap: orig.notaEvolucionSoap || '',
      dialogue: orig.dialogue ? [...orig.dialogue] : []
    };
    this.successMessage = 'Se han restaurado los valores originales sugeridos por LEVA.';
    setTimeout(() => this.successMessage = null, 3000);
  }

  /**
   * Acción principal Human-in-the-Loop: Sellar y Aprobar
   */
  aprobarYSellar(): void {
    if (this.readOnly || this.isApproved) return;

    this.isApproving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const requestPayload: ApproveProposalRequest = {
      reviewedById: `${this.therapistName} (${this.therapistLicense})`,
      approvedData: { ...this.editableData }
    };

    const targetSessionId = this.sessionId || this.proposal.sessionId;

    this.levaSessionService.approveProposal(targetSessionId, requestPayload).subscribe({
      next: (response) => {
        this.isApproving = false;
        this.proposal = response;
        this.successMessage = 'Expediente clínico sellado y aprobado exitosamente.';
        this.approved.emit(response);
      },
      error: (err) => {
        this.isApproving = false;
        this.errorMessage = err.error?.message || err.message || 'Error al sellar y aprobar la propuesta.';
      }
    });
  }

  descartarSugerencia(): void {
    this.rejected.emit(this.proposal?.proposalId || this.sessionId);
  }
}

