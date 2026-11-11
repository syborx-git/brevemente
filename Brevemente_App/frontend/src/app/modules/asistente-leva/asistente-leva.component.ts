import { Component, OnInit, NgZone } from '@angular/core';
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
      useFactory: (http: HttpClient, zone: NgZone) => {
        return environment.features.asistenteLevaBackend
          ? new AsistenteLevaHttpAdapter(http, zone)
          : new AsistenteLevaLocalStorageAdapter();
      },
      deps: [HttpClient, NgZone]
    }
  ],
  templateUrl: './asistente-leva.component.html',
  styleUrl: './asistente-leva.component.scss'
})
export class AsistenteLevaComponent implements OnInit {
  mensajes: MensajeLeva[] = [];
  inputMensaje = '';
  isProcessing = false;
  errorMessage = '';

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
    if (!this.inputMensaje.trim() || this.isProcessing) return;

    const userText = this.inputMensaje.trim();
    this.inputMensaje = '';
    this.errorMessage = '';
    this.isProcessing = true;

    // Agregar mensaje del terapeuta
    const userMsg: MensajeLeva = {
      id: `usr-${Date.now()}`,
      remitente: 'TERAPEUTA',
      contenido: userText,
      timestamp: new Date().toISOString()
    };
    this.mensajes.push(userMsg);

    // Placeholder reactivo para la respuesta de LEVA (SSE Streaming)
    const levaMsg: MensajeLeva = {
      id: `leva-${Date.now()}`,
      remitente: 'LEVA',
      contenido: '',
      cargando: true,
      timestamp: new Date().toISOString()
    };
    this.mensajes.push(levaMsg);

    // Intentar SSE Streaming en tiempo real
    this.levaRepo.consultarStream(userText).subscribe({
      next: (event) => {
        levaMsg.cargando = false;
        if (event.token) {
          levaMsg.contenido += event.token;
        }
      },
      error: () => {
        // Fallback a HTTP estándar en caso de error con EventSource
        this.levaRepo.enviarConsulta(userText).subscribe({
          next: (res) => {
            levaMsg.cargando = false;
            levaMsg.contenido = res.contenido;
            levaMsg.fuentesCitadas = res.fuentesCitadas;
            levaMsg.sugerenciaEstratagema = res.sugerenciaEstratagema;
            this.isProcessing = false;
          },
          error: () => {
            levaMsg.cargando = false;
            levaMsg.contenido = 'No fue posible consultar el corpus cerrado de LEVA en este momento. Verifica la conexión con el servidor.';
            this.errorMessage = 'Error de conexión con el motor LEVA.';
            this.isProcessing = false;
          }
        });
      },
      complete: () => {
        levaMsg.cargando = false;
        this.isProcessing = false;
      }
    });
  }
}
