import { Observable } from 'rxjs';
import { SupervisionLog } from '../../../core/types/clinical.types';

export abstract class SupervisionRepository {
  abstract listarLogs(): Observable<SupervisionLog[]>;
  abstract agregarLog(log: Omit<SupervisionLog, 'id'>): Observable<SupervisionLog>;
}
