import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AsistenteLevaRepository, MensajeLeva } from './ports/asistente-leva.repository';
import { AsistenteLevaLocalStorageAdapter } from './adapters/asistente-leva-localstorage.adapter';
import { AsistenteLevaHttpAdapter } from './adapters/asistente-leva-http.adapter';
import { RoleStateService } from '../../core/services/role-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-asistente-leva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: AsistenteLevaRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.asistenteLevaBackend
          ? new AsistenteLevaHttpAdapter(http)
          : new AsistenteLevaLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './asistente-leva.component.html',
  styleUrl: './asistente-leva.component.scss'
})
export class AsistenteLevaComponent implements OnInit {
  mensajes: MensajeLeva[] = [];
  inputMensaje = '';

  readonly clinicalTools = [
    { label: 'Analizar Tentativa de Solución', prompt: 'Analiza los intentos de solución redundantes del caso y cómo desarticularlos según TBE.' },
    { label: 'Prescripción de la Peor Fantasía', prompt: 'Redacta la prescripción de la media hora de lo peor para este paciente fóbico.' },
    { label: 'Declaración del Secreto', prompt: 'Genera la estratagema para desarticular la complicidad familiar fóbica.' },
    { label: 'Reestructuración Analógica', prompt: 'Sugerir aforismos o metáforas estratégicas para romper el marco cognitivo del paciente.' }
  ];

  constructor(
    private readonly levaRepo: AsistenteLevaRepository,
    public readonly roleService: RoleStateService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.levaRepo.obtenerHistorial().subscribe((data) => {
      this.mensajes = data;
    });
  }

  usarHerramienta(prompt: string): void {
    this.inputMensaje = prompt;
    this.enviar();
  }

  enviar(): void {
    if (!this.inputMensaje.trim()) return;
    const txt = this.inputMensaje;
    this.inputMensaje = '';

    this.levaRepo.enviarConsulta(txt).subscribe(() => {
      this.cargarHistorial();
    });
  }
}
