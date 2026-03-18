/**
 * ══════════════════════════════════════════════════════════════════════
 *  SIMULACIÓN COMPLETA DE MESOCICLO — NEXUS-RP Coach
 *  Blood & Guts (Dorian Yates) · Bro Split 4 días · 5 semanas
 * ══════════════════════════════════════════════════════════════════════
 *
 *  Simula el recorrido completo de un atleta intermedio-avanzado:
 *
 *  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────┐
 *  │  1. PERFIL   │ → │ 2. PROGRESIÓN│ → │ 3. TESTS DE   │ → │ 4. ENTRENA-  │ → │ 5. FEED- │
 *  │  Datos del   │   │  Dashboard   │   │    FUERZA      │   │   MIENTO     │   │   BACK   │
 *  │  atleta      │   │  e1RM, peso  │   │  PRs, 1RM     │   │  Rutina B&G  │   │ Calendar │
 *  │  objetivo    │   │  volumen     │   │  protocolos    │   │  sesiones    │   │ readiness│
 *  └─────────────┘   └──────────────┘   └───────────────┘   └──────────────┘   └──────────┘
 *
 *  Semana 1: Acumulación  (RIR 3)  — Adaptación, técnica, pesos moderados
 *  Semana 2: Progresión   (RIR 2)  — Primeros incrementos de peso
 *  Semana 3: Intensificación (RIR 1) — Pesos pesados, RPE alto, test de PRs
 *  Semana 4: Peak         (RIR 0)  — Máxima intensidad, al fallo total
 *  Semana 5: Deload       (RIR 4)  — Recuperación activa (pendiente)
 */
window.runMesocycleSimulation = window.runMesocycleSimulation = function () {
    'use strict';

    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('🏋️ NEXUS-RP Coach — Simulación Blood & Guts');
    console.log('══════════════════════════════════════════════════════');
    // ... [Rest of the script remains unchanged until the end]
    // Note: I will just use multi_replace for accuracy to not wipe 400 lines out.

    // ── Limpiar TODOS los datos previos ──
    const KEYS_TO_CLEAR = [
        'rpCoach_session_history', 'rpCoach_last_session',
        'rpCoach_attendance_calendar', 'rpCoach_readiness_history',
        'rpCoach_weight_history', 'rpCoach_appState',
        'rpCoach_active_routine', 'rpCoach_currentRoutine',
        'rpCoach_profile', 'rpCoach_strength_prs',
        'rpCoach_session_logs', 'rpCoach_generated_routine',
        'rpCoach_exercise_weights',
        'rpCoach_body_composition', 'rpCoach_progress_photos'
    ];
    KEYS_TO_CLEAR.forEach(k => localStorage.removeItem(k));

    // ╔════════════════════════════════════════════════════════════╗
    // ║  PASO 1 — PERFIL DEL ATLETA                               ║
    // ║  Lo primero: el atleta llena sus datos personales          ║
    // ╚════════════════════════════════════════════════════════════╝

    const profile = {
        name: 'Salvador',
        weight: 85,
        height: 178,
        age: 28,
        level: 'intermediate',
        experience: '3 años',
        goal: 'Hipertrofia + Fuerza',
        days: 4,
        split: 'bro_split',
        methodology: 'Blood & Guts'
    };
    localStorage.setItem('rpCoach_profile', JSON.stringify(profile));
    console.log('✅ PASO 1 — Perfil: Salvador, 85kg, 178cm, Intermedio, 4 días/semana');

    // ╔════════════════════════════════════════════════════════════╗
    // ║  PASO 2 — CONFIGURAR RUTINA (Blood & Guts - Bro Split)    ║
    // ║  El atleta selecciona metodología y genera su rutina       ║
    // ╚════════════════════════════════════════════════════════════╝

    const routine = {
        methodology: 'Blood & Guts',
        methodologyName: 'BloodAndGuts',
        protocol: 'BG-DY',
        split: 'bro_split',
        level: 'intermediate',
        mesocycleWeek: 4,
        mesocycleName: 'Peak',
        sets: '1',
        reps: '8-10',
        rest: '120s',
        rir: 0,
        intensifiers: 'Forced Reps, Drop Sets',
        tempo: '2-0-2',
        parameters: {
            sets: 1, reps: '8-10', rir: 0, rest: 120,
            load: '75-85% RM', tempo: '2-0-2',
            intensifiers: ['Forced Reps', 'Drop Sets']
        },
        days: [
            {
                name: 'Día 1: Pecho + Bíceps',
                muscles: ['Pecho', 'Bíceps'],
                exercises: [
                    { name: 'Press Banca Inclinado', muscleGroup: 'Pecho', sets: 1, targetReps: '8-10', targetRIR: 0, load: '80%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1, notes: 'WU: 30%×15, 50%×10, 70%×5' },
                    { name: 'Press Plano Mancuernas', muscleGroup: 'Pecho', sets: 1, targetReps: '8-10', targetRIR: 0, load: '78%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1 },
                    { name: 'Cruces Cable', muscleGroup: 'Pecho', sets: 1, targetReps: '10-12', targetRIR: 0, load: '70%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 },
                    { name: 'Curl con Barra', muscleGroup: 'Bíceps', sets: 1, targetReps: '8-10', targetRIR: 0, load: '75%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1, notes: 'WU: 50%×10' },
                    { name: 'Curl Inclinado Mancuernas', muscleGroup: 'Bíceps', sets: 1, targetReps: '10-12', targetRIR: 0, load: '70%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 }
                ]
            },
            {
                name: 'Día 2: Piernas',
                muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'],
                exercises: [
                    { name: 'Sentadilla', muscleGroup: 'Cuádriceps', sets: 1, targetReps: '8-10', targetRIR: 0, load: '82%', tempo: '2-0-2', restSeconds: 180, isPrimary: true, baseSets: 1, notes: 'WU: 30%×15, 50%×10, 70%×6' },
                    { name: 'Prensa Hack', muscleGroup: 'Cuádriceps', sets: 1, targetReps: '10-12', targetRIR: 0, load: '78%', tempo: '2-0-2', restSeconds: 120, isPrimary: false, baseSets: 1 },
                    { name: 'Extensión de Cuádriceps', muscleGroup: 'Cuádriceps', sets: 1, targetReps: '10-12', targetRIR: 0, load: '70%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 },
                    { name: 'Curl Femoral Acostado', muscleGroup: 'Isquiotibiales', sets: 1, targetReps: '8-10', targetRIR: 0, load: '75%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1 },
                    { name: 'Peso Muerto Rumano', muscleGroup: 'Isquiotibiales', sets: 1, targetReps: '8-10', targetRIR: 0, load: '78%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1, notes: 'WU: 50%×10' },
                    { name: 'Elevación de Talones de Pie', muscleGroup: 'Pantorrillas', sets: 1, targetReps: '10-12', targetRIR: 0, load: '75%', tempo: '2-1-3', restSeconds: 60, isPrimary: false, baseSets: 1 }
                ]
            },
            {
                name: 'Día 3: Hombros + Tríceps',
                muscles: ['Hombros', 'Tríceps'],
                exercises: [
                    { name: 'Press Militar con Barra', muscleGroup: 'Hombros', sets: 1, targetReps: '8-10', targetRIR: 0, load: '78%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1, notes: 'WU: 30%×15, 50%×10' },
                    { name: 'Elevaciones Laterales', muscleGroup: 'Hombros', sets: 1, targetReps: '10-12', targetRIR: 0, load: '65%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 },
                    { name: 'Pájaros Inclinado', muscleGroup: 'Hombros', sets: 1, targetReps: '10-12', targetRIR: 0, load: '60%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 },
                    { name: 'Press Francés', muscleGroup: 'Tríceps', sets: 1, targetReps: '8-10', targetRIR: 0, load: '75%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1 },
                    { name: 'Extensión Tríceps Polea', muscleGroup: 'Tríceps', sets: 1, targetReps: '10-12', targetRIR: 0, load: '70%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 }
                ]
            },
            {
                name: 'Día 4: Espalda',
                muscles: ['Espalda'],
                exercises: [
                    { name: 'Remo Hammer / T-Bar', muscleGroup: 'Espalda', sets: 1, targetReps: '8-10', targetRIR: 0, load: '80%', tempo: '2-0-2', restSeconds: 150, isPrimary: true, baseSets: 1, notes: 'WU: 30%×15, 50%×10' },
                    { name: 'Jalón al Pecho Agarre Neutro', muscleGroup: 'Espalda', sets: 1, targetReps: '8-10', targetRIR: 0, load: '78%', tempo: '2-0-2', restSeconds: 120, isPrimary: true, baseSets: 1 },
                    { name: 'Remo Cable Sentado', muscleGroup: 'Espalda', sets: 1, targetReps: '10-12', targetRIR: 0, load: '72%', tempo: '2-0-3', restSeconds: 120, isPrimary: false, baseSets: 1 },
                    { name: 'Peso Muerto Parcial (Rack Pull)', muscleGroup: 'Espalda', sets: 1, targetReps: '6-8', targetRIR: 0, load: '85%', tempo: '2-0-1', restSeconds: 180, isPrimary: true, baseSets: 1, notes: 'WU: 40%×10, 60%×5' },
                    { name: 'Pullover Cable', muscleGroup: 'Espalda', sets: 1, targetReps: '10-12', targetRIR: 0, load: '68%', tempo: '2-0-3', restSeconds: 90, isPrimary: false, baseSets: 1 }
                ]
            }
        ],
        currentDayIndex: 0
    };
    localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));
    localStorage.setItem('rpCoach_currentRoutine', JSON.stringify(routine));
    console.log('✅ PASO 2 — Rutina: Blood & Guts, Bro Split, 4 días (21 ejercicios)');

    // ╔════════════════════════════════════════════════════════════╗
    // ║  PASO 3 — EJECUTAR EL MESOCICLO (4 semanas de 5)         ║
    // ║  El atleta entrena, registra sesiones, pesa, evalúa       ║
    // ╚════════════════════════════════════════════════════════════╝

    // ── 3a. Calcular fechas base (empezó hace 4 semanas, lunes) ──
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 28);
    while (baseDate.getDay() !== 1) baseDate.setDate(baseDate.getDate() - 1);

    // ── 3b. Progresión de pesos por ejercicio (4 semanas) ──
    // B&G: el atleta busca subir peso cada semana manteniendo 8-10 reps al fallo
    const exerciseProgression = {
        // ── Pecho + Bíceps ──
        'Press Banca Inclinado': { w1: { kg: 80, reps: 10 }, w2: { kg: 82.5, reps: 9 }, w3: { kg: 82.5, reps: 10 }, w4: { kg: 85, reps: 8 }, muscle: 'Pecho' },
        'Press Plano Mancuernas': { w1: { kg: 32, reps: 10 }, w2: { kg: 34, reps: 9 }, w3: { kg: 34, reps: 10 }, w4: { kg: 36, reps: 8 }, muscle: 'Pecho' },
        'Cruces Cable': { w1: { kg: 15, reps: 12 }, w2: { kg: 15, reps: 12 }, w3: { kg: 17.5, reps: 10 }, w4: { kg: 17.5, reps: 11 }, muscle: 'Pecho' },
        'Curl con Barra': { w1: { kg: 35, reps: 10 }, w2: { kg: 35, reps: 10 }, w3: { kg: 37.5, reps: 9 }, w4: { kg: 37.5, reps: 10 }, muscle: 'Bíceps' },
        'Curl Inclinado Mancuernas': { w1: { kg: 14, reps: 10 }, w2: { kg: 14, reps: 11 }, w3: { kg: 16, reps: 9 }, w4: { kg: 16, reps: 10 }, muscle: 'Bíceps' },
        // ── Piernas ──
        'Sentadilla': { w1: { kg: 100, reps: 10 }, w2: { kg: 105, reps: 9 }, w3: { kg: 105, reps: 10 }, w4: { kg: 110, reps: 8 }, muscle: 'Cuádriceps' },
        'Prensa Hack': { w1: { kg: 160, reps: 12 }, w2: { kg: 170, reps: 11 }, w3: { kg: 170, reps: 12 }, w4: { kg: 180, reps: 10 }, muscle: 'Cuádriceps' },
        'Extensión de Cuádriceps': { w1: { kg: 50, reps: 12 }, w2: { kg: 50, reps: 12 }, w3: { kg: 52.5, reps: 11 }, w4: { kg: 52.5, reps: 12 }, muscle: 'Cuádriceps' },
        'Curl Femoral Acostado': { w1: { kg: 45, reps: 10 }, w2: { kg: 47.5, reps: 9 }, w3: { kg: 47.5, reps: 10 }, w4: { kg: 50, reps: 8 }, muscle: 'Isquiotibiales' },
        'Peso Muerto Rumano': { w1: { kg: 90, reps: 10 }, w2: { kg: 92.5, reps: 10 }, w3: { kg: 95, reps: 9 }, w4: { kg: 95, reps: 10 }, muscle: 'Isquiotibiales' },
        'Elevación de Talones de Pie': { w1: { kg: 80, reps: 12 }, w2: { kg: 80, reps: 12 }, w3: { kg: 85, reps: 11 }, w4: { kg: 85, reps: 12 }, muscle: 'Pantorrillas' },
        // ── Hombros + Tríceps ──
        'Press Militar con Barra': { w1: { kg: 50, reps: 10 }, w2: { kg: 52.5, reps: 9 }, w3: { kg: 52.5, reps: 10 }, w4: { kg: 55, reps: 8 }, muscle: 'Hombros' },
        'Elevaciones Laterales': { w1: { kg: 12, reps: 12 }, w2: { kg: 12, reps: 12 }, w3: { kg: 14, reps: 10 }, w4: { kg: 14, reps: 11 }, muscle: 'Hombros' },
        'Pájaros Inclinado': { w1: { kg: 10, reps: 12 }, w2: { kg: 10, reps: 12 }, w3: { kg: 12, reps: 10 }, w4: { kg: 12, reps: 11 }, muscle: 'Hombros' },
        'Press Francés': { w1: { kg: 30, reps: 10 }, w2: { kg: 32.5, reps: 9 }, w3: { kg: 32.5, reps: 10 }, w4: { kg: 35, reps: 8 }, muscle: 'Tríceps' },
        'Extensión Tríceps Polea': { w1: { kg: 30, reps: 12 }, w2: { kg: 30, reps: 12 }, w3: { kg: 32.5, reps: 10 }, w4: { kg: 32.5, reps: 12 }, muscle: 'Tríceps' },
        // ── Espalda ──
        'Remo Hammer / T-Bar': { w1: { kg: 70, reps: 10 }, w2: { kg: 72.5, reps: 9 }, w3: { kg: 72.5, reps: 10 }, w4: { kg: 75, reps: 9 }, muscle: 'Espalda' },
        'Jalón al Pecho Agarre Neutro': { w1: { kg: 72, reps: 10 }, w2: { kg: 75, reps: 9 }, w3: { kg: 75, reps: 10 }, w4: { kg: 77.5, reps: 8 }, muscle: 'Espalda' },
        'Remo Cable Sentado': { w1: { kg: 60, reps: 12 }, w2: { kg: 62.5, reps: 11 }, w3: { kg: 62.5, reps: 12 }, w4: { kg: 65, reps: 10 }, muscle: 'Espalda' },
        'Peso Muerto Parcial (Rack Pull)': { w1: { kg: 130, reps: 8 }, w2: { kg: 135, reps: 7 }, w3: { kg: 135, reps: 8 }, w4: { kg: 140, reps: 7 }, muscle: 'Espalda' },
        'Pullover Cable': { w1: { kg: 25, reps: 12 }, w2: { kg: 25, reps: 12 }, w3: { kg: 27.5, reps: 10 }, w4: { kg: 27.5, reps: 12 }, muscle: 'Espalda' }
    };

    // ── 3c. Fases del mesociclo ──
    const BG_PHASES = {
        1: { name: 'Acumulación', targetRIR: 3, avgRPE: 8.0, description: 'Adaptación, técnica, pesos moderados' },
        2: { name: 'Progresión', targetRIR: 2, avgRPE: 8.5, description: 'Primeros incrementos de peso' },
        3: { name: 'Intensificación', targetRIR: 1, avgRPE: 9.5, description: 'Pesos pesados, test de PRs' },
        4: { name: 'Peak', targetRIR: 0, avgRPE: 10.0, description: 'Máxima intensidad, al fallo total' },
        5: { name: 'Deload', targetRIR: 4, avgRPE: 6.0, description: 'Recuperación activa' }
    };

    const dayConfigs = [
        { name: 'Pecho + Bíceps', exercises: ['Press Banca Inclinado', 'Press Plano Mancuernas', 'Cruces Cable', 'Curl con Barra', 'Curl Inclinado Mancuernas'], muscles: ['Pecho', 'Bíceps'] },
        { name: 'Piernas', exercises: ['Sentadilla', 'Prensa Hack', 'Extensión de Cuádriceps', 'Curl Femoral Acostado', 'Peso Muerto Rumano', 'Elevación de Talones de Pie'], muscles: ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'] },
        { name: 'Hombros + Tríceps', exercises: ['Press Militar con Barra', 'Elevaciones Laterales', 'Pájaros Inclinado', 'Press Francés', 'Extensión Tríceps Polea'], muscles: ['Hombros', 'Tríceps'] },
        { name: 'Espalda', exercises: ['Remo Hammer / T-Bar', 'Jalón al Pecho Agarre Neutro', 'Remo Cable Sentado', 'Peso Muerto Parcial (Rack Pull)', 'Pullover Cable'], muscles: ['Espalda'] }
    ];

    // ── 3d. Generar fechas planeadas del calendario (5 semanas) ──
    const allPlannedDates = {};
    for (let w = 1; w <= 5; w++) {
        const weekStart = new Date(baseDate);
        weekStart.setDate(weekStart.getDate() + (w - 1) * 7);
        const plannedDays = [];
        for (let d = 0; d < 4; d++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + d);
            // Evitar fines de semana
            if (dayDate.getDay() === 0) dayDate.setDate(dayDate.getDate() + 1);
            if (dayDate.getDay() === 6) dayDate.setDate(dayDate.getDate() + 2);
            plannedDays.push({
                dayIndex: d,
                dayName: dayConfigs[d].name,
                plannedDate: dayDate.toISOString().split('T')[0]
            });
        }
        allPlannedDates[w] = plannedDays;
    }

    // ── 3e. Generar historial de sesiones (16 sesiones = 4 semanas × 4 días) ──
    const sessionHistory = [];

    for (let week = 1; week <= 4; week++) {
        const weekKey = 'w' + week;
        const phase = BG_PHASES[week];
        const plannedDays = allPlannedDates[week];

        for (let dayIdx = 0; dayIdx < 4; dayIdx++) {
            const sessionDateStr = plannedDays[dayIdx].plannedDate;
            const sessionDate = new Date(sessionDateStr + 'T12:00:00');
            const dayConfig = dayConfigs[dayIdx];
            const exerciseData = [];
            const muscleVolume = {};
            let totalVolume = 0, totalSets = 0, totalRPE = 0;

            dayConfig.exercises.forEach(exName => {
                const prog = exerciseProgression[exName];
                if (!prog) return;
                const data = prog[weekKey];

                // RPE realista según fase: varía ±0.5 alrededor del promedio
                const rpeVar = (Math.random() - 0.5);
                const rpe = Math.min(10, Math.max(6, phase.avgRPE + rpeVar));
                const volume = data.kg * data.reps;

                exerciseData.push({
                    name: exName,
                    weight: data.kg,
                    reps: data.reps,
                    rpe: parseFloat(rpe.toFixed(1)),
                    rir: parseFloat(Math.max(0, 10 - rpe).toFixed(1)),
                    volume: volume,
                    muscleGroup: prog.muscle
                });

                totalVolume += volume;
                totalSets++;
                totalRPE += rpe;
                muscleVolume[prog.muscle] = (muscleVolume[prog.muscle] || 0) + 1;
            });

            const avgRPE = (totalRPE / exerciseData.length).toFixed(1);
            const avgRIR = (10 - parseFloat(avgRPE)).toFixed(1);

            // Rating del atleta: mejora con la experiencia del mesociclo
            const ratings = { 1: 3, 2: 4, 3: 4, 4: 5 };

            sessionHistory.push({
                id: 'session_bg_' + week + '_' + dayIdx + '_' + Date.now(),
                date: sessionDate.toISOString(),
                dateFormatted: sessionDateStr,
                dayName: dayConfig.name,
                muscles: dayConfig.muscles,
                methodology: 'Blood & Guts',
                mesocycleWeek: week,
                mesocycleName: phase.name,
                targetRIR: phase.targetRIR,
                exercises: exerciseData,
                stats: {
                    totalVolume: Math.round(totalVolume),
                    totalSets: totalSets,
                    avgRPE: avgRPE,
                    avgRIR: avgRIR,
                    exerciseCount: exerciseData.length
                },
                muscleVolume: muscleVolume,
                rating: ratings[week],
                notes: week === 4 ? 'Semana Peak — intensidad máxima, todo al fallo' : ''
            });
        }
    }

    // Ordenar: más reciente primero
    sessionHistory.reverse();
    localStorage.setItem('rpCoach_session_history', JSON.stringify(sessionHistory));
    localStorage.setItem('rpCoach_last_session', JSON.stringify(sessionHistory[0]));

    // Guardar último peso usado por ejercicio (para auto-poblar siguiente sesión)
    const exerciseWeights = {};
    Object.entries(exerciseProgression).forEach(([name, data]) => {
        localStorage.setItem('rpCoach_lastWeight_' + name, data.w4.kg.toString());
        exerciseWeights[name] = { weight: data.w4.kg, reps: data.w4.reps, date: Date.now() };
    });
    localStorage.setItem('rpCoach_exercise_weights', JSON.stringify(exerciseWeights));

    console.log('✅ PASO 3a — 16 sesiones registradas (4 semanas × 4 días)');
    console.log('   S1 Acumulación → S2 Progresión → S3 Intensificación → S4 Peak');

    // ── 3f. Peso corporal (seguimiento cada 2 días) ──
    const weightHistory = [];
    for (let i = 0; i < 28; i += 2) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        // Ganancia controlada: 85.0 → ~85.8 en 4 semanas (superávit ligero, ~200kcal)
        const weight = 85.0 + (i * 0.028) + (Math.random() * 0.3 - 0.15);
        weightHistory.push({
            date: d.toISOString().split('T')[0],
            weight: parseFloat(weight.toFixed(1))
        });
    }
    localStorage.setItem('rpCoach_weight_history', JSON.stringify(weightHistory));
    console.log('✅ PASO 3b — Peso corporal: 85.0kg → ~85.8kg (+0.8kg en 4 semanas)');

    // ── 3g. Readiness / Estado de preparación (1 por sesión) ──
    const readinessHistory = [];
    // Simula fatiga acumulada: buena S1-S2, degradándose S3-S4
    const sleepData = [4, 4, 5, 4, 4, 5, 4, 4, 3, 4, 3, 3, 3, 3, 4, 3];
    const stressData = [4, 3, 4, 4, 3, 4, 3, 4, 3, 3, 3, 4, 3, 3, 4, 3];
    const domsData = [3, 3, 4, 3, 3, 3, 4, 3, 2, 2, 3, 2, 2, 3, 2, 3];

    for (let i = 0; i < 16; i++) {
        const weekNum = Math.floor(i / 4) + 1;
        const dayInWeek = i % 4;
        const sessionDate = allPlannedDates[weekNum][dayInWeek].plannedDate;

        const sleep = sleepData[i];
        const stress = stressData[i];
        const doms = domsData[i];
        const score = parseFloat(((sleep + stress + doms) / 3).toFixed(1));

        readinessHistory.push({
            date: sessionDate,
            score: score,
            sleep, stress, doms,
            level: score >= 4 ? 'green' : score >= 3 ? 'yellow' : 'red',
            mesocycleWeek: weekNum
        });
    }
    localStorage.setItem('rpCoach_readiness_history', JSON.stringify(readinessHistory));
    console.log('✅ PASO 3c — 16 evaluaciones de readiness (fatiga S3-S4: sueño↓ DOMS↑)');

    // ╔════════════════════════════════════════════════════════════╗
    // ║  PASO 4 — TESTS DE FUERZA (PRs registrados)              ║
    // ║  El atleta testea sus máximos en S3 (intensificación)     ║
    // ╚════════════════════════════════════════════════════════════╝

    // PRs testeados durante el mesociclo (semana 3 = intensificación)
    const s3Dates = allPlannedDates[3]; // Fechas de semana 3

    const prData = [
        // Día 2 (Piernas) de S3: testeó Sentadilla
        { exercise: 'Sentadilla', weight: 120, reps: 1, date: s3Dates[1].plannedDate },
        // Día 1 (Pecho) de S3: testeó Press Banca Inclinado
        { exercise: 'Press Banca Inclinado', weight: 95, reps: 1, date: s3Dates[0].plannedDate },
        // Día 4 (Espalda) de S3: testeó Peso Muerto
        { exercise: 'Peso Muerto Rumano', weight: 110, reps: 1, date: s3Dates[3] ? s3Dates[3].plannedDate : s3Dates[2].plannedDate },
        // Día 3 (Hombros) de S3: testeó Press Militar
        { exercise: 'Press Militar con Barra', weight: 65, reps: 1, date: s3Dates[2].plannedDate },
        // Día 4 (Espalda) de S4: PR en Rack Pull (peak)
        { exercise: 'Peso Muerto Parcial (Rack Pull)', weight: 155, reps: 1, date: allPlannedDates[4][3].plannedDate },
        // Día 1 de S4: nuevo PR en Press Banca
        { exercise: 'Press Banca Inclinado', weight: 97.5, reps: 1, date: allPlannedDates[4][0].plannedDate }
    ];
    localStorage.setItem('rpCoach_strength_prs', JSON.stringify(prData));
    console.log('✅ PASO 4 — 6 PRs registrados (tests en S3 Intensificación + S4 Peak)');
    console.log('   Sentadilla: 120kg · Press Banca Inc: 97.5kg · PMR: 110kg · Press Militar: 65kg');

    // ╔════════════════════════════════════════════════════════════╗
    // ║  PASO 4B — COMPOSICIÓN CORPORAL                           ║
    // ║  Mediciones al inicio (S1) y al final (S4) del mesociclo  ║
    // ╚════════════════════════════════════════════════════════════╝

    const bcData = {
        enabled: true,
        frequency: 'monthly',
        measurements: [
            {
                date: allPlannedDates[1][0].plannedDate,
                bodyFat: 16.5, muscleMass: 34.2,
                chest: 99, arm: 34.5, waist: 82, thigh: 57, hip: 96, calf: 37.5
            },
            {
                date: allPlannedDates[3][0].plannedDate,
                bodyFat: 15.9, muscleMass: 34.8,
                chest: 99.5, arm: 35, waist: 81.5, thigh: 57.5, hip: 95.5, calf: 37.5
            },
            {
                date: allPlannedDates[4][3].plannedDate,
                bodyFat: 15.3, muscleMass: 35.4,
                chest: 100.5, arm: 35.5, waist: 80.5, thigh: 58, hip: 95, calf: 38
            }
        ]
    };
    localStorage.setItem('rpCoach_body_composition', JSON.stringify(bcData));
    console.log('✅ PASO 4B — Composición corporal: 3 mediciones (S1, S3, S4)');
    console.log('   Grasa: 16.5% → 15.3% (↓1.2%) · Músculo: 34.2 → 35.4kg (+1.2kg)');

    // ╔════════════════════════════════════════════════════════════╗
    // ║  PASO 5 — CALENDARIO / FEEDBACK                           ║
    // ║  Registro de asistencia del mesociclo completo             ║
    // ╚════════════════════════════════════════════════════════════╝

    const phaseNames = { 1: 'Acumulación', 2: 'Progresión', 3: 'Intensificación', 4: 'Peak', 5: 'Deload' };
    const phaseColors = { 1: '#3B82F6', 2: '#F59E0B', 3: '#EF4444', 4: '#DC2626', 5: '#10B981' };
    const phaseRIR = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 4 };

    const weeks = {};
    for (let w = 1; w <= 5; w++) {
        const plannedDays = allPlannedDates[w];
        const attendance = {};

        if (w <= 4) {
            // Semanas 1-4: completadas al 100%
            plannedDays.forEach(pd => {
                const matchingSession = sessionHistory.find(s => {
                    const sDate = new Date(s.date).toISOString().split('T')[0];
                    return sDate === pd.plannedDate;
                });
                attendance[pd.plannedDate] = {
                    status: 'completed',
                    sessionId: matchingSession ? matchingSession.id : null,
                    dayName: pd.dayName,
                    stats: matchingSession ? matchingSession.stats : { totalSets: 5, totalVolume: 3500, avgRPE: '9.0' }
                };
            });
        }
        // Semana 5: Deload pendiente

        weeks[w] = {
            name: phaseNames[w],
            color: phaseColors[w],
            rir: phaseRIR[w],
            plannedDays: plannedDays,
            attendance: attendance
        };
    }

    const calendarData = {
        mesocycleId: 'meso_bg_' + Date.now(),
        startDate: baseDate.toISOString(),
        methodology: 'Blood & Guts',
        split: 'bro_split',
        totalWeeks: 5,
        daysPerWeek: 4,
        weeks: weeks,
        summary: {
            totalPlanned: 20,
            totalCompleted: 16,
            totalMissed: 0,
            compliancePercent: 80
        }
    };
    localStorage.setItem('rpCoach_attendance_calendar', JSON.stringify(calendarData));
    console.log('✅ PASO 5 — Calendario: 16/20 sesiones (80%), S5 Deload pendiente');

    // ╔════════════════════════════════════════════════════════════╗
    // ║  ESTADO DE LA APP                                          ║
    // ║  Abrir en la pestaña de Feedback para ver todo el ciclo    ║
    // ╚════════════════════════════════════════════════════════════╝

    localStorage.setItem('rpCoach_appState', JSON.stringify({
        currentModule: 'profile',
        selectedMethodology: 'BloodAndGuts'
    }));

    // ── Resumen final ──
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('✅ SIMULACIÓN COMPLETA — Recorrido del atleta:');
    console.log('══════════════════════════════════════════════════════');
    console.log('');
    console.log('  👤 PERFIL       → Salvador, 85kg, Intermedio, objetivo hipertrofia+fuerza');
    console.log('  📈 PROGRESIÓN   → Dashboard con e1RM, volumen semanal, comparaciones');
    console.log('  💪 TESTS FUERZA → 6 PRs registrados, e1RMs de 21 ejercicios');
    console.log('  🏋️ ENTRENAMIENTO → Rutina B&G activa (4 días/sem, 21 ejercicios)');
    console.log('  📋 FEEDBACK     → Calendario, asistencia, readiness, gráficas');
    console.log('');
    console.log('  📅 Mesociclo: 5 semanas (4 completadas, 1 deload pendiente)');
    console.log('  📊 Sesiones: 16 registradas con progresión de pesos semana a semana');
    console.log('  ⚖️  Peso: 85.0kg → ~85.8kg (+0.8kg, superávit controlado)');
    console.log('  🚦 Readiness: Fatiga acumulada en S3-S4 (esperado en B&G)');
    console.log('  🏆 PRs: Sentadilla 120kg · Press Inc 97.5kg · PMR 110kg · Militar 65kg');
    console.log('');
    console.log('🔄 Recarga la página (Cmd+Shift+R) para ver los datos.');
    console.log('══════════════════════════════════════════════════════');
}) ();
