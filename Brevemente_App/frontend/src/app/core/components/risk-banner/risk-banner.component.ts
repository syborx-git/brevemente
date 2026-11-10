import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRepository } from '../../../modules/dashboard/ports/dashboard.repository';

@Component({
  selector: 'app-risk-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showAlert" class="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900 select-none">
      <div class="flex items-center gap-2">
        <span class="font-bold">Aviso Normativo TBE:</span>
        <span>{{ mensaje }}</span>
      </div>
      <button (click)="showAlert = false" class="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5">✕</button>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class RiskAlertBannerComponent implements OnInit {
  private readonly dashboardRepo = inject(DashboardRepository);

  showAlert = false;
  mensaje = '';

  ngOnInit(): void {
    // El aviso normativo se deriva de las alertas de consentimiento YA scoped
    // por el backend (solo pacientes del terapeuta/supervisor autenticado).
    this.dashboardRepo.obtenerAlertasUrgentes().subscribe({
      next: (alertas) => {
        const pendientes = (alertas ?? []).filter((a) => a.tipo === 'CONSENTIMIENTO');
        if (pendientes.length === 0) {
          this.showAlert = false;
          return;
        }
        const nombres = pendientes.map((a) => a.pacienteNombre).join(', ');
        this.mensaje = `Paciente(s) con firma de consentimiento pendiente: ${nombres}.`;
        this.showAlert = true;
      },
      error: () => {
        this.showAlert = false;
      }
    });
  }
}
