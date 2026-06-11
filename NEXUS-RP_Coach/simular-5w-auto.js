(function () {
    'use strict';

    if (localStorage.getItem('rpCoach_sim_loaded') === 'fst7_5weeks_auto') {
        return;
    }

    // Verificar si hay datos reales del usuario antes de borrar
    const hasRealData = localStorage.getItem('rpCoach_session_history') || localStorage.getItem('rpCoach_active_routine');
    if (hasRealData && !confirm('⚠️ SIMULACIÓN FST-7 5W\n\nEsto borrará todos tus datos actuales de entrenamiento.\n¿Deseas continuar?')) {
        console.log('[Simulación FST-7] Cancelada por el usuario.');
        return;
    }

    console.log("Iniciando auto-simulación de 5 Semanas (FST-7)...");

    // Limpiar localStorage de sesiones anteriores (reseteo)
    const keysToClean = Object.keys(localStorage).filter(k =>
        k.startsWith('rpCoach_') || k.startsWith('rpcoach_') || k.startsWith('nexus_')
    );
    keysToClean.forEach(k => localStorage.removeItem(k));

    localStorage.setItem('rpCoach_sim_loaded', 'fst7_5weeks_auto');

    // Perfil
    const profile = {
        name: "Atleta Avanzado 5W",
        experience: "advanced",
        goal: "hypertrophy",
        trainingDays: 5,
        split: "bro_split",
        methodology: "FST7",
        weight: 90
    };
    localStorage.setItem('rpCoach_profile', JSON.stringify(profile));
    localStorage.setItem('rpCoach_methodology', 'FST7');

    // Usa el Generador Real de Rutina para sacar 5 días
    if (!window.RoutineGenerator) {
        console.warn("RoutineGenerator no está disponible.");
        return;
    }
    const routine = window.RoutineGenerator.createRoutine('FST7', 'bro_split', 'advanced');
    if (!routine) return;
    
    routine.methodology = 'FST7';
    localStorage.setItem('rpCoach_currentRoutine', JSON.stringify(routine));
    localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

    // Generar Historial
    const history = [];
    let date = new Date();
    date.setDate(date.getDate() - 35); // 5 semanas atrás
    
    let exerciseWeights = {};
    routine.days.forEach(day => {
        day.exercises.forEach(ex => {
            exerciseWeights[ex.name] = 50 + Math.floor(Math.random() * 30); 
        });
    });

    // 5 Semanas: S1(Acumulación RIR 3), S2(Progreso RIR 2), S3(Intensific. RIR 1), S4(Peak RIR 0), S5(Deload RIR 4)
    const weekConfig = [
        {}, // padding
        { rir: 3, rpe: 7, extraReps: 0 },
        { rir: 2, rpe: 8, extraReps: 1 },
        { rir: 1, rpe: 9, extraReps: 2 },
        { rir: 0, rpe: 10, extraReps: 3 },
        { rir: 4, rpe: 6, extraReps: -2, deload: true }
    ];

    for(let w=1; w<=5; w++) {
        let conf = weekConfig[w];
        
        routine.days.forEach((day, index) => {
            date.setDate(date.getDate() + 1);
            if(index === 4) date.setDate(date.getDate() + 2); // Salto fin de semana
            
            const sessionEx = day.exercises.map((ex) => {
                if(w > 1 && !conf.deload && conf.rir < 3) {
                    exerciseWeights[ex.name] += 1.25; // Pequeña DP
                }
                
                let usedWeight = conf.deload ? exerciseWeights[ex.name] * 0.5 : exerciseWeights[ex.name];
                let baseReps = 10;
                let volumeSets = conf.deload ? 1 : 3;

                let setsArr = [];
                for(let s=1; s<=volumeSets; s++) {
                    setsArr.push({
                        setNumber: s,
                        weight: usedWeight,
                        reps: baseReps + conf.extraReps,
                        rpe: conf.rpe,
                        rir: conf.rir,
                        volume: usedWeight * (baseReps + conf.extraReps)
                    });
                }

                return {
                    name: ex.name,
                    muscleGroup: ex.muscleGroup || 'Muscle',
                    protocol: ex.protocol || 'FST7',
                    sets: setsArr,
                    totalSets: volumeSets,
                    totalVolume: setsArr.reduce((sum, s) => sum + s.volume, 0),
                    weightUsed: usedWeight,
                    targetWeight: usedWeight
                };
            });
            
            let record = {
                id: 'sim_5w_' + Date.now() + Math.random(),
                date: date.toISOString().split('T')[0],
                dayName: day.name,
                methodology: 'FST7',
                mesocycleWeek: w,
                exercises: sessionEx,
                stats: { avgRPE: conf.rpe, totalVolume: sessionEx.reduce((s,x)=>s+x.totalVolume,0) }
            };
            history.push(record);
            
            if(window.DoubleProgressionEngine) {
                window.DoubleProgressionEngine.processSession(record);
            }
        });
    }
    
    localStorage.setItem('rpCoach_session_history', JSON.stringify(history));

    localStorage.setItem('rpCoach_appState', JSON.stringify({
        selectedMethodology: 'FST7',
        currentWeek: 5,
        totalWeeks: 5,
        mesocycleStartDate: new Date(Date.now() - 35*86400000).toISOString().split('T')[0],
        mesocycleEndDate: new Date().toISOString().split('T')[0],
        mesocycleComplete: true,
        profileComplete: true,
        phase: 'Deload (Semana 5 completada)',
    }));

    // Métricas para RPizadas y DP (Aparición de FST-7)
    localStorage.setItem('rpCoach_methodology_updates', JSON.stringify({
        ranking: [
            { rank: 1, name: 'Double Progression', score: 98, category: 'rpized' },
            { rank: 2, name: 'FST-7 Fascia Stretch', score: 94, category: 'intensifier' },
            { rank: 3, name: 'Cluster Sets', score: 85, category: 'rpized' }
        ],
        eliminated: [{ name: 'Myo-Reps Base', maxScore: 40, reason: 'Incompatibilidad GVT/FST' }],
        scientificBasis: { Hipertrofia_FST7: 'Metabolitos masivos en fascia muscular por 7 series de Pump en Peak Phase' }
    }));
    
    localStorage.setItem('rpCoach_rpized_progress', JSON.stringify({
        weeklyRIRProgression: [
            { week: 1, targetRIR: 3.0, actualRIR: 2.8 },
            { week: 2, targetRIR: 2.0, actualRIR: 2.0 },
            { week: 3, targetRIR: 1.0, actualRIR: 0.8 },
            { week: 4, targetRIR: 0.0, actualRIR: 0.0 }, // Peak week perfection
            { week: 5, targetRIR: 4.0, actualRIR: 4.0 }
        ],
        techniques: {
            clusterSets: { usedInSessions: 10, avgTotalReps: 15 }
        }
    }));
    
    // Forzar reload si es la primera vez
    setTimeout(() => location.reload(), 200);
})();
