const fs = require('fs');

function isoAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function dateAgo(days) {
    return isoAgo(days).split('T')[0];
}

const history = [];
// 5 weeks * 5 days = 25 sessions
const dayNames = ['Pecho y Gemelos', 'Espalda y Abs', 'Piernas (Cuád Dominante)', 'Hombros y Trapecios', 'Brazos Completos'];
const musclesList = [['Pecho', 'Pantorrillas'], ['Espalda', 'Abdomen'], ['Cuádriceps', 'Isquiotibiales'], ['Hombros', 'Trapecios'], ['Bíceps', 'Tríceps']];

let daysOffset = 35; // Start 5 weeks ago
const exercisesSchema = [
    // Day 1
    [{n:'Press Inclinado', m:'Pecho', base:80}, {n:'Cruce de Poleas', m:'Pecho', base:20}, {n:'Elevación de Talones', m:'Pantorrillas', base:60}],
    // Day 2
    [{n:'Jalón al Pecho', m:'Espalda', base:70}, {n:'Remo con Barra', m:'Espalda', base:80}, {n:'Crunch en Polea', m:'Abdomen', base:30}],
    // Day 3
    [{n:'Sentadilla Libre', m:'Cuádriceps', base:100}, {n:'Prensa 45°', m:'Cuádriceps', base:200}, {n:'Peso Muerto Rumano', m:'Isquiotibiales', base:110}],
    // Day 4
    [{n:'Press Militar', m:'Hombros', base:60}, {n:'Elevaciones Laterales', m:'Hombros', base:15}, {n:'Encogimientos', m:'Trapecios', base:90}],
    // Day 5
    [{n:'Curl con Barra', m:'Bíceps', base:40}, {n:'Curl Martillo', m:'Bíceps', base:20}, {n:'Press Francés', m:'Tríceps', base:40}, {n:'Extensión Polea', m:'Tríceps', base:25}]
];

const currentWeights = {};
exercisesSchema.forEach(d => d.forEach(ex => currentWeights[ex.n] = ex.base));
const lastSavedWeights = {};

for(let w=1; w<=5; w++) {
    // FST-7 5 weeks: Accumulation(RIR 3), Progress(RIR 2), Intensification(RIR 1), Peak(RIR 0), Deload(RIR 4)
    let rirTarget = w===1 ? 3 : (w===2 ? 2 : (w===3 ? 1 : (w===4 ? 0 : 4)));
    let rpeTarget = 10 - rirTarget;
    let deload = w===5;
    
    for(let d=0; d<5; d++) {
        daysOffset--;
        const sessionExercises = exercisesSchema[d].map(ex => {
            if(!deload && w > 1 && rpeTarget >= 8) currentWeights[ex.n] += 1.25; // overload
            let wgt = deload ? currentWeights[ex.n] * 0.5 : currentWeights[ex.n];
            wgt = Math.round(wgt * 2) / 2; // round to .5
            lastSavedWeights[ex.n] = wgt;
            
            return {
                name: ex.n,
                muscleGroup: ex.m,
                protocol: 'FST7-ST',
                sets: [
                    {setNumber:1, weight:wgt, reps: 10 + (w===4?2:0), rpe: rpeTarget, rir: rirTarget, volume: wgt*10},
                    {setNumber:2, weight:wgt, reps: 10 + (w===4?2:0), rpe: rpeTarget, rir: rirTarget, volume: wgt*10},
                    {setNumber:3, weight:wgt, reps: 10, rpe: rpeTarget, rir: rirTarget, volume: wgt*10}
                ],
                totalSets: 3,
                totalVolume: wgt * 30,
                weightUsed: wgt, targetWeight: wgt, previousWeight: wgt-1.25
            };
        });
        
        history.push({
            id: 'sim_5w_' + w + '_' + d,
            date: dateAgo(daysOffset),
            dayName: dayNames[d],
            methodology: 'FST7',
            mesocycleWeek: w,
            targetRIR: rirTarget,
            exercises: sessionExercises,
            stats: { avgRPE: rpeTarget, totalVolume: sessionExercises.reduce((s,x)=>s+x.totalVolume,0) }
        });
    }
    daysOffset -= 2; // weekend
}

const simContent = `
(function() {
    console.log("Inyectando Simulación Maestra 5 Semanas");
    localStorage.removeItem('rpCoach_sim_loaded'); // force
    
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
        {date: '${dateAgo(35)}', bodyFat: 12.8, muscleMass: 38.0, shoulder: 125, chest: 105, arm: 38, waist: 82, thigh: 60},
        {date: '${dateAgo(28)}', bodyFat: 12.5, muscleMass: 38.3, shoulder: 125, chest: 106, arm: 38.2, waist: 81.5, thigh: 60.5},
        {date: '${dateAgo(21)}', bodyFat: 12.2, muscleMass: 38.6, shoulder: 126, chest: 106.5, arm: 38.5, waist: 81, thigh: 61},
        {date: '${dateAgo(14)}', bodyFat: 11.9, muscleMass: 39.0, shoulder: 127, chest: 107, arm: 39, waist: 80.5, thigh: 61.5},
        {date: '${dateAgo(7)}',  bodyFat: 11.8, muscleMass: 39.2, shoulder: 127, chest: 107, arm: 39.2, waist: 80.5, thigh: 62}
    ] };
    localStorage.setItem('rpCoach_body_composition', JSON.stringify(bc));
    
    // Weight history
    const wh = [];
    for(let i=35; i>=0; i-=2) wh.push({date: '${dateAgo(0)}'.slice(0,8) + (35-i).toString().padStart(2,'0'),  weight: 90 - (i/35)*2 });
    localStorage.setItem('rpCoach_weight_history', JSON.stringify(wh));
    
    localStorage.setItem('rpCoach_session_history', JSON.stringify(${JSON.stringify(history)}));
    
    const wE = ${JSON.stringify(lastSavedWeights)};
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
        mesocycleStartDate: '${dateAgo(35)}', mesocycleEndDate: '${dateAgo(0)}', mesocycleComplete: true, profileComplete: true
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
`;
fs.writeFileSync('simular-meister.js', simContent);
console.log('simular-meister.js generated!');
