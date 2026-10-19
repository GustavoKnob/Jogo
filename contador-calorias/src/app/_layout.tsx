import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SeletorPerfil } from '../components/SeletorPerfil';
import { ProvedorDados, useDados } from '../lib/store';
import { cores } from '../lib/tema';

function Navegacao() {
  const { carregado, perfilAtivo, abrindo } = useDados();
  if (carregado && !perfilAtivo && !abrindo) return <SeletorPerfil />;
  if (!carregado || abrindo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerTintColor: cores.primariaEscura,
        headerTitleStyle: { color: cores.texto, fontWeight: '700' },
        headerStyle: { backgroundColor: cores.fundo },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: cores.fundo },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="adicionar" options={{ title: 'Adicionar alimento' }} />
      <Stack.Screen name="alimento/[id]" options={{ title: 'Alimento' }} />
      <Stack.Screen name="scanner" options={{ title: 'Código de barras', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="adicao-rapida" options={{ title: 'Adição rápida', presentation: 'modal' }} />
      <Stack.Screen name="criar-alimento" options={{ title: 'Criar alimento' }} />
      <Stack.Screen name="exercicio" options={{ title: 'Adicionar exercício' }} />
      <Stack.Screen name="peso" options={{ title: 'Registrar peso', presentation: 'modal' }} />
      <Stack.Screen name="metas" options={{ title: 'Metas' }} />
      <Stack.Screen name="sobre" options={{ title: 'Sobre o Rango' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <ProvedorDados>
      <StatusBar style="dark" />
      <Navegacao />
    </ProvedorDados>
  );
}
