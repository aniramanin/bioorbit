# BioOrbit — Astronaut Health OS

**Offline-first health monitoring and decision support for astronauts on long-duration missions — and for remote care on Earth.**

NASA Space Apps Challenge 2026 · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*
Team: **ICBS – International Center for Biomedical & Space Sciences, LIASTRA Institute** (São Gonçalo, Brazil)

**🌐 Live website (with interactive demo):** https://aniramanin.github.io/bioorbit/  
**🚀 Open the app:** https://aniramanin.github.io/bioorbit/app.html  
**🎞 Demo slides (7):** https://aniramanin.github.io/bioorbit/slides/ · [PDF](https://aniramanin.github.io/bioorbit/slides/BioOrbit-slides.pdf)  
**💻 Source code:** https://github.com/aniramanin/bioorbit

> ⚠️ BioOrbit is a decision-support prototype. It is not a medical device and does not replace a physician or flight surgeon.

---

## The problem

On a Mars mission the crew is up to ~22 light-minutes from Earth and cannot be evacuated. NASA's Human Research Program maps five hazards of spaceflight: **radiation, isolation & confinement, distance from Earth, gravity fields and hostile closed environments**. Together they can cause immune changes, bone loss, cardiovascular events, poor nutrition and behavioural health problems. Astronauts have to spot these changes in themselves, often without being doctors.

## What BioOrbit does

| Feature | What it does |
|---|---|
| **Health bridge** | A single readiness score (0–100) with a duty status (*Mission ready → Medical attention*), built from recent indicators, symptoms and baseline changes. |
| **Interactive body map** | A clickable human figure. Each body system (brain, eyes, heart, lungs, metabolism, immune, muscles, skeleton) is colour-coded and explains its function, what spaceflight does to it, the latest values and what to do now. |
| **14 health indicators** | Heart rate, blood pressure, SpO₂, temperature, respiratory rate, glucose, sleep, mood, stress, reaction time, exercise, hydration and body mass, plus a symptom checklist. Each one has a "why it matters / how to measure in space" explanation. |
| **Personal-baseline drift detection** | Compares your last 3 days with your own 18-day baseline (z-score). It flags change **before** a value leaves the normal range, for example sleep that is slowly falling. |
| **Pattern insights** | Combines signals the way a clinician would: *sleep debt + slower reactions → fatigue*, *fever + high heart rate/rash → possible infection*, *low mood 3 of 5 days → behavioural health*, *vision change → possible SANS*. |
| **Camera pulse (PPG)** | Measures heart rate from a fingertip over a phone or laptop camera. All processing happens on the device (autocorrelation on the red channel, flashlight switched on automatically when the device has one). If there is no camera, you can tap along with your pulse instead. |
| **Reaction test (PVT-B)** | A 3-minute psychomotor vigilance test, like the one used on the ISS (lapses > 355 ms, false starts < 100 ms). It catches fatigue before you notice it yourself. |
| **Mission environments** | Space Station, Lunar Base, Mars Transit, Mars Surface and **Earth Remote Care**. Radiation dose rate, gravity, communication delay and escalation advice all change with the environment. |
| **Delay-aware escalation** | When the delay is long (Mars), guidance tells the crew to act on the onboard protocol first and confirm with Earth later. |
| **Downlink to the flight surgeon** | A compact structured report (TXT + JSON) with findings, actions and 7-day trends. A transmission animation shows the real arrival time. It can be printed or saved as PDF. |
| **Crew overview** | Readiness of every crew member and a colour-coded heat-map of indicators, for the medical officer and the commander. |
| **Mission routine & gamification** | Time-based prompts (morning vitals, glucose, PVT, exercise, hydration, evening check-in), XP, levels, streaks, 12 badges and a 30-day completion calendar. |
| **Knowledge library** | The 5 NASA HRP hazards with what to monitor and the countermeasures, an indicator reference with colour-coded ranges, and a list of scientific sources. |
| **Breathing exercise** | Guided box breathing for stress (behavioural-health countermeasure). |

### Built for space constraints
- **100 % offline**: no server, no external API and no chart library. Everything runs in the browser and data stays on the device (localStorage). This matters when the connection to Earth is delayed or lost.
- **Runs on any device**: phone, tablet or laptop, with a responsive layout.
- **Private by design**: camera frames are never stored or transmitted.
- **Data portability**: backups can be exported and imported as JSON.

## How the assessment works

1. **Threshold classification:** each value is mapped to *Nominal / Watch / Alert / Critical* using reference ranges from the knowledge base (`assets/js/knowledge.js`).
2. **Baseline drift:** for each indicator, `z = (mean(last 3 days) − mean(baseline)) / sd(baseline)`. A drift is flagged when |z| ≥ 2, the change is larger than a clinically meaningful amount, and it goes in the unhealthy direction.
3. **Pattern rules:** multi-signal rules produce combined insights and actions.
4. **Readiness score:** a weighted average of indicator status scores, minus penalties for symptoms, drifts and findings.
5. **Escalation:** each finding gets onboard actions and an escalation note that adapts to the communication delay.

Radiation dose rates used per environment (approximate): ISS ≈ 0.5 mSv/day; lunar surface ≈ 1.37 mSv/day (Chang'e-4 LND); Mars transit ≈ 1.84 mSv/day (MSL RAD); Mars surface ≈ 0.64 mSv/day (Curiosity RAD). The career limit is 600 mSv (NASA-STD-3001).

## Demo data
On first launch BioOrbit loads a **simulated 30-day mission** with a 4-person crew, so every feature has data to show:
- **You (MS-1):** sleep debt and slower reactions in the last days → fatigue pattern and baseline drift.
- **Commander:** blood pressure slowly rising.
- **Flight Engineer:** consistent and nominal (the reference astronaut).
- **Medical Officer:** fever, high heart rate and rash today → possible infection.

Use **Settings → Start empty mission** to use your own data.

## Run locally
No build step is needed.

```bash
python3 -m http.server 5173
# website: http://localhost:5173  ·  app: http://localhost:5173/app.html
```

The camera needs HTTPS or localhost.

## Deploy (GitHub Pages)
1. Create a public repository and upload all files.
2. Go to *Settings → Pages → Deploy from branch → main / root*.
3. The site goes live at `https://<user>.github.io/<repo>/` (HTTPS, so the camera works).

## Project structure
```
index.html             Project website (landing page with live demo)
app.html               The BioOrbit app
assets/site/           Website styles and scripts
assets/img/            BioOrbit, LIASTRA, ICBS and Space Apps logos
assets/css/style.css   Design system and layout
assets/js/knowledge.js Indicators, thresholds, environments, body regions, NASA HRP hazards, references
assets/js/store.js     Offline data store + simulated mission generator
assets/js/engine.js    Classification, baseline drift, patterns, readiness, routine, gamification, report
assets/js/charts.js    Dependency-free canvas/SVG charts
assets/js/ppg.js       Camera photoplethysmography (heart rate)
assets/js/pvt.js       Psychomotor vigilance test
assets/js/app.js       User interface
```

## NASA data & resources used
- NASA Human Research Program, *5 Hazards of Human Spaceflight*: https://www.nasa.gov/hrp/hazards/ (structure of the risk model, the hazard library and how indicators map to hazards)
- NASA Human Research Program, *Risks of Human Spaceflight*: https://www.nasa.gov/hrp/risks/ (choice of monitored risks: cardiovascular, bone and muscle, behavioural health, sleep, nutrition, SANS, immune)
- NASA Human Research Program, *Ongoing HRP Research in Space*: https://www.nasa.gov/hrp/ongoing-hrp-research/
- NASA-STD-3001, career radiation limit

## Space agency partner resources
- CSA, *Monitoring Radiation for Astronaut Health* (2026): radiation dose tracking concept
- CSA, *Why Do We Conduct Science Experiments in Space?*

The full scientific reference list is in the app (Library → Sources) and in `assets/js/knowledge.js`.

## Use of AI (Super Intelligence) disclosure
The concept, the scientific direction and the choice of features come from the ICBS / LIASTRA team. **The source code (HTML, CSS, JavaScript) was written with the help of an AI coding assistant (Claude, by Anthropic)**, then reviewed and tested by the team. Every source file says this in its header comment, and the page has a `generator` meta tag. The simulated mission data is generated by code (a deterministic pseudo-random generator), not by AI. No AI-generated images, video or audio are used. No NASA logos or branding are used.

## License
MIT (see `LICENSE`).
