import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDados } from '../lib/store';
import { cores, raio } from '../lib/tema';
import { Botao, Campo, Ionicons, s } from './ui';

/** Primeira tela: escolher ou criar o perfil de quem vai usar. */
export function SeletorPerfil() {
  const { perfis, entrar, criarPerfil, abrindo, ondeSalva, erroSalvar } = useDados();
  const [criando, setCriando] = useState(perfis.length === 0);
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);

  const criar = async () => {
    if (!nome.trim() || enviando) return;
    setEnviando(true);
    await criarPerfil(nome.trim());
    setEnviando(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 34, fontWeight: '800', color: cores.primaria }}>Rango</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: cores.texto }}>Quem está usando?</Text>
          <Text style={s.suave}>
            {ondeSalva === 'nuvem'
              ? 'Cada pessoa tem seu perfil, com diário, peso e metas próprios. Tudo fica salvo na sua conta do claude.ai.'
              : 'Cada pessoa tem seu perfil, com diário, peso e metas próprios. Tudo fica salvo neste aparelho.'}
          </Text>

          {perfis.map((p) => (
            <Pressable
              key={p.id}
              disabled={abrindo}
              onPress={() => entrar(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Entrar como ${p.nome}`}
              style={({ pressed }) => [
                s.linha,
                {
                  gap: 14,
                  padding: 16,
                  borderRadius: raio.m,
                  backgroundColor: cores.cartao,
                  opacity: pressed || abrindo ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: cores.primariaClara,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '800', color: cores.primaria }}>{p.nome.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: cores.texto }}>{p.nome}</Text>
              <Ionicons name="chevron-forward" size={20} color={cores.textoSuave} />
            </Pressable>
          ))}

          {abrindo && (
            <View style={[s.linha, { gap: 8 }]}>
              <ActivityIndicator color={cores.primaria} />
              <Text style={s.suave}>Abrindo perfil…</Text>
            </View>
          )}

          {criando ? (
            <View style={{ gap: 10, backgroundColor: cores.cartao, borderRadius: raio.m, padding: 16 }}>
              <Campo
                rotulo="Nome do novo perfil"
                value={nome}
                onChangeText={setNome}
                placeholder="Ex.: Thamiris"
                autoFocus={perfis.length > 0}
                onSubmitEditing={criar}
                returnKeyType="done"
              />
              <Botao titulo={enviando ? 'Criando…' : 'Criar perfil'} desabilitado={!nome.trim() || enviando} onPress={criar} />
              {perfis.length > 0 && <Botao titulo="Cancelar" variante="texto" onPress={() => setCriando(false)} />}
            </View>
          ) : (
            <Botao titulo="Adicionar perfil" icone="person-add-outline" variante="secundario" onPress={() => setCriando(true)} />
          )}

          {erroSalvar && <Text style={{ color: cores.perigo }}>{erroSalvar}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
