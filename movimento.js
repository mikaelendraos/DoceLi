// DoceLi · movimento do site (versão 2).
// Tudo aqui é acabamento: sem este arquivo o site continua completo,
// com o primeiro doce da vitrine parado e todo o conteúdo visível.
(() => {
  const raiz = document.documentElement;
  raiz.classList.add('js');

  const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
  const pode = () => !reduzir.matches && typeof Element.prototype.animate === 'function';

  const EXPO = 'cubic-bezier(.16, 1, .3, 1)';
  const SUAVE = 'cubic-bezier(.2, .7, .3, 1)';
  const SAI = 'cubic-bezier(.5, 0, .75, 0)';

  // "backwards": o estado inicial vale durante o atraso e, no fim, o CSS volta a mandar
  const animar = (el, quadros, opcoes) =>
    el ? el.animate(quadros, { fill: 'backwards', ...opcoes }) : null;
  // aba em segundo plano pausa as animações; o limite de tempo evita troca de doce presa
  const terminar = (lista) => Promise.race([
    Promise.all(lista.filter(Boolean).map((a) => a.finished.catch(() => {}))),
    new Promise((pronto) => setTimeout(pronto, 1600)),
  ]);

  /* ── topo encolhe ao rolar ───────────────────────────── */
  const topo = document.querySelector('.topo');
  if (topo) {
    const marcar = () => topo.classList.toggle('rolou', window.scrollY > 24);
    marcar();
    addEventListener('scroll', marcar, { passive: true });
  }

  /* ── capa ────────────────────────────────────────────── */
  const vitrine = document.querySelector('.vitrine');

  if (vitrine) {
    const palco = vitrine.querySelector('.palco');
    const cenas = [...vitrine.querySelectorAll('.cena')];
    const botoes = [...vitrine.querySelectorAll('.cena-botao')];
    const particulas = [...vitrine.querySelectorAll('.p')];
    const pingos = [...vitrine.querySelectorAll('.ganache .pingo')];
    const aviso = vitrine.querySelector('.cena-aviso');
    let atual = 0;
    let ocupado = false;

    const partes = (cena) => ({
      doce: cena.querySelector('.cena-doce'),
      pilulas: [...cena.querySelectorAll('.pilulas li')],
      info: [...cena.querySelectorAll('.cena-info > *')],
    });

    // o doce desce até a boleira e assenta; pílulas chegam pela direita; o nome sobe
    function entrar(cena, ritmo = 1, atraso = 0) {
      const p = partes(cena);
      const t = (ms) => ms * ritmo;
      return terminar([
        animar(p.doce, [
          { opacity: 0, transform: 'translateY(-70px) rotate(-6deg)' },
          { opacity: 1, offset: .35 },
          { opacity: 1, transform: 'none' },
        ], { duration: t(1100), delay: atraso + t(80), easing: EXPO }),
        ...p.pilulas.map((li, i) => animar(li,
          [{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }],
          { duration: t(700), delay: atraso + t(520 + i * 90), easing: EXPO })),
        ...p.info.map((el, i) => animar(el,
          [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
          { duration: t(640), delay: atraso + t(380 + i * 70), easing: EXPO })),
      ]);
    }

    // o doce sai da boleira pelo alto
    function sair(cena) {
      const p = partes(cena);
      const o = { duration: 380, easing: SAI, fill: 'forwards' };
      return terminar([
        animar(p.doce, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-60px) rotate(5deg)' }], o),
        ...p.pilulas.map((li, i) => animar(li, [{ opacity: 1 }, { opacity: 0, transform: 'translateX(16px)' }], { ...o, delay: i * 30 })),
        ...p.info.map((el) => animar(el, [{ opacity: 1 }, { opacity: 0 }], { ...o, duration: 240 })),
      ]);
    }

    // a boleira balança de leve quando o doce assenta
    const assentar = (atraso) => animar(vitrine.querySelector('.boleira'),
      [{ transform: 'translateY(0)' }, { transform: 'translateY(3px)', offset: .4 }, { transform: 'translateY(0)' }],
      { duration: 600, delay: atraso, easing: SUAVE });

    const temCSS = typeof CSSAnimation !== 'undefined';
    const zerar = (cena) => cena.querySelectorAll('*').forEach((el) =>
      el.getAnimations().forEach((a) => { if (!(temCSS && a instanceof CSSAnimation)) a.cancel(); }));

    async function mostrar(n) {
      if (n === atual || ocupado) return;
      ocupado = true;
      const velha = cenas[atual];
      const nova = cenas[n];
      botoes.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n)));
      if (pode()) await sair(velha);
      velha.hidden = true;
      zerar(velha);
      nova.hidden = false;
      atual = n;
      pedir();
      if (aviso) aviso.textContent = `${nova.getAttribute('aria-label')}, ${n + 1} de ${cenas.length}`;
      if (pode()) {
        assentar(520);
        await entrar(nova, .8);
      }
      ocupado = false;
    }

    botoes.forEach((botao, i) => {
      botao.addEventListener('click', () => mostrar(i));
      botao.addEventListener('keydown', (e) => {
        const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!passo) return;
        e.preventDefault();
        const destino = (i + passo + botoes.length) % botoes.length;
        botoes[destino].focus();
        mostrar(destino);
      });
    });

    // profundidade: camadas seguem o mouse com forças diferentes (só no desktop)
    let alvoX = 0, alvoY = 0, x = 0, y = 0, laco = 0;
    const camadas = () => [
      [cenas[atual].querySelector('.doce-flutua'), 14],
      [vitrine.querySelector('.selo-giro'), -10],
      ...particulas.map((el) => [el, 30 * (parseFloat(el.style.getPropertyValue('--prof')) || .5)]),
    ];
    function aplicar() {
      laco = 0;
      x += (alvoX - x) * .09;
      y += (alvoY - y) * .09;
      const livre = mouse.matches;
      for (const [el, forca] of camadas()) {
        if (!el) continue;
        el.style.translate = livre ? `${(x * forca).toFixed(2)}px ${(y * forca).toFixed(2)}px` : '';
      }
      if (Math.abs(alvoX - x) > .002 || Math.abs(alvoY - y) > .002) pedir();
    }
    function pedir() {
      if (!laco && pode()) laco = requestAnimationFrame(aplicar);
    }
    vitrine.addEventListener('pointermove', (e) => {
      if (!mouse.matches) return;
      const r = vitrine.getBoundingClientRect();
      alvoX = (e.clientX - r.left) / r.width - .5;
      alvoY = (e.clientY - r.top) / r.height - .5;
      pedir();
    });
    vitrine.addEventListener('pointerleave', () => { alvoX = 0; alvoY = 0; pedir(); });

    // abertura: o título sobe linha a linha, o palco aparece, a ganache escorre, o doce assenta
    if (pode()) {
      const linhas = [...document.querySelectorAll('.capa-titulo .linha')];
      linhas.forEach((linha, i) => {
        const script = linha.classList.contains('script');
        animar(linha, script
          ? [{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }]
          : [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(.35em)' }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }],
          { duration: script ? 900 : 820, delay: 120 + i * 140, easing: script ? SUAVE : EXPO });
      });
      [...document.querySelectorAll('.capa-lead, .capa-acoes, .fatos')].forEach((el, i) =>
        animar(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, delay: 560 + i * 110, easing: EXPO }));

      animar(palco, [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 60, easing: EXPO });
      animar(vitrine.querySelector('.ganache-base'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }],
        { duration: 700, delay: 280, easing: EXPO });
      pingos.forEach((g) => {
        const atraso = parseFloat(g.style.getPropertyValue('--atraso')) || 0;
        animar(g, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(.35)', offset: .3 }, { transform: 'scaleY(1)' }],
          { duration: 1500 + atraso * 900, delay: 520 + atraso * 1000, easing: 'cubic-bezier(.3, .6, .2, 1)' });
      });
      animar(vitrine.querySelector('.boleira'), [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
        { duration: 700, delay: 380, easing: EXPO });
      animar(vitrine.querySelector('.selo-giro'), [{ opacity: 0, transform: 'scale(.4) rotate(-40deg)' }, { opacity: 1, transform: 'none' }],
        { duration: 900, delay: 1300, easing: EXPO });
      entrar(cenas[0], 1, 700);
      assentar(1450);
      particulas.forEach((el, i) => animar(el, [{ opacity: 0, scale: 0 }, { opacity: 1, scale: 1 }],
        { duration: 700, delay: 1200 + i * 70, easing: EXPO }));
      botoes.forEach((b, i) => animar(b, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 600, delay: 1400 + i * 80, easing: EXPO }));
    }
  }

  /* ── carrossel de destaques ──────────────────────────── */
  const trilho = document.querySelector('.trilho');
  const setas = document.querySelector('.setas');
  if (trilho && setas) {
    setas.hidden = false;
    const [antes, depois] = setas.querySelectorAll('.seta');
    const atualizar = () => {
      const fim = trilho.scrollWidth - trilho.clientWidth - 4;
      antes.disabled = trilho.scrollLeft <= 4;
      depois.disabled = trilho.scrollLeft >= fim;
    };
    setas.querySelectorAll('.seta').forEach((seta) => seta.addEventListener('click', () => {
      const card = trilho.querySelector('.card');
      const passo = card ? card.getBoundingClientRect().width + 24 : trilho.clientWidth;
      trilho.scrollBy({ left: passo * Number(seta.dataset.dir), behavior: reduzir.matches ? 'auto' : 'smooth' });
    }));
    trilho.addEventListener('scroll', atualizar, { passive: true });
    addEventListener('resize', atualizar);
    atualizar();
  }

  /* ── botão fixo de encomendar ────────────────────────── */
  // a capa já tem o próprio botão de pedido: o fixo só aparece depois dela
  const fab = document.querySelector('.fab');
  const capa = document.querySelector('.capa');
  if (fab && capa && 'IntersectionObserver' in window) {
    fab.classList.add('escondido');
    new IntersectionObserver(([e]) => fab.classList.toggle('escondido', e.isIntersecting),
      { rootMargin: '0px 0px -40% 0px' }).observe(capa);
  }

  /* ── etiquetas da faixa com frase: profundidade ao rolar ─ */
  const frase = document.querySelector('.frase');
  if (frase && pode()) {
    const etiquetas = [...frase.querySelectorAll('.etiquetas li')];
    let pendente = false;
    const mover = () => {
      pendente = false;
      const r = frase.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const meio = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      etiquetas.forEach((el) => {
        const prof = parseFloat(el.style.getPropertyValue('--prof')) || .5;
        el.style.transform = `translateY(${(meio * prof * 90).toFixed(1)}px)`;
      });
    };
    addEventListener('scroll', () => { if (!pendente) { pendente = true; requestAnimationFrame(mover); } }, { passive: true });
    mover();
  }

  /* ── entradas ao rolar ───────────────────────────────── */
  const alvos = document.querySelectorAll(
    '.destaques .cabeca-linha, .card, .como-titulo, .passo, .passos, .salgadas-foto, .salgadas-conteudo > *, ' +
    '.fita-trilho .impressa:not(.clone), .versao, .cabeca, .ficha-mesa .impressa, .ficha-texto, ' +
    '.frase-env, .tambem-foto, .tambem-texto, .final-texto, .final-foto'
  );

  if (pode() && 'IntersectionObserver' in window && alvos.length) {
    const vizinhos = new Map();
    alvos.forEach((el) => {
      const ordem = vizinhos.get(el.parentElement) || 0;
      vizinhos.set(el.parentElement, ordem + 1);
      el.style.setProperty('--ordem', Math.min(ordem, 5));
      if (!el.classList.contains('passos')) el.classList.add('revela');
    });
    raiz.classList.add('revela-pronto');

    const olho = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('revelado');
        olho.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });

    alvos.forEach((el) => olho.observe(el));
    addEventListener('beforeprint', () => alvos.forEach((el) => el.classList.add('revelado')));
  }
})();
