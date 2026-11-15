import { auditLogService } from './auditLogService';
import { Role, Payment } from '../types/clinical';
import { daysAgoISO, todayISO } from '../utils/dates';

const STORAGE_KEY = 'brevemente_payments';

const initialPayments: Payment[] = [
    {
        id: 'pay-1',
        patientId: 'pac-002',
        patientName: 'Valeria Gómez Fuentes',
        appointmentId: 'cit-004',
        concept: 'Primera sesión',
        amount: 800,
        date: daysAgoISO(86),
        method: 'transferencia',
        status: 'pagado',
        notes: 'Transferencia SPEI',
        registeredBy: 'Marta Gómez',
        createdAt: `${daysAgoISO(86)}T12:00:00.000Z`
    },
    {
        id: 'pay-2',
        patientId: 'pac-002',
        patientName: 'Valeria Gómez Fuentes',
        concept: 'Sesión 2 · Seguimiento',
        amount: 800,
        date: daysAgoISO(79),
        method: 'tarjeta',
        status: 'pagado',
        registeredBy: 'Marta Gómez',
        createdAt: `${daysAgoISO(79)}T12:00:00.000Z`
    },
    {
        id: 'pay-3',
        patientId: 'pac-001',
        patientName: 'Mateo Herrera Santos',
        concept: 'Primera sesión',
        amount: 700,
        date: daysAgoISO(90),
        method: 'efectivo',
        status: 'pendiente',
        notes: 'Pendiente de pago',
        registeredBy: 'Marta Gómez',
        createdAt: `${daysAgoISO(90)}T12:00:00.000Z`
    },
    {
        id: 'pay-4',
        patientId: 'pac-004',
        patientName: 'Roberto Valdés Garza',
        concept: 'Sesión de seguimiento',
        amount: 750,
        date: todayISO(),
        method: 'transferencia',
        status: 'pagado',
        registeredBy: 'Mtro. Alejandro Mendoza Garza',
        createdAt: `${todayISO()}T12:00:00.000Z`
    }
];

type UserLike = { id: string; name: string; role: Role };

export const paymentService = {
    getPayments(): Payment[] {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPayments));
            return initialPayments;
        }
        return JSON.parse(json);
    },

    getByPatientId(patientId: string): Payment[] {
        return this.getPayments()
            .filter(p => p.patientId === patientId)
            .sort((a, b) => (a.date < b.date ? 1 : -1));
    },

    addPayment(data: Omit<Payment, 'id' | 'createdAt' | 'registeredBy'>, user: UserLike): Payment {
        const payments = this.getPayments();
        const newPayment: Payment = {
            ...data,
            registeredBy: user.name,
            id: `pay-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        payments.unshift(newPayment);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
        auditLogService.addLog(
            'Registro de pago',
            `Registró el pago "${newPayment.concept}" por $${newPayment.amount} MXN (${newPayment.status}) para ${newPayment.patientName}.`,
            'pagos',
            user
        );
        window.dispatchEvent(new CustomEvent('brevemente_payment_changed'));
        return newPayment;
    },

    updatePaymentStatus(id: string, status: Payment['status'], user: UserLike): void {
        const payments = this.getPayments();
        const idx = payments.findIndex(p => p.id === id);
        if (idx !== -1) {
            payments[idx].status = status;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
            auditLogService.addLog(
                'Actualización de pago',
                `Cambió el estado del pago "${payments[idx].concept}" a ${status} (${payments[idx].patientName}).`,
                'pagos',
                user
            );
            window.dispatchEvent(new CustomEvent('brevemente_payment_changed'));
        }
    },

    deletePayment(id: string, user: UserLike): void {
        const payments = this.getPayments();
        const target = payments.find(p => p.id === id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payments.filter(p => p.id !== id)));
        if (target) {
            auditLogService.addLog(
                'Eliminación de pago',
                `Eliminó el pago "${target.concept}" de ${target.patientName}.`,
                'pagos',
                user
            );
        }
        window.dispatchEvent(new CustomEvent('brevemente_payment_changed'));
    },

    getSummary(patientId: string): { totalCobrado: number; totalPendiente: number; count: number } {
        const payments = this.getByPatientId(patientId);
        const totalCobrado = payments.filter(p => p.status === 'pagado').reduce((s, p) => s + p.amount, 0);
        const totalPendiente = payments.filter(p => p.status === 'pendiente' || p.status === 'parcial').reduce((s, p) => s + p.amount, 0);
        return { totalCobrado, totalPendiente, count: payments.length };
    }
};