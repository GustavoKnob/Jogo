import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Botao, Campo, s } from '../components/ui';
import { buscarPorCodigo } from '../lib/openFoodFacts';
import { useDados } from '../lib/store';
import { cores } from '../lib/tema';

export default function Scanner() {
  const p = useLocalSearchParams<{ refeicao?: string; data?: string }>();
  const { estado, salvarMeuAlimento } = useDados();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [codigoManual, setCodigoManual] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const travado = useRef(false);

  const procurar = async (codigo: string) => {
    codigo = codigo.replace(/\D/g, '');
    if (travado.current || codigo.length < 8) return;
    travado.current = true;
    setBuscando(true);
    setStatus(`Procurando ${codigo}…`);

    const params = { refeicao: p.refeicao ?? '', data: p.data ?? '' };
    // 1. Já está salvo no aparelho?
    const local = estado.meusAlimentos.find((a) => a.codigoBarras === codigo);
    if (local) {
      router.replace({ pathname: '/alimento/[id]', params: { id: local.id, ...params } });
      return;
    }
    // 2. Open Food Facts
    const r = await buscarPorCodigo(codigo);
    setBuscando(false);
    if (r.tipo === 'encontrado') {
      salvarMeuAlimento(r.alimento);
      router.replace({ pathname: '/alimento/[id]', params: { id: r.alimento.id, ...params } });
      return;
    }
    if (r.tipo === 'erro') {
      setStatus(`${r.mensagem}. Tente de novo ou cadastre o produto.`);
      travado.current = false;
      return;
    }
    // 3. Não achou: usuário cadastra com a tabela nutricional da embalagem
    router.replace({
      pathname: '/criar-alimento',
      params: {
        codigo,
        nome: r.tipo === 'sem_nutrientes' ? r.nome ?? '' : '',
        marca: r.tipo === 'sem_nutrientes' ? r.marca ?? '' : '',
        aviso: 'Produto não encontrado. Cadastre usando a tabela nutricional da embalagem.',
        ...params,
      },
    });
  };

  const aoLer = (r: BarcodeScanningResult) => procurar(r.data);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {permissao?.granted ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={buscando ? undefined : aoLer}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: '80%', height: 160, borderWidth: 3, borderColor: '#fff', borderRadius: 16 }} />
            <Text style={{ color: '#fff', marginTop: 16, fontSize: 16, fontWeight: '600' }}>
              Aponte para o código de barras
            </Text>
          </View>
        </CameraView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
            {permissao && !permissao.canAskAgain
              ? 'A câmera está bloqueada. Libere nas configurações do celular ou digite o código abaixo.'
              : 'Precisamos da câmera para ler o código de barras da embalagem.'}
          </Text>
          {permissao?.canAskAgain !== false && <Botao titulo="Permitir câmera" icone="camera-outline" onPress={pedirPermissao} />}
        </View>
      )}

      <View style={{ backgroundColor: cores.fundo, padding: 16, gap: 10 }}>
        {status && (
          <View style={[s.linha, { gap: 8 }]}>
            {buscando && <ActivityIndicator color={cores.primaria} />}
            <Text style={[s.suave, { flex: 1 }]}>{status}</Text>
          </View>
        )}
        <View style={[s.linha, { gap: 8 }]}>
          <Campo
            style={{ flex: 1 }}
            value={codigoManual}
            onChangeText={setCodigoManual}
            placeholder="Ou digite o código (ex.: 7891000100103)"
            keyboardType="number-pad"
            onSubmitEditing={() => procurar(codigoManual)}
          />
          <Botao titulo="Buscar" onPress={() => procurar(codigoManual)} desabilitado={codigoManual.replace(/\D/g, '').length < 8 || buscando} />
        </View>
        <Botao titulo="Cancelar" variante="texto" onPress={() => router.back()} />
        {Platform.OS === 'web' && (
          <Text style={[s.suave, { fontSize: 12 }]}>No navegador a leitura pela câmera pode não funcionar; digite o código.</Text>
        )}
      </View>
    </View>
  );
}
