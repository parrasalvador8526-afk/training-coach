(function () {
    'use strict';

    if (localStorage.getItem('rpCoach_sim_loaded') === 'blood_and_guts_auto') {
        return;
    }

    // Verificar si hay datos reales antes de borrar
    const hasRealData = localStorage.getItem('rpCoach_session_history') || localStorage.getItem('rpCoach_active_routine');
    if (hasRealData && !confirm('⚠️ SIMULACIÓN Blood & Guts\n\nEsto borrará todos tus datos actuales de entrenamiento.\n¿Deseas continuar?')) {
        console.log('[Simulación B&G] Cancelada por el usuario.');
        return;
    }

    console.log("Iniciando auto-simulación de Blood & Guts...");

    // Limpiar localStorage de sesiones anteriores (reseteo)
    const keysToClean = Object.keys(localStorage).filter(k =>
        k.startsWith('rpCoach_') || k.startsWith('rpcoach_') || k.startsWith('nexus_')
    );
    keysToClean.forEach(k => localStorage.removeItem(k));

    localStorage.setItem('rpCoach_sim_loaded', 'blood_and_guts_auto');

    // Perfil
    const profile = {
        name: "Atleta Avanzado B&G",
        experience: "advanced",
        goal: "hypertrophy",
        trainingDays: 5,
        split: "bro_split",
        methodology: "BloodAndGuts",
        weight: 95
    };
    localStorage.setItem('rpCoach_profile', JSON.stringify(profile));
    localStorage.setItem('rpCoach_methodology', 'BloodAndGuts');

    // Usa el Generador Real de Rutina para sacar 5 días
    if (!window.RoutineGenerator) {
        console.warn("RoutineGenerator no está disponible. No se puede simular BG dinámico.");
        return;
    }
    const routine = window.RoutineGenerator.createRoutine('BloodAndGuts', 'bro_split', 'advanced');
    if (!routine) return;
    
    routine.methodology = 'BloodAndGuts';
    localStorage.setItem('rpCoach_currentRoutine', JSON.stringify(routine));
    localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

    // Generar Historial
    const history = [];
    let date = new Date();
    date.setDate(date.getDate() - 28);
    
    let exerciseWeights = {};
    routine.days.forEach(day => {
        day.exercises.forEach(ex => {
            exerciseWeights[ex.name] = 60 + Math.floor(Math.random() * 40); 
        });
    });

    for(let w=1; w<=4; w++) {
        let rirTarget = w===4 ? 4 : 0;
        let effTarget = w===4 ? 6 : 10; // RPE max para B&G
        
        routine.days.forEach((day, index) => {
            date.setDate(date.getDate() + 1);
            if(index === 4) date.setDate(date.getDate() + 2); // Salto fin de semana
            
            const sessionEx = day.exercises.map((ex, i) => {
                if(w < 4) exerciseWeights[ex.name] += 2.5; 
                let usedWeight = w === 4 ? exerciseWeights[ex.name] * 0.5 : exerciseWeights[ex.name];

                return {
                    name: ex.name,
                    muscleGroup: ex.muscleGroup || 'Muscle',
                    protocol: 'BG-DY',
                    sets: [{
                        setNumber: 1,
                        weight: usedWeight,
                        reps: 8 + (w===3 ? 2 : 0),
                        rpe: effTarget,
                        rir: rirTarget,
                        volume: usedWeight * 8
                    }],
                    totalSets: 1,
                    totalVolume: usedWeight * 8,
                    weightUsed: usedWeight,
                    targetWeight: usedWeight
                };
            });
            
            let record = {
                id: 'sim_bg_' + Date.now() + Math.random(),
                date: date.toISOString().split('T')[0],
                dayName: day.name,
                methodology: 'BloodAndGuts',
                mesocycleWeek: w,
                exercises: sessionEx,
                stats: { avgRPE: effTarget, totalVolume: sessionEx.reduce((s,x)=>s+x.totalVolume,0) }
            };
            history.push(record);
            
            if(window.DoubleProgressionEngine) {
                window.DoubleProgressionEngine.processSession(record);
            }
        });
    }
    
    localStorage.setItem('rpCoach_session_history', JSON.stringify(history));

    localStorage.setItem('rpCoach_appState', JSON.stringify({
        selectedMethodology: 'BloodAndGuts',
        currentWeek: 4,
        totalWeeks: 4,
        mesocycleStartDate: new Date(Date.now() - 28*86400000).toISOString().split('T')[0],
        mesocycleEndDate: new Date().toISOString().split('T')[0],
        mesocycleComplete: true,
        profileComplete: true,
        phase: 'Deload (Semana 4 completada)',
    }));

    // Métricas para RPizadas y DP
    localStorage.setItem('rpCoach_methodology_updates', JSON.stringify({
        ranking: [
            { rank: 1, name: 'Double Progression', score: 99, category: 'rpized' },
            { rank: 2, name: 'Lengthened Partials', score: 96, category: 'rpized' },
            { rank: 3, name: 'Rest-Pause DC', score: 85, category: 'intensifier' }
        ],
        eliminated: [{ name: 'Volumen Basura', maxScore: 10, reason: 'Fatiga excesiva B&G' }],
        scientificBasis: { Entrenamiento_Dorian: 'Alta intensidad 1 Serie para mayor Hipertrofia' }
    }));
    
    localStorage.setItem('rpCoach_rpized_progress', JSON.stringify({
        weeklyRIRProgression: [
            { week: 1, targetRIR: 1.0, actualRIR: 0.8 },
            { week: 2, targetRIR: 0.0, actualRIR: 0.0 },
            { week: 3, targetRIR: 0.0, actualRIR: 0.0 },
            { week: 4, targetRIR: 4.0, actualRIR: 4.0 }
        ],
        techniques: {
            lengthenedPartials: { usedInSessions: 16, avgExtraReps: 3 }
        }
    }));
    
    // Forzar reload si es la primera vez que se carga
    setTimeout(() => location.reload(), 200);
})();
