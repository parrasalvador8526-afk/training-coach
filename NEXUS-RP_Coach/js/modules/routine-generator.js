/**
 * NEXUS-RP Coach - Generador de Rutinas v2
 * Genera rutinas completas usando los datos reales de metodologías
 * con intensificadores, variantes de repetición y parámetros detallados
 */

const RoutineGenerator = (() => {
    // Base de datos de ejercicios por grupo muscular
    const EXERCISE_DATABASE = {
        'Pecho': [
            { id: 'press_banca', name: 'Press Banca', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'press_inclinado', name: 'Press Inclinado', type: 'compound', equipment: 'dumbbell', priority: 2 },
            { id: 'cruces_cable', name: 'Cruces Cable', type: 'isolation', equipment: 'cable', priority: 3 },
            { id: 'aperturas', name: 'Aperturas', type: 'isolation', equipment: 'dumbbell', priority: 4 },
            { id: 'press_declinado', name: 'Press Declinado', type: 'compound', equipment: 'barbell', priority: 3 },
            { id: 'pullover', name: 'Pullover', type: 'isolation', equipment: 'dumbbell', priority: 5 }
        ],
        'Espalda': [
            { id: 'jalon_dorsal', name: 'Jalón Dorsal', type: 'compound', equipment: 'cable', priority: 1 },
            { id: 'remo_barra', name: 'Remo con Barra', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'remo_mancuerna', name: 'Remo Mancuerna', type: 'compound', equipment: 'dumbbell', priority: 2 },
            { id: 'peso_muerto', name: 'Peso Muerto', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'face_pulls', name: 'Face Pulls', type: 'isolation', equipment: 'cable', priority: 4 },
            { id: 'pullover_espalda', name: 'Pullover Espalda', type: 'isolation', equipment: 'cable', priority: 5 }
        ],
        'Hombros': [
            { id: 'press_militar', name: 'Press Militar', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'elevaciones_laterales', name: 'Elevaciones Laterales', type: 'isolation', equipment: 'dumbbell', priority: 2 },
            { id: 'elevaciones_frontales', name: 'Elevaciones Frontales', type: 'isolation', equipment: 'dumbbell', priority: 3 },
            { id: 'pajaros', name: 'Pájaros', type: 'isolation', equipment: 'dumbbell', priority: 2 },
            { id: 'press_arnold', name: 'Press Arnold', type: 'compound', equipment: 'dumbbell', priority: 2 },
            { id: 'face_pulls', name: 'Face Pulls', type: 'isolation', equipment: 'cable', priority: 3 }
        ],
        'Cuádriceps': [
            { id: 'sentadilla', name: 'Sentadilla', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'prensa', name: 'Prensa', type: 'compound', equipment: 'machine', priority: 2 },
            { id: 'extensiones', name: 'Extensiones', type: 'isolation', equipment: 'machine', priority: 3 },
            { id: 'sentadilla_hack', name: 'Hack Squat', type: 'compound', equipment: 'machine', priority: 2 },
            { id: 'zancadas', name: 'Zancadas', type: 'compound', equipment: 'dumbbell', priority: 3 },
            { id: 'sissy_squat', name: 'Sissy Squat', type: 'isolation', equipment: 'bodyweight', priority: 4 }
        ],
        'Isquiotibiales': [
            { id: 'curl_femoral', name: 'Curl Femoral', type: 'isolation', equipment: 'machine', priority: 1 },
            { id: 'peso_muerto_rumano', name: 'Peso Muerto Rumano', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'good_morning', name: 'Good Morning', type: 'compound', equipment: 'barbell', priority: 3 },
            { id: 'curl_nordico', name: 'Curl Nórdico', type: 'isolation', equipment: 'bodyweight', priority: 2 }
        ],
        'Glúteos': [
            { id: 'hip_thrust', name: 'Hip Thrust', type: 'compound', equipment: 'barbell', priority: 1 },
            { id: 'sentadilla_sumo', name: 'Sentadilla Sumo', type: 'compound', equipment: 'dumbbell', priority: 2 },
            { id: 'patada_gluteo', name: 'Patada Glúteo', type: 'isolation', equipment: 'cable', priority: 3 },
            { id: 'puente_gluteo', name: 'Puente Glúteo', type: 'isolation', equipment: 'barbell', priority: 2 }
        ],
        'Bíceps': [
            { id: 'curl_barra', name: 'Curl Barra', type: 'isolation', equipment: 'barbell', priority: 1 },
            { id: 'curl_martillo', name: 'Curl Martillo', type: 'isolation', equipment: 'dumbbell', priority: 2 },
            { id: 'curl_concentrado', name: 'Curl Concentrado', type: 'isolation', equipment: 'dumbbell', priority: 3 },
            { id: 'curl_predicador', name: 'Curl Predicador', type: 'isolation', equipment: 'barbell', priority: 2 },
            { id: 'curl_cable', name: 'Curl Cable', type: 'isolation', equipment: 'cable', priority: 4 }
        ],
        'Tríceps': [
            { id: 'press_frances', name: 'Press Francés', type: 'isolation', equipment: 'barbell', priority: 1 },
            { id: 'extensiones_cable', name: 'Extensiones Cable', type: 'isolation', equipment: 'cable', priority: 2 },
            { id: 'fondos', name: 'Fondos', type: 'compound', equipment: 'bodyweight', priority: 1 },
            { id: 'triceps_patada', name: 'Patada Tríceps', type: 'isolation', equipment: 'dumbbell', priority: 3 },
            { id: 'pushdown', name: 'Pushdown', type: 'isolation', equipment: 'cable', priority: 2 }
        ],
        'Pantorrillas': [
            { id: 'elevacion_talones_pie', name: 'Elevación Talones de Pie', type: 'isolation', equipment: 'machine', priority: 1 },
            { id: 'elevacion_talones_sent', name: 'Elevación Talones Sentado', type: 'isolation', equipment: 'machine', priority: 2 },
            { id: 'elevacion_prensa', name: 'Elevación en Prensa', type: 'isolation', equipment: 'machine', priority: 3 }
        ],
        'Core': [
            { id: 'plancha', name: 'Plancha', type: 'isolation', equipment: 'bodyweight', priority: 1 },
            { id: 'crunch_cable', name: 'Crunch Cable', type: 'isolation', equipment: 'cable', priority: 2 },
            { id: 'elevacion_piernas', name: 'Elevación Piernas', type: 'isolation', equipment: 'bodyweight', priority: 2 },
            { id: 'rueda_ab', name: 'Rueda Ab', type: 'isolation', equipment: 'other', priority: 3 }
        ]
    };

    // Plantillas de splits
    const SPLITS = {
        push_pull_legs: [
            { name: 'Push', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
            { name: 'Pull', muscles: ['Espalda', 'Bíceps'] },
            { name: 'Piernas', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'] },
            { name: 'Push 2', muscles: ['Hombros', 'Pecho', 'Tríceps'] },
            { name: 'Pull 2', muscles: ['Espalda', 'Bíceps'] },
            { name: 'Piernas 2', muscles: ['Isquiotibiales', 'Cuádriceps', 'Glúteos', 'Pantorrillas'] }
        ],
        upper_lower: [
            { name: 'Upper A', muscles: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps'] },
            { name: 'Lower A', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'] },
            { name: 'Upper B', muscles: ['Espalda', 'Pecho', 'Hombros', 'Tríceps', 'Bíceps'] },
            { name: 'Lower B', muscles: ['Isquiotibiales', 'Cuádriceps', 'Glúteos', 'Pantorrillas'] }
        ],
        bro_split: [
            { name: 'Pecho', muscles: ['Pecho'] },
            { name: 'Espalda', muscles: ['Espalda'] },
            { name: 'Hombros', muscles: ['Hombros'] },
            { name: 'Piernas', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'] },
            { name: 'Brazos', muscles: ['Bíceps', 'Tríceps'] }
        ],
        hit_3day: [
            { name: 'Tren Superior A', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
            { name: 'Tren Inferior', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] },
            { name: 'Tren Superior B', muscles: ['Espalda', 'Bíceps'] }
        ],
        full_body: [
            { name: 'Full Body A', muscles: ['Pecho', 'Espalda', 'Cuádriceps', 'Hombros'] },
            { name: 'Full Body B', muscles: ['Hombros', 'Espalda', 'Isquiotibiales', 'Bíceps', 'Tríceps'] },
            { name: 'Full Body C', muscles: ['Espalda', 'Pecho', 'Cuádriceps', 'Glúteos'] }
        ]
    };

    // Ejercicios por grupo muscular para ajuste de volumen por nivel
    const VOLUME_BY_LEVEL = {
        beginner: { exercisesPerMuscle: 2, setsMultiplier: 0.7 },
        intermediate: { exercisesPerMuscle: 3, setsMultiplier: 1.0 },
        advanced: { exercisesPerMuscle: 4, setsMultiplier: 1.2 }
    };

    /**
     * Crea una rutina completa basada en metodología
     */
    function createRoutine(options = {}) {
        const {
            methodology = 'Y3T',
            protocol = null,
            split = 'push_pull_legs',
            level = 'intermediate'
        } = options;

        console.log('🔨 Generando rutina:', { methodology, protocol, split, level });

        // Obtener datos de metodología
        const methData = window.MethodologyEngine?.getMethodology(methodology);
        if (!methData) {
            console.error(`Metodología ${methodology} no encontrada`);
            return null;
        }

        // Obtener protocolo
        const protData = protocol
            ? methData.protocols.find(p => p.id === protocol)
            : methData.protocols[0];

        if (!protData) {
            console.error(`Protocolo no encontrado`);
            return null;
        }

        const volumeConfig = VOLUME_BY_LEVEL[level] || VOLUME_BY_LEVEL.intermediate;
        const splitDays = SPLITS[split] || SPLITS.push_pull_legs;

        // Generar días
        const days = splitDays.map((day, idx) => ({
            dayNumber: idx + 1,
            name: day.name,
            muscles: day.muscles,
            exercises: generateExercisesForDay(day.muscles, protData, methData, volumeConfig),
            completed: false
        }));

        const routine = {
            id: 'routine_' + Date.now(),
            methodology: methodology,
            methodologyName: methData.name,
            protocol: protData.id,
            protocolName: protData.name,
            protocolDescription: protData.description,
            split: split,
            level: level,
            type: methData.type,
            createdAt: new Date().toISOString(),
            currentDayIndex: 0,
            currentWeek: 1,
            parameters: {
                sets: protData.sets,
                reps: protData.reps,
                rest: protData.rest,
                rir: protData.rir !== undefined ? protData.rir : 2,
                rpe: protData.rpe,
                tut: protData.tut,
                tempo: protData.tempo || null,
                load: protData.load || null,
                failures: protData.failures || null,
                sequences: protData.sequences || null,
                intensifiers: protData.intensifiers || []
            },
            warmup: methData.warmup,
            deload: methData.deload,
            days: days
        };

        // Guardar en localStorage
        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

        console.log('✅ Rutina generada:', routine);
        return routine;
    }

    /**
     * Genera ejercicios para un día
     */
    function generateExercisesForDay(muscles, protData, methData, volumeConfig) {
        const exercises = [];

        muscles.forEach((muscle, muscleIdx) => {
            const muscleExercises = EXERCISE_DATABASE[muscle] || [];
            const numExercises = Math.min(
                volumeConfig.exercisesPerMuscle,
                muscleExercises.length
            );

            // Ordenar por prioridad y tomar los necesarios
            const sortedExercises = [...muscleExercises]
                .sort((a, b) => a.priority - b.priority)
                .slice(0, numExercises);

            sortedExercises.forEach((ex, exIdx) => {
                // Calcular sets según tipo de ejercicio y metodología
                let baseSets = parseSets(protData.sets);

                // Aplicar multiplicador por nivel
                baseSets = Math.round(baseSets * volumeConfig.setsMultiplier);

                // Reducir sets para aislamientos en metodologías HIT
                if (ex.type === 'isolation' && methData.type === 'HIT') {
                    baseSets = Math.min(baseSets, 1);
                }

                // Primer ejercicio es principal, resto son secundarios
                const isPrimary = exIdx === 0;

                exercises.push({
                    id: `ex_${Date.now()}_${muscleIdx}_${exIdx}`,
                    name: ex.name,
                    exerciseId: ex.id,
                    muscleGroup: muscle,
                    type: ex.type,
                    equipment: ex.equipment,
                    isPrimary: isPrimary,

                    // Parámetros del protocolo
                    sets: baseSets,
                    targetReps: protData.reps,
                    targetRIR: protData.rir !== undefined ? protData.rir : 2,
                    restSeconds: parseRest(protData.rest),
                    restArray: Array.isArray(protData.rest) ? protData.rest : null,

                    // Parámetros adicionales
                    tempo: protData.tempo || null,
                    tut: protData.tut || null,
                    load: protData.load || null,
                    failures: protData.failures || null,
                    sequences: protData.sequences || null,

                    // Intensificadores disponibles para este ejercicio
                    availableIntensifiers: getAvailableIntensifiers(ex, protData, methData),
                    selectedIntensifiers: [],

                    // Para registro
                    setsCompleted: [],
                    notes: '',
                    completed: false
                });
            });
        });

        return exercises;
    }

    /**
     * Obtiene intensificadores disponibles según ejercicio y metodología
     */
    function getAvailableIntensifiers(exercise, protData, methData) {
        const baseIntensifiers = protData.intensifiers || [];

        // Intensificadores adicionales según tipo de ejercicio
        const typeIntensifiers = {
            compound: ['Forced Reps', 'Rest-Pause', 'Cluster Sets'],
            isolation: ['Drop Sets', 'Superseries', 'Parciales', 'Negativas']
        };

        const availableForType = typeIntensifiers[exercise.type] || [];

        // Combinar y remover duplicados
        return [...new Set([...baseIntensifiers, ...availableForType])];
    }

    /**
     * Parsea el número de sets de un string
     */
    function parseSets(setsStr) {
        if (typeof setsStr === 'number') return setsStr;
        if (!setsStr) return 3;

        const match = setsStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 3;
    }

    /**
     * Parsea el tiempo de descanso
     */
    function parseRest(rest) {
        if (typeof rest === 'number') return rest;
        if (Array.isArray(rest)) return rest[0];
        if (typeof rest === 'string') {
            const match = rest.match(/(\d+)/);
            return match ? parseInt(match[1]) : 90;
        }
        return 90;
    }

    /**
     * Obtiene la rutina activa
     */
    function getActiveRoutine() {
        try {
            const data = localStorage.getItem('rpCoach_active_routine');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error obteniendo rutina activa:', e);
            return null;
        }
    }

    /**
     * Obtiene el día actual de la rutina
     */
    function getCurrentDay() {
        const routine = getActiveRoutine();
        if (!routine) return null;

        const dayIndex = routine.currentDayIndex || 0;
        const day = routine.days?.[dayIndex];

        if (!day) return null;

        return {
            ...day,
            dayIndex,
            weekNumber: routine.currentWeek || 1,
            methodology: routine.methodology,
            protocol: routine.protocol
        };
    }

    /**
     * Avanza al siguiente día
     */
    function advanceToNextDay() {
        const routine = getActiveRoutine();
        if (!routine) return null;

        routine.currentDayIndex = (routine.currentDayIndex + 1) % routine.days.length;

        // Si volvemos al día 0, avanzamos semana
        if (routine.currentDayIndex === 0) {
            routine.currentWeek = (routine.currentWeek || 1) + 1;
        }

        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));
        return getCurrentDay();
    }

    /**
     * Marca el día actual como completado
     */
    function completeCurrentDay(sessionData) {
        const routine = getActiveRoutine();
        if (!routine) return false;

        const dayIndex = routine.currentDayIndex || 0;
        if (routine.days[dayIndex]) {
            routine.days[dayIndex].completed = true;
            routine.days[dayIndex].completedAt = new Date().toISOString();
            routine.days[dayIndex].sessionData = sessionData;
        }

        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));
        return true;
    }

    /**
     * Exporta la rutina para sincronización con NEXUS
     */
    function exportForNEXUS() {
        const routine = getActiveRoutine();
        if (!routine) return null;

        return {
            source: 'NEXUS-RP_Coach',
            exportedAt: new Date().toISOString(),
            routine: routine
        };
    }

    /**
     * Importa rutina desde NEXUS
     */
    function importFromNEXUS(nexusData) {
        if (!nexusData?.routine) return null;

        const routine = nexusData.routine;
        routine.importedFrom = 'NEXUS';
        routine.importedAt = new Date().toISOString();

        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));
        return routine;
    }

    // API Pública
    return {
        createRoutine,
        getActiveRoutine,
        getCurrentDay,
        advanceToNextDay,
        completeCurrentDay,
        exportForNEXUS,
        importFromNEXUS,
        EXERCISE_DATABASE,
        SPLITS
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.RoutineGenerator = RoutineGenerator;
}
