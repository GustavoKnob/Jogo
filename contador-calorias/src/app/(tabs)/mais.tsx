import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cartao, Ionicons, s, type NomeIcone } from '../../components/ui';
import { formatarNumero } from '../../lib/calculos';
import { pesoAtual, resumoDia, sequencia, useDados } from '../../lib/store';
import { cores } from '../../lib/tema';
import { hoje } from '../../lib/datas';

export default function Mais() {
  const { estado, apagarTudo } = useDados();
  const perfil = estado.perfil!;
  const atual = pesoAtual(estado);
  const variacao = atual - perfil.pesoInicial;
  const meta = resumoDia(estado, hoje()).meta;

  const exportar = async () => {
    const json = JSON.stringify(estado, null, 2);
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `rango-${hoje()}.json`;
      a.click();
      return;
    }
    await Share.share({ message: json, title: 'Meus dados do Rango' });
  };

  const apagar = () => {
    const msg = 'Isso apaga perfil, diário, pesos e alimentos criados. Não dá para desfazer.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Apagar todos os dados?\n${msg}`)) apagarTudo();
      return;
    }
    Alert.alert('Apagar todos os dados?', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: apagarTudo },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: cores.texto }}>Mais</Text>

        <Cartao style={{ alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: cores.primariaClara,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: '800', color: cores.primaria }}>
              {(perfil.nome || 'R').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[s.forte, { fontSize: 20 }]}>{perfil.nome || 'Você'}</Text>
          <View style={[s.linha, { gap: 28, marginTop: 6 }]}>
            <Info valor={String(sequencia(estado))} rotulo="dias seguidos" />
            <Info valor={`${variacao > 0 ? '+' : ''}${formatarNumero(variacao, 1)} kg`} rotulo="desde o início" />
            <Info valor={formatarNumero(meta)} rotulo="kcal/dia" />
          </View>
        </Cartao>

        <Cartao style={{ paddingVertical: 4 }}>
          <Item icone="person-outline" titulo="Meu perfil e objetivo" onPress={() => router.push({ pathname: '/onboarding', params: { editar: '1' } })} />
          <Item icone="flag-outline" titulo="Metas de calorias, macros e água" onPress={() => router.push('/metas')} />
          <Item icone="scale-outline" titulo="Registrar peso" onPress={() => router.push('/peso')} />
          <Item icone="nutrition-outline" titulo="Meus alimentos" onPress={() => router.push({ pathname: '/adicionar', params: { aba: 'meus' } })} />
          <Item icone="barbell-outline" titulo="Adicionar exercício" onPress={() => router.push('/exercicio')} ultimo />
        </Cartao>

        <Cartao style={{ paddingVertical: 4 }}>
          <Item icone="download-outline" titulo="Exportar meus dados" onPress={exportar} />
          <Item icone="information-circle-outline" titulo="Sobre e fontes dos dados" onPress={() => router.push('/sobre')} />
          <Item icone="trash-outline" titulo="Apagar todos os dados" cor={cores.perigo} onPress={apagar} ultimo />
        </Cartao>

        <Text style={[s.suave, { textAlign: 'center', fontSize: 12 }]}>
          Rango 1.0 · seus dados ficam só no seu celular
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[s.forte, { fontSize: 18 }]}>{valor}</Text>
      <Text style={[s.suave, { fontSize: 12 }]}>{rotulo}</Text>
    </View>
  );
}

function Item({
  icone,
  titulo,
  onPress,
  cor = cores.texto,
  ultimo,
}: {
  icone: NomeIcone;
  titulo: string;
  onPress: () => void;
  cor?: string;
  ultimo?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.linha,
        {
          gap: 14,
          paddingVertical: 14,
          borderBottomWidth: ultimo ? 0 : 1,
          borderBottomColor: cores.borda,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icone} size={22} color={cor === cores.texto ? cores.textoSuave : cor} />
      <Text style={{ flex: 1, fontSize: 16, color: cor }}>{titulo}</Text>
      <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
    </Pressable>
  );
}
