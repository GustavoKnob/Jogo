import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Botao, Campo, Cartao, Chips, s, Vazio } from '../../components/ui';
import { descreverPorcao, formatarNumero, lerNumero, nutrientesDaPorcao } from '../../lib/calculos';
import { rotuloData } from '../../lib/datas';
import { buscarAlimentoPorId, lerData, lerRefeicao, nomeRefeicao, REFEICOES, useDados } from '../../lib/store';
import { cores } from '../../lib/tema';
import type { RefeicaoId } from '../../lib/tipos';

const ORIGENS = {
  taco: 'Tabela TACO (UNICAMP) · valores de referência',
  off: 'Open Food Facts · dados da embalagem informados pela comunidade',
  usuario: 'Criado por você',
};

export default function DetalheAlimento() {
  const p = useLocalSearchParams<{ id: string; refeicao?: RefeicaoId; data?: string }>();
  const { estado, registrarAlimento } = useDados();
  const alimento = buscarAlimentoPorId(estado, p.id);
  const [refeicao, setRefeicao] = useState<RefeicaoId>(lerRefeicao(p.refeicao));
  const [indice, setIndice] = useState(0);
  const [qtdTexto, setQtdTexto] = useState('1');
  const data = lerData(p.data);

  if (!alimento) return <Vazio icone="alert-circle-outline" texto="Alimento não encontrado." />;

  const porcao = alimento.porcoes[indice] ?? alimento.porcoes[0];
  const qtd = lerNumero(qtdTexto);
  const valido = qtd > 0 && qtd < 10000;
  const gramas = valido ? porcao.gramas * qtd : 0;
  const n = nutrientesDaPorcao(alimento, gramas);
  const kcalMacros = n.carb * 4 + n.prot * 4 + n.gord * 9;
  const pct = (g: number, f: number) => (kcalMacros > 0 ? Math.round(((g * f) / kcalMacros) * 100) : 0);

  const adicionar = () => {
    registrarAlimento({
      data,
      refeicao,
      alimentoId: alimento.id,
      nome: alimento.nome,
      detalhe: descreverPorcao(porcao, qtd),
      gramas,
      porcao,
      quantidade: qtd,
      ...n,
    });
    router.dismissTo('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: alimento.marca ?? 'Alimento' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 24, fontWeight: '800', color: cores.texto }}>{alimento.nome}</Text>
        <Text style={s.suave}>{ORIGENS[alimento.origem]}</Text>

        <Cartao style={{ gap: 14 }}>
          <Text style={s.forte}>Porção</Text>
          <Chips
            opcoes={alimento.porcoes.map((po, i) => ({
              id: String(i),
              nome: po.descricao === '100 g' ? '100 g' : `${po.descricao} (${formatarNumero(po.gramas)} g)`,
            }))}
            valor={String(indice)}
            onChange={(v) => setIndice(Number(v))}
          />
          <Campo
            rotulo={porcao.descricao === '100 g' ? 'Quantidade (× 100 g)' : 'Quantidade'}
            value={qtdTexto}
            onChangeText={setQtdTexto}
            keyboardType="decimal-pad"
            selectTextOnFocus
            sufixo={valido ? `= ${formatarNumero(gramas)} g` : undefined}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['0,5', '1', '1,5', '2', '3'].map((q) => (
              <Botao key={q} titulo={q} variante={qtdTexto === q ? 'primario' : 'secundario'} onPress={() => setQtdTexto(q)} style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 0 }} />
            ))}
          </View>
        </Cartao>

        <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ alignItems: 'center', minWidth: 90 }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: cores.primaria }}>{formatarNumero(n.kcal)}</Text>
            <Text style={s.suave}>kcal</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <LinhaMacro cor={cores.carb} nome="Carboidratos" g={n.carb} pct={pct(n.carb, 4)} />
            <LinhaMacro cor={cores.prot} nome="Proteínas" g={n.prot} pct={pct(n.prot, 4)} />
            <LinhaMacro cor={cores.gord} nome="Gorduras" g={n.gord} pct={pct(n.gord, 9)} />
          </View>
        </Cartao>

        <Cartao style={{ gap: 10 }}>
          <Text style={s.forte}>Adicionar em · {rotuloData(data)}</Text>
          <Chips<RefeicaoId> opcoes={REFEICOES} valor={refeicao} onChange={setRefeicao} rolar />
        </Cartao>

        <Botao titulo={`Adicionar ao ${nomeRefeicao(refeicao)}`} icone="add-circle-outline" desabilitado={!valido} onPress={adicionar} />

        <Cartao style={{ gap: 6 }}>
          <Text style={s.forte}>Informação nutricional (100 g)</Text>
          <Tabela rotulo="Energia" valor={`${formatarNumero(alimento.kcal)} kcal`} />
          <Tabela rotulo="Carboidratos" valor={`${formatarNumero(alimento.carb, 1)} g`} />
          <Tabela rotulo="Proteínas" valor={`${formatarNumero(alimento.prot, 1)} g`} />
          <Tabela rotulo="Gorduras totais" valor={`${formatarNumero(alimento.gord, 1)} g`} />
          {alimento.fibra !== undefined && <Tabela rotulo="Fibras" valor={`${formatarNumero(alimento.fibra, 1)} g`} />}
          {alimento.sodio !== undefined && <Tabela rotulo="Sódio" valor={`${formatarNumero(alimento.sodio)} mg`} />}
          {alimento.codigoBarras && <Tabela rotulo="Código de barras" valor={alimento.codigoBarras} />}
        </Cartao>
      </ScrollView>
    </>
  );
}

function LinhaMacro({ cor, nome, g, pct }: { cor: string; nome: string; g: number; pct: number }) {
  return (
    <View style={[s.linha, { gap: 8 }]}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor }} />
      <Text style={[s.suave, { flex: 1 }]}>{nome}</Text>
      <Text style={s.forte}>{formatarNumero(g, 1)} g</Text>
      <Text style={[s.suave, { width: 40, textAlign: 'right' }]}>{pct}%</Text>
    </View>
  );
}

function Tabela({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={[s.linha, { justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: cores.borda }]}>
      <Text style={s.suave}>{rotulo}</Text>
      <Text style={{ color: cores.texto }}>{valor}</Text>
    </View>
  );
}
