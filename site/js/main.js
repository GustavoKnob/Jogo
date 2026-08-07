/* =============================================================================
   main.js — MONTAGEM DA PÁGINA / PAGE RENDERING
   -----------------------------------------------------------------------------
   PT: Este arquivo lê o content.js e monta o site. Para mudar textos, nome,
       telefone, cores ou fotos, edite content.js — não este arquivo.
   EN: This file reads content.js and renders the site. To change copy, name,
       phone, colors or photos, edit content.js — not this file.
   ========================================================================== */

(function () {
  "use strict";

  var C = window.SITE_CONTENT;
  if (!C) {
    console.error("content.js não carregou / did not load.");
    return;
  }
  var t = C.t;
  var b = C.business;

  /* ==========================================================================
     Utilitários
     ========================================================================== */

  // Escapa texto antes de inserir no HTML (evita quebrar o layout com < > & ")
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Substitui {name} pelo nome da empresa
  function fill(str) {
    return String(str || "").replace(/\{name\}/g, b.name);
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ==========================================================================
     Ícones (SVG inline — sem dependência externa)
     ========================================================================== */
  var stroke = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  var ICONS = {
    sparkle: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/></svg>',
    home: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.7V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.7"/><path d="M9.5 21v-6h5v6"/></svg>',
    office: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M15 9h3a2 2 0 0 1 2 2v10"/><path d="M8 7h4M8 11h4M8 15h4"/></svg>',
    keys: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><circle cx="7.5" cy="15.5" r="4"/><path d="M10.4 12.6 20 3"/><path d="M17 6l2.5 2.5"/><path d="M14.5 8.5 17 11"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.53 3.75 1.45 5.31L2 22l4.98-1.6a9.8 9.8 0 0 0 5.06 1.39h.01c5.43 0 9.83-4.4 9.83-9.84C21.88 6.4 17.47 2 12.04 2zm0 17.98h-.01a8.2 8.2 0 0 1-4.16-1.14l-.3-.18-3.1 1 1.02-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.35c0-4.51 3.68-8.18 8.2-8.18 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.51-3.68 8.18-8.2 8.18zm4.5-6.13c-.25-.13-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.15-1.17-.06-.11-.23-.17-.48-.29z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" ' + stroke + ' aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.5-3.2h-3.2V8.7c0-.9.3-1.6 1.7-1.6h1.6V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.6V14h2.8v8h3.1z"/></svg>',
  };

  function icon(name) { return ICONS[name] || ICONS.sparkle; }

  /* ==========================================================================
     Links de contato
     ========================================================================== */
  var telHref = "tel:" + String(b.phoneDial || "").replace(/[^\d+]/g, "");
  var mailHref = "mailto:" + b.email;

  function waLink(message) {
    if (!b.whatsapp) return null;
    var num = String(b.whatsapp).replace(/\D/g, "");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(message);
  }

  var quoteMessage = fill(t.whatsappGreeting);
  // CTA principal: WhatsApp se configurado, senão e-mail
  var quoteHref =
    waLink(quoteMessage) ||
    mailHref + "?subject=" + encodeURIComponent(fill(t.nav.quote) + " — " + b.name);

  /* ==========================================================================
     Tema e SEO (vindos do content.js)
     ========================================================================== */
  function applyThemeAndMeta() {
    var root = document.documentElement;
    root.style.setProperty("--brand", C.theme.brand);
    root.style.setProperty("--brand-dark", C.theme.brandDark);
    root.style.setProperty("--brand-tint", C.theme.brandTint);
    root.style.setProperty("--ink", C.theme.ink);
    root.setAttribute("lang", C.lang === "pt" ? "pt-BR" : C.lang);

    var title = fill(t.metaTitle);
    var desc = fill(t.metaDescription);
    document.title = title;

    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[name="theme-color"]', "content", C.theme.brand);

    // Dados estruturados p/ o Google (SEO básico)
    var ld = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: b.name,
      description: desc,
      telephone: b.phoneDial,
      email: b.email,
      url: location.href.split("#")[0],
    };
    if (b.serviceArea) ld.areaServed = b.serviceArea;
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  }

  function setMeta(selector, attr, value) {
    var el = $(selector);
    if (el) el.setAttribute(attr, value);
  }

  /* ==========================================================================
     Blocos reutilizáveis
     ========================================================================== */
  function brandMark(extraClass) {
    return (
      '<a class="brand ' + (extraClass || "") + '" href="#top">' +
      '<span class="brand__mark">' + icon("sparkle") + "</span>" +
      "<span><span class=\"brand__name\">" + esc(b.name) + "</span>" +
      (b.tagline ? '<span class="brand__tagline">' + esc(b.tagline) + "</span>" : "") +
      "</span></a>"
    );
  }

  var NAV_LINKS = [
    { href: "#services", label: t.nav.services },
    { href: "#work", label: t.nav.work },
    { href: "#about", label: t.nav.about },
    { href: "#contact", label: t.nav.contact },
  ];

  function navList(cls) {
    return (
      '<ul class="' + (cls || "") + '">' +
      NAV_LINKS.map(function (l) {
        return '<li><a href="' + l.href + '">' + esc(l.label) + "</a></li>";
      }).join("") +
      "</ul>"
    );
  }

  function langSwitch() {
    if (!C.showLanguageSwitch) return "";
    return (
      '<div class="lang-switch" role="group" aria-label="Language">' +
      C.availableLangs
        .map(function (code) {
          return (
            '<button type="button" data-lang="' + esc(code) + '" aria-pressed="' +
            (code === C.lang) + '">' + esc(code.toUpperCase()) + "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  /* ==========================================================================
     CABEÇALHO
     ========================================================================== */
  function renderHeader() {
    $("#site-header").innerHTML =
      '<div class="container header-inner">' +
        brandMark() +
        '<nav class="nav" aria-label="Main">' + navList() + "</nav>" +
        '<div class="header-contact">' +
          '<a href="' + esc(telHref) + '">' + icon("phone") + esc(b.phoneDisplay) + "</a>" +
          '<a href="' + esc(mailHref) + '">' + icon("mail") + esc(b.email) + "</a>" +
        "</div>" +
        '<div class="header-actions">' +
          langSwitch() +
          '<a class="btn btn--primary btn--sm" href="' + esc(quoteHref) + '"' + extAttrs() + ">" +
            esc(t.nav.quote) +
          "</a>" +
          '<button class="nav-toggle" type="button" aria-expanded="false" ' +
            'aria-controls="mobile-menu" aria-label="' + esc(t.nav.menu) + '">' +
            '<span class="icon-open">' + icon("menu") + "</span>" +
            '<span class="icon-close">' + icon("close") + "</span>" +
          "</button>" +
        "</div>" +
      "</div>" +
      '<div class="mobile-menu" id="mobile-menu">' +
        '<div class="container">' +
          navList() +
          langSwitch() +
          '<div class="mobile-menu__contact">' +
            '<a href="' + esc(telHref) + '">' + esc(b.phoneDisplay) + "</a>" +
            '<a href="' + esc(mailHref) + '">' + esc(b.email) + "</a>" +
          "</div>" +
          '<a class="btn btn--primary btn--block" href="' + esc(quoteHref) + '"' + extAttrs() + ">" +
            esc(t.nav.quote) + "</a>" +
        "</div>" +
      "</div>";
  }

  function extAttrs() {
    return b.whatsapp ? ' target="_blank" rel="noopener"' : "";
  }

  /* ==========================================================================
     HERO
     ========================================================================== */
  function renderHero() {
    var badges = (t.hero.badges || [])
      .map(function (item) {
        return "<li>" + icon("checkCircle") + esc(item) + "</li>";
      })
      .join("");

    $("#hero").innerHTML =
      '<div class="container hero-grid">' +
        '<div class="reveal">' +
          (t.hero.eyebrow ? '<span class="eyebrow">' + icon("sparkle") + esc(t.hero.eyebrow) + "</span>" : "") +
          '<h1 id="hero-title">' + esc(fill(t.hero.title)) + "</h1>" +
          '<p class="hero__subtitle">' + esc(t.hero.subtitle) + "</p>" +
          '<div class="hero__ctas">' +
            '<a class="btn btn--primary" href="' + esc(quoteHref) + '"' + extAttrs() + ">" +
              esc(t.hero.primaryCta) + "</a>" +
            '<a class="btn btn--ghost" href="' + esc(telHref) + '">' + icon("phone") +
              esc(t.hero.secondaryCta) + "</a>" +
          "</div>" +
          (badges ? '<ul class="hero__badges">' + badges + "</ul>" : "") +
        "</div>" +
        '<div class="hero__media reveal">' +
          '<img src="' + esc(C.heroImage) + '" alt="" width="1200" height="900" />' +
        "</div>" +
      "</div>";
  }

  /* ==========================================================================
     SERVIÇOS
     ========================================================================== */
  function renderServices() {
    var cards = t.services.items
      .map(function (s) {
        var points = (s.points || [])
          .map(function (p) { return "<li>" + icon("check") + "<span>" + esc(p) + "</span></li>"; })
          .join("");
        return (
          '<article class="card reveal">' +
            '<div class="card__icon">' + icon(s.icon) + "</div>" +
            "<h3>" + esc(s.title) + "</h3>" +
            "<p>" + esc(s.text) + "</p>" +
            (points ? '<ul class="card__points">' + points + "</ul>" : "") +
          "</article>"
        );
      })
      .join("");

    var el = $("#services");
    el.classList.add("section--tint");
    el.innerHTML =
      '<div class="container">' +
        '<div class="section-head reveal">' +
          '<h2 id="services-title">' + esc(t.services.title) + "</h2>" +
          "<p>" + esc(t.services.subtitle) + "</p>" +
        "</div>" +
        '<div class="cards">' + cards + "</div>" +
      "</div>";
  }

  /* ==========================================================================
     PORTFÓLIO — ANTES E DEPOIS
     ========================================================================== */
  function renderPortfolio() {
    var items = C.portfolio
      .map(function (item, i) {
        var id = "cmp-" + i;
        return (
          '<figure class="reveal" style="margin:0">' +
            '<div class="compare" style="--pos:50%">' +
              '<img class="compare__before" src="' + esc(item.before) + '" alt="' +
                esc(t.portfolio.before + " — " + item.alt) + '" loading="lazy" />' +
              '<img class="compare__after" src="' + esc(item.after) + '" alt="' +
                esc(t.portfolio.after + " — " + item.alt) + '" loading="lazy" />' +
              '<span class="compare__tag compare__tag--before">' + esc(t.portfolio.before) + "</span>" +
              '<span class="compare__tag compare__tag--after">' + esc(t.portfolio.after) + "</span>" +
              '<input class="compare__range" id="' + id + '" type="range" min="0" max="100" value="50" ' +
                'aria-label="' + esc(t.portfolio.sliderLabel) + '" />' +
              '<span class="compare__handle"></span>' +
            "</div>" +
            '<figcaption class="gallery__caption">' + esc(item.alt) + "</figcaption>" +
          "</figure>"
        );
      })
      .join("");

    $("#work").innerHTML =
      '<div class="container">' +
        '<div class="section-head reveal">' +
          '<h2 id="work-title">' + esc(t.portfolio.title) + "</h2>" +
          "<p>" + esc(t.portfolio.subtitle) + "</p>" +
        "</div>" +
        '<div class="gallery">' + items + "</div>" +
      "</div>";

    // Arrastar / teclado para comparar
    $$(".compare").forEach(function (box) {
      var range = $(".compare__range", box);
      var update = function () {
        box.style.setProperty("--pos", range.value + "%");
        range.setAttribute("aria-valuetext", range.value + "%");
      };
      range.addEventListener("input", update);
      update();
    });
  }

  /* ==========================================================================
     SOBRE / DIFERENCIAIS
     ========================================================================== */
  function renderAbout() {
    var items = t.about.items
      .map(function (f, i) {
        return (
          '<li class="feature reveal">' +
            '<span class="feature__num" aria-hidden="true">' + (i + 1) + "</span>" +
            "<div><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div>" +
          "</li>"
        );
      })
      .join("");

    $("#about").innerHTML =
      '<div class="container">' +
        '<div class="section-head reveal">' +
          '<h2 id="about-title">' + esc(t.about.title) + "</h2>" +
          "<p>" + esc(t.about.subtitle) + "</p>" +
        "</div>" +
        '<ul class="features">' + items + "</ul>" +
      "</div>";
  }

  /* ==========================================================================
     CONTATO
     ========================================================================== */
  function renderContact() {
    var f = t.contact.form;

    var details = [
      { icon: "phone", label: t.contact.phoneLabel, value: esc(b.phoneDisplay), href: telHref },
      { icon: "mail", label: t.contact.emailLabel, value: esc(b.email), href: mailHref },
    ];
    if (b.serviceArea) details.push({ icon: "pin", label: t.contact.areaLabel, value: esc(b.serviceArea) });
    if (b.hours) details.push({ icon: "clock", label: t.contact.hoursLabel, value: esc(b.hours) });

    var list = details
      .map(function (d) {
        var val = d.href ? '<a href="' + esc(d.href) + '">' + d.value + "</a>" : d.value;
        return (
          "<li>" +
            '<span class="contact-list__icon">' + icon(d.icon) + "</span>" +
            "<div><dt>" + esc(d.label) + "</dt><dd>" + val + "</dd></div>" +
          "</li>"
        );
      })
      .join("");

    var options = (f.serviceOptions || [])
      .map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; })
      .join("");

    var el = $("#contact");
    el.classList.add("section--tint");
    el.innerHTML =
      '<div class="container contact-grid">' +
        '<div class="reveal">' +
          '<div class="section-head" style="margin-bottom:var(--sp-8)">' +
            '<h2 id="contact-title">' + esc(t.contact.title) + "</h2>" +
            "<p>" + esc(t.contact.subtitle) + "</p>" +
          "</div>" +
          '<dl class="contact-list">' + list + "</dl>" +
          (b.whatsapp
            ? '<a class="btn btn--primary" href="' + esc(waLink(quoteMessage)) +
              '" target="_blank" rel="noopener">' + icon("whatsapp") + esc(t.whatsappFloat) + "</a>"
            : "") +
        "</div>" +

        '<form class="form reveal" id="contact-form" novalidate>' +
          '<div class="form__row">' +
            field("name", f.name, '<input id="cf-name" name="name" type="text" required autocomplete="name" placeholder="' + esc(f.namePlaceholder) + '" />') +
            field("email", f.email, '<input id="cf-email" name="email" type="email" required autocomplete="email" placeholder="' + esc(f.emailPlaceholder) + '" />') +
          "</div>" +
          '<div class="form__row">' +
            field("phone", f.phone, '<input id="cf-phone" name="phone" type="tel" autocomplete="tel" placeholder="' + esc(f.phonePlaceholder) + '" />') +
            field("service", f.service, '<select id="cf-service" name="service">' + options + "</select>") +
          "</div>" +
          field("message", f.message, '<textarea id="cf-message" name="message" required placeholder="' + esc(f.messagePlaceholder) + '"></textarea>') +
          // Campo-armadilha contra robôs de spam — invisível para pessoas
          '<div class="hp" aria-hidden="true"><label>Company<input type="text" name="_company" tabindex="-1" autocomplete="off" /></label></div>' +
          '<button class="btn btn--primary btn--block" type="submit">' + esc(f.submit) + "</button>" +
          '<p class="form__status" id="form-status" role="status" aria-live="polite"></p>' +
          (C.formEndpoint ? "" : '<p class="form__note">' + esc(f.fallbackNote) + "</p>") +
        "</form>" +
      "</div>";

    wireForm();
  }

  function field(name, label, control) {
    return (
      '<div class="field" data-field="' + esc(name) + '">' +
        '<label for="cf-' + esc(name) + '">' + esc(label) + "</label>" +
        control +
        '<span class="field__error" id="err-' + esc(name) + '"></span>' +
      "</div>"
    );
  }

  /* ==========================================================================
     RODAPÉ
     ========================================================================== */
  function renderFooter() {
    var services = t.services.items
      .map(function (s) { return '<li><a href="#services">' + esc(s.title) + "</a></li>"; })
      .join("");

    var socials = "";
    ["instagram", "facebook"].forEach(function (key) {
      var url = b.social && b.social[key];
      if (url) {
        socials +=
          '<a href="' + esc(url) + '" target="_blank" rel="noopener" aria-label="' +
          esc(key) + '">' + icon(key) + "</a>";
      }
    });

    $("#site-footer").innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          "<div>" + brandMark() +
            '<p class="footer__blurb">' + esc(t.footer.blurb) + "</p>" +
            (socials ? '<div class="socials">' + socials + "</div>" : "") +
          "</div>" +
          "<div><h4>" + esc(t.footer.servicesTitle) + "</h4>" +
            '<ul class="footer-list">' + services + "</ul></div>" +
          "<div><h4>" + esc(t.footer.contactTitle) + "</h4>" +
            '<ul class="footer-list">' +
              '<li><a href="' + esc(telHref) + '">' + esc(b.phoneDisplay) + "</a></li>" +
              '<li><a href="' + esc(mailHref) + '">' + esc(b.email) + "</a></li>" +
              (b.serviceArea ? "<li>" + esc(b.serviceArea) + "</li>" : "") +
              (b.hours ? "<li>" + esc(b.hours) + "</li>" : "") +
            "</ul></div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + new Date().getFullYear() + " " + esc(b.name) + ". " + esc(t.footer.rights) + "</span>" +
          (b.registration ? "<span>" + esc(b.registration) + "</span>" : "") +
        "</div>" +
      "</div>";
  }

  /* ==========================================================================
     BOTÃO FLUTUANTE DE WHATSAPP (só se `whatsapp` estiver preenchido)
     ========================================================================== */
  function renderWhatsAppFloat() {
    if (!b.whatsapp) return;
    $("#whatsapp-float").innerHTML =
      '<a class="wa-float" href="' + esc(waLink(quoteMessage)) + '" target="_blank" ' +
      'rel="noopener" aria-label="' + esc(t.whatsappFloat) + '">' +
      icon("whatsapp") + "<span>" + esc(t.whatsappFloat) + "</span></a>";
  }

  /* ==========================================================================
     Comportamentos
     ========================================================================== */
  function wireHeaderBehaviour() {
    var header = $("#site-header");
    var toggle = $(".nav-toggle", header);
    var menu = $("#mobile-menu", header);

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });

    // Fecha o menu ao clicar num link
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      }
    });

    // Sombra no cabeçalho ao rolar
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Troca de idioma: guarda a escolha e recarrega
    $$(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try { window.localStorage.setItem("siteLang", btn.dataset.lang); } catch (e) {}
        window.location.reload();
      });
    });
  }

  // Anima os blocos ao entrar na tela. Feito com checagem de posição (e não só
  // com IntersectionObserver) para que nada fique invisível se a pessoa pular
  // direto para uma âncora ou recarregar no meio da página.
  function wireReveal() {
    var targets = $$(".reveal");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var pending = targets.slice();
    var ticking = false;

    function check() {
      ticking = false;
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        // Revela o que está na tela — e também tudo que já ficou acima dela.
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add("is-visible");
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener("scroll", request);
        window.removeEventListener("resize", request);
      }
    }

    function request() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(check);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    check();
  }

  /* --------------------------------------------------------------------------
     Formulário: valida e envia.
     - Se `formEndpoint` estiver preenchido no content.js  -> envia por fetch.
     - Se estiver vazio -> abre WhatsApp (ou e-mail) com a mensagem pronta.
     -------------------------------------------------------------------------- */
  function wireForm() {
    var form = $("#contact-form");
    var status = $("#form-status");
    var f = t.contact.form;
    var submitBtn = $('button[type="submit"]', form);

    function setError(name, message) {
      var wrap = $('[data-field="' + name + '"]', form);
      var out = $("#err-" + name, form);
      if (!wrap || !out) return;
      wrap.classList.toggle("field--error", !!message);
      out.textContent = message || "";
      var input = $("input, select, textarea", wrap);
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validate(data) {
      var ok = true;
      ["name", "email", "message"].forEach(function (key) {
        if (!String(data[key] || "").trim()) { setError(key, f.required); ok = false; }
        else setError(key, "");
      });
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) {
        setError("email", f.invalidEmail);
        ok = false;
      }
      return ok;
    }

    function showStatus(message, kind) {
      status.textContent = message;
      status.className = "form__status form__status--" + kind;
    }

    // Monta a mensagem que vai pro WhatsApp / e-mail
    function composeMessage(d) {
      return [
        f.name + ": " + d.name,
        f.email + ": " + d.email,
        d.phone ? f.phone + ": " + d.phone : null,
        f.service + ": " + d.service,
        "",
        d.message,
      ].filter(Boolean).join("\n");
    }

    function openLink(url) {
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var data = {
        name: (fd.get("name") || "").trim(),
        email: (fd.get("email") || "").trim(),
        phone: (fd.get("phone") || "").trim(),
        service: fd.get("service") || "",
        message: (fd.get("message") || "").trim(),
      };

      // Robô preencheu o campo-armadilha: finge sucesso e não envia nada.
      if ((fd.get("_company") || "").trim()) {
        showStatus(f.success, "ok");
        form.reset();
        return;
      }

      if (!validate(data)) {
        var firstError = $(".field--error input, .field--error select, .field--error textarea", form);
        if (firstError) firstError.focus();
        return;
      }

      var body = composeMessage(data);

      // ---- Opção B: endpoint configurado (ex.: Formspree) ----
      if (C.formEndpoint) {
        submitBtn.disabled = true;
        submitBtn.textContent = f.sending;
        fetch(C.formEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd,
        })
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            showStatus(f.success, "ok");
            form.reset();
          })
          .catch(function () { showStatus(f.error, "err"); })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = f.submit;
          });
        return;
      }

      // ---- Opção A (padrão): abre WhatsApp, ou e-mail se não houver WhatsApp ----
      var wa = waLink(body);
      if (wa) {
        openLink(wa);
      } else {
        window.location.href =
          mailHref +
          "?subject=" + encodeURIComponent(fill(t.nav.quote) + " — " + data.name) +
          "&body=" + encodeURIComponent(body);
      }
      showStatus(f.success, "ok");
    });

    // Limpa o erro assim que a pessoa corrige o campo
    form.addEventListener("input", function (e) {
      var wrap = e.target.closest("[data-field]");
      if (wrap && wrap.classList.contains("field--error")) {
        setError(wrap.dataset.field, "");
      }
    });
  }

  /* ==========================================================================
     Inicialização
     ========================================================================== */
  function init() {
    applyThemeAndMeta();
    renderHeader();
    renderHero();
    renderServices();
    renderPortfolio();
    renderAbout();
    renderContact();
    renderFooter();
    renderWhatsAppFloat();
    wireHeaderBehaviour();
    wireReveal();

    // Texto do link "pular para o conteúdo"
    var skip = $(".skip-link");
    if (skip) skip.textContent = t.skipToContent;

    // Âncora do logo
    document.body.id = document.body.id || "top";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
