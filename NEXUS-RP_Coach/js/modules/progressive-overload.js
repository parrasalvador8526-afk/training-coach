/**
 * NEXUS-RP Coach - Módulo de Sobrecarga Progresiva Automática
 * Inspirado en RP Hypertrophy App
 * 
 * Calcula automáticamente el incremento de peso o reps
 * basándose en el rendimiento de la sesión anterior.
 */

const ProgressiveOverloadModule = (() => {
    // Configuración de incrementos por tipo de ejercicio
    const INCREMENT_CONFIG = {
        // Ejercicios de tren superior
        upper: {
            barbell: 2.5,    // kg por sesión
            dumbbell: 2,     // kg total (1kg por mancuerna)
            cable: 2.5,
            machine: 2.5
        },
        // Ejercicios de tren inferior
        lower: {
            barbell: 5,      // kg por sesión
            dumbbell: 4,     // kg total
            machine: 5,
            bodyweight: 0    // Añadir reps
        }
    };

    // Clasificación de ejercicios por tipo de movimiento
    const EXERCISE_CLASSIFICATION = {
        // Tren superior - Empuje
        'Press Banca': { type: 'upper', equipment: 'barbell' },
        'Press Inclinado': { type: 'upper', equipment: 'barbell' },
        'Press Declinado': { type: 'upper', equipment: 'barbell' },
        'Press Militar': { type: 'upper', equipment: 'barbell' },
        'Press Arnold': { type: 'upper', equipment: 'dumbbell' },
        'Fondos': { type: 'upper', equipment: 'bodyweight' },
        'Press Francés': { type: 'upper', equipment: 'barbell' },

        // Tren superior - Tirón
        'Dominadas': { type: 'upper', equipment: 'bodyweight' },
        'Remo con Barra': { type: 'upper', equipment: 'barbell' },
        'Remo T': { type: 'upper', equipment: 'barbell' },
        'Jalón al Pecho': { type: 'upper', equipment: 'cable' },
        'Curl con Barra': { type: 'upper', equipment: 'barbell' },
        'Curl Alterno': { type: 'upper', equipment: 'dumbbell' },

        // Tren inferior
        'Sentadilla': { type: 'lower', equipment: 'barbell' },
        'Peso Muerto': { type: 'lower', equipment: 'barbell' },
        'Peso Muerto Rumano': { type: 'lower', equipment: 'barbell' },
        'Prensa': { type: 'lower', equipment: 'machine' },
        'Hack Squat': { type: 'lower', equipment: 'machine' },
        'Extensión de Pierna': { type: 'lower', equipment: 'machine' },
        'Curl Femoral': { type: 'lower', equipment: 'machine' },
        'Sentadilla Búlgara': { type: 'lower', equipment: 'dumbbell' },
        'Hip Thrust': { type: 'lower', equipment: 'barbell' }
    };

    // Reglas de progresión según RIR alcanzado
    const PROGRESSION_RULES = {
        // Si llegaste al objetivo con RIR 0-1, sube peso
        exceeded: {
            condition: (targetReps, actualReps, targetRIR, actualRIR) =>
                actualReps >= targetReps && actualRIR <= 1,
            action: 'INCREASE_WEIGHT',
            message: '¡Excelente! Superas el objetivo. Sube peso la próxima sesión.'
        },
        // Si alcanzaste el objetivo con RIR 2, mantén y busca más reps
        onTarget: {
            condition: (targetReps, actualReps, targetRIR, actualRIR) =>
                actualReps >= targetReps && actualRIR >= 2 && actualRIR <= 3,
            action: 'ADD_REPS',
            message: 'Buen trabajo. Intenta 1-2 reps más antes de subir peso.'
        },
        // Si llegaste con RIR alto, el peso está muy bajo
        tooLight: {
            condition: (targetReps, actualReps, targetRIR, actualRIR) =>
                actualReps >= targetReps && actualRIR >= 4,
            action: 'INCREASE_WEIGHT_MORE',
            message: 'Peso muy ligero. Considera un aumento mayor de peso.'
        },
        // Si no alcanzaste las reps objetivo
        missed: {
            condition: (targetReps, actualReps, targetRIR, actualRIR) =>
                actualReps < targetReps,
            action: 'MAINTAIN',
            message: 'No alcanzaste el objetivo. Mantén peso y trabaja en las reps.'
        },
        // Si fallaste significativamente
        failed: {
            condition: (targetReps, actualReps, targetRIR, actualRIR) =>
                actualReps < targetReps * 0.7,
            action: 'REDUCE_WEIGHT',
            message: 'Reducción significativa. Considera bajar peso 5-10%.'
        }
    };

    function getExerciseClassification(exerciseName) {
        return EXERCISE_CLASSIFICATION[exerciseName] || { type: 'upper', equipment: 'barbell' };
    }

    /**
     * Obtiene ajustes de progresión basados en la metodología activa
     * HIT: incrementos menores, RIR 0 es el target, énfasis en intensidad
     * VOLUME: incrementos estándar, RIR 2-3 es el target, énfasis en volumen
     * @returns {Object} Ajustes de progresión
     */
    function getMethodologyAwareProgression() {
        const currentMethod = window.MethodologyEngine?.methodology;
        const methData = window.MethodologyEngine?.getMethodology(currentMethod);

        if (methData?.type === 'HIT') {
            return {
                incrementMultiplier: 0.5, // Incrementos más pequeños para HIT
                targetRIR: 0,             // HIT entrena al fallo
                failureThreshold: 0.6,    // Más tolerante al "fallo" en reps
                addRepsThreshold: 1,      // Solo añadir reps si RIR > 1
                note: 'Progresión HIT: incrementos conservadores, enfoque en intensidad máxima'
            };
        }

        if (methData?.type === 'HYBRID') {
            return {
                incrementMultiplier: 0.75,
                targetRIR: 1,
                failureThreshold: 0.65,
                addRepsThreshold: 2,
                note: 'Progresión Híbrida: balance entre intensidad y volumen'
            };
        }

        // VOLUME o default
        return {
            incrementMultiplier: 1.0,
            targetRIR: 2,
            failureThreshold: 0.7,
            addRepsThreshold: 3,
            note: 'Progresión Volumen: incrementos estándar, énfasis en acumulación'
        };
    }

    /**
     * Calcula el incremento de peso recomendado
     * Ahora ajustado por tipo de metodología
     */
    function getRecommendedIncrement(exerciseName) {
        const classification = getExerciseClassification(exerciseName);
        const baseIncrement = INCREMENT_CONFIG[classification.type][classification.equipment] || 2.5;
        const methodAdjust = getMethodologyAwareProgression();

        return baseIncrement * methodAdjust.incrementMultiplier;
    }

    /**
     * Evalúa el rendimiento y genera recomendación de progresión
     * @param {Object} lastSession - Datos de la última sesión
     * @param {number} targetReps - Reps objetivo
     * @param {number} targetRIR - RIR objetivo
     * @returns {Object} Recomendación de progresión
     */
    function evaluateProgression(lastSession, targetReps, targetRIR) {
        const { weight, reps: actualReps, rpe } = lastSession;
        const actualRIR = 10 - rpe;

        // Evaluar según reglas
        for (const [key, rule] of Object.entries(PROGRESSION_RULES)) {
            if (rule.condition(targetReps, actualReps, targetRIR, actualRIR)) {
                return {
                    rule: key,
                    action: rule.action,
                    message: rule.message,
                    currentWeight: weight,
                    currentReps: actualReps,
                    currentRIR: actualRIR,
                    targetReps,
                    targetRIR
                };
            }
        }

        return {
            rule: 'maintain',
            action: 'MAINTAIN',
            message: 'Mantén el rendimiento actual.',
            currentWeight: weight,
            currentReps: actualReps,
            currentRIR: actualRIR
        };
    }

    /**
     * Calcula el peso para la próxima sesión
     * @param {string} exerciseName - Nombre del ejercicio
     * @param {Object} lastSession - Datos de la última sesión
     * @param {number} targetReps - Reps objetivo
     * @param {number} targetRIR - RIR objetivo
     * @returns {Object} Recomendación completa
     */
    function calculateNextSession(exerciseName, lastSession, targetReps, targetRIR) {
        const evaluation = evaluateProgression(lastSession, targetReps, targetRIR);
        const increment = getRecommendedIncrement(exerciseName);

        let nextWeight = lastSession.weight;
        let nextReps = targetReps;
        let nextRIR = targetRIR;

        switch (evaluation.action) {
            case 'INCREASE_WEIGHT':
                nextWeight = lastSession.weight + increment;
                break;
            case 'INCREASE_WEIGHT_MORE':
                nextWeight = lastSession.weight + (increment * 2);
                break;
            case 'ADD_REPS':
                nextReps = Math.min(lastSession.reps + 2, targetReps + 3);
                break;
            case 'REDUCE_WEIGHT':
                nextWeight = Math.round(lastSession.weight * 0.9 / 2.5) * 2.5;
                break;
            case 'MAINTAIN':
            default:
                // Mantener igual
                break;
        }

        return {
            exercise: exerciseName,
            ...evaluation,
            recommendation: {
                weight: nextWeight,
                reps: nextReps,
                targetRIR: nextRIR,
                increment: nextWeight - lastSession.weight
            }
        };
    }

    /**
     * Estima el 1RM basado en peso y reps (fórmula Epley)
     */
    function estimate1RM(weight, reps) {
        if (reps === 1) return weight;
        if (reps > 12) return null; // No confiable para más de 12 reps
        return Math.round(weight * (1 + reps / 30));
    }

    /**
     * Calcula el peso para un porcentaje del 1RM
     */
    function calculatePercentage(oneRM, percentage) {
        return Math.round(oneRM * (percentage / 100) / 2.5) * 2.5;
    }

    /**
     * Genera plan de progresión para un mesociclo
     * @param {number} startingWeight - Peso inicial
     * @param {number} weeks - Número de semanas
     * @param {string} exerciseName - Nombre del ejercicio
     * @returns {Array} Plan de progresión
     */
    function generateProgressionPlan(startingWeight, weeks, exerciseName) {
        const increment = getRecommendedIncrement(exerciseName);
        const plan = [];

        for (let week = 1; week <= weeks; week++) {
            if (week === weeks) {
                // Deload week
                plan.push({
                    week,
                    weight: Math.round(startingWeight * 0.6 / 2.5) * 2.5,
                    phase: 'DELOAD',
                    note: 'Semana de descarga - 60% del peso inicial'
                });
            } else {
                const progressedWeight = startingWeight + (increment * (week - 1));
                plan.push({
                    week,
                    weight: progressedWeight,
                    phase: week === 1 ? 'START' : 'PROGRESSION',
                    note: week === 1 ? 'Peso inicial' : `+${increment}kg vs semana anterior`
                });
            }
        }

        return plan;
    }

    /**
     * Obtiene el historial de PRs para un ejercicio (requiere SessionLoggerModule)
     */
    function getPRHistory(exerciseName) {
        if (typeof SessionLoggerModule === 'undefined') {
            return [];
        }

        const logs = SessionLoggerModule.getLogsByExercise(exerciseName);
        if (logs.length === 0) return [];

        const prHistory = [];
        let currentPR = 0;

        logs.sort((a, b) => new Date(a.date) - new Date(b.date));

        logs.forEach(log => {
            const maxWeight = Math.max(...log.sets.map(s => s.weight));
            if (maxWeight > currentPR) {
                currentPR = maxWeight;
                prHistory.push({
                    date: log.dateFormatted,
                    weight: maxWeight,
                    isPR: true
                });
            }
        });

        return prHistory;
    }

    /**
     * Añade una clasificación de ejercicio personalizada
     */
    function addExerciseClassification(exerciseName, type, equipment) {
        EXERCISE_CLASSIFICATION[exerciseName] = { type, equipment };
    }

    // API Pública
    return {
        getExerciseClassification,
        getRecommendedIncrement,
        evaluateProgression,
        calculateNextSession,
        estimate1RM,
        calculatePercentage,
        generateProgressionPlan,
        getPRHistory,
        addExerciseClassification,
        INCREMENT_CONFIG,
        PROGRESSION_RULES
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ProgressiveOverloadModule = ProgressiveOverloadModule;
}
