/**
 * NEXUS-RP Coach - Enhanced Session Logger
 * Registro Set-by-Set estilo RP Hypertrophy App
 * 
 * MEJORAS IMPLEMENTADAS:
 * - Registro individual por cada set (no solo por sesión)
 * - Feedback de pump por ejercicio
 * - Feedback de comodidad articular por ejercicio
 * - Auto-propagación de peso entre sets
 * - Técnicas intensificadoras (MyoReps, Drop Sets, Rest-Pause)
 * - Integración con metodologías para sugerencias inteligentes
 */

const EnhancedSessionLogger = (() => {
    const STORAGE_KEY = 'rpCoach_enhanced_logs';
    const ACTIVE_SESSION_KEY = 'rpCoach_active_session';

    // Técnicas intensificadoras disponibles por metodología
    const INTENSIFIER_TECHNIQUES = {
        'normal': {
            name: 'Normal',
            icon: '⚪',
            description: 'Set estándar',
            compatibleWith: ['all']
        },
        'myo_reps': {
            name: 'Myo-Reps',
            icon: '🔄',
            description: 'Set activación + mini-sets de 3-5 reps',
            compatibleWith: ['RestPause', 'Y3T', 'FST7']
        },
        'drop_set': {
            name: 'Drop Set',
            icon: '📉',
            description: 'Reducir peso y continuar sin descanso',
            compatibleWith: ['BloodAndGuts', 'FST7', 'Y3T', 'SST']
        },
        'rest_pause': {
            name: 'Rest-Pause',
            icon: '⏸️',
            description: 'Micro descansos intra-serie',
            compatibleWith: ['RestPause', 'HeavyDuty', 'BloodAndGuts', 'DCTraining']
        },
        'forced_reps': {
            name: 'Reps Forzadas',
            icon: '💪',
            description: 'Reps asistidas post-fallo',
            compatibleWith: ['HeavyDuty', 'BloodAndGuts']
        },
        'negatives': {
            name: 'Negativas',
            icon: '⬇️',
            description: 'Excéntrica supramáxima lenta',
            compatibleWith: ['HeavyDuty', 'BloodAndGuts', 'RestPause']
        },
        'partials': {
            name: 'Parciales',
            icon: '½',
            description: 'Reps en rango parcial post-fallo',
            compatibleWith: ['BloodAndGuts', 'SST']
        },
        'slow_tempo': {
            name: 'Tempo Lento',
            icon: '🐌',
            description: 'Fase excéntrica/concéntrica controlada',
            compatibleWith: ['MTUT', 'Y3T']
        },
        'isometric_hold': {
            name: 'Hold Isométrico',
            icon: '🔒',
            description: 'Pausa en contracción máxima',
            compatibleWith: ['MTUT', 'SST']
        }
    };

    // Opciones de feedback por ejercicio
    const EXERCISE_FEEDBACK = {
        pump: {
            1: { label: 'Sin pump', color: '#e74c3c', icon: '😕' },
            2: { label: 'Pump leve', color: '#f39c12', icon: '😐' },
            3: { label: 'Pump moderado', color: '#f1c40f', icon: '🙂' },
            4: { label: 'Buen pump', color: '#2ecc71', icon: '😊' },
            5: { label: 'Pump extremo', color: '#9b59b6', icon: '🔥' }
        },
        jointComfort: {
            1: { label: 'Dolor significativo', color: '#e74c3c', icon: '🔴' },
            2: { label: 'Molestia notable', color: '#f39c12', icon: '🟠' },
            3: { label: 'Ligera molestia', color: '#f1c40f', icon: '🟡' },
            4: { label: 'Cómodo', color: '#2ecc71', icon: '🟢' },
            5: { label: 'Perfecto', color: '#3498db', icon: '💚' }
        }
    };

    /**
     * Crea un set individual con toda la información necesaria
     */
    function createSet(data) {
        return {
            setNumber: data.setNumber || 1,
            weight: parseFloat(data.weight) || 0,
            reps: parseInt(data.reps) || 0,
            rpe: parseFloat(data.rpe) || 7,
            rir: Math.max(0, 10 - (parseFloat(data.rpe) || 7)),
            technique: data.technique || 'normal',
            tempo: data.tempo || null, // ej: "3-1-4"
            completedAt: new Date().toISOString(),
            notes: data.notes || '',
            // Campos calculados
            volume: (parseFloat(data.weight) || 0) * (parseInt(data.reps) || 0),
            // Para técnicas especiales
            techniqueDetails: data.techniqueDetails || null
        };
    }

    /**
     * Crea un registro de ejercicio completo con feedback
     */
    function createExerciseLog(data) {
        return {
            id: generateId(),
            exerciseName: data.exerciseName || '',
            muscleGroup: data.muscleGroup || '',
            sets: data.sets || [],
            totalSets: (data.sets || []).length,
            totalReps: (data.sets || []).reduce((sum, s) => sum + s.reps, 0),
            totalVolume: (data.sets || []).reduce((sum, s) => sum + s.volume, 0),
            averageRPE: calculateAverageRPE(data.sets || []),
            // Feedback por ejercicio (como RP App)
            feedback: {
                pump: data.pumpRating || 3,
                jointComfort: data.jointComfort || 4,
                notes: data.feedbackNotes || ''
            },
            completedAt: new Date().toISOString()
        };
    }

    /**
     * Crea una sesión de entrenamiento completa
     */
    function createSession(data) {
        return {
            id: generateId(),
            date: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            methodology: data.methodology || '',
            weekNumber: data.weekNumber || 1,
            dayOfMesocycle: data.dayOfMesocycle || 1,
            exercises: data.exercises || [],
            // Métricas de sesión
            sessionMetrics: {
                totalExercises: (data.exercises || []).length,
                totalSets: (data.exercises || []).reduce((sum, e) => sum + e.totalSets, 0),
                totalVolume: (data.exercises || []).reduce((sum, e) => sum + e.totalVolume, 0),
                duration: data.duration || 0, // minutos
                averagePump: calculateAveragePump(data.exercises || []),
                averageJointComfort: calculateAverageJointComfort(data.exercises || [])
            },
            // Rating general de sesión
            overallRating: data.overallRating || 0,
            sessionNotes: data.sessionNotes || '',
            status: 'completed'
        };
    }

    /**
     * Inicia una nueva sesión activa
     */
    function startSession(methodology, weekNumber = 1) {
        const session = {
            id: generateId(),
            startedAt: new Date().toISOString(),
            methodology,
            weekNumber,
            exercises: [],
            currentExercise: null,
            status: 'in_progress'
        };

        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
        return session;
    }

    /**
     * Obtiene la sesión activa
     */
    function getActiveSession() {
        const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Actualiza la sesión activa
     */
    function updateActiveSession(session) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }

    /**
     * Añade un ejercicio a la sesión activa
     */
    function addExerciseToSession(exerciseData) {
        const session = getActiveSession();
        if (!session) {
            console.error('No hay sesión activa');
            return null;
        }

        const exerciseLog = createExerciseLog(exerciseData);
        session.exercises.push(exerciseLog);
        session.currentExercise = null;
        updateActiveSession(session);

        return exerciseLog;
    }

    /**
     * Añade un set al ejercicio actual
     */
    function addSetToCurrentExercise(setData) {
        const session = getActiveSession();
        if (!session) {
            console.error('No hay sesión activa');
            return null;
        }

        if (!session.currentExercise) {
            session.currentExercise = {
                exerciseName: setData.exerciseName,
                muscleGroup: setData.muscleGroup,
                sets: []
            };
        }

        const set = createSet({
            ...setData,
            setNumber: session.currentExercise.sets.length + 1
        });

        session.currentExercise.sets.push(set);
        updateActiveSession(session);

        return set;
    }

    /**
     * Propaga el peso del set anterior (como RP App)
     */
    function getPropagatedWeight(exerciseName) {
        const session = getActiveSession();
        if (!session) return null;

        // Buscar en ejercicio actual
        if (session.currentExercise &&
            session.currentExercise.exerciseName === exerciseName &&
            session.currentExercise.sets.length > 0) {
            return session.currentExercise.sets[session.currentExercise.sets.length - 1].weight;
        }

        // Buscar en sesiones anteriores
        const lastLog = getLastLogForExercise(exerciseName);
        if (lastLog && lastLog.sets.length > 0) {
            return lastLog.sets[0].weight;
        }

        return null;
    }

    /**
     * Finaliza el ejercicio actual y pide feedback
     */
    function finishCurrentExercise(feedbackData) {
        const session = getActiveSession();
        if (!session || !session.currentExercise) {
            return null;
        }

        const exerciseLog = createExerciseLog({
            ...session.currentExercise,
            pumpRating: feedbackData.pump || 3,
            jointComfort: feedbackData.jointComfort || 4,
            feedbackNotes: feedbackData.notes || ''
        });

        session.exercises.push(exerciseLog);
        session.currentExercise = null;
        updateActiveSession(session);

        return exerciseLog;
    }

    /**
     * Finaliza la sesión completa
     */
    function finishSession(sessionFeedback = {}) {
        const session = getActiveSession();
        if (!session) return null;

        // Si hay ejercicio en progreso, finalizarlo primero
        if (session.currentExercise && session.currentExercise.sets.length > 0) {
            finishCurrentExercise({ pump: 3, jointComfort: 4 });
        }

        // Calcular duración
        const startTime = new Date(session.startedAt);
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

        const completedSession = createSession({
            methodology: session.methodology,
            weekNumber: session.weekNumber,
            exercises: session.exercises,
            duration: durationMinutes,
            overallRating: sessionFeedback.overallRating || 0,
            sessionNotes: sessionFeedback.notes || ''
        });

        // Guardar en historial
        saveSession(completedSession);

        // Limpiar sesión activa
        localStorage.removeItem(ACTIVE_SESSION_KEY);

        return completedSession;
    }

    /**
     * Guarda una sesión completada
     */
    function saveSession(session) {
        const sessions = getAllSessions();
        sessions.push(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }

    /**
     * Obtiene todas las sesiones guardadas
     */
    function getAllSessions() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Obtiene el último log de un ejercicio específico
     */
    function getLastLogForExercise(exerciseName) {
        const sessions = getAllSessions();

        for (let i = sessions.length - 1; i >= 0; i--) {
            const exercise = sessions[i].exercises.find(
                e => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
            );
            if (exercise) {
                return exercise;
            }
        }

        return null;
    }

    /**
     * Sugiere peso/reps basado en historial y metodología
     */
    function getSuggestion(exerciseName, methodology, weekNumber) {
        const lastLog = getLastLogForExercise(exerciseName);

        if (!lastLog || lastLog.sets.length === 0) {
            return {
                weight: null,
                reps: null,
                message: 'Sin historial previo. Empieza conservador.'
            };
        }

        const lastSet = lastLog.sets[0];
        const avgRPE = lastLog.averageRPE;

        // Lógica de progresión basada en metodología
        let suggestion = {
            weight: lastSet.weight,
            reps: lastSet.reps,
            message: ''
        };

        // Ajustes por metodología
        const methodologyAdjustments = {
            'HeavyDuty': { weightIncrease: 2.5, focus: 'intensidad' },
            'BloodAndGuts': { weightIncrease: 2.5, focus: 'intensidad' },
            'Y3T': { weightIncrease: weekNumber === 1 ? 2.5 : 0, focus: 'volumen/reps' },
            'FST7': { weightIncrease: 0, focus: 'pump' },
            'SST': { weightIncrease: 0, focus: 'fatiga metabólica' },
            'MTUT': { weightIncrease: 0, focus: 'tempo' },
            'GVT': { weightIncrease: 2.5, focus: 'volumen' },
            'RestPause': { weightIncrease: 2.5, focus: 'densidad' }
        };

        const methConfig = methodologyAdjustments[methodology] || { weightIncrease: 2.5, focus: 'general' };

        if (avgRPE < 8) {
            // Espacio para subir
            suggestion.weight = lastSet.weight + methConfig.weightIncrease;
            suggestion.message = `📈 Sube peso: ${avgRPE.toFixed(1)} RPE anterior = margen disponible`;
        } else if (avgRPE > 9.5) {
            // Demasiado intenso
            suggestion.message = `⚠️ RPE muy alto. Mantén peso o reduce ligeramente`;
        } else {
            suggestion.message = `✅ Buen RPE. Mantén o intenta +1-2 reps`;
        }

        return suggestion;
    }

    /**
     * Obtiene técnicas compatibles con la metodología actual
     */
    function getCompatibleTechniques(methodology) {
        return Object.entries(INTENSIFIER_TECHNIQUES)
            .filter(([key, tech]) =>
                tech.compatibleWith.includes('all') ||
                tech.compatibleWith.includes(methodology)
            )
            .map(([key, tech]) => ({ id: key, ...tech }));
    }

    /**
     * Estadísticas por grupo muscular
     */
    function getWeeklyStats(weeksBack = 1) {
        const sessions = getAllSessions();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (weeksBack * 7));

        const recentSessions = sessions.filter(s => new Date(s.date) >= cutoff);

        const statsByMuscle = {};

        recentSessions.forEach(session => {
            session.exercises.forEach(exercise => {
                if (!statsByMuscle[exercise.muscleGroup]) {
                    statsByMuscle[exercise.muscleGroup] = {
                        totalSets: 0,
                        totalVolume: 0,
                        exercises: [],
                        avgPump: 0,
                        avgJointComfort: 0
                    };
                }

                statsByMuscle[exercise.muscleGroup].totalSets += exercise.totalSets;
                statsByMuscle[exercise.muscleGroup].totalVolume += exercise.totalVolume;
                statsByMuscle[exercise.muscleGroup].exercises.push({
                    name: exercise.exerciseName,
                    sets: exercise.totalSets,
                    pump: exercise.feedback.pump,
                    joint: exercise.feedback.jointComfort
                });
            });
        });

        // Calcular promedios
        Object.keys(statsByMuscle).forEach(muscle => {
            const exercises = statsByMuscle[muscle].exercises;
            if (exercises.length > 0) {
                statsByMuscle[muscle].avgPump =
                    exercises.reduce((sum, e) => sum + e.pump, 0) / exercises.length;
                statsByMuscle[muscle].avgJointComfort =
                    exercises.reduce((sum, e) => sum + e.joint, 0) / exercises.length;
            }
        });

        return statsByMuscle;
    }

    // Helpers
    function generateId() {
        return 'esl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function calculateAverageRPE(sets) {
        if (!sets.length) return 0;
        return sets.reduce((sum, s) => sum + s.rpe, 0) / sets.length;
    }

    function calculateAveragePump(exercises) {
        if (!exercises.length) return 0;
        return exercises.reduce((sum, e) => sum + e.feedback.pump, 0) / exercises.length;
    }

    function calculateAverageJointComfort(exercises) {
        if (!exercises.length) return 0;
        return exercises.reduce((sum, e) => sum + e.feedback.jointComfort, 0) / exercises.length;
    }

    // API Pública
    return {
        // Gestión de sesión
        startSession,
        getActiveSession,
        finishSession,
        // Registro de sets/ejercicios
        addSetToCurrentExercise,
        finishCurrentExercise,
        addExerciseToSession,
        // Sugerencias inteligentes
        getPropagatedWeight,
        getSuggestion,
        getCompatibleTechniques,
        // Historial y estadísticas
        getAllSessions,
        getLastLogForExercise,
        getWeeklyStats,
        // Constantes
        INTENSIFIER_TECHNIQUES,
        EXERCISE_FEEDBACK,
        // Helpers
        createSet,
        createExerciseLog
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.EnhancedSessionLogger = EnhancedSessionLogger;
}
