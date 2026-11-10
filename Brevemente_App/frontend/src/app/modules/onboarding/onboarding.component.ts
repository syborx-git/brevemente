import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginRepository } from '../login/ports/login.repository';
import { LoginHttpAdapter } from '../login/adapters/login-http.adapter';
import { RoleStateService } from '../../core/services/role-state.service';

/**
 * Onboarding obligatorio: reemplazo de la contraseña temporal en el primer
 * inicio de sesión (ADR-005 / D12). Solo accesible cuando la sesión tiene el
 * flag `debeCambiarPassword` (enforced por credentialPendingGuard y el filtro
 * CredencialPendienteFilter del backend).
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{ provide: LoginRepository, useClass: LoginHttpAdapter }],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent implements OnInit {
  private readonly loginRepo = inject(LoginRepository);
  private readonly roleState = inject(RoleStateService);
  private readonly router = inject(Router);

  passwordActual = '';
  nuevaPassword = '';
  confirmarPassword = '';
  errorMessage = '';
  isLoading = false;

  ngOnInit(): void {
    // Pre-rellena la contraseña temporal con la usada en el login (via router state).
    // Fallback a history.state para navegaciones de componente lazy.
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state ?? history.state) as { passwordActual?: string } | undefined;
    this.passwordActual = state?.passwordActual ?? '';
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.passwordActual) {
      this.errorMessage = 'Escribe tu contraseña temporal actual.';
      return;
    }
    if (this.nuevaPassword.length < 8) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.nuevaPassword === this.passwordActual) {
      this.errorMessage = 'La nueva contraseña no puede ser igual a la actual.';
      return;
    }

    this.isLoading = true;
    this.loginRepo.cambiarPassword(this.passwordActual, this.nuevaPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.roleState.completarOnboarding();
        this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        this.isLoading = false;
        if (err instanceof HttpErrorResponse) {
          if (err.status === 409) {
            this.errorMessage = 'La contraseña actual no es correcta.';
            return;
          }
          if (err.status === 400) {
            this.errorMessage = (err.error as { detail?: string })?.detail ?? 'La nueva contraseña no cumple la política.';
            return;
          }
        }
        this.errorMessage = 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';
      }
    });
  }

  cerrarSesion(): void {
    this.loginRepo.cerrarSesion().subscribe(() => {
      this.roleState.logout();
      this.router.navigate(['/login']);
    });
  }
}
