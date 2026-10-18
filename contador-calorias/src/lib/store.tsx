import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import tacoJson from '../data/taco.json';
import { metaCalorias, metaMacrosGramas, somar } from './calculos';
import { chaveData, hoje, novoId, somarDias } from './datas';
import type {
  Alimento,
  Estado,
  Perfil,
  RefeicaoId,
  RegistroAlimento,
  RegistroExercicio,
} from './tipos';

export const TACO: Alimento[] = (tacoJson as Omit<Alimento, 'origem'>[]).map((a) => ({ ...a, origem: 'taco' }));
const TACO_POR_ID = new Map(TACO.map((a) => [a.id, a]));

export const REFEICOES: { id: RefeicaoId; nome: string }[] = [
  { id: 'cafe', nome: 'Café da manhã' },
  { id: 'almoco', nome: 'Almoço' },
  { id: 'jantar', nome: 'Jantar' },
  { id: 'lanches', nome: 'Lanches' },
];
export const nomeRefeicao = (id: RefeicaoId) => REFEICOES.find((r) => r.id === id)?.nome ?? id;

/** Sugere a refeição pela hora do dia. */
export function refeicaoDoMomento(d = new Date()): RefeicaoId {
  const h = d.getHours();
  if (h < 10) return 'cafe';
  if (h < 15) return 'almoco';
  if (h >= 18 && h < 23) return 'jantar';
  return 'lanches';
}

/** Lê a refeição vinda da URL; se faltar ou for inválida, usa a do momento. */
export function lerRefeicao(v?: string): RefeicaoId {
  return REFEICOES.some((r) => r.id === v) ? (v as RefeicaoId) : refeicaoDoMomento();
}

/** Lê a data vinda da URL (AAAA-MM-DD); se faltar, usa hoje. */
export function lerData(v?: string): string {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : hoje();
}

const CHAVE = 'rango:estado:v1';

const VAZIO: Estado = {
  versao: 1,
  perfil: null,
  alimentos: [],
  exercicios: [],
  pesos: [],
  agua: {},
  meusAlimentos: [],
};

type Acoes = {
  salvarPerfil(p: Perfil): void;
  atualizarPerfil(parcial: Partial<Perfil>): void;
  registrarAlimento(r: Omit<RegistroAlimento, 'id' | 'criadoEm'>): void;
  removerAlimento(id: string): void;
  registrarExercicio(r: Omit<RegistroExercicio, 'id' | 'criadoEm'>): void;
  removerExercicio(id: string): void;
  registrarPeso(data: string, kg: number): void;
  removerPeso(id: string): void;
  definirAgua(data: string, ml: number): void;
  salvarMeuAlimento(a: Alimento): void;
  removerMeuAlimento(id: string): void;
  apagarTudo(): void;
};

type Contexto = { estado: Estado; carregado: boolean } & Acoes;

const Ctx = createContext<Contexto | null>(null);

export function ProvedorDados({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(VAZIO);
  const [carregado, setCarregado] = useState(false);
  const pronto = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((txt) => {
        if (txt) setEstado({ ...VAZIO, ...JSON.parse(txt) });
      })
      .catch(() => {})
      .finally(() => {
        pronto.current = true;
        setCarregado(true);
      });
  }, []);

  useEffect(() => {
    if (!pronto.current) return;
    AsyncStorage.setItem(CHAVE, JSON.stringify(estado)).catch(() => {});
  }, [estado]);

  const mudar = useCallback((f: (e: Estado) => Estado) => setEstado(f), []);

  const acoes = useMemo<Acoes>(
    () => ({
      salvarPerfil: (p) =>
        mudar((e) => {
          const pesos = e.pesos.length ? e.pesos : [{ id: novoId(), data: hoje(), kg: p.pesoInicial }];
          return { ...e, perfil: p, pesos };
        }),
      atualizarPerfil: (parcial) => mudar((e) => (e.perfil ? { ...e, perfil: { ...e.perfil, ...parcial } } : e)),
      registrarAlimento: (r) =>
        mudar((e) => ({ ...e, alimentos: [...e.alimentos, { ...r, id: novoId(), criadoEm: Date.now() }] })),
      removerAlimento: (id) => mudar((e) => ({ ...e, alimentos: e.alimentos.filter((a) => a.id !== id) })),
      registrarExercicio: (r) =>
        mudar((e) => ({ ...e, exercicios: [...e.exercicios, { ...r, id: novoId(), criadoEm: Date.now() }] })),
      removerExercicio: (id) => mudar((e) => ({ ...e, exercicios: e.exercicios.filter((a) => a.id !== id) })),
      registrarPeso: (data, kg) =>
        mudar((e) => {
          // um registro por dia: substitui o do mesmo dia
          const pesos = e.pesos.filter((p) => p.data !== data);
          pesos.push({ id: novoId(), data, kg });
          pesos.sort((a, b) => a.data.localeCompare(b.data));
          return { ...e, pesos };
        }),
      removerPeso: (id) => mudar((e) => ({ ...e, pesos: e.pesos.filter((p) => p.id !== id) })),
      definirAgua: (data, ml) => mudar((e) => ({ ...e, agua: { ...e.agua, [data]: Math.max(0, ml) } })),
      salvarMeuAlimento: (a) =>
        mudar((e) => ({ ...e, meusAlimentos: [a, ...e.meusAlimentos.filter((m) => m.id !== a.id)] })),
      removerMeuAlimento: (id) => mudar((e) => ({ ...e, meusAlimentos: e.meusAlimentos.filter((m) => m.id !== id) })),
      apagarTudo: () => {
        AsyncStorage.removeItem(CHAVE).catch(() => {});
        mudar(() => VAZIO);
      },
    }),
    [mudar],
  );

  const valor = useMemo(() => ({ estado, carregado, ...acoes }), [estado, carregado, acoes]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDados() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDados fora do ProvedorDados');
  return c;
}

// ---------- Seletores ----------

export function pesoAtual(e: Estado): number {
  return e.pesos.at(-1)?.kg ?? e.perfil?.pesoInicial ?? 70;
}

/** Peso vigente numa data (último registro até aquele dia). */
export function pesoEm(e: Estado, data: string): number {
  let kg = e.perfil?.pesoInicial ?? 70;
  for (const p of e.pesos) if (p.data <= data) kg = p.kg;
  return kg;
}

export function buscarAlimentoPorId(e: Estado, id: string): Alimento | undefined {
  return e.meusAlimentos.find((a) => a.id === id) ?? TACO_POR_ID.get(id);
}

export function resumoDia(e: Estado, data: string) {
  const itens = e.alimentos.filter((a) => a.data === data);
  const exercicios = e.exercicios.filter((x) => x.data === data);
  const consumido = somar(itens);
  const kcalExercicio = exercicios.reduce((t, x) => t + x.kcal, 0);
  const perfil = e.perfil!;
  const meta = metaCalorias(perfil, pesoEm(e, data));
  const bonus = Math.round(kcalExercicio * perfil.fatorExercicio);
  const macros = metaMacrosGramas(meta, perfil.macros);
  return {
    itens,
    exercicios,
    consumido,
    kcalExercicio,
    bonusExercicio: bonus,
    meta,
    macros,
    restante: meta - consumido.kcal + bonus,
    agua: e.agua[data] ?? 0,
  };
}

export function diasComRegistro(e: Estado): Set<string> {
  return new Set(e.alimentos.map((a) => a.data));
}

/** Dias seguidos com pelo menos um alimento registrado (hoje ou até ontem). */
export function sequencia(e: Estado): number {
  const dias = diasComRegistro(e);
  let d = hoje();
  if (!dias.has(d)) d = somarDias(d, -1);
  let n = 0;
  while (dias.has(d)) {
    n++;
    d = somarDias(d, -1);
  }
  return n;
}

/** Último registro de cada alimento, do mais recente para o mais antigo. */
export function recentes(e: Estado, limite = 40): RegistroAlimento[] {
  const vistos = new Set<string>();
  const lista: RegistroAlimento[] = [];
  for (const r of [...e.alimentos].sort((a, b) => b.criadoEm - a.criadoEm)) {
    const chave = r.alimentoId ?? `rapida:${r.nome}:${r.kcal}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push(r);
    if (lista.length >= limite) break;
  }
  return lista;
}

export { chaveData };
