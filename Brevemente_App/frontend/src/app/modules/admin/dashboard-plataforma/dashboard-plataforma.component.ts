import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressRingComponent } from '../../dashboard/components/progress-ring/progress-ring.component';
import { DashboardPlataformaRepository } from './ports/dashboard-plataforma.repository';
import { DashboardPlataformaHttpAdapter } from './adapters/dashboard-plataforma-http.adapter';

type IndicadorClave = 'efectividad_tbe' | 'indice_fidelidad' | 'tasa_desercion';

interface KpiPlataforma {
  clave: 'terapeutas_activos' | 'pacientes_activos';
  etiqueta: string;
  valor: string;
  pie: string;
}

interface IndicadorClinico {
  clave: IndicadorClave;
  etiqueta: string;
  valor: number;
  unidad: string;
}

interface DesgloseIndicador {
  terapeutaId: string;
  terapeutaNombre: string;
  valor: number;
  casos: number;
}

interface AccesoReciente {
  usuario: string;
  fecha: string;
}

interface UsuarioReciente {
  nombre: string;
  detalle: string;
  fecha: string;
}

interface Terapeuta {
  id: string;
  nombre: string;
  especialidad: string;
  estado: 'activo' | 'inactivo';
}

interface AlertaAdministrativa {
  id: string;
  tipo: 'suscripcion' | 'otro';
  titulo: string;
  descripcion: string;
  severidad: 'alta' | 'media' | 'baja' | 'ok';
  fecha: string;
}

interface SaludModulo {
  nombre: string;
  estado: 'ok' | 'degradado' | 'caido';
}

interface FeatureFlag {
  clave: string;
  activo: boolean;
}

/**
 * Dashboard de Plataforma (Módulo 1 — vista previa frontend).
 * Datos mock; se conectará al backend cuando exista.
 */
@Component({
  selector: 'app-dashboard-plataforma',
  standalone: true,
  imports: [CommonModule, ProgressRingComponent],
  providers: [{ provide: DashboardPlataformaRepository, useClass: DashboardPlataformaHttpAdapter }],
  templateUrl: './dashboard-plataforma.component.html',
  styleUrl: './dashboard-plataforma.component.scss'
})
export class DashboardPlataformaComponent implements OnInit {
  private readonly repo = inject(DashboardPlataformaRepository);
  kpis: KpiPlataforma[] = [
    { clave: 'terapeutas_activos', etiqueta: 'Terapeutas activos', valor: '12', pie: 'de 12 contratados' },
    { clave: 'pacientes_activos', etiqueta: 'Pacientes activos', valor: '84', pie: 'en toda la plataforma' }
  ];

  indicadores: IndicadorClinico[] = [
    { clave: 'efectividad_tbe', etiqueta: 'Efectividad TBE', valor: 72, unidad: '%' },
    { clave: 'indice_fidelidad', etiqueta: 'Índice de fidelidad', valor: 8.4, unidad: '/10' },
    { clave: 'tasa_desercion', etiqueta: 'Tasa de deserción', valor: 4, unidad: '%' }
  ];

  accesos: AccesoReciente[] = [
    { usuario: 'Dra. Sofía Ramírez', fecha: 'hoy · 09:12' },
    { usuario: 'Mtro. Alejandro Mendoza', fecha: 'hoy · 08:55' },
    { usuario: 'Ing. Rodrigo Pérez', fecha: 'ayer · 18:40' }
  ];

  usuariosRecientes: UsuarioReciente[] = [
    { nombre: 'Lic. Carmen Ortega', detalle: 'Asistente clínica', fecha: 'hoy' },
    { nombre: 'Dr. Luis Herrera', detalle: 'Terapeuta · nuevo ingreso', fecha: 'ayer' },
    { nombre: 'Dra. Isabel Cárdenas', detalle: 'Supervisora clínica', fecha: 'hace 2 días' }
  ];

  terapeutas: Terapeuta[] = [
    { id: 'ter-001', nombre: 'Dra. Sofía Ramírez Lozano', especialidad: 'Psiquiatría', estado: 'activo' },
    { id: 'ter-002', nombre: 'Mtro. Alejandro Mendoza Garza', especialidad: 'Psicología clínica', estado: 'activo' },
    { id: 'ter-003', nombre: 'Dra. Isabel Cárdenas', especialidad: 'Supervisión clínica', estado: 'activo' },
    { id: 'ter-004', nombre: 'Dr. Luis Herrera', especialidad: 'Psicología clínica', estado: 'activo' },
    { id: 'ter-005', nombre: 'Dra. Mariana Ríos', especialidad: 'Psiquiatría infantil', estado: 'activo' },
    { id: 'ter-006', nombre: 'Mtro. Diego Fuentes', especialidad: 'Psicología clínica', estado: 'activo' },
    { id: 'ter-007', nombre: 'Dra. Valeria Salas', especialidad: 'Psicoterapia', estado: 'activo' },
    { id: 'ter-008', nombre: 'Mtro. Ricardo Téllez', especialidad: 'Neuropsicología', estado: 'activo' },
    { id: 'ter-009', nombre: 'Dra. Andrea Molina', especialidad: 'Psicología clínica', estado: 'activo' },
    { id: 'ter-010', nombre: 'Mtro. Jorge Cantú', especialidad: 'Psicoterapia', estado: 'activo' },
    { id: 'ter-011', nombre: 'Dra. Renata Ibarra', especialidad: 'Psiquiatría', estado: 'activo' },
    { id: 'ter-012', nombre: 'Mtro. Emiliano Roldán', especialidad: 'Psicología clínica', estado: 'activo' }
  ];

  alertas: AlertaAdministrativa[] = [
    { id: 'al-1', tipo: 'suscripcion', titulo: 'Mtro. Alejandro Mendoza — suscripción vencida', descripcion: 'No ha cubierto la cuota mensual de la plataforma.', severidad: 'alta', fecha: 'hoy' },
    { id: 'al-2', tipo: 'suscripcion', titulo: 'Dra. Sofía Ramírez — pago recibido', descripcion: 'Suscripción pagada correctamente.', severidad: 'ok', fecha: 'hoy' }
  ];

  modulos: SaludModulo[] = [
    { nombre: 'Agenda', estado: 'ok' },
    { nombre: 'Expedientes', estado: 'ok' },
    { nombre: 'Pagos', estado: 'ok' },
    { nombre: 'LEVA', estado: 'degradado' },
    { nombre: 'Campus', estado: 'caido' },
    { nombre: 'Auditoría', estado: 'ok' }
  ];

  featureFlags: FeatureFlag[] = [
    { clave: 'dashboardBackend', activo: true },
    { clave: 'agendaBackend', activo: true },
    { clave: 'asistenteLevaBackend', activo: false }
  ];

  indicadorSeleccionado: IndicadorClinico | null = null;
  desgloseActual: DesgloseIndicador[] = [];
  terapeutasAbierto = false;
  private triggerElement: HTMLElement | null = null;

  pctDe(ind: IndicadorClinico): number {
    return ind.unidad === '/10' ? ind.valor * 10 : ind.valor;
  }

  ngOnInit(): void {
    this.repo.obtenerResumen().subscribe({
      next: (r) => {
        this.kpis = [
          { clave: 'terapeutas_activos', etiqueta: 'Terapeutas activos', valor: String(r.kpis.terapeutasActivos), pie: 'activos' },
          { clave: 'pacientes_activos', etiqueta: 'Pacientes activos', valor: String(r.kpis.pacientesActivos), pie: 'activos en la plataforma' }
        ];
      },
      error: () => {}
    });
    this.repo.obtenerIndicadores().subscribe({
      next: (list) => {
        this.indicadores = list.map((i) => ({
          clave: i.clave as IndicadorClave,
          etiqueta: i.etiqueta,
          valor: Number(i.valor),
          unidad: i.unidad
        }));
      },
      error: () => {}
    });
    this.repo.obtenerActividad(10).subscribe({
      next: (a) => {
        this.accesos = a.accesos.map((x) => ({ usuario: x.usuario, fecha: this.formatearFecha(x.fecha) }));
        this.usuariosRecientes = a.usuarios.map((x) => ({
          nombre: x.nombre,
          detalle: this.rolLabel(x.rol),
          fecha: this.formatearFecha(x.creadoEn)
        }));
      },
      error: () => {}
    });
    this.repo.obtenerAlertas().subscribe({
      next: (a) => {
        this.alertas = a.alertas.map((x) => ({
          id: x.id,
          tipo: x.tipo as 'suscripcion' | 'otro',
          titulo: x.titulo,
          descripcion: x.descripcion,
          severidad: x.severidad as 'alta' | 'media' | 'baja' | 'ok',
          fecha: this.formatearFecha(x.fecha)
        }));
      },
      error: () => {}
    });
    this.repo.obtenerSalud().subscribe({
      next: (s) => {
        this.modulos = s.modulos.map((m) => ({ nombre: m.nombre, estado: m.estado as 'ok' | 'degradado' | 'caido' }));
        this.featureFlags = s.featureFlags.map((f) => ({ clave: f.clave, activo: f.activo }));
      },
      error: () => {}
    });
  }

  abrirDesglose(ind: IndicadorClinico): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.indicadorSeleccionado = ind;
    this.desgloseActual = [];
    this.repo.obtenerDesglose(ind.clave).subscribe({
      next: (list) => {
        this.desgloseActual = list.map((d) => ({
          terapeutaId: d.terapeutaId,
          terapeutaNombre: d.terapeutaNombre,
          valor: Number(d.valor),
          casos: d.casos
        }));
      },
      error: () => {
        this.desgloseActual = this.desgloseMock(ind.clave);
      }
    });
  }

  private desgloseMock(clave: IndicadorClave): DesgloseIndicador[] {
    const valores: Record<IndicadorClave, number[]> = {
      efectividad_tbe: [78, 65, 71],
      indice_fidelidad: [8.6, 8.1, 8.4],
      tasa_desercion: [3, 6, 5]
    };
    const nombres = ['Dra. Sofía Ramírez Lozano', 'Mtro. Alejandro Mendoza Garza', 'Dra. Isabel Cárdenas'];
    const ids = ['ter-001', 'ter-002', 'ter-003'];
    const casos = [24, 18, 12];
    return nombres.map((nombre, i) => ({
      terapeutaId: ids[i],
      terapeutaNombre: nombre,
      valor: valores[clave][i],
      casos: casos[i]
    }));
  }

  private formatearFecha(iso: string): string {
    if (!iso) { return ''; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) { return 'ahora'; }
    if (diffMin < 60) { return `hace ${diffMin} min`; }
    const horas = Math.floor(diffMin / 60);
    if (horas < 24) { return `hoy · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
    const dias = Math.floor(horas / 24);
    if (dias === 1) { return 'ayer'; }
    if (dias < 7) { return `hace ${dias} días`; }
    return d.toLocaleDateString('es-MX');
  }

  private rolLabel(rol: string): string {
    const labels: Record<string, string> = {
      admin_platform: 'Admin Plataforma',
      admin_clinical: 'Admin Clínico',
      supervisor: 'Supervisor',
      therapist: 'Terapeuta',
      assistant: 'Asistente',
      patient: 'Paciente',
      student: 'Estudiante'
    };
    return labels[rol] ?? rol;
  }

  cerrarDesglose(): void {
    this.indicadorSeleccionado = null;
    this.desgloseActual = [];
    this.devolverFoco();
  }

  abrirTerapeutas(): void {
    this.triggerElement = document.activeElement as HTMLElement;
    this.terapeutasAbierto = true;
  }

  cerrarTerapeutas(): void {
    this.terapeutasAbierto = false;
    this.devolverFoco();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.indicadorSeleccionado) {
      this.cerrarDesglose();
    } else if (this.terapeutasAbierto) {
      this.cerrarTerapeutas();
    }
  }

  private devolverFoco(): void {
    if (this.triggerElement) {
      this.triggerElement.focus();
      this.triggerElement = null;
    }
  }
}
