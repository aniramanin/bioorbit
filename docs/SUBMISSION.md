# Submissão — NASA Space Apps 2026

> **Prazo:** domingo, 15/11, às 23:59 no horário do evento local (São Gonçalo).
> Tudo na página de submissão precisa estar **em inglês**. Os textos abaixo já estão prontos para copiar e colar. Revise com a equipe e troque o que estiver entre `[colchetes]`.
>
> **Antes de enviar:**
> 1. Publicar o site (GitHub Pages: veja o README) e testar o link numa janela anônima.
> 2. Gravar o vídeo de ≤ 30 s **ou** montar os 7 slides (roteiros no fim deste arquivo) e deixar o link público.
> 3. Todos os membros confirmados no mesmo evento local.
> 4. Marcar "Terms and Conditions" + "Confirm All Work is Original" → **Submit for Judging**.
> 5. Regra de IA: a ideia tem que ser da equipe; o uso de IA no código está declarado (campo SI abaixo, README e cabeçalho de cada arquivo).

---

## Project Name
**BioOrbit — Astronaut Health OS**

## High-Level Project Summary
BioOrbit is an offline-first health monitoring and decision-support app for astronauts on long-duration missions. Astronauts log vital signs, sleep, mood and symptoms. They can also measure heart rate with a phone camera and take a 3-minute reaction test that screens for fatigue. BioOrbit turns these data into a colour-coded interactive body map, a readiness score and clear actions. It compares every value with the astronaut's personal baseline to catch problems early, and it combines signals into insights such as fatigue or possible infection. Escalation advice adapts to the communication delay of each environment, from the ISS to Mars. A compact report can be sent to the flight surgeon. Because crews on Mars cannot rely on real-time help from Earth, BioOrbit gives them the knowledge and autonomy to assess and act on their own health. The same tool serves remote communities on Earth.

## Link to Project Demo
https://aniramanin.github.io/bioorbit/slides/ — 7-slide presentation (use ← → to navigate)
PDF version: https://aniramanin.github.io/bioorbit/slides/BioOrbit-slides.pdf
30-second video (alternative): https://aniramanin.github.io/bioorbit/video/BioOrbit-reel.mp4

## Link to Final Project
https://aniramanin.github.io/bioorbit/ — project website with live demo
https://aniramanin.github.io/bioorbit/app.html — the app
https://github.com/aniramanin/bioorbit — source code

## Detailed Project Description

**What it does**
BioOrbit is a "health bridge" for each crew member:
- **Readiness score and duty status** (Mission ready, Ready with caution, Limited duty, Medical attention), calculated from 14 indicators, symptoms and baseline changes.
- **Interactive body map:** eight body systems (brain & behaviour, eyes/SANS, heart, lungs, metabolism, immune, muscles, skeleton). Each one is colour-coded, clickable and explains its function, what spaceflight does to it, the latest values and what to do now.
- **Guided logging:** fields turn green, amber or red while you type. Each field explains why the indicator matters in space and how to measure it with onboard equipment.
- **Camera heart rate (photoplethysmography):** a fingertip over the camera is enough, with no extra hardware. The flashlight turns on automatically on phones. A tap-to-the-beat mode is available as a fallback.
- **Psychomotor Vigilance Test (PVT-B):** the brief vigilance test validated for spaceflight, to detect fatigue before critical operations.
- **Personal-baseline drift detection:** flags meaningful change even when values are still "normal", for example sleep that is slowly declining.
- **Multi-signal insights:** sleep debt + slower reactions → fatigue; fever + elevated heart rate/rash → possible infection; persistent low mood → behavioural health; vision change → possible SANS. Each insight comes with concrete onboard actions.
- **Mission environments:** Space Station, Lunar Base, Mars Transit, Mars Surface and Earth Remote Care. Radiation dose rate (with cumulative dose against the 600 mSv career limit), gravity, communication delay and escalation rules adapt to each one.
- **Delay-tolerant downlink:** a structured TXT/JSON report with findings, actions and 7-day trends. The app shows the real arrival time at Earth.
- **Crew overview:** readiness of every crew member and a heat-map of indicators for the medical officer.
- **Mission routine and gamification:** timed prompts for daily measurements, XP, levels, streaks and badges that keep healthy habits on track.
- **Knowledge library:** the five NASA HRP hazards, what to monitor for each one and the countermeasures, indicator reference ranges and scientific sources.

**How it works**
Values are classified against reference ranges. A personal-baseline model compares each person's last three days with their own previous 18 days (z-score plus a clinically meaningful minimum change), and rule-based patterns combine several signals. The camera pulse algorithm averages the red channel of the fingertip image, resamples it to 30 Hz, removes the slow trend and estimates heart rate by autocorrelation, with protection against octave errors. In our tests on synthetic signals it was accurate to within ±3 bpm between 42 and 178 bpm. The PVT follows the PVT-B protocol (1–4 s intervals, lapses > 355 ms, false starts < 100 ms).

**Benefits**
- It helps astronauts who are not doctors understand their own health and act on it, even far from Earth.
- It detects early change instead of waiting for a critical value.
- It works fully offline on any phone or laptop and keeps data private on the device.
- It turns daily monitoring into a routine with gamification.
- It fits remote care on Earth: isolated and riverside communities, Antarctic stations, ships and home monitoring.

**What we hope to achieve**
A practical base for Earth-independent medical operations. Possible next steps include wearable/Bluetooth sensor input, ultrasound image guidance, machine-learning baselines trained on analog-mission data and validation with health professionals.

**Tools and technologies**
HTML5, CSS3 and vanilla JavaScript, with no frameworks or external libraries, so the app also works offline. We used the Canvas and SVG APIs for charts and the body map, MediaDevices/getUserMedia for the camera, and localStorage for data. It can be hosted on GitHub Pages.

## Use of Super Intelligence (SI)
Yes. The concept, the scientific direction and the features were defined by our team. We used an AI coding assistant (Claude, by Anthropic) to speed up writing the source code (HTML, CSS and JavaScript), and the team reviewed and tested it. This is acknowledged in the header comment of every source file, in the page metadata and in the README. No AI-generated images, video or audio are used, and no NASA branding is used. `[Add here any other AI use by the team, e.g. text review.]`

## NASA Data
- **NASA Human Research Program, 5 Hazards of Human Spaceflight** (https://www.nasa.gov/hrp/hazards/): the backbone of our risk model. Every indicator in BioOrbit is linked to one or more of the five hazards (radiation, isolation & confinement, distance from Earth, gravity fields, hostile closed environments), and the in-app library explains each hazard, what to monitor and the countermeasures.
- **NASA Human Research Program, Risks of Human Spaceflight** (https://www.nasa.gov/hrp/risks/): used to choose the monitored risks and body systems: cardiovascular, bone and muscle loss, behavioural health and sleep, inadequate nutrition, SANS (vision), immune changes.
- **NASA Human Research Program, Ongoing HRP Research in Space** (https://www.nasa.gov/hrp/ongoing-hrp-research/): context for in-flight measurements and countermeasures.
- **NASA-STD-3001, Space Flight Human-System Standard:** 600 mSv career radiation limit used in the dose tracker.

## Space Agency Partner Data and Other References
- **CSA (Canadian Space Agency), Monitoring Radiation for Astronaut Health (2026):** inspired the cumulative radiation-dose tracking per environment.
- **CSA, Why Do We Conduct Science Experiments in Space?**
- Basner M, Mollicone D, Dinges DF. Validity and sensitivity of a brief psychomotor vigilance test (PVT-B). *Acta Astronautica*, 2011.
- Zeitlin C et al. Measurements of energetic particle radiation in transit to Mars on the Mars Science Laboratory. *Science*, 2013.
- Hassler DM et al. Mars' surface radiation environment measured with the MSL Curiosity rover. *Science*, 2014.
- Zhang S et al. First measurements of the radiation dose on the lunar surface. *Science Advances*, 2020.
- Stahn AC et al. Increased core body temperature in astronauts during long-duration space missions. *Scientific Reports*, 2017.
- Barger LK et al. Prevalence of sleep deficiency and use of hypnotics in astronauts. *Lancet Neurology*, 2014.
- Lang T et al. Cortical and trabecular bone mineral loss from the spine and hip in long-duration spaceflight. *JBMR*, 2004.
- Verkruysse W, Svaasand LO, Nelson JS. Remote plethysmographic imaging using ambient light. *Optics Express*, 2008.
- Fonts: Open Sans and DM Serif Display (Google Fonts, SIL Open Font License).
- AI coding assistant: Claude (Anthropic). See the SI section.

---

## Roteiro do vídeo (≤ 30 s, em inglês ou com legenda em inglês)

| Tempo | Fala | Tela |
|---|---|---|
| 0:00–0:03 | "Hi, we're team ICBS – LIASTRA from Brazil." | Logo do app / equipe |
| 0:03–0:07 | "On Mars, help from Earth is 20 minutes away. Astronauts must assess their own health." | Animação do Downlink com o atraso |
| 0:07–0:11 | "Meet BioOrbit, the astronaut health OS." | Bridge com o anel de prontidão |
| 0:11–0:22 | "Log vitals, or measure your pulse with a camera. A reaction test checks for fatigue. BioOrbit compares you with your own baseline, colour-codes your body, and tells you what to do. It's built on NASA's five hazards of spaceflight." | Toque no mapa do corpo → pulso pela câmera → teste de reação → alerta de padrão |
| 0:22–0:30 | "It works offline, from the Space Station to Mars, and for remote communities here on Earth." | Troca de ambiente: ISS → Marte → Terra |

## Roteiro dos 7 slides (alternativa ao vídeo)
1. **Title:** BioOrbit — Astronaut Health OS · Team ICBS – LIASTRA · Challenge: Create Health Monitoring Software for Astronauts on Space Missions · Marina Corrêa Freitas
2. **Problem:** the 5 NASA HRP hazards, a 20-minute delay and no evacuation on Mars.
3. **Solution:** screenshot of the Bridge (readiness score + body map).
4. **User experience:** log, camera pulse, reaction test, guidance (4 screenshots).
5. **Smart detection:** personal-baseline drift and pattern insights (fatigue, infection).
6. **NASA data:** how the HRP hazards and risks shaped the indicators; radiation per environment; delay-aware downlink.
7. **Future & Earth impact:** wearables, ultrasound guidance, remote care in Brazil and beyond.
