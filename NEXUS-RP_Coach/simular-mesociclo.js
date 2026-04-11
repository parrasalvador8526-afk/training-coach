/**
 * ═══════════════════════════════════════════════════════════════════════
 * NEXUS-RP Coach — Simulación COMPLETA de Mesociclo
 * Heavy Duty (Mike Mentzer) · HIT 3 Días · Nivel Avanzado · 4 Semanas
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Atleta: Ricardo "Ricky" Valenzuela, 31 años, 88kg, 1.82m
 * Experiencia: Avanzado (8+ años entrenando)
 * Objetivo: Hipertrofia con intensidad máxima
 * Metodología: Heavy Duty — Mike Mentzer
 * Split: HIT 3 Días (Tren Superior A / Tren Inferior / Tren Superior B)
 * Mesociclo: 4 semanas completas (3 intensas + 1 deload)
 * Frecuencia mediciones: Semanal
 *
 * Cubre TODAS las secciones:
 *   ✅ Inicio (Dashboard)
 *   ✅ Perfil + Bioimpedancia
 *   ✅ Composición Corporal
 *   ✅ Entrenamiento (rutina activa + historial completo)
 *   ✅ Progresión (PRs, pesos, volumen)
 *   ✅ Readiness / Autorregulación
 *   ✅ Coach Nutrimental (macros, ciclado, timing)
 *   ✅ Mesociclo + Fatiga
 *
 * Se auto-ejecuta al cargar la página.
 * ═══════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Si ya hay datos cargados de esta simulación, no sobrescribir
    const simFlag = localStorage.getItem('rpCoach_sim_loaded');
    if (simFlag === 'heavyduty_full_v5_rpized') {
        console.log('%c[Simulación HD] Ya cargada — omitiendo', 'color: #888');
        return;
    }

    // ─── Helpers ───
    function daysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    }
    function isoAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString();
    }
    function rand(min, max) {
        return Math.round((Math.random() * (max - min) + min) * 10) / 10;
    }

    // Verificar si hay datos reales antes de borrar
    const hasRealData = localStorage.getItem('rpCoach_session_history') || localStorage.getItem('rpCoach_active_routine');
    if (hasRealData && !confirm('⚠️ SIMULACIÓN Heavy Duty Completa\n\nEsto borrará todos tus datos actuales de entrenamiento.\n¿Deseas continuar?')) {
        console.log('[Simulación HD] Cancelada por el usuario.');
        return;
    }

    // Limpiar localStorage anterior
    const keysToClean = Object.keys(localStorage).filter(k =>
        k.startsWith('rpCoach_') || k.startsWith('rpcoach_') || k.startsWith('nexus_')
    );
    keysToClean.forEach(k => localStorage.removeItem(k));

    // ═══════════════════════════════════════════════════════════════
    // 1. PERFIL DEL ATLETA — Avanzado
    // ═══════════════════════════════════════════════════════════════
    const profile = {
        name: "Ricardo Valenzuela",
        age: 31,
        gender: "male",
        weight: 88,
        height: 182,
        experience: "advanced",
        goal: "hypertrophy",
        trainingDays: 3,
        split: "hit_3day",
        methodology: "HeavyDuty",
        bodyFat: 13.5,
        yearsTraining: 8,
        previousMethodologies: ["PPL", "Upper/Lower", "Blood & Guts"]
    };
    localStorage.setItem('rpCoach_profile', JSON.stringify(profile));
    localStorage.setItem('rpCoach_profile', JSON.stringify(profile));

    // ═══════════════════════════════════════════════════════════════
    // 2. ESTADO DE LA APP — Mesociclo completado
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_appState', JSON.stringify({
        selectedMethodology: 'HeavyDuty',
        currentWeek: 4,
        totalWeeks: 4,
        mesocycleStartDate: daysAgo(27),
        mesocycleEndDate: daysAgo(0),
        mesocycleComplete: true,
        profileComplete: true,
        phase: 'Deload (Semana 4 completada)',
        version: '2.0'
    }));
    localStorage.setItem('rpCoach_methodology', 'HeavyDuty');
    localStorage.setItem('nexus_current_methodology', JSON.stringify({
        id: 'HeavyDuty',
        name: 'Heavy Duty - Mike Mentzer',
        week: 4,
        phase: 'Deload completado'
    }));
    localStorage.setItem('rpCoach_mesocycleWeek', '4');

    // ═══════════════════════════════════════════════════════════════
    // 3. BIOIMPEDANCIA COMPLETA — Coach Nutrimental
    // ═══════════════════════════════════════════════════════════════
    const alturaM = 1.82;
    const peso = 88;
    const edad = 31;
    const grasaPct = 13.5;
    const masaGrasa = Math.round(peso * grasaPct / 100 * 10) / 10; // 11.88
    const ffm = Math.round((peso - masaGrasa) * 10) / 10;          // 76.12
    const tmb = Math.round(10 * peso + 6.25 * 182 - 5 * edad + 5); // Mifflin-St Jeor
    const tdee = Math.round(tmb * 1.55);                            // Actividad moderada

    const bioData = {
        nombre: "Ricardo Valenzuela",
        edad: 31,
        sexo: 'M',
        peso: 88,
        altura: 182,
        grasa: 13.5,
        muscular: 40.2,
        visceral: 7,
        actividad: 'moderado',
        metricas: {
            tmb: tmb,
            tdee: tdee,
            imc: Math.round(peso / (alturaM * alturaM) * 10) / 10,
            clasificacionIMC: 'Normal',
            porcentajeGrasa: 13.5,
            masaGrasa: masaGrasa,
            ffm: ffm,
            macros: {
                calorias: tdee,
                proteina: Math.round(ffm * 2.2),     // 167g
                carbohidratos: Math.round(tdee * 0.5 / 4), // ~50% TDEE
                grasas: Math.round(tdee * 0.25 / 9)        // ~25% TDEE
            }
        },
        fechaActualizacion: isoAgo(27)
    };
    localStorage.setItem('rpCoach_bioimpedancia', JSON.stringify(bioData));

    // ═══════════════════════════════════════════════════════════════
    // 4. COMPOSICIÓN CORPORAL — 4 mediciones semanales
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_compFreq', 'weekly');
    localStorage.setItem('rpCoach_measureUnit', 'cm');

    const bodyComp = {
        enabled: true,
        frequency: 'weekly',
        measurements: [
            // Semana 1 — Inicio del mesociclo
            {
                date: daysAgo(27),
                bodyFat: 14.2, muscleMass: 39.5,
                shoulder: 128, chest: 108, arm: 39,
                waist: 84, hip: 98, thigh: 62, calf: 39
            },
            // Semana 2
            {
                date: daysAgo(20),
                bodyFat: 13.9, muscleMass: 39.8,
                shoulder: 128.5, chest: 108.5, arm: 39.3,
                waist: 83.5, hip: 98, thigh: 62.5, calf: 39.2
            },
            // Semana 3
            {
                date: daysAgo(13),
                bodyFat: 13.5, muscleMass: 40.2,
                shoulder: 129, chest: 109, arm: 39.5,
                waist: 83, hip: 98, thigh: 63, calf: 39.3
            },
            // Semana 4 (deload — leve retención hídrica por descanso)
            {
                date: daysAgo(6),
                bodyFat: 13.4, muscleMass: 40.4,
                shoulder: 129, chest: 109.5, arm: 39.7,
                waist: 83.5, hip: 98, thigh: 63, calf: 39.5
            }
        ]
    };
    localStorage.setItem('rpCoach_body_composition', JSON.stringify(bodyComp));

    // ═══════════════════════════════════════════════════════════════
    // 5. HISTORIAL DE PESO CORPORAL — 4 semanas
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_weight_history', JSON.stringify([
        { date: daysAgo(27), weight: 87.5 },
        { date: daysAgo(25), weight: 87.8 },
        { date: daysAgo(23), weight: 87.3 },
        { date: daysAgo(20), weight: 87.6 },
        { date: daysAgo(18), weight: 88.0 },
        { date: daysAgo(16), weight: 87.7 },
        { date: daysAgo(13), weight: 88.2 },
        { date: daysAgo(11), weight: 87.9 },
        { date: daysAgo(9),  weight: 88.1 },
        { date: daysAgo(6),  weight: 88.5 },
        { date: daysAgo(4),  weight: 88.3 },
        { date: daysAgo(2),  weight: 88.0 },
        { date: daysAgo(0),  weight: 88.2 }
    ]));

    // ═══════════════════════════════════════════════════════════════
    // 6. RUTINA ACTIVA — Heavy Duty HIT 3 Días (Avanzado)
    // ═══════════════════════════════════════════════════════════════
    //
    // Protocolos avanzados por día:
    //   Día 1 (Sup A): HD-SU (Serie Única al Fallo)
    //   Día 2 (Inferior): HD-PE (Pre-Exhaustion) + HD-FR (Forced Reps)
    //   Día 3 (Sup B): HD-SS (Superseries HIT) + HD-NEG (Negativas)
    //
    const routine = {
        id: 'routine_hd_' + Date.now(),
        name: 'Heavy Duty — HIT 3 Días · Avanzado',
        methodology: 'HeavyDuty',
        methodologyName: 'Heavy Duty',
        split: 'HIT 3 Días (3 días)',
        splitId: 'hit_3day',
        level: 'Avanzado',
        protocol: 'HD-SU / HD-FR / HD-NEG / HD-PE / HD-SS',
        priority: 'Intensidad Máxima',
        intensifiers: 'Forced Reps, Negativas, Pre-Exhaustion, Superseries, Rest-Pause',
        tempo: '2-1-4',
        sets: '1 (serie única al fallo)',
        reps: '6-10',
        rir: '0 (fallo absoluto)',
        rest: '150-240s',
        createdAt: isoAgo(27),
        currentDayIndex: 0,
        mesocycleWeek: 4,
        totalWeeks: 4,
        requiresSpotter: true,
        sessionDuration: '30-45 min',
        parameters: {
            sets: 1,
            reps: '6-10',
            rir: 0,
            rest: 150,
            tempo: '2-1-4',
            methodology: 'HeavyDuty',
            intensity: 'Máxima',
            volume: 'Muy Bajo'
        },
        warmup: {
            set1: '30% x 12 reps',
            set2: '50% x 8 reps',
            set3: '70% x 4 reps'
        },
        days: [
            // ──────────────────────────────────────
            // DÍA 1: Tren Superior A (Pecho/Hombros/Tríceps)
            // Protocolo: HD-SU (Serie Única al Fallo)
            // ──────────────────────────────────────
            {
                name: 'Tren Superior A — Pecho/Hombros/Tríceps',
                muscles: ['Pecho', 'Hombros', 'Tríceps'],
                protocol: 'HD-SU',
                protocolName: 'Serie Única al Fallo',
                exercises: [
                    {
                        id: 'hd1', name: 'Press Inclinado Hammer',
                        muscleGroup: 'Pecho', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '6-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 150, tempo: '2-1-4',
                        load: '80-85% 1RM', tut: '40-60s',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd2', name: 'Press Banca Declinado',
                        muscleGroup: 'Pecho', type: 'compound', isPrimary: false,
                        sets: 1, targetReps: '6-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 150, tempo: '2-1-4',
                        load: '80-85% 1RM', tut: '40-60s',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd3', name: 'Press Militar Máquina',
                        muscleGroup: 'Hombros', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '6-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 150, tempo: '2-1-4',
                        load: '80-85% 1RM', tut: '40-60s',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd4', name: 'Elevaciones Laterales Máquina',
                        muscleGroup: 'Hombros', type: 'isolation', isPrimary: false,
                        sets: 1, targetReps: '8-12', targetRIR: 0, targetRPE: 10,
                        restSeconds: 120, tempo: '2-1-4',
                        load: '75-80% 1RM', tut: '40-60s',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd5', name: 'Fondos en Máquina',
                        muscleGroup: 'Tríceps', type: 'compound', isPrimary: false,
                        sets: 1, targetReps: '6-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 150, tempo: '2-1-4',
                        load: '80-85% 1RM', tut: '40-60s',
                        setsCompleted: [], completed: false
                    }
                ]
            },
            // ──────────────────────────────────────
            // DÍA 2: Tren Inferior (Cuádriceps/Isquios/Glúteos)
            // Protocolo: HD-PE (Pre-Exhaustion) + HD-FR (Forced Reps)
            // ──────────────────────────────────────
            {
                name: 'Tren Inferior — Cuádriceps/Isquios/Glúteos',
                muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'],
                protocol: 'HD-PE + HD-FR',
                protocolName: 'Pre-Exhaustion + Forced Reps',
                exercises: [
                    {
                        id: 'hd6', name: 'Extensión de Cuádriceps',
                        muscleGroup: 'Cuádriceps', type: 'isolation', isPrimary: false,
                        sets: 1, targetReps: '10-12', targetRIR: 0, targetRPE: 10,
                        restSeconds: 0, tempo: '2-0-2',
                        note: 'Pre-Exhaustion: Sin descanso → Prensa',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd7', name: 'Prensa 45°',
                        muscleGroup: 'Cuádriceps', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '6-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 210, tempo: '2-1-4',
                        note: 'Post Pre-Exhaustion + 2-3 Forced Reps',
                        intensifiers: ['Pre-Exhaustion', 'Forced Reps'],
                        extraReps: '+2-3 Forced',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd8', name: 'Sentadilla Hack',
                        muscleGroup: 'Cuádriceps', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '6-8', targetRIR: 0, targetRPE: 10,
                        restSeconds: 180, tempo: '2-1-4',
                        load: '85% 1RM',
                        intensifiers: ['Forced Reps'],
                        extraReps: '+2 Forced',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd9', name: 'Curl Femoral Acostado',
                        muscleGroup: 'Isquiotibiales', type: 'isolation', isPrimary: true,
                        sets: 1, targetReps: '8-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 150, tempo: '2-1-4',
                        intensifiers: ['Forced Reps'],
                        extraReps: '+2 Forced',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd10', name: 'Peso Muerto Rumano',
                        muscleGroup: 'Isquiotibiales', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '6-8', targetRIR: 0, targetRPE: 10,
                        restSeconds: 180, tempo: '2-1-4',
                        load: '85% 1RM',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd11', name: 'Elevación de Talones Sentado',
                        muscleGroup: 'Pantorrillas', type: 'isolation', isPrimary: false,
                        sets: 1, targetReps: '10-15', targetRIR: 0, targetRPE: 10,
                        restSeconds: 120, tempo: '2-2-4',
                        intensifiers: ['Rest-Pause'],
                        note: '+4-6 RP (10-15s descanso)',
                        setsCompleted: [], completed: false
                    }
                ]
            },
            // ──────────────────────────────────────
            // DÍA 3: Tren Superior B (Espalda/Bíceps/Trapecios)
            // Protocolo: HD-SS (Superseries HIT) + HD-NEG (Negativas)
            // ──────────────────────────────────────
            {
                name: 'Tren Superior B — Espalda/Bíceps/Trapecios',
                muscles: ['Espalda', 'Bíceps', 'Trapecios'],
                protocol: 'HD-SS + HD-NEG',
                protocolName: 'Superseries HIT + Negativas',
                exercises: [
                    {
                        id: 'hd12', name: 'Remo Hammer',
                        muscleGroup: 'Espalda', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '6-8', targetRIR: 0, targetRPE: 10,
                        restSeconds: 0, tempo: '2-1-4',
                        note: 'Superserie → Jalón al Pecho',
                        intensifiers: ['Superseries'],
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd13', name: 'Jalón al Pecho',
                        muscleGroup: 'Espalda', type: 'compound', isPrimary: true,
                        sets: 1, targetReps: '8-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 210, tempo: '2-1-4',
                        note: 'Segunda parte de Superserie',
                        intensifiers: ['Superseries'],
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd14', name: 'Pullover Máquina',
                        muscleGroup: 'Espalda', type: 'isolation', isPrimary: false,
                        sets: 1, targetReps: '8-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 180, tempo: '1-0-6',
                        note: 'Negativas controladas 6 segundos',
                        intensifiers: ['Negativas'],
                        extraReps: '+3 Neg controladas 6s',
                        load: '100-110% 1RM',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd15', name: 'Curl Predicador',
                        muscleGroup: 'Bíceps', type: 'isolation', isPrimary: true,
                        sets: 1, targetReps: '6-10', targetRIR: 0, targetRPE: 10,
                        restSeconds: 150, tempo: '2-1-4',
                        intensifiers: ['Forced Reps'],
                        extraReps: '+2 Forced',
                        setsCompleted: [], completed: false
                    },
                    {
                        id: 'hd16', name: 'Encogimientos con Barra',
                        muscleGroup: 'Trapecios', type: 'isolation', isPrimary: false,
                        sets: 1, targetReps: '8-12', targetRIR: 0, targetRPE: 10,
                        restSeconds: 120, tempo: '2-2-4',
                        setsCompleted: [], completed: false
                    }
                ]
            }
        ]
    };
    localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));
    localStorage.setItem('rpCoach_currentRoutine', JSON.stringify(routine));

    // ═══════════════════════════════════════════════════════════════
    // 7. PESOS POR EJERCICIO (último peso registrado)
    // ═══════════════════════════════════════════════════════════════
    const exerciseWeights = {
        'Press Inclinado Hammer':       { weight: 95,  reps: 8,  date: daysAgo(2) },
        'Press Banca Declinado':        { weight: 100, reps: 7,  date: daysAgo(2) },
        'Press Militar Máquina':        { weight: 70,  reps: 8,  date: daysAgo(2) },
        'Elevaciones Laterales Máquina':{ weight: 20,  reps: 10, date: daysAgo(2) },
        'Fondos en Máquina':            { weight: 25,  reps: 8,  date: daysAgo(2) },
        'Extensión de Cuádriceps':      { weight: 65,  reps: 12, date: daysAgo(4) },
        'Prensa 45°':                   { weight: 280, reps: 8,  date: daysAgo(4) },
        'Sentadilla Hack':              { weight: 140, reps: 7,  date: daysAgo(4) },
        'Curl Femoral Acostado':        { weight: 50,  reps: 9,  date: daysAgo(4) },
        'Peso Muerto Rumano':           { weight: 120, reps: 7,  date: daysAgo(4) },
        'Elevación de Talones Sentado': { weight: 60,  reps: 13, date: daysAgo(4) },
        'Remo Hammer':                  { weight: 85,  reps: 7,  date: daysAgo(6) },
        'Jalón al Pecho':               { weight: 80,  reps: 9,  date: daysAgo(6) },
        'Pullover Máquina':             { weight: 55,  reps: 9,  date: daysAgo(6) },
        'Curl Predicador':              { weight: 35,  reps: 8,  date: daysAgo(6) },
        'Encogimientos con Barra':      { weight: 90,  reps: 10, date: daysAgo(6) }
    };
    localStorage.setItem('rpCoach_exercise_weights', JSON.stringify(exerciseWeights));

    Object.entries(exerciseWeights).forEach(([name, data]) => {
        localStorage.setItem('rpCoach_lastWeight_' + name, String(data.weight));
    });

    // ═══════════════════════════════════════════════════════════════
    // 8. HISTORIAL DE SESIONES — 4 semanas completas (12 sesiones)
    // ═══════════════════════════════════════════════════════════════
    //
    // Heavy Duty: 1 serie de trabajo al fallo por ejercicio
    // Progresión: Semana 1 (RIR 1) → Semana 2 (RIR 0) → Semana 3 (RIR 0 + intensificadores) → Semana 4 (Deload RIR 3)
    //
    function buildSession(dayOffset, dayName, muscles, exercises, weekNum, protocols) {
        const isDeload = weekNum === 4;
        const methodology = 'HeavyDuty';

        const exData = exercises.map(ex => {
            const mainWeight = ex.sets[0].w;
            const prevWeight = ex.prevWeight || 0;
            return {
                name: ex.name,
                muscleGroup: ex.muscle,
                protocol: ex.protocol || 'HD-SU',
                intensifiers: ex.intensifiers || [],
                sets: ex.sets.map((s, i) => ({
                    setNumber: i + 1,
                    weight: s.w,
                    reps: s.r,
                    rpe: s.rpe,
                    rir: Math.max(0, 10 - s.rpe),
                    volume: s.w * s.r,
                    tempo: s.tempo || '2-1-4',
                    forcedReps: s.forcedReps || 0,
                    negativeReps: s.negativeReps || 0,
                    restPauseReps: s.restPauseReps || 0
                })),
                totalSets: ex.sets.length,
                totalVolume: ex.sets.reduce((sum, s) => sum + s.w * s.r, 0),
                // Backward compatibility
                weight: mainWeight,
                reps: ex.sets[0].r,
                rpe: ex.sets[0].rpe,
                rir: Math.max(0, 10 - ex.sets[0].rpe),
                volume: ex.sets.reduce((sum, s) => sum + s.w * s.r, 0),
                // Progression fields
                weightUsed: mainWeight,
                previousWeight: prevWeight,
                targetWeight: mainWeight,
                weightChange: prevWeight > 0 ? +(mainWeight - prevWeight).toFixed(1) : 0
            };
        });

        const totalVol = exData.reduce((s, e) => s + e.totalVolume, 0);
        const totalSets = exData.reduce((s, e) => s + e.totalSets, 0);
        const muscleVolume = {};
        exData.forEach(e => {
            muscleVolume[e.muscleGroup] = (muscleVolume[e.muscleGroup] || 0) + e.totalSets;
        });

        const avgRPE = exData.reduce((s, e) => s + e.rpe, 0) / exData.length;

        return {
            id: 'session_hd_' + (Date.now() - dayOffset * 86400000),
            date: isoAgo(dayOffset),
            dayName,
            muscles,
            methodology,
            protocols: protocols || 'HD-SU',
            mesocycleWeek: weekNum,
            mesocycleName: isDeload ? 'Deload' : (weekNum === 1 ? 'Adaptación HIT' : (weekNum === 2 ? 'Intensificación' : 'Pico + Intensificadores')),
            targetRIR: isDeload ? 3 : (weekNum === 1 ? 1 : 0),
            exercises: exData,
            stats: {
                totalVolume: Math.round(totalVol),
                totalSets,
                avgRPE: avgRPE.toFixed(1),
                avgRIR: (10 - avgRPE).toFixed(1),
                exerciseCount: exData.length,
                sessionDuration: isDeload ? '20 min' : '35 min'
            },
            muscleVolume,
            rating: isDeload ? 3 : (weekNum >= 3 ? 5 : 4),
            notes: isDeload ? 'Deload: 50% carga, sin fallo' :
                   weekNum === 3 ? 'Sesión brutal. Forced reps + negativas al máximo.' :
                   weekNum === 2 ? 'Fallo muscular absoluto en cada set.' :
                   'Adaptación a intensidad HIT. 1 rep en reserva.'
        };
    }

    const sessionHistory = [

        // ════════════════════════════════════════
        // SEMANA 4 — DELOAD (50% carga, RIR 3, sin fallo)
        // ════════════════════════════════════════

        // Día 1: Tren Superior A — Deload
        buildSession(2, 'Tren Superior A — Deload', ['Pecho', 'Hombros', 'Tríceps'], [
            { name: 'Press Inclinado Hammer', muscle: 'Pecho', protocol: 'Deload', prevWeight: 95, sets: [
                { w: 47.5, r: 10, rpe: 5 }
            ]},
            { name: 'Press Banca Declinado', muscle: 'Pecho', protocol: 'Deload', prevWeight: 100, sets: [
                { w: 50, r: 10, rpe: 5 }
            ]},
            { name: 'Press Militar Máquina', muscle: 'Hombros', protocol: 'Deload', prevWeight: 70, sets: [
                { w: 35, r: 10, rpe: 5 }
            ]},
            { name: 'Elevaciones Laterales Máquina', muscle: 'Hombros', protocol: 'Deload', prevWeight: 20, sets: [
                { w: 10, r: 12, rpe: 5 }
            ]},
            { name: 'Fondos en Máquina', muscle: 'Tríceps', protocol: 'Deload', prevWeight: 25, sets: [
                { w: 12.5, r: 10, rpe: 5 }
            ]}
        ], 4, 'Deload'),

        // Día 2: Tren Inferior — Deload
        buildSession(4, 'Tren Inferior — Deload', ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'], [
            { name: 'Prensa 45°', muscle: 'Cuádriceps', protocol: 'Deload', prevWeight: 280, sets: [
                { w: 140, r: 10, rpe: 5 }
            ]},
            { name: 'Sentadilla Hack', muscle: 'Cuádriceps', protocol: 'Deload', prevWeight: 140, sets: [
                { w: 70, r: 10, rpe: 5 }
            ]},
            { name: 'Curl Femoral Acostado', muscle: 'Isquiotibiales', protocol: 'Deload', prevWeight: 50, sets: [
                { w: 25, r: 10, rpe: 5 }
            ]},
            { name: 'Peso Muerto Rumano', muscle: 'Isquiotibiales', protocol: 'Deload', prevWeight: 120, sets: [
                { w: 60, r: 10, rpe: 5 }
            ]},
            { name: 'Elevación de Talones Sentado', muscle: 'Pantorrillas', protocol: 'Deload', prevWeight: 60, sets: [
                { w: 30, r: 12, rpe: 5 }
            ]}
        ], 4, 'Deload'),

        // Día 3: Tren Superior B — Deload
        buildSession(6, 'Tren Superior B — Deload', ['Espalda', 'Bíceps', 'Trapecios'], [
            { name: 'Remo Hammer', muscle: 'Espalda', protocol: 'Deload', prevWeight: 85, sets: [
                { w: 42.5, r: 10, rpe: 5 }
            ]},
            { name: 'Jalón al Pecho', muscle: 'Espalda', protocol: 'Deload', prevWeight: 80, sets: [
                { w: 40, r: 10, rpe: 5 }
            ]},
            { name: 'Pullover Máquina', muscle: 'Espalda', protocol: 'Deload', prevWeight: 55, sets: [
                { w: 27.5, r: 10, rpe: 5 }
            ]},
            { name: 'Curl Predicador', muscle: 'Bíceps', protocol: 'Deload', prevWeight: 35, sets: [
                { w: 17.5, r: 10, rpe: 5 }
            ]},
            { name: 'Encogimientos con Barra', muscle: 'Trapecios', protocol: 'Deload', prevWeight: 90, sets: [
                { w: 45, r: 10, rpe: 5 }
            ]}
        ], 4, 'Deload'),

        // ════════════════════════════════════════
        // SEMANA 3 — PICO: RIR 0 + Intensificadores (Forced Reps, Negativas, Superseries)
        // ════════════════════════════════════════

        // Día 1: Tren Superior A — HD-SU + Forced Reps
        buildSession(9, 'Tren Superior A — Pecho/Hombros/Tríceps', ['Pecho', 'Hombros', 'Tríceps'], [
            { name: 'Press Inclinado Hammer', muscle: 'Pecho', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 92.5, sets: [
                { w: 95, r: 8, rpe: 10, forcedReps: 2 }
            ]},
            { name: 'Press Banca Declinado', muscle: 'Pecho', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 97.5, sets: [
                { w: 100, r: 7, rpe: 10, forcedReps: 2 }
            ]},
            { name: 'Press Militar Máquina', muscle: 'Hombros', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 67.5, sets: [
                { w: 70, r: 8, rpe: 10, forcedReps: 2 }
            ]},
            { name: 'Elevaciones Laterales Máquina', muscle: 'Hombros', protocol: 'HD-SU', prevWeight: 17.5, sets: [
                { w: 20, r: 10, rpe: 10 }
            ]},
            { name: 'Fondos en Máquina', muscle: 'Tríceps', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 22.5, sets: [
                { w: 25, r: 8, rpe: 10, forcedReps: 2 }
            ]}
        ], 3, 'HD-SU + HD-FR'),

        // Día 2: Tren Inferior — HD-PE + HD-FR + HD-RP
        buildSession(11, 'Tren Inferior — Cuádriceps/Isquios/Glúteos', ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'], [
            { name: 'Extensión de Cuádriceps', muscle: 'Cuádriceps', protocol: 'HD-PE', intensifiers: ['Pre-Exhaustion'], prevWeight: 60, sets: [
                { w: 65, r: 12, rpe: 10 }
            ]},
            { name: 'Prensa 45°', muscle: 'Cuádriceps', protocol: 'HD-PE + HD-FR', intensifiers: ['Pre-Exhaustion', 'Forced Reps'], prevWeight: 270, sets: [
                { w: 280, r: 8, rpe: 10, forcedReps: 3 }
            ]},
            { name: 'Sentadilla Hack', muscle: 'Cuádriceps', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 135, sets: [
                { w: 140, r: 7, rpe: 10, forcedReps: 2 }
            ]},
            { name: 'Curl Femoral Acostado', muscle: 'Isquiotibiales', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 47.5, sets: [
                { w: 50, r: 9, rpe: 10, forcedReps: 2 }
            ]},
            { name: 'Peso Muerto Rumano', muscle: 'Isquiotibiales', protocol: 'HD-SU', prevWeight: 115, sets: [
                { w: 120, r: 7, rpe: 10 }
            ]},
            { name: 'Elevación de Talones Sentado', muscle: 'Pantorrillas', protocol: 'HD-RP', intensifiers: ['Rest-Pause'], prevWeight: 55, sets: [
                { w: 60, r: 13, rpe: 10, restPauseReps: 5 }
            ]}
        ], 3, 'HD-PE + HD-FR + HD-RP'),

        // Día 3: Tren Superior B — HD-SS + HD-NEG
        buildSession(13, 'Tren Superior B — Espalda/Bíceps/Trapecios', ['Espalda', 'Bíceps', 'Trapecios'], [
            { name: 'Remo Hammer', muscle: 'Espalda', protocol: 'HD-SS', intensifiers: ['Superseries'], prevWeight: 82.5, sets: [
                { w: 85, r: 7, rpe: 10 }
            ]},
            { name: 'Jalón al Pecho', muscle: 'Espalda', protocol: 'HD-SS', intensifiers: ['Superseries'], prevWeight: 77.5, sets: [
                { w: 80, r: 9, rpe: 10 }
            ]},
            { name: 'Pullover Máquina', muscle: 'Espalda', protocol: 'HD-NEG', intensifiers: ['Negativas'], prevWeight: 52.5, sets: [
                { w: 55, r: 9, rpe: 10, negativeReps: 3 }
            ]},
            { name: 'Curl Predicador', muscle: 'Bíceps', protocol: 'HD-FR', intensifiers: ['Forced Reps'], prevWeight: 32.5, sets: [
                { w: 35, r: 8, rpe: 10, forcedReps: 2 }
            ]},
            { name: 'Encogimientos con Barra', muscle: 'Trapecios', protocol: 'HD-SU', prevWeight: 85, sets: [
                { w: 90, r: 10, rpe: 10 }
            ]}
        ], 3, 'HD-SS + HD-NEG + HD-FR'),

        // ════════════════════════════════════════
        // SEMANA 2 — INTENSIFICACIÓN: RIR 0 (Fallo absoluto)
        // ════════════════════════════════════════

        // Día 1: Tren Superior A
        buildSession(16, 'Tren Superior A — Pecho/Hombros/Tríceps', ['Pecho', 'Hombros', 'Tríceps'], [
            { name: 'Press Inclinado Hammer', muscle: 'Pecho', protocol: 'HD-SU', prevWeight: 90, sets: [
                { w: 92.5, r: 8, rpe: 10 }
            ]},
            { name: 'Press Banca Declinado', muscle: 'Pecho', protocol: 'HD-SU', prevWeight: 95, sets: [
                { w: 97.5, r: 7, rpe: 10 }
            ]},
            { name: 'Press Militar Máquina', muscle: 'Hombros', protocol: 'HD-SU', prevWeight: 65, sets: [
                { w: 67.5, r: 8, rpe: 10 }
            ]},
            { name: 'Elevaciones Laterales Máquina', muscle: 'Hombros', protocol: 'HD-SU', prevWeight: 15, sets: [
                { w: 17.5, r: 11, rpe: 10 }
            ]},
            { name: 'Fondos en Máquina', muscle: 'Tríceps', protocol: 'HD-SU', prevWeight: 20, sets: [
                { w: 22.5, r: 9, rpe: 10 }
            ]}
        ], 2, 'HD-SU'),

        // Día 2: Tren Inferior
        buildSession(18, 'Tren Inferior — Cuádriceps/Isquios/Glúteos', ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'], [
            { name: 'Extensión de Cuádriceps', muscle: 'Cuádriceps', protocol: 'HD-PE', intensifiers: ['Pre-Exhaustion'], prevWeight: 55, sets: [
                { w: 60, r: 12, rpe: 10 }
            ]},
            { name: 'Prensa 45°', muscle: 'Cuádriceps', protocol: 'HD-PE', intensifiers: ['Pre-Exhaustion'], prevWeight: 260, sets: [
                { w: 270, r: 8, rpe: 10 }
            ]},
            { name: 'Sentadilla Hack', muscle: 'Cuádriceps', protocol: 'HD-SU', prevWeight: 130, sets: [
                { w: 135, r: 7, rpe: 10 }
            ]},
            { name: 'Curl Femoral Acostado', muscle: 'Isquiotibiales', protocol: 'HD-SU', prevWeight: 45, sets: [
                { w: 47.5, r: 9, rpe: 10 }
            ]},
            { name: 'Peso Muerto Rumano', muscle: 'Isquiotibiales', protocol: 'HD-SU', prevWeight: 110, sets: [
                { w: 115, r: 7, rpe: 10 }
            ]},
            { name: 'Elevación de Talones Sentado', muscle: 'Pantorrillas', protocol: 'HD-SU', prevWeight: 50, sets: [
                { w: 55, r: 14, rpe: 10 }
            ]}
        ], 2, 'HD-PE + HD-SU'),

        // Día 3: Tren Superior B
        buildSession(20, 'Tren Superior B — Espalda/Bíceps/Trapecios', ['Espalda', 'Bíceps', 'Trapecios'], [
            { name: 'Remo Hammer', muscle: 'Espalda', protocol: 'HD-SU', prevWeight: 80, sets: [
                { w: 82.5, r: 7, rpe: 10 }
            ]},
            { name: 'Jalón al Pecho', muscle: 'Espalda', protocol: 'HD-SU', prevWeight: 75, sets: [
                { w: 77.5, r: 9, rpe: 10 }
            ]},
            { name: 'Pullover Máquina', muscle: 'Espalda', protocol: 'HD-SU', prevWeight: 50, sets: [
                { w: 52.5, r: 9, rpe: 10 }
            ]},
            { name: 'Curl Predicador', muscle: 'Bíceps', protocol: 'HD-SU', prevWeight: 30, sets: [
                { w: 32.5, r: 9, rpe: 10 }
            ]},
            { name: 'Encogimientos con Barra', muscle: 'Trapecios', protocol: 'HD-SU', prevWeight: 80, sets: [
                { w: 85, r: 10, rpe: 10 }
            ]}
        ], 2, 'HD-SU'),

        // ════════════════════════════════════════
        // SEMANA 1 — ADAPTACIÓN HIT: RIR 1 (1 rep en reserva)
        // ════════════════════════════════════════

        // Día 1: Tren Superior A
        buildSession(23, 'Tren Superior A — Pecho/Hombros/Tríceps', ['Pecho', 'Hombros', 'Tríceps'], [
            { name: 'Press Inclinado Hammer', muscle: 'Pecho', protocol: 'HD-SU', sets: [
                { w: 90, r: 8, rpe: 9 }
            ]},
            { name: 'Press Banca Declinado', muscle: 'Pecho', protocol: 'HD-SU', sets: [
                { w: 95, r: 7, rpe: 9 }
            ]},
            { name: 'Press Militar Máquina', muscle: 'Hombros', protocol: 'HD-SU', sets: [
                { w: 65, r: 8, rpe: 9 }
            ]},
            { name: 'Elevaciones Laterales Máquina', muscle: 'Hombros', protocol: 'HD-SU', sets: [
                { w: 15, r: 12, rpe: 9 }
            ]},
            { name: 'Fondos en Máquina', muscle: 'Tríceps', protocol: 'HD-SU', sets: [
                { w: 20, r: 9, rpe: 9 }
            ]}
        ], 1, 'HD-SU'),

        // Día 2: Tren Inferior
        buildSession(25, 'Tren Inferior — Cuádriceps/Isquios/Glúteos', ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'], [
            { name: 'Extensión de Cuádriceps', muscle: 'Cuádriceps', protocol: 'HD-PE', intensifiers: ['Pre-Exhaustion'], sets: [
                { w: 55, r: 12, rpe: 9 }
            ]},
            { name: 'Prensa 45°', muscle: 'Cuádriceps', protocol: 'HD-PE', intensifiers: ['Pre-Exhaustion'], sets: [
                { w: 260, r: 9, rpe: 9 }
            ]},
            { name: 'Sentadilla Hack', muscle: 'Cuádriceps', protocol: 'HD-SU', sets: [
                { w: 130, r: 7, rpe: 9 }
            ]},
            { name: 'Curl Femoral Acostado', muscle: 'Isquiotibiales', protocol: 'HD-SU', sets: [
                { w: 45, r: 9, rpe: 9 }
            ]},
            { name: 'Peso Muerto Rumano', muscle: 'Isquiotibiales', protocol: 'HD-SU', sets: [
                { w: 110, r: 8, rpe: 9 }
            ]},
            { name: 'Elevación de Talones Sentado', muscle: 'Pantorrillas', protocol: 'HD-SU', sets: [
                { w: 50, r: 14, rpe: 9 }
            ]}
        ], 1, 'HD-PE + HD-SU'),

        // Día 3: Tren Superior B
        buildSession(27, 'Tren Superior B — Espalda/Bíceps/Trapecios', ['Espalda', 'Bíceps', 'Trapecios'], [
            { name: 'Remo Hammer', muscle: 'Espalda', protocol: 'HD-SU', sets: [
                { w: 80, r: 7, rpe: 9 }
            ]},
            { name: 'Jalón al Pecho', muscle: 'Espalda', protocol: 'HD-SU', sets: [
                { w: 75, r: 9, rpe: 9 }
            ]},
            { name: 'Pullover Máquina', muscle: 'Espalda', protocol: 'HD-SU', sets: [
                { w: 50, r: 10, rpe: 9 }
            ]},
            { name: 'Curl Predicador', muscle: 'Bíceps', protocol: 'HD-SU', sets: [
                { w: 30, r: 9, rpe: 9 }
            ]},
            { name: 'Encogimientos con Barra', muscle: 'Trapecios', protocol: 'HD-SU', sets: [
                { w: 80, r: 11, rpe: 9 }
            ]}
        ], 1, 'HD-SU')
    ];

    localStorage.setItem('rpCoach_session_history', JSON.stringify(sessionHistory));
    localStorage.setItem('rpCoach_sessionHistory', JSON.stringify(sessionHistory));
    localStorage.setItem('rpCoach_last_session', JSON.stringify(sessionHistory[0]));

    // También guardar en formato alternativo
    localStorage.setItem('rpCoach_sesiones', JSON.stringify(sessionHistory));
    localStorage.setItem('rpCoach_ultima_sesion', JSON.stringify(sessionHistory[0]));

    // ═══════════════════════════════════════════════════════════════
    // 9. PRs DE FUERZA
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_strength_prs', JSON.stringify([
        { exercise: 'Press Inclinado Hammer', weight: 110, reps: 1, date: daysAgo(60), type: '1RM', e1rm: 110 },
        { exercise: 'Press Banca Declinado', weight: 120, reps: 1, date: daysAgo(55), type: '1RM', e1rm: 120 },
        { exercise: 'Prensa 45°', weight: 350, reps: 1, date: daysAgo(45), type: '1RM', e1rm: 350 },
        { exercise: 'Sentadilla Hack', weight: 180, reps: 1, date: daysAgo(50), type: '1RM', e1rm: 180 },
        { exercise: 'Peso Muerto Rumano', weight: 150, reps: 1, date: daysAgo(40), type: '1RM', e1rm: 150 },
        { exercise: 'Press Militar Máquina', weight: 85, reps: 1, date: daysAgo(35), type: '1RM', e1rm: 85 },
        { exercise: 'Remo Hammer', weight: 100, reps: 1, date: daysAgo(30), type: '1RM', e1rm: 100 },
        { exercise: 'Curl Predicador', weight: 45, reps: 1, date: daysAgo(25), type: '1RM', e1rm: 45 }
    ]));

    // ═══════════════════════════════════════════════════════════════
    // 10. READINESS / DISPONIBILIDAD — 4 semanas
    // ═══════════════════════════════════════════════════════════════
    //
    // Heavy Duty genera fatiga SNC extrema (9/10) pero se recupera
    // en los días de descanso (3-4 días entre sesiones)
    //
    localStorage.setItem('rpCoach_readiness_history', JSON.stringify([
        // Semana 4 (Deload — alta recuperación)
        { date: daysAgo(0), score: 9, sleep: 8.5, stress: 2, soreness: 1, motivation: 9, notes: 'Deload completado. Totalmente recuperado.' },
        { date: daysAgo(2), score: 8, sleep: 8,   stress: 2, soreness: 2, motivation: 8, notes: 'Deload Sup A — se siente liviano' },
        { date: daysAgo(4), score: 8, sleep: 8,   stress: 3, soreness: 2, motivation: 8, notes: 'Deload Inferior — sin estrés' },
        { date: daysAgo(6), score: 7, sleep: 7.5, stress: 3, soreness: 3, motivation: 7, notes: 'Inicio deload. Aún fatiga de S3.' },

        // Semana 3 (Pico — alta fatiga por intensificadores)
        { date: daysAgo(9),  score: 6, sleep: 7,   stress: 5, soreness: 7, motivation: 8, notes: 'Post Sup A con forced reps. SNC destruido.' },
        { date: daysAgo(10), score: 5, sleep: 6,   stress: 6, soreness: 8, motivation: 7, notes: 'DOMS brutal tras negativas en espalda.' },
        { date: daysAgo(11), score: 5, sleep: 6.5, stress: 5, soreness: 7, motivation: 7, notes: 'Piernas con pre-exhaustion. Temblando al salir.' },
        { date: daysAgo(13), score: 6, sleep: 7,   stress: 4, soreness: 6, motivation: 8, notes: 'SS + Negativas en espalda. Sesión más intensa del meso.' },

        // Semana 2 (Intensificación — fallo absoluto)
        { date: daysAgo(16), score: 7, sleep: 7.5, stress: 4, soreness: 5, motivation: 8, notes: 'Fallo absoluto en todo. Agotado pero satisfecho.' },
        { date: daysAgo(18), score: 6, sleep: 7,   stress: 4, soreness: 6, motivation: 8, notes: 'Pre-exhaustion en piernas al fallo. Brutal.' },
        { date: daysAgo(20), score: 7, sleep: 7.5, stress: 3, soreness: 5, motivation: 8, notes: 'Espalda al fallo. Buena sesión.' },

        // Semana 1 (Adaptación — RIR 1)
        { date: daysAgo(23), score: 8, sleep: 8,   stress: 3, soreness: 3, motivation: 9, notes: 'Primera sesión HD. RIR 1. Controlado.' },
        { date: daysAgo(25), score: 8, sleep: 7.5, stress: 3, soreness: 4, motivation: 9, notes: 'Piernas HD. Nuevo estímulo, buena adaptación.' },
        { date: daysAgo(27), score: 9, sleep: 8.5, stress: 2, soreness: 2, motivation: 10, notes: 'Inicio del mesociclo. Energía al máximo.' }
    ]));

    // ═══════════════════════════════════════════════════════════════
    // 11. FATIGUE TRACKER — Autorregulación
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_fatigue_tracker', JSON.stringify({
        global: 3,  // Post-deload: fatiga baja
        perMuscle: {
            'Pecho': 2,
            'Hombros': 2,
            'Tríceps': 2,
            'Espalda': 2,
            'Bíceps': 2,
            'Trapecios': 1,
            'Cuádriceps': 3,
            'Isquiotibiales': 2,
            'Pantorrillas': 1
        },
        weeklyVolume: {
            week1: { totalSets: 16, totalVolume: 10420 },
            week2: { totalSets: 16, totalVolume: 11350 },
            week3: { totalSets: 16, totalVolume: 12180 },
            week4: { totalSets: 16, totalVolume: 5890  }
        },
        lastDeload: daysAgo(6),
        currentWeek: 4,
        peakFatigueReached: daysAgo(9),
        peakFatigueScore: 8.5
    }));

    // ═══════════════════════════════════════════════════════════════
    // 12. MESOCICLO — Datos completos
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_mesocycle', JSON.stringify({
        id: 'meso_hd_' + Date.now(),
        name: 'Heavy Duty — Intensidad Máxima',
        methodology: 'HeavyDuty',
        startDate: daysAgo(27),
        endDate: daysAgo(0),
        totalWeeks: 4,
        currentWeek: 4,
        status: 'completed',
        weeklyProgression: [
            { week: 1, rir: 1, volumeMultiplier: 1.0, phase: 'Adaptación HIT', completed: true },
            { week: 2, rir: 0, volumeMultiplier: 1.0, phase: 'Intensificación', completed: true },
            { week: 3, rir: 0, volumeMultiplier: 1.0, phase: 'Pico + Intensificadores', completed: true, notes: 'Forced Reps, Negativas, Superseries, Rest-Pause' },
            { week: 4, rir: 3, volumeMultiplier: 0.5, phase: 'Deload', isDeload: true, completed: true }
        ],
        summary: {
            totalSessions: 12,
            totalVolume: 39840,
            avgSessionRPE: 8.8,
            strengthGains: {
                'Press Inclinado Hammer': { start: 90, end: 95, change: '+5.6%' },
                'Prensa 45°': { start: 260, end: 280, change: '+7.7%' },
                'Remo Hammer': { start: 80, end: 85, change: '+6.3%' },
                'Peso Muerto Rumano': { start: 110, end: 120, change: '+9.1%' }
            },
            bodyCompChanges: {
                bodyFat: { start: 14.2, end: 13.4, change: '-0.8%' },
                muscleMass: { start: 39.5, end: 40.4, change: '+0.9 kg' }
            }
        }
    }));

    // ═══════════════════════════════════════════════════════════════
    // 13. CALENDARIO DE ASISTENCIA — Formato CalendarioTracker
    // ═══════════════════════════════════════════════════════════════
    //
    // El CalendarioTracker espera: { mesocycleId, startDate, weeks: { 1: { plannedDays, attendance } } }
    // Cada semana tiene plannedDays (array) y attendance (objeto por fecha)
    // Los días de sesión deben coincidir con las fechas del historial
    //
    const dayNames = [
        'Tren Superior A — Pecho/Hombros/Tríceps',
        'Tren Inferior — Cuádriceps/Isquios/Glúteos',
        'Tren Superior B — Espalda/Bíceps/Trapecios'
    ];
    const dayMuscles = [
        'Pecho',
        'Piernas',
        'Espalda'
    ];

    // Sesiones por semana (días ago): S1=[27,25,23], S2=[20,18,16], S3=[13,11,9], S4=[6,4,2]
    const weekSessionDays = [
        [27, 25, 23],  // Semana 1
        [20, 18, 16],  // Semana 2
        [13, 11, 9],   // Semana 3
        [6, 4, 2]      // Semana 4 (deload)
    ];

    const MESOCYCLE_PHASES_SIM = {
        1: { name: 'Adaptación HIT', color: '#3B82F6' },
        2: { name: 'Intensificación', color: '#F59E0B' },
        3: { name: 'Pico + Intensificadores', color: '#EF4444' },
        4: { name: 'Deload', color: '#10B981' },
        5: { name: 'Nuevo Meso', color: '#8B5CF6' }
    };

    const calendarWeeks = {};
    for (let w = 1; w <= 5; w++) {
        const phase = MESOCYCLE_PHASES_SIM[w];
        const rirByWeek = [1, 0, 0, 3, 3];

        if (w <= 4) {
            // Semanas con datos (1-4)
            const sessionDays = weekSessionDays[w - 1];
            const plannedDays = sessionDays.map((dayOffset, idx) => ({
                dayIndex: idx,
                dayName: dayNames[idx],
                plannedDate: daysAgo(dayOffset)
            }));

            const attendance = {};
            sessionDays.forEach((dayOffset, idx) => {
                const dateKey = daysAgo(dayOffset);
                // Buscar sesión correspondiente en el historial
                const matchingSession = sessionHistory.find(s => {
                    const sDate = new Date(s.date).toISOString().split('T')[0];
                    return sDate === dateKey;
                });
                attendance[dateKey] = {
                    status: 'completed',
                    sessionId: matchingSession ? matchingSession.id : 'session_sim_' + dayOffset,
                    dayName: dayNames[idx],
                    stats: matchingSession ? {
                        totalSets: matchingSession.stats.totalSets,
                        totalVolume: matchingSession.stats.totalVolume,
                        avgRPE: matchingSession.stats.avgRPE
                    } : { totalSets: 5, totalVolume: 3000, avgRPE: '9.0' }
                };
            });

            calendarWeeks[w] = {
                name: phase.name,
                color: phase.color,
                rir: rirByWeek[w - 1],
                plannedDays,
                attendance
            };
        } else {
            // Semana 5: futuro (pendiente)
            const futureStart = new Date();
            futureStart.setDate(futureStart.getDate() + 1);
            // Ajustar al próximo lunes
            const dow = futureStart.getDay();
            if (dow === 0) futureStart.setDate(futureStart.getDate() + 1);
            else if (dow !== 1) futureStart.setDate(futureStart.getDate() + (8 - dow));

            const plannedDays = [];
            for (let d = 0; d < 3; d++) {
                const dayDate = new Date(futureStart);
                dayDate.setDate(dayDate.getDate() + d * 2); // Lun, Mié, Vie
                plannedDays.push({
                    dayIndex: d,
                    dayName: dayNames[d],
                    plannedDate: dayDate.toISOString().split('T')[0]
                });
            }

            calendarWeeks[w] = {
                name: phase.name,
                color: phase.color,
                rir: 3,
                plannedDays,
                attendance: {}
            };
        }
    }

    // Calcular resumen
    let totalCompleted = 0, totalMissed = 0, totalPlanned = 0;
    Object.values(calendarWeeks).forEach(week => {
        totalPlanned += week.plannedDays.length;
        Object.values(week.attendance).forEach(a => {
            if (a.status === 'completed') totalCompleted++;
            if (a.status === 'missed') totalMissed++;
        });
    });

    const calendarData = {
        mesocycleId: 'meso_hd_sim_' + Date.now(),
        startDate: new Date(daysAgo(27) + 'T00:00:00').toISOString(),
        methodology: 'HeavyDuty',
        split: 'hit_3day',
        totalWeeks: 5,
        daysPerWeek: 3,
        weeks: calendarWeeks,
        summary: {
            totalPlanned,
            totalCompleted,
            totalMissed,
            compliancePercent: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
        }
    };
    localStorage.setItem('rpCoach_attendance_calendar', JSON.stringify(calendarData));

    // ═══════════════════════════════════════════════════════════════
    // 14. SESSION LOGS (Enhanced) — Para analíticas
    // ═══════════════════════════════════════════════════════════════
    const enhancedLogs = sessionHistory.map(s => ({
        date: s.date,
        dayName: s.dayName,
        methodology: 'HeavyDuty',
        protocols: s.protocols,
        week: s.mesocycleWeek,
        exercises: s.exercises.map(e => ({
            name: e.name,
            muscle: e.muscleGroup,
            weight: e.weight,
            reps: e.reps,
            rpe: e.rpe,
            rir: e.rir,
            volume: e.volume,
            protocol: e.protocol,
            intensifiers: e.intensifiers || []
        })),
        totalVolume: s.stats.totalVolume,
        avgRPE: parseFloat(s.stats.avgRPE),
        rating: s.rating,
        notes: s.notes
    }));
    localStorage.setItem('rpCoach_enhanced_logs', JSON.stringify(enhancedLogs));
    localStorage.setItem('rpCoach_session_logs', JSON.stringify(enhancedLogs));
    localStorage.setItem('rpCoach_enhanced_sessions', JSON.stringify(enhancedLogs));

    // ═══════════════════════════════════════════════════════════════
    // 15. SMART ALERTS — Alertas inteligentes del mesociclo
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_smart_alerts', JSON.stringify([
        {
            id: 'alert_1', type: 'achievement', priority: 'high',
            title: 'Mesociclo Heavy Duty Completado',
            message: '12/12 sesiones completadas. Fuerza +6.8% promedio. Grasa corporal -0.8%.',
            date: daysAgo(0), read: false
        },
        {
            id: 'alert_2', type: 'recovery', priority: 'medium',
            title: 'Recuperación Post-Deload Óptima',
            message: 'Fatiga SNC reducida de 8.5 a 3.0 tras semana de deload. Listo para nuevo mesociclo.',
            date: daysAgo(1), read: false
        },
        {
            id: 'alert_3', type: 'progression', priority: 'medium',
            title: 'PR en Prensa 45°',
            message: 'Nuevo récord de trabajo: 280kg x 8 reps + 3 forced reps (Semana 3).',
            date: daysAgo(11), read: true
        },
        {
            id: 'alert_4', type: 'warning', priority: 'high',
            title: 'Fatiga SNC Máxima Alcanzada',
            message: 'Score de fatiga 8.5/10 tras Semana 3 con intensificadores. Deload programado.',
            date: daysAgo(9), read: true
        },
        {
            id: 'alert_5', type: 'nutrition', priority: 'low',
            title: 'Ajuste Nutricional Sugerido',
            message: 'Considerar día alto en carbos post-deload para rellenar glucógeno antes del nuevo meso.',
            date: daysAgo(2), read: false
        }
    ]));

    // ═══════════════════════════════════════════════════════════════
    // 16. PERFORMANCE HISTORY — Para gráficas de progreso
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_performance_history', JSON.stringify([
        { date: daysAgo(27), metric: 'volume', value: 10420, week: 1 },
        { date: daysAgo(20), metric: 'volume', value: 11350, week: 2 },
        { date: daysAgo(13), metric: 'volume', value: 12180, week: 3 },
        { date: daysAgo(6),  metric: 'volume', value: 5890,  week: 4 },
        { date: daysAgo(27), metric: 'intensity', value: 9.0, week: 1 },
        { date: daysAgo(20), metric: 'intensity', value: 10.0, week: 2 },
        { date: daysAgo(13), metric: 'intensity', value: 10.0, week: 3 },
        { date: daysAgo(6),  metric: 'intensity', value: 5.0, week: 4 },
        { date: daysAgo(27), metric: 'fatigue', value: 4, week: 1 },
        { date: daysAgo(20), metric: 'fatigue', value: 6, week: 2 },
        { date: daysAgo(13), metric: 'fatigue', value: 8.5, week: 3 },
        { date: daysAgo(6),  metric: 'fatigue', value: 3, week: 4 }
    ]));

    // ═══════════════════════════════════════════════════════════════
    // 17. AUTOREGULATION HISTORY
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_autoregulation_history', JSON.stringify([
        { date: daysAgo(23), decision: 'proceed', reason: 'Readiness 8/10. Semana 1 adaptación.', week: 1 },
        { date: daysAgo(16), decision: 'proceed', reason: 'Readiness 7/10. Fallo alcanzado consistentemente.', week: 2 },
        { date: daysAgo(9),  decision: 'caution', reason: 'Readiness 5-6/10. Fatiga SNC alta pero protocolo pico completado.', week: 3 },
        { date: daysAgo(6),  decision: 'deload', reason: 'Fatiga acumulada 8.5/10. Deload obligatorio.', week: 4 }
    ]));

    // ═══════════════════════════════════════════════════════════════
    // 18. PROGRESS DATA — Para módulo de progreso
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_progress', JSON.stringify({
        methodology: 'HeavyDuty',
        mesocycleNumber: 1,
        overallProgress: 100,
        strengthProgress: {
            'Press Inclinado Hammer': [
                { date: daysAgo(23), weight: 90 },
                { date: daysAgo(16), weight: 92.5 },
                { date: daysAgo(9),  weight: 95 },
                { date: daysAgo(2),  weight: 47.5 }
            ],
            'Prensa 45°': [
                { date: daysAgo(25), weight: 260 },
                { date: daysAgo(18), weight: 270 },
                { date: daysAgo(11), weight: 280 },
                { date: daysAgo(4),  weight: 140 }
            ],
            'Remo Hammer': [
                { date: daysAgo(27), weight: 80 },
                { date: daysAgo(20), weight: 82.5 },
                { date: daysAgo(13), weight: 85 },
                { date: daysAgo(6),  weight: 42.5 }
            ]
        }
    }));

    // ═══════════════════════════════════════════════════════════════
    // 19. PROGRESSIVE OVERLOAD — Sobrecarga progresiva por ejercicio
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_progressive_overload', JSON.stringify({
        'Press Inclinado Hammer': {
            currentWeight: 95, previousWeight: 92.5, increment: 2.5,
            nextRecommended: 97.5, sessions: 3, totalIncrease: 5, percentIncrease: 5.6
        },
        'Press Banca Declinado': {
            currentWeight: 100, previousWeight: 97.5, increment: 2.5,
            nextRecommended: 102.5, sessions: 3, totalIncrease: 5, percentIncrease: 5.3
        },
        'Press Militar Máquina': {
            currentWeight: 70, previousWeight: 67.5, increment: 2.5,
            nextRecommended: 72.5, sessions: 3, totalIncrease: 5, percentIncrease: 7.7
        },
        'Elevaciones Laterales Máquina': {
            currentWeight: 20, previousWeight: 17.5, increment: 2.5,
            nextRecommended: 22.5, sessions: 3, totalIncrease: 5, percentIncrease: 33.3
        },
        'Fondos en Máquina': {
            currentWeight: 25, previousWeight: 22.5, increment: 2.5,
            nextRecommended: 27.5, sessions: 3, totalIncrease: 5, percentIncrease: 25.0
        },
        'Extensión de Cuádriceps': {
            currentWeight: 65, previousWeight: 60, increment: 5,
            nextRecommended: 70, sessions: 3, totalIncrease: 10, percentIncrease: 18.2
        },
        'Prensa 45°': {
            currentWeight: 280, previousWeight: 270, increment: 10,
            nextRecommended: 290, sessions: 3, totalIncrease: 20, percentIncrease: 7.7
        },
        'Sentadilla Hack': {
            currentWeight: 140, previousWeight: 135, increment: 5,
            nextRecommended: 145, sessions: 3, totalIncrease: 10, percentIncrease: 7.7
        },
        'Curl Femoral Acostado': {
            currentWeight: 50, previousWeight: 47.5, increment: 2.5,
            nextRecommended: 52.5, sessions: 3, totalIncrease: 5, percentIncrease: 11.1
        },
        'Peso Muerto Rumano': {
            currentWeight: 120, previousWeight: 115, increment: 5,
            nextRecommended: 125, sessions: 3, totalIncrease: 10, percentIncrease: 9.1
        },
        'Elevación de Talones Sentado': {
            currentWeight: 60, previousWeight: 55, increment: 5,
            nextRecommended: 65, sessions: 3, totalIncrease: 10, percentIncrease: 20.0
        },
        'Remo Hammer': {
            currentWeight: 85, previousWeight: 82.5, increment: 2.5,
            nextRecommended: 87.5, sessions: 3, totalIncrease: 5, percentIncrease: 6.3
        },
        'Jalón al Pecho': {
            currentWeight: 80, previousWeight: 77.5, increment: 2.5,
            nextRecommended: 82.5, sessions: 3, totalIncrease: 5, percentIncrease: 6.7
        },
        'Pullover Máquina': {
            currentWeight: 55, previousWeight: 52.5, increment: 2.5,
            nextRecommended: 57.5, sessions: 3, totalIncrease: 5, percentIncrease: 10.0
        },
        'Curl Predicador': {
            currentWeight: 35, previousWeight: 32.5, increment: 2.5,
            nextRecommended: 37.5, sessions: 3, totalIncrease: 5, percentIncrease: 16.7
        },
        'Encogimientos con Barra': {
            currentWeight: 90, previousWeight: 85, increment: 5,
            nextRecommended: 95, sessions: 3, totalIncrease: 10, percentIncrease: 12.5
        }
    }));

    // ═══════════════════════════════════════════════════════════════
    // 20. RIR COMPARISON — RIR planeado vs real por sesión
    // ═══════════════════════════════════════════════════════════════
    const rirComparison = [];
    sessionHistory.forEach(sess => {
        sess.exercises.forEach(ex => {
            rirComparison.push({
                date: sess.date,
                week: sess.mesocycleWeek,
                exercise: ex.name,
                muscleGroup: ex.muscleGroup,
                targetRIR: sess.targetRIR,
                actualRIR: ex.rir,
                difference: ex.rir - sess.targetRIR,
                status: Math.abs(ex.rir - sess.targetRIR) <= 1 ? 'on_target' : 'off_target'
            });
        });
    });
    localStorage.setItem('rpCoach_rir_comparison', JSON.stringify(rirComparison));

    // ═══════════════════════════════════════════════════════════════
    // 21. GATE CHECK — Estado para el widget (semana 4 completada)
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_gate_check', JSON.stringify({
        lastScore: { score: 82, readiness: 87, fatigue: 80, performance: 78 },
        lastRecommendation: {
            action: 'advance', light: 'green',
            title: '✅ Listo para Avanzar',
            description: 'Tus métricas indican buena recuperación y rendimiento. Puedes avanzar a la siguiente fase.',
            color: '#10B981'
        },
        currentWeek: 4,
        decided: false,
        history: [
            { week: 2, score: 78, action: 'advance', forced: false, timestamp: isoAgo(16) },
            { week: 3, score: 55, action: 'caution', forced: false, timestamp: isoAgo(9) }
        ]
    }));

    // ═══════════════════════════════════════════════════════════════
    // 22. WORKOUT STATE — Estado final
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_workout_state', JSON.stringify({
        isActive: false,
        lastCompleted: isoAgo(2),
        currentDayIndex: 0,
        mesocycleComplete: true,
        totalSessionsCompleted: 12,
        nextAction: 'Iniciar nuevo mesociclo'
    }));

    // ═══════════════════════════════════════════════════════════════
    // 23. METODOLOGÍAS RPizadas — Registro de actualizaciones v3
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_methodology_updates', JSON.stringify({
        version: 'v3_rpized',
        updatedAt: new Date().toISOString(),
        totalMethodologies: 9,
        eliminated: [
            { id: 'GVT', name: 'German Volume Training', reason: 'Score máximo 73/100 — volumen excesivo sin progresión de RIR, fatiga desproporcionada', maxScore: 73 },
            { id: 'DCTraining', name: 'DC Training (Doggcrapp)', reason: 'Score máximo 67/100 — blast/cruise incompatible con periodización progresiva', maxScore: 67 }
        ],
        ranking: [
            { rank: 1, id: 'RPStyle', name: 'RP Style', score: 96, category: 'native' },
            { rank: 2, id: 'DUP', name: 'DUP (Daily Undulating Periodization)', score: 91, category: 'native' },
            { rank: 3, id: 'Y3T', name: 'Y3T (Yoda 3 Training)', score: 86, category: 'native' },
            { rank: 4, id: '531', name: '5/3/1 (Wendler) RPizado', score: 85, category: 'rpized' },
            { rank: 5, id: 'FST7', name: 'FST-7 + Lengthened Partials', score: 86, category: 'rpized', improvements: ['7 series FST en posición estirada', 'Series base con RIR progresivo'] },
            { rank: 6, id: 'RestPause', name: 'Rest-Pause + Clusters', score: 85, category: 'rpized', improvements: ['Reps post-pausa como Lengthened Partials', 'Progresión dual: peso + densidad', 'Cluster Sets'] },
            { rank: 7, id: 'MTUT', name: 'Control Excéntrico Periodizado', score: 85, category: 'rpized', improvements: ['Tempo excéntrico 2-4s (evidencia 2025)', 'Concéntrica explosiva', 'Lengthened Partials en peak'] },
            { rank: 8, id: 'HeavyDuty', name: 'HIT Inteligente (Heavy Duty)', score: 84, category: 'rpized', improvements: ['Myo-Reps post-fallo', '2-3 series con RIR progresivo', 'Beyond failure solo en peak'] },
            { rank: 9, id: 'SST', name: 'Estrés Metabólico Progresivo (SST)', score: 84, category: 'rpized', improvements: ['Series base con RIR progresivo', 'Myo-Reps en semanas peak', 'Lengthened Partials opcionales'] }
        ],
        scientificBasis: {
            lengthened_partials: 'PeerJ 2025: parciales en posición estirada producen hipertrofia igual o superior a ROM completo',
            myo_reps: 'Borge Fagerli 2024: mini-series post-activación capturan effective reps con máxima eficiencia',
            eccentric_tempo: 'Meta-análisis 2025 (Frontiers): excéntricos 2-4s óptimos, >4s sin beneficio adicional',
            rest_pause: 'Meta-análisis 2024 (Frontiers Sports): RP mejora IGF-1 y ratio follistatin/myostatin',
            cluster_sets: 'European J Applied Physiology 2025: cluster sets = hipertrofia similar cuando se iguala esfuerzo'
        },
        rpPrinciples: [
            'Volumen progresivo MEV→MAV→MRV',
            'RIR como regulador de intensidad (3→2→1→0)',
            'Sobrecarga progresiva cuantificable',
            'Deload basado en fatiga (no calendario fijo)',
            'Rangos de repeticiones variados',
            'Frecuencia mínima 2x/semana por grupo',
            'Periodización ondulante'
        ]
    }));

    // ═══════════════════════════════════════════════════════════════
    // 24. PROGRESIÓN POR TÉCNICAS RPizadas — Datos para sección de progresión
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_rpized_progress', JSON.stringify({
        currentMethodology: 'HeavyDuty',
        rpizedVersion: 'HIT Inteligente',
        techniques: {
            myoReps: {
                name: 'Myo-Reps',
                usedInSessions: 6,
                avgExtraReps: 11.3,
                progressHistory: [
                    { date: daysAgo(21), exercise: 'Press Inclinado', activationReps: 8, myoSets: 3, myoReps: [4, 3, 3] },
                    { date: daysAgo(14), exercise: 'Press Inclinado', activationReps: 9, myoSets: 3, myoReps: [5, 4, 3] },
                    { date: daysAgo(7), exercise: 'Press Inclinado', activationReps: 9, myoSets: 3, myoReps: [5, 4, 4] }
                ]
            },
            lengthenedPartials: {
                name: 'Lengthened Partials',
                usedInSessions: 4,
                avgExtraReps: 3.8,
                progressHistory: [
                    { date: daysAgo(14), exercise: 'Curl Inclinado', fullROMReps: 8, lpReps: 3, note: 'Posición estirada completa' },
                    { date: daysAgo(7), exercise: 'Curl Inclinado', fullROMReps: 9, lpReps: 4, note: 'Mejor control excéntrico' }
                ]
            },
            eccentricTempo: {
                name: 'Tempo Excéntrico Progresivo',
                currentTempo: '3s',
                progression: [
                    { week: 1, tempo: '2s', note: 'Fase adaptación' },
                    { week: 2, tempo: '3s', note: 'Progresión moderada' },
                    { week: 3, tempo: '4s', note: 'Máximo estímulo mecánico' },
                    { week: 4, tempo: '2s', note: 'Deload — tempo normal' }
                ]
            },
            clusterSets: {
                name: 'Cluster Sets',
                usedInSessions: 2,
                avgTotalReps: 15,
                note: 'Aplicado en compuestos pesados para mejor calidad de movimiento'
            }
        },
        weeklyRIRProgression: [
            { week: 1, targetRIR: 3, actualRIR: 3.1, phase: 'Adaptación HIT' },
            { week: 2, targetRIR: 2, actualRIR: 2.2, phase: 'Intensidad Alta' },
            { week: 3, targetRIR: 1, actualRIR: 0.8, phase: 'Al Fallo + Myo-Reps' },
            { week: 4, targetRIR: 4, actualRIR: 4.0, phase: 'Deload' }
        ]
    }));

    // ═══════════════════════════════════════════════════════════════
    // 20. FLAG DE SIMULACIÓN
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // 21. DOBLE PROGRESIÓN — Motor de micro-progresión por ejercicio
    // ═══════════════════════════════════════════════════════════════
    localStorage.setItem('rpCoach_double_progression', JSON.stringify({
        exercises: {
            'Press Inclinado Hammer': {
                lastWeight: 90, lastMaxReps: 10, lastAvgReps: 9,
                repRange: { min: 6, max: 10 },
                evaluation: { ready: false, setsAtMax: 1, totalSets: 3, progress: 33, reason: 'not_all_sets', message: '1/3 series a 10 reps' },
                suggestion: null,
                consecutiveAtMax: 0,
                progressions: [
                    { date: daysAgo(21), fromWeight: 85, toWeight: 87.5, fromReps: 10, toReps: 6, week: 1 }
                ],
                lastEvaluated: daysAgo(7),
                methodology: 'HeavyDuty'
            },
            'Remo Hammer Unilateral': {
                lastWeight: 45, lastMaxReps: 10, lastAvgReps: 10,
                repRange: { min: 6, max: 10 },
                evaluation: { ready: true, setsAtMax: 3, totalSets: 3, progress: 100, reason: 'all_sets_at_max', message: '3/3 series a 10 reps — SUBE PESO' },
                suggestion: { action: 'INCREASE_WEIGHT', currentWeight: 45, newWeight: 47, increment: 2, newTargetReps: 6, reason: 'Lograste 10 reps en 3 series. Sube a 47kg y vuelve a 6 reps.' },
                consecutiveAtMax: 1,
                progressions: [
                    { date: daysAgo(14), fromWeight: 42.5, toWeight: 45, fromReps: 10, toReps: 6, week: 2 }
                ],
                lastEvaluated: daysAgo(7),
                methodology: 'HeavyDuty'
            },
            'Curl Inclinado DB': {
                lastWeight: 14, lastMaxReps: 12, lastAvgReps: 11,
                repRange: { min: 8, max: 12 },
                evaluation: { ready: false, setsAtMax: 2, totalSets: 3, progress: 67, reason: 'not_all_sets', message: '2/3 series a 12 reps' },
                suggestion: null,
                consecutiveAtMax: 0,
                progressions: [],
                lastEvaluated: daysAgo(7),
                methodology: 'HeavyDuty'
            },
            'Press Militar DB': {
                lastWeight: 24, lastMaxReps: 12, lastAvgReps: 12,
                repRange: { min: 8, max: 12 },
                evaluation: { ready: true, setsAtMax: 3, totalSets: 3, progress: 100, reason: 'all_sets_at_max', message: '3/3 series a 12 reps — SUBE PESO' },
                suggestion: { action: 'INCREASE_WEIGHT', currentWeight: 24, newWeight: 26, increment: 2, newTargetReps: 8, reason: 'Lograste 12 reps en 3 series. Sube a 26kg y vuelve a 8 reps.' },
                consecutiveAtMax: 2,
                progressions: [
                    { date: daysAgo(21), fromWeight: 20, toWeight: 22, fromReps: 12, toReps: 8, week: 1 },
                    { date: daysAgo(7), fromWeight: 22, toWeight: 24, fromReps: 12, toReps: 8, week: 3 }
                ],
                lastEvaluated: daysAgo(7),
                methodology: 'HeavyDuty'
            },
            'Extensión Tríceps Cable': {
                lastWeight: 25, lastMaxReps: 15, lastAvgReps: 13,
                repRange: { min: 10, max: 15 },
                evaluation: { ready: false, setsAtMax: 1, totalSets: 3, progress: 33, reason: 'not_all_sets', message: '1/3 series a 15 reps' },
                suggestion: null,
                consecutiveAtMax: 0,
                progressions: [],
                lastEvaluated: daysAgo(7),
                methodology: 'HeavyDuty'
            },
            'Sentadilla Búlgara': {
                lastWeight: 30, lastMaxReps: 10, lastAvgReps: 10,
                repRange: { min: 8, max: 10 },
                evaluation: { ready: true, setsAtMax: 3, totalSets: 3, progress: 100, reason: 'all_sets_at_max', message: '3/3 series a 10 reps — SUBE PESO' },
                suggestion: { action: 'INCREASE_WEIGHT', currentWeight: 30, newWeight: 34, increment: 4, newTargetReps: 8, reason: 'Lograste 10 reps en 3 series. Sube a 34kg y vuelve a 8 reps.' },
                consecutiveAtMax: 1,
                progressions: [
                    { date: daysAgo(14), fromWeight: 26, toWeight: 30, fromReps: 10, toReps: 8, week: 2 }
                ],
                lastEvaluated: daysAgo(7),
                methodology: 'HeavyDuty'
            }
        },
        history: [
            { date: daysAgo(21), sessionId: 'session_sim_1', exercisesEvaluated: 6, readyForProgression: 1 },
            { date: daysAgo(14), sessionId: 'session_sim_2', exercisesEvaluated: 6, readyForProgression: 2 },
            { date: daysAgo(7), sessionId: 'session_sim_3', exercisesEvaluated: 6, readyForProgression: 3 }
        ]
    }));

    localStorage.setItem('rpCoach_sim_loaded', 'heavyduty_full_v6_dp');

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN EN CONSOLA
    // ═══════════════════════════════════════════════════════════════
    console.log('%c ═══════════════════════════════════════════════════════════════', 'color: #EF4444');
    console.log('%c 🔥 SIMULACIÓN HIT INTELIGENTE (RPizado) — MESOCICLO COMPLETO', 'color: #EF4444; font-size: 16px; font-weight: bold');
    console.log('%c ═══════════════════════════════════════════════════════════════', 'color: #EF4444');
    console.log('%c Atleta:', 'color: #A78BFA; font-weight: bold');
    console.log('  Nombre: Ricardo "Ricky" Valenzuela');
    console.log('  Edad: 31 años | Peso: 88kg | Altura: 1.82m');
    console.log('  Experiencia: Avanzado (8+ años)');
    console.log('  Grasa corporal: 13.5% | Masa muscular: 40.2 kg');
    console.log('');
    console.log('%c Mesociclo HIT Inteligente (Heavy Duty RPizado):', 'color: #F59E0B; font-weight: bold');
    console.log('  Metodología: HIT Inteligente — Mike Mentzer / RP Style');
    console.log('  Split: HIT 3 Días (Sup A / Inferior / Sup B)');
    console.log('  Duración: 4 semanas (3 intensas + 1 deload)');
    console.log('  Protocolos RPizados: HD-RP, HD-MYO, HD-NEG, HD-PE, HD-LP');
    console.log('  Técnicas: Myo-Reps, Lengthened Partials, RIR progresivo');
    console.log('  Estado: COMPLETADO');
    console.log('');
    console.log('%c Datos cargados:', 'color: #10B981; font-weight: bold');
    console.log('  📋 Perfil completo + Bioimpedancia');
    console.log('  🏋️ 12 sesiones (4 semanas x 3 días)');
    console.log('  📐 4 mediciones de composición corporal');
    console.log('  ⚖️ 13 registros de peso corporal');
    console.log('  🏆 8 PRs de fuerza');
    console.log('  🧠 14 evaluaciones de readiness');
    console.log('  📊 Fatigue tracker + autorregulación');
    console.log('  🔔 5 alertas inteligentes');
    console.log('  🥗 Coach nutrimental (macros: ' + bioData.metricas.macros.calorias + ' kcal, ' + bioData.metricas.macros.proteina + 'g prot)');
    console.log('  📅 Calendario de asistencia (12 días)');
    console.log('  📈 Sobrecarga progresiva (16 ejercicios)');
    console.log('  🎯 RIR comparison (' + rirComparison.length + ' registros)');
    console.log('  🚧 Gate Check state (semana 4)');
    console.log('  🔬 Metodologías RPizadas (9 metodologías, ranking completo)');
    console.log('  ⚡ Progresión técnicas RPizadas (Myo-Reps, LP, Tempo, Clusters)');
    console.log('  📈 Doble Progresión (6 ejercicios rastreados, 3 listos para subir)');
    console.log('');
    console.log('%c Metodologías RPizadas (9 activas, 2 eliminadas):', 'color: #E040FB; font-weight: bold');
    console.log('  #1 RP Style (96) | #2 DUP (91) | #3 Y3T (86) | #4 5/3/1 (85)');
    console.log('  #5 FST-7+LP (86) | #6 Rest-Pause+Clusters (85) | #7 MTUT+LP (85)');
    console.log('  #8 HIT Inteligente+Myo (84) | #9 SST+Myo (84)');
    console.log('  ❌ GVT (73) — Eliminada | ❌ DC Training (67) — Eliminada');
    console.log('');
    console.log('%c Progresión de fuerza (4 semanas):', 'color: #3B82F6; font-weight: bold');
    console.log('  Press Inclinado Hammer: 90kg → 95kg (+5.6%)');
    console.log('  Prensa 45°: 260kg → 280kg (+7.7%)');
    console.log('  Remo Hammer: 80kg → 85kg (+6.3%)');
    console.log('  Peso Muerto Rumano: 110kg → 120kg (+9.1%)');
    console.log('%c ═══════════════════════════════════════════════════════════════', 'color: #EF4444');

})();
