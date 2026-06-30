#!/usr/bin/env python3
"""
analyze_cv.py  —  Cyclic-voltammetry analysis of a ferrocene (Fc/Fc+) couple.

Reads a CHI / CS-Studio potentiostat export, characterises the reversible
redox couple, and emits:
  * data/cv_data.js      -> window.CV_DATA for the web talk (no server / no fetch)
  * assets/cv_backup.png -> static figure (projector fallback)

The export format:
  line 0 : "CSStudioFile,ID_CV,<base64 gzipped metadata>"   (skipped)
  line 1 : "E(V)\ti(A/cm2)\tT(s)"                            (column header)
  line 2+: tab-separated  E  i  T   (T may carry a trailing "N CYCLE" marker)
"""

import json
import pathlib
import numpy as np
import matplotlib
matplotlib.use("Agg")               # headless: render to file, never open a window
import matplotlib.pyplot as plt

HERE = pathlib.Path(__file__).parent
SRC = HERE.parent / "2-6-KHSO5-GC-before-CV.txt"   # the raw instrument dump


# ----------------------------------------------------------------------------- parse
def load_cv(path):
    """Return potential E (V), current density i (A/cm^2), time t (s)."""
    E, i, t = [], [], []
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    for ln in lines[2:]:                       # skip metadata + header rows
        parts = ln.split("\t")
        if len(parts) < 3:
            continue
        # the time field can look like "34.44000  1 CYCLE" -> keep the number
        E.append(float(parts[0]))
        i.append(float(parts[1]))
        t.append(float(parts[2].split()[0]))
    return np.array(E), np.array(i), np.array(t)


# ----------------------------------------------------------------------------- analyse
def scan_rate(E, t):
    """Median |dE/dt| in V/s."""
    return float(np.median(np.abs(np.diff(E))) / np.median(np.diff(t)))


def split_cycles(E):
    """Index of each scan-direction turning point (the CV vertices)."""
    d = np.sign(np.diff(E))
    d[d == 0] = 1
    return np.where(np.diff(d) != 0)[0] + 1


def representative_cycle(E, i, t, verts):
    """One clean full cycle (between two upper vertices) for the animation."""
    # upper vertices are turning points sitting near max(E)
    upper = [v for v in verts if E[v] > 0.5 * (E.max() + E.min())]
    a, b = upper[0], upper[1]                  # 2nd cycle: most reproducible
    return E[a:b], i[a:b], t[a:b] - t[a]       # re-zero time for the inset


def peaks(E, i):
    """Anodic peak on the forward (rising-E) sweep, cathodic on the reverse."""
    rising = np.gradient(E) > 0
    fwd = np.where(rising)[0]
    rev = np.where(~rising)[0]
    pa = fwd[np.argmax(i[fwd])]                # most positive current, forward
    pc = rev[np.argmin(i[rev])]               # most negative current, reverse
    return pa, pc


def verdict(dEp_mV, ratio):
    """Plain-language read on electrochemical reversibility."""
    if dEp_mV < 80 and 0.85 < ratio < 1.15:
        return "reversible (diffusion-controlled, fast electron transfer)"
    if dEp_mV < 200:
        return "quasi-reversible (sluggish kinetics and/or uncompensated iR)"
    return "quasi-reversible — large dEp: significant iR drop or slow kinetics"


# ----------------------------------------------------------------------------- run
def main():
    E, i, t = load_cv(SRC)
    nu = scan_rate(E, t)
    verts = split_cycles(E)
    n_cycles = sum(E[v] > 0.5 * (E.max() + E.min()) for v in verts)

    Ec, ic, tc = representative_cycle(E, i, t, verts)
    pa, pc = peaks(Ec, ic)
    Epa, ipa = float(Ec[pa]), float(ic[pa])
    Epc, ipc = float(Ec[pc]), float(ic[pc])
    dEp_mV = (Epa - Epc) * 1000.0
    E_half = (Epa + Epc) / 2.0
    ratio = abs(ipa / ipc)

    metrics = {
        "Epa": round(Epa, 3), "ipa_mA": round(ipa * 1e3, 4),
        "Epc": round(Epc, 3), "ipc_mA": round(ipc * 1e3, 4),
        "dEp_mV": round(dEp_mV, 0), "E_half": round(E_half, 3),
        "ratio": round(ratio, 2), "scan_rate_mVs": round(nu * 1e3, 0),
        "n_cycles": int(n_cycles),
        "E_window": [round(float(E.min()), 2), round(float(E.max()), 2)],
        "n_points": int(E.size),
        "verdict": verdict(dEp_mV, ratio),
    }

    # ---- export for the web talk (one clean cycle, current in mA/cm^2) ----
    def ds(arr, step):                          # downsample helper
        return [round(float(x), 6) for x in arr[::step]]

    rising = (np.gradient(Ec) > 0).tolist()
    payload = {
        "cycle": {                              # full-res representative cycle
            "E": ds(Ec, 1), "i": ds(ic * 1e3, 1), "t": ds(tc, 1),
            "rising": rising,
        },
        "all": {                                # all cycles, downsampled overlay
            "E": ds(E, 6), "i": ds(i * 1e3, 6),
        },
        "peaks": {"Epa": Epa, "ipa": ipa * 1e3, "Epc": Epc, "ipc": ipc * 1e3,
                  "E_half": E_half},
        "metrics": metrics,
    }
    (HERE / "data").mkdir(exist_ok=True)
    (HERE / "data" / "cv_data.js").write_text(
        "window.CV_DATA = " + json.dumps(payload) + ";\n", encoding="utf-8")

    # ---- static backup figure (dark theme, matches the web deck) ----
    bg, fg = "#0b1120", "#cbd5e1"
    fig, ax = plt.subplots(figsize=(7, 5.2), dpi=140)
    fig.patch.set_facecolor(bg); ax.set_facecolor(bg)
    ax.plot(Ec, ic * 1e3, color="#38bdf8", lw=2)
    ax.scatter([Epa], [ipa * 1e3], color="#f472b6", zorder=5)
    ax.scatter([Epc], [ipc * 1e3], color="#a3e635", zorder=5)
    ax.annotate(f"anodic peak\n{Epa:.3f} V", (Epa, ipa * 1e3),
                textcoords="offset points", xytext=(10, -6), color="#f472b6")
    ax.annotate(f"cathodic peak\n{Epc:.3f} V", (Epc, ipc * 1e3),
                textcoords="offset points", xytext=(10, 6), color="#a3e635")
    ax.axhline(0, color="#475569", lw=0.8)
    ax.set_xlabel("Potential  E  /  V", color=fg)
    ax.set_ylabel("Current density  /  mA cm$^{-2}$", color=fg)
    ax.set_title("Ferrocene CV — %d mV/s   (ΔEp = %.0f mV, E½ = %.3f V)"
                 % (metrics["scan_rate_mVs"], dEp_mV, E_half), color="#e2e8f0")
    ax.tick_params(colors=fg)
    for s in ax.spines.values():
        s.set_color("#334155")
    ax.grid(alpha=0.12); fig.tight_layout()
    (HERE / "assets").mkdir(exist_ok=True)
    fig.savefig(HERE / "assets" / "cv_backup.png",
                facecolor=bg, bbox_inches="tight")

    # ---- report ----
    print("Ferrocene (Fc/Fc+) cyclic voltammetry")
    print("  points          :", metrics["n_points"])
    print("  cycles           :", metrics["n_cycles"])
    print("  scan rate        : %g mV/s" % metrics["scan_rate_mVs"])
    print("  potential window : %.2f .. %.2f V" % tuple(metrics["E_window"]))
    print("  anodic  peak     : Epa = %.3f V, ipa = %.4f mA/cm2"
          % (metrics["Epa"], metrics["ipa_mA"]))
    print("  cathodic peak    : Epc = %.3f V, ipc = %.4f mA/cm2"
          % (metrics["Epc"], metrics["ipc_mA"]))
    print("  dEp              : %.0f mV" % metrics["dEp_mV"])
    print("  E1/2             : %.3f V" % metrics["E_half"])
    print("  |ipa/ipc|        : %.2f" % metrics["ratio"])
    print("  verdict          :", metrics["verdict"])
    print("\nwrote data/cv_data.js and assets/cv_backup.png")


if __name__ == "__main__":
    main()
