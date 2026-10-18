import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Botao, Campo, Cartao, Chips, s } from '../components/ui';
import { formatarNumero, lerNumero, MACROS_PADRAO, metaCalculada, metaMacrosGramas } from '../lib/calculos';
import { pesoAtual, useDados } from '../lib/store';
import { cores } from '../lib/tema';

const PRESETS = {
  equilibrado: { nome: 'Equilibrado', m: MACROS_PADRAO },
  proteico: { nome: 'Mais proteína', m: { carb: 40, prot: 30, gord: 30 } },
  lowcarb: { nome: 'Low carb', m: { carb: 25, prot: 35, gord: 40 } },
} as const;

type Fator = '1' | '0.75' | '0.5' | '0';

export default function Metas() {
  const { estado, atualizarPerfil } = useDados();
  const perfil = estado.perfil!;
  const calculada = metaCalculada(perfil, pesoAtual(estado));

  const [manual, setManual] = useState(perfil.metaKcalManual ? String(perfil.metaKcalManual) : '');
  const [carb, setCarb] = useState(String(perfil.macros.carb));
  const [prot, setProt] = useState(String(perfil.macros.prot));
  const [gord, setGord] = useState(String(perfil.macros.gord));
  const [agua, setAgua] = useState(formatarNumero(perfil.aguaMetaMl / 1000, 2));
  const [fator, setFator] = useState<Fator>(String(perfil.fatorExercicio) as Fator);

  const c = lerNumero(carb), pr = lerNumero(prot), g = lerNumero(gord);
  const soma = (c || 0) + (pr || 0) + (g || 0);
  const kcalManual = manual.trim() ? lerNumero(manual) : undefined;
  const meta = kcalManual ?? calculada;
  const litros = lerNumero(agua);
  const gramas = metaMacrosGramas(meta, { carb: c || 0, prot: pr || 0, gord: g || 0 });

  const erro =
    soma !== 100
      ? `Os macros somam ${formatarNumero(soma)}%. Precisam somar 100%.`
      : kcalManual !== undefined && !(kcalManual >= 1000 && kcalManual <= 6000)
        ? 'A meta manual precisa estar entre 1.000 e 6.000 kcal.'
        : !(litros > 0 && litros <= 10)
          ? 'Informe a meta de água em litros.'
          : null;

  const salvar = () => {
    atualizarPerfil({
      metaKcalManual: kcalManual !== undefined ? Math.round(kcalManual) : undefined,
      macros: { carb: c, prot: pr, gord: g },
      aguaMetaMl: Math.round(litros * 1000),
      fatorExercicio: Number(fator),
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Cartao style={{ gap: 10 }}>
        <Text style={s.forte}>Calorias</Text>
        <Text style={s.suave}>Meta calculada pelo seu perfil: {formatarNumero(calculada)} kcal</Text>
        <Campo
          rotulo="Usar outra meta (deixe vazio para a calculada)"
          sufixo="kcal"
          value={manual}
          onChangeText={setManual}
          keyboardType="number-pad"
          placeholder={String(calculada)}
        />
      </Cartao>

      <Cartao style={{ gap: 10 }}>
        <Text style={s.forte}>Macros</Text>
        <View style={[s.linha, { gap: 8, flexWrap: 'wrap' }]}>
          {Object.values(PRESETS).map((p) => (
            <Botao
              key={p.nome}
              titulo={p.nome}
              variante="secundario"
              style={{ paddingVertical: 8 }}
              onPress={() => {
                setCarb(String(p.m.carb));
                setProt(String(p.m.prot));
                setGord(String(p.m.gord));
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Campo style={{ flex: 1 }} rotulo="Carb" sufixo="%" value={carb} onChangeText={setCarb} keyboardType="number-pad" />
          <Campo style={{ flex: 1 }} rotulo="Prot" sufixo="%" value={prot} onChangeText={setProt} keyboardType="number-pad" />
          <Campo style={{ flex: 1 }} rotulo="Gord" sufixo="%" value={gord} onChangeText={setGord} keyboardType="number-pad" />
        </View>
        <Text style={s.suave}>
          = {gramas.carb} g carb · {gramas.prot} g prot · {gramas.gord} g gord
          {soma === 100 ? ` · ${formatarNumero(gramas.prot / pesoAtual(estado), 1)} g de proteína por kg` : ''}
        </Text>
      </Cartao>

      <Cartao style={{ gap: 10 }}>
        <Text style={s.forte}>Calorias de exercício</Text>
        <Text style={s.suave}>
          Quanto das calorias gastas em exercícios volta para o seu saldo. Relógios e estimativas costumam exagerar, então 50% a 75% é mais seguro.
        </Text>
        <Chips<Fator>
          opcoes={[
            { id: '1', nome: '100%' },
            { id: '0.75', nome: '75%' },
            { id: '0.5', nome: '50%' },
            { id: '0', nome: 'Não somar' },
          ]}
          valor={fator}
          onChange={setFator}
        />
      </Cartao>

      <Cartao style={{ gap: 10 }}>
        <Text style={s.forte}>Água</Text>
        <Campo rotulo="Meta diária" sufixo="litros" value={agua} onChangeText={setAgua} keyboardType="decimal-pad" />
      </Cartao>

      {erro && <Text style={{ color: cores.perigo }}>{erro}</Text>}
      <Botao titulo="Salvar metas" desabilitado={!!erro} onPress={salvar} />
    </ScrollView>
  );
}
