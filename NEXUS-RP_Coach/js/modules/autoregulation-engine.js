/**
 * NEXUS-RP Coach - Motor de Autorregulación
 * Autorregulación adaptativa estilo RP Hypertrophy
 * 
 * Características:
 * - Adapta la autorregulación según la metodología seleccionada
 * - Calcula fatiga acumulada
 * - Sugiere ajustes de peso/reps
 * - Programa deloads automáticos
 * - Progresión de RIR semanal
 */

const AutoregulationEngine = (() => {
    // Clave de localStorage
    const FATIGUE_KEY = 'rpCoach_fatigue_tracker';
    const MESOCYCLE_KEY = 'rpCoach_mesocycle';

    // Configuración por tipo de metodología
    const METHODOLOGY_CONFIG = {
        // Metodologías HIT (bajo volumen, alta intensidad)
        HIT: {
            baseVolume: 'low',
            targetRIR: 0,
            rirProgression: false, // Siempre al fallo
            fatigueMultiplier: 1.5, // Mayor fatiga por set
            deloadFrequency: 3, // Cada 3 semanas
            intensifierWeight: 1.2, // Técnicas intensificadoras cuentan más
            recoveryDays: 3, // Más días entre sesiones
            volumeAdjustment: { min: 0.7, max: 1.0 }
        },
        // Metodologías de volumen (alto volumen, moderada intensidad)
        VOLUME: {
            baseVolume: 'high',
            targetRIR: 2,
            rirProgression: true, // 4-3-2-1 RIR
            fatigueMultiplier: 0.8, // Menor fatiga por set
            deloadFrequency: 5, // Cada 5 semanas
            intensifierWeight: 0.8, // Técnicas intensificadoras cuentan menos
            recoveryDays: 1, // Menos descanso entre sesiones
            volumeAdjustment: { min: 0.8, max: 1.3 }
        },
        // Metodologías híbridas
        HYBRID: {
            baseVolume: 'moderate',
            targetRIR: 1,
            rirProgression: true,
            fatigueMultiplier: 1.0,
            deloadFrequency: 4,
            intensifierWeight: 1.0,
            recoveryDays: 2,
            volumeAdjustment: { min: 0.8, max: 1.2 }
        }
    };

    // Mapeo de metodología a tipo
    const METHODOLOGY_TYPE_MAP = {
        'HeavyDuty': 'HIT',
        'BloodAndGuts': 'HIT',
        'DCTraining': 'HIT',
        'RestPause': 'HIT',
        'Y3T': 'HYBRID',
        'FST7': 'HYBRID',
        'SST': 'HYBRID',
        'MTUT': 'VOLUME',
        'GVT': 'VOLUME',
        'DUP': 'VOLUME',
        '531': 'VOLUME'
    };

    // Estado de fatiga
    let fatigueState = {
        global: 0, // 0-100
        perMuscle: {},
        weeklyVolume: {},
        lastDeload: null,
        currentWeek: 1
    };

    // Estado del mesociclo
    let mesocycleState = {
        week: 1,
        totalWeeks: 4,
        phase: 'accumulation', // accumulation, intensification, deload
        startDate: null
    };

    /**
     * Inicializa el motor
     */
    function init() {
        loadState();
        setupListeners();
        console.log('🧠 AutoregulationEngine inicializado');
    }

    /**
     * Carga estado de localStorage
     */
    function loadState() {
        try {
            const fatigueData = localStorage.getItem(FATIGUE_KEY);
            if (fatigueData) {
                fatigueState = JSON.parse(fatigueData);
            }

            const mesocycleData = localStorage.getItem(MESOCYCLE_KEY);
            if (mesocycleData) {
                mesocycleState = JSON.parse(mesocycleData);
            }
        } catch (e) {
            console.error('Error cargando estado de autorregulación:', e);
        }
    }

    /**
     * Guarda estado en localStorage
     */
    function saveState() {
        try {
            localStorage.setItem(FATIGUE_KEY, JSON.stringify(fatigueState));
            localStorage.setItem(MESOCYCLE_KEY, JSON.stringify(mesocycleState));
        } catch (e) {
            console.error('Error guardando estado de autorregulación:', e);
        }
    }

    /**
     * Configura listeners de eventos
     */
    function setupListeners() {
        // Escuchar cambio de metodología
        window.addEventListener('methodologyChange', (e) => {
            const { methodology } = e.detail || {};
            if (methodology) {
                updateForMethodology(methodology);
            }
        });
    }

    /**
     * Actualiza configuración según metodología
     */
    function updateForMethodology(methodologyId) {
        const type = METHODOLOGY_TYPE_MAP[methodologyId] || 'HYBRID';
        const config = METHODOLOGY_CONFIG[type];

        console.log(`🔄 Autorregulación adaptada a ${methodologyId} (tipo: ${type})`);

        // Emitir evento con nueva configuración
        window.dispatchEvent(new CustomEvent('autoregulationConfigChange', {
            detail: {
                methodology: methodologyId,
                type,
                config
            }
        }));
    }

    /**
     * Obtiene configuración para metodología actual
     */
    function getConfigForMethodology(methodologyId) {
        const type = METHODOLOGY_TYPE_MAP[methodologyId] || 'HYBRID';
        return {
            type,
            ...METHODOLOGY_CONFIG[type]
        };
    }

    /**
     * Calcula el RIR target basado en semana y metodología
     */
    function calculateTargetRIR(methodologyId) {
        const config = getConfigForMethodology(methodologyId);

        // Si no usa progresión de RIR (HIT), siempre retorna 0
        if (!config.rirProgression) {
            return 0;
        }

        // Progresión típica de RP: 4-3-2-1 RIR
        const baseRIR = 4;
        const weekReduction = mesocycleState.week - 1;
        let targetRIR = Math.max(baseRIR - weekReduction, 1);

        // Si es semana de deload, subir RIR
        if (mesocycleState.phase === 'deload') {
            targetRIR = 4;
        }

        return targetRIR;
    }

    /**
     * Registra fatiga de una sesión
     */
    function recordSessionFatigue(sessionData) {
        const { muscleGroups, totalVolume, avgRPE, exercises } = sessionData;
        const methodology = sessionData.methodology || 'Y3T';
        const config = getConfigForMethodology(methodology);

        // Calcular fatiga de la sesión
        let sessionFatigue = 0;

        exercises?.forEach(ex => {
            const sets = ex.setsCompleted?.length || 0;
            const avgSetRPE = ex.setsCompleted?.reduce((a, s) => a + (s.rpe || 7), 0) / sets || 7;

            // Fatiga base por set
            let baseFatigue = sets * 2;

            // Aumentar si RPE alto
            if (avgSetRPE >= 9) baseFatigue *= 1.5;
            else if (avgSetRPE >= 8) baseFatigue *= 1.2;

            // Aplicar multiplicador de metodología
            baseFatigue *= config.fatigueMultiplier;

            // Registrar por grupo muscular
            const muscle = ex.muscleGroup || 'General';
            fatigueState.perMuscle[muscle] = (fatigueState.perMuscle[muscle] || 0) + baseFatigue;

            sessionFatigue += baseFatigue;
        });

        // Actualizar fatiga global (0-100)
        fatigueState.global = Math.min(100, fatigueState.global + sessionFatigue * 0.5);

        // Registrar volumen semanal
        muscleGroups?.forEach(muscle => {
            fatigueState.weeklyVolume[muscle] = (fatigueState.weeklyVolume[muscle] || 0) + (totalVolume || 0);
        });

        saveState();

        return {
            sessionFatigue,
            globalFatigue: fatigueState.global,
            needsDeload: shouldRecommendDeload()
        };
    }

    /**
     * Recuperación diaria de fatiga
     */
    function processDailyRecovery() {
        // Recuperar 10-15% de fatiga por día de descanso
        const recoveryRate = 0.12;

        fatigueState.global = Math.max(0, fatigueState.global * (1 - recoveryRate));

        Object.keys(fatigueState.perMuscle).forEach(muscle => {
            fatigueState.perMuscle[muscle] *= (1 - recoveryRate);
        });

        saveState();
    }

    /**
     * Verifica si se debería recomendar deload
     */
    function shouldRecommendDeload() {
        // Fatiga global muy alta
        if (fatigueState.global >= 85) return true;

        // Verificar semana desde último deload
        const methodology = window.MethodologyEngine?.current?.methodology || 'Y3T';
        const config = getConfigForMethodology(methodology);

        if (mesocycleState.week >= config.deloadFrequency) {
            return true;
        }

        return false;
    }

    /**
     * Genera sugerencia de ajuste de peso/reps
     */
    function generateWeightSuggestion(exerciseData, lastPerformance) {
        const methodology = exerciseData.methodology || window.MethodologyEngine?.current?.methodology || 'Y3T';
        const config = getConfigForMethodology(methodology);

        const suggestion = {
            weight: lastPerformance?.weight || 0,
            reps: lastPerformance?.reps || 10,
            adjustment: 'maintain',
            reason: ''
        };

        if (!lastPerformance) {
            suggestion.reason = '🆕 Primera vez - ajusta según sensaciones';
            return suggestion;
        }

        const lastRIR = 10 - (lastPerformance.rpe || 7);
        const targetRIR = calculateTargetRIR(methodology);

        // Si estamos muy lejos del target RIR
        if (lastRIR > targetRIR + 2) {
            suggestion.weight = lastPerformance.weight + 2.5;
            suggestion.adjustment = 'increase';
            suggestion.reason = '📈 Tienes margen - +2.5kg';
        } else if (lastRIR > targetRIR + 1) {
            suggestion.reps = lastPerformance.reps + 1;
            suggestion.adjustment = 'increase_reps';
            suggestion.reason = '👍 Buen set - intenta +1 rep';
        } else if (lastRIR === targetRIR || lastRIR === targetRIR + 1) {
            suggestion.adjustment = 'maintain';
            suggestion.reason = '✅ Perfecto - mantén peso';
        } else if (lastRIR < targetRIR - 1) {
            suggestion.weight = Math.max(lastPerformance.weight - 2.5, 5);
            suggestion.adjustment = 'decrease';
            suggestion.reason = '⚠️ Muy cerca del fallo - -2.5kg';
        } else {
            suggestion.reps = Math.max(lastPerformance.reps - 1, 5);
            suggestion.adjustment = 'decrease_reps';
            suggestion.reason = '💪 Cerca del límite - considera -1 rep';
        }

        // Ajustar por fatiga acumulada
        if (fatigueState.global > 70) {
            if (suggestion.adjustment === 'increase') {
                suggestion.adjustment = 'maintain';
                suggestion.reason += ' (fatiga alta - conservar)';
            }
        }

        return suggestion;
    }

    /**
     * Genera reporte de estado
     */
    function generateStatusReport() {
        const methodology = window.MethodologyEngine?.current?.methodology || 'Y3T';
        const config = getConfigForMethodology(methodology);

        return {
            methodology: methodology,
            methodologyType: METHODOLOGY_TYPE_MAP[methodology],
            fatigue: {
                global: Math.round(fatigueState.global),
                level: fatigueState.global < 30 ? 'low' : fatigueState.global < 60 ? 'moderate' : fatigueState.global < 80 ? 'high' : 'critical',
                perMuscle: { ...fatigueState.perMuscle }
            },
            mesocycle: {
                week: mesocycleState.week,
                phase: mesocycleState.phase,
                targetRIR: calculateTargetRIR(methodology)
            },
            recommendations: {
                needsDeload: shouldRecommendDeload(),
                volumeMultiplier: calculateVolumeMultiplier(config),
                trainingAdvice: getTrainingAdvice()
            }
        };
    }

    /**
     * Calcula multiplicador de volumen
     */
    function calculateVolumeMultiplier(config) {
        const baseFatigue = fatigueState.global / 100;

        // Si fatiga alta, reducir volumen
        if (baseFatigue > 0.7) {
            return config.volumeAdjustment.min;
        }
        // Si fatiga baja, aumentar volumen
        if (baseFatigue < 0.3) {
            return config.volumeAdjustment.max;
        }
        // Interpolación lineal
        return 1.0;
    }

    /**
     * Genera consejo de entrenamiento
     */
    function getTrainingAdvice() {
        const fatigue = fatigueState.global;

        if (fatigue < 30) {
            return {
                icon: '💪',
                message: 'Fresco y listo para entrenar fuerte',
                color: 'success'
            };
        } else if (fatigue < 50) {
            return {
                icon: '👍',
                message: 'Buena recuperación - entrena normal',
                color: 'info'
            };
        } else if (fatigue < 70) {
            return {
                icon: '⚡',
                message: 'Fatiga acumulándose - considera reducir volumen',
                color: 'warning'
            };
        } else if (fatigue < 85) {
            return {
                icon: '⚠️',
                message: 'Fatiga alta - entrena ligero o descansa',
                color: 'warning'
            };
        } else {
            return {
                icon: '🛑',
                message: 'Fatiga crítica - DELOAD recomendado',
                color: 'danger'
            };
        }
    }

    /**
     * Inicia nuevo mesociclo
     */
    function startNewMesocycle(weeks = 4) {
        mesocycleState = {
            week: 1,
            totalWeeks: weeks,
            phase: 'accumulation',
            startDate: new Date().toISOString()
        };

        // Reset fatiga
        fatigueState.global = 0;
        fatigueState.perMuscle = {};
        fatigueState.weeklyVolume = {};

        saveState();

        return mesocycleState;
    }

    /**
     * Avanza a la siguiente semana
     */
    function advanceWeek() {
        mesocycleState.week++;

        // Determinar fase
        if (mesocycleState.week >= mesocycleState.totalWeeks) {
            mesocycleState.phase = 'deload';
        } else if (mesocycleState.week >= mesocycleState.totalWeeks - 1) {
            mesocycleState.phase = 'intensification';
        } else {
            mesocycleState.phase = 'accumulation';
        }

        // Reset volumen semanal
        fatigueState.weeklyVolume = {};

        saveState();

        return mesocycleState;
    }

    /**
     * Ejecuta deload
     */
    function executeDeload() {
        fatigueState.global = Math.max(0, fatigueState.global * 0.3);
        fatigueState.perMuscle = {};
        fatigueState.lastDeload = new Date().toISOString();

        mesocycleState.phase = 'deload';

        saveState();

        return {
            message: 'Deload ejecutado - fatiga reducida al 30%',
            newFatigue: fatigueState.global
        };
    }

    // Inicializar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API Pública
    return {
        init,
        getConfigForMethodology,
        calculateTargetRIR,
        recordSessionFatigue,
        processDailyRecovery,
        generateWeightSuggestion,
        generateStatusReport,
        startNewMesocycle,
        advanceWeek,
        executeDeload,
        shouldRecommendDeload,
        getFatigueLevel: () => fatigueState.global,
        getTrainingAdvice
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.AutoregulationEngine = AutoregulationEngine;
}
