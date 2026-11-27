import {initPortfolioSections} from './portfolio-sections.js?v=20261127-reading-2';
import {initStaggeredMenu} from './staggered-menu.js?v=20261126-1';
import {initPillNav} from './pill-nav.js?v=20261126-1';
import {startAssetLoader} from "./asset-loader.js?v=20261127-legible-5";
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenis = new Lenis({ duration: 0.9, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.1 });

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Always start at top on page load
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

const pageLoader=startAssetLoader({gsap});
lenis.stop();document.addEventListener('portfolio-loading-complete',()=>lenis.start(),{once:true});

const translations = {
  pt: {
    "header.status": "DISPONÍVEL PARA PROJETOS",
    "header.contact": "CONTATO",
    "menu.label": "NAVEGAÇÃO",
    "menu.home": "INÍCIO",
    "menu.services": "SERVIÇOS",
    "menu.projects": "PROJETOS",
    "menu.location": "SOBRE MIM",
    "menu.contact": "CONTATO",
    "hero.role": "DESIGNER · DEVELOPER · VIDEO EDITOR",
    "hero.workLabel": "MEU TRABALHO",
    "hero.projects": "VER PROJETOS",
    "hero.projectsAria": "Ver projetos",
    "hero.contact": "ME<br>CONTRATE",
    "hero.contactAria": "Ir para a seção de contratação",
    "hero.aboutAria": "Ir para Sobre o Enzo ao selecionar o retrato",
    "hero.small": "criando para quem<br />quer ir mais alto",
    "hero.manifesto": "Ideias que encontram<br />forma, ritmo e altitude.",
    "hero.cta": "VER<br />TRABALHOS",
    "hero.aiLabel": "USO IA PARA FACILITAR O <span class=\"hero__ai-label--serif\">trabalho</span>",
    "hero.ai.claude": "Código & Raciocínio",
    "hero.ai.antigravity": "Exploração Criativa",
    "hero.ai.cg": "Escrita & Análise",
    "hero.ai.router": "Roteador de IA",
    "hero.ai.alethe": "Orquestrador de IA",
    "hero.ai.opencode": "Agente de Código",
    "about.label": "SOBRE MIM",
    "about.title": "Transformo ideias em experiências que ficam na cabeça.",
    "about.copy": "Sou um criativo multidisciplinar que mistura design, desenvolvimento e edição para dar uma assinatura única a cada projeto.",
    "about.cta": "VAMOS CRIAR ALGO",
    "projects.label": "PROJETOS SELECIONADOS",
    "projects.title": "Meus projetos.",
    "projects.copy": "Uma seleção de identidades, sites e imagens em movimento.",
    "services.label": "SERVIÇOS &amp; HABILIDADES",
    "services.title": "O que eu <em>entrego.</em>",
    "services.copy": "Do conceito ao deploy — serviços integrados para dar presença e resultado ao seu projeto.",
    "services.design.title": "Design",
    "services.design.copy": "Identidade, direção de arte, interfaces e sistemas visuais.",
    "services.web.title": "Web Development",
    "services.web.copy": "Sites expressivos, responsivos e vivos em cada detalhe.",
    "services.video.title": "Vídeo &amp; Motion",
    "services.video.copy": "Edição, ritmo e narrativas que seguram o olhar.",
    "world.label": "ORIGEM / LOCALIZAÇÃO",
    "world.live": "LIVE SIGNAL",
    "world.eyebrow": "COORDENADAS ENCONTRADAS",
    "world.title": "De onde<br /><em>eu venho.</em>",
    "world.copy": "Uma pequena pausa entre o céu e a terra. Gire o globo e encontre a minha base.",
    "world.hint": "ARRASTE PARA GIRAR <b>↔</b>",
    "world.origin.label": "ORIGEM",
    "world.status.label": "STATUS",
    "world.status.value": "ABERTO A NOVOS PROJETOS",
    "world.email": "E-MAIL <i>↗</i>",
    "world.instagram": "INSTAGRAM <i>↗</i>",
    "world.linkedin": "LINKEDIN <i>↗</i>",
    "world.note": "A seta aponta para o próximo contato.",
    "contact.label": "CONTATO",
    "contact.pretitle": "TEM ALGO EM MENTE? VAMOS TIRAR DO PAPEL.",
    "contact.title": "Crie<br /><em>comigo.</em>",
    "contact-card.button": "FALE COMIGO",
    "contact-card.eyebrow": "ESCOLHA UM CANAL",
    "contact-card.title": "Como falar comigo.",
    "contact-card.email.label": "E-MAIL",
    "contact-card.instagram.label": "INSTAGRAM",
    "contact-card.linkedin.label": "LINKEDIN",
    "contact-card.linkedin.handle": "in/enzo-bicalho",
    "contact-card.whatsapp.label": "WHATSAPP",
    "contact-card.whatsapp.handle": "+55 31 98380-8351",
    "contact-card.github.label": "GITHUB",
    "contact-card.github.handle": "@bicas777",
  },
  en: {
    "header.status": "AVAILABLE FOR PROJECTS",
    "header.contact": "CONTACT",
    "menu.label": "NAVIGATION",
    "menu.home": "HOME",
    "menu.services": "SERVICES",
    "menu.projects": "PROJECTS",
    "menu.location": "ABOUT ME",
    "menu.contact": "CONTACT",
    "hero.role": "DESIGNER · DEVELOPER · VIDEO EDITOR",
    "hero.workLabel": "MY WORK",
    "hero.projects": "VIEW PROJECTS",
    "hero.projectsAria": "View projects",
    "hero.contact": "HIRE<br>ME",
    "hero.contactAria": "Go to the contact section",
    "hero.aboutAria": "Go to About Enzo by selecting the portrait",
    "hero.small": "creating for those<br />who want to go higher",
    "hero.manifesto": "Ideas that find<br />form, rhythm and altitude.",
    "hero.cta": "VIEW<br />WORK",
    "hero.aiLabel": "I USE AI TO STREAMLINE <span class=\"hero__ai-label--serif\">work</span>",
    "hero.ai.claude": "Code & Reasoning",
    "hero.ai.antigravity": "Creative Exploration",
    "hero.ai.cg": "Writing & Analysis",
    "hero.ai.router": "AI Router",
    "hero.ai.alethe": "AI Orchestrator",
    "hero.ai.opencode": "Code Agent",
    "about.label": "ABOUT ME",
    "about.title": "I turn ideas into experiences that stay with you.",
    "about.copy": "I am a multidisciplinary creative blending design, development and editing to give every project a unique signature.",
    "about.cta": "LET'S CREATE",
    "projects.label": "SELECTED PROJECTS",
    "projects.title": "Projects.",
    "projects.copy": "A selection of identities, websites and moving images.",
    "services.label": "SERVICES &amp; SKILLS",
    "services.title": "What I <em>deliver.</em>",
    "services.copy": "From concept to launch — integrated services that give presence and results to your project.",
    "services.design.title": "Design",
    "services.design.copy": "Identity, art direction, interfaces and visual systems.",
    "services.web.title": "Web Development",
    "services.web.copy": "Expressive, responsive websites alive in every detail.",
    "services.video.title": "Video &amp; Motion",
    "services.video.copy": "Editing, rhythm and stories that hold the gaze.",
    "world.label": "ORIGIN / LOCATION",
    "world.live": "LIVE SIGNAL",
    "world.eyebrow": "COORDINATES FOUND",
    "world.title": "Where I<br /><em>come from.</em>",
    "world.copy": "A small pause between sky and earth. Spin the globe and find my base.",
    "world.hint": "DRAG TO ROTATE <b>↔</b>",
    "world.origin.label": "ORIGIN",
    "world.status.label": "STATUS",
    "world.status.value": "OPEN TO NEW PROJECTS",
    "world.email": "E-MAIL <i>↗</i>",
    "world.instagram": "INSTAGRAM <i>↗</i>",
    "world.linkedin": "LINKEDIN <i>↗</i>",
    "world.note": "The arrow points to the next contact.",
    "contact.label": "CONTACT",
    "contact.pretitle": "GOT SOMETHING IN MIND? LET'S BRING IT TO LIFE",
    "contact.title": "Create<br /><em>with me.</em>",
    "contact-card.button": "GET IN TOUCH",
    "contact-card.eyebrow": "PICK A CHANNEL",
    "contact-card.title": "How to reach me.",
    "contact-card.email.label": "E-MAIL",
    "contact-card.instagram.label": "INSTAGRAM",
    "contact-card.linkedin.label": "LINKEDIN",
    "contact-card.linkedin.handle": "in/enzo-bicalho",
    "contact-card.whatsapp.label": "WHATSAPP",
    "contact-card.whatsapp.handle": "+55 31 98380-8351",
    "contact-card.github.label": "GITHUB",
    "contact-card.github.handle": "@enzobicalho",
  },
};

const safeStorage = {
  get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private browsing */ } },
};

const languageToggle = document.querySelector("#language-toggle");
let activeLanguage = safeStorage.get("portfolio-language", "pt");

function applyLanguage(language) {
  activeLanguage = language === "en" ? "en" : "pt";
  document.documentElement.lang = activeLanguage === "en" ? "en" : "pt-BR";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translations[activeLanguage][element.dataset.i18n];
    if (value) element.innerHTML = value;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const value = translations[activeLanguage][element.dataset.i18nAria];
    if (value) element.setAttribute("aria-label", value);
  });
  if (languageToggle) {
    languageToggle.querySelector(".language-toggle__active").textContent = activeLanguage.toUpperCase();
    languageToggle.querySelector("[data-language-copy]").textContent = activeLanguage.toUpperCase();
    languageToggle.setAttribute("aria-label", activeLanguage === "pt" ? "Mudar idioma para inglês" : "Change language to Portuguese");
  }
  safeStorage.set("portfolio-language", activeLanguage);
  document.dispatchEvent(new CustomEvent("portfolio-language-change", { detail: { language: activeLanguage } }));
}

languageToggle?.addEventListener("click", () => {
  applyLanguage(activeLanguage === "pt" ? "en" : "pt");
});
applyLanguage(activeLanguage);
initPillNav();
initStaggeredMenu({gsap,lenis,reduceMotion});
initPortfolioSections({gsap,ScrollTrigger});

const menuToggle = document.querySelector("#menu-toggle");
const siteMenu = document.querySelector("#site-menu");
const closeSiteMenu = () => {
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Abrir menu de navegação");
  siteMenu?.parentElement.classList.remove("is-menu-open");
};
menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu de navegação" : "Fechar menu de navegação");
  siteMenu?.parentElement.classList.toggle("is-menu-open", !isOpen);
});
document.querySelectorAll("[data-menu-link]").forEach((link) => link.addEventListener("click", closeSiteMenu));

// Card de contato: abre/fecha um modal com os canais de contato.
const contactCard = document.querySelector("#contact-card");
const contactCardOverlay = document.querySelector("#contact-card-overlay");
const openContactCardBtn = document.querySelector("#open-contact-card");
const closeContactCardBtn = document.querySelector("#close-contact-card");
let lastFocusedBeforeCard = null;

const openContactCard = () => {
  if (!contactCard) return;
  lastFocusedBeforeCard = document.activeElement;
  contactCard.setAttribute("aria-hidden", "false");
  contactCardOverlay?.classList.add("is-open");
  contactCard.classList.add("is-open");
  document.body.classList.add("contact-card-open");
  closeSiteMenu();
  closeContactCardBtn?.focus();
};

const closeContactCard = () => {
  if (!contactCard || !contactCard.classList.contains("is-open")) return;
  contactCard.setAttribute("aria-hidden", "true");
  contactCardOverlay?.classList.remove("is-open");
  contactCard.classList.remove("is-open");
  document.body.classList.remove("contact-card-open");
  openContactCardBtn?.focus();
  lastFocusedBeforeCard?.focus?.();
};

openContactCardBtn?.addEventListener("click", openContactCard);
closeContactCardBtn?.addEventListener("click", closeContactCard);
contactCardOverlay?.addEventListener("click", closeContactCard);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeContactCard();
  if (event.key === "Tab" && contactCard?.classList.contains("is-open")) {
    const focusable = contactCard.querySelectorAll('a[href], button:not([disabled])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Project images fade in over the CSS-art fallback once the files exist.
document.querySelectorAll(".project__image").forEach((image) => {
  const reveal = () => image.classList.add("is-loaded");
  if (image.complete && image.naturalWidth > 0) reveal();
  else image.addEventListener("load", reveal);
});

// Cloud assets are optional: once the user adds the files, the image replaces the soft fallback automatically.
document.querySelectorAll("[data-cloud-src]").forEach((cloud) => {
  const source = cloud.dataset.cloudSrc;
  const image = new Image();
  image.onload = () => { cloud.src = source; };
  image.onerror = () => { cloud.classList.add("cloud-image--missing"); };
  image.src = source;
});

// User cursor: independent spring followers for the pointer and name tag.
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
import('./user-cursor.js?v=20261126-4').then(async({initUserCursor})=>{
  const cursor=initUserCursor();
  const {initAIWorkflow}=await import('./ai-workflow.js?v=20261126-6');
  initAIWorkflow({gsap,ScrollTrigger,cursor});
})
  .catch(error=>console.warn('User cursor unavailable; native cursor retained.',error));

// ClickSpark — faíscas no clique em qualquer ponto da página.
(function initClickSpark() {
  const canvas = document.getElementById("click-spark");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const SPARK_COLOR = "#dbe9ee";
  const SPARK_SIZE = 10;
  const SPARK_RADIUS = 15;
  const SPARK_COUNT = 8;
  const DURATION = 400;
  const EASING = "ease-out";
  const EXTRA_SCALE = 1.0;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const easeFunc = (t) => {
    switch (EASING) {
      case "linear": return t;
      case "ease-in": return t * t;
      case "ease-in-out": return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default: return t * (2 - t);
    }
  };

  let sparks = [];
  let startTime = null;
  let rafId;

  const draw = (timestamp) => {
    if (!startTime) startTime = timestamp;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    sparks = sparks.filter((spark) => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= DURATION) return false;

      const progress = elapsed / DURATION;
      const eased = easeFunc(progress);
      const distance = eased * SPARK_RADIUS * EXTRA_SCALE;
      const lineLength = SPARK_SIZE * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = SPARK_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    rafId = requestAnimationFrame(draw);
  };
  rafId = requestAnimationFrame(draw);

  window.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.(".lando-hero")) return;
    const x = event.clientX;
    const y = event.clientY;
    const now = performance.now();
    const newSparks = Array.from({ length: SPARK_COUNT }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / SPARK_COUNT,
      startTime: now,
    }));
    sparks.push(...newSparks);
  });
})();


if (!reduceMotion) {
  // Efeito de magnetização (fiel ao componente React): cada botão/link é atraído
  // pelo ponteiro quando este entra numa zona de `padding` ao redor do elemento.
  const magnetSelector = ".round-link, .header-contact, .language-toggle, .menu-toggle, .text-link, .world__info-links a, .contact-card__option, .contact-card__close, .cssbuttons-io-button, .location-trigger, .site-menu a, .project__link, .contact__footer a";
  const magnetTargets = document.querySelectorAll(magnetSelector);
  const PADDING = 90;
  const STRENGTH = 2;

  magnetTargets.forEach((target) => {
    if (target.closest(".glass-surface")) return; // evita conflito com camada de vidro
    const xTo = gsap.quickTo(target, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(target, "y", { duration: 0.5, ease: "power3.out" });

    target.addEventListener("pointermove", (event) => {
      const bounds = target.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const distX = Math.abs(centerX - event.clientX);
      const distY = Math.abs(centerY - event.clientY);
      if (distX < bounds.width / 2 + PADDING && distY < bounds.height / 2 + PADDING) {
        xTo((event.clientX - centerX) / STRENGTH);
        yTo((event.clientY - centerY) / STRENGTH);
      } else {
        xTo(0);
        yTo(0);
      }
    });
    target.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
  gsap.to(".round-link > .glass-surface__content", { y: -3, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });
}

const header = document.querySelector(".site-header");

if (header) gsap.fromTo(header, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", onComplete: () => gsap.set(header, { clearProps: "transform" }) });

// Hero replacement stays isolated from the remaining portfolio animations.
pageLoader.track('Hero 3D',()=>import('./hero.js?v=20261127-smooth-3').then(({initHero})=>initHero({gsap,ScrollTrigger,lenis,reduceMotion})))
  .catch(error=>console.error('Hero initialization failed; fallback remains visible.',error));

pageLoader.track('Project textures',()=>import('./flex-carousel.js?v=20261126-preload-1').then(({initProjectsCarousel})=>initProjectsCarousel()).then(api=>api?.ready)).catch(error=>console.warn('Project carousel unavailable; grid retained.',error));

pageLoader.track('Profile photo GPU',()=>import('./personal-profile.js?v=20261127-unclip-2').then(({initPersonalProfile})=>initPersonalProfile({gsap,ScrollTrigger,preload:true})).then(api=>api?.ready)).catch(error=>console.warn('Profile motion unavailable; content remains visible.',error));

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.25 });
  });
});

const redirectIfMissing = async (target) => {
  try {
    const resolved = new URL(target, window.location.href);
    const response = await fetch(resolved, { method: "GET" });
    if (!response.ok) window.location.href = new URL("404.html", window.location.href).href;
  } catch {
    window.location.href = new URL("404.html", window.location.href).href;
  }
};
document.addEventListener("click", (event) => {
  const anchor = event.target.closest("a[href]");
  if (!anchor) return;
  const href = anchor.getAttribute("href");
  if (href.startsWith("http") || href.startsWith("//") || href.startsWith("mailto:") || href.startsWith("#")) return;
  if (href.endsWith(".html")) redirectIfMissing(href);
});

const marqueeTrack = document.querySelector(".marquee__track");
if (marqueeTrack && !reduceMotion) {
  const marqueeCopy = marqueeTrack.querySelector("p");
  let marqueeDistance = 0;
  let marqueeTween = null;
  let marqueeObserver = null;

  const startMarquee = () => {
    marqueeDistance = marqueeCopy ? marqueeCopy.offsetWidth : 0;
    if (!marqueeDistance) return;
    if (marqueeTween) {
      marqueeTween.duration(26).progress(0);
      gsap.set(marqueeTrack, { x: 0 });
      return;
    }
    marqueeTween = gsap.to(marqueeTrack, {
      x: -marqueeDistance,
      duration: 26,
      ease: "none",
      repeat: -1,
      paused: true,
    });
    if ("IntersectionObserver" in window) {
      marqueeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) marqueeTween.play();
          else marqueeTween.pause();
        });
      }, { threshold: 0.05 });
      marqueeObserver.observe(marqueeTrack);
    } else {
      marqueeTween.play();
    }
  };

  startMarquee();
  window.addEventListener("load", startMarquee);

  let marqueeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(marqueeTimer);
    marqueeTimer = setTimeout(startMarquee, 200);
  });
}

/* ============================================================
   Camada de interações ricas — GSAP
   Tudo respeita reduceMotion; efeitos pointer só em fine pointer.
   ============================================================ */

// Helper: divide o texto de um elemento em <span> por palavra (preserva <br>/<em>)
function splitWords(el) {
  if (!el || el.dataset.split === "done") return el.querySelectorAll(".word");
  const nodes = [...el.childNodes];
  el.textContent = "";
  const words = [];
  const flush = (text) => {
    text.split(/(\s+)/).forEach((chunk) => {
      if (chunk.trim() === "") {
        el.appendChild(document.createTextNode(chunk));
        return;
      }
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = chunk;
      el.appendChild(span);
      words.push(span);
    });
  };
  nodes.forEach((node) => {
    if (node.nodeName === "BR") {
      el.appendChild(document.createElement("br"));
    } else if (node.nodeType === Node.TEXT_NODE) {
      flush(node.textContent);
    } else {
      // elemento (ex: <em>) — divide o texto interno mantendo a tag
      const span = document.createElement("span");
      span.className = "word";
      span.style.display = "inline-block";
      const inner = document.createElement(node.nodeName.toLowerCase());
      inner.innerHTML = node.innerHTML;
      span.appendChild(inner);
      el.appendChild(span);
      words.push(span);
    }
  });
  el.dataset.split = "done";
  return words;
}

// Helper: dispara o callback quando o elemento fica visível (baseado em
// IntersectionObserver, NÃO em ScrollTrigger) — sobrevive ao pin de seções.
function onView(el, cb, opts = {}) {
  if (!el || reduceMotion) {
    if (el && reduceMotion) cb();
    return;
  }
  if (!("IntersectionObserver" in window)) { cb(); return; }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        cb();
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: opts.threshold ?? 0.2, rootMargin: opts.rootMargin ?? "0px 0px -10% 0px" });
  io.observe(el);
}

// Helper: reveal de texto palavra-por-palavra com blur e rotação do container,
// ligado ao scroll (scrub). Inspirado no padrão ScrollReveal (React) que o usuário
// pediu: baseOpacity, baseRotation, blurStrength e os "ends" são reguláveis.
// Respeita reduceMotion (mostra tudo sem animar) e só ativa em fine pointer/scroll.
// IMPORTANTE: baseOpacity padrão é 0 (totalmente invisível) para garantir fade-in.
function scrollReveal(el, opts = {}) {
  if (!el) return [];
  const {
    enableBlur = true,
    baseOpacity = 0,
    baseRotation = 3,
    blurStrength = 4,
    baseScale = 1,
    rotationEnd = "bottom bottom",
    wordEnd = "bottom bottom",
    start = "top bottom",
    trigger = el,
    rotateOrigin = "0% 50%",
  } = opts;

  if (reduceMotion) {
    const words = splitWords(el);
    gsap.set(words, { opacity: 1, filter: "blur(0px)" });
    gsap.set(el, { rotate: 0, scale: 1 });
    return [];
  }

  // Garante que o texto já está dividido em palavras (preserva <br>/<em>).
  const words = splitWords(el);
  const triggers = [];

  // 1) Rotação + escala do container conforme entra na viewport.
  const rotTween = gsap.fromTo(el,
    { transformOrigin: rotateOrigin, rotate: baseRotation, scale: baseScale },
    {
      ease: "none", rotate: 0, scale: 1,
      scrollTrigger: { trigger, start, end: rotationEnd, scrub: true },
    }
  );
  if (rotTween.scrollTrigger) triggers.push(rotTween.scrollTrigger);

  // 2) Cada palavra sobe de opacity (e blur) conforme rola — efeito "revela ao passar".
  // Começa SEMPRE com opacity: 0 (fade-in garantido)
  const wordTween = gsap.fromTo(words,
    { opacity: 0, willChange: "opacity" },
    {
      ease: "none", opacity: 1, stagger: 0.05,
      scrollTrigger: { trigger, start: "top bottom-=20%", end: wordEnd, scrub: true },
    }
  );
  if (wordTween.scrollTrigger) triggers.push(wordTween.scrollTrigger);

  // 3) Blur regulável (opcional) — só se pedido.
  if (enableBlur) {
    const blurTween = gsap.fromTo(words,
      { filter: `blur(${blurStrength}px)`, willChange: "filter" },
      {
        ease: "none", filter: "blur(0px)", stagger: 0.05,
        scrollTrigger: { trigger, start: "top bottom-=20%", end: wordEnd, scrub: true },
      }
    );
    if (blurTween.scrollTrigger) triggers.push(blurTween.scrollTrigger);
  }

  return triggers;
}

// --- Barra de progresso de scroll (topo fixo) ---
(function () {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  if (!reduceMotion) {
    gsap.to(bar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });
  } else {
    bar.style.transform = "scaleX(1)";
  }
})();

// --- Header: fixo, transição ao scroll ---
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  gsap.set(header, { yPercent: 0 });

  const heroSection = document.querySelector(".hero");
  if (!heroSection) return;

  ScrollTrigger.create({
    trigger: heroSection,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => {
      if (self.progress > 0.05) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    },
  });
})();

// --- Reveal dos labels de seção (o "( 01 )") — por visibilidade ---
if (!reduceMotion) {
  gsap.utils.toArray(".section-label").forEach((label) => {
    gsap.set(label, { opacity: 0, x: -24 });
    onView(label, () => gsap.to(label, {
      opacity: 1,
      x: 0,
      duration: 0.7,
      ease: "power3.out",
    }), { threshold: 0.5 });
  });
}

// --- Project cards: tilt 3D magnético no hover ---
(function () {
  if (reduceMotion || !finePointer.matches) return;
  const cards = document.querySelectorAll(".project");
  cards.forEach((card) => {
    const inner = card;
    const rotX = gsap.quickTo(inner, "rotationX", { duration: 0.5, ease: "power3.out" });
    const rotY = gsap.quickTo(inner, "rotationY", { duration: 0.5, ease: "power3.out" });
    card.addEventListener("pointermove", (e) => {
      const b = card.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - 0.5;
      const py = (e.clientY - b.top) / b.height - 0.5;
      rotY(px * 10);
      rotX(-py * 10);
    });
    card.addEventListener("pointerleave", () => {
      rotX(0);
      rotY(0);
    });
  });
})();

// --- Reveals universais: marquee (por visibilidade) ---
if (!reduceMotion) {
  const marqueeEl = document.querySelector(".marquee");
  if (marqueeEl) {
    gsap.set(marqueeEl, { opacity: 0, y: 30 });
    onView(marqueeEl, () => gsap.to(marqueeEl, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
    }), { threshold: 0.2 });
  }
}

// --- Animações extras (todas baseadas em visibilidade real, não em ScrollTrigger) ---
if (!reduceMotion) {
  // Projects: título revela palavra-por-palavra com blur/rotação (scrub)
  const projectsTitle = document.querySelector(".projects__intro h2");
  if (projectsTitle) scrollReveal(projectsTitle, { baseRotation: -4, blurStrength: 4, wordEnd: "bottom 75%" });


}

// --- Title change quando a aba perde o foco ---
const originalTitle = document.title;
const blurTitle = "Volta aqui :(";
window.addEventListener("blur", () => { document.title = blurTitle; });
window.addEventListener("focus", () => { document.title = originalTitle; });

// --- LogoLoop: infinite horizontal scroll ---
(function () {
  if (reduceMotion) return;

  const track = document.getElementById("logoTrack");
  const list = document.getElementById("logoList");
  const container = document.getElementById("logoLoop");
  if (!track || !list || !container) return;

  // Duplicate logos for seamless infinite scroll
  track.appendChild(list.cloneNode(true));

  let offset = 0;
  const baseSpeed = 80; // px per second
  let targetSpeed = 80;
  let currentSpeed = 80;
  let lastTime = 0;

  container.addEventListener("mouseenter", () => {
    targetSpeed = 0;
  });

  container.addEventListener("mouseleave", () => {
    targetSpeed = 80;
  });

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const easing = 0.08;
    currentSpeed += (targetSpeed - currentSpeed) * easing;

    offset -= currentSpeed * delta;
    const listWidth = list.offsetWidth;
    if (Math.abs(offset) >= listWidth) {
      offset = 0;
    }
    track.style.transform = `translate3d(${offset}px, 0, 0)`;

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();

