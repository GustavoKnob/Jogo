/* =============================================================================
   content.js — ARQUIVO ÚNICO DE CONFIGURAÇÃO / SINGLE CONFIG FILE
   -----------------------------------------------------------------------------
   PT: Edite SOMENTE este arquivo para mudar nome da empresa, telefone, e-mail,
       textos, serviços, fotos e cores. Você não precisa tocar no HTML/CSS.
   EN: Edit ONLY this file to change company name, phone, email, copy, services,
       photos and colors. You never need to touch the HTML/CSS.

   Depois de editar, salve e recarregue a página no navegador (F5).
   ========================================================================== */

window.SITE_CONTENT = (function () {
  /* ===========================================================================
     1) IDIOMA / LANGUAGE  ← TROCAR AQUI
     ---------------------------------------------------------------------------
     "en" = site em inglês (recomendado p/ Austrália, "bond clean")
     "pt" = site em português
     ========================================================================= */
  const LANG = "en";

  /* Mostrar o botão EN/PT no topo? true = sim, false = não.
     Show the EN/PT switch in the header? true = yes, false = no.
     (Se você só atende um idioma, deixe false e apague o bloco do outro idioma
      lá embaixo, em `copy`.) */
  const SHOW_LANGUAGE_SWITCH = true;

  /* ===========================================================================
     2) DADOS DO NEGÓCIO / BUSINESS DETAILS  ← TROCAR AQUI
     ---------------------------------------------------------------------------
     Estes dados aparecem no cabeçalho, no rodapé e nos botões de contato.
     ========================================================================= */
  const business = {
    // NOME DA EMPRESA — placeholder, troque quando definir o nome definitivo.
    name: "Clean Co",

    // Palavra curta ao lado do nome (aparece pequenininho no logo). Pode ficar "".
    tagline: "Cleaning Services",

    // TELEFONE como o cliente vê na tela.
    phoneDisplay: "+61 400 000 000",
    // TELEFONE em formato de discagem (só + e números, sem espaços).
    phoneDial: "+61400000000",

    // E-MAIL (Gmail) da empresa.
    email: "cleanco.contato@gmail.com",

    // WHATSAPP: só números, com código do país, SEM "+", SEM espaços.
    // Ex.: Austrália 61 + 400000000  ->  "61400000000"
    //      Brasil     55 + 11987654321 -> "5511987654321"
    // Deixe "" (vazio) para esconder o botão flutuante e usar e-mail no lugar.
    whatsapp: "61400000000",

    // Região atendida (aparece no rodapé e no contato). Pode ficar "".
    serviceArea: "Gold Coast & surrounds",

    // Horário de atendimento. Pode ficar "".
    hours: "Mon–Sat, 7am – 6pm",

    // ABN / CNPJ / registro. Deixe "" para não mostrar.
    registration: "",

    // REDES SOCIAIS — deixe "" para esconder o ícone correspondente.
    social: {
      instagram: "", // ex.: "https://instagram.com/suaempresa"
      facebook: "",  // ex.: "https://facebook.com/suaempresa"
    },
  };

  /* ===========================================================================
     3) FORMULÁRIO DE CONTATO / CONTACT FORM
     ---------------------------------------------------------------------------
     Sem backend. Duas opções:

     A) DEIXE "" (padrão): o formulário monta a mensagem e abre o WhatsApp
        (ou o app de e-mail, se whatsapp estiver vazio). Funciona na hora.

     B) COLE UM ENDPOINT (ex.: Formspree — https://formspree.io, plano grátis):
        formEndpoint: "https://formspree.io/f/SEU_ID"
        Aí a mensagem chega direto no seu e-mail, sem abrir outro app.
     ========================================================================= */
  const formEndpoint = "";

  /* ===========================================================================
     4) CORES / COLORS  ← TROCAR AQUI
     ---------------------------------------------------------------------------
     Paleta branco + azul. Troque só o azul se quiser outro tom.
     ========================================================================= */
  const theme = {
    brand: "#1668E3",      // azul principal (botões, links, destaques)
    brandDark: "#0E4CAB",  // azul escuro (hover dos botões)
    brandTint: "#EEF5FF",  // azul bem claro (fundos de seção e cards)
    ink: "#0C1A2B",        // cor dos títulos / texto forte
  };

  /* ===========================================================================
     5) FOTOS DO PORTFÓLIO / PORTFOLIO PHOTOS  ← TROCAR AQUI
     ---------------------------------------------------------------------------
     COMO TROCAR PELAS SUAS FOTOS REAIS:
       1. Coloque as fotos na pasta  site/images/
       2. Troque o caminho abaixo, ex.: "images/cozinha-antes.jpg"
       3. Use fotos do MESMO ângulo p/ antes e depois (fica muito melhor).
       4. Tamanho ideal: ~1200x800px, arquivo abaixo de 400KB (jpg).

     `alt` = descrição da foto (importante p/ acessibilidade e Google).
     Para adicionar/remover um item, copie ou apague um bloco { ... } inteiro.
     ========================================================================= */
  // FOTO GRANDE DO TOPO (hero). Troque por uma foto sua, ex.: "images/hero.jpg"
  const heroImage = "images/hero.svg";

  const portfolio = [
    {
      before: "images/before-1.svg", // ← troque por images/sua-foto-antes.jpg
      after: "images/after-1.svg",   // ← troque por images/sua-foto-depois.jpg
      alt: { en: "Kitchen deep clean", pt: "Limpeza pesada de cozinha" },
    },
    {
      before: "images/before-2.svg",
      after: "images/after-2.svg",
      alt: { en: "Bathroom restored", pt: "Banheiro recuperado" },
    },
    {
      before: "images/before-3.svg",
      after: "images/after-3.svg",
      alt: { en: "Office workspace", pt: "Escritório / espaço de trabalho" },
    },
    {
      before: "images/before-4.svg",
      after: "images/after-4.svg",
      alt: { en: "End of lease living room", pt: "Sala em limpeza de fim de contrato" },
    },
  ];

  /* ===========================================================================
     6) TEXTOS DO SITE / SITE COPY  ← TROCAR AQUI
     ---------------------------------------------------------------------------
     `en` = inglês, `pt` = português. Mexa só no idioma que você usa
     (definido em LANG lá em cima). Se só usa um, pode apagar o outro bloco
     e deixar SHOW_LANGUAGE_SWITCH = false.

     Em `services`, o campo `icon` aceita: "home", "office", "keys", "sparkle".
     ========================================================================= */
  const copy = {
    /* ------------------------------- ENGLISH ------------------------------ */
    en: {
      // Aba do navegador + Google (SEO)
      metaTitle: "{name} — Home, Office & End of Lease Cleaning",
      metaDescription:
        "Reliable home, office and end of lease (bond) cleaning. Punctual team, quality products, spotless results. Get a free quote today.",

      nav: {
        services: "Services",
        work: "Our work",
        about: "Why us",
        contact: "Contact",
        quote: "Get a quote",
        menu: "Menu",
      },

      hero: {
        eyebrow: "Trusted local cleaners",
        title: "A spotless space,\nwithout the hassle.",
        subtitle:
          "Homes, offices and end of lease cleans done properly — by a team that turns up on time and leaves nothing behind.",
        primaryCta: "Get a free quote",
        secondaryCta: "Call us",
        // Selinhos de confiança abaixo do botão (máx. 3 fica melhor)
        badges: ["Fully insured", "Bond back guarantee", "No lock-in contracts"],
      },

      services: {
        title: "What we clean",
        subtitle: "Three services, one standard: done properly, every time.",
        items: [
          {
            icon: "home",
            title: "Home cleaning",
            text:
              "Regular or one-off cleans for houses and apartments. Kitchens, bathrooms, floors and everything in between — left fresh and ready to live in.",
            points: ["Weekly, fortnightly or one-off", "Kitchens & bathrooms", "Products included"],
          },
          {
            icon: "office",
            title: "Office & commercial",
            text:
              "Shops, studios and offices cleaned after hours so your team walks into a fresh space. Flexible schedules, invoiced monthly.",
            points: ["After-hours available", "Desks, kitchens & amenities", "Monthly invoicing"],
          },
          {
            icon: "keys",
            title: "End of lease (bond clean)",
            text:
              "The detailed clean your agent expects at handover — oven, windows, tracks and skirtings included, with a bond back guarantee.",
            points: ["Agent-ready checklist", "Oven & windows included", "Bond back guarantee"],
          },
        ],
      },

      portfolio: {
        title: "Before & after",
        subtitle: "Real jobs, same angle, no filters. Drag the handle to compare.",
        before: "Before",
        after: "After",
        sliderLabel: "Drag to compare before and after",
      },

      about: {
        title: "Why people book us again",
        subtitle:
          "We are a small team, so every job is done by someone whose name you know.",
        items: [
          {
            title: "We turn up on time",
            text: "You get a confirmed window and a message when we are on the way. No waiting around all day.",
          },
          {
            title: "Quality products",
            text: "Professional grade, safe around kids and pets. Eco-friendly options on request, at no extra cost.",
          },
          {
            title: "A team you can trust",
            text: "Police-checked, fully insured and the same faces each visit — so you can hand over a key without thinking twice.",
          },
          {
            title: "Clear, fixed pricing",
            text: "You approve a price before we start. No surprise charges once the job is done.",
          },
        ],
      },

      contact: {
        title: "Get a free quote",
        subtitle:
          "Tell us the size of the place and what you need — we usually reply the same day.",
        phoneLabel: "Phone",
        emailLabel: "Email",
        areaLabel: "Service area",
        hoursLabel: "Hours",
        form: {
          name: "Your name",
          namePlaceholder: "Jane Smith",
          email: "Email",
          emailPlaceholder: "jane@example.com",
          phone: "Phone (optional)",
          phonePlaceholder: "+61 400 000 000",
          service: "Service",
          serviceOptions: ["Home cleaning", "Office & commercial", "End of lease (bond clean)", "Not sure yet"],
          message: "Message",
          messagePlaceholder: "3 bedroom apartment, moving out on the 14th…",
          submit: "Send request",
          sending: "Sending…",
          success: "Thanks! Your message is on its way — we'll get back to you shortly.",
          error: "Something went wrong. Please call or email us directly.",
          required: "Please fill in this field.",
          invalidEmail: "Please enter a valid email address.",
          // Aparece embaixo do botão quando não há formEndpoint configurado
          fallbackNote: "This opens WhatsApp or your email app with the message ready to send.",
        },
      },

      footer: {
        blurb: "Home, office and end of lease cleaning done properly.",
        servicesTitle: "Services",
        contactTitle: "Contact",
        rights: "All rights reserved.",
      },

      whatsappFloat: "Chat on WhatsApp",
      // Mensagem já preenchida ao clicar no WhatsApp
      whatsappGreeting: "Hi {name}, I'd like a quote for a clean.",
      skipToContent: "Skip to content",
    },

    /* ------------------------------ PORTUGUÊS ----------------------------- */
    pt: {
      metaTitle: "{name} — Limpeza Residencial, Comercial e de Fim de Contrato",
      metaDescription:
        "Limpeza residencial, comercial e de fim de contrato feita do jeito certo. Equipe pontual, produtos de qualidade e resultado impecável. Peça seu orçamento.",

      nav: {
        services: "Serviços",
        work: "Nosso trabalho",
        about: "Diferenciais",
        contact: "Contato",
        quote: "Solicitar orçamento",
        menu: "Menu",
      },

      hero: {
        eyebrow: "Equipe de limpeza de confiança",
        title: "Seu espaço impecável,\nsem dor de cabeça.",
        subtitle:
          "Casas, escritórios e limpeza de fim de contrato feitos do jeito certo — por uma equipe que chega no horário e não deixa nada para trás.",
        primaryCta: "Solicitar orçamento",
        secondaryCta: "Ligar agora",
        badges: ["Equipe segurada", "Garantia de aprovação", "Sem fidelidade"],
      },

      services: {
        title: "O que limpamos",
        subtitle: "Três serviços, um só padrão: bem feito, sempre.",
        items: [
          {
            icon: "home",
            title: "Limpeza residencial",
            text:
              "Limpeza recorrente ou avulsa para casas e apartamentos. Cozinha, banheiros, pisos e tudo mais — tudo pronto para você só chegar e relaxar.",
            points: ["Semanal, quinzenal ou avulsa", "Cozinha e banheiros", "Produtos inclusos"],
          },
          {
            icon: "office",
            title: "Limpeza comercial / escritórios",
            text:
              "Lojas, estúdios e escritórios limpos fora do horário comercial, para sua equipe chegar num ambiente novo. Horários flexíveis e cobrança mensal.",
            points: ["Fora do horário comercial", "Estações, copa e banheiros", "Fatura mensal"],
          },
          {
            icon: "keys",
            title: "Limpeza de fim de contrato",
            text:
              "A limpeza detalhada que a imobiliária espera na entrega das chaves — forno, janelas, trilhos e rodapés inclusos, com garantia de aprovação.",
            points: ["Checklist da imobiliária", "Forno e janelas inclusos", "Garantia de aprovação"],
          },
        ],
      },

      portfolio: {
        title: "Antes e depois",
        subtitle: "Trabalhos reais, mesmo ângulo, sem filtro. Arraste para comparar.",
        before: "Antes",
        after: "Depois",
        sliderLabel: "Arraste para comparar antes e depois",
      },

      about: {
        title: "Por que nos chamam de novo",
        subtitle: "Somos uma equipe pequena — cada serviço é feito por alguém que você conhece pelo nome.",
        items: [
          {
            title: "Pontualidade de verdade",
            text: "Você recebe um horário confirmado e um aviso quando estamos a caminho. Ninguém fica esperando o dia inteiro.",
          },
          {
            title: "Produtos de qualidade",
            text: "Profissionais e seguros para crianças e pets. Opções ecológicas quando você pedir, sem custo extra.",
          },
          {
            title: "Equipe confiável",
            text: "Profissionais verificados, segurados e sempre os mesmos rostos — dá para deixar a chave sem pensar duas vezes.",
          },
          {
            title: "Preço fechado e claro",
            text: "Você aprova o valor antes de começarmos. Nada de cobrança surpresa no fim do serviço.",
          },
        ],
      },

      contact: {
        title: "Solicitar orçamento",
        subtitle: "Conte o tamanho do local e o que você precisa — normalmente respondemos no mesmo dia.",
        phoneLabel: "Telefone",
        emailLabel: "E-mail",
        areaLabel: "Região atendida",
        hoursLabel: "Horário",
        form: {
          name: "Seu nome",
          namePlaceholder: "Maria Silva",
          email: "E-mail",
          emailPlaceholder: "maria@exemplo.com",
          phone: "Telefone (opcional)",
          phonePlaceholder: "(11) 90000-0000",
          service: "Serviço",
          serviceOptions: ["Limpeza residencial", "Limpeza comercial", "Limpeza de fim de contrato", "Ainda não sei"],
          message: "Mensagem",
          messagePlaceholder: "Apartamento de 3 quartos, mudança no dia 14…",
          submit: "Enviar pedido",
          sending: "Enviando…",
          success: "Obrigado! Sua mensagem está a caminho — respondemos em breve.",
          error: "Algo deu errado. Ligue ou mande um e-mail para a gente.",
          required: "Preencha este campo.",
          invalidEmail: "Digite um e-mail válido.",
          fallbackNote: "Isso abre o WhatsApp ou seu app de e-mail com a mensagem pronta.",
        },
      },

      footer: {
        blurb: "Limpeza residencial, comercial e de fim de contrato bem feita.",
        servicesTitle: "Serviços",
        contactTitle: "Contato",
        rights: "Todos os direitos reservados.",
      },

      whatsappFloat: "Falar no WhatsApp",
      whatsappGreeting: "Olá {name}, gostaria de um orçamento de limpeza.",
      skipToContent: "Ir para o conteúdo",
    },
  };

  /* ===========================================================================
     Daqui para baixo é montagem — normalmente você NÃO precisa mexer.
     Below this line is wiring — you normally do NOT need to touch it.
     ========================================================================= */
  // O botão EN/PT guarda a escolha do visitante; se não houver, vale o LANG acima.
  let stored = null;
  try { stored = window.localStorage.getItem("siteLang"); } catch (e) { /* modo privado */ }
  const lang = copy[stored] ? stored : copy[LANG] ? LANG : "en";
  const t = copy[lang];

  return {
    lang,
    defaultLang: copy[LANG] ? LANG : "en",
    showLanguageSwitch: SHOW_LANGUAGE_SWITCH && Object.keys(copy).length > 1,
    availableLangs: Object.keys(copy),
    business,
    theme,
    formEndpoint,
    heroImage,
    // Resolve o alt da imagem para o idioma escolhido
    portfolio: portfolio.map((item) => ({
      before: item.before,
      after: item.after,
      alt: (item.alt && (item.alt[lang] || item.alt.en)) || "",
    })),
    t,
  };
})();
