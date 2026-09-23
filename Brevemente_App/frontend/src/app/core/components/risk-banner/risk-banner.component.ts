import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-risk-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showAlert" class="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900 select-none">
      <div class="flex items-center gap-2">
        <span class="text-sm">⚠️</span>
        <span class="font-bold">Aviso Normativo TBE:</span>
        <span>El paciente <strong>Mateo Herrera Santos (17 años)</strong> requiere firma de la persona de apoyo para habilitar agenda y grabaciones LEVA.</span>
      </div>
      <button (click)="showAlert = false" class="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5">✕</button>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class RiskAlertBannerComponent {
  showAlert = true;
}
