import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleStateService } from '../../services/role-state.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'leva';
  text: string;
  stratagem?: string;
  prescription?: string;
  time: string;
}

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

  messages: ChatMessage[] = [
    {
      id: '1',
      sender: 'leva',
      text: 'Hola. Soy LEVA, tu copiloto clínico en Terapia Breve Estratégica. Puedo ayudarte a formular el caso, sugerir estratagemas o redactar prescripciones paradójicas.',
      time: '09:00'
    }
  ];

  readonly quickPrompts = [
    'Sugerir Estratagema para Fobia',
    'Detectar Tentativa de Solución',
    'Prescripción de la Peor Fantasía'
  ];

  constructor(public readonly roleService: RoleStateService) {}

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
    if (!this.inputText.trim()) return;
    const txt = this.inputText;
    this.inputText = '';

    this.messages.push({
      id: Date.now().toString(),
      sender: 'user',
      text: txt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setTimeout(() => {
      let reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'leva',
        text: 'Evaluando dinámica perceptivo-reactiva del caso según el modelo Giorgio Nardone.',
        stratagem: 'Declaración del secreto con prescripción de la media hora de lo peor.',
        prescription: 'Escribir cada mañana de 7:00 a 7:30 am los peores miedos, luego quemar la hoja y no hablar de ellos durante el día.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.messages.push(reply);
    }, 600);
  }
}
