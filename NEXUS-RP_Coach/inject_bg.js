function simulateBloodAndGutsHistory() {
    console.log("Simulating 4 weeks of Blood & Guts (5 days/week)...");
    const routineStr = localStorage.getItem('rpCoach_currentRoutine');
    if (!routineStr) {
        console.error("No routine found. Generate one first.");
        return;
    }
    const routine = JSON.parse(routineStr);
    
    const history = [];
    let date = new Date();
    date.setDate(date.getDate() - 28); 
    
    let exerciseWeights = {};
    routine.days.forEach(day => {
        day.exercises.forEach(ex => {
            exerciseWeights[ex.name] = 50 + Math.floor(Math.random() * 50); 
        });
    });

    for(let w=1; w<=4; w++) {
        let rirTarget = w===4 ? 4 : (w===1 ? 1 : 0);
        let effTarget = w===4 ? 6 : (w===1 ? 9 : 10);
        
        routine.days.forEach((day, index) => {
            date.setDate(date.getDate() + 1);
            if(index === 5) date.setDate(date.getDate() + 1); // skip weekend
            
            const sessionEx = day.exercises.map(ex => {
                if(w < 4 && rirTarget === 0) {
                    exerciseWeights[ex.name] += 2.5; // Double progression implicit
                }
                let usedWeight = w === 4 ? exerciseWeights[ex.name]*0.5 : exerciseWeights[ex.name];
                let targetReps = parseInt(ex.targetReps) || 8;
                let performedReps = targetReps + (w === 3 ? 2 : 0); // Max effort on week 3

                return {
                    name: ex.name,
                    muscleGroup: ex.muscleGroup || 'General',
                    protocol: ex.protocol || 'BG-DY',
                    sets: [{
                        setNumber: 1,
                        weight: usedWeight,
                        reps: performedReps,
                        rpe: effTarget,
                        rir: rirTarget,
                        volume: usedWeight * performedReps
                    }],
                    totalSets: 1,
                    totalVolume: usedWeight * performedReps,
                    weightUsed: usedWeight,
                    targetWeight: usedWeight
                };
            });
            
            let sessionRecord = {
                id: 'sim_bg_' + Date.now() + Math.random(),
                date: date.toISOString().split('T')[0],
                dayName: day.name,
                methodology: 'BloodAndGuts',
                mesocycleWeek: w,
                exercises: sessionEx,
                stats: { avgRPE: effTarget, totalVolume: sessionEx.reduce((a,b)=>a+b.totalVolume, 0) }
            };
            history.push(sessionRecord);
            
            if(window.DoubleProgressionEngine) {
                window.DoubleProgressionEngine.processSession(sessionRecord);
            }
        });
    }
    
    localStorage.setItem('rpCoach_session_history', JSON.stringify(history));

    // Also populate bio and weight naturally
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

    // Mock RPized updates for Analytics panel
    localStorage.setItem('rpCoach_methodology_updates', JSON.stringify({
        ranking: [
            { rank: 1, name: 'Double Progression', score: 98, category: 'rpized' },
            { rank: 2, name: 'Lengthened Partials', score: 95, category: 'rpized' },
            { rank: 3, name: 'Blood & Guts Base', score: 88, category: 'base' }
        ],
        eliminated: [{ name: 'BOSU Squats', maxScore: 20, reason: 'High fatigue, low stability' }],
        scientificBasis: { Double_Progression: 'Consistent load jumps', Lengthened_Partials: '+15% Hypertrophy' }
    }));
    
    // Mock RPized techniques progress
    localStorage.setItem('rpCoach_rpized_progress', JSON.stringify({
        techniques: {
            lengthenedPartials: { usedInSessions: 12, avgExtraReps: 4 },
            eccentricTempo: { currentTempo: '4s', startTempo: '2s' }
        },
        weeklyRIRProgression: [
            { week: 1, targetRIR: 1.0, actualRIR: 1.2 },
            { week: 2, targetRIR: 0.0, actualRIR: 0.5 },
            { week: 3, targetRIR: 0.0, actualRIR: 0.0 },
            { week: 4, targetRIR: 4.0, actualRIR: 4.0 }
        ]
    }));

    console.log("DONE. Reload the page for Progress Panel.");
}
