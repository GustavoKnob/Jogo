import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Botao, Campo, Cartao, s } from '../components/ui';
import { arred, lerNumero } from '../lib/calculos';
import { novoId } from '../lib/datas';
import { useDados } from '../lib/store';
import { cores } from '../lib/tema';
import type { Alimento } from '../lib/tipos';

/**
 * O usuário copia a tabela nutricional da embalagem (valores POR PORÇÃO)
 * e o app converte para 100 g.
 */
export default function CriarAlimento() {
  const p = useLocalSearchParams<{
    nome?: string;
    marca?: string;
    codigo?: string;
    aviso?: string;
    refeicao?: string;
    data?: string;
  }>();
  const { salvarMeuAlimento } = useDados();
  const [nome, setNome] = useState(p.nome ?? '');
  const [marca, setMarca] = useState(p.marca ?? '');
  const [codigo, setCodigo] = useState(p.codigo ?? '');
  const [porcaoDesc, setPorcaoDesc] = useState('1 porção');
  const [porcaoG, setPorcaoG] = useState('');
  const [kcal, setKcal] = useState('');
  const [carb, setCarb] = useState('');
  const [prot, setProt] = useState('');
  const [gord, setGord] = useState('');
  const [fibra, setFibra] = useState('');
  const [sodio, setSodio] = useState('');

  const gramas = lerNumero(porcaoG);
  const v = (t: string) => (t.trim() ? lerNumero(t) : 0);
  const erros = [
    !nome.trim() && 'Informe o nome.',
    !(gramas > 0) && 'Informe o tamanho da porção em gramas (ou ml).',
    !(lerNumero(kcal) >= 0) && 'Informe as calorias da porção.',
    [carb, prot, gord, fibra, sodio].some((t) => t.trim() && !(lerNumero(t) >= 0)) && 'Confira os números.',
  ].filter(Boolean) as string[];

  const salvar = () => {
    const f = 100 / gramas;
    const alimento: Alimento = {
      id: `meu-${novoId()}`,
      nome: nome.trim(),
      marca: marca.trim() || undefined,
      codigoBarras: codigo.replace(/\D/g, '') || undefined,
      origem: 'usuario',
      kcal: Math.round(lerNumero(kcal) * f),
      carb: arred(v(carb) * f),
      prot: arred(v(prot) * f),
      gord: arred(v(gord) * f),
      fibra: fibra.trim() ? arred(v(fibra) * f) : undefined,
      sodio: sodio.trim() ? Math.round(v(sodio) * f) : undefined,
      porcoes: [
        { descricao: porcaoDesc.trim() || '1 porção', gramas },
        { descricao: '100 g', gramas: 100 },
      ],
    };
    salvarMeuAlimento(alimento);
    router.replace({
      pathname: '/alimento/[id]',
      params: { id: alimento.id, refeicao: p.refeicao ?? '', data: p.data ?? '' },
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {p.aviso && (
        <Cartao style={{ backgroundColor: '#FFF6E0' }}>
          <Text style={{ color: cores.texto }}>{p.aviso}</Text>
        </Cartao>
      )}
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Iogurte natural" />
      <Campo rotulo="Marca (opcional)" value={marca} onChangeText={setMarca} />
      <Campo rotulo="Código de barras (opcional)" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" />

      <Text style={[s.forte, { marginTop: 8 }]}>Tabela nutricional (por porção)</Text>
      <Text style={s.suave}>Copie os valores da embalagem. O app converte para 100 g.</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Campo style={{ flex: 3 }} rotulo="Porção" value={porcaoDesc} onChangeText={setPorcaoDesc} placeholder="1 unidade" />
        <Campo style={{ flex: 2 }} rotulo="Tamanho" sufixo="g" value={porcaoG} onChangeText={setPorcaoG} keyboardType="decimal-pad" />
      </View>
      <Campo rotulo="Valor energético" sufixo="kcal" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Campo style={{ flex: 1 }} rotulo="Carboidratos" sufixo="g" value={carb} onChangeText={setCarb} keyboardType="decimal-pad" />
        <Campo style={{ flex: 1 }} rotulo="Proteínas" sufixo="g" value={prot} onChangeText={setProt} keyboardType="decimal-pad" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Campo style={{ flex: 1 }} rotulo="Gorduras totais" sufixo="g" value={gord} onChangeText={setGord} keyboardType="decimal-pad" />
        <Campo style={{ flex: 1 }} rotulo="Fibras" sufixo="g" value={fibra} onChangeText={setFibra} keyboardType="decimal-pad" />
      </View>
      <Campo rotulo="Sódio" sufixo="mg" value={sodio} onChangeText={setSodio} keyboardType="decimal-pad" />

      {erros.length > 0 && (nome || porcaoG || kcal) ? <Text style={{ color: cores.perigo }}>{erros[0]}</Text> : null}
      <Botao titulo="Salvar alimento" desabilitado={erros.length > 0} onPress={salvar} />
    </ScrollView>
  );
}
