import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleStateService } from '../../services/role-state.service';

@Component({
  selector: 'app-leva-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="roleService.toggleLeva()"
      class="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-clinical-dark to-clinical-darkLight text-white font-bold text-xs shadow-2xl border border-clinical-accent/40 hover:scale-105 active:scale-95 transition-all group select-none">
      <span class="text-base group-hover:rotate-12 transition-transform">🧠</span>
      <span>Asistente LEVA</span>
      <span class="w-2 h-2 rounded-full bg-clinical-accent animate-pulse"></span>
    </button>
  `,
  styles: [`:host { display: block; }`]
})
export class LevaButtonComponent {
  constructor(public readonly roleService: RoleStateService) {}
}
