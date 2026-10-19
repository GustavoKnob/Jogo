import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Campo, Cartao, Ionicons, s, type NomeIcone } from '../components/ui';
import {
  ajusteDiario,
  formatarNumero,
  gastoTotal,
  idade,
  lerNumero,
  MACROS_PADRAO,
  metaCalculada,
  metaMacrosGramas,
  minimoSeguro,
  semanasAteMeta,
} from '../lib/calculos';
import { hoje, paraDate } from '../lib/datas';
import { pesoAtual, useDados } from '../lib/store';
import { cores } from '../lib/tema';
import type { Atividade, Objetivo, Perfil, Sexo } from '../lib/tipos';

const OBJETIVOS: { id: Objetivo; nome: string; desc: string; icone: NomeIcone }[] = [
  { id: 'perder', nome: 'Perder peso', desc: 'Comer um pouco menos do que gasto', icone: 'trending-down' },
  { id: 'manter', nome: 'Manter o peso', desc: 'Comer o mesmo que gasto', icone: 'remove' },
  { id: 'ganhar', nome: 'Ganhar peso', desc: 'Comer um pouco mais do que gasto', icone: 'trending-up' },
];

const ATIVIDADES: { id: Atividade; nome: string; desc: string }[] = [
  { id: 'sedentario', nome: 'Sedentário', desc: 'Passo a maior parte do dia sentado (escritório, estudo)' },
  { id: 'pouco_ativo', nome: 'Pouco ativo', desc: 'Fico boa parte do dia em pé (professor, vendedor)' },
  { id: 'ativo', nome: 'Ativo', desc: 'Me movimento bastante (garçom, entregador a pé)' },
  { id: 'muito_ativo', nome: 'Muito ativo', desc: 'Trabalho físico pesado (obra, carga)' },
];

const RITMOS = [0.25, 0.5, 0.75, 1];

type Rascunho = {
  nome: string;
  objetivo: Objetivo;
  sexo: Sexo;
  nascimento: string; // DD/MM/AAAA digitado
  altura: string;
  peso: string;
  pesoMeta: string;
  atividade: Atividade;
  ritmo: number;
};

function paraBR(iso: string) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function nascimentoISO(br: string): string | null {
  const m = br.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = paraDate(iso);
  if (d.getDate() !== +m[1] || d.getMonth() + 1 !== +m[2]) return null;
  const anos = idade(iso);
  return anos >= 13 && anos <= 100 ? iso : null;
}

/** Aplica a máscara DD/MM/AAAA enquanto digita. */
function mascaraData(t: string) {
  const d = t.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export default function Onboarding() {
  const { editar } = useLocalSearchParams<{ editar?: string }>();
  const { estado, salvarPerfil, atualizarPerfil, registrarPeso, perfilAtivo } = useDados();
  const existente = editar ? estado.perfil : null;

  const [passo, setPasso] = useState(existente ? 1 : 0);
  const [r, setR] = useState<Rascunho>(() =>
    existente
      ? {
          nome: existente.nome,
          objetivo: existente.objetivo,
          sexo: existente.sexo,
          nascimento: paraBR(existente.nascimento),
          altura: String(existente.alturaCm),
          peso: formatarNumero(pesoAtual(estado), 1),
          pesoMeta: formatarNumero(existente.pesoMeta, 1),
          atividade: existente.atividade,
          ritmo: existente.ritmoKgSemana || 0.5,
        }
      : {
          nome: perfilAtivo?.nome ?? '',
          objetivo: 'perder',
          sexo: 'masculino',
          nascimento: '',
          altura: '',
          peso: '',
          pesoMeta: '',
          atividade: 'sedentario',
          ritmo: 0.5,
        },
  );
  const mudar = (p: Partial<Rascunho>) => setR((x) => ({ ...x, ...p }));

  const altura = lerNumero(r.altura);
  const peso = lerNumero(r.peso);
  const pesoMeta = r.objetivo === 'manter' ? peso : lerNumero(r.pesoMeta);
  const nasc = nascimentoISO(r.nascimento);

  const erroCorpo = (() => {
    if (!nasc) return 'Informe uma data de nascimento válida (13 anos ou mais).';
    if (!(altura >= 120 && altura <= 230)) return 'Informe a altura em centímetros (ex.: 175).';
    if (!(peso >= 30 && peso <= 350)) return 'Informe seu peso em kg (ex.: 82,5).';
    if (r.objetivo !== 'manter') {
      if (!(pesoMeta >= 30 && pesoMeta <= 350)) return 'Informe o peso que você quer alcançar.';
      if (r.objetivo === 'perder' && pesoMeta >= peso) return 'Para perder peso, a meta precisa ser menor que o peso atual.';
      if (r.objetivo === 'ganhar' && pesoMeta <= peso) return 'Para ganhar peso, a meta precisa ser maior que o peso atual.';
    }
    return null;
  })();

  const perfil: Perfil | null =
    nasc && !erroCorpo
      ? {
          nome: r.nome.trim(),
          sexo: r.sexo,
          nascimento: nasc,
          alturaCm: altura,
          pesoInicial: existente?.pesoInicial ?? peso,
          pesoMeta,
          atividade: r.atividade,
          objetivo: r.objetivo,
          ritmoKgSemana: r.objetivo === 'manter' ? 0 : r.ritmo,
          macros: existente?.macros ?? MACROS_PADRAO,
          aguaMetaMl: existente?.aguaMetaMl ?? Math.min(3500, Math.max(2000, Math.round((peso * 35) / 250) * 250)),
          metaKcalManual: existente?.metaKcalManual,
          fatorExercicio: existente?.fatorExercicio ?? 1,
          criadoEm: existente?.criadoEm ?? hoje(),
        }
      : null;

  const passos = r.objetivo === 'manter' ? ['objetivo', 'corpo', 'atividade', 'resultado'] : ['objetivo', 'corpo', 'atividade', 'ritmo', 'resultado'];
  const atual = passos[passo];

  const concluir = () => {
    if (!perfil) return;
    if (existente) {
      atualizarPerfil({ ...perfil, metaKcalManual: undefined });
      if (Math.abs(peso - pesoAtual(estado)) >= 0.05) registrarPeso(hoje(), peso);
      router.back();
    } else {
      salvarPerfil(perfil);
      router.replace('/');
    }
  };

  const podeAvancar = atual !== 'corpo' || !erroCorpo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', gap: 6, padding: 16 }}>
          {passos.map((_, i) => (
            <View
              key={i}
              style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= passo ? cores.primaria : cores.borda }}
            />
          ))}
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          {atual === 'objetivo' && (
            <>
              <Text style={{ fontSize: 34, fontWeight: '800', color: cores.primaria }}>Rango</Text>
              <Text style={titulo}>Qual é o seu objetivo?</Text>
              <Text style={s.suave}>Vamos calcular quantas calorias você deve comer por dia.</Text>
              <Campo rotulo="Como quer ser chamado? (opcional)" value={r.nome} onChangeText={(nome) => mudar({ nome })} placeholder="Seu nome" />
              {OBJETIVOS.map((o) => (
                <Opcao
                  key={o.id}
                  ativo={r.objetivo === o.id}
                  titulo={o.nome}
                  desc={o.desc}
                  icone={o.icone}
                  onPress={() => mudar({ objetivo: o.id })}
                />
              ))}
            </>
          )}

          {atual === 'corpo' && (
            <>
              <Text style={titulo}>Sobre você</Text>
              <Text style={s.suave}>Usamos esses dados só para calcular sua meta. Ficam salvos no seu celular.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['masculino', 'feminino'] as Sexo[]).map((sx) => (
                  <Opcao
                    key={sx}
                    ativo={r.sexo === sx}
                    titulo={sx === 'masculino' ? 'Masculino' : 'Feminino'}
                    onPress={() => mudar({ sexo: sx })}
                    style={{ flex: 1 }}
                  />
                ))}
              </View>
              <Campo
                rotulo="Data de nascimento"
                value={r.nascimento}
                onChangeText={(t) => mudar({ nascimento: mascaraData(t) })}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
              />
              <Campo rotulo="Altura" sufixo="cm" value={r.altura} onChangeText={(altura) => mudar({ altura })} placeholder="175" keyboardType="number-pad" />
              <Campo rotulo="Peso atual" sufixo="kg" value={r.peso} onChangeText={(peso) => mudar({ peso })} placeholder="82,5" keyboardType="decimal-pad" />
              {r.objetivo !== 'manter' && (
                <Campo rotulo="Peso meta" sufixo="kg" value={r.pesoMeta} onChangeText={(pesoMeta) => mudar({ pesoMeta })} placeholder="75" keyboardType="decimal-pad" />
              )}
              {erroCorpo && r.nascimento.length >= 10 && r.altura && r.peso ? (
                <Text style={{ color: cores.perigo }}>{erroCorpo}</Text>
              ) : null}
            </>
          )}

          {atual === 'atividade' && (
            <>
              <Text style={titulo}>Como é sua rotina?</Text>
              <Text style={s.suave}>Não conte os treinos aqui: você registra exercícios à parte e eles somam calorias ao seu dia.</Text>
              {ATIVIDADES.map((a) => (
                <Opcao key={a.id} ativo={r.atividade === a.id} titulo={a.nome} desc={a.desc} onPress={() => mudar({ atividade: a.id })} />
              ))}
            </>
          )}

          {atual === 'ritmo' && perfil && (
            <>
              <Text style={titulo}>{r.objetivo === 'perder' ? 'Quanto quer perder por semana?' : 'Quanto quer ganhar por semana?'}</Text>
              <Text style={s.suave}>Ritmos menores são mais fáceis de manter.</Text>
              {RITMOS.map((kg) => {
                const meta = metaCalculada({ ...perfil, ritmoKgSemana: kg }, peso);
                const limitado = meta === minimoSeguro(perfil.sexo) && r.objetivo === 'perder';
                return (
                  <Opcao
                    key={kg}
                    ativo={r.ritmo === kg}
                    titulo={`${formatarNumero(kg, 2)} kg por semana`}
                    desc={`${formatarNumero(meta)} kcal por dia${kg === 0.5 ? ' · recomendado' : ''}${limitado ? ' · limitado ao mínimo seguro' : ''}`}
                    onPress={() => mudar({ ritmo: kg })}
                  />
                );
              })}
            </>
          )}

          {atual === 'resultado' && perfil && <Resultado perfil={perfil} peso={peso} />}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
          {(passo > 0 || existente) && (
            <Botao
              titulo="Voltar"
              variante="secundario"
              onPress={() => (passo > (existente ? 1 : 0) ? setPasso(passo - 1) : router.back())}
              style={{ flex: 1 }}
            />
          )}
          {atual === 'resultado' ? (
            <Botao titulo={existente ? 'Salvar' : 'Começar'} onPress={concluir} style={{ flex: 2 }} />
          ) : (
            <Botao titulo="Continuar" desabilitado={!podeAvancar} onPress={() => setPasso(passo + 1)} style={{ flex: 2 }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Resultado({ perfil, peso }: { perfil: Perfil; peso: number }) {
  const meta = metaCalculada(perfil, peso);
  const gasto = Math.round(gastoTotal(perfil, peso));
  const ajuste = Math.round(ajusteDiario(perfil));
  const g = metaMacrosGramas(meta, perfil.macros);
  const semanas = semanasAteMeta(perfil, peso);
  return (
    <>
      <Text style={titulo}>Sua meta diária</Text>
      <Cartao style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 48, fontWeight: '800', color: cores.primaria }}>{formatarNumero(meta)}</Text>
        <Text style={s.suave}>kcal por dia</Text>
      </Cartao>
      <Cartao style={{ gap: 8 }}>
        <Linha rotulo="Você gasta por dia (estimado)" valor={`${formatarNumero(gasto)} kcal`} />
        <Linha
          rotulo={ajuste < 0 ? 'Déficit para perder peso' : ajuste > 0 ? 'Superávit para ganhar peso' : 'Ajuste'}
          valor={`${ajuste > 0 ? '+' : ''}${formatarNumero(ajuste)} kcal`}
        />
        {meta === minimoSeguro(perfil.sexo) && perfil.objetivo === 'perder' && (
          <Text style={{ color: cores.aviso }}>Sua meta foi limitada ao mínimo seguro de {formatarNumero(meta)} kcal.</Text>
        )}
        {semanas !== null && (
          <Linha rotulo="Tempo estimado até a meta" valor={`~${semanas} semanas`} />
        )}
      </Cartao>
      <Cartao style={{ gap: 8 }}>
        <Text style={s.forte}>Macros</Text>
        <Linha rotulo={`Carboidratos (${perfil.macros.carb}%)`} valor={`${g.carb} g`} />
        <Linha rotulo={`Proteínas (${perfil.macros.prot}%)`} valor={`${g.prot} g`} />
        <Linha rotulo={`Gorduras (${perfil.macros.gord}%)`} valor={`${g.gord} g`} />
        <Text style={s.suave}>Você pode mudar isso depois em Mais › Metas.</Text>
      </Cartao>
      <Text style={[s.suave, { fontSize: 12 }]}>
        Estimativa pela fórmula de Mifflin-St Jeor. Não substitui orientação de médico ou nutricionista.
      </Text>
    </>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      <Text style={[s.suave, { flex: 1 }]}>{rotulo}</Text>
      <Text style={s.forte}>{valor}</Text>
    </View>
  );
}

function Opcao({
  ativo,
  titulo: t,
  desc,
  icone,
  onPress,
  style,
}: {
  ativo: boolean;
  titulo: string;
  desc?: string;
  icone?: NomeIcone;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: ativo ? cores.primaria : cores.borda,
          backgroundColor: ativo ? cores.primariaClara : cores.cartao,
        },
        style,
      ]}
    >
      {icone && <Ionicons name={icone} size={24} color={ativo ? cores.primaria : cores.textoSuave} />}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: cores.texto }}>{t}</Text>
        {desc && <Text style={[s.suave, { marginTop: 2 }]}>{desc}</Text>}
      </View>
    </Pressable>
  );
}

const titulo = { fontSize: 26, fontWeight: '800' as const, color: cores.texto };
