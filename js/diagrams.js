/* diagrams.js — GSAP-driven, web-native animations.
   Each exported function animates a diagram that lives in index.html.
   reveal-init.js calls the right one when its slide becomes active. */
(function () {
  const g = window.gsap;

  /* ---- animated number counters: any [data-count] inside root ---- */
  function counters(root) {
    (root || document).querySelectorAll("[data-count]").forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || "0", 10);
      const pre = el.dataset.pre || "", suf = el.dataset.suf || "";
      const obj = { v: 0 };
      if (!g) { el.textContent = pre + end.toFixed(dec) + suf; return; }
      g.to(obj, {
        v: end, duration: 1.6, ease: "power2.out",
        onUpdate: () => { el.textContent = pre + obj.v.toFixed(dec) + suf; }
      });
    });
  }

  /* ---- SVG path self-draw helper ---- */
  function draw(sel, root, dur = 1.2, delay = 0) {
    (root || document).querySelectorAll(sel).forEach((path) => {
      const len = path.getTotalLength ? path.getTotalLength() : 300;
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      if (!g) { path.style.strokeDashoffset = 0; return; }
      g.to(path, { strokeDashoffset: 0, duration: dur, delay, ease: "power1.inOut" });
    });
  }

  /* ---- Tafel slope three-way decomposition bar ---- */
  function tafel() {
    const bar = document.getElementById("tafel-bar");
    if (!bar || bar.dataset.done) return; bar.dataset.done = "1";
    const segs = bar.querySelectorAll("div");      // [et, coverage, polarity]
    const widths = ["46%", "30%", "24%"];
    segs.forEach((s, idx) => {
      if (g) g.to(s, { width: widths[idx], duration: 1.1, delay: idx * 0.25, ease: "power2.out" });
      else s.style.width = widths[idx];
    });
  }

  /* ---- OAT mechanism: PPh3 (a ball) approaches the O and carries it away ----
     Replayable via window.DIAGRAMS.oatReplay() (wired to a button).        */
  function oatPlay() {
    const root = document.getElementById("oat");
    if (!root) return;
    const q = (s) => root.querySelector(s);
    const oxo = q(".oxo-grp"), ph3 = q(".ph3-grp"), bond = q(".bond"),
          opbond = q(".opbond"), cap = q(".oxo-cap"), prod = q(".prod-cap"),
          gamma = q(".gamma"), glbl = q(".gamma-lbl"), gp = q(".gamma path");
    if (!g) {                                  // static end-state fallback
      [opbond, prod, gamma, glbl].forEach(e => e && (e.style.opacity = 1));
      if (ph3) ph3.setAttribute("transform", "translate(-50,0)");
      if (oxo) oxo.setAttribute("transform", "translate(200,0)");
      return;
    }
    g.killTweensOf([oxo, ph3, opbond, bond, cap, prod, gamma, glbl, gp]);
    g.set([oxo, opbond], { x: 0 }); g.set(ph3, { x: 0 });
    g.set([bond, cap], { opacity: 1 });
    g.set([opbond, prod, gamma, glbl], { opacity: 0 });
    if (gp) { const L = gp.getTotalLength(); g.set(gp, { strokeDasharray: L, strokeDashoffset: L }); }
    const tl = g.timeline();
    tl.to(ph3, { x: -250, duration: 1.0, ease: "power2.out" })          // PPh3 ball approaches O
      .to(bond, { opacity: 0.16, duration: 0.4 }, "-=0.15")             // Au–O bond breaks
      .to(cap, { opacity: 0, duration: 0.3 }, "<")
      .set(opbond, { opacity: 1 })                                      // O–P bond forms
      .to([oxo, ph3, opbond], { x: "+=205", duration: 1.1, ease: "power1.inOut" }) // pair carries O off
      .to(prod, { opacity: 1, duration: 0.4 }, "<")
      .to([gamma, glbl], { opacity: 1, duration: 0.5 }, "<");
    if (gp) g.to(gp, { strokeDashoffset: 0, duration: 0.8 }, "-=0.6");
  }
  function oat() {
    const root = document.getElementById("oat");
    if (!root || root.dataset.done) return; root.dataset.done = "1";
    oatPlay();
  }

  /* ---- circular agent loop: read -> act -> observe -> read ---- */
  function cycle() {
    const root = document.getElementById("agentloop");
    const slide = root && root.closest("section");
    if (!slide || slide.dataset.cycDone) return; slide.dataset.cycDone = "1";
    if (!g) return;
    g.from(root.querySelectorAll(".cyc-node"),
      { opacity: 0, y: 14, stagger: 0.15, duration: 0.5, ease: "power2.out" });
    root.querySelectorAll(".cyc-arc").forEach((p, i) => {
      const L = p.getTotalLength();
      g.set(p, { strokeDasharray: L, strokeDashoffset: L });
      g.to(p, { strokeDashoffset: 0, duration: 0.6, delay: 0.35 + i * 0.2, ease: "power1.inOut" });
    });
  }

  /* ---- equivalent circuit: (C_dl ∥ C_φ) ∥ R_rxn ; external open, so the
     capacitors self-discharge through the chemical-reaction resistance R. ---- */
  function circuit() {
    const root = document.getElementById("circuit");
    const slide = root && root.closest("section");
    if (!slide || slide.dataset.cirDone) return; slide.dataset.cirDone = "1";
    if (!g) return;
    g.from(root.querySelectorAll(".cir-el"),
      { opacity: 0, y: 10, stagger: 0.05, duration: 0.45, ease: "power2.out" });
    const dot = root.querySelector(".q-dot");   // discharge current looping through C_φ and R
    if (dot) {
      const pts = [[330, 92], [375, 92], [375, 250], [290, 250], [290, 92], [330, 92]];
      g.set(dot, { attr: { cx: 330, cy: 92 }, opacity: 1 });
      const tl = g.timeline({ repeat: -1, delay: 0.8 });
      for (let i = 1; i < pts.length; i++) {
        const x = pts[i][0], y = pts[i][1], px = pts[i - 1][0], py = pts[i - 1][1];
        const dur = (Math.abs(x - px) + Math.abs(y - py)) / 200;
        tl.to(dot, { attr: { cx: x, cy: y }, duration: Math.max(dur, 0.15), ease: "none" });
      }
    }
  }

  /* ---- multi-agent fan-out: orchestrator -> workers -> synthesis ---- */
  function fanout() {
    const root = document.getElementById("fanout");
    const slide = root && root.closest("section");
    if (!slide || slide.dataset.fanDone) return; slide.dataset.fanDone = "1";
    const nodes = root.querySelectorAll(".fa-node");
    const lines = root.querySelectorAll(".fa-line");
    if (!g) {
      nodes.forEach(n => n.style.opacity = 1); lines.forEach(l => l.style.opacity = 1); return;
    }
    g.from(nodes, { opacity: 0, y: 14, stagger: 0.1, duration: 0.5, ease: "power2.out" });
    lines.forEach((l, i) => {
      const L = l.getTotalLength ? l.getTotalLength() : 200;
      g.set(l, { strokeDasharray: L, strokeDashoffset: L, opacity: 1 });
      g.to(l, { strokeDashoffset: 0, duration: 0.6, delay: 0.25 + i * 0.05, ease: "power1.inOut" });
    });
  }

  /* ---- PCET vs OAT pathways: in aprotic, PCET is switched off ---- */
  function pathways() {
    const root = document.getElementById("pathways");
    if (!root || root.dataset.done) return; root.dataset.done = "1";
    if (!g) return;
    g.from(root.querySelectorAll(".pw-row"), { x: -30, opacity: 0, stagger: 0.25, duration: 0.7, ease: "power2.out" });
    g.to(root.querySelector(".pw-cross"), { opacity: 1, scale: 1, duration: 0.6, delay: 1.1, ease: "back.out(2)" });
    g.to(root.querySelector(".pw-a"), { opacity: 0.35, duration: 0.6, delay: 1.1 });
  }

  /* ---- spectro-electrochemical cell schematic reveal ---- */
  function cell() {
    const root = document.getElementById("cell");
    const slide = root && root.closest("section");
    if (!slide || slide.dataset.cellDone) return; slide.dataset.cellDone = "1";
    const steps = slide.querySelectorAll(".reveal-step");   // svg groups + side cards
    if (!g) { steps.forEach(e => e.style.opacity = 1); return; }
    g.set(steps, { opacity: 1 });                           // clear any inline opacity:0
    g.from(steps, { opacity: 0, y: 18, stagger: 0.18, duration: 0.7, ease: "power2.out" });
    draw(".laser", root, 0.8, 0.6);
  }

  /* ---- generic fade-up for any .anim-up inside a slide ---- */
  function up(root) {
    if (!g || !root) return;
    const els = root.querySelectorAll(".anim-up");
    if (!els.length) return;
    g.from(els, { opacity: 0, y: 20, stagger: { each: 0.07, amount: Math.min(0.7, els.length * 0.07) },
      duration: 0.5, ease: "power2.out" });
  }

  window.DIAGRAMS = { counters, tafel, oat, oatReplay: oatPlay, fanout, cycle, circuit, pathways, cell, up, draw };
})();
