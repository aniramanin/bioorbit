# BioOrbit reel soundtrack — procedurally synthesized (no samples, no copyrighted material).
# SI disclosure: this synthesis script was written with the assistance of an AI coding assistant (Claude, Anthropic).
import math, random, struct, wave, sys
SR = 44100; DUR = 30.0; N = int(SR * DUR)
L = [0.0] * N; R = [0.0] * N
random.seed(3)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
TAU = 2 * math.pi

def add_pad(t0, t1, notes, vol, att=0.7, rel=0.9):
    a, b = int(t0 * SR), min(N, int((t1 + rel) * SR))
    fr = [(hz(n), hz(n) * 1.003, hz(n) * 0.997) for n in notes]
    for i in range(a, b):
        t = i / SR
        e = min(1, (t - t0) / att) if t < t0 + att else 1.0
        if t > t1: e *= max(0, 1 - (t - t1) / rel)
        if e <= 0: continue
        sl = sr = 0.0
        for f0, f1, f2 in fr:
            sl += math.sin(TAU * f0 * t) + 0.5 * math.sin(TAU * f1 * t) + 0.18 * math.sin(TAU * 2 * f0 * t)
            sr += math.sin(TAU * f0 * t + 0.6) + 0.5 * math.sin(TAU * f2 * t) + 0.18 * math.sin(TAU * 2 * f0 * t + 1)
        trem = 0.9 + 0.1 * math.sin(TAU * 0.25 * t)
        L[i] += sl * e * vol * trem; R[i] += sr * e * vol * trem

def add_kick(t0, vol=0.5, f0=110, f1=42, dec=0.28):
    a = int(t0 * SR); ph = 0.0
    for k in range(int(0.45 * SR)):
        i = a + k
        if i >= N: break
        t = k / SR; f = f1 + (f0 - f1) * math.exp(-t * 28); ph += TAU * f / SR
        s = math.sin(ph) * math.exp(-t / dec) * vol
        L[i] += s; R[i] += s

def add_noise(t0, t1, vol, shape, lp_from=0.02, lp_to=0.4, pan=0.0):
    a, b = int(t0 * SR), min(N, int(t1 * SR)); y = 0.0
    for i in range(a, b):
        p = (i - a) / max(1, b - a); c = lp_from + (lp_to - lp_from) * p
        y += c * (random.uniform(-1, 1) - y)
        s = y * vol * shape(p)
        L[i] += s * (1 - pan); R[i] += s * (1 + pan)

def add_bell(t0, note, vol, dec=1.2, pan=0.0):
    a = int(t0 * SR); f = hz(note)
    for k in range(int(dec * 3 * SR)):
        i = a + k
        if i >= N: break
        t = k / SR; env = math.exp(-t / dec) * min(1, t / 0.004)
        s = (math.sin(TAU * f * t) + 0.3 * math.sin(TAU * f * 2.01 * t) + 0.12 * math.sin(TAU * f * 3.98 * t)) * env * vol
        L[i] += s * (1 - pan); R[i] += s * (1 + pan)

# --- harmony (MIDI notes) ---
add_pad(0.0, 5.3, [38, 45, 50, 53, 57], 0.030)            # Dm add9-ish, dark
add_pad(5.4, 15.4, [41, 48, 52, 57, 60, 64], 0.026)       # Fmaj7 / bright
add_pad(15.5, 22.0, [45, 52, 57, 60, 64], 0.026)          # Am
add_pad(22.1, 25.4, [41, 48, 53, 57, 62, 65], 0.026)      # F add9 lift
add_pad(25.5, 28.4, [36, 43, 48, 52, 55, 59, 62], 0.026, rel=1.6)  # Cmaj9 resolve

# --- riser into the reveal + impacts at the big cuts ---
add_noise(3.9, 5.4, 0.55, lambda p: p ** 2.2, 0.01, 0.35)
for t in (5.4, 25.5):
    add_kick(t, 0.9, 140, 34, 0.55); add_noise(t, t + 1.4, 0.35, lambda p: (1 - p) ** 3, 0.5, 0.05)
for t in (2.8, 8.2, 12.1, 15.5, 18.9, 22.1):          # soft whoosh on scene changes
    add_noise(t - 0.35, t + 0.25, 0.22, lambda p: math.sin(math.pi * p) ** 2, 0.02, 0.25)

# --- groove: soft pulse at 120 bpm (off during the heartbeat scene) ---
t = 5.4
while t < 25.4:
    if not (15.5 <= t < 18.9): add_kick(t, 0.32 if int(round((t - 5.4) / 0.5)) % 2 == 0 else 0.18)
    t += 0.5
# hi shimmer ticks on the off-beats in bright sections
t = 8.45
while t < 15.3:
    add_noise(t, t + 0.05, 0.10, lambda p: (1 - p) ** 4, 0.9, 0.9, pan=0.3); t += 0.5

# --- heartbeat (72 bpm, synced to the visual beat peaks) ---
n = math.ceil(15.6 * 1.2)
while (n + 0.18) / 1.2 < 18.85:
    tb = (n + 0.18) / 1.2
    add_kick(tb - 0.02, 0.55, 80, 38, 0.12); add_kick(tb + 0.20, 0.32, 75, 36, 0.10); n += 1

# --- tap + result in the reaction test ---
add_bell(19.95, 84, 0.10, 0.25)
add_kick(20.2, 0.4, 300, 120, 0.05); add_bell(20.2, 88, 0.14, 0.6)

# --- sparkles: logo reveal & each planet & end card ---
for i, nt in enumerate([72, 76, 79, 84]): add_bell(5.55 + i * 0.12, nt, 0.06, 1.1, pan=(i - 1.5) * 0.25)
for t, nt in ((22.2, 76), (23.05, 79), (24.1, 83)): add_bell(t, nt, 0.08, 0.9)
for i, nt in enumerate([72, 79, 84, 88]): add_bell(25.6 + i * 0.14, nt, 0.06, 1.6, pan=(i - 1.5) * 0.25)

# --- master: fade, soft-clip, normalize ---
peak = 1e-9
for i in range(N):
    t = i / SR; g = min(1, t / 0.3) * (1 if t < 28.4 else max(0, 1 - (t - 28.4) / 1.6))
    L[i] = math.tanh(L[i] * g * 1.4); R[i] = math.tanh(R[i] * g * 1.4)
    peak = max(peak, abs(L[i]), abs(R[i]))
k = 0.89 / peak
w = wave.open(sys.argv[1], "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(b"".join(struct.pack("<hh", int(L[i] * k * 32767), int(R[i] * k * 32767)) for i in range(N)))
w.close(); print("ok", peak)
