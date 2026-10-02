/* ==========================================================================
   Sharifuzzaman Hasan — Portfolio interactions
   GSAP + ScrollTrigger + SplitText + Lenis, with a no-motion fallback.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const hasSplit = hasGSAP && typeof window.SplitText !== "undefined";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const motion = root.classList.contains("motion") && hasGSAP && !reduceMotion;

  window.__siteReady = true;
  if (!motion) root.classList.remove("motion", "has-intro");
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (hasSplit) gsap.registerPlugin(SplitText);
  }

  let lenis = null;
  let menuOpen = false;
  const fontsLoaded = document.fonts ? document.fonts.ready : Promise.resolve();

  const liveRegion = $("#live-region");
  const announce = (msg) => {
    if (!liveRegion) return;
    liveRegion.textContent = "";
    requestAnimationFrame(() => (liveRegion.textContent = msg));
  };

  /* ---------- Theme ---------- */
  const themeBtn = $(".theme-toggle");
  const metaTheme = $('meta[name="theme-color"]');
  const themeColor = { dark: "#0b0b0a", light: "#f2f0ea" };
  const currentTheme = () => (root.dataset.theme === "light" ? "light" : "dark");
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (metaTheme) metaTheme.setAttribute("content", themeColor[theme]);
    if (themeBtn) themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
  };
  applyTheme(currentTheme());

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = currentTheme() === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      if (!motion || !document.startViewTransition) {
        applyTheme(next);
        return;
      }
      // Circular reveal from the toggle
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transition = document.startViewTransition(() => applyTheme(next));
      transition.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 800, easing: "cubic-bezier(0.77, 0, 0.18, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
    });
  }

  // Follow the OS theme until the visitor picks one
  const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemTheme = (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (err) {}
    if (!saved) applyTheme(e.matches ? "light" : "dark");
  };
  if (lightQuery.addEventListener) lightQuery.addEventListener("change", onSystemTheme);

  /* ---------- Clock (Asia/Dhaka) & year ---------- */
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const base = { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: false };
    const fmtHM = new Intl.DateTimeFormat("en-GB", base);
    const fmtHMS = new Intl.DateTimeFormat("en-GB", { ...base, second: "2-digit" });
    const tick = () => {
      const now = new Date();
      clocks.forEach((el) => {
        el.textContent = (el.dataset.clock === "hms" ? fmtHMS : fmtHM).format(now);
      });
    };
    tick();
    setInterval(tick, 1000);
  }
  $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

  /* ---------- Copy email ---------- */
  $$("[data-copy]").forEach((btn) => {
    let timer = 0;
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch (err) {}
        ta.remove();
      }
      btn.classList.add("is-copied");
      announce("Email address copied to clipboard");
      clearTimeout(timer);
      timer = setTimeout(() => btn.classList.remove("is-copied"), 2200);
    });
  });

  /* ---------- Header: scrolled state, hide on scroll down ---------- */
  const header = $(".header");
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      if (!menuOpen) {
        if (y > lastY + 4 && y > window.innerHeight * 0.6) header.classList.add("is-hidden");
        else if (y < lastY - 4 || y < 80) header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    update();
  }

  // Active nav link: the section crossing the middle of the viewport
  const navLinks = $$(".nav__link");
  if (navLinks.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = navLinks.find((l) => l.getAttribute("href") === `#${entry.target.id}`);
          if (link) link.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    navLinks.forEach((l) => {
      const section = document.querySelector(l.getAttribute("href"));
      if (section) navObserver.observe(section);
    });
  }

  /* ---------- Mobile menu ---------- */
  const menu = $("#menu");
  const menuBtn = $(".menu-toggle");
  const menuLabel = $(".menu-toggle__label");
  const pageRegions = [$("main"), $(".footer")].filter(Boolean);

  const setMenu = (open) => {
    if (!menu || !menuBtn || open === menuOpen) return;
    menuOpen = open;
    menuBtn.setAttribute("aria-expanded", String(open));
    if (menuLabel) menuLabel.textContent = open ? menuLabel.dataset.close : menuLabel.dataset.open;
    root.classList.toggle("menu-open", open);
    pageRegions.forEach((el) => (el.inert = open));

    if (open) {
      menu.hidden = false;
      if (lenis) lenis.stop();
      if (motion) {
        gsap.killTweensOf(menu);
        gsap.fromTo(menu, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" });
        gsap.fromTo($$(".menu__text", menu), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.3 });
        gsap.fromTo($(".menu__foot", menu), { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.65 });
      }
      const first = $(".menu__link", menu);
      if (first) first.focus({ preventScroll: true });
    } else {
      if (lenis) lenis.start();
      const done = () => (menu.hidden = true);
      if (motion) {
        gsap.killTweensOf(menu);
        gsap.to(menu, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "expo.inOut", onComplete: done });
      } else done();
    }
  };

  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  const desktopQuery = window.matchMedia("(min-width: 861px)");
  if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", (e) => e.matches && setMenu(false));

  /* ---------- In-page links ---------- */
  $$('a[href^="#"]').forEach((a) => {
    const hash = a.getAttribute("href");
    if (hash.length < 2 || hash === "#main") return;
    a.addEventListener("click", (e) => {
      const target = hash === "#top" ? document.body : document.querySelector(hash);
      if (!target) return;
      const wasOpen = menuOpen;
      setMenu(false);
      if (!lenis) {
        if (hash === "#top") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          history.replaceState(null, "", location.pathname + location.search);
        }
        return; // native anchor scrolling (+ CSS smooth scroll)
      }
      e.preventDefault();
      lenis.scrollTo(hash === "#top" ? 0 : target, { duration: wasOpen ? 1.2 : 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
      history.replaceState(null, "", hash === "#top" ? location.pathname + location.search : hash);
      if (hash !== "#top") {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

  /* ---------- Footer: fit the name to the full width ---------- */
  const footerName = $(".footer__name");
  const footerFit = $(".footer__fit");
  // Measure at 100px on the parent itself: em letter-spacing is resolved there.
  const fitFooter = () => {
    if (!footerName || !footerFit) return;
    footerName.style.fontSize = "100px";
    const w = footerFit.getBoundingClientRect().width;
    if (w > 0) footerName.style.fontSize = `${((100 * footerName.clientWidth) / w) * 0.995}px`;
  };
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(fitFooter);
  });

  /* ======================================================================
     System diagrams — orthogonal wires routed between live DOM nodes,
     with request/response beams travelling along them.
     ====================================================================== */
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };

  // Connect two boxes: straight when aligned, otherwise a single elbow.
  const route = (A, B, mode) => {
    const dx = B.cx - A.cx;
    const dy = B.cy - A.cy;
    const EPS = 6;
    if (Math.abs(dy) < EPS) {
      const y = (A.cy + B.cy) / 2;
      return dx > 0 ? [[A.r, y], [B.l, y]] : [[A.l, y], [B.r, y]];
    }
    if (Math.abs(dx) < EPS) {
      const x = (A.cx + B.cx) / 2;
      return dy > 0 ? [[x, A.b], [x, B.t]] : [[x, A.t], [x, B.b]];
    }
    if (mode === "vh") {
      const sy = dy > 0 ? A.b : A.t;
      const ex = dx > 0 ? B.l : B.r;
      return [[A.cx, sy], [A.cx, B.cy], [ex, B.cy]];
    }
    const sx = dx > 0 ? A.r : A.l;
    const ey = dy > 0 ? B.t : B.b;
    return [[sx, A.cy], [B.cx, A.cy], [B.cx, ey]];
  };

  // Polyline → path with rounded corners
  const roundedPath = (pts, radius) => {
    const f = (n) => Math.round(n * 100) / 100;
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const l1 = Math.hypot(x1 - x0, y1 - y0);
      const l2 = Math.hypot(x2 - x1, y2 - y1);
      const r = Math.min(radius, l1 / 2, l2 / 2);
      const ax = x1 - ((x1 - x0) / l1) * r;
      const ay = y1 - ((y1 - y0) / l1) * r;
      const bx = x1 + ((x2 - x1) / l2) * r;
      const by = y1 + ((y2 - y1) / l2) * r;
      d += ` L${f(ax)},${f(ay)} Q${f(x1)},${f(y1)} ${f(bx)},${f(by)}`;
    }
    const last = pts[pts.length - 1];
    return `${d} L${f(last[0])},${f(last[1])}`;
  };

  const diagrams = [];
  let rafId = 0;
  let lastFrame = 0;
  const loop = (t) => {
    const dt = lastFrame ? Math.min(0.05, (t - lastFrame) / 1000) : 0.016;
    lastFrame = t;
    let active = false;
    for (const d of diagrams) {
      if (d.running) {
        d.tick(dt);
        active = true;
      }
    }
    if (active) rafId = requestAnimationFrame(loop);
    else {
      rafId = 0;
      lastFrame = 0;
    }
  };
  const ensureLoop = () => {
    if (!rafId) rafId = requestAnimationFrame(loop);
  };

  class SystemDiagram {
    constructor(fig) {
      this.fig = fig;
      this.project = fig.closest(".project") || fig.parentElement;
      this.stage = $(".diagram__stage", fig);
      this.grid = $(".diagram__grid", fig);
      this.svg = $(".diagram__wires", fig);
      this.nodes = {};
      $$("[data-node]", fig).forEach((n) => (this.nodes[n.dataset.node] = n));

      let spec = [];
      try {
        spec = JSON.parse(fig.dataset.edges || "[]");
      } catch (e) {}
      this.edges = spec
        .filter(([a, b]) => this.nodes[a] && this.nodes[b])
        .map(([from, to, type = "req", mode = "one", via = "hv"]) => ({ from, to, type, mode, via, hot: false }));

      this.visible = false;
      this.live = false;
      this.running = false;

      this.build();
      this.layout();
      if ("ResizeObserver" in window) {
        this.ro = new ResizeObserver(() => this.layout());
        this.ro.observe(this.stage);
        Object.values(this.nodes).forEach((n) => this.ro.observe(n));
      }
      this.bindFocus();
    }

    build() {
      this.svg.textContent = "";
      this.gWires = svgEl("g", { class: "wires" });
      this.gBeams = svgEl("g", { class: "beams" });
      this.svg.append(this.gWires, this.gBeams);
      this.edges.forEach((e) => {
        e.g = svgEl("g", { class: "edge" });
        e.wire = svgEl("path", { class: `wire wire--${e.type}` });
        e.p1 = svgEl("circle", { class: "port", r: 2.5 });
        e.p2 = svgEl("circle", { class: "port", r: 2.5 });
        e.g.append(e.wire, e.p1, e.p2);
        this.gWires.append(e.g);

        e.gb = svgEl("g", { class: "edge" });
        e.glow = svgEl("path", { class: "beam-glow" });
        e.beam = svgEl("path", { class: "beam" });
        e.gb.append(e.glow, e.beam);
        this.gBeams.append(e.gb);

        e.state = { p: 0, dir: 1, wait: 0.2 + Math.random() * 1.6 };
      });
      if (!motion) this.gBeams.style.display = "none";
    }

    // Node box relative to the stage, from layout offsets (ignores transforms)
    box(el) {
      const l = el.offsetLeft + this.grid.offsetLeft;
      const t = el.offsetTop + this.grid.offsetTop;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      return { l, t, r: l + w, b: t + h, cx: l + w / 2, cy: t + h / 2 };
    }

    layout() {
      const w = this.stage.clientWidth;
      const h = this.stage.clientHeight;
      if (!w || !h) return;
      this.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      this.edges.forEach((e) => {
        const pts = route(this.box(this.nodes[e.from]), this.box(this.nodes[e.to]), e.via);
        const d = roundedPath(pts, 12);
        e.wire.setAttribute("d", d);
        e.glow.setAttribute("d", d);
        e.beam.setAttribute("d", d);
        e.len = e.wire.getTotalLength();
        e.B = Math.max(8, Math.min(34, e.len * 0.45));
        const dash = `${e.B} ${e.len + e.B}`;
        e.beam.setAttribute("stroke-dasharray", dash);
        e.glow.setAttribute("stroke-dasharray", dash);
        const [sx, sy] = pts[0];
        const [ex, ey] = pts[pts.length - 1];
        e.p1.setAttribute("cx", sx);
        e.p1.setAttribute("cy", sy);
        e.p2.setAttribute("cx", ex);
        e.p2.setAttribute("cy", ey);
        this.paint(e);
      });
    }

    // Beam occupies [s, s + B] along the path; s runs from -B to len
    paint(e) {
      const { p, dir } = e.state;
      const s = -e.B + p * (e.len + e.B);
      const offset = dir > 0 ? -s : s + e.B - e.len;
      e.beam.style.strokeDashoffset = offset;
      e.glow.style.strokeDashoffset = offset;
    }

    tick(dt) {
      for (const e of this.edges) {
        const st = e.state;
        if (st.wait > 0) {
          st.wait -= dt * (e.hot ? 3 : 1);
          continue;
        }
        const speed = (e.type === "evt" ? 150 : 115) * (e.hot ? 1.7 : 1);
        st.p += (dt * speed) / (e.len + e.B);
        if (st.p >= 1) {
          st.p = 0;
          this.ping(st.dir > 0 ? e.to : e.from);
          if (e.mode === "both") {
            // request → short pause → response → longer pause
            if (st.dir > 0) {
              st.dir = -1;
              st.wait = 0.12 + Math.random() * 0.3;
            } else {
              st.dir = 1;
              st.wait = 0.7 + Math.random() * 1.6;
            }
          } else {
            st.wait = e.type === "evt" ? 1.6 + Math.random() * 2.4 : 0.6 + Math.random() * 1.5;
          }
        }
        this.paint(e);
      }
    }

    ping(id) {
      const node = this.nodes[id];
      if (!node) return;
      node.classList.add("is-ping");
      clearTimeout(node._ping);
      node._ping = setTimeout(() => node.classList.remove("is-ping"), 380);
    }

    bindFocus() {
      $$("[data-nodes]", this.project).forEach((li) => {
        const ids = li.dataset.nodes.split(/\s+/);
        li.addEventListener("mouseenter", () => this.focus(ids));
        li.addEventListener("mouseleave", () => this.focus(null));
      });
    }

    focus(ids) {
      const on = Array.isArray(ids);
      this.fig.classList.toggle("is-focus", on);
      for (const k in this.nodes) this.nodes[k].classList.toggle("is-on", on && ids.includes(k));
      this.edges.forEach((e) => {
        e.hot = on && ids.includes(e.from) && ids.includes(e.to);
        e.g.classList.toggle("is-on", e.hot);
        e.gb.classList.toggle("is-on", e.hot);
      });
    }

    enter() {
      if (this.entered) return;
      this.entered = true;
      if (!motion) {
        this.fig.classList.add("is-ready");
        return;
      }
      const nodes = Object.values(this.nodes);
      gsap
        .timeline({
          onComplete: () => {
            this.fig.classList.add("is-ready");
            this.live = true;
            this.sync();
          },
        })
        .fromTo(nodes, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.06 }, 0)
        .fromTo(this.svg, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0.1)
        .fromTo(this.gBeams, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.2);
    }

    setVisible(v) {
      this.visible = v;
      if (v) this.enter();
      this.sync();
    }

    sync() {
      this.running = motion && this.live && this.visible && !document.hidden;
      this.fig.classList.toggle("is-running", this.running);
      if (this.running) ensureLoop();
    }
  }

  const initDiagrams = () => {
    const figs = $$(".diagram[data-edges]");
    if (!figs.length) return;
    figs.forEach((fig) => {
      const d = new SystemDiagram(fig);
      fig.__diagram = d;
      diagrams.push(d);
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((en) => en.target.__diagram.setVisible(en.isIntersecting)),
        { rootMargin: "0px 0px -12% 0px" }
      );
      figs.forEach((fig) => io.observe(fig));
    } else {
      diagrams.forEach((d) => d.setVisible(true));
    }
    document.addEventListener("visibilitychange", () => diagrams.forEach((d) => d.sync()));
    fontsLoaded.then(() => diagrams.forEach((d) => d.layout()));
  };

  /* ======================================================================
     Motion
     ====================================================================== */
  const initLenis = () => {
    if (typeof window.Lenis === "undefined") return;
    lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  };

  const initMagnetic = () => {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  };

  // Intro — counter, then the panel lifts away
  const introIn = () =>
    new Promise((resolve) => {
      const num = $(".intro__num");
      const counter = { v: 0 };
      try {
        sessionStorage.setItem("intro-seen", "1");
      } catch (e) {}
      gsap
        .timeline({ onComplete: resolve })
        .fromTo(".intro__line > span, .intro__num", { y: 0, yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0)
        .to(counter, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => (num.textContent = Math.round(counter.v)) }, 0.1)
        .to(".intro__bar span", { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0.1);
    });

  const introOut = () => {
    const intro = $(".intro");
    gsap
      .timeline({
        onComplete: () => {
          intro.remove();
          root.classList.remove("has-intro");
          if (lenis && !menuOpen) lenis.start();
        },
      })
      .to(".intro__line > span, .intro__num", { yPercent: -110, duration: 0.7, ease: "expo.in", stagger: 0.04 }, 0)
      .to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15, ease: "expo.inOut" }, 0.45);
  };

  // Hero entrance
  const heroIn = (delay) => {
    const title = $(".hero__title");
    if (hasSplit) {
      let first = true;
      SplitText.create(title, {
        type: "lines",
        mask: "lines",
        linesClass: "line",
        autoSplit: true,
        onSplit(self) {
          gsap.set(title, { visibility: "visible" });
          if (!first) return undefined;
          first = false;
          return gsap.from(self.lines, { yPercent: 110, duration: 1.5, ease: "expo.out", stagger: 0.1, delay: delay + 0.15 });
        },
      });
    } else {
      gsap.set(title, { visibility: "visible" });
      gsap.from(title, { opacity: 0, y: 40, duration: 1.4, ease: "expo.out", delay: delay + 0.15 });
    }

    gsap
      .timeline({ delay, defaults: { ease: "expo.out" } })
      .to(".header", { opacity: 1, duration: 1.4 }, 0.2)
      .fromTo(".hero__lines span", { scaleY: 0 }, { scaleY: 1, duration: 1.8, ease: "expo.inOut", stagger: 0.08 }, 0)
      .fromTo(".hero__meta .meta", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.07 }, 0.45)
      .fromTo(".hero__lede", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.3 }, 0.8)
      .fromTo(".hero__cta", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.3 }, 0.9);

    // Gentle parallax as the hero leaves
    gsap.to(title, {
      yPercent: -14,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  };

  // Scroll-driven reveals
  const initReveals = () => {
    const once = (trigger, start = "top 88%") => ({ trigger, start, once: true });

    // Headings: masked line reveals
    $$("[data-split]").forEach((el) => {
      if (!hasSplit) {
        gsap.set(el, { visibility: "visible" });
        gsap.from(el, { opacity: 0, y: 30, duration: 1.2, ease: "expo.out", scrollTrigger: once(el) });
        return;
      }
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "line",
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: "visible" });
          return gsap.from(self.lines, { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.08, scrollTrigger: once(el, "top 90%") });
        },
      });
    });

    // About statement: words light up as you read
    const statement = $("[data-words]");
    if (statement && hasSplit) {
      const split = SplitText.create(statement, { type: "words", wordsClass: "word" });
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 48%", scrub: 0.6 } }
      );
    }

    // Portrait
    const portrait = $(".about__portrait");
    if (portrait) {
      gsap
        .timeline({ scrollTrigger: once(portrait, "top 84%") })
        .fromTo($(".about__img", portrait), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" }, 0)
        .fromTo($("img", portrait), { scale: 1.35 }, { scale: 1, duration: 2.2, ease: "expo.out" }, 0.25)
        .fromTo($("figcaption", portrait), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 0.9);
    }

    // Generic fades
    $$("[data-fade]").forEach((el) => {
      gsap.from(el, { y: 28, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: once(el, "top 90%") });
    });
    $$("[data-stagger]").forEach((el) => {
      gsap.from(el.children, { y: 26, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: once(el, "top 88%") });
    });

    // Section hairlines draw in
    $$(".section__head").forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => el.classList.add("is-in") });
    });

    // Impact counters
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      el.style.display = "inline-block";
      el.style.minWidth = `${el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize)}em`;
      el.textContent = "0";
      gsap.to(obj, {
        v: end,
        duration: 2.2,
        ease: "power3.out",
        scrollTrigger: once(el, "top 92%"),
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      });
    });

    // Footer name: letters rise into place
    if (footerFit && hasSplit) {
      SplitText.create(footerFit, {
        type: "words,chars",
        mask: "words",
        wordsClass: "word",
        charsClass: "char",
        onSplit(self) {
          return gsap.from(self.chars, { yPercent: 115, duration: 1.4, ease: "expo.out", stagger: 0.025, scrollTrigger: once(footerName, "top 96%") });
        },
      });
    }
  };

  /* ---------- Boot ---------- */
  initDiagrams();

  if (!motion) {
    const intro = $(".intro");
    if (intro) intro.remove();
    fontsLoaded.then(fitFooter);
    fitFooter();
    $$(".section__head").forEach((el) => el.classList.add("is-in"));
    return;
  }

  initLenis();
  initMagnetic();

  (async () => {
    const intro = root.classList.contains("has-intro") && $(".intro");
    if (intro) {
      if (lenis) lenis.stop();
      await Promise.race([fontsLoaded, wait(900)]);
      await introIn();
    }
    await Promise.race([fontsLoaded, wait(2500)]);
    try {
      initReveals();
    } catch (err) {
      // Never leave content hidden because of an animation error
      console.error(err);
      root.classList.remove("motion");
    }
    fitFooter();
    if (intro) introOut();
    heroIn(intro ? 0.55 : 0.05);
    ScrollTrigger.refresh();
  })();
})();
