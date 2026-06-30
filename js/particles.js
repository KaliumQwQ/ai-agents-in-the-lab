/* particles.js — molecular / network background via tsParticles (slim bundle) */
(async function () {
  if (!window.tsParticles) return;
  try { if (window.loadSlim) await window.loadSlim(window.tsParticles); } catch (e) {}
  tsParticles.load({
    id: "particles",
    options: {
      fpsLimit: 60,
      detectRetina: true,
      background: { color: "transparent" },
      particles: {
        number: { value: Math.min(window.innerWidth, window.innerHeight) <= 540 ? 26 : 64, density: { enable: true, area: 900 } },
        color: { value: ["#38bdf8", "#a78bfa", "#f472b6", "#a3e635"] },
        links: {
          enable: true, distance: 150, color: "#3b5168",
          opacity: 0.35, width: 1
        },
        move: {
          enable: true, speed: 0.6, direction: "none",
          outModes: { default: "bounce" }, random: true
        },
        opacity: { value: { min: 0.2, max: 0.6 } },
        size: { value: { min: 1, max: 3 } }
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
          resize: { enable: true }
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.7 } }
        }
      }
    }
  });
})();
