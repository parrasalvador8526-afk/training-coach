/**
 * ═══════════════════════════════════════════════════════════
 * NEXUS-RP Coach — Motor de Doble Progresión
 * ═══════════════════════════════════════════════════════════
 * Micro-progresión por ejercicio: trabaja en un rango de reps,
 * cuando alcanzas el tope en TODOS los sets → sube peso y
 * vuelve al mínimo del rango.
 *
 * Compatible con las 9 metodologías RPizadas.
 * ═══════════════════════════════════════════════════════════
 */
const DoubleProgressionEngine = (() => {
    const STORAGE_KEY = 'rpCoach_double_progression';

    // Rangos por defecto según tipo de protocolo
    const DEFAULT_REP_RANGES = {
        strength: { min: 3, max: 6 },
        hypertrophy: { min: 8, max: 12 },
        endurance: { min: 12, max: 20 },
        default: { min: 8, max: 12 }
    };

    // Configuración de DP por metodología
    const METHODOLOGY_DP_CONFIG = {
        'RPStyle':      { enabled: true, applyTo: 'all' },
        'DUP':          { enabled: true, applyTo: 'all' },
        'Y3T':          { enabled: true, applyTo: 'all' },
        'HeavyDuty':    { enabled: true, applyTo: 'all' },
        'BloodAndGuts': { enabled: true, applyTo: 'all' },
        'MTUT':         { enabled: true, applyTo: 'all' },
        'SST':          { enabled: true, applyTo: 'all' },
        'FST7':         { enabled: true, applyTo: 'main' },        // No en las 7 series finisher
        'RestPause':    { enabled: true, applyTo: 'activation' },   // Solo serie de activación
        '531':          { enabled: true, applyTo: 'accessories' }   // Solo accesorios (BBB)
    };

    function getState() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    /**
     * Parsea rep range string → {min, max}
     * Soporta: "8-12", "8–12", "10", número, null
     */
    function parseRepRange(repString) {
        if (!repString) return DEFAULT_REP_RANGES.default;
        if (typeof repString === 'number') return { min: repString, max: repString };

        const str = String(repString);
        const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };

        const singleMatch = str.match(/(\d+)/);
        if (singleMatch) {
            const n = parseInt(singleMatch[1]);
            return { min: n, max: n };
        }
        return DEFAULT_REP_RANGES.default;
    }

    /**
     * Evalúa si un ejercicio está listo para subir peso
     * Condición: TODOS los sets de trabajo alcanzaron repMax
     */
    function evaluateExercise(exerciseName, sets, repRange) {
        const { min, max } = repRange;

        // Si min === max, no aplica DP (rep fija como 531 main lifts)
        if (min === max) return { ready: false, reason: 'fixed_reps', progress: 0 };

        const workingSets = sets.filter(s => s.weight > 0 && s.reps > 0);
        if (workingSets.length === 0) return { ready: false, reason: 'no_data', progress: 0 };

        const setsAtMax = workingSets.filter(s => s.reps >= max).length;
        const totalSets = workingSets.length;
        const progress = Math.round((setsAtMax / totalSets) * 100);

        if (setsAtMax === totalSets) {
            return {
                ready: true,
                reason: 'all_sets_at_max',
                setsAtMax,
                totalSets,
                progress: 100,
                message: `${setsAtMax}/${totalSets} series a ${max} reps — SUBE PESO`
            };
        }

        return {
            ready: false,
            reason: 'not_all_sets',
            setsAtMax,
            totalSets,
            progress,
            message: `${setsAtMax}/${totalSets} series a ${max} reps`
        };
    }

    /**
     * Calcula el incremento recomendado usando progressive-overload.js
     */
    function getIncrement(exerciseName) {
        if (window.ProgressiveOverloadModule?.getRecommendedIncrement) {
            return window.ProgressiveOverloadModule.getRecommendedIncrement(exerciseName);
        }
        // Fallback: detectar upper/lower por nombre
        const lowerKeywords = ['sentadilla', 'squat', 'prensa', 'leg press', 'peso muerto',
            'deadlift', 'hip thrust', 'curl femoral', 'extensión cuádriceps', 'búlgara'];
        const isLower = lowerKeywords.some(l => exerciseName.toLowerCase().includes(l));
        return isLower ? 5 : 2.5;
    }

    /**
     * Determina si DP aplica a este ejercicio según config de metodología
     */
    function shouldApplyDP(dpConfig, exercise, protocol) {
        if (dpConfig.applyTo === 'all') return true;
        if (dpConfig.applyTo === 'main') {
            // FST7: no aplicar a ejercicios finisher (>4 sets totales = probable FST-7 finisher)
            const programmedSets = exercise.totalSets || exercise.sets?.length || 0;
            return !protocol.includes('FST7') || programmedSets <= 4;
        }
        if (dpConfig.applyTo === 'activation') {
            // RestPause: evalúa pero con la primera serie como referencia
            return true;
        }
        if (dpConfig.applyTo === 'accessories') {
            // 531: solo accesorios (BBB), no main lifts
            return protocol.includes('BBB') || !protocol.includes('531');
        }
        return true;
    }

    /**
     * Obtiene rep range del protocolo de metodología
     */
    function getProtocolRepRange(methodology, protocolId) {
        if (window.MethodologyEngine?.getProtocol) {
            const proto = window.MethodologyEngine.getProtocol(methodology, protocolId);
            return proto?.reps || '8-12';
        }
        return '8-12';
    }

    /**
     * Procesa una sesión completa y actualiza el estado DP de cada ejercicio
     */
    function processSession(sessionRecord) {
        const state = getState();
        const methodology = sessionRecord.methodology || 'default';
        const dpConfig = METHODOLOGY_DP_CONFIG[methodology] || { enabled: true, applyTo: 'all' };

        if (!dpConfig.enabled) return state;

        if (!state.exercises) state.exercises = {};
        if (!state.history) state.history = [];

        const protocol = sessionRecord.exercises?.[0]?.protocol || '';

        sessionRecord.exercises?.forEach(exercise => {
            const exName = exercise.name;
            if (!exName) return;

            // Verificar si DP aplica a este ejercicio según config
            if (!shouldApplyDP(dpConfig, exercise, protocol)) return;

            // Obtener rep range del protocolo
            const methodReps = getProtocolRepRange(methodology, protocol);
            const repRange = parseRepRange(exercise.targetReps || methodReps);

            // Evaluar
            const evaluation = evaluateExercise(exName, exercise.sets || [], repRange);
            const currentWeight = exercise.sets?.[0]?.weight || exercise.weight || 0;

            // Estado previo del ejercicio
            const prev = state.exercises[exName] || {
                lastWeight: 0,
                consecutiveAtMax: 0,
                repRange,
                progressions: []
            };

            // Actualizar estado
            state.exercises[exName] = {
                lastWeight: currentWeight,
                lastMaxReps: Math.max(...(exercise.sets || []).map(s => s.reps || 0), 0),
                lastAvgReps: exercise.sets?.length
                    ? Math.round(exercise.sets.reduce((s, set) => s + (set.reps || 0), 0) / exercise.sets.length)
                    : 0,
                repRange,
                evaluation,
                lastEvaluated: new Date().toISOString(),
                consecutiveAtMax: evaluation.ready ? (prev.consecutiveAtMax || 0) + 1 : 0,
                progressions: prev.progressions || [],
                methodology,
                suggestion: null
            };

            // Si está listo, registrar sugerencia de progresión
            if (evaluation.ready) {
                const increment = getIncrement(exName);
                state.exercises[exName].suggestion = {
                    action: 'INCREASE_WEIGHT',
                    currentWeight,
                    newWeight: +(currentWeight + increment).toFixed(1),
                    increment,
                    newTargetReps: repRange.min,
                    reason: `Lograste ${repRange.max} reps en ${evaluation.totalSets} series. Sube a ${+(currentWeight + increment).toFixed(1)}kg y vuelve a ${repRange.min} reps.`
                };

                // Agregar al historial de progresiones
                state.exercises[exName].progressions.push({
                    date: new Date().toISOString(),
                    fromWeight: currentWeight,
                    toWeight: +(currentWeight + increment).toFixed(1),
                    fromReps: repRange.max,
                    toReps: repRange.min,
                    week: sessionRecord.mesocycleWeek || 0
                });

                // Limitar historial a 20 entradas
                if (state.exercises[exName].progressions.length > 20) {
                    state.exercises[exName].progressions = state.exercises[exName].progressions.slice(-20);
                }
            }
        });

        // Guardar evento en historial global
        state.history.push({
            date: new Date().toISOString(),
            sessionId: sessionRecord.id,
            exercisesEvaluated: sessionRecord.exercises?.length || 0,
            readyForProgression: Object.values(state.exercises).filter(e => e.evaluation?.ready).length
        });
        if (state.history.length > 50) state.history = state.history.slice(-50);

        saveState(state);
        return state;
    }

    /**
     * Obtiene sugerencias DP para los ejercicios del próximo workout
     */
    function getSuggestionsForDay(exerciseNames) {
        const state = getState();
        const suggestions = [];

        exerciseNames.forEach(name => {
            const exState = state.exercises?.[name];
            if (exState?.suggestion) {
                suggestions.push({
                    exercise: name,
                    ...exState.suggestion
                });
            }
        });

        return suggestions;
    }

    /**
     * Obtiene estado actual de todos los ejercicios
     */
    function getAllExerciseStates() {
        const state = getState();
        return state.exercises || {};
    }

    /**
     * Obtiene resumen para analytics/progresión
     */
    function getAnalyticsSummary() {
        const state = getState();
        const exercises = state.exercises || {};
        const entries = Object.entries(exercises);

        const allProgressions = entries
            .filter(([, e]) => e.progressions?.length > 0)
            .map(([name, e]) => ({
                exercise: name,
                latest: e.progressions[e.progressions.length - 1],
                totalProgressions: e.progressions.length
            }))
            .sort((a, b) => new Date(b.latest.date) - new Date(a.latest.date))
            .slice(0, 10);

        return {
            totalTracked: entries.length,
            readyForProgression: entries.filter(([, e]) => e.evaluation?.ready).length,
            totalProgressions: entries.reduce((sum, [, e]) => sum + (e.progressions?.length || 0), 0),
            recentProgressions: allProgressions,
            exerciseDetails: entries.map(([name, e]) => ({
                name,
                weight: e.lastWeight,
                avgReps: e.lastAvgReps,
                repRange: e.repRange,
                progress: e.evaluation?.progress || 0,
                ready: e.evaluation?.ready || false,
                suggestion: e.suggestion || null,
                consecutiveAtMax: e.consecutiveAtMax || 0
            }))
        };
    }

    /**
     * Reset para nuevo mesociclo
     */
    function reset() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return {
        parseRepRange,
        evaluateExercise,
        processSession,
        getSuggestionsForDay,
        getAllExerciseStates,
        getAnalyticsSummary,
        getIncrement,
        reset,
        METHODOLOGY_DP_CONFIG,
        DEFAULT_REP_RANGES
    };
})();
