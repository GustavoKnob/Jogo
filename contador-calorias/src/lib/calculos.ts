import type { Atividade, DivisaoMacros, Nutrientes, Perfil, Porcao, Alimento } from './tipos';

export const FATOR_ATIVIDADE: Record<Atividade, number> = {
  sedentario: 1.2,
  pouco_ativo: 1.375,
  ativo: 1.55,
  muito_ativo: 1.725,
};

export const KCAL_POR_KG = 7700;

export function idade(nascimento: string, hoje = new Date()): number {
  const [a, m, d] = nascimento.split('-').map(Number);
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos;
}

/** Taxa metabólica basal (Mifflin-St Jeor). */
export function tmb(p: Pick<Perfil, 'sexo' | 'nascimento' | 'alturaCm'>, pesoKg: number): number {
  const base = 10 * pesoKg + 6.25 * p.alturaCm - 5 * idade(p.nascimento);
  return p.sexo === 'masculino' ? base + 5 : base - 161;
}

/** Gasto energético total sem contar exercícios registrados. */
export function gastoTotal(p: Pick<Perfil, 'sexo' | 'nascimento' | 'alturaCm' | 'atividade'>, pesoKg: number) {
  return tmb(p, pesoKg) * FATOR_ATIVIDADE[p.atividade];
}

export function ajusteDiario(p: Pick<Perfil, 'objetivo' | 'ritmoKgSemana'>): number {
  if (p.objetivo === 'manter') return 0;
  const sinal = p.objetivo === 'perder' ? -1 : 1;
  return (sinal * p.ritmoKgSemana * KCAL_POR_KG) / 7;
}

export function minimoSeguro(sexo: Perfil['sexo']) {
  return sexo === 'masculino' ? 1500 : 1200;
}

/** Meta diária de calorias, arredondada para dezenas. */
export function metaCalculada(p: Perfil, pesoAtual: number): number {
  const bruta = gastoTotal(p, pesoAtual) + ajusteDiario(p);
  return Math.round(Math.max(bruta, minimoSeguro(p.sexo)) / 10) * 10;
}

export function metaCalorias(p: Perfil, pesoAtual: number): number {
  return p.metaKcalManual ?? metaCalculada(p, pesoAtual);
}

export function metaMacrosGramas(kcal: number, m: DivisaoMacros) {
  return {
    carb: Math.round((kcal * m.carb) / 100 / 4),
    prot: Math.round((kcal * m.prot) / 100 / 4),
    gord: Math.round((kcal * m.gord) / 100 / 9),
  };
}

export const MACROS_PADRAO: DivisaoMacros = { carb: 50, prot: 25, gord: 25 };

/** Calorias de exercício: MET × peso (kg) × horas. */
export function kcalExercicio(met: number, pesoKg: number, minutos: number) {
  return Math.round(met * pesoKg * (minutos / 60));
}

/** Semanas estimadas até a meta de peso. */
export function semanasAteMeta(p: Perfil, pesoAtual: number): number | null {
  if (p.objetivo === 'manter' || p.ritmoKgSemana <= 0) return null;
  const diff = Math.abs(pesoAtual - p.pesoMeta);
  return Math.ceil(diff / p.ritmoKgSemana);
}

export function nutrientesDaPorcao(a: Alimento, gramas: number): Nutrientes {
  const f = gramas / 100;
  return {
    kcal: Math.round(a.kcal * f),
    prot: arred(a.prot * f),
    carb: arred(a.carb * f),
    gord: arred(a.gord * f),
  };
}

export function somar(itens: Nutrientes[]): Nutrientes {
  return itens.reduce(
    (t, i) => ({ kcal: t.kcal + i.kcal, prot: t.prot + i.prot, carb: t.carb + i.carb, gord: t.gord + i.gord }),
    { kcal: 0, prot: 0, carb: 0, gord: 0 },
  );
}

export function descreverPorcao(porcao: Porcao, quantidade: number) {
  const q = formatarNumero(quantidade, 2);
  const g = formatarNumero(porcao.gramas * quantidade, 0);
  if (porcao.descricao === '100 g') return `${g} g`;
  if (porcao.descricao === '1 g') return `${g} g`;
  return `${q} × ${porcao.descricao} (${g} g)`;
}

export function arred(n: number, casas = 1) {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}

/** Formata no padrão brasileiro: 1.649 / 2,5 */
export function formatarNumero(n: number, casas = 0): string {
  const fixo = arred(n, casas).toFixed(casas);
  let [inteiro, dec] = fixo.split('.');
  const negativo = inteiro.startsWith('-');
  if (negativo) inteiro = inteiro.slice(1);
  inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (dec) dec = dec.replace(/0+$/, '');
  return (negativo ? '-' : '') + inteiro + (dec ? ',' + dec : '');
}

/** Lê número digitado com vírgula ou ponto. */
export function lerNumero(texto: string): number {
  const n = parseFloat(texto.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}
