import { CategoriaPsicofarmaco, CodigoCategoriaPsicofarmaco, OpcionConductual } from '../types/clinical';

/**
 * Catálogos clínicos estáticos de la demo (equivalentes a los endpoints
 * del fullstack `expedientes/catalogos/*`), sin backend.
 */

export const CATEGORIAS_PSICOFARMACOS: CategoriaPsicofarmaco[] = [
  { codigo: 'bzd', etiqueta: 'Benzodiacepinas (BZD)', orden: 1 },
  { codigo: 'isrs', etiqueta: 'Antidepresivos ISRS', orden: 2 },
  { codigo: 'duales', etiqueta: 'Antidepresivos Duales', orden: 3 },
  { codigo: 'triciclicos_tetraciclicos', etiqueta: 'Antidepresivos Tricíclicos/Tetracíclicos', orden: 4 },
  { codigo: 'neurolepticos_tipicos', etiqueta: 'Neurolépticos Típicos', orden: 5 },
  { codigo: 'neurolepticos_atipicos', etiqueta: 'Neurolépticos Atípicos', orden: 6 },
  { codigo: 'psicoestabilizadores', etiqueta: 'Psicoestabilizadores', orden: 7 },
  { codigo: 'inductores_sueno', etiqueta: 'Inductores del Sueño', orden: 8 },
  { codigo: 'otros', etiqueta: 'Otros', orden: 9 }
];

export const OPCIONES_CONDUCTUALES: OpcionConductual[] = [
  { codigo: 'pedir_suavemente', etiqueta: 'Pedir suavemente', orden: 1 },
  { codigo: 'insinuar', etiqueta: 'Insinuar', orden: 2 },
  { codigo: 'delegar', etiqueta: 'Delegar', orden: 3 },
  { codigo: 'todas', etiqueta: 'Todas', orden: 4 },
  { codigo: 'otro', etiqueta: 'Otro', orden: 5 }
];

/**
 * Agrupación de psicofármacos en 6 grupos clínicos (espejo del fullstack
 * `empGruposPsicofarmacos`), que consolida las 9 categorías del catálogo.
 */
export interface GrupoPsicofarmaco {
  grupo: string;
  categorias: CodigoCategoriaPsicofarmaco[];
}

export const GRUPOS_PSICOFARMACOS: GrupoPsicofarmaco[] = [
  { grupo: 'BZD', categorias: ['bzd'] },
  { grupo: 'Antidepresivos', categorias: ['isrs', 'duales', 'triciclicos_tetraciclicos'] },
  { grupo: 'Neurolépticos', categorias: ['neurolepticos_tipicos', 'neurolepticos_atipicos'] },
  { grupo: 'Psicoestabilizadores', categorias: ['psicoestabilizadores'] },
  { grupo: 'Inductores del sueño', categorias: ['inductores_sueno'] },
  { grupo: 'Otros', categorias: ['otros'] }
];
