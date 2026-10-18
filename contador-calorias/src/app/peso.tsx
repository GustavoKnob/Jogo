import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Botao, BotaoIcone, Campo, Cartao, s } from '../components/ui';
import { formatarNumero, lerNumero } from '../lib/calculos';
import { dataCurta, hoje } from '../lib/datas';
import { pesoAtual, useDados } from '../lib/store';
import { cores } from '../lib/tema';

export default function RegistrarPeso() {
  const { estado, registrarPeso, removerPeso } = useDados();
  const [kg, setKg] = useState(formatarNumero(pesoAtual(estado), 1));
  const valor = lerNumero(kg);
  const valido = valor >= 30 && valor <= 350;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Campo rotulo="Peso de hoje" sufixo="kg" value={kg} onChangeText={setKg} keyboardType="decimal-pad" selectTextOnFocus autoFocus />
      <Text style={s.suave}>Dica: pese-se de manhã, em jejum, sempre na mesma balança.</Text>
      <Botao
        titulo="Salvar"
        desabilitado={!valido}
        onPress={() => {
          registrarPeso(hoje(), Math.round(valor * 10) / 10);
          router.back();
        }}
      />
      {estado.pesos.length > 0 && (
        <Cartao style={{ gap: 4 }}>
          <Text style={[s.forte, { marginBottom: 6 }]}>Histórico</Text>
          {[...estado.pesos].reverse().map((p) => (
            <View key={p.id} style={[s.linha, { gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: cores.borda }]}>
              <Text style={[s.suave, { width: 60 }]}>{dataCurta(p.data)}</Text>
              <Text style={[s.forte, { flex: 1 }]}>{formatarNumero(p.kg, 1)} kg</Text>
              {estado.pesos.length > 1 && (
                <BotaoIcone icone="trash-outline" rotulo="Apagar registro" tamanho={30} cor={cores.textoSuave} fundo="transparent" onPress={() => removerPeso(p.id)} />
              )}
            </View>
          ))}
        </Cartao>
      )}
    </ScrollView>
  );
}
