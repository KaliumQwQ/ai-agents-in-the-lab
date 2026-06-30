# AI Agents in the Lab — a web-native talk

A self-contained, **offline** presentation that runs in any modern browser.
Built to be presented *instead of* PowerPoint.

## Run it

**Easiest — just double-click `index.html`.**
It opens in your default browser and works fully offline (Wi-Fi off is fine).
No server, no install. Works on macOS, Windows and Linux.

If your browser ever blocks something on `file://`, start a tiny local server:

- **Windows:** double-click `serve.bat`  → open <http://localhost:8000>
- **macOS / Linux:** `./serve.sh`         → open <http://localhost:8000>

Both just run `python -m http.server 8000` in this folder.

## Presenting

| Key | Action |
|-----|--------|
| `→` / `Space` | next |
| `←` | previous |
| `F` | fullscreen |
| `S` | speaker-notes view (opens a second window) |
| `Esc` / `O` | overview of all slides (jump around) |
| `B` | black-out screen |

- Designed for **16:9**. Check legibility at the projector's resolution beforehand.
- **Edge or Chrome** recommended on Windows.
- On the CV slide, press **▶ Play sweep** to animate the voltammogram.

## What's where

```
index.html        the whole talk (all slides inlined)
analyze_cv.py     the "AI-written" CV analysis — generates data/cv_data.js + the figure
data/cv_data.js   ferrocene CV data + metrics (window.CV_DATA), no fetch needed
css/site.css      theme + layout + animation styles
js/               particles · cv-demo (Plotly) · diagrams (GSAP) · reveal-init
vendor/           reveal.js, Plotly, MathJax, tsParticles, GSAP (all local, offline)
assets/           fonts, cv_backup.png (projector fallback figure)
```

## Regenerating the CV analysis

Only needed if you swap in a different data file:

```bash
python3 analyze_cv.py        # needs numpy + matplotlib
```

It re-reads `../2-6-KHSO5-GC-before-CV.txt` (a ferrocene CV, despite the filename),
recomputes E½ / ΔEp / peak ratio, and rewrites `data/cv_data.js` and `assets/cv_backup.png`.

## Fallback

If Plotly ever misbehaves on the presentation machine, `assets/cv_backup.png`
is a static, dark-themed version of the same voltammogram.
