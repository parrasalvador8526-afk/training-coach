(function() {
    if (localStorage.getItem('rpCoach_sim_loaded') === 'sim_5w_master') {
        return;
    }
    const hasRealData = localStorage.getItem('rpCoach_session_history') || localStorage.getItem('rpCoach_active_routine');
    if (hasRealData && !confirm('⚠️ SIMULACIÓN Maestra 5W\n\nEsto borrará todos tus datos actuales de entrenamiento.\n¿Deseas continuar?')) {
        console.log('[Simulación Maestra] Cancelada por el usuario.');
        return;
    }

    console.log("Inyectando Simulación Maestra 5 Semanas");

    const keysToClean = Object.keys(localStorage).filter(k => k.startsWith('rpCoach_') || k.startsWith('rpcoach_') || k.startsWith('nexus_'));
    keysToClean.forEach(k => localStorage.removeItem(k));
    
    const profile = { name: "Atleta FST-7 Pro", experience: "advanced", priority: "Intensidad", goal: "hypertrophy", trainingDays: 5, split: "bro_split", methodology: "FST7", weight: 90 };
    localStorage.setItem('rpCoach_profile', JSON.stringify(profile));
    localStorage.setItem('rpCoach_methodology', 'FST7');
    localStorage.setItem('nexus_current_methodology', JSON.stringify({id: 'FST7', name: 'FST-7', week: 5}));
    localStorage.setItem('rpCoach_mesocycleWeek', '5');
    
    // Bio and Body Comp
    const bioData = { nombre: "Atleta", peso: 90, grasa: 12, masaGrasa: 10.8, ffm: 79.2, metricas: {tmb:2000, tdee:3000, imc: 24, macros: {proteina:180, carbohidratos: 350, grasas: 75}} };
    localStorage.setItem('rpCoach_bioimpedancia', JSON.stringify(bioData));
    
    const bc = { enabled: true, frequency: 'weekly', measurements: [
        {date: '2026-02-28', bodyFat: 12.8, muscleMass: 38.0, shoulder: 125, chest: 105, arm: 38, waist: 82, thigh: 60},
        {date: '2026-03-07', bodyFat: 12.5, muscleMass: 38.3, shoulder: 125, chest: 106, arm: 38.2, waist: 81.5, thigh: 60.5},
        {date: '2026-03-14', bodyFat: 12.2, muscleMass: 38.6, shoulder: 126, chest: 106.5, arm: 38.5, waist: 81, thigh: 61},
        {date: '2026-03-21', bodyFat: 11.9, muscleMass: 39.0, shoulder: 127, chest: 107, arm: 39, waist: 80.5, thigh: 61.5},
        {date: '2026-03-28',  bodyFat: 11.8, muscleMass: 39.2, shoulder: 127, chest: 107, arm: 39.2, waist: 80.5, thigh: 62}
    ] };
    localStorage.setItem('rpCoach_body_composition', JSON.stringify(bc));
    
    // Weight history
    const wh = [];
    for(let i=35; i>=0; i-=2) wh.push({date: '2026-04-04'.slice(0,8) + (35-i).toString().padStart(2,'0'),  weight: 90 - (i/35)*2 });
    localStorage.setItem('rpCoach_weight_history', JSON.stringify(wh));
    
    // --- Generación programática del historial de sesiones (5 semanas x 5 días) ---
    const weekConfigs = [
        { week: 1, rir: 3, rpe: 7,  weightAdd: 0,   reps: 10, deload: false },
        { week: 2, rir: 2, rpe: 8,  weightAdd: 1.5, reps: 10, deload: false },
        { week: 3, rir: 1, rpe: 9,  weightAdd: 2.5, reps: 10, deload: false },
        { week: 4, rir: 0, rpe: 10, weightAdd: 4,   reps: 12, deload: false },
        { week: 5, rir: 4, rpe: 6,  weightAdd: 0,   reps: 10, deload: true }
    ];
    const dayTemplates = [
        {
            name: 'Pecho y Gemelos',
            exercises: [
                { name: 'Press Inclinado', muscle: 'Pecho', baseW: 80 },
                { name: 'Cruce de Poleas', muscle: 'Pecho', baseW: 20 },
                { name: 'Elevación de Talones', muscle: 'Pantorrillas', baseW: 60 }
            ]
        },
        {
            name: 'Espalda y Abs',
            exercises: [
                { name: 'Jalón al Pecho', muscle: 'Espalda', baseW: 70 },
                { name: 'Remo con Barra', muscle: 'Espalda', baseW: 80 },
                { name: 'Crunch en Polea', muscle: 'Abdomen', baseW: 30 }
            ]
        },
        {
            name: 'Piernas (Cuád Dominante)',
            exercises: [
                { name: 'Sentadilla Libre', muscle: 'Cuádriceps', baseW: 100 },
                { name: 'Prensa 45°', muscle: 'Cuádriceps', baseW: 200 },
                { name: 'Peso Muerto Rumano', muscle: 'Isquiotibiales', baseW: 110 }
            ]
        },
        {
            name: 'Hombros y Trapecios',
            exercises: [
                { name: 'Press Militar', muscle: 'Hombros', baseW: 60 },
                { name: 'Elevaciones Laterales', muscle: 'Hombros', baseW: 15 },
                { name: 'Encogimientos', muscle: 'Trapecios', baseW: 90 }
            ]
        },
        {
            name: 'Brazos Completos',
            exercises: [
                { name: 'Curl con Barra', muscle: 'Bíceps', baseW: 40 },
                { name: 'Curl Martillo', muscle: 'Bíceps', baseW: 20 },
                { name: 'Press Francés', muscle: 'Tríceps', baseW: 40 },
                { name: 'Extensión Polea', muscle: 'Tríceps', baseW: 25 }
            ]
        }
    ];
    const startDate = new Date('2026-03-01');
    const sessions = [];
    weekConfigs.forEach((wc, wi) => {
        dayTemplates.forEach((day, di) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + wi * 7 + di);
            const dateStr = d.toISOString().slice(0, 10);
            const exList = day.exercises.map(ex => {
                const w = wc.deload
                    ? Math.round((ex.baseW + 4) / 2 * 2) / 2
                    : ex.baseW + wc.weightAdd;
                const vol = Math.round(w * wc.reps);
                const sets = [1, 2, 3].map(n => ({
                    setNumber: n,
                    weight: w,
                    reps: (wc.week === 4 && n === 3) ? 10 : wc.reps,
                    rpe: wc.rpe,
                    rir: wc.rir,
                    volume: vol
                }));
                return {
                    name: ex.name,
                    muscleGroup: ex.muscle,
                    protocol: 'FST7-ST',
                    sets: sets,
                    totalSets: 3,
                    totalVolume: vol * 3,
                    weightUsed: w,
                    targetWeight: w,
                    previousWeight: w - 1.25
                };
            });
            const totalVol = exList.reduce((s, e) => s + e.totalVolume, 0);
            sessions.push({
                id: 'sim_5w_' + wc.week + '_' + di,
                date: dateStr,
                dayName: day.name,
                methodology: 'FST7',
                mesocycleWeek: wc.week,
                targetRIR: wc.rir,
                exercises: exList,
                stats: { avgRPE: wc.rpe, totalVolume: totalVol }
            });
        });
    });
    localStorage.setItem('rpCoach_session_history', JSON.stringify(sessions));
    
    const wE = {"Press Inclinado":42,"Cruce de Poleas":12,"Elevación de Talones":32,"Jalón al Pecho":37,"Remo con Barra":42,"Crunch en Polea":17,"Sentadilla Libre":52,"Prensa 45°":102,"Peso Muerto Rumano":57,"Press Militar":32,"Elevaciones Laterales":9.5,"Encogimientos":47,"Curl con Barra":22,"Curl Martillo":12,"Press Francés":22,"Extensión Polea":14.5};
    localStorage.setItem('rpCoach_exercise_weights', JSON.stringify(wE));
    Object.keys(wE).forEach(k => localStorage.setItem('rpCoach_lastWeight_' + k, wE[k]));

    const routine = {
        name: 'FST-7 Bro Split 5 Days', methodology: 'FST7', split: 'Bro Split', level: 'Avanzado',
        days: [
            { name: 'Pecho y Gemelos', exercises: [{name:'Press Inclinado'}, {name:'Cruce de Poleas'}, {name:'Elevación de Talones'}] },
            { name: 'Espalda y Abs', exercises: [{name:'Jalón al Pecho'}, {name:'Remo con Barra'}, {name:'Crunch en Polea'}] },
            { name: 'Piernas (Cuád Dominante)', exercises: [{name:'Sentadilla Libre'}, {name:'Prensa 45°'}, {name:'Peso Muerto Rumano'}] },
            { name: 'Hombros y Trapecios', exercises: [{name:'Press Militar'}, {name:'Elevaciones Laterales'}, {name:'Encogimientos'}] },
            { name: 'Brazos Completos', exercises: [{name:'Curl con Barra'}, {name:'Curl Martillo'}, {name:'Press Francés'}, {name:'Extensión Polea'}] }
        ]
    };
    localStorage.setItem('rpCoach_currentRoutine', JSON.stringify(routine));
    localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

    localStorage.setItem('rpCoach_appState', JSON.stringify({
        selectedMethodology: 'FST7', currentWeek: 5, totalWeeks: 5, phase: 'Deload Completado',
        mesocycleStartDate: '2026-02-28', mesocycleEndDate: '2026-04-04', mesocycleComplete: true, profileComplete: true
    }));

    // RPized Data
    localStorage.setItem('rpCoach_methodology_updates', JSON.stringify({
        ranking: [{rank: 1, name: 'Double Progression', score: 98, category: 'rpized'}],
        eliminated: [], scientificBasis: { 'Progresion_FST7': 'Volumen progresivo completado a 5 semanas' }
    }));
    
    localStorage.setItem('rpCoach_rpized_progress', JSON.stringify({
        weeklyRIRProgression: [
            {week:1, targetRIR:3, actualRIR:2.8}, {week:2, targetRIR:2, actualRIR:2},
            {week:3, targetRIR:1, actualRIR:0.8}, {week:4, targetRIR:0, actualRIR:0}, {week:5, targetRIR:4, actualRIR:4}
        ], techniques: { lengthenedPartials: {usedInSessions: 10, avgExtraReps:3} }
    }));
    
    localStorage.setItem('rpCoach_sim_loaded', 'sim_5w_master');
    setTimeout(() => location.reload(), 100);
})();
