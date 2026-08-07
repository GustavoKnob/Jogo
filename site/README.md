# Clean Co — site institucional

Site de página única (one page) para empresa de limpeza, em **HTML + CSS + JavaScript puro**.
Sem framework, sem build, sem backend. Basta abrir e usar.

> **Tudo o que você precisa editar está em um único arquivo: [`content.js`](content.js).**
> Nome da empresa, telefone, e-mail, WhatsApp, textos, serviços, cores e fotos.
> Você não precisa mexer no HTML nem no CSS.

---

## 1. Como rodar localmente

### Opção A — mais rápida
Dê **duplo clique em `index.html`**. O site abre direto no navegador.
Funciona 100%, inclusive o formulário e o comparador antes/depois.

### Opção B — servidor local (recomendado para testar no celular)
Dentro da pasta `site/`, rode um destes comandos:

```bash
# Python (já vem instalado no Mac e Linux)
python3 -m http.server 8000

# ou Node.js
npx serve .
```

Depois abra **http://localhost:8000**.
Para testar no celular na mesma rede Wi‑Fi, use o IP do computador, ex.: `http://192.168.0.10:8000`.

---

## 2. O que editar (e onde)

Abra `content.js` em qualquer editor de texto. Ele está dividido em blocos numerados:

| Bloco | O que muda | Exemplo |
|---|---|---|
| **1) IDIOMA** | Site em inglês ou português | `const LANG = "en";` → troque para `"pt"` |
| **2) DADOS DO NEGÓCIO** | Nome, telefone, e‑mail, WhatsApp, região, horário, redes sociais | `name: "Clean Co"` |
| **3) FORMULÁRIO** | Para onde vão as mensagens | `formEndpoint: ""` |
| **4) CORES** | A paleta azul | `brand: "#1668E3"` |
| **5) FOTOS** | Imagens do antes/depois | `before: "images/cozinha-antes.jpg"` |
| **6) TEXTOS** | Todo o conteúdo escrito da página | títulos, serviços, diferenciais |

Salve o arquivo e **recarregue a página (F5)**.

### Trocar o nome da empresa
```js
name: "Clean Co",   // ← coloque aqui o nome definitivo
```
Ele aparece automaticamente no cabeçalho, no hero, no título da aba, no rodapé e nas mensagens de WhatsApp.

### Trocar telefone, e‑mail e WhatsApp
```js
phoneDisplay: "+61 400 000 000",   // como aparece na tela
phoneDial:    "+61400000000",      // usado no clique-para-ligar
email:        "cleanco.contato@gmail.com",
whatsapp:     "61400000000",       // só números, com país, SEM "+"
```
Se você deixar `whatsapp: ""`, o botão flutuante some e todos os botões passam a usar e‑mail.

### Trocar as cores
```js
const theme = {
  brand:     "#1668E3",  // azul principal
  brandDark: "#0E4CAB",  // azul do hover
  brandTint: "#EEF5FF",  // azul clarinho dos fundos
  ink:       "#0C1A2B",  // cor dos títulos
};
```

### Idiomas
O site vem com os textos em **inglês e português**. O `LANG` define qual aparece por padrão,
e o botão **EN / PT** no topo deixa o visitante trocar (a escolha fica salva no navegador dele).

Se você só atende um idioma:
1. Coloque `SHOW_LANGUAGE_SWITCH = false`
2. Apague o bloco do idioma que não usa dentro de `copy`

---

## 3. Trocar as fotos do portfólio

1. Coloque suas fotos na pasta **`site/images/`**
2. Em `content.js`, no bloco 5, aponte para elas:

```js
{
  before: "images/cozinha-antes.jpg",
  after:  "images/cozinha-depois.jpg",
  alt: { en: "Kitchen deep clean", pt: "Limpeza pesada de cozinha" },
},
```

**Dicas para ficar bom:**
- Tire o **antes e o depois do mesmo ângulo** — o comparador desliza uma sobre a outra.
- Tamanho ideal: **1200×800 px**, arquivo abaixo de 400 KB (`.jpg`).
- Para adicionar mais um item, copie um bloco `{ ... }` inteiro. Para remover, apague o bloco.

As imagens que vêm no projeto são **placeholders em SVG** — pode apagar todas depois de colocar as suas.
Também vale trocar `images/hero.svg` (foto grande do topo), `images/og-cover.svg`
(a miniatura que aparece ao compartilhar o link no WhatsApp) e `favicon.svg` (ícone da aba).

---

## 4. O formulário de contato

Como não há backend, existem duas formas de funcionar:

### Padrão (já ativo): abre WhatsApp ou e‑mail
A pessoa preenche, clica em enviar e o navegador abre o WhatsApp (ou o app de e‑mail) com
a mensagem já montada. Funciona sem configurar nada.

### Opcional: receber direto no e‑mail
1. Crie uma conta grátis em <https://formspree.io> e crie um formulário
2. Copie o endpoint gerado e cole em `content.js`:

```js
const formEndpoint = "https://formspree.io/f/SEU_ID";
```

Pronto — as mensagens passam a chegar no seu e‑mail sem abrir outro app.
(Serviços equivalentes: Web3Forms, Basin, Netlify Forms.)

O formulário já tem um campo‑armadilha invisível (*honeypot*) que descarta envios de robôs.

---

## 5. Publicar o site

Não existe etapa de build — é só subir a pasta `site/`.

### Netlify (mais fácil)
1. Entre em <https://app.netlify.com/drop>
2. Arraste a pasta **`site/`** para a página
3. Pronto, você recebe um link do tipo `seu-site.netlify.app` na hora

### Vercel
O repositório já vem configurado — o `vercel.json` na raiz aponta para a pasta `site/`
e desliga a etapa de build, e o `package.json` fixa o Node em `24.x`.
Basta conectar o repositório na Vercel e fazer o deploy da branch.

> **Se o build falhar com "Found invalid or discontinued Node.js Version: 18.x":**
> o `engines.node` do `package.json` resolve isso a partir do próximo deploy.
> Para garantir, dá para trocar também em **Project Settings → General →
> Node.js Version → 24.x** e clicar em *Redeploy*.

> **Não mexa em Root Directory nas configurações da Vercel.** Ele precisa continuar
> na raiz do repositório, porque é lá que está o `vercel.json` que aponta para `site/`.
> Se você definir Root Directory como `site`, apague o `outputDirectory` do `vercel.json`.

### GitHub Pages
1. No GitHub: **Settings → Pages**
2. Em *Source*, escolha `Deploy from a branch`
3. Selecione a branch e a pasta **`/site`** (ou mova o conteúdo de `site/` para a raiz do repositório)
4. O link fica `https://SEU-USUARIO.github.io/NOME-DO-REPO/`

### Domínio próprio
Qualquer uma das três aceita domínio próprio (ex.: `www.suaempresa.com.au`)
nas configurações de *Domains* / *Custom domain*.

---

## 6. O que já vem pronto

- ✅ **Responsivo mobile‑first** — pensado primeiro para celular, já que o link é compartilhado por WhatsApp
- ✅ **Botão flutuante de WhatsApp** com mensagem pré‑preenchida
- ✅ **Comparador antes/depois** arrastável (funciona com mouse, toque e teclado)
- ✅ **SEO básico** — título, meta description, Open Graph, favicon e dados estruturados (`ProfessionalService`) para o Google
- ✅ **Acessibilidade** — navegação por teclado, links "pular para o conteúdo", contraste e `prefers-reduced-motion`
- ✅ **Clique para ligar** e clique para enviar e‑mail no celular
- ✅ Zero dependências: não precisa `npm install`

---

## 7. Estrutura dos arquivos

```
site/
├── index.html        ← estrutura da página (raramente precisa mexer)
├── content.js        ← ★ TODO o conteúdo e configuração ficam aqui
├── favicon.svg       ← ícone da aba do navegador
├── css/
│   └── styles.css    ← estilo visual (cores vêm do content.js)
├── js/
│   └── main.js       ← monta a página a partir do content.js
└── images/           ← ★ suas fotos entram aqui
    ├── hero.svg
    ├── before-1..4.svg
    ├── after-1..4.svg
    └── og-cover.svg
```

---

## 8. Checklist antes de publicar

- [ ] Definir o nome real da empresa em `business.name`
- [ ] Conferir telefone, e‑mail e número do WhatsApp
- [ ] Trocar as fotos de placeholder pelas fotos reais dos serviços
- [ ] Revisar os textos dos 3 serviços e dos diferenciais
- [ ] Preencher (ou apagar) os links de Instagram e Facebook
- [ ] Testar o site no celular antes de mandar o link para clientes
