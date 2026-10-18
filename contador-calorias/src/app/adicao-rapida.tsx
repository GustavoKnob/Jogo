import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Botao, Campo, Chips, s } from '../components/ui';
import { lerNumero } from '../lib/calculos';
import { lerData, lerRefeicao, REFEICOES, useDados } from '../lib/store';
import type { RefeicaoId } from '../lib/tipos';

export default function AdicaoRapida() {
  const p = useLocalSearchParams<{ refeicao?: RefeicaoId; data?: string }>();
  const { registrarAlimento } = useDados();
  const [refeicao, setRefeicao] = useState<RefeicaoId>(lerRefeicao(p.refeicao));
  const [nome, setNome] = useState('');
  const [kcal, setKcal] = useState('');
  const [carb, setCarb] = useState('');
  const [prot, setProt] = useState('');
  const [gord, setGord] = useState('');

  const g = (t: string) => (t.trim() ? lerNumero(t) : 0);
  const macrosKcal = g(carb) * 4 + g(prot) * 4 + g(gord) * 9;
  const kcalNum = kcal.trim() ? lerNumero(kcal) : Math.round(macrosKcal);
  const valido = kcalNum > 0 && [carb, prot, gord].every((t) => !t.trim() || lerNumero(t) >= 0);

  const salvar = () => {
    registrarAlimento({
      data: lerData(p.data),
      refeicao,
      nome: nome.trim() || 'Adição rápida',
      detalhe: 'Adição rápida',
      kcal: Math.round(kcalNum),
      carb: g(carb),
      prot: g(prot),
      gord: g(gord),
    });
    router.dismissTo('/');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Text style={s.suave}>Para quando você já sabe as calorias ou não achou o alimento.</Text>
      <Chips<RefeicaoId> opcoes={REFEICOES} valor={refeicao} onChange={setRefeicao} rolar />
      <Campo rotulo="Descrição (opcional)" value={nome} onChangeText={setNome} placeholder="Ex.: Prato feito do restaurante" />
      <Campo
        rotulo="Calorias"
        sufixo="kcal"
        value={kcal}
        onChangeText={setKcal}
        keyboardType="number-pad"
        placeholder={macrosKcal > 0 ? `${Math.round(macrosKcal)} (calculado)` : '0'}
      />
      <Text style={s.forte}>Macros (opcional)</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Campo style={{ flex: 1 }} rotulo="Carb" sufixo="g" value={carb} onChangeText={setCarb} keyboardType="decimal-pad" />
        <Campo style={{ flex: 1 }} rotulo="Prot" sufixo="g" value={prot} onChangeText={setProt} keyboardType="decimal-pad" />
        <Campo style={{ flex: 1 }} rotulo="Gord" sufixo="g" value={gord} onChangeText={setGord} keyboardType="decimal-pad" />
      </View>
      <Botao titulo="Adicionar" desabilitado={!valido} onPress={salvar} />
    </ScrollView>
  );
}
