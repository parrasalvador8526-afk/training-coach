/**
 * NEXUS-RP Coach - Training Templates Module
 * Plantillas de Entrenamiento Pre-diseñadas
 * 
 * Basado en las 11 metodologías + estructuras de división comunes
 * Similar a los 45+ templates de RP Hypertrophy App
 */

const TrainingTemplatesModule = (() => {

    // Splits de entrenamiento disponibles
    const TRAINING_SPLITS = {
        'push_pull_legs': {
            id: 'ppl',
            name: 'Push/Pull/Legs',
            daysPerWeek: 6,
            description: 'Dividido por patrón de movimiento',
            structure: [
                { day: 1, name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
                { day: 2, name: 'Pull', muscles: ['back', 'biceps', 'forearms'] },
                { day: 3, name: 'Legs', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
                { day: 4, name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
                { day: 5, name: 'Pull', muscles: ['back', 'biceps', 'forearms'] },
                { day: 6, name: 'Legs', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] }
            ],
            suitableFor: ['Y3T', 'FST7', 'MTUT', 'SST', 'GVT']
        },
        'upper_lower': {
            id: 'ul',
            name: 'Upper/Lower',
            daysPerWeek: 4,
            description: 'Tren superior e inferior alternado',
            structure: [
                { day: 1, name: 'Upper', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
                { day: 2, name: 'Lower', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
                { day: 3, name: 'Upper', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
                { day: 4, name: 'Lower', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] }
            ],
            suitableFor: ['Y3T', 'RestPause', 'DUP', '531']
        },
        'bro_split': {
            id: 'bro',
            name: 'Bro Split (5 días)',
            daysPerWeek: 5,
            description: 'Un grupo muscular por día',
            structure: [
                { day: 1, name: 'Chest', muscles: ['chest'] },
                { day: 2, name: 'Back', muscles: ['back'] },
                { day: 3, name: 'Shoulders', muscles: ['shoulders', 'traps'] },
                { day: 4, name: 'Legs', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
                { day: 5, name: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] }
            ],
            suitableFor: ['HeavyDuty', 'BloodAndGuts', 'FST7', 'SST']
        },
        'hit_3day': {
            id: 'hit3',
            name: 'HIT 3 Días',
            daysPerWeek: 3,
            description: 'Alta intensidad, bajo volumen',
            structure: [
                { day: 1, name: 'Push/Quads', muscles: ['chest', 'shoulders', 'triceps', 'quadriceps'] },
                { day: 2, name: 'Pull/Hams', muscles: ['back', 'biceps', 'hamstrings', 'glutes'] },
                { day: 3, name: 'Full Body', muscles: ['chest', 'back', 'shoulders', 'quadriceps', 'calves'] }
            ],
            suitableFor: ['HeavyDuty', 'BloodAndGuts', 'RestPause', 'DCTraining']
        },
        'full_body': {
            id: 'fb',
            name: 'Full Body',
            daysPerWeek: 3,
            description: 'Cuerpo completo cada sesión',
            structure: [
                { day: 1, name: 'Full Body A', muscles: ['chest', 'back', 'quadriceps', 'shoulders', 'biceps'] },
                { day: 2, name: 'Full Body B', muscles: ['chest', 'back', 'hamstrings', 'shoulders', 'triceps'] },
                { day: 3, name: 'Full Body C', muscles: ['chest', 'back', 'quadriceps', 'shoulders', 'calves'] }
            ],
            suitableFor: ['Y3T', '531', 'DUP', 'GVT']
        }
    };

    // Templates completos por metodología
    const METHODOLOGY_TEMPLATES = {
        'HeavyDuty': {
            name: 'Heavy Duty - Mike Mentzer',
            description: 'Intensidad máxima, volumen mínimo. 1 serie al fallo.',
            level: ['Intermedio', 'Avanzado'],
            recommendedSplit: 'hit_3day',
            mesocycleLength: 4,
            deloadFrequency: 4,
            volumePerSession: 'ultra_low',
            setsPerMuscle: { min: 1, max: 2 },
            exercisesPerMuscle: { min: 1, max: 2 },
            sampleDay: {
                name: 'Pecho + Espalda',
                exercises: [
                    { name: 'Press Inclinado Máquina', sets: 1, reps: '6-10', technique: 'fallo_absoluto', notes: '+ 2-3 forced reps' },
                    { name: 'Cruces en Polea', sets: 1, reps: '8-12', technique: 'pre_exhaustion' },
                    { name: 'Remo Hammer', sets: 1, reps: '6-10', technique: 'fallo_absoluto', notes: '+ negativas' },
                    { name: 'Pullover', sets: 1, reps: '8-12', technique: 'normal' }
                ]
            },
            weeklyProgression: [
                { week: 1, rir: 1, volumeMultiplier: 1.0 },
                { week: 2, rir: 0, volumeMultiplier: 1.0 },
                { week: 3, rir: 0, volumeMultiplier: 1.0, notes: 'Añadir técnicas intensificadoras' },
                { week: 4, rir: 3, volumeMultiplier: 0.5, isDeload: true }
            ]
        },
        'BloodAndGuts': {
            name: 'Blood & Guts - Dorian Yates',
            description: 'Estilo HIT de Dorian. 2 warm-ups + 1 working set.',
            level: ['Intermedio', 'Avanzado'],
            recommendedSplit: 'bro_split',
            mesocycleLength: 6,
            deloadFrequency: 6,
            volumePerSession: 'low',
            setsPerMuscle: { min: 2, max: 4 },
            exercisesPerMuscle: { min: 2, max: 3 },
            sampleDay: {
                name: 'Back Day',
                exercises: [
                    { name: 'Remo Hammer', sets: 1, reps: '8-10', technique: 'fallo', notes: 'WU: 30%x15, 50%x10' },
                    { name: 'Jalón Agarre Neutro', sets: 1, reps: '8-10', technique: 'fallo' },
                    { name: 'Peso Muerto Parcial', sets: 1, reps: '6-8', technique: 'fallo' },
                    { name: 'Remo Cable', sets: 1, reps: '10-12', technique: 'drop_set' }
                ]
            },
            weeklyProgression: [
                { week: 1, rir: 1, volumeMultiplier: 1.0 },
                { week: 2, rir: 0, volumeMultiplier: 1.0 },
                { week: 3, rir: 0, volumeMultiplier: 1.0 },
                { week: 4, rir: 0, volumeMultiplier: 1.0, notes: 'Drop sets en último ejercicio' },
                { week: 5, rir: 0, volumeMultiplier: 1.0, notes: 'Forced reps' },
                { week: 6, rir: 3, volumeMultiplier: 0.6, isDeload: true }
            ]
        },
        'Y3T': {
            name: 'Y3T - Yoda 3 Training (Neil Hill)',
            description: 'Ondulación semanal: Heavy → Moderate → High Volume',
            level: ['Principiante', 'Intermedio', 'Avanzado'],
            recommendedSplit: 'push_pull_legs',
            mesocycleLength: 9,
            deloadFrequency: 9,
            volumePerSession: 'variable',
            setsPerMuscle: { min: 9, max: 16 },
            exercisesPerMuscle: { min: 3, max: 5 },
            sampleDay: {
                name: 'Push (Semana 1 - Heavy)',
                exercises: [
                    { name: 'Press Banca', sets: 4, reps: '6-8', technique: 'normal', notes: 'Pesado' },
                    { name: 'Press Inclinado', sets: 3, reps: '8-10', technique: 'normal' },
                    { name: 'Press Militar', sets: 3, reps: '6-8', technique: 'normal' },
                    { name: 'Elevaciones Laterales', sets: 3, reps: '8-10', technique: 'normal' },
                    { name: 'Fondos', sets: 3, reps: '8-10', technique: 'normal' }
                ]
            },
            weeklyProgression: [
                { week: 1, phase: 'W1_Heavy', reps: '6-10', rest: '120-180s', rir: 2 },
                { week: 2, phase: 'W2_Moderate', reps: '10-14', rest: '60-90s', rir: 2 },
                { week: 3, phase: 'W3_Annihilation', reps: '15-30+', rest: '30-60s', rir: 0 },
                { week: 4, phase: 'W1_Heavy', reps: '6-10', rest: '120-180s', rir: 2 },
                { week: 5, phase: 'W2_Moderate', reps: '10-14', rest: '60-90s', rir: 2 },
                { week: 6, phase: 'W3_Annihilation', reps: '15-30+', rest: '30-60s', rir: 0 },
                { week: 7, phase: 'W1_Heavy', reps: '6-10', rest: '120-180s', rir: 1 },
                { week: 8, phase: 'W2_Moderate', reps: '10-14', rest: '60-90s', rir: 1 },
                { week: 9, phase: 'Deload', reps: '12-15', rest: '90s', rir: 4, isDeload: true }
            ]
        },
        'FST7': {
            name: 'FST-7 - Hany Rambod',
            description: '7 series finales con 30-45s descanso para pump extremo',
            level: ['Principiante', 'Intermedio', 'Avanzado'],
            recommendedSplit: 'bro_split',
            mesocycleLength: 6,
            deloadFrequency: 6,
            volumePerSession: 'high',
            setsPerMuscle: { min: 12, max: 20 },
            exercisesPerMuscle: { min: 3, max: 4 },
            sampleDay: {
                name: 'Chest FST-7',
                exercises: [
                    { name: 'Press Inclinado', sets: 4, reps: '8-12', technique: 'normal' },
                    { name: 'Press Plano Mancuernas', sets: 4, reps: '10-12', technique: 'normal' },
                    { name: 'Aperturas Inclinado', sets: 3, reps: '12-15', technique: 'normal' },
                    { name: 'Cruces Cable (FST-7)', sets: 7, reps: '8-12', technique: 'fst7', notes: '30-45s descanso' }
                ]
            },
            weeklyProgression: [
                { week: 1, fst7Sets: 5, volumeMultiplier: 0.8 },
                { week: 2, fst7Sets: 6, volumeMultiplier: 0.9 },
                { week: 3, fst7Sets: 7, volumeMultiplier: 1.0 },
                { week: 4, fst7Sets: 7, volumeMultiplier: 1.0, notes: 'Añadir drop set final' },
                { week: 5, fst7Sets: 7, volumeMultiplier: 1.0 },
                { week: 6, fst7Sets: 4, volumeMultiplier: 0.6, isDeload: true }
            ]
        },
        'SST': {
            name: 'SST - Sarcoplasm Stimulating',
            description: 'Múltiples fallos por set. Estrés metabólico extremo.',
            level: ['Intermedio', 'Avanzado'],
            recommendedSplit: 'bro_split',
            mesocycleLength: 4,
            deloadFrequency: 4,
            volumePerSession: 'moderate',
            setsPerMuscle: { min: 6, max: 10 },
            exercisesPerMuscle: { min: 2, max: 3 },
            sampleDay: {
                name: 'Chest SST',
                exercises: [
                    { name: 'Press Inclinado', sets: 3, reps: '8-12', technique: 'normal' },
                    { name: 'Pec Deck (SST)', sets: 1, reps: 'Protocolo', technique: 'sst_riv', notes: '6-9 mini-fallos' },
                    { name: 'Cruces Cable (SST)', sets: 1, reps: 'Protocolo', technique: 'sst_rt', notes: '10-15s micro rest' }
                ]
            },
            weeklyProgression: [
                { week: 1, failures: 5, volumeMultiplier: 0.8 },
                { week: 2, failures: 6, volumeMultiplier: 0.9 },
                { week: 3, failures: 7, volumeMultiplier: 1.0 },
                { week: 4, failures: 0, volumeMultiplier: 0.5, isDeload: true, notes: 'Sin SST' }
            ]
        },
        'MTUT': {
            name: 'MTUT - Tiempo Bajo Tensión',
            description: 'Tempos ultra lentos (4s+ por fase)',
            level: ['Principiante', 'Intermedio', 'Avanzado'],
            recommendedSplit: 'upper_lower',
            mesocycleLength: 6,
            deloadFrequency: 6,
            volumePerSession: 'moderate',
            setsPerMuscle: { min: 6, max: 10 },
            exercisesPerMuscle: { min: 2, max: 3 },
            tempoOptions: ['4-1-2', '2-1-4', '3-2-3'],
            sampleDay: {
                name: 'Upper MTUT',
                exercises: [
                    { name: 'Press Inclinado Máquina', sets: 3, reps: '6-8', technique: 'mtut', tempo: '4-1-2' },
                    { name: 'Remo Cable', sets: 3, reps: '6-8', technique: 'mtut', tempo: '2-1-4' },
                    { name: 'Press Hombros Máquina', sets: 3, reps: '6-8', technique: 'mtut', tempo: '3-2-3' },
                    { name: 'Curl Cable', sets: 2, reps: '8-10', technique: 'mtut', tempo: '3-1-3' },
                    { name: 'Extensión Cable', sets: 2, reps: '8-10', technique: 'mtut', tempo: '3-1-3' }
                ]
            }
        },
        'RestPause': {
            name: 'Rest-Pause - Raúl Carrasco',
            description: 'Series extendidas con micro descansos (10-20s)',
            level: ['Intermedio', 'Avanzado'],
            recommendedSplit: 'upper_lower',
            mesocycleLength: 4,
            deloadFrequency: 3,
            volumePerSession: 'moderate',
            setsPerMuscle: { min: 4, max: 8 },
            exercisesPerMuscle: { min: 2, max: 3 },
            sampleDay: {
                name: 'Upper Rest-Pause',
                exercises: [
                    { name: 'Press Inclinado', sets: 3, reps: '8-12', technique: 'normal' },
                    { name: 'Pec Deck', sets: 1, reps: '10+4+2', technique: 'rest_pause', notes: '15s micro rest' },
                    { name: 'Remo Hammer', sets: 3, reps: '8-10', technique: 'normal' },
                    { name: 'Pulldown', sets: 1, reps: '12+5+3', technique: 'rest_pause', notes: '15s micro rest' }
                ]
            }
        },
        'GVT': {
            name: 'GVT - German Volume Training',
            description: '10 series x 10 reps. Alto volumen.',
            level: ['Intermedio', 'Avanzado'],
            recommendedSplit: 'full_body',
            mesocycleLength: 6,
            deloadFrequency: 6,
            volumePerSession: 'very_high',
            setsPerMuscle: { min: 10, max: 10 },
            exercisesPerMuscle: { min: 1, max: 2 },
            sampleDay: {
                name: 'Chest/Back GVT',
                exercises: [
                    { name: 'Press Banca', sets: 10, reps: '10', technique: 'gvt', tempo: '4-0-2', notes: '60s descanso' },
                    { name: 'Remo Barra', sets: 10, reps: '10', technique: 'gvt', tempo: '4-0-2', notes: '60s descanso' },
                    { name: 'Aperturas', sets: 3, reps: '10-12', technique: 'normal' },
                    { name: 'Pullover', sets: 3, reps: '10-12', technique: 'normal' }
                ]
            }
        }
    };

    /**
     * Obtiene todos los splits disponibles
     */
    function getAllSplits() {
        return Object.values(TRAINING_SPLITS);
    }

    /**
     * Obtiene splits compatibles con una metodología
     */
    function getSplitsForMethodology(methodology) {
        return Object.values(TRAINING_SPLITS).filter(
            split => split.suitableFor.includes(methodology)
        );
    }

    /**
     * Obtiene todos los templates de metodologías
     */
    function getAllMethodologyTemplates() {
        return Object.entries(METHODOLOGY_TEMPLATES).map(([key, template]) => ({
            id: key,
            ...template
        }));
    }

    /**
     * Obtiene un template específico
     */
    function getTemplate(methodologyId) {
        return METHODOLOGY_TEMPLATES[methodologyId] || null;
    }

    /**
     * Genera un plan de mesociclo completo
     */
    function generateMesocyclePlan(methodologyId, splitId, startDate = new Date()) {
        const template = METHODOLOGY_TEMPLATES[methodologyId];
        const split = TRAINING_SPLITS[splitId];

        if (!template || !split) {
            return null;
        }

        const weeks = [];
        const progression = template.weeklyProgression || [];

        for (let i = 0; i < template.mesocycleLength; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (i * 7));

            const weekConfig = progression[i] || progression[progression.length - 1];

            weeks.push({
                weekNumber: i + 1,
                startDate: weekStart.toISOString().split('T')[0],
                phase: weekConfig.phase || `Semana ${i + 1}`,
                rir: weekConfig.rir,
                isDeload: weekConfig.isDeload || false,
                volumeMultiplier: weekConfig.volumeMultiplier || 1.0,
                notes: weekConfig.notes || '',
                days: split.structure.map(day => ({
                    ...day,
                    completed: false
                }))
            });
        }

        return {
            id: `meso_${Date.now()}`,
            methodology: methodologyId,
            methodologyName: template.name,
            split: splitId,
            splitName: split.name,
            totalWeeks: template.mesocycleLength,
            weeks,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
    }

    /**
     * Obtiene el día de entrenamiento actual del plan
     */
    function getCurrentDayFromPlan(plan) {
        if (!plan || !plan.weeks) return null;

        const today = new Date().toISOString().split('T')[0];

        for (const week of plan.weeks) {
            const weekStart = new Date(week.startDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            if (new Date(today) >= weekStart && new Date(today) < weekEnd) {
                const dayOfWeek = new Date().getDay();
                // Ajustar para que coincida con la estructura del split
                return {
                    week: week.weekNumber,
                    day: week.days[dayOfWeek % week.days.length],
                    isDeload: week.isDeload,
                    rir: week.rir
                };
            }
        }

        return null;
    }

    /**
     * Obtiene ejercicios recomendados para un grupo muscular y metodología
     */
    function getRecommendedExercises(muscleGroup, methodologyId) {
        const exercisesByMuscle = {
            chest: {
                compound: ['Press Banca', 'Press Inclinado', 'Press Declinado', 'Fondos'],
                isolation: ['Aperturas', 'Cruces Cable', 'Pec Deck', 'Pullover']
            },
            back: {
                compound: ['Peso Muerto', 'Remo Barra', 'Dominadas', 'Remo T'],
                isolation: ['Pulldown', 'Remo Cable', 'Face Pull', 'Pullover']
            },
            shoulders: {
                compound: ['Press Militar', 'Press Arnold'],
                isolation: ['Elevaciones Laterales', 'Elevaciones Frontales', 'Pájaro', 'Face Pull']
            },
            quadriceps: {
                compound: ['Sentadilla', 'Prensa', 'Hack Squat', 'Sentadilla Frontal'],
                isolation: ['Extensión de Cuádriceps', 'Zancadas']
            },
            hamstrings: {
                compound: ['Peso Muerto Rumano', 'Buenos Días'],
                isolation: ['Curl Femoral', 'Curl Femoral Sentado']
            },
            glutes: {
                compound: ['Hip Thrust', 'Peso Muerto Sumo'],
                isolation: ['Patada de Glúteo', 'Abducción']
            },
            biceps: {
                compound: [],
                isolation: ['Curl Barra', 'Curl Alterno', 'Curl Martillo', 'Curl Predicador', 'Curl Cable']
            },
            triceps: {
                compound: ['Press Cerrado'],
                isolation: ['Extensión Cable', 'Press Francés', 'Fondos', 'Patada Tríceps']
            },
            calves: {
                compound: [],
                isolation: ['Elevación Talones de Pie', 'Elevación Talones Sentado']
            }
        };

        const methodologyPreference = {
            'HeavyDuty': 'compound',
            'BloodAndGuts': 'compound',
            'Y3T': 'mixed',
            'FST7': 'isolation', // Para FST-7 sets
            'SST': 'isolation',
            'MTUT': 'isolation',
            'RestPause': 'compound'
        };

        const exercises = exercisesByMuscle[muscleGroup] || { compound: [], isolation: [] };
        const preference = methodologyPreference[methodologyId] || 'mixed';

        if (preference === 'compound') {
            return [...exercises.compound, ...exercises.isolation.slice(0, 1)];
        } else if (preference === 'isolation') {
            return [...exercises.compound.slice(0, 1), ...exercises.isolation];
        }

        return [...exercises.compound, ...exercises.isolation];
    }

    // API Pública
    return {
        getAllSplits,
        getSplitsForMethodology,
        getAllMethodologyTemplates,
        getTemplate,
        generateMesocyclePlan,
        getCurrentDayFromPlan,
        getRecommendedExercises,
        TRAINING_SPLITS,
        METHODOLOGY_TEMPLATES
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TrainingTemplatesModule = TrainingTemplatesModule;
}
