import { Platform } from 'react-native';
import type { Alimento, Porcao } from './tipos';

// API pública do Open Food Facts (dados sob licença ODbL).
// https://openfoodfacts.github.io/openfoodfacts-server/api/
const CAMPOS = 'code,product_name,product_name_pt,brands,nutriments,serving_quantity,serving_size,quantity';

export type ResultadoOFF =
  | { tipo: 'encontrado'; alimento: Alimento }
  | { tipo: 'sem_nutrientes'; nome?: string; marca?: string }
  | { tipo: 'nao_encontrado' }
  | { tipo: 'erro'; mensagem: string };

const n = (v: unknown) => {
  const x = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(x) ? Math.round(x * 10) / 10 : undefined;
};

export async function buscarPorCodigo(codigo: string): Promise<ResultadoOFF> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${CAMPOS}`;
  try {
    const resposta = await fetch(url, {
      // O navegador não permite mudar o User-Agent; no celular, o OFF pede que o app se identifique.
      headers: Platform.OS === 'web' ? {} : { 'User-Agent': 'Rango/1.0 (app contador de calorias)' },
    });
    if (resposta.status === 404) return { tipo: 'nao_encontrado' };
    if (!resposta.ok) return { tipo: 'erro', mensagem: `Servidor respondeu ${resposta.status}` };
    const json = await resposta.json();
    if (json.status !== 1 || !json.product) return { tipo: 'nao_encontrado' };
    return converter(codigo, json.product);
  } catch {
    return { tipo: 'erro', mensagem: 'Sem conexão com o Open Food Facts' };
  }
}

function converter(codigo: string, p: any): ResultadoOFF {
  const nome: string = (p.product_name_pt || p.product_name || '').trim();
  const marca: string | undefined = p.brands?.split(',')[0]?.trim() || undefined;
  const nu = p.nutriments ?? {};
  let kcal = n(nu['energy-kcal_100g']);
  if (kcal === undefined && n(nu['energy_100g']) !== undefined) kcal = Math.round(n(nu['energy_100g'])! / 4.184);
  if (kcal === undefined || !nome) return { tipo: 'sem_nutrientes', nome: nome || undefined, marca };

  const porcoes: Porcao[] = [];
  const porcaoG = n(p.serving_quantity);
  if (porcaoG && porcaoG > 0) {
    porcoes.push({ descricao: `1 porção${p.serving_size ? ` (${p.serving_size})` : ''}`, gramas: porcaoG });
  }
  porcoes.push({ descricao: '100 g', gramas: 100 });

  const sodioG = n(nu['sodium_100g']);
  return {
    tipo: 'encontrado',
    alimento: {
      id: `off-${codigo}`,
      nome,
      marca,
      codigoBarras: codigo,
      origem: 'off',
      kcal,
      prot: n(nu['proteins_100g']) ?? 0,
      carb: n(nu['carbohydrates_100g']) ?? 0,
      gord: n(nu['fat_100g']) ?? 0,
      fibra: n(nu['fiber_100g']),
      sodio: sodioG !== undefined ? Math.round(sodioG * 1000) : undefined,
      porcoes,
    },
  };
}
