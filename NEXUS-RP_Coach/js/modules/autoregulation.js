/**
 * NEXUS-RP Coach - Módulo de Autorregulación Inteligente
 * Inspirado en RP Hypertrophy App
 * 
 * Evalúa feedback post-ejercicio (pump, soreness, fatiga)
 * y genera recomendaciones para la próxima sesión.
 */

const AutoregulationModule = (() => {
    // Configuración de umbrales
    const THRESHOLDS = {
        pump: {
            low: 2,      // Pump insuficiente
            optimal: 3,  // Pump adecuado
            high: 4      // Pump excelente
        },
        soreness: {
            low: 2,      // Poca molestia (puede aumentar)
            moderate: 3, // Molestia normal
            high: 4      // Demasiada molestia (reducir)
        },
        fatigue: {
            low: 2,      // Poca fatiga (puede aumentar)
            moderate: 3, // Fatiga normal
            high: 4      // Fatiga excesiva (reducir/deload)
        }
    };

    // Recomendaciones basadas en combinaciones
    const RECOMMENDATIONS = {
        ADD_VOLUME: {
            action: 'ADD_VOLUME',
            label: '📈 Añadir Volumen',
            description: 'Tu recuperación es excelente. Añade 1-2 series por grupo muscular.',
            seriesChange: +1,
            weightChange: 0,
            color: 'success'
        },
        INCREASE_WEIGHT: {
            action: 'INCREASE_WEIGHT',
            label: '🏋️ Subir Peso',
            description: 'Buen pump y recuperación. Aumenta 2.5-5kg en ejercicios principales.',
            seriesChange: 0,
            weightChange: 2.5,
            color: 'success'
        },
        MAINTAIN: {
            action: 'MAINTAIN',
            label: '✅ Mantener',
            description: 'Todo equilibrado. Mantén el mismo peso y volumen.',
            seriesChange: 0,
            weightChange: 0,
            color: 'optimal'
        },
        REDUCE_VOLUME: {
            action: 'REDUCE_VOLUME',
            label: '📉 Reducir Volumen',
            description: 'Fatiga acumulada detectada. Reduce 1-2 series por grupo.',
            seriesChange: -1,
            weightChange: 0,
            color: 'warning'
        },
        REDUCE_INTENSITY: {
            action: 'REDUCE_INTENSITY',
            label: '⚖️ Reducir Intensidad',
            description: 'Mantén volumen pero reduce peso 5-10%.',
            seriesChange: 0,
            weightChange: -5,
            color: 'warning'
        },
        DELOAD: {
            action: 'DELOAD',
            label: '⚠️ DELOAD Recomendado',
            description: 'Fatiga crítica detectada. Toma una semana de descarga.',
            seriesChange: -3,
            weightChange: -30,
            color: 'critical'
        }
    };

    /**
     * Evalúa la sesión basándose en los tres indicadores
     * @param {number} pump - Nivel de bombeo (1-5)
     * @param {number} soreness - Nivel de agujetas (1-5)
     * @param {number} fatigue - Nivel de fatiga (1-5)
     * @returns {Object} Recomendación con acción y detalles
     */
    function evaluateSession(pump, soreness, fatigue) {
        // Validar entradas
        pump = Math.min(5, Math.max(1, pump));
        soreness = Math.min(5, Math.max(1, soreness));
        fatigue = Math.min(5, Math.max(1, fatigue));

        // Score combinado (mayor = peor recuperación)
        const recoveryScore = (soreness + fatigue) / 2;
        const stimulusScore = pump;

        // Algoritmo de decisión
        if (fatigue >= 5 || (soreness >= 4 && fatigue >= 4)) {
            return { ...RECOMMENDATIONS.DELOAD, scores: { pump, soreness, fatigue } };
        }

        if (recoveryScore >= 4) {
            return { ...RECOMMENDATIONS.REDUCE_VOLUME, scores: { pump, soreness, fatigue } };
        }

        if (recoveryScore >= 3.5 && stimulusScore >= 4) {
            return { ...RECOMMENDATIONS.REDUCE_INTENSITY, scores: { pump, soreness, fatigue } };
        }

        if (recoveryScore <= 2 && stimulusScore >= 4) {
            return { ...RECOMMENDATIONS.ADD_VOLUME, scores: { pump, soreness, fatigue } };
        }

        if (recoveryScore <= 2 && stimulusScore <= 2) {
            return { ...RECOMMENDATIONS.INCREASE_WEIGHT, scores: { pump, soreness, fatigue } };
        }

        if (recoveryScore <= 2.5 && stimulusScore >= 3) {
            return { ...RECOMMENDATIONS.INCREASE_WEIGHT, scores: { pump, soreness, fatigue } };
        }

        return { ...RECOMMENDATIONS.MAINTAIN, scores: { pump, soreness, fatigue } };
    }

    /**
     * Obtiene el historial de evaluaciones
     * @returns {Array} Array de evaluaciones previas
     */
    function getHistory() {
        const stored = localStorage.getItem('rpCoach_autoregulation_history');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Guarda una evaluación en el historial
     * @param {Object} evaluation - Evaluación a guardar
     */
    function saveEvaluation(evaluation) {
        const history = getHistory();
        history.push({
            ...evaluation,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('es-ES')
        });
        
        // Mantener solo últimas 50 evaluaciones
        if (history.length > 50) {
            history.shift();
        }
        
        localStorage.setItem('rpCoach_autoregulation_history', JSON.stringify(history));
    }

    /**
     * Calcula tendencia de recuperación basada en historial
     * @param {number} days - Días a analizar
     * @returns {Object} Tendencia de recuperación
     */
    function getRecoveryTrend(days = 7) {
        const history = getHistory();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentEvaluations = history.filter(e => 
            new Date(e.timestamp) >= cutoffDate
        );

        if (recentEvaluations.length === 0) {
            return { trend: 'UNKNOWN', message: 'Sin datos suficientes' };
        }

        const avgFatigue = recentEvaluations.reduce((sum, e) => sum + e.scores.fatigue, 0) / recentEvaluations.length;
        const avgSoreness = recentEvaluations.reduce((sum, e) => sum + e.scores.soreness, 0) / recentEvaluations.length;

        if (avgFatigue >= 4 || avgSoreness >= 4) {
            return { 
                trend: 'DECLINING', 
                message: 'Tendencia de fatiga creciente - considera deload',
                avgFatigue: avgFatigue.toFixed(1),
                avgSoreness: avgSoreness.toFixed(1)
            };
        }
        
        if (avgFatigue <= 2.5 && avgSoreness <= 2.5) {
            return { 
                trend: 'EXCELLENT', 
                message: 'Excelente recuperación - puedes aumentar estímulo',
                avgFatigue: avgFatigue.toFixed(1),
                avgSoreness: avgSoreness.toFixed(1)
            };
        }

        return { 
            trend: 'STABLE', 
            message: 'Recuperación estable - mantén el rumbo',
            avgFatigue: avgFatigue.toFixed(1),
            avgSoreness: avgSoreness.toFixed(1)
        };
    }

    /**
     * Limpia el historial de evaluaciones
     */
    function clearHistory() {
        localStorage.removeItem('rpCoach_autoregulation_history');
    }

    /**
     * Obtiene los descriptores para los valores de los sliders
     */
    function getValueDescriptors() {
        return {
            pump: {
                1: 'Sin pump',
                2: 'Pump leve',
                3: 'Pump moderado',
                4: 'Buen pump',
                5: 'Pump extremo'
            },
            soreness: {
                1: 'Sin molestias',
                2: 'Leve molestia',
                3: 'Moderado',
                4: 'Bastante molestia',
                5: 'Muy adolorido'
            },
            fatigue: {
                1: 'Descansado',
                2: 'Ligeramente cansado',
                3: 'Fatiga normal',
                4: 'Bastante fatigado',
                5: 'Agotado'
            }
        };
    }

    // API Pública
    return {
        evaluateSession,
        saveEvaluation,
        getHistory,
        getRecoveryTrend,
        clearHistory,
        getValueDescriptors,
        RECOMMENDATIONS
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AutoregulationModule = AutoregulationModule;
}
