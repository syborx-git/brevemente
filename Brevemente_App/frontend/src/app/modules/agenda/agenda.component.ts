import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AgendaRepository } from './ports/agenda.repository';
import { AgendaLocalStorageAdapter } from './adapters/agenda-localstorage.adapter';
import { AgendaHttpAdapter } from './adapters/agenda-http.adapter';
import { Appointment, Patient, DiaNoLaborable } from '../../core/types/clinical.types';
import { environment } from '../../../environments/environment';

type ViewLevel = 'dia' | 'semana' | 'mes' | 'anio';

const HOURS: string[] = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const STATUS_LABEL: Record<string, string> = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  completada: 'Completada',
  cancelada: 'Cancelada',
  ausente: 'No asistió',
  no_presentado: 'No se presentó',
  solicita_reagendar: 'Solicita reagendar'
};

const STATUS_COLOR: Record<string, string> = {
  confirmada: 'bg-emerald-100 text-emerald-800',
  pendiente: 'bg-amber-100 text-amber-800',
  completada: 'bg-teal-100 text-teal-800',
  cancelada: 'bg-slate-100 text-slate-600',
  ausente: 'bg-red-100 text-red-800',
  no_presentado: 'bg-red-100 text-red-800',
  solicita_reagendar: 'bg-amber-100 text-amber-800'
};

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [
    {
      provide: AgendaRepository,
      useFactory: (http: HttpClient) => {
        return environment.features.agendaBackend
          ? new AgendaHttpAdapter(http)
          : new AgendaLocalStorageAdapter();
      },
      deps: [HttpClient]
    }
  ],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss'
})
export class AgendaComponent implements OnInit {
  citas: Appointment[] = [];
  pacientes: Patient[] = [];
  diasNoLaborables: DiaNoLaborable[] = [];

  viewLevel: ViewLevel = 'semana';
  anchorDate = '2026-10-07';
  blockHolidays = true;

  showNewModal = false;
  selectedApp: Appointment | null = null;

  showCancelConfirm = false;
  citaACancelar: Appointment | null = null;
  notificarPorWhatsApp = true;

  selectedPatientId = '';
  newDate = '2026-10-07';
  newTime = '10:00';
  newType: 'primera' | 'seguimiento' | 'cierre' = 'seguimiento';
  newDuration: 30 | 45 | 60 = 30;
  newModalidad: 'PRESENCIAL' | 'ONLINE' = 'PRESENCIAL';
  newConsultorio: 'A' | 'B' = 'A';

  readonly hours = HOURS;

  constructor(private readonly agendaRepo: AgendaRepository) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.agendaRepo.listarCitas().subscribe(c => this.citas = c);
    this.agendaRepo.obtenerPacientes().subscribe(p => {
      this.pacientes = p;
      if (p.length > 0 && !this.selectedPatientId) {
        this.selectedPatientId = p[0].id;
      }
    });
    this.agendaRepo.listarDiasNoLaborables().subscribe(d => this.diasNoLaborables = d);
  }

  // ── Helpers de fecha ──
  private parse(date: string): Date {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private addDays(date: string, n: number): string {
    const d = this.parse(date); d.setDate(d.getDate() + n); return this.fmt(d);
  }
  private addMonths(date: string, n: number): string {
    const d = this.parse(date); d.setMonth(d.getMonth() + n); return this.fmt(d);
  }
  private addYears(date: string, n: number): string {
    const d = this.parse(date); d.setFullYear(d.getFullYear() + n); return this.fmt(d);
  }
  private startOfWeek(date: string): string {
    const d = this.parse(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return this.fmt(d);
  }
  private dayIndex(date: string): number {
    return (this.parse(date).getDay() + 6) % 7;
  }
  dayName(date: string): string {
    return DAY_FULL[this.dayIndex(date)];
  }

  get year(): number { return this.parse(this.anchorDate).getFullYear(); }
  get month(): number { return this.parse(this.anchorDate).getMonth() + 1; }
  get monthLabel(): string { return `${MONTHS[this.month - 1]} ${this.year}`; }
  get leadingBlanks(): number {
    return (this.parse(`${this.year}-${String(this.month).padStart(2, '0')}-01`).getDay() + 6) % 7;
  }
  get monthDayCount(): number { return new Date(this.year, this.month, 0).getDate(); }
  get leadingBlanksArray(): number[] { return Array.from({ length: this.leadingBlanks }, (_, i) => i); }
  get monthDaysArray(): number[] { return Array.from({ length: this.monthDayCount }, (_, i) => i + 1); }
  get monthsArray(): number[] { return Array.from({ length: 12 }, (_, i) => i + 1); }

  monthDate(dayNum: number): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  }
  monthKey(m: number): string {
    return `${this.year}-${String(m).padStart(2, '0')}`;
  }
  monthName(m: number): string {
    return MONTHS[m - 1];
  }

  get weekDays(): { name: string; date: string }[] {
    const start = this.startOfWeek(this.anchorDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = this.addDays(start, i);
      return { name: DAY_SHORT[this.dayIndex(d)], date: d };
    });
  }

  get periodLabel(): string {
    if (this.viewLevel === 'anio') return `Año ${this.year}`;
    if (this.viewLevel === 'mes') return this.monthLabel;
    if (this.viewLevel === 'dia') return `${this.dayName(this.anchorDate)}, ${this.anchorDate}`;
    const w = this.weekDays;
    return `Semana del ${w[0].date.slice(8, 10)} al ${w[6].date.slice(8, 10)} de ${this.monthLabel}`;
  }

  // ── Navegación ──
  goPrev(): void {
    if (this.viewLevel === 'dia') this.anchorDate = this.addDays(this.anchorDate, -1);
    else if (this.viewLevel === 'semana') this.anchorDate = this.addDays(this.anchorDate, -7);
    else if (this.viewLevel === 'mes') this.anchorDate = this.addMonths(this.anchorDate, -1);
    else if (this.viewLevel === 'anio') this.anchorDate = this.addYears(this.anchorDate, -1);
  }
  goNext(): void {
    if (this.viewLevel === 'dia') this.anchorDate = this.addDays(this.anchorDate, 1);
    else if (this.viewLevel === 'semana') this.anchorDate = this.addDays(this.anchorDate, 7);
    else if (this.viewLevel === 'mes') this.anchorDate = this.addMonths(this.anchorDate, 1);
    else if (this.viewLevel === 'anio') this.anchorDate = this.addYears(this.anchorDate, 1);
  }
  goToday(): void {
    this.anchorDate = new Date().toISOString().split('T')[0];
    this.viewLevel = 'dia';
  }
  setView(level: ViewLevel): void { this.viewLevel = level; }
  zoomIn(date: string, level: ViewLevel): void { this.anchorDate = date; this.viewLevel = level; }

  // ── Festivos / días personales ──
  getHoliday(date: string): DiaNoLaborable | undefined {
    return this.diasNoLaborables.find(h => h.fecha === date);
  }
  isBlockedDate(date: string): boolean {
    const h = this.getHoliday(date);
    if (!h) return false;
    if (h.tipo === 'personal') return true;
    return this.blockHolidays;
  }

  // ── Citas por fecha/hora ──
  citasDeFecha(date: string): Appointment[] {
    return this.citas.filter(c => c.date === date);
  }
  citasDeHora(date: string, hour: string): Appointment[] {
    return this.citas.filter(c => c.date === date && c.time.slice(0, 2) === hour.slice(0, 2));
  }
  countCitasMes(mesKey: string): number {
    return this.citas.filter(c => c.date.startsWith(mesKey)).length;
  }

  // ── Pacientes / bloqueo normativo ──
  get selectedPatient(): Patient | undefined {
    return this.pacientes.find(p => p.id === this.selectedPatientId);
  }
  patientById(id: string): Patient | undefined {
    return this.pacientes.find(p => p.id === id);
  }
  isPatientBlocked(patientId: string): boolean {
    const p = this.patientById(patientId);
    if (!p) return false;
    return p.capacidadConsentimiento.estado === 'REPRESENTADO_POR_EDAD' && !p.consentimientoRepresentanteFirmado;
  }

  /** Solo se puede confirmar una cita pendiente o que solicita reagendar. */
  puedeConfirmar(app: Appointment): boolean {
    return !this.isPatientBlocked(app.patientId)
      && (app.status === 'pendiente' || app.status === 'solicita_reagendar');
  }

  /** Solo se puede cancelar una cita confirmada, pendiente o que solicita reagendar. */
  puedeCancelar(app: Appointment): boolean {
    return app.status === 'confirmada'
      || app.status === 'pendiente'
      || app.status === 'solicita_reagendar';
  }

  // ── UI ──
  statusLabel(status: string): string { return STATUS_LABEL[status] ?? status; }
  statusColor(status: string): string { return STATUS_COLOR[status] ?? 'bg-slate-100 text-slate-600'; }
  freqClass(patientId: string): string {
    const f = this.patientById(patientId)?.sessionFrequency;
    if (f === 'semanal') return 'border-l-4 border-l-green-500 border border-green-200 bg-green-50/50';
    if (f === 'quincenal') return 'border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50/50';
    if (f === 'mensual') return 'border-l-4 border-l-blue-600 border border-blue-200 bg-blue-50/40';
    return 'border-l-4 border-l-[#75AFBC] border border-slate-200';
  }

  openNewModal(): void { this.showNewModal = true; }
  closeNewModal(): void { this.showNewModal = false; }
  selectApp(app: Appointment): void { this.selectedApp = app; }
  closeDrawer(): void { this.selectedApp = null; }

  abrirConfirmacionCancelar(app: Appointment): void {
    this.citaACancelar = app;
    this.notificarPorWhatsApp = true;
    this.showCancelConfirm = true;
  }

  cerrarConfirmacionCancelar(): void {
    this.showCancelConfirm = false;
    this.citaACancelar = null;
  }

  confirmarCancelacion(): void {
    const cita = this.citaACancelar;
    if (!cita) return;
    const notificar = this.notificarPorWhatsApp;
    this.showCancelConfirm = false;
    this.citaACancelar = null;

    // Nivel A (SDD): el contacto se abre vía wa.me de forma síncrona dentro del
    // gesto del usuario (evita bloqueo de popups); la persistencia es async.
    if (notificar) {
      this.abrirWhatsAppCancelacion(cita);
    }

    this.agendaRepo.actualizarEstadoCita(cita.id, 'cancelada').subscribe(() => {
      this.cargarDatos();
      if (this.selectedApp && this.selectedApp.id === cita.id) {
        this.selectedApp = { ...this.selectedApp, status: 'cancelada' };
      }
    });
  }

  abrirWhatsAppCancelacion(app: Appointment): void {
    const p = this.patientById(app.patientId);
    const phoneDigits = (p?.phone || '').replace(/\D/g, '');
    if (!phoneDigits) return;
    const mensaje = `Hola ${app.patientName}, te contactamos de BreveMente. Lamentamos informarte que tu cita del ${app.date} a las ${app.time} ha sido cancelada. Te contactaremos para reagendarla.`;
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  guardarCita(): void {
    const p = this.selectedPatient;
    if (!p) return;

    const nueva: Omit<Appointment, 'id'> = {
      patientId: p.id,
      patientName: p.name,
      time: this.newTime,
      date: this.newDate,
      type: this.newType,
      status: this.isPatientBlocked(p.id) ? 'pendiente' : 'confirmada',
      paymentStatus: 'pendiente',
      duration: this.newDuration,
      modality: this.newModalidad,
      office: this.newModalidad === 'ONLINE' ? undefined : this.newConsultorio
    };

    this.agendaRepo.agendarCita(nueva).subscribe(() => {
      this.cargarDatos();
      this.closeNewModal();
    });
  }

  cambiarEstado(cita: Appointment, nuevoEstado: Appointment['status']): void {
    this.agendaRepo.actualizarEstadoCita(cita.id, nuevoEstado).subscribe(() => {
      this.cargarDatos();
      if (this.selectedApp && this.selectedApp.id === cita.id) {
        this.selectedApp = { ...this.selectedApp, status: nuevoEstado };
      }
    });
  }
}
