import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleStateService } from '../../services/role-state.service';
import { AsistenteLevaHttpAdapter } from '../../../modules/asistente-leva/adapters/asistente-leva-http.adapter';
import { MensajeLeva } from '../../../modules/asistente-leva/ports/asistente-leva.repository';

@Component({
  selector: 'app-leva-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leva-drawer.component.html',
  styleUrl: './leva-drawer.component.scss'
})
export class LevaDrawerComponent implements OnInit {
  isOpen = false;
  inputText = '';
  isWaiting = false;

  messages: MensajeLeva[] = [
    {
      id: '1',
      remitente: 'LEVA',
      contenido: 'Hola. Soy LEVA, tu copiloto clínico en Terapia Breve Estratégica. Puedo formular hipótesis de SPR, sugerir estratagemas o prescripciones paradójicas en tiempo real.',
      timestamp: new Date().toISOString()
    }
  ];

  readonly quickPrompts = [
    'Sugerir Estratagema para Pánico',
    'Detectar Tentativa de Solución',
    'Prescripción de la Peor Fantasía'
  ];

  constructor(
    public readonly roleService: RoleStateService,
    private readonly levaHttp: AsistenteLevaHttpAdapter
  ) {}

  ngOnInit(): void {
    this.roleService.isLevaOpen$.subscribe((open) => {
      this.isOpen = open;
    });
  }

  close(): void {
    this.roleService.setLevaOpen(false);
  }

  usePrompt(prompt: string): void {
    this.inputText = prompt;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.inputText.trim() || this.isWaiting) return;
    const txt = this.inputText.trim();
    this.inputText = '';
    this.isWaiting = true;

    // Agregar mensaje del terapeuta
    this.messages.push({
      id: `usr-${Date.now()}`,
      remitente: 'TERAPEUTA',
      contenido: txt,
      timestamp: new Date().toISOString()
    });

    // Mensaje reactivo para streaming de LEVA
    const replyMsg: MensajeLeva = {
      id: `leva-${Date.now()}`,
      remitente: 'LEVA',
      contenido: '',
      cargando: true,
      timestamp: new Date().toISOString()
    };
    this.messages.push(replyMsg);

    this.levaHttp.consultarStream(txt).subscribe({
      next: (event) => {
        replyMsg.cargando = false;
        if (event.token) {
          replyMsg.contenido += event.token;
        }
      },
      error: () => {
        // Fallback a HTTP estándar si falla EventSource
        this.levaHttp.enviarConsulta(txt).subscribe({
          next: (res) => {
            replyMsg.cargando = false;
            replyMsg.contenido = res.contenido;
            replyMsg.sugerenciaEstratagema = res.sugerenciaEstratagema;
            replyMsg.fuentesCitadas = res.fuentesCitadas;
            this.isWaiting = false;
          },
          error: () => {
            replyMsg.cargando = false;
            replyMsg.contenido = 'No fue posible conectar con LEVA. Verifica el estado del servidor Spring Boot.';
            this.isWaiting = false;
          }
        });
      },
      complete: () => {
        replyMsg.cargando = false;
        this.isWaiting = false;
      }
    });
  }
}
