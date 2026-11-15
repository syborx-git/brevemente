/**
 * Semáforo de Valoración del Cambio (VC) — SDD-EXP-F4 / issue #105.
 * Vocabulario tipado de 5 estados + mapeo legado de los strings históricos.
 */
export type VcEstado =
  | 'marcador_inicial_sin_mejoria'
  | 'mejoria_leve'
  | 'mejoria_significativa'
  | 'recaida'
  | 'nuevo_patron';

export interface VcEstadoMeta {
  etiqueta: string;
  color: string;
  orden: number;
}

export const VC_ESCALA: Record<VcEstado, VcEstadoMeta> = {
  marcador_inicial_sin_mejoria: { etiqueta: 'Marcador inicial / Sin mejoría', color: '#64748b', orden: 1 },
  mejoria_leve: { etiqueta: 'Mejoría leve', color: '#f59e0b', orden: 2 },
  mejoria_significativa: { etiqueta: 'Mejoría significativa', color: '#10b981', orden: 3 },
  recaida: { etiqueta: 'Recaída', color: '#ef4444', orden: 4 },
  nuevo_patron: { etiqueta: 'Nuevo patrón', color: '#6366f1', orden: 5 },
};

/** Mapeo de strings legados (VcEntry histórico) → estado tipado. */
export const VC_LEGADO: Record<string, VcEstado> = {
  'Marcador de inicio': 'marcador_inicial_sin_mejoria',
  'Sin cambios': 'marcador_inicial_sin_mejoria',
  'Mejoría leve': 'mejoria_leve',
  'Mejoría significativa': 'mejoria_significativa',
  'Recaída': 'recaida',
  'Empeoramiento': 'recaida',
  'Nuevo patrón': 'nuevo_patron',
};

/** Mapeo inverso: estado tipado → string legado para persistir en VcEntry. */
export const VC_ESTADO_A_TEXTO: Record<VcEstado, string> = {
  marcador_inicial_sin_mejoria: 'Marcador de inicio',
  mejoria_leve: 'Mejoría leve',
  mejoria_significativa: 'Mejoría significativa',
  recaida: 'Empeoramiento',
  nuevo_patron: 'Nuevo patrón',
};

export function vcEstadoDeTexto(texto: string | null | undefined): VcEstado | null {
  if (!texto) return null;
  return VC_LEGADO[texto] ?? null;
}
