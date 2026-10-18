import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { cores, raio } from '../lib/tema';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];
export { Ionicons };

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.cartao, style]}>{children}</View>;
}

export function Titulo({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[s.titulo, style]}>{children}</Text>;
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  desabilitado,
  style,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'texto' | 'perigo';
  icone?: NomeIcone;
  desabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const corTexto =
    variante === 'primario' ? '#fff' : variante === 'perigo' ? cores.perigo : cores.primariaEscura;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        s.botao,
        variante === 'primario' && { backgroundColor: cores.primaria },
        variante === 'secundario' && { backgroundColor: cores.primariaClara },
        variante === 'perigo' && { backgroundColor: '#FDECEA' },
        variante === 'texto' && { backgroundColor: 'transparent', paddingHorizontal: 8 },
        desabilitado && { opacity: 0.4 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {icone && <Ionicons name={icone} size={20} color={corTexto} />}
      <Text style={[s.botaoTexto, { color: corTexto }]}>{titulo}</Text>
    </Pressable>
  );
}

export function BotaoIcone({
  icone,
  onPress,
  cor = cores.primaria,
  fundo = cores.primariaClara,
  tamanho = 36,
  rotulo,
}: {
  icone: NomeIcone;
  onPress: () => void;
  cor?: string;
  fundo?: string;
  tamanho?: number;
  rotulo: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: fundo },
        s.centro,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icone} size={tamanho * 0.55} color={cor} />
    </Pressable>
  );
}

export function Barra({ valor, total, cor = cores.primaria }: { valor: number; total: number; cor?: string }) {
  const pct = total > 0 ? Math.min(valor / total, 1) : 0;
  const passou = total > 0 && valor > total;
  return (
    <View style={s.barraFundo}>
      <View style={[s.barra, { width: `${pct * 100}%`, backgroundColor: passou ? cores.perigo : cor }]} />
    </View>
  );
}

export function Campo({
  rotulo,
  sufixo,
  style,
  ...props
}: TextInputProps & { rotulo?: string; sufixo?: string }) {
  return (
    <View style={style as StyleProp<ViewStyle>}>
      {rotulo && <Text style={s.rotulo}>{rotulo}</Text>}
      <View style={s.campo}>
        <TextInput placeholderTextColor="#9AA5A0" style={s.campoTexto} {...props} />
        {sufixo && <Text numberOfLines={1} style={s.sufixo}>{sufixo}</Text>}
      </View>
    </View>
  );
}

export function Chips<T extends string>({
  opcoes,
  valor,
  onChange,
  rolar,
}: {
  opcoes: { id: T; nome: string }[];
  valor: T;
  onChange: (v: T) => void;
  /** Uma linha só, com rolagem lateral. */
  rolar?: boolean;
}) {
  const Recipiente = rolar ? ScrollView : View;
  return (
    <Recipiente
      {...(rolar
        ? { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: { gap: 8 }, style: { flexGrow: 0 } }
        : { style: s.chips })}
    >
      {opcoes.map((o) => {
        const ativo = o.id === valor;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[s.chip, ativo && { backgroundColor: cores.primaria, borderColor: cores.primaria }]}
          >
            <Text style={[s.chipTexto, ativo && { color: '#fff' }]}>{o.nome}</Text>
          </Pressable>
        );
      })}
    </Recipiente>
  );
}

export function Vazio({ icone, texto }: { icone: NomeIcone; texto: string }) {
  return (
    <View style={[s.centro, { paddingVertical: 32, gap: 8 }]}>
      <Ionicons name={icone} size={36} color={cores.textoSuave} />
      <Text style={{ color: cores.textoSuave, textAlign: 'center' }}>{texto}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: raio.p + 4,
  },
  botaoTexto: { fontSize: 16, fontWeight: '700' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  barraFundo: { height: 8, borderRadius: 4, backgroundColor: '#E8ECEA', overflow: 'hidden' },
  barra: { height: 8, borderRadius: 4 },
  rotulo: { fontSize: 14, color: cores.textoSuave, marginBottom: 6, fontWeight: '600' },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.p + 2,
    paddingHorizontal: 14,
  },
  campoTexto: { flex: 1, minWidth: 0, fontSize: 17, paddingVertical: 12, color: cores.texto },
  sufixo: { color: cores.textoSuave, fontSize: 16, marginLeft: 6, flexShrink: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
  },
  chipTexto: { fontSize: 14, fontWeight: '600', color: cores.texto },
  linha: { flexDirection: 'row', alignItems: 'center' },
  suave: { color: cores.textoSuave, fontSize: 14 },
  forte: { fontWeight: '700', color: cores.texto },
});
