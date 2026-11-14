/*
 * BioOrbit — Knowledge base
 * Health indicators, thresholds, mission environments, body regions and
 * spaceflight hazards (based on NASA Human Research Program resources).
 *
 * SI disclosure: this file was written with the assistance of an AI coding
 * assistant (Claude, Anthropic) and reviewed by the ICBS / LIASTRA team.
 * Thresholds are educational reference ranges, NOT medical advice.
 */
window.AURORA = window.AURORA || {};

(function (A) {
  const INF = Infinity;

  // status order: ok < watch < alert < critical
  A.STATUS = {
    ok:       { rank: 0, label: 'Nominal',  color: 'var(--ok)' },
    watch:    { rank: 1, label: 'Watch',    color: 'var(--watch)' },
    alert:    { rank: 2, label: 'Alert',    color: 'var(--alert)' },
    critical: { rank: 3, label: 'Critical', color: 'var(--critical)' },
    none:     { rank: -1, label: 'No data', color: 'var(--muted)' }
  };

  /* ------------------------------------------------------------------ */
  /* Indicators                                                          */
  /* ranges: [lowInclusive, highExclusive, status]                       */
  /* better: 'mid' | 'low' | 'high' — direction for baseline drift       */
  /* ------------------------------------------------------------------ */
  A.INDICATORS = {
    hr: {
      name: 'Resting heart rate', short: 'Heart rate', unit: 'bpm', icon: '♥',
      group: 'vitals', min: 30, max: 200, step: 1, dec: 0, better: 'mid', drift: 8,
      chartMin: 40, chartMax: 120, normal: [50, 100],
      ranges: [[-INF, 40, 'critical'], [40, 50, 'watch'], [50, 100, 'ok'], [100, 120, 'alert'], [120, INF, 'critical']],
      why: 'In microgravity, body fluids shift toward the head and the heart does less work against gravity. Over months the heart can lose mass and adapt, and on return (or landing on Mars) astronauts may struggle with orthostatic intolerance. A rising resting heart rate can also signal dehydration, fever, poor sleep or stress.',
      how: ['Rest seated or strapped in for 5 minutes, no exercise in the last 30 min.', 'Use the onboard monitor, a chest strap, or the BioOrbit Camera Pulse tool (fingertip over the camera).', 'Or count your pulse at the wrist for 30 s and multiply by 2.'],
      actions: {
        watch: ['Re-measure after 10 minutes of quiet rest.', 'Hydrate (500 mL) and check body temperature.', 'Review last night\'s sleep and current stress level.'],
        alert: ['Stop strenuous activity and re-measure in 15 minutes.', 'Check blood pressure, SpO₂ and temperature together.', 'Log symptoms (dizziness, chest discomfort, palpitations).'],
        critical: ['Stop all activity, stay restrained/seated.', 'Notify crew medical officer immediately.', 'Contact flight surgeon; prepare ECG from the medical kit.']
      },
      hazards: ['gravity', 'environment']
    },
    sys: {
      name: 'Systolic blood pressure', short: 'Systolic BP', unit: 'mmHg', icon: '◎',
      group: 'vitals', min: 60, max: 250, step: 1, dec: 0, better: 'mid', drift: 12,
      chartMin: 80, chartMax: 170, normal: [90, 130],
      ranges: [[-INF, 80, 'alert'], [80, 90, 'watch'], [90, 130, 'ok'], [130, 140, 'watch'], [140, 180, 'alert'], [180, INF, 'critical']],
      why: 'Cephalad fluid shift and vascular changes affect blood pressure regulation in space. NASA studies cardiovascular risk from radiation and long-duration flight, and hypertension raises the risk of cardiovascular events far from definitive care.',
      how: ['Sit/strap in, rest 5 min, arm supported at heart level.', 'Use the automatic cuff on the upper arm, same arm every time.', 'Take 2 readings 1 minute apart and log the average.'],
      actions: {
        watch: ['Re-check in the evening using the same arm.', 'Reduce sodium in today\'s menu; hydrate.', 'Try a 5-minute paced-breathing session.'],
        alert: ['Repeat measurement after 10 minutes of rest.', 'Log headache, vision changes or chest discomfort.', 'Schedule a flight-surgeon review in the next contact window.'],
        critical: ['Rest immediately and re-measure in 5 minutes.', 'Notify the crew medical officer.', 'Urgent flight-surgeon consultation (hypertensive crisis protocol).']
      },
      hazards: ['gravity', 'radiation']
    },
    dia: {
      name: 'Diastolic blood pressure', short: 'Diastolic BP', unit: 'mmHg', icon: '◎',
      group: 'vitals', min: 30, max: 150, step: 1, dec: 0, better: 'mid', drift: 10,
      chartMin: 40, chartMax: 110, normal: [60, 85],
      ranges: [[-INF, 50, 'alert'], [50, 60, 'watch'], [60, 85, 'ok'], [85, 90, 'watch'], [90, 120, 'alert'], [120, INF, 'critical']],
      why: 'Diastolic pressure reflects resistance in the arteries between heartbeats. It is logged together with systolic pressure to track cardiovascular adaptation to altered gravity.',
      how: ['Measured together with systolic pressure by the automatic cuff.'],
      actions: {
        watch: ['Re-check later today and reduce sodium intake.'],
        alert: ['Repeat after rest; schedule a flight-surgeon review.'],
        critical: ['Notify the crew medical officer and flight surgeon urgently.']
      },
      hazards: ['gravity']
    },
    spo2: {
      name: 'Blood oxygen saturation', short: 'SpO₂', unit: '%', icon: 'O₂',
      group: 'vitals', min: 70, max: 100, step: 1, dec: 0, better: 'high', drift: 2,
      chartMin: 85, chartMax: 100, normal: [95, 100],
      ranges: [[-INF, 88, 'critical'], [88, 92, 'alert'], [92, 95, 'watch'], [95, INF, 'ok']],
      why: 'The cabin is a closed life-support system. A drop in oxygen saturation can mean a respiratory problem, an atmosphere/ECLSS issue (e.g. CO₂ build-up) or reduced pressure in habitats and suits.',
      how: ['Clip the pulse oximeter on a warm finger, no nail polish.', 'Stay still for 30 seconds until the reading stabilises.'],
      actions: {
        watch: ['Re-measure on another finger after warming hands.', 'Check cabin CO₂ / O₂ readings on the habitat display.'],
        alert: ['Ask a crewmate to verify their own SpO₂ — if both are low, suspect atmosphere.', 'Move to a well-ventilated module; log breathing symptoms.'],
        critical: ['Apply supplemental oxygen per medical checklist.', 'Alert crew and flight surgeon immediately; verify ECLSS.']
      },
      hazards: ['environment']
    },
    temp: {
      name: 'Body temperature', short: 'Temperature', unit: '°C', icon: '°C',
      group: 'vitals', min: 33, max: 43, step: 0.1, dec: 1, better: 'mid', drift: 0.6,
      chartMin: 35, chartMax: 40, normal: [36.1, 37.6],
      ranges: [[-INF, 35, 'critical'], [35, 36.1, 'watch'], [36.1, 37.6, 'ok'], [37.6, 38.1, 'watch'], [38.1, 39.5, 'alert'], [39.5, INF, 'critical']],
      why: 'Research has shown astronauts\' core body temperature rises about 1 °C during long missions ("space fever"), because heat dissipates poorly without convection. Fever may also indicate infection — and spaceflight weakens the immune system.',
      how: ['Use the onboard thermometer (oral or forehead) at rest.', 'Measure at the same time each day — morning is best.'],
      actions: {
        watch: ['Hydrate and avoid exercise for the next hour, then re-measure.', 'Check for infection symptoms (sore throat, cough, rash).'],
        alert: ['Rest, hydrate, isolate sleep station if possible.', 'Log symptoms and re-measure every 4 h.', 'Inform the flight surgeon at the next contact.'],
        critical: ['Begin cooling/warming per medical checklist.', 'Notify medical officer and flight surgeon now.']
      },
      hazards: ['environment', 'radiation']
    },
    rr: {
      name: 'Respiratory rate', short: 'Resp. rate', unit: '/min', icon: '≈',
      group: 'vitals', min: 4, max: 60, step: 1, dec: 0, better: 'mid', drift: 4,
      chartMin: 6, chartMax: 30, normal: [12, 21],
      ranges: [[-INF, 8, 'critical'], [8, 12, 'watch'], [12, 21, 'ok'], [21, 25, 'watch'], [25, 30, 'alert'], [30, INF, 'critical']],
      why: 'Breathing rate reacts quickly to CO₂ build-up in the cabin, anxiety, infection and exertion.',
      how: ['At rest, count breaths for 30 seconds and multiply by 2 (one breath = in + out).'],
      actions: {
        watch: ['Re-count after 5 minutes of rest; check cabin CO₂.'],
        alert: ['Measure SpO₂ and temperature; log symptoms.'],
        critical: ['Notify medical officer; follow respiratory distress checklist.']
      },
      hazards: ['environment']
    },
    glucose: {
      name: 'Blood glucose (fasting)', short: 'Glucose', unit: 'mg/dL', icon: '◆',
      group: 'vitals', min: 30, max: 450, step: 1, dec: 0, better: 'mid', drift: 18,
      chartMin: 50, chartMax: 200, normal: [70, 100],
      ranges: [[-INF, 54, 'critical'], [54, 70, 'alert'], [70, 100, 'ok'], [100, 126, 'watch'], [126, 250, 'alert'], [250, INF, 'critical']],
      why: 'Spaceflight changes insulin sensitivity and metabolism, and food choices are limited. Inadequate nutrition is one of the risks mapped by NASA\'s Human Research Program.',
      how: ['Fast for 8 hours (measure right after waking).', 'Clean the fingertip, lance the side, discard the first drop.', 'Apply the second drop to the glucometer strip.'],
      actions: {
        watch: ['Review carbohydrate intake in the menu; increase activity.', 'Re-test fasting tomorrow morning.'],
        alert: ['If low: take 15 g fast carbohydrate, re-test in 15 min.', 'If high: hydrate, re-test in 2 h, log meals.'],
        critical: ['If low and confused: crewmate administers glucose gel.', 'Notify medical officer and flight surgeon immediately.']
      },
      hazards: ['distance', 'environment']
    },
    sleep: {
      name: 'Sleep duration', short: 'Sleep', unit: 'h', icon: '☾',
      group: 'behavior', min: 0, max: 16, step: 0.25, dec: 1, better: 'high', drift: 1.2,
      chartMin: 3, chartMax: 10, normal: [7, 9.5],
      ranges: [[-INF, 5, 'alert'], [5, 6, 'watch'], [6, 7, 'watch'], [7, 10, 'ok'], [10, INF, 'watch']],
      why: 'Studies of astronauts show they sleep only about 6 hours per night in orbit. Light/dark cycles every 90 minutes, noise and workload disrupt circadian rhythm. Sleep loss impairs attention and raises the risk of errors.',
      how: ['Log total hours actually asleep (not time in the sleep station).', 'Wearable data can be entered here too.'],
      actions: {
        watch: ['Plan a 20-minute nap if the schedule allows.', 'Dim lights and avoid screens 1 h before sleep.', 'Use eye mask and earplugs.'],
        alert: ['Request a schedule adjustment for critical tasks today.', 'Avoid operating critical systems without a cross-check.', 'Discuss sleep medication options with the flight surgeon.'],
        critical: ['Do not perform critical operations; report to commander.']
      },
      hazards: ['isolation', 'environment']
    },
    mood: {
      name: 'Mood', short: 'Mood', unit: '/5', icon: '☺',
      group: 'behavior', min: 1, max: 5, step: 1, dec: 0, better: 'high', drift: 1,
      chartMin: 1, chartMax: 5, normal: [3, 5],
      ranges: [[-INF, 2, 'alert'], [2, 3, 'watch'], [3, INF, 'ok']],
      why: 'Isolation and confinement, monotony and distance from family can lead to behavioural health problems such as depression, anxiety and crew conflict — one of NASA\'s top risks for Mars missions.',
      how: ['Rate how you feel right now, honestly. Nobody sees this but you and your medical team.'],
      actions: {
        watch: ['Schedule a personal call or message with family.', 'Spend 10 minutes at the window / Earth-view or with plants.', 'Do something you enjoy: music, reading, a hobby.'],
        alert: ['Talk to a trusted crewmate today.', 'Book a private psychological conference with the ground team.', 'Use the guided breathing exercise.'],
        critical: ['Contact behavioural health support now.']
      },
      hazards: ['isolation', 'distance']
    },
    stress: {
      name: 'Stress level', short: 'Stress', unit: '/5', icon: '⚡',
      group: 'behavior', min: 1, max: 5, step: 1, dec: 0, better: 'low', drift: 1,
      chartMin: 1, chartMax: 5, normal: [1, 3],
      ranges: [[-INF, 4, 'ok'], [4, 5, 'watch'], [5, INF, 'alert']],
      why: 'High workload, confinement and life-critical operations generate chronic stress, which affects sleep, immunity and team cohesion.',
      how: ['1 = calm, 3 = manageable, 5 = overwhelmed.'],
      actions: {
        watch: ['Try 4-7-8 breathing for 2 minutes.', 'Review today\'s timeline with the commander; delegate if possible.'],
        alert: ['Request a break from non-critical tasks.', 'Talk to the ground behavioural health team.'],
        critical: ['Stop critical tasks and contact support.']
      },
      hazards: ['isolation']
    },
    pvt: {
      name: 'Reaction time (PVT)', short: 'Reaction', unit: 'ms', icon: '⏱',
      group: 'behavior', min: 100, max: 1500, step: 1, dec: 0, better: 'low', drift: 40,
      chartMin: 180, chartMax: 500, normal: [150, 300],
      ranges: [[-INF, 300, 'ok'], [300, 360, 'watch'], [360, 450, 'alert'], [450, INF, 'critical']],
      why: 'The Psychomotor Vigilance Test is used aboard the ISS to detect fatigue. Slower reactions and more "lapses" indicate that sleep loss or stress is affecting alertness — before you notice it yourself.',
      how: ['Use the BioOrbit Reaction Test: press as soon as the target appears.', 'Take it at the same time each day, ideally before critical tasks.'],
      actions: {
        watch: ['Plan a short nap or caffeine before critical operations.'],
        alert: ['Ask for a crewmate cross-check on critical tasks today.'],
        critical: ['Do not perform critical tasks (EVA, docking, piloting) — report to commander.']
      },
      hazards: ['isolation', 'environment']
    },
    exercise: {
      name: 'Exercise (resistive + aerobic)', short: 'Exercise', unit: 'min', icon: '⚙',
      group: 'body', min: 0, max: 300, step: 5, dec: 0, better: 'high', drift: 30,
      chartMin: 0, chartMax: 180, normal: [90, 180],
      ranges: [[-INF, 30, 'alert'], [30, 90, 'watch'], [90, INF, 'ok']],
      why: 'Without gravity, weight-bearing bones can lose roughly 1–1.5 % of mass per month and muscles atrophy. Daily resistive and aerobic exercise is the main countermeasure.',
      how: ['Log total minutes on the resistive device, treadmill and cycle today.'],
      actions: {
        watch: ['Add a resistive session (squats, deadlifts) before end of day.'],
        alert: ['Prioritise a 60-minute session today — bone and muscle loss accelerate without loading.']
      },
      hazards: ['gravity']
    },
    water: {
      name: 'Water intake', short: 'Hydration', unit: 'L', icon: 'H₂O',
      group: 'body', min: 0, max: 8, step: 0.1, dec: 1, better: 'high', drift: 0.8,
      chartMin: 0, chartMax: 4, normal: [2, 4],
      ranges: [[-INF, 1.2, 'alert'], [1.2, 2, 'watch'], [2, INF, 'ok']],
      why: 'Thirst is blunted in microgravity, and dehydration combined with bone calcium loss raises the risk of kidney stones.',
      how: ['Sum all drink bags and rehydrated food water consumed today.'],
      actions: {
        watch: ['Drink 500 mL in the next hour.'],
        alert: ['Set hourly hydration reminders; drink 1 L over the next 2 h.']
      },
      hazards: ['gravity', 'environment']
    },
    weight: {
      name: 'Body mass', short: 'Body mass', unit: 'kg', icon: '⚖',
      group: 'body', min: 30, max: 160, step: 0.1, dec: 1, better: 'mid', drift: 1.5,
      chartMin: null, chartMax: null, normal: null, relative: true,
      ranges: null, // evaluated relative to baseline (see engine)
      why: 'Unintended mass loss can reveal inadequate nutrition or muscle loss. Aboard the ISS, mass is measured with a device that uses spring oscillation since scales do not work in microgravity.',
      how: ['Weekly, same time of day, before eating.', 'Use the body mass measurement device.'],
      actions: {
        watch: ['Review calorie intake; add a snack between meals.'],
        alert: ['Schedule a nutrition review with the ground team.']
      },
      hazards: ['distance', 'gravity']
    }
  };

  A.SYMPTOMS = {
    headache:  { name: 'Headache',        region: 'brain',  weight: 1 },
    vision:    { name: 'Blurred vision',  region: 'eyes',   weight: 2 },
    nausea:    { name: 'Nausea / space sickness', region: 'metabolism', weight: 1 },
    backpain:  { name: 'Back pain',       region: 'bones',  weight: 1 },
    congestion:{ name: 'Nasal congestion',region: 'lungs',  weight: 1 },
    rash:      { name: 'Skin rash',       region: 'immune', weight: 1 },
    dizzy:     { name: 'Dizziness',       region: 'heart',  weight: 2 },
    chest:     { name: 'Chest discomfort',region: 'heart',  weight: 3 }
  };

  /* ------------------------------------------------------------------ */
  /* Mission environments                                                */
  /* doseDay: approximate mean absorbed dose equivalent, mSv/day         */
  /* ------------------------------------------------------------------ */
  A.ENVIRONMENTS = {
    iss: {
      name: 'Space Station', sub: 'Low Earth Orbit', gravity: 0, gLabel: 'Microgravity (~0 g)',
      doseDay: 0.5, delay: 0.5, delayLabel: '< 1 s', evac: 'Hours (crew return vehicle)',
      ground: 'Flight surgeon', autonomy: 'Low — real-time ground support available',
      note: 'Daily ground contact; full medical consultation possible.'
    },
    moon: {
      name: 'Lunar Base', sub: 'Artemis surface ops', gravity: 0.166, gLabel: 'Lunar gravity (0.17 g)',
      doseDay: 1.37, delay: 1.3, delayLabel: '~1.3 s', evac: '~3–5 days to Earth',
      ground: 'Flight surgeon', autonomy: 'Medium — near real-time comms, days to evacuate',
      note: 'Lunar dust exposure and surface radiation require extra monitoring.'
    },
    transit: {
      name: 'Mars Transit', sub: 'Deep space cruise', gravity: 0, gLabel: 'Microgravity (~0 g)',
      doseDay: 1.84, delay: 720, delayLabel: '3–22 min (now ~12 min)', evac: 'Not possible',
      ground: 'Flight surgeon', autonomy: 'High — crew must act on its own',
      note: 'No evacuation. Communication delay means the crew decides first, Earth confirms later.'
    },
    mars: {
      name: 'Mars Base / Rover', sub: 'Surface exploration', gravity: 0.38, gLabel: 'Martian gravity (0.38 g)',
      doseDay: 0.64, delay: 720, delayLabel: '3–22 min (now ~12 min)', evac: 'Not possible (~2-year window)',
      ground: 'Flight surgeon', autonomy: 'Very high — Earth-independent medical operations',
      note: 'Crew must be fully autonomous. BioOrbit protocols guide decisions locally.'
    },
    earth: {
      name: 'Earth Remote Care', sub: 'Telemedicine / isolated communities', gravity: 1, gLabel: 'Earth gravity (1 g)',
      doseDay: 0.0066, delay: 0, delayLabel: 'real time', evac: 'Depends on location',
      ground: 'Care team', autonomy: 'Variable — remote clinics, Antarctica, ships, rural areas',
      note: 'The same software supports patients in remote areas far from hospitals.'
    }
  };
  A.CAREER_LIMIT_MSV = 600; // NASA-STD-3001 career effective dose limit

  /* ------------------------------------------------------------------ */
  /* Body regions for the interactive body map                           */
  /* ------------------------------------------------------------------ */
  A.REGIONS = {
    brain: {
      name: 'Brain & Behaviour', indicators: ['mood', 'stress', 'pvt', 'sleep'],
      func: 'Controls cognition, attention, emotion and sleep.',
      space: 'Isolation, confinement, circadian disruption and radiation can affect mood, alertness and cognition.'
    },
    eyes: {
      name: 'Eyes & Vision', indicators: [], symptoms: ['vision', 'headache'],
      func: 'Vision is essential for piloting, EVA and precision tasks.',
      space: 'Spaceflight Associated Neuro-ocular Syndrome (SANS): fluid shift toward the head can swell the optic disc and change vision.'
    },
    heart: {
      name: 'Heart & Circulation', indicators: ['hr', 'sys', 'dia'],
      func: 'Pumps oxygen-rich blood to every organ.',
      space: 'Fluid shift, heart deconditioning and radiation exposure increase cardiovascular risk and orthostatic intolerance.'
    },
    lungs: {
      name: 'Lungs & Breathing', indicators: ['spo2', 'rr'],
      func: 'Gas exchange: brings in oxygen and removes CO₂.',
      space: 'Closed cabin atmosphere, CO₂ build-up and lunar/Martian dust can irritate airways.'
    },
    metabolism: {
      name: 'Metabolism & Nutrition', indicators: ['glucose', 'water', 'weight'],
      func: 'Turns food into energy and keeps fluids balanced.',
      space: 'Limited menus, blunted thirst and altered insulin sensitivity can cause inadequate nutrition and dehydration.'
    },
    bones: {
      name: 'Skeleton', indicators: ['exercise'], symptoms: ['backpain'],
      func: 'Supports the body and stores calcium.',
      space: 'Weight-bearing bones lose ~1–1.5 % of mass per month in microgravity; calcium release raises kidney-stone risk.'
    },
    muscles: {
      name: 'Muscles', indicators: ['exercise', 'weight'],
      func: 'Movement, posture and strength.',
      space: 'Postural muscles atrophy without load; strength must be preserved for landing and surface work.'
    },
    immune: {
      name: 'Immune System', indicators: ['temp'], symptoms: ['rash'], radiation: true,
      func: 'Defends against infection and repairs damage.',
      space: 'Stress, radiation and the closed environment dysregulate immunity; latent viruses can reactivate.'
    }
  };

  /* ------------------------------------------------------------------ */
  /* NASA HRP — the 5 hazards of human spaceflight (RIDGE)               */
  /* ------------------------------------------------------------------ */
  A.HAZARDS = {
    radiation: {
      name: 'Space Radiation', icon: '☢',
      text: 'Outside Earth\'s protective magnetic field, astronauts are exposed to galactic cosmic rays and solar particle events. Exposure increases cancer risk and may damage the central nervous system, heart and other tissues.',
      monitor: ['Cumulative dose (mSv) vs. career limit', 'Body temperature & immune signs', 'Cardiovascular indicators'],
      counter: ['Shielding and storm shelters during solar events', 'Dosimetry and mission planning', 'Antioxidant-rich diet']
    },
    isolation: {
      name: 'Isolation & Confinement', icon: '◉',
      text: 'Small crews live and work in confined spaces for months. Behavioural issues, sleep loss and circadian misalignment can develop and affect performance and team cohesion.',
      monitor: ['Mood and stress check-ins', 'Sleep duration', 'Reaction time (PVT)'],
      counter: ['Structured routine, private family contact', 'Lighting that supports circadian rhythm', 'Recreation and team activities']
    },
    distance: {
      name: 'Distance from Earth', icon: '↔',
      text: 'On Mars missions, communication delay can reach ~20 minutes each way, and evacuation is impossible. Crews must be able to detect and manage medical problems on their own.',
      monitor: ['Autonomous decision support', 'Store-and-forward reports to Earth', 'Medical kit inventory'],
      counter: ['Crew medical training and onboard protocols', 'Decision-support software like BioOrbit', 'Telemedicine with delay-tolerant messaging']
    },
    gravity: {
      name: 'Gravity Fields', icon: '⇵',
      text: 'Astronauts move between gravity fields: microgravity in transit, 1/6 g on the Moon, 3/8 g on Mars. This affects bones, muscles, the heart, fluid distribution, vision and balance.',
      monitor: ['Exercise minutes', 'Heart rate & blood pressure', 'Body mass and vision symptoms'],
      counter: ['Daily resistive and aerobic exercise', 'Fluid loading before gravity transitions', 'Nutrition (calcium, vitamin D)']
    },
    environment: {
      name: 'Hostile & Closed Environments', icon: '⌂',
      text: 'The spacecraft is an ecosystem with its own air, water, temperature, noise and microbes. Atmosphere problems (e.g. CO₂ build-up) and microbial changes can affect health.',
      monitor: ['SpO₂ and respiratory rate', 'Body temperature', 'Headache and congestion symptoms'],
      counter: ['Life support monitoring', 'Hygiene and microbial monitoring', 'Noise and light control']
    }
  };

  /* ------------------------------------------------------------------ */
  /* Daily mission routine (drives prompts + gamification)               */
  /* ------------------------------------------------------------------ */
  A.ROUTINE = [
    { id: 'vitals',   name: 'Morning vitals',      desc: 'Heart rate, blood pressure, SpO₂, temperature', keys: ['hr', 'sys', 'spo2', 'temp'], need: 'all', time: '07:00', xp: 30 },
    { id: 'sleep',    name: 'Sleep log',           desc: 'Hours slept last night', keys: ['sleep'], time: '07:15', xp: 10 },
    { id: 'glucose',  name: 'Fasting glucose',     desc: 'Fingertip test before breakfast', keys: ['glucose'], time: '07:30', xp: 15 },
    { id: 'pvt',      name: 'Reaction test',       desc: '3-minute vigilance test (PVT)', keys: ['pvt'], time: '09:00', xp: 25 },
    { id: 'exercise', name: 'Exercise countermeasure', desc: 'Resistive + aerobic, ≥ 90 min', keys: ['exercise'], time: '14:00', xp: 25, min: { exercise: 90 } },
    { id: 'water',    name: 'Hydration',           desc: 'At least 2 L of water', keys: ['water'], time: '18:00', xp: 10, min: { water: 2 } },
    { id: 'mood',     name: 'Evening check-in',    desc: 'Mood and stress', keys: ['mood', 'stress'], need: 'all', time: '21:00', xp: 15 }
  ];

  A.BADGES = [
    { id: 'first',    icon: '🚀', name: 'Liftoff',         desc: 'Log your first health record.' },
    { id: 'streak3',  icon: '🔥', name: 'Ignition',        desc: '3-day logging streak.' },
    { id: 'streak7',  icon: '🛰', name: 'Stable Orbit',    desc: '7-day logging streak.' },
    { id: 'streak14', icon: '🌙', name: 'Lunar Endurance', desc: '14-day logging streak.' },
    { id: 'fullday',  icon: '✅', name: 'Mission Perfect', desc: 'Complete every routine task in a day.' },
    { id: 'reflex',   icon: '⚡', name: 'Quick Reflexes',  desc: 'PVT mean reaction under 280 ms.' },
    { id: 'bones',    icon: '🦴', name: 'Iron Bones',      desc: '7 days with ≥ 90 min of exercise.' },
    { id: 'sleeper',  icon: '😴', name: 'Sleep Guardian',  desc: '5 nights with ≥ 7 h of sleep.' },
    { id: 'pulse',    icon: '📷', name: 'Pulse Pilot',     desc: 'Measure heart rate with the camera.' },
    { id: 'downlink', icon: '📡', name: 'Downlink',        desc: 'Send a health report to Earth.' },
    { id: 'hydro',    icon: '💧', name: 'Hydro Hero',      desc: '7 days with ≥ 2 L of water.' },
    { id: 'mind',     icon: '🧠', name: 'Mindful Crew',    desc: '10 mood check-ins.' }
  ];

  A.REFERENCES = [
    { t: 'NASA Human Research Program — 5 Hazards of Human Spaceflight', u: 'https://www.nasa.gov/hrp/hazards/' },
    { t: 'NASA Human Research Program — Risks of Human Spaceflight', u: 'https://www.nasa.gov/hrp/risks/' },
    { t: 'NASA Human Research Program — Ongoing HRP Research in Space', u: 'https://www.nasa.gov/hrp/ongoing-hrp-research/' },
    { t: 'CSA — Monitoring Radiation for Astronaut Health (2026)', u: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp' },
    { t: 'CSA — Why Do We Conduct Science Experiments in Space?', u: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp' },
    { t: 'Basner M, Mollicone D, Dinges DF. Validity and sensitivity of a brief psychomotor vigilance test (PVT-B). Acta Astronautica, 2011.', u: 'https://doi.org/10.1016/j.actaastro.2011.07.015' },
    { t: 'Zeitlin C et al. Measurements of energetic particle radiation in transit to Mars on the Mars Science Laboratory. Science, 2013.', u: 'https://doi.org/10.1126/science.1235989' },
    { t: 'Hassler DM et al. Mars\' surface radiation environment measured with the MSL Curiosity rover. Science, 2014.', u: 'https://doi.org/10.1126/science.1244797' },
    { t: 'Zhang S et al. First measurements of the radiation dose on the lunar surface. Science Advances, 2020.', u: 'https://doi.org/10.1126/sciadv.aaz1334' },
    { t: 'Stahn AC et al. Increased core body temperature in astronauts during long-duration space missions. Scientific Reports, 2017.', u: 'https://doi.org/10.1038/s41598-017-15560-w' },
    { t: 'Barger LK et al. Prevalence of sleep deficiency and use of hypnotics in astronauts. Lancet Neurology, 2014.', u: 'https://doi.org/10.1016/S1474-4422(14)70122-X' },
    { t: 'Lang T et al. Cortical and trabecular bone mineral loss from the spine and hip in long-duration spaceflight. JBMR, 2004.', u: 'https://doi.org/10.1359/JBMR.040307' },
    { t: 'Verkruysse W, Svaasand LO, Nelson JS. Remote plethysmographic imaging using ambient light. Optics Express, 2008.', u: 'https://doi.org/10.1364/OE.16.021434' },
    { t: 'NASA-STD-3001 Space Flight Human-System Standard, Vol. 1 (career radiation limit 600 mSv)', u: 'https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/' }
  ];
})(window.AURORA);
