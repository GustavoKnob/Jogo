import type { Alimento } from './tipos';

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Versões mais consumidas no Brasil, que sobem na busca. */
const POPULARES = new Set([
  'Arroz, tipo 1, cozido',
  'Arroz, integral, cozido',
  'Feijão, carioca, cozido',
  'Feijão, preto, cozido',
  'Pão, trigo, francês',
  'Pão, trigo, forma, integral',
  'Ovo, de galinha, inteiro, cozido/10minutos',
  'Ovo, de galinha, inteiro, frito',
  'Frango, peito, sem pele, grelhado',
  'Carne, bovina, patinho, sem gordura, grelhado',
  'Banana, prata, crua',
  'Banana, nanica, crua',
  'Maçã, Fuji, com casca, crua',
  'Leite, de vaca, integral',
  'Leite, de vaca, desnatado, UHT',
  'Café, infusão 10%',
  'Açúcar, refinado',
  'Queijo, minas, frescal',
  'Queijo, mozarela',
  'Batata, inglesa, cozida',
  'Macarrão, trigo, cru',
  'Alface, crespa, crua',
  'Tomate, com semente, cru',
  'Mamão, Papaia, cru',
  'Laranja, pêra, crua',
]);

type Indexado ={ alimento: Alimento; texto: string };

const cache = new WeakMap<Alimento[], Indexado[]>();

function indexar(lista: Alimento[]): Indexado[] {
  let idx = cache.get(lista);
  if (!idx) {
    idx = lista.map((alimento) => ({
      alimento,
      texto: normalizar(`${alimento.nome} ${alimento.marca ?? ''}`),
    }));
    cache.set(lista, idx);
  }
  return idx;
}

/**
 * Busca tolerante a acentos. Todas as palavras precisam aparecer.
 * Ordem: usados recentemente > começa com a busca > palavra inteira > nome mais curto.
 */
export function buscarAlimentos(
  consulta: string,
  fontes: Alimento[][],
  recentes: Set<string>,
  limite = 60,
): Alimento[] {
  const termos = normalizar(consulta).split(' ').filter(Boolean);
  if (!termos.length) return [];
  const vistos = new Set<string>();
  const achados: { a: Alimento; pontos: number }[] = [];

  for (const fonte of fontes) {
    for (const { alimento, texto } of indexar(fonte)) {
      if (vistos.has(alimento.id)) continue;
      if (!termos.every((t) => texto.includes(t))) continue;
      vistos.add(alimento.id);
      let pontos = 0;
      if (recentes.has(alimento.id)) pontos += 100;
      if (alimento.origem === 'usuario' || alimento.origem === 'off') pontos += 20;
      if (texto.startsWith(termos[0])) pontos += 30;
      for (const t of termos) if (new RegExp(`\\b${t}\\b`).test(texto)) pontos += 10;
      if (POPULARES.has(alimento.nome)) pontos += 25;
      // o que se come pronto aparece antes do ingrediente cru
      if (/\b(cozid|grelhad|assad|refogad|frit)/.test(texto)) pontos += 8;
      const ehFrutaOuVerdura = /Frutas|Verduras/.test(alimento.categoria ?? '');
      if (/\bcru\b/.test(texto) && !ehFrutaOuVerdura) pontos -= 8;
      pontos -= texto.length / 10;
      achados.push({ a: alimento, pontos });
    }
  }
  return achados
    .sort((x, y) => y.pontos - x.pontos)
    .slice(0, limite)
    .map((x) => x.a);
}
