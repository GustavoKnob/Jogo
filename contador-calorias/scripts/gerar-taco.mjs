// Converte a Tabela TACO (CSV) para o JSON usado pelo app.
// Fonte: TACO 4ª edição (NEPA/UNICAMP), via github.com/raulfdm/taco-api.
// Uso: node scripts/gerar-taco.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));

function lerCsv(arquivo) {
  const texto = readFileSync(join(raiz, 'taco', arquivo), 'utf8').trim();
  const linhas = texto.split(/\r?\n/);
  const cabecalho = dividir(linhas[0]);
  return linhas.slice(1).map((linha) => {
    const valores = dividir(linha);
    return Object.fromEntries(cabecalho.map((c, i) => [c, valores[i] ?? '']));
  });
}

// Divide uma linha CSV respeitando aspas.
function dividir(linha) {
  const campos = [];
  let atual = '';
  let aspas = false;
  for (const ch of linha) {
    if (ch === '"') aspas = !aspas;
    else if (ch === ',' && !aspas) {
      campos.push(atual);
      atual = '';
    } else atual += ch;
  }
  campos.push(atual);
  return campos;
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
};

// Porções caseiras aproximadas, por palavra-chave no nome (primeira que casar).
// [regex, [[descrição, gramas], ...]]
const PORCOES = [
  [/^arroz.*cozido/i, [['1 colher de servir', 45], ['1 escumadeira', 90]]],
  [/^feijão.*cozido|^feijoada/i, [['1 concha', 140], ['1 colher de sopa', 20]]],
  [/^pão, trigo, francês/i, [['1 unidade', 50]]],
  [/^pão, .*forma/i, [['1 fatia', 25]]],
  [/^pão, de queijo/i, [['1 unidade média', 40]]],
  [/^ovo.*(cozido|frito|cru|mexido)/i, [['1 unidade', 50]]],
  [/^banana/i, [['1 unidade média', 80]]],
  [/^maçã/i, [['1 unidade média', 130]]],
  [/^laranja/i, [['1 unidade média', 180]]],
  [/^mamão/i, [['1 fatia média', 170]]],
  [/^leite, de vaca/i, [['1 copo (200 ml)', 200], ['1 xícara (240 ml)', 240]]],
  [/^iogurte/i, [['1 pote', 170]]],
  [/^queijo/i, [['1 fatia', 20]]],
  [/^manteiga|^margarina/i, [['1 colher de chá', 5], ['1 colher de sopa', 15]]],
  [/^óleo|^azeite/i, [['1 colher de sopa', 8]]],
  [/^açúcar/i, [['1 colher de chá', 5], ['1 colher de sopa', 12]]],
  [/^café, infusão/i, [['1 xícara (50 ml)', 50]]],
  [/^frango|^carne|^porco|^peixe|^bacalhau|^salmão|^atum|^sardinha|^tilápia|^pescada/i, [['1 filé/bife médio', 120]]],
  [/^batata.*(cozida|frita|assada)|^mandioca.*cozida/i, [['1 colher de servir', 50]]],
  [/^macarrão.*cozido/i, [['1 pegador', 110]]],
  [/^alface|^rúcula|^agrião|^couve/i, [['1 prato de sobremesa', 30]]],
  [/^tomate/i, [['1 unidade média', 100]]],
  [/^cuscuz/i, [['1 fatia', 100]]],
  [/^tapioca|^farinha, de mandioca/i, [['1 colher de sopa', 15]]],
  [/^aveia/i, [['1 colher de sopa', 15]]],
  [/^amendoim|^castanha|^noz/i, [['1 punhado (30 g)', 30]]],
  [/^chocolate/i, [['1 quadradinho', 10], ['1 barra pequena', 25]]],
  [/^biscoito/i, [['1 unidade', 8]]],
  [/^refrigerante|^suco/i, [['1 copo (200 ml)', 200], ['1 lata (350 ml)', 350]]],
  [/^cerveja/i, [['1 lata (350 ml)', 350]]],
];

const categorias = Object.fromEntries(lerCsv('categories.csv').map((c) => [c.id, c.name]));
const nutrientes = Object.fromEntries(lerCsv('nutrients.csv').map((n) => [n.foodId, n]));

const alimentos = lerCsv('food.csv').map((f) => {
  const n = nutrientes[f.id] ?? {};
  const porcoes = [['100 g', 100]];
  const regra = PORCOES.find(([re]) => re.test(f.name));
  if (regra) porcoes.unshift(...regra[1]);
  return {
    id: `taco-${f.id}`,
    nome: f.name,
    categoria: categorias[f.categoryId] ?? '',
    // por 100 g
    kcal: num(n.kcal),
    prot: num(n.protein),
    carb: num(n.carbohydrates),
    gord: num(n.lipids),
    fibra: num(n.dietaryFiber),
    sodio: num(n.sodium),
    porcoes: porcoes.map(([descricao, gramas]) => ({ descricao, gramas })),
  };
});

const destino = join(raiz, '..', 'src', 'data', 'taco.json');
writeFileSync(destino, JSON.stringify(alimentos));
console.log(`${alimentos.length} alimentos gravados em ${destino}`);
