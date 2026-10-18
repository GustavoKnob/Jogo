import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { BotaoIcone, Chips, Ionicons, s, Vazio, type NomeIcone } from '../components/ui';
import { buscarAlimentos } from '../lib/busca';
import { formatarNumero, nutrientesDaPorcao } from '../lib/calculos';
import { lerData, lerRefeicao, recentes, REFEICOES, TACO, useDados } from '../lib/store';
import { cores, raio } from '../lib/tema';
import type { Alimento, RefeicaoId, RegistroAlimento } from '../lib/tipos';

type Aba = 'historico' | 'meus';

export default function Adicionar() {
  const params = useLocalSearchParams<{ refeicao?: RefeicaoId; data?: string; aba?: Aba }>();
  const { estado, registrarAlimento } = useDados();
  const [refeicao, setRefeicao] = useState<RefeicaoId>(lerRefeicao(params.refeicao));
  const [aba, setAba] = useState<Aba>(params.aba ?? 'historico');
  const [busca, setBusca] = useState('');
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());
  const data = lerData(params.data);

  const listaRecentes = useMemo(() => recentes(estado), [estado]);
  const idsRecentes = useMemo(
    () => new Set(listaRecentes.map((r) => r.alimentoId).filter(Boolean) as string[]),
    [listaRecentes],
  );
  const resultados = useMemo(
    () => buscarAlimentos(busca, [estado.meusAlimentos, TACO], idsRecentes),
    [busca, estado.meusAlimentos, idsRecentes],
  );

  const abrir = (id: string) => router.push({ pathname: '/alimento/[id]', params: { id, refeicao, data } });

  const marcar = (chave: string) => setAdicionados((x) => new Set(x).add(chave));

  const repetir = (r: RegistroAlimento) => {
    const { id: _id, criadoEm: _c, ...resto } = r;
    registrarAlimento({ ...resto, data, refeicao });
    marcar(`r:${r.id}`);
  };

  const adicionarPadrao = (a: Alimento) => {
    const porcao = a.porcoes[0];
    registrarAlimento({
      data,
      refeicao,
      alimentoId: a.id,
      nome: a.nome,
      detalhe: porcao.descricao === '100 g' ? '100 g' : `${porcao.descricao} (${formatarNumero(porcao.gramas)} g)`,
      gramas: porcao.gramas,
      porcao,
      quantidade: 1,
      ...nutrientesDaPorcao(a, porcao.gramas),
    });
    marcar(`a:${a.id}`);
  };

  const buscando = busca.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Chips<RefeicaoId> opcoes={REFEICOES} valor={refeicao} onChange={setRefeicao} rolar />
        <View style={[s.campo, { borderRadius: 24 }]}>
          <Ionicons name="search" size={20} color={cores.textoSuave} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar alimento (ex.: arroz, ovo, banana)"
            placeholderTextColor="#9AA5A0"
            style={[s.campoTexto, { marginLeft: 8 }]}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        {!buscando && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Atalho icone="barcode-outline" titulo="Código de barras" onPress={() => router.push({ pathname: '/scanner', params: { refeicao, data } })} />
            <Atalho icone="flash-outline" titulo="Adição rápida" onPress={() => router.push({ pathname: '/adicao-rapida', params: { refeicao, data } })} />
          </View>
        )}
        {!buscando && (
          <View style={[s.linha, { gap: 20 }]}>
            <AbaBotao ativo={aba === 'historico'} titulo="Histórico" onPress={() => setAba('historico')} />
            <AbaBotao ativo={aba === 'meus'} titulo="Meus alimentos" onPress={() => setAba('meus')} />
          </View>
        )}
      </View>

      {buscando ? (
        <FlatList
          data={resultados}
          keyExtractor={(a) => a.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
          ListEmptyComponent={
            <View style={{ gap: 12 }}>
              <Vazio icone="search-outline" texto={`Nada encontrado para "${busca}".`} />
              <Pressable onPress={() => router.push({ pathname: '/criar-alimento', params: { nome: busca, refeicao, data } })}>
                <Text style={{ color: cores.primaria, fontWeight: '700', textAlign: 'center' }}>+ Criar “{busca}”</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <LinhaAlimento
              titulo={item.nome}
              selo={item.origem}
              subtitulo={`${formatarNumero(nutrientesDaPorcao(item, item.porcoes[0].gramas).kcal)} kcal · ${item.porcoes[0].descricao}${item.marca ? ` · ${item.marca}` : ''}`}
              adicionado={adicionados.has(`a:${item.id}`)}
              onPress={() => abrir(item.id)}
              onAdicionar={() => adicionarPadrao(item)}
            />
          )}
        />
      ) : aba === 'historico' ? (
        <FlatList
          data={listaRecentes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
          ListHeaderComponent={listaRecentes.length ? <Text style={[s.forte, { fontSize: 17, marginBottom: 4 }]}>Registrados recentemente</Text> : undefined}
          ListEmptyComponent={<Vazio icone="time-outline" texto="O que você registrar aparece aqui para adicionar de novo com um toque." />}
          renderItem={({ item }) => (
            <LinhaAlimento
              titulo={item.nome}
              subtitulo={`${formatarNumero(item.kcal)} kcal · ${item.detalhe}`}
              adicionado={adicionados.has(`r:${item.id}`)}
              onPress={() => (item.alimentoId ? abrir(item.alimentoId) : repetir(item))}
              onAdicionar={() => repetir(item)}
            />
          )}
        />
      ) : (
        <FlatList
          data={estado.meusAlimentos}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
          ListHeaderComponent={
            <Pressable
              onPress={() => router.push({ pathname: '/criar-alimento', params: { refeicao, data } })}
              style={[s.linha, { gap: 8, paddingVertical: 8 }]}
            >
              <Ionicons name="add-circle" size={22} color={cores.primaria} />
              <Text style={{ color: cores.primaria, fontWeight: '700', fontSize: 16 }}>Criar alimento</Text>
            </Pressable>
          }
          ListEmptyComponent={<Vazio icone="nutrition-outline" texto="Alimentos que você criar ou escanear ficam salvos aqui." />}
          renderItem={({ item }) => (
            <LinhaAlimento
              titulo={item.nome}
              selo={item.origem}
              subtitulo={`${formatarNumero(nutrientesDaPorcao(item, item.porcoes[0].gramas).kcal)} kcal · ${item.porcoes[0].descricao}${item.marca ? ` · ${item.marca}` : ''}`}
              adicionado={adicionados.has(`a:${item.id}`)}
              onPress={() => abrir(item.id)}
              onAdicionar={() => adicionarPadrao(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function Atalho({ icone, titulo, onPress }: { icone: NomeIcone; titulo: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        backgroundColor: cores.cartao,
        borderRadius: raio.m,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icone} size={26} color={cores.primaria} />
      <Text style={{ color: cores.primariaEscura, fontWeight: '700' }}>{titulo}</Text>
    </Pressable>
  );
}

function AbaBotao({ ativo, titulo, onPress }: { ativo: boolean; titulo: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingBottom: 6, borderBottomWidth: 3, borderBottomColor: ativo ? cores.primaria : 'transparent' }}>
      <Text style={{ fontSize: 16, fontWeight: ativo ? '800' : '500', color: ativo ? cores.texto : cores.textoSuave }}>{titulo}</Text>
    </Pressable>
  );
}

const SELOS: Record<string, { texto: string; cor: string }> = {
  taco: { texto: 'TACO', cor: cores.primaria },
  off: { texto: 'Embalagem', cor: cores.prot },
  usuario: { texto: 'Meu', cor: cores.gord },
};

function LinhaAlimento({
  titulo,
  subtitulo,
  selo,
  adicionado,
  onPress,
  onAdicionar,
}: {
  titulo: string;
  subtitulo: string;
  selo?: string;
  adicionado: boolean;
  onPress: () => void;
  onAdicionar: () => void;
}) {
  const sl = selo ? SELOS[selo] : undefined;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.linha,
        { gap: 10, backgroundColor: cores.cartao, borderRadius: raio.m, padding: 14, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <View style={[s.linha, { gap: 6 }]}>
          <Text style={{ fontSize: 16, color: cores.texto, flexShrink: 1 }} numberOfLines={2}>
            {titulo}
          </Text>
          {sl && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: sl.cor,
                borderWidth: 1,
                borderColor: sl.cor,
                borderRadius: 6,
                paddingHorizontal: 4,
                overflow: 'hidden',
              }}
            >
              {sl.texto}
            </Text>
          )}
        </View>
        <Text style={s.suave} numberOfLines={1}>
          {subtitulo}
        </Text>
      </View>
      <BotaoIcone
        icone={adicionado ? 'checkmark' : 'add'}
        rotulo={`Adicionar ${titulo}`}
        cor={adicionado ? '#fff' : cores.primaria}
        fundo={adicionado ? cores.primaria : cores.primariaClara}
        tamanho={40}
        onPress={onAdicionar}
      />
    </Pressable>
  );
}
