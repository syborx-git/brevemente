import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConsultaConfig, MiConsultaRepository } from './ports/mi-consulta.repository';
import { MiConsultaLocalStorageAdapter } from './adapters/mi-consulta-localstorage.adapter';
import { MiConsultaHttpAdapter } from './adapters/mi-consulta-http.adapter';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mi-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: MiConsultaRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.miConsultaBackend
          ? new MiConsultaHttpAdapter(http)
          : new MiConsultaLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './mi-consulta.component.html',
  styleUrl: './mi-consulta.component.scss'
})
export class MiConsultaComponent implements OnInit {
  config: ConsultaConfig = {
    therapistName: '',
    license: '',
    specialty: '',
    email: '',
    phone: '',
    defaultSessionDuration: 50,
    costoPrimeraSesion: 1200,
    costoSeguimiento: 1000,
    edadMinimaAtencion: 12
  };

  savedNotification = false;

  constructor(private readonly consultaRepo: MiConsultaRepository) {}

  ngOnInit(): void {
    this.consultaRepo.obtenerConfig().subscribe(c => this.config = { ...c });
  }

  guardar(): void {
    this.consultaRepo.guardarConfig(this.config).subscribe(() => {
      this.savedNotification = true;
      setTimeout(() => this.savedNotification = false, 3000);
    });
  }
}
