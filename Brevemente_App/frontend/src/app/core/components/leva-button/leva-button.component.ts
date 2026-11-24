import { Component, HostListener } from '@angular/core';
import { RoleStateService } from '../../services/role-state.service';

const POSITION_KEY = 'brevemente_leva_orb_position';
const ORB_SIZE = 56; // w-14 = 3.5rem
const DRAG_THRESHOLD = 4; // px

@Component({
  selector: 'app-leva-button',
  standalone: true,
  template: `
    <button
      type="button"
      aria-label="Abrir asistente LEVA"
      (pointerdown)="onPointerDown($event)"
      (click)="onClick()"
      [style.left.px]="x"
      [style.top.px]="y"
      class="fixed z-40 w-14 h-14 rounded-full bg-gradient-to-br from-clinical-dark to-clinical-darkLight shadow-2xl border-2 border-clinical-accent/50 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none hover:brightness-110 transition-[filter]">
      <span class="relative flex h-4 w-4">
        <span class="absolute inline-flex h-full w-full rounded-full bg-clinical-accent opacity-75 animate-ping"></span>
        <span class="relative inline-flex h-4 w-4 rounded-full bg-clinical-accent"></span>
      </span>
    </button>
  `
})
export class LevaButtonComponent {
  x = 0;
  y = 0;

  private dragging = false;
  private moved = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(public readonly roleService: RoleStateService) {
    this.loadPosition();
  }

  onPointerDown(e: PointerEvent): void {
    this.dragging = true;
    this.moved = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.offsetX = e.clientX - this.x;
    this.offsetY = e.clientY - this.y;
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    if (Math.abs(e.clientX - this.startX) > DRAG_THRESHOLD
        || Math.abs(e.clientY - this.startY) > DRAG_THRESHOLD) {
      this.moved = true;
    }
    this.x = this.clamp(e.clientX - this.offsetX, 0, window.innerWidth - ORB_SIZE);
    this.y = this.clamp(e.clientY - this.offsetY, 0, window.innerHeight - ORB_SIZE);
  }

  @HostListener('document:pointerup')
  onPointerUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.moved) {
      this.savePosition();
    }
  }

  onClick(): void {
    const wasDragged = this.moved;
    this.moved = false;
    if (wasDragged) return;
    this.roleService.toggleLeva();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.x = this.clamp(this.x, 0, window.innerWidth - ORB_SIZE);
    this.y = this.clamp(this.y, 0, window.innerHeight - ORB_SIZE);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private loadPosition(): void {
    const margin = 16;
    const fallbackX = window.innerWidth - ORB_SIZE - margin;
    const fallbackY = window.innerHeight - ORB_SIZE - margin;

    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        this.x = this.clamp(p.x, 0, window.innerWidth - ORB_SIZE);
        this.y = this.clamp(p.y, 0, window.innerHeight - ORB_SIZE);
        return;
      }
    } catch {
      // Posición corrupta: se usa el fallback.
    }

    this.x = fallbackX;
    this.y = fallbackY;
  }

  private savePosition(): void {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ x: this.x, y: this.y }));
    } catch {
      // Almacenamiento no disponible: se ignora.
    }
  }
}
