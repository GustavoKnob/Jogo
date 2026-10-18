import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraficoBarras, GraficoLinha, Legenda } from '../../components/Graficos';
import { Botao, Cartao, Chips, s } from '../../components/ui';
import { formatarNumero } from '../../lib/calculos';
import { dataCurta, hoje, letraDia, paraDate, ultimosDias } from '../../lib/datas';
import { pesoAtual, resumoDia, useDados } from '../../lib/store';
import { cores } from '../../lib/tema';

type Periodo = '7' | '30' | '90';

export default function Progresso() {
  const { estado } = useDados();
  const [periodo, setPeriodo] = useState<Periodo>('7');
  const dias = ultimosDias(Number(periodo));
  const perfil = estado.perfil!;

  const resumos = dias.map((d) => ({ data: d, ...resumoDia(estado, d) }));
  const comRegistro = resumos.filter((r) => r.itens.length > 0);
  const media = (f: (r: (typeof resumos)[number]) => number) =>
    comRegistro.length ? comRegistro.reduce((t, r) => t + f(r), 0) / comRegistro.length : 0;
  const metaHoje = resumoDia(estado, hoje()).meta;

  const mediaKcal = media((r) => r.consumido.kcal);
  const mediaCarb = media((r) => r.consumido.carb);
  const mediaProt = media((r) => r.consumido.prot);
  const mediaGord = media((r) => r.consumido.gord);
  const kcalMacros = mediaCarb * 4 + mediaProt * 4 + mediaGord * 9;
  const pct = (g: number, f: number) => (kcalMacros > 0 ? Math.round(((g * f) / kcalMacros) * 100) : 0);

  // Peso
  const inicio = paraDate(dias[0]);
  // pesagens do período + a última anterior, para a linha começar no início do período
  const anteriores = estado.pesos.filter((p) => paraDate(p.data) < inicio);
  const pesosPeriodo = [...anteriores.slice(-1), ...estado.pesos.filter((p) => paraDate(p.data) >= inicio)];
  const pesosGrafico = pesosPeriodo.map((p) => ({
    rotulo: dataCurta(p.data),
    valor: p.kg,
  }));
  const atual = pesoAtual(estado);
  const variacao = atual - perfil.pesoInicial;
  const ultimo = estado.pesos.at(-1);
  const diasSemPesar = ultimo ? Math.round((paraDate(hoje()).getTime() - paraDate(ultimo.data).getTime()) / 86400000) : 999;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: cores.texto }}>Progresso</Text>
        <Chips<Periodo>
          opcoes={[
            { id: '7', nome: '7 dias' },
            { id: '30', nome: '30 dias' },
            { id: '90', nome: '90 dias' },
          ]}
          valor={periodo}
          onChange={setPeriodo}
        />

        <Cartao style={{ gap: 12 }}>
          <Text style={s.forte}>Calorias</Text>
          <View style={[s.linha, { gap: 24 }]}>
            <View>
              <Text style={s.suave}>Média por dia</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: cores.texto }}>{formatarNumero(mediaKcal)}</Text>
            </View>
            <View>
              <Text style={s.suave}>Meta</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: cores.textoSuave }}>{formatarNumero(metaHoje)}</Text>
            </View>
            <View>
              <Text style={s.suave}>Dias registrados</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: cores.textoSuave }}>
                {comRegistro.length}/{dias.length}
              </Text>
            </View>
          </View>
          <GraficoBarras
            meta={metaHoje}
            dados={resumos.map((r) => ({
              rotulo: periodo === '7' ? letraDia(r.data) : dataCurta(r.data),
              valor: r.consumido.kcal,
            }))}
          />
          <Text style={[s.suave, { fontSize: 12 }]}>Linha tracejada: meta. Barras laranja: acima da meta.</Text>
        </Cartao>

        <Cartao style={{ gap: 12 }}>
          <Text style={s.forte}>Macros (média dos dias registrados)</Text>
          {comRegistro.length === 0 ? (
            <Text style={s.suave}>Registre alimentos para ver seus macros.</Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' }}>
                <View style={{ flex: pct(mediaCarb, 4) || 0.0001, backgroundColor: cores.carb }} />
                <View style={{ flex: pct(mediaProt, 4) || 0.0001, backgroundColor: cores.prot }} />
                <View style={{ flex: pct(mediaGord, 9) || 0.0001, backgroundColor: cores.gord }} />
              </View>
              <View style={{ gap: 6 }}>
                <Legenda cor={cores.carb} texto={`Carboidratos: ${formatarNumero(mediaCarb)} g (${pct(mediaCarb, 4)}% · meta ${perfil.macros.carb}%)`} />
                <Legenda cor={cores.prot} texto={`Proteínas: ${formatarNumero(mediaProt)} g (${pct(mediaProt, 4)}% · meta ${perfil.macros.prot}%)`} />
                <Legenda cor={cores.gord} texto={`Gorduras: ${formatarNumero(mediaGord)} g (${pct(mediaGord, 9)}% · meta ${perfil.macros.gord}%)`} />
              </View>
            </>
          )}
        </Cartao>

        <Cartao style={{ gap: 12 }}>
          <Text style={s.forte}>Peso</Text>
          <View style={[s.linha, { gap: 24 }]}>
            <View>
              <Text style={s.suave}>Início</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: cores.texto }}>{formatarNumero(perfil.pesoInicial, 1)} kg</Text>
            </View>
            <View>
              <Text style={s.suave}>Atual</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: cores.texto }}>{formatarNumero(atual, 1)} kg</Text>
            </View>
            <View>
              <Text style={s.suave}>Variação</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: variacaoBoa(perfil.objetivo, variacao) ? cores.primaria : variacao === 0 ? cores.texto : cores.aviso,
                }}
              >
                {variacao > 0 ? '+' : ''}
                {formatarNumero(variacao, 1)} kg
              </Text>
            </View>
          </View>
          <GraficoLinha pontos={pesosGrafico} meta={perfil.objetivo !== 'manter' ? perfil.pesoMeta : undefined} />
          {diasSemPesar >= 7 && (
            <Text style={s.suave}>
              Você não registra seu peso há {diasSemPesar} dias. Pesar-se uma vez por semana ajuda a ajustar sua meta.
            </Text>
          )}
          <Botao titulo="Registrar peso" icone="scale-outline" variante="secundario" onPress={() => router.push('/peso')} />
        </Cartao>
      </ScrollView>
    </SafeAreaView>
  );
}

function variacaoBoa(objetivo: string, v: number) {
  if (objetivo === 'perder') return v < 0;
  if (objetivo === 'ganhar') return v > 0;
  return Math.abs(v) < 1;
}
