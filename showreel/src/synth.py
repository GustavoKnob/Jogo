"""Trilha 100% sintetizada (sem samples) para o showreel.
128 BPM, 8 compassos = 15 s exatos. Renderiza 2 ciclos e usa o 2o,
para que caudas de reverb/delay do fim entrem no inicio (loop perfeito)."""
import json, subprocess, sys
import numpy as np
import scipy.signal as ss
from scipy.io import wavfile

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
SR = 48000
BPM = 128
B = 60 / BPM            # 0.46875 s
BAR = 4 * B
LOOP = 8 * BAR          # 15.0 s
NCYC = 2
TOT = LOOP * NCYC + 3.0
L = int(TOT * SR)
rng = np.random.default_rng(7)

def buf(): return np.zeros((L, 2))
drums, bass, music, sfx, verb_send, delay_send = buf(), buf(), buf(), buf(), buf(), buf()

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def add(bus, t0, sig, pan=0.0, gain=1.0):
    i0 = int(round(t0 * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1)
    j0, j1 = max(i0, 0), min(i0 + len(sig), L)
    if j1 <= j0: return
    bus[j0:j1] += gain * sig[j0 - i0:j1 - i0]

def tt(dur): return np.arange(int(dur * SR)) / SR

def saw(freq, n, phase0=0.0):
    """saw com polyBLEP; freq pode ser escalar ou array"""
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]; y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]; y[m] -= x * x + x + x + 1
    return y

def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f) / SR))

def noise(n): return rng.standard_normal(n)

def filt(x, kind, fc, order=2):
    sos = ss.butter(order, fc, kind, fs=SR, output="sos")
    return ss.sosfilt(sos, x, axis=0)

def tv_filter(x, fcs, kind="lowpass", q_order=2, block=256):
    """filtro variante no tempo (cutoff por bloco, estado mantido)"""
    y = np.zeros_like(x); zi = None
    for s in range(0, len(x), block):
        fc = float(np.clip(fcs[min(s, len(fcs) - 1)], 30, SR / 2 - 500))
        if kind == "bandpass":
            sos = ss.butter(q_order, [fc / 1.25, fc * 1.25], "bandpass", fs=SR, output="sos")
        else:
            sos = ss.butter(q_order, fc, kind, fs=SR, output="sos")
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2))
        y[s:s + block], zi = ss.sosfilt(sos, x[s:s + block], zi=zi)
    return y

def env_ad(n, a, d, curve=1.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) / d))
    return e ** curve

# ---------------------------------------------------------------- instrumentos
def kick(big=False):
    n = int(0.55 * SR); t = np.arange(n) / SR
    f = 46 + 130 * np.exp(-t / 0.032) + 40 * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.42 if big else 0.30))
    click = filt(noise(n), "highpass", 2500) * np.exp(-t / 0.004) * 0.35
    y = np.tanh(2.2 * (body + click)) * 0.95
    y[:48] *= np.linspace(0, 1, 48)
    return y

def clap():
    n = int(0.35 * SR); t = np.arange(n) / SR
    nz = filt(noise(n), "bandpass", [900, 3200])
    e = np.zeros(n)
    for k, o in enumerate([0, 0.009, 0.019, 0.027]):
        m = t >= o
        e[m] += np.exp(-(t[m] - o) / (0.006 if k < 3 else 0.11))
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5
    return np.tanh(1.5 * (nz * e * 0.8 + tone))

def snare_hit(len_s=0.18):
    n = int(len_s * SR); t = np.arange(n) / SR
    nz = filt(noise(n), "bandpass", [1500, 9000]) * np.exp(-t / 0.06)
    tone = np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.04)
    return np.tanh(1.2 * (nz * 0.9 + tone * 0.6))

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = np.arange(n) / SR
    # metalico: soma de quadradas inarmonicas + ruido
    met = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0])
    x = filt(met * 0.3 + noise(n), "highpass", 7000, 4)
    return x * np.exp(-t / (0.09 if open_ else 0.018)) * 0.5

def crash(dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR
    met = sum(np.sign(np.sin(2 * np.pi * f * t + i)) for i, f in enumerate([311, 433.7, 587.1, 701.5, 943.9, 1201.3]))
    x = filt(noise(n) + 0.4 * met, "highpass", 4000, 4)
    return x * np.exp(-t / 0.7) * 0.5

def sub_boom(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t / 0.15)
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.45)

def supersaw(notes, dur, bright=1.0, detune=0.18, voices=7):
    n = int(dur * SR)
    L_, R_ = np.zeros(n), np.zeros(n)
    for m in notes:
        for v in range(voices):
            d = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            f = mtof(m) * 2 ** (d * detune / 12)
            s = saw(f, n, rng.random())
            p = 0.5 + 0.45 * d
            L_ += s * (1 - p); R_ += s * p
    x = np.stack([L_, R_], 1) / (len(notes) * voices) * 2.2
    fc = 300 + 7000 * bright * np.exp(-np.arange(n) / SR / 0.16)
    x = np.stack([tv_filter(x[:, 0], fc), tv_filter(x[:, 1], fc)], 1)
    e = env_ad(n, 0.003, dur * 0.45)
    return x * e[:, None]

def pluck(m, dur=0.28, bright=1.0):
    n = int(dur * SR)
    x = saw(mtof(m), n) * 0.6 + np.sign(np.sin(2 * np.pi * mtof(m) * 1.003 * np.arange(n) / SR)) * 0.25
    fc = 400 + 5200 * bright * np.exp(-np.arange(n) / SR / 0.05)
    return tv_filter(x, fc) * env_ad(n, 0.002, 0.09)

def bass_note(m, dur, cutoff=900):
    n = int(dur * SR)
    x = saw(mtof(m), n) * 0.7 + sine(mtof(m) / 2, n) * 0.0 + sine(mtof(m), n) * 0.6
    fc = cutoff * 0.35 + cutoff * np.exp(-np.arange(n) / SR / 0.07)
    y = tv_filter(x, fc, q_order=2)
    e = env_ad(n, 0.004, dur * 0.6)
    y = y * e
    rel = min(400, n)
    y[-rel:] *= np.linspace(1, 0, rel)
    return np.tanh(1.4 * y)

def pad(notes, dur):
    n = int(dur * SR)
    x = np.zeros((n, 2))
    for m in notes:
        for v, dt_ in enumerate([-0.09, 0.0, 0.09]):
            s = saw(mtof(m) * 2 ** (dt_ / 12), n, rng.random())
            x[:, v % 2] += s; x[:, (v + 1) % 2] += 0.4 * s
    x = filt(x, "lowpass", 1400)
    e = np.minimum(1, np.arange(n) / (0.25 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.2 * SR))
    return x * e[:, None] / (len(notes) * 3)

def whoosh(dur, rising=True, f0=300, f1=6000):
    n = int(dur * SR); u = np.arange(n) / n
    fc = f0 * (f1 / f0) ** (u if rising else 1 - u)
    x = tv_filter(noise(n), fc, "bandpass", 1)
    e = (u ** 2.2 if rising else (1 - u) ** 1.5) * np.minimum(1, (1 - u) * 40 if rising else u * 40)
    y = x * e
    pan = np.sin(np.linspace(-1.2, 1.2, n))
    return np.stack([y * (1 - pan) / 2 * 1.4, y * (1 + pan) / 2 * 1.4], 1)

def swish(dur=0.32):
    n = int(dur * SR); u = np.arange(n) / n
    fc = 800 * (9000 / 800) ** np.sin(np.pi * u)
    x = tv_filter(noise(n), fc, "bandpass", 1)
    e = np.sin(np.pi * u) ** 2
    pan = np.linspace(-0.9, 0.9, n)
    y = x * e
    return np.stack([y * (1 - pan) / 2 * 1.6, y * (1 + pan) / 2 * 1.6], 1)

def ping(m, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    f = mtof(m) * (1 + 0.5 * np.exp(-t / 0.01))
    return (sine(f, n) + 0.3 * sine(f * 2.01, n)) * np.exp(-t / 0.12)

def zap(dur=0.3, up=True):
    n = int(dur * SR); t = np.arange(n) / SR
    f = (200 * (12 ** (t / dur))) if up else (2400 * (1 / 12) ** (t / dur))
    mod = sine(f * 1.5, n) * 3
    return np.sin(2 * np.pi * np.cumsum(f) / SR + mod) * np.exp(-t / 0.12) * 0.6

def boing(dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 120 + 520 * np.exp(-t / 0.045)
    vib = 1 + 0.06 * np.sin(2 * np.pi * 22 * t)
    return np.tanh(2 * sine(f * vib, n)) * np.exp(-t / 0.13) * 0.8

def riser(dur):
    n = int(dur * SR); u = np.arange(n) / n
    nz = tv_filter(noise(n), 400 * (14000 / 400) ** u, "bandpass", 1) * u ** 2.5
    f = mtof(45) * 2 ** (3 * u ** 1.6)
    tone = (saw(f, n) + saw(f * 1.006, n)) * 0.15 * u ** 2
    tone = filt(tone, "lowpass", 5000)
    return nz * 1.1 + tone

def reverse_swell(dur):
    s = crash(dur)[::-1]
    u = np.arange(len(s)) / len(s)
    return s * u ** 2

# ---------------------------------------------------------------- arranjo
CH = {"Am": [57, 60, 64], "F": [57, 60, 65], "C": [55, 60, 64], "G": [55, 59, 62]}
PROG = ["Am", "F", "C", "G", "Am", "F", "C", "G"]
ROOT = {"Am": 33, "F": 29, "C": 36, "G": 31}
S16 = B / 4
kick_times = []

for cyc in range(NCYC):
    T0 = cyc * LOOP
    for bar in range(8):
        tb = T0 + bar * BAR
        ch = PROG[bar]; notes = CH[ch]; root = ROOT[ch]
        # --- bateria
        for bt in range(4):
            gb = bar * 4 + bt
            t = tb + bt * B
            if bar < 7 or bt < 2:
                add(drums, t, kick(big=(bar == 0 and bt == 0)), 0, 1.0); kick_times.append(t)
            if bt in (1, 3) and (bar < 7 or bt == 1):
                add(drums, t, clap(), 0.05, 0.55)
                add(verb_send, t, clap(), 0, 0.25)
            if bar < 7 or bt < 2:
                for s in range(4):
                    acc = [0.35, 0.55, 0.9, 0.5][s]
                    if bar in (0, 1) and s == 2 and bt % 2 == 0:
                        pass
                    add(drums, t + s * S16, hat(), 0.25 if s % 2 else -0.15, 0.32 * acc)
                if bar >= 2:
                    add(drums, t + 2 * S16, hat(True), 0.3, 0.16)
        # --- baixo (16ths rolando, sem a cabeca do tempo -> groove com o kick)
        if bar < 7:
            for k in range(16):
                if k % 4 == 0: continue
                m = root + (12 if k % 4 == 2 and k in (6, 14) else 0)
                add(bass, tb + k * S16, bass_note(m, S16 * 0.92, 700 + 120 * (bar % 4)), 0, 0.55)
        else:
            for k in range(8):
                if k % 4 == 0: continue
                add(bass, tb + k * S16, bass_note(root, S16 * 0.92, 900), 0, 0.55)
        # --- pad
        add(music, tb, pad([n - 12 for n in notes] + [notes[0]], BAR + 0.05), 0, 0.22 if bar < 7 else 0.12)
        # --- arp (compassos 1-6)
        if 1 <= bar <= 6:
            ext = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[0] + 24]
            pat = [0, 1, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 2, 3, 1, 2]
            bright = 0.45 + 0.1 * bar
            for k in range(16):
                p = pluck(ext[pat[k]], 0.25, bright)
                pan = [-0.45, 0.45][k % 2]
                add(music, tb + k * S16, p, pan, 0.16)
                add(delay_send, tb + k * S16, p, pan, 0.08)
                add(verb_send, tb + k * S16, p, 0, 0.05)
        # --- stabs sincronizados com as palavras
        if bar == 0:
            for bt in (0, 1, 2):
                st = supersaw([n + 12 for n in notes] + [notes[0]], 0.42, 1.0)
                add(music, tb + bt * B, st, 0, 0.55); add(verb_send, tb + bt * B, st, 0, 0.25)
        if bar == 7:
            for bt, nn in ((0, CH["G"]), (1, CH["G"])):
                st = supersaw([n + 12 for n in nn] + [nn[0]], 0.42, 1.0)
                add(music, tb + bt * B, st, 0, 0.5); add(verb_send, tb + bt * B, st, 0, 0.3)
    # ------------------------------------------------ SFX sincronizados
    add(sfx, T0, sub_boom(), 0, 0.9)
    add(sfx, T0, crash(), 0, 0.5); add(verb_send, T0, crash(), 0, 0.15)
    add(sfx, T0 + 3 * B, whoosh(0.45, False, 6000, 300), 0, 0.55)            # letras explodem
    add(sfx, T0 + 4 * B - 0.38, whoosh(0.38), 0, 0.45)                        # iris -> forma
    for bt in (4, 5, 6, 7):                                                    # morph das formas
        p = ping([69, 72, 76, 79][bt - 4] + 12)
        add(sfx, T0 + bt * B, p, [-0.3, 0.3, -0.2, 0.2][bt - 4], 0.32); add(verb_send, T0 + bt * B, p, 0, 0.2)
    add(sfx, T0 + 8 * B - 0.4, whoosh(0.4), 0, 0.55)                          # estrela -> TYPE
    for k in range(16):                                                        # glitch de tipografia
        if k % 4 == 3:
            z = zap(0.08, k % 8 == 3); add(sfx, T0 + 8 * B + k * S16, z, 0.4 if k % 8 == 3 else -0.4, 0.16)
    add(sfx, T0 + 12 * B - 0.35, whoosh(0.35, True, 200, 3000), 0, 0.5)       # barras sobem
    add(sfx, T0 + 16 * B - 0.4, whoosh(0.4), 0, 0.5)                          # iris -> 3D
    for bt in (17, 18, 19):
        z = zap(0.32, True); add(sfx, T0 + bt * B, z, 0, 0.32); add(verb_send, T0 + bt * B, z, 0, 0.15)
    add(sfx, T0 + 20 * B - 0.22, reverse_swell(0.22), 0, 0.5)                # explosao particulas
    add(sfx, T0 + 20 * B, filt(noise(int(0.05 * SR)), "highpass", 1000) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.01), 0, 0.6)  # CUT
    for bt in (21, 22, 23):
        add(sfx, T0 + bt * B - 0.12, swish(0.3), 0, 0.6)
    add(sfx, T0 + 24 * B - 0.35, whoosh(0.35, True, 300, 5000), 0, 0.5)       # push
    for bt in (24, 25, 26, 27):
        add(sfx, T0 + bt * B, boing(), 0, 0.42); add(verb_send, T0 + bt * B, boing(), 0, 0.08)
    add(sfx, T0 + 27.5 * B - 0.05, whoosh(0.28, False, 5000, 400), 0, 0.4)   # painel cai
    add(sfx, T0 + 30 * B, ping(91, 0.5), 0, 0.3)                              # pill "100% CODE"
    # build: caixa em rolo + riser + vacuo
    for k in range(8):
        add(drums, T0 + 30 * B + k * B / 4, snare_hit(), 0, 0.35 + 0.06 * k)
    for k in range(int(B / (B / 8) * 0.875)):
        add(drums, T0 + 31 * B + k * B / 8, snare_hit(0.08), 0, 0.7 + 0.04 * k)
    r = riser(2 * B - 0.06)
    add(sfx, T0 + 30 * B, r, 0, 1.1); add(verb_send, T0 + 30 * B, r, 0, 0.12)
    add(sfx, T0 + 32 * B - 0.5, reverse_swell(0.5), 0, 0.7)

# ---------------------------------------------------------------- mix
tax = np.arange(L) / SR
duck = np.zeros(L)
for tk in kick_times:
    i0 = int(tk * SR); n = min(int(0.4 * SR), L - i0)
    duck[i0:i0 + n] = np.maximum(duck[i0:i0 + n], np.exp(-np.arange(n) / SR / 0.11))
side = (1 - 0.8 * duck)[:, None]
side_soft = (1 - 0.45 * duck)[:, None]

# delay ping-pong 3/16
dl = buf(); D = int(0.75 * B * SR); src = filt(delay_send, "lowpass", 4000)
for k in range(1, 6):
    g = 0.42 ** k
    sh = src[:-D * k] * g
    if k % 2: sh = sh[:, ::-1]
    dl[D * k:] += sh

# reverb por convolucao com IR sintetica (ruido c/ decaimento)
nir = int(2.2 * SR); tir = np.arange(nir) / SR
ir = rng.standard_normal((nir, 2)) * np.exp(-tir / 0.42)[:, None]
ir = filt(ir, "lowpass", 5500); ir[:int(0.018 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(0))
vs = filt(verb_send, "highpass", 300)
rv = np.stack([ss.fftconvolve(vs[:, c], ir[:, c])[:L] for c in range(2)], 1) * 0.9

mix = drums * 0.9 + bass * side + music * side + sfx + dl * side_soft * 0.9 + rv * side_soft
mix = filt(mix, "highpass", 28)

def master(x, gain):
    y = x * gain
    y = np.tanh(y * 1.05) / 1.05 * 1.0      # saturacao suave (glue)
    # limiter lookahead simples
    thr = 0.89
    a = np.abs(y).max(1)
    g = np.minimum(1, thr / np.maximum(a, 1e-9))
    w = 96
    g = -ss.minimum_filter1d(-g, 1) if False else g
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    g = minimum_filter1d(g, 2 * w + 1)
    g = uniform_filter1d(g, w)
    return y * g[:, None]

seg = slice(int(LOOP * SR), int(2 * LOOP * SR))
loop = mix[seg]

def lufs(x):
    path = f"{OUT}/_tmp.wav"
    wavfile.write(path, SR, (x * 32767).astype(np.int16))
    r = subprocess.run(["ffmpeg", "-nostats", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    I = float(r.split("Integrated loudness:")[1].split("I:")[1].split("LUFS")[0])
    return I

gain = 0.5 / np.abs(loop).max()
for it in range(4):
    out = master(loop, gain)
    I = lufs(out)
    print(f"iter {it}: gain={gain:.3f}  I={I:.2f} LUFS  peak={np.abs(out).max():.3f}")
    if abs(I + 14) < 0.3: break
    gain *= 10 ** ((-14 - I) / 20)
wavfile.write(f"{OUT}/music.wav", SR, (out * 32767).astype(np.int16))

# ---------------------------------------------------------------- bandas p/ visualizador (loop circular)
mono = out.mean(1)
FPS = 60; NF = int(LOOP * FPS); win = 2048
w = np.hanning(win)
edges = np.geomspace(45, 12000, 17)
freqs = np.fft.rfftfreq(win, 1 / SR)
wrap = np.concatenate([mono[-win:], mono, mono[:win]])
bands = np.zeros((NF, 16))
for f in range(NF):
    c = int(f / FPS * SR) + win
    spec = np.abs(np.fft.rfft(wrap[c - win // 2:c + win // 2] * w))
    for b in range(16):
        m = (freqs >= edges[b]) & (freqs < edges[b + 1])
        bands[f, b] = np.sqrt((spec[m] ** 2).mean())
db = 20 * np.log10(bands + 1e-6)
lo, hi = np.percentile(db, 8, 0), np.percentile(db, 99.5, 0)
nb = np.clip((db - lo) / (hi - lo), 0, 1)
sm = nb.copy()
for _ in range(2):
    for f in range(NF):
        sm[f] = np.maximum(nb[f], sm[f - 1] * 0.82)
json.dump({"fps": FPS, "bands": np.round(sm, 3).tolist()}, open(f"{OUT}/bands.json", "w"))
print("ok")
