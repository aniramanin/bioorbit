# SI disclosure: written with the assistance of an AI coding assistant (Claude, Anthropic).
import sys, time; sys.path.insert(0, '.'); from cdp import CDP
FPS = 30; N = 900
c = CDP(); c.size(1080, 1920, 1, False)
c.go("http://localhost:5180/video/reel.html", 2.5); c.js("window.ready")
t0 = time.time()
for f in range(N):
    c.js(f"render({f / FPS})"); c.shot(f"frames/f{f:04d}.jpg", "jpeg", 94)
    if f % 100 == 0: print(f, round(time.time() - t0, 1), flush=True)
c.close(); print("done", round(time.time() - t0, 1))
