import { Linking, ScrollView, Text } from 'react-native';
import { Cartao, s } from '../components/ui';
import { cores } from '../lib/tema';

function Link({ url, children }: { url: string; children: string }) {
  return (
    <Text style={{ color: cores.primariaEscura, fontWeight: '600' }} onPress={() => Linking.openURL(url)}>
      {children}
    </Text>
  );
}

export default function Sobre() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Cartao style={{ gap: 8 }}>
        <Text style={s.forte}>Fontes dos dados</Text>
        <Text style={{ color: cores.texto, lineHeight: 21 }}>
          • Alimentos básicos: Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição, NEPA/UNICAMP.{' '}
          <Link url="https://nepa.unicamp.br/publicacoes/tabela-taco-pdf/">nepa.unicamp.br</Link>
        </Text>
        <Text style={{ color: cores.texto, lineHeight: 21 }}>
          • Produtos com código de barras: Open Food Facts, base colaborativa sob licença Open Database License (ODbL).{' '}
          <Link url="https://world.openfoodfacts.org">openfoodfacts.org</Link>
        </Text>
        <Text style={{ color: cores.texto, lineHeight: 21 }}>
          • Gasto em exercícios: valores MET do Compendium of Physical Activities.
        </Text>
      </Cartao>
      <Cartao style={{ gap: 8 }}>
        <Text style={s.forte}>Como a meta é calculada</Text>
        <Text style={{ color: cores.texto, lineHeight: 21 }}>
          Taxa metabólica basal pela fórmula de Mifflin-St Jeor, multiplicada pelo seu nível de atividade. Para perder ou
          ganhar peso, ajustamos ~7.700 kcal por kg, divididas pelos dias da semana. A meta nunca fica abaixo de 1.200 kcal
          (mulheres) ou 1.500 kcal (homens).
        </Text>
      </Cartao>
      <Cartao style={{ gap: 8 }}>
        <Text style={s.forte}>Privacidade</Text>
        <Text style={{ color: cores.texto, lineHeight: 21 }}>
          Seus dados ficam guardados só neste aparelho. Ao ler um código de barras, apenas o número do código é enviado ao
          Open Food Facts.
        </Text>
      </Cartao>
      <Text style={[s.suave, { fontSize: 12 }]}>
        O Rango dá estimativas e não substitui orientação de médico ou nutricionista.
      </Text>
    </ScrollView>
  );
}
