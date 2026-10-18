import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Anel } from '../../components/Graficos';
import { Barra, BotaoIcone, Cartao, Ionicons, s } from '../../components/ui';
import { formatarNumero, somar } from '../../lib/calculos';
import { hoje, letraDia, paraDate, rotuloData, semanaDe, somarDias } from '../../lib/datas';
import { diasComRegistro, refeicaoDoMomento, REFEICOES, resumoDia, sequencia, useDados } from '../../lib/store';
import { cores } from '../../lib/tema';
import type { RefeicaoId } from '../../lib/tipos';

const COPO = 250;

function confirmar(titulo: string, msg: string, ok: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n${msg}`)) ok();
    return;
  }
  Alert.alert(titulo, msg, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: ok },
  ]);
}

export default function Hoje() {
  const { estado, removerAlimento, removerExercicio, definirAgua } = useDados();
  const [data, setData] = useState(hoje());
  const r = resumoDia(estado, data);
  const registrados = diasComRegistro(estado);
  const seq = sequencia(estado);
  const semana = semanaDe(data);

  const abrirAdicionar = (refeicao: RefeicaoId) =>
    router.push({ pathname: '/adicionar', params: { refeicao, data } });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {/* Cabeçalho com data */}
        <View style={[s.linha, { justifyContent: 'space-between' }]}>
          <View style={[s.linha, { gap: 4 }]}>
            <BotaoIcone icone="chevron-back" rotulo="Dia anterior" fundo="transparent" onPress={() => setData(somarDias(data, -1))} />
            <Pressable onPress={() => setData(hoje())}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: cores.texto }}>{rotuloData(data)}</Text>
            </Pressable>
            <BotaoIcone icone="chevron-forward" rotulo="Próximo dia" fundo="transparent" onPress={() => setData(somarDias(data, 1))} />
          </View>
          <View style={[s.linha, { gap: 4, backgroundColor: '#FFF1E6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }]}>
            <Ionicons name="flame" size={18} color={seq > 0 ? cores.exercicio : cores.textoSuave} />
            <Text style={{ fontWeight: '700', color: cores.texto }}>{seq}</Text>
          </View>
        </View>

        {/* Semana */}
        <View style={[s.linha, { justifyContent: 'space-between', paddingHorizontal: 4 }]}>
          {semana.map((d) => {
            const sel = d === data;
            const feito = registrados.has(d);
            return (
              <Pressable key={d} onPress={() => setData(d)} style={{ alignItems: 'center', gap: 4, minWidth: 36 }}>
                <Text style={{ fontSize: 12, fontWeight: sel ? '800' : '500', color: sel ? cores.texto : cores.textoSuave }}>
                  {letraDia(d)}
                </Text>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: sel ? cores.primaria : feito ? cores.primaria : cores.borda,
                    backgroundColor: feito ? cores.primaria : 'transparent',
                    borderStyle: d === hoje() && !feito ? 'dashed' : 'solid',
                  }}
                >
                  {feito ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 12, color: cores.textoSuave }}>{paraDate(d).getDate()}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Calorias */}
        <Cartao style={{ gap: 12 }}>
          <Text style={s.forte}>Calorias</Text>
          <View style={[s.linha, { gap: 16 }]}>
            <Anel valor={r.consumido.kcal} total={r.meta + r.bonusExercicio} tamanho={116}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: r.restante < 0 ? cores.perigo : cores.texto }}>
                {formatarNumero(Math.abs(r.restante))}
              </Text>
              <Text style={[s.suave, { fontSize: 12 }]}>{r.restante < 0 ? 'acima' : 'restantes'}</Text>
            </Anel>
            <View style={{ flex: 1, gap: 10 }}>
              <ItemConta icone="flag-outline" cor={cores.textoSuave} rotulo="Meta" valor={r.meta} />
              <ItemConta icone="restaurant-outline" cor={cores.primaria} rotulo="Alimentos" valor={r.consumido.kcal} sinal="−" />
              <ItemConta icone="flame-outline" cor={cores.exercicio} rotulo="Exercícios" valor={r.bonusExercicio} sinal="+" />
            </View>
          </View>
        </Cartao>

        {/* Macros */}
        <Cartao style={{ flexDirection: 'row', gap: 14 }}>
          <Macro nome="Carboidratos" valor={r.consumido.carb} meta={r.macros.carb} cor={cores.carb} />
          <Macro nome="Proteínas" valor={r.consumido.prot} meta={r.macros.prot} cor={cores.prot} />
          <Macro nome="Gorduras" valor={r.consumido.gord} meta={r.macros.gord} cor={cores.gord} />
        </Cartao>

        {/* Refeições */}
        <Text style={[s.forte, { fontSize: 20, marginTop: 8 }]}>Refeições</Text>
        {REFEICOES.map((ref) => {
          const itens = r.itens.filter((i) => i.refeicao === ref.id);
          const total = somar(itens);
          return (
            <Cartao key={ref.id} style={{ gap: 10 }}>
              <View style={[s.linha, { justifyContent: 'space-between' }]}>
                <View>
                  <Text style={[s.forte, { fontSize: 17 }]}>{ref.nome}</Text>
                  {itens.length > 0 && <Text style={s.suave}>{formatarNumero(total.kcal)} kcal</Text>}
                </View>
                <BotaoIcone icone="add" rotulo={`Adicionar em ${ref.nome}`} onPress={() => abrirAdicionar(ref.id)} />
              </View>
              {itens.map((i) => (
                <Pressable
                  key={i.id}
                  onLongPress={() => confirmar('Remover alimento', i.nome, () => removerAlimento(i.id))}
                  style={[s.linha, { gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: cores.borda }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: cores.texto, fontSize: 15 }} numberOfLines={1}>
                      {i.nome}
                    </Text>
                    <Text style={[s.suave, { fontSize: 13 }]} numberOfLines={1}>
                      {i.detalhe}
                    </Text>
                  </View>
                  <Text style={s.forte}>{formatarNumero(i.kcal)}</Text>
                  <BotaoIcone
                    icone="close"
                    tamanho={28}
                    cor={cores.textoSuave}
                    fundo="transparent"
                    rotulo={`Remover ${i.nome}`}
                    onPress={() => confirmar('Remover alimento', i.nome, () => removerAlimento(i.id))}
                  />
                </Pressable>
              ))}
            </Cartao>
          );
        })}

        {/* Exercícios */}
        <Cartao style={{ gap: 10 }}>
          <View style={[s.linha, { justifyContent: 'space-between' }]}>
            <View>
              <Text style={[s.forte, { fontSize: 17 }]}>Exercícios</Text>
              {r.exercicios.length > 0 && <Text style={s.suave}>{formatarNumero(r.kcalExercicio)} kcal gastas</Text>}
            </View>
            <BotaoIcone
              icone="add"
              rotulo="Adicionar exercício"
              cor={cores.exercicio}
              fundo="#FDEBE2"
              onPress={() => router.push({ pathname: '/exercicio', params: { data } })}
            />
          </View>
          {r.exercicios.map((x) => (
            <View key={x.id} style={[s.linha, { gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: cores.borda }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: cores.texto, fontSize: 15 }}>{x.nome}</Text>
                <Text style={[s.suave, { fontSize: 13 }]}>{x.minutos} min</Text>
              </View>
              <Text style={s.forte}>{formatarNumero(x.kcal)}</Text>
              <BotaoIcone
                icone="close"
                tamanho={28}
                cor={cores.textoSuave}
                fundo="transparent"
                rotulo={`Remover ${x.nome}`}
                onPress={() => confirmar('Remover exercício', x.nome, () => removerExercicio(x.id))}
              />
            </View>
          ))}
        </Cartao>

        {/* Água */}
        <Cartao style={{ gap: 10 }}>
          <View style={[s.linha, { justifyContent: 'space-between' }]}>
            <View>
              <Text style={[s.forte, { fontSize: 17 }]}>Água</Text>
              <Text style={s.suave}>
                {formatarNumero(r.agua / 1000, 2)} de {formatarNumero(estado.perfil!.aguaMetaMl / 1000, 2)} L
              </Text>
            </View>
            <View style={[s.linha, { gap: 8 }]}>
              <BotaoIcone icone="remove" rotulo="Tirar um copo" cor={cores.agua} fundo="#E3F3FB" onPress={() => definirAgua(data, r.agua - COPO)} />
              <BotaoIcone icone="add" rotulo="Adicionar um copo" cor={cores.agua} fundo="#E3F3FB" onPress={() => definirAgua(data, r.agua + COPO)} />
            </View>
          </View>
          <View style={[s.linha, { flexWrap: 'wrap', gap: 6 }]}>
            {Array.from({ length: Math.max(Math.ceil(estado.perfil!.aguaMetaMl / COPO), Math.ceil(r.agua / COPO)) }, (_, i) => (
              <Ionicons key={i} name={i < r.agua / COPO ? 'water' : 'water-outline'} size={22} color={cores.agua} />
            ))}
          </View>
        </Cartao>

        <Text style={[s.suave, { textAlign: 'center', fontSize: 12 }]}>Toque e segure um alimento para removê-lo.</Text>
      </ScrollView>

      {/* Botão flutuante */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar alimento"
        onPress={() => abrirAdicionar(data === hoje() ? refeicaoDoMomento() : 'almoco')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: cores.primaria,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

function ItemConta({ icone, cor, rotulo, valor, sinal }: { icone: any; cor: string; rotulo: string; valor: number; sinal?: string }) {
  return (
    <View style={[s.linha, { gap: 8 }]}>
      <Ionicons name={icone} size={18} color={cor} />
      <Text style={[s.suave, { flex: 1 }]}>{rotulo}</Text>
      <Text style={s.forte}>
        {sinal && valor > 0 ? `${sinal} ` : ''}
        {formatarNumero(valor)}
      </Text>
    </View>
  );
}

function Macro({ nome, valor, meta, cor }: { nome: string; valor: number; meta: number; cor: string }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[s.suave, { fontSize: 13 }]}>{nome}</Text>
      <Text style={s.forte}>
        {formatarNumero(valor)}
        <Text style={[s.suave, { fontWeight: '400' }]}> / {meta} g</Text>
      </Text>
      <Barra valor={valor} total={meta} cor={cor} />
    </View>
  );
}
