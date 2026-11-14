# BioOrbit — 30 s reel

`BioOrbit-reel.mp4` · 1080×1920 (9:16) · 30 fps · 30.0 s · H.264 + AAC

**SI disclosure.** The motion graphics (`reel.html`), the render/encode tools and the soundtrack were produced with the assistance of an AI coding assistant (Claude, Anthropic). The soundtrack is procedurally synthesized by `tools/synth.py` (no samples, no copyrighted music). App screens are real captures of BioOrbit. The video carries a visible "SI-assisted production" watermark, and the same disclosure is in the MP4 metadata.

How it was made:
1. `reel.html` draws every frame deterministically with `render(t)`.
2. `tools/frames.py` drives headless Chrome over the DevTools pipe and saves 900 JPEG frames.
3. `tools/synth.py` writes `music.wav`.
4. `tools/encode.swift` (AVFoundation) muxes frames and audio into the MP4.
