import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Estado } from './tipos';

/**
 * Onde os dados de cada perfil ficam guardados.
 * - "nuvem": banco de dados do claude.ai, quando o app roda como página publicada lá.
 *   Fica salvo no servidor: não some ao fechar ou limpar o navegador.
 * - "aparelho": AsyncStorage (memória do celular no app, ou do navegador).
 */
export type ResumoPerfil = { id: string; nome: string; criadoEm: number };

export type Armazem = {
  tipo: 'nuvem' | 'aparelho';
  listarPerfis(): Promise<ResumoPerfil[]>;
  criarPerfil(nome: string): Promise<ResumoPerfil>;
  carregar(id: string): Promise<Estado | null>;
  salvar(id: string, estado: Estado): Promise<void>;
  excluirPerfil(id: string): Promise<void>;
};

const CHAVE_ANTIGA = 'rango:estado:v1'; // versão sem perfis
const CHAVE_PERFIS = 'rango:perfis';
const chaveEstado = (id: string) => `rango:estado:${id}`;
export const CHAVE_PERFIL_ATIVO = 'rango:perfil-ativo';

const novoIdPerfil = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Remove `undefined` e qualquer coisa que não seja JSON puro. */
const json = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------- Aparelho ----------

function armazemAparelho(): Armazem {
  const lerLista = async (): Promise<ResumoPerfil[]> => {
    try {
      const t = await AsyncStorage.getItem(CHAVE_PERFIS);
      return t ? JSON.parse(t) : [];
    } catch {
      return [];
    }
  };
  const gravarLista = (l: ResumoPerfil[]) => AsyncStorage.setItem(CHAVE_PERFIS, JSON.stringify(l)).catch(() => {});

  return {
    tipo: 'aparelho',
    listarPerfis: lerLista,
    async criarPerfil(nome) {
      const p = { id: novoIdPerfil(), nome, criadoEm: Date.now() };
      await gravarLista([...(await lerLista()), p]);
      return p;
    },
    async carregar(id) {
      try {
        const t = await AsyncStorage.getItem(chaveEstado(id));
        return t ? JSON.parse(t) : null;
      } catch {
        return null;
      }
    },
    async salvar(id, estado) {
      await AsyncStorage.setItem(chaveEstado(id), JSON.stringify(estado));
    },
    async excluirPerfil(id) {
      await gravarLista((await lerLista()).filter((p) => p.id !== id));
      await AsyncStorage.removeItem(chaveEstado(id)).catch(() => {});
    },
  };
}

// ---------- Nuvem (banco do claude.ai) ----------

// Tipos mínimos do banco do claude.ai que o app usa.
type Snap = { id: string; exists: boolean; data(): Record<string, unknown> | undefined };
type DocRef = { set(d: object): Promise<void>; delete(): Promise<void>; get(): Promise<Snap> };
type ColRef = { doc(id: string): DocRef; get(): Promise<{ docs: Snap[] }> };
type BancoClaude = { doc(p: string): DocRef; collection(p: string): ColRef };

/**
 * Estrutura no banco:
 *   perfis/<id>                      { nome, criadoEm }
 *   perfis/<id>/partes/principal     perfil, pesos, água, meus alimentos
 *   perfis/<id>/partes/m-AAAA-MM     alimentos e exercícios do mês
 * Dividido por mês porque cada documento aceita até 256 KB.
 */
function dividir(e: Estado): Record<string, object> {
  const partes: Record<string, { alimentos: unknown[]; exercicios: unknown[] }> = {};
  const mes = (data: string) => {
    const k = `m-${data.slice(0, 7)}`;
    return (partes[k] ??= { alimentos: [], exercicios: [] });
  };
  for (const a of e.alimentos) mes(a.data).alimentos.push(a);
  for (const x of e.exercicios) mes(x.data).exercicios.push(x);
  return json({
    principal: { versao: e.versao, perfil: e.perfil, pesos: e.pesos, agua: e.agua, meusAlimentos: e.meusAlimentos },
    ...partes,
  });
}

function juntar(docs: Snap[]): Estado | null {
  const principal = docs.find((d) => d.id === 'principal')?.data() as Partial<Estado> | undefined;
  if (!principal) return null;
  const alimentos: Estado['alimentos'] = [];
  const exercicios: Estado['exercicios'] = [];
  for (const d of docs) {
    if (!d.id.startsWith('m-')) continue;
    const corpo = d.data() as { alimentos?: Estado['alimentos']; exercicios?: Estado['exercicios'] };
    alimentos.push(...(corpo.alimentos ?? []));
    exercicios.push(...(corpo.exercicios ?? []));
  }
  return {
    versao: 1,
    perfil: principal.perfil ?? null,
    pesos: principal.pesos ?? [],
    agua: principal.agua ?? {},
    meusAlimentos: principal.meusAlimentos ?? [],
    alimentos,
    exercicios,
  };
}

function armazemNuvem(db: BancoClaude): Armazem {
  // O que já está gravado, para só reenviar as partes que mudaram.
  const gravado = new Map<string, Map<string, string>>();
  // Uma escrita por vez.
  let fila: Promise<unknown> = Promise.resolve();
  const enfileirar = <T,>(f: () => Promise<T>): Promise<T> => {
    const p = fila.then(f, f);
    fila = p.catch(() => {});
    return p;
  };
  const partes = (id: string) => db.collection(`perfis/${id}/partes`);

  return {
    tipo: 'nuvem',
    async listarPerfis() {
      const snap = await db.collection('perfis').get();
      return snap.docs
        .map((d) => {
          const b = d.data() as { nome?: string; criadoEm?: number };
          return { id: d.id, nome: b.nome || 'Sem nome', criadoEm: b.criadoEm ?? 0 };
        })
        .sort((a, b) => a.criadoEm - b.criadoEm);
    },
    async criarPerfil(nome) {
      const p = { id: novoIdPerfil(), nome, criadoEm: Date.now() };
      await enfileirar(() => db.doc(`perfis/${p.id}`).set({ nome: p.nome, criadoEm: p.criadoEm }));
      return p;
    },
    async carregar(id) {
      const snap = await partes(id).get();
      gravado.set(id, new Map(snap.docs.map((d) => [d.id, JSON.stringify(d.data())])));
      return juntar(snap.docs);
    },
    salvar(id, estado) {
      return enfileirar(async () => {
        const antes = gravado.get(id) ?? new Map<string, string>();
        const agora = dividir(estado);
        for (const [parte, corpo] of Object.entries(agora)) {
          const texto = JSON.stringify(corpo);
          if (antes.get(parte) === texto) continue;
          await partes(id).doc(parte).set(corpo);
          antes.set(parte, texto);
        }
        for (const parte of [...antes.keys()]) {
          if (parte in agora) continue;
          await partes(id).doc(parte).delete();
          antes.delete(parte);
        }
        gravado.set(id, antes);
      });
    },
    excluirPerfil(id) {
      return enfileirar(async () => {
        const snap = await partes(id).get();
        for (const d of snap.docs) await partes(id).doc(d.id).delete();
        await db.doc(`perfis/${id}`).delete();
        gravado.delete(id);
      });
    },
  };
}

/** Usa a nuvem do claude.ai quando disponível; senão, o aparelho. */
export async function abrirArmazem(): Promise<Armazem> {
  const claude = (globalThis as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  if (claude?.use) {
    try {
      const db = (await claude.use('db')) as BancoClaude | null;
      if (db) {
        const nuvem = armazemNuvem(db);
        await nuvem.listarPerfis(); // confirma que o banco responde
        await migrarAntigo(nuvem);
        return nuvem;
      }
    } catch {
      // cai para o aparelho
    }
  }
  const local = armazemAparelho();
  await migrarAntigo(local);
  return local;
}

/** Dados da versão sem perfis viram o primeiro perfil. */
async function migrarAntigo(a: Armazem) {
  try {
    const t = await AsyncStorage.getItem(CHAVE_ANTIGA);
    if (!t) return;
    const estado = JSON.parse(t) as Estado;
    if (estado.perfil && (await a.listarPerfis()).length === 0) {
      const p = await a.criarPerfil(estado.perfil.nome || 'Eu');
      await a.salvar(p.id, estado);
    }
    await AsyncStorage.removeItem(CHAVE_ANTIGA);
  } catch {
    // sem dados antigos legíveis
  }
}
