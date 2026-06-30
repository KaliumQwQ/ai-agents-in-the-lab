/* reveal-init.js — configure reveal.js and drive per-slide animations.
   Loaded last (classic scripts, no modules) so it works from file://. */
(function () {
  /* ---------- terminal typewriter ---------- */
  function typeTerminal(term) {
    if (term.dataset.typed) return; term.dataset.typed = "1";
    const lines = Array.prototype.slice.call(term.querySelectorAll(".line"));
    lines.forEach((l) => { l.dataset.full = l.textContent; l.textContent = ""; l.style.visibility = "hidden"; });
    let li = 0;
    (function nextLine() {
      if (li >= lines.length) { term.classList.add("done"); return; }
      const l = lines[li]; l.style.visibility = "visible";
      const full = l.dataset.full;
      if (!l.classList.contains("cmd")) {            // output: reveal instantly
        l.textContent = full; li++; setTimeout(nextLine, 200); return;
      }
      let ci = 0;                                     // command: type char by char
      (function typeChar() {
        l.textContent = full.slice(0, ci); ci++;
        if (ci <= full.length) setTimeout(typeChar, 16 + Math.random() * 22);
        else { li++; setTimeout(nextLine, 280); }
      })();
    })();
  }

  /* ---------- dispatch animations for a slide ---------- */
  function runAnims(slide) {
    if (!slide) return;
    const a = (slide.dataset.anim || "").split(/\s+/);
    const D = window.DIAGRAMS || {};
    if (a.indexOf("counters") >= 0 && D.counters) D.counters(slide);
    if (a.indexOf("up") >= 0 && D.up) D.up(slide);
    if (a.indexOf("tafel") >= 0 && D.tafel) D.tafel();
    if (a.indexOf("oat") >= 0 && D.oat) D.oat();
    if (a.indexOf("cycle") >= 0 && D.cycle) D.cycle();
    if (a.indexOf("circuit") >= 0 && D.circuit) D.circuit();
    if (a.indexOf("fanout") >= 0 && D.fanout) D.fanout();
    if (a.indexOf("pathways") >= 0 && D.pathways) D.pathways();
    if (a.indexOf("cell") >= 0 && D.cell) D.cell();
    if (a.indexOf("term") >= 0)
      slide.querySelectorAll(".term.typewriter").forEach(typeTerminal);
    if (a.indexOf("cv") >= 0 && window.CVDemo) {
      window.CVDemo.ensure();
      setTimeout(function () { if (window.Plotly) try { Plotly.Plots.resize("cvplot"); } catch (e) {} }, 80);
    }
  }

  /* ---------- mobile (small screen) → reflow instead of fixed 16:9 scaling ---------- */
  var MOBILE = Math.min(window.innerWidth, window.innerHeight) <= 540;
  if (MOBILE) document.documentElement.classList.add("is-mobile");

  /* ---------- init reveal ---------- */
  Reveal.initialize({
    width: 1600, height: 900, margin: MOBILE ? 0.02 : 0.045, minScale: 0.2, maxScale: 2.0,
    hash: true, history: true, controls: !MOBILE, progress: true,
    slideNumber: "c/t", overview: !MOBILE, center: !MOBILE, disableLayout: MOBILE,
    transition: MOBILE ? "none" : "fade", transitionSpeed: "default", backgroundTransition: "fade",
    plugins: [RevealHighlight, RevealNotes, RevealMath.MathJax3],
    mathjax3: {
      mathjax: "vendor/mathjax/tex-svg.js",
      tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]] },
      svg: { fontCache: "global" }
    }
  }).then(function () {
    runAnims(Reveal.getCurrentSlide());
  });

  Reveal.on("slidechanged", function (e) { runAnims(e.currentSlide); });

  /* wire CV demo buttons (event delegation; buttons live inside a slide) */
  document.addEventListener("click", function (e) {
    const id = e.target && e.target.id;
    if (id === "cv-play" && window.CVDemo) window.CVDemo.toggle();
    if (id === "cv-reset" && window.CVDemo) window.CVDemo.reset();
    if (id === "oat-replay" && window.DIAGRAMS && window.DIAGRAMS.oatReplay) window.DIAGRAMS.oatReplay();
  });
})();
