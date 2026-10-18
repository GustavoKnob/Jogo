# Rango: contador de calorias

App mobile (iOS e Android) para registrar refeições, contar calorias e macros e acompanhar o peso.
Feito com **Expo (React Native) + TypeScript**. Os dados ficam salvos no próprio celular, sem servidor.

## O que já funciona (MVP)

| Tela | O que faz |
|---|---|
| **Cadastro inicial** | Objetivo → dados do corpo → nível de atividade → ritmo → meta calculada |
| **Hoje** | Semana com dias registrados, sequência 🔥, calorias (meta − alimentos + exercícios), macros, 4 refeições, exercícios e água |
| **Adicionar alimento** | Busca sem acento e tolerante (TACO + meus alimentos), histórico com "+" para repetir, meus alimentos |
| **Detalhe do alimento** | Porções caseiras (colher, concha, unidade), quantidade, macros, tabela nutricional |
| **Código de barras** | Câmera lê EAN-13/EAN-8/UPC → busca no Open Food Facts → se não achar, abre o cadastro |
| **Adição rápida** | Só calorias (e macros opcionais) |
| **Criar alimento** | Copia a tabela da embalagem (por porção) e o app converte para 100 g |
| **Exercícios** | 36 atividades com MET, ou calorias manuais |
| **Progresso** | Calorias de 7/30/90 dias com linha da meta, média de macros, gráfico de peso |
| **Mais** | Perfil, metas (kcal manual, macros, água, % do exercício que volta ao saldo), exportar e apagar dados |

## Como rodar no seu celular

Você precisa de um computador com [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
cd contador-calorias
npm install
npx expo start
```

1. Instale o app **Expo Go** no celular (App Store ou Google Play).
2. Escaneie o QR code que aparece no terminal (no iPhone, pela câmera).
3. O app abre no celular e recarrega sozinho quando você muda o código.

> Se o Expo Go reclamar da versão do SDK, gere um build de desenvolvimento:
> `npx eas-cli@latest build --profile development --platform android` (ou `ios`).

Para testar no navegador: `npm run web`. A câmera pode não funcionar lá, mas dá para digitar o código de barras.

## Comandos

```bash
npm start            # servidor de desenvolvimento
npm run typecheck    # checa os tipos
npx expo lint        # lint
npm run gerar-taco   # regenera src/data/taco.json a partir dos CSVs
npm run build:web    # versão web em dist/
```

## Estrutura

```
src/
  app/                    telas (expo-router: cada arquivo é uma rota)
    (tabs)/index.tsx      Hoje
    (tabs)/progresso.tsx  Progresso
    (tabs)/mais.tsx       Mais
    onboarding.tsx        cadastro inicial / editar perfil
    adicionar.tsx         buscar e adicionar alimento
    alimento/[id].tsx     detalhe e porção
    scanner.tsx           código de barras
    adicao-rapida.tsx, criar-alimento.tsx, exercicio.tsx, peso.tsx, metas.tsx, sobre.tsx
  components/             botões, cartões, campos, gráficos (SVG)
  lib/
    calculos.ts           Mifflin-St Jeor, meta, macros, MET, formatação pt-BR
    store.tsx             estado do app + AsyncStorage + seletores (resumo do dia, sequência)
    busca.ts              busca de alimentos
    openFoodFacts.ts      consulta por código de barras
    datas.ts, tipos.ts, tema.ts
  data/
    taco.json             597 alimentos da TACO, valores por 100 g + porções
    exercicios.ts         lista de exercícios com MET
scripts/
  gerar-taco.mjs          converte os CSVs da TACO e adiciona porções caseiras
  taco/*.csv
```

## Como a meta é calculada

1. **TMB** (Mifflin-St Jeor): `10×peso + 6,25×altura − 5×idade + 5` (homens) ou `− 161` (mulheres)
2. **Gasto diário** = TMB × fator de atividade (1,2 / 1,375 / 1,55 / 1,725), sem contar treinos
3. **Ajuste** = ±(kg por semana × 7.700) ÷ 7
4. **Mínimo seguro**: 1.500 kcal (homens) / 1.200 kcal (mulheres)
5. A meta é recalculada sozinha quando você registra um peso novo.

Saldo do dia = meta − alimentos + (exercícios × fator escolhido em Metas).

## Fontes dos dados

- **TACO** 4ª ed. (NEPA/UNICAMP), via [raulfdm/taco-api](https://github.com/raulfdm/taco-api) (MIT). Uso livre com citação.
- **Open Food Facts**, licença ODbL. Mostramos a atribuição na tela "Sobre".
- **MET**: Compendium of Physical Activities.

## Próximos passos sugeridos

1. **Ícone e splash próprios** (`assets/`), trocando os do template.
2. **Contas e backup na nuvem** com Supabase (hoje tudo fica só no aparelho).
3. **Minhas refeições e receitas** (salvar o "café de sempre" e pratos caseiros).
4. **Apple Saúde / Health Connect** para passos e treinos automáticos (exige build de desenvolvimento).
5. **Lembretes** com `expo-notifications`.
6. **Publicar**: `npx eas-cli@latest build` e `npx eas-cli@latest submit`. Antes, configure política de privacidade (LGPD: dados de saúde são sensíveis), contas Apple (US$ 99/ano) e Google Play (US$ 25).

Estimativas nutricionais não substituem orientação de médico ou nutricionista.
