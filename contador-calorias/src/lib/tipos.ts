export type Porcao = { descricao: string; gramas: number };

export type OrigemAlimento = 'taco' | 'off' | 'usuario';

/** Valores nutricionais sempre por 100 g. */
export type Alimento = {
  id: string;
  nome: string;
  marca?: string;
  categoria?: string;
  codigoBarras?: string;
  origem: OrigemAlimento;
  kcal: number;
  prot: number;
  carb: number;
  gord: number;
  fibra?: number;
  sodio?: number;
  porcoes: Porcao[];
};

export type Sexo = 'masculino' | 'feminino';
export type Atividade = 'sedentario' | 'pouco_ativo' | 'ativo' | 'muito_ativo';
export type Objetivo = 'perder' | 'manter' | 'ganhar';

export type DivisaoMacros = { carb: number; prot: number; gord: number }; // em %

export type Perfil = {
  nome: string;
  sexo: Sexo;
  nascimento: string; // AAAA-MM-DD
  alturaCm: number;
  pesoInicial: number;
  pesoMeta: number;
  atividade: Atividade;
  objetivo: Objetivo;
  ritmoKgSemana: number; // sempre positivo; o sinal vem do objetivo
  macros: DivisaoMacros;
  aguaMetaMl: number;
  /** Se preenchido, substitui a meta calculada. */
  metaKcalManual?: number;
  /** Fração das calorias de exercício somadas ao saldo (0 a 1). */
  fatorExercicio: number;
  criadoEm: string;
};

export type RefeicaoId = 'cafe' | 'almoco' | 'jantar' | 'lanches';

export type Nutrientes = { kcal: number; prot: number; carb: number; gord: number };

export type RegistroAlimento = Nutrientes & {
  id: string;
  data: string; // AAAA-MM-DD
  refeicao: RefeicaoId;
  alimentoId?: string; // vazio na adição rápida
  nome: string;
  detalhe: string; // ex.: "2 × 1 colher de servir (90 g)"
  gramas?: number;
  porcao?: Porcao;
  quantidade?: number;
  criadoEm: number;
};

export type RegistroExercicio = {
  id: string;
  data: string;
  nome: string;
  minutos: number;
  kcal: number;
  criadoEm: number;
};

export type RegistroPeso = { id: string; data: string; kg: number };

export type Estado = {
  versao: 1;
  perfil: Perfil | null;
  alimentos: RegistroAlimento[];
  exercicios: RegistroExercicio[];
  pesos: RegistroPeso[];
  agua: Record<string, number>; // data -> ml
  meusAlimentos: Alimento[];
};
