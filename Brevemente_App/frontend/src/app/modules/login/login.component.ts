import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginRepository, LoginCredentials } from './ports/login.repository';
import { LoginHttpAdapter } from './adapters/login-http.adapter';
import { RoleStateService } from '../../core/services/role-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    { provide: LoginRepository, useClass: LoginHttpAdapter }
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly loginRepo: LoginRepository,
    private readonly roleState: RoleStateService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginCredentials = {
      email: this.email.trim(),
      password: this.password
    };

    this.loginRepo.autenticar(credentials).subscribe((session) => {
      this.isLoading = false;
      if (session) {
        this.roleState.setUser(session.user);
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      }
    });
  }
}
