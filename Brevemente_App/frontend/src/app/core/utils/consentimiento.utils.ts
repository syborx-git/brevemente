/**
 * Utilidades de presentación para la capacidad de consentimiento informado.
 *
 * Los estados se persisten en BD como constantes en mayúsculas y guiones bajos
 * (p. ej. `REPRESENTADO_POR_EDAD`). Este módulo centraliza la traducción a
 * etiquetas legibles en español para la UI, evitando mostrar valores crudos.
 */

const ETIQUETAS_CAPACIDAD: Record<string, string> = {
  'AUTONOMO': 'Autónomo',
  'REPRESENTADO_POR_EDAD': 'Representado por edad',
  'REPRESENTADO_POR_CONDICION': 'Representado por condición',
  'PENDIENTE_DETERMINACION': 'Pendiente de determinación',
  'PENDIENTE_FIRMA': 'Pendiente de firma',
  'FIRMADO_TITULAR': 'Consentimiento firmado',
  'PENDIENTE_RECONSENTIMIENTO': 'Pendiente de reconsentimiento'
};

export function formatEstadoConsentimientoLabel(estado?: string | null): string {
  if (!estado) return '—';
  return ETIQUETAS_CAPACIDAD[estado] ?? estado.toLowerCase().replaceAll('_', ' ');
}
