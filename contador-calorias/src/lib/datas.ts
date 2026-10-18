/** Datas no formato AAAA-MM-DD, sempre no fuso local. */
export function chaveData(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function paraDate(chave: string): Date {
  const [a, m, d] = chave.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function somarDias(chave: string, dias: number): string {
  const d = paraDate(chave);
  d.setDate(d.getDate() + dias);
  return chaveData(d);
}

export const hoje = () => chaveData();

const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const letraDia = (chave: string) => DIAS_CURTOS[paraDate(chave).getDay()];

export function rotuloData(chave: string): string {
  const h = hoje();
  if (chave === h) return 'Hoje';
  if (chave === somarDias(h, -1)) return 'Ontem';
  if (chave === somarDias(h, 1)) return 'Amanhã';
  const d = paraDate(chave);
  return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function dataCurta(chave: string): string {
  const d = paraDate(chave);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Segunda a domingo da semana que contém a data. */
export function semanaDe(chave: string): string[] {
  const d = paraDate(chave);
  const deslocamento = (d.getDay() + 6) % 7; // segunda = 0
  const segunda = somarDias(chave, -deslocamento);
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
}

export function ultimosDias(n: number, ate = hoje()): string[] {
  return Array.from({ length: n }, (_, i) => somarDias(ate, i - n + 1));
}

export function novoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
