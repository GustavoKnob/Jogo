import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Botao, Campo, Cartao, Ionicons, s } from '../components/ui';
import { EXERCICIOS, type Exercicio } from '../data/exercicios';
import { normalizar } from '../lib/busca';
import { formatarNumero, kcalExercicio, lerNumero } from '../lib/calculos';
import { rotuloData } from '../lib/datas';
import { lerData, pesoEm, useDados } from '../lib/store';
import { cores, raio } from '../lib/tema';

export default function AdicionarExercicio() {
  const p = useLocalSearchParams<{ data?: string }>();
  const data = lerData(p.data);
  const { estado, registrarExercicio } = useDados();
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<Exercicio | null>(null);
  const [personalizado, setPersonalizado] = useState(false);
  const [minutos, setMinutos] = useState('30');
  const [nome, setNome] = useState('');
  const [kcalManual, setKcalManual] = useState('');
  const peso = pesoEm(estado, data);

  const lista = useMemo(() => {
    const t = normalizar(busca);
    return t ? EXERCICIOS.filter((e) => normalizar(e.nome).includes(t)) : EXERCICIOS;
  }, [busca]);

  const min = lerNumero(minutos);
  const kcal = personalizado ? lerNumero(kcalManual) : escolhido && min > 0 ? kcalExercicio(escolhido.met, peso, min) : 0;
  const valido = min > 0 && min <= 1440 && kcal > 0 && (!personalizado || nome.trim());

  const salvar = () => {
    registrarExercicio({
      data,
      nome: personalizado ? nome.trim() : escolhido!.nome,
      minutos: Math.round(min),
      kcal: Math.round(kcal),
    });
    router.back();
  };

  if (escolhido || personalizado) {
    return (
      <View style={{ padding: 16, gap: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: cores.texto }}>
          {personalizado ? 'Exercício personalizado' : escolhido!.nome}
        </Text>
        <Text style={s.suave}>{rotuloData(data)}</Text>
        {personalizado && <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Aula de dança" />}
        <Campo rotulo="Duração" sufixo="min" value={minutos} onChangeText={setMinutos} keyboardType="number-pad" selectTextOnFocus />
        {personalizado ? (
          <Campo rotulo="Calorias gastas" sufixo="kcal" value={kcalManual} onChangeText={setKcalManual} keyboardType="number-pad" />
        ) : (
          <Cartao style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 40, fontWeight: '800', color: cores.exercicio }}>{formatarNumero(kcal)}</Text>
            <Text style={s.suave}>kcal estimadas</Text>
            <Text style={[s.suave, { fontSize: 12, marginTop: 6, textAlign: 'center' }]}>
              MET {formatarNumero(escolhido!.met, 1)} × {formatarNumero(peso, 1)} kg × {formatarNumero(min > 0 ? min / 60 : 0, 2)} h
            </Text>
          </Cartao>
        )}
        {estado.perfil!.fatorExercicio < 1 && kcal > 0 && (
          <Text style={s.suave}>
            Pela sua configuração, {Math.round(estado.perfil!.fatorExercicio * 100)}% disso ({formatarNumero(kcal * estado.perfil!.fatorExercicio)} kcal) volta para o seu saldo do dia.
          </Text>
        )}
        <Botao titulo="Adicionar exercício" desabilitado={!valido} onPress={salvar} />
        <Botao titulo="Escolher outro" variante="texto" onPress={() => { setEscolhido(null); setPersonalizado(false); }} />
      </View>
    );
  }

  return (
    <FlatList
      data={lista}
      keyExtractor={(e) => e.nome}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 6 }}>
          <View style={[s.campo, { borderRadius: 24 }]}>
            <Ionicons name="search" size={20} color={cores.textoSuave} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar exercício"
              placeholderTextColor="#9AA5A0"
              style={[s.campoTexto, { marginLeft: 8 }]}
            />
          </View>
          <Pressable onPress={() => setPersonalizado(true)} style={[s.linha, { gap: 8, paddingVertical: 6 }]}>
            <Ionicons name="create-outline" size={20} color={cores.primaria} />
            <Text style={{ color: cores.primaria, fontWeight: '700' }}>Informar calorias manualmente</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => setEscolhido(item)}
          style={({ pressed }) => [
            s.linha,
            { backgroundColor: cores.cartao, borderRadius: raio.m, padding: 14, gap: 10, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={{ flex: 1, fontSize: 16, color: cores.texto }}>{item.nome}</Text>
          <Text style={s.suave}>~{formatarNumero(kcalExercicio(item.met, peso, 30))} kcal/30 min</Text>
        </Pressable>
      )}
    />
  );
}
