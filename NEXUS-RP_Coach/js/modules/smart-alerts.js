/**
 * NEXUS-RP Coach - Smart Suggestions & Alerts System
 * Sistema Inteligente de Sugerencias y Alertas
 * 
 * Funcionalidades innovadoras:
 * - Detección de PRs (Récords Personales)
 * - Alertas de fatiga/recuperación
 * - Sugerencias de progresión automática
 * - Análisis de tendencias
 * - Recomendaciones de deload
 * - Detección de grupos rezagados
 */

const SmartAlerts = (() => {
    const ALERTS_KEY = 'rpCoach_smart_alerts';
    const HISTORY_KEY = 'rpCoach_performance_history';

    // Tipos de alertas
    const ALERT_TYPES = {
        PR_NEW: { icon: '🏆', color: '#F59E0B', priority: 1 },
        FATIGUE_HIGH: { icon: '⚠️', color: '#EF4444', priority: 2 },
        DELOAD_NEEDED: { icon: '😴', color: '#8B5CF6', priority: 2 },
        PROGRESS_STALL: { icon: '📊', color: '#6366F1', priority: 3 },
        LAGGING_GROUP: { icon: '🎯', color: '#06B6D4', priority: 3 },
        PUMP_LOW: { icon: '💪', color: '#F97316', priority: 4 },
        VOLUME_HIGH: { icon: '📈', color: '#10B981', priority: 4 },
        SUGGESTION: { icon: '💡', color: '#3B82F6', priority: 5 }
    };

    /**
     * Analiza el historial y genera alertas inteligentes
     */
    function analyzeAndGenerateAlerts() {
        const alerts = [];
        const history = getPerformanceHistory();

        // 1. Verificar PRs recientes
        const prAlerts = checkForNewPRs(history);
        alerts.push(...prAlerts);

        // 2. Verificar fatiga acumulada
        const fatigueAlerts = checkFatigueLevel(history);
        alerts.push(...fatigueAlerts);

        // 3. Verificar si necesita deload
        const deloadAlerts = checkDeloadNeeded(history);
        alerts.push(...deloadAlerts);

        // 4. Verificar estancamiento en progreso
        const stallAlerts = checkProgressStall(history);
        alerts.push(...stallAlerts);

        // 5. Verificar grupos rezagados
        const laggingAlerts = checkLaggingMuscles(history);
        alerts.push(...laggingAlerts);

        // 6. Verificar pump bajo
        const pumpAlerts = checkPumpLevels(history);
        alerts.push(...pumpAlerts);

        // Ordenar por prioridad y guardar
        alerts.sort((a, b) => a.priority - b.priority);
        saveAlerts(alerts);

        return alerts;
    }

    /**
     * Verifica nuevos récords personales
     */
    function checkForNewPRs(history) {
        const alerts = [];
        const exercisePRs = {};

        // Construir mapa de PRs
        history.forEach(session => {
            session.exercises?.forEach(ex => {
                const name = ex.name || ex.exerciseName;
                if (!exercisePRs[name]) {
                    exercisePRs[name] = { maxWeight: 0, maxVolume: 0, date: null };
                }

                ex.sets?.forEach(set => {
                    if (set.weight > exercisePRs[name].maxWeight) {
                        exercisePRs[name].maxWeight = set.weight;
                        exercisePRs[name].date = session.date;

                        // Si es de las últimas 2 sesiones, es nuevo PR
                        if (isRecent(session.date, 2)) {
                            alerts.push({
                                type: 'PR_NEW',
                                ...ALERT_TYPES.PR_NEW,
                                title: `¡Nuevo PR en ${name}!`,
                                message: `Has alcanzado ${set.weight}kg - ¡Felicidades! 🎉`,
                                exercise: name,
                                value: set.weight,
                                date: session.date
                            });
                        }
                    }
                });
            });
        });

        return alerts;
    }

    /**
     * Verifica nivel de fatiga
     */
    function checkFatigueLevel(history) {
        const alerts = [];
        const recentSessions = history.filter(s => isRecent(s.date, 7));

        if (recentSessions.length < 3) return alerts;

        // Calcular fatiga promedio
        let totalFatigue = 0;
        let count = 0;

        recentSessions.forEach(s => {
            if (s.fatigueLevel || s.overallRating) {
                // Si hay rating bajo, indica fatiga alta
                const rating = s.overallRating || 5;
                const fatigue = s.fatigueLevel || (10 - rating);
                totalFatigue += fatigue;
                count++;
            }
        });

        const avgFatigue = count > 0 ? totalFatigue / count : 0;

        if (avgFatigue >= 7) {
            alerts.push({
                type: 'FATIGUE_HIGH',
                ...ALERT_TYPES.FATIGUE_HIGH,
                title: 'Fatiga Acumulada Alta',
                message: 'Tu fatiga promedio es muy alta. Considera reducir volumen o tomar descanso.',
                value: avgFatigue.toFixed(1),
                suggestion: 'Reduce el volumen 20% esta semana'
            });
        }

        return alerts;
    }

    /**
     * Obtiene umbrales de alerta ajustados por metodología
     * HIT: tolera más sesiones intensas antes de recomendar deload
     * VOLUME: deload más frecuente pero menos drástico
     */
    function getMethodologyAwareThresholds() {
        const currentMethod = window.MethodologyEngine?.methodology;
        const methData = window.MethodologyEngine?.getMethodology(currentMethod);

        if (methData?.type === 'HIT') {
            return {
                deloadSessionThreshold: 18,    // HIT necesita menos deloads (más intensidad, menos volumen)
                deloadIntensityThreshold: 9,   // RPE 9+ es normal en HIT
                fatigueThreshold: 8,           // Mayor tolerancia a fatiga
                deloadReduction: 50,           // Reducción más agresiva cuando se hace deload
                intensifierNote: 'Metodología HIT: mayor tolerancia a intensidad máxima'
            };
        }

        if (methData?.type === 'HYBRID') {
            return {
                deloadSessionThreshold: 14,
                deloadIntensityThreshold: 8.5,
                fatigueThreshold: 7,
                deloadReduction: 45,
                intensifierNote: 'Metodología Híbrida: balance entre intensidad y volumen'
            };
        }

        // VOLUME o default
        return {
            deloadSessionThreshold: 12,        // Deload más frecuente con alto volumen
            deloadIntensityThreshold: 8,
            fatigueThreshold: 6.5,
            deloadReduction: 40,
            intensifierNote: 'Metodología de Volumen: deloads regulares para manejar fatiga acumulada'
        };
    }

    /**
     * Verifica si necesita deload - ahora consciente de metodología
     */
    function checkDeloadNeeded(history) {
        const alerts = [];
        const recentSessions = history.filter(s => isRecent(s.date, 21)); // 3 semanas
        const thresholds = getMethodologyAwareThresholds();

        // Contar sesiones de alta intensidad seguidas
        let highIntensityCount = 0;
        recentSessions.forEach(s => {
            const rpeThreshold = thresholds.deloadIntensityThreshold;
            if (s.avgRPE >= rpeThreshold || s.rirAvg <= (10 - rpeThreshold)) {
                highIntensityCount++;
            }
        });

        // Usar umbral ajustado por metodología
        if (highIntensityCount >= thresholds.deloadSessionThreshold) {
            const methName = window.MethodologyEngine?.getMethodology(window.MethodologyEngine?.methodology)?.name || 'actual';
            alerts.push({
                type: 'DELOAD_NEEDED',
                ...ALERT_TYPES.DELOAD_NEEDED,
                title: 'Recomendación de Deload',
                message: `Has tenido ${highIntensityCount} sesiones de alta intensidad con ${methName}. Tu cuerpo necesita recuperar.`,
                suggestion: `Próxima semana: reduce peso ${thresholds.deloadReduction}%, volumen 50%`,
                methodologyNote: thresholds.intensifierNote
            });
        }

        return alerts;
    }

    /**
     * Verifica estancamiento en progreso
     */
    function checkProgressStall(history) {
        const alerts = [];
        if (history.length < 4) return alerts;

        // Agrupar por ejercicio
        const exerciseHistory = {};
        history.forEach(session => {
            session.exercises?.forEach(ex => {
                const name = ex.name || ex.exerciseName;
                if (!exerciseHistory[name]) {
                    exerciseHistory[name] = [];
                }
                ex.sets?.forEach(set => {
                    exerciseHistory[name].push({
                        date: session.date,
                        weight: set.weight,
                        reps: set.reps
                    });
                });
            });
        });

        // Verificar cada ejercicio
        Object.entries(exerciseHistory).forEach(([exercise, sets]) => {
            if (sets.length < 4) return;

            // Ordenar por fecha
            sets.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Verificar últimos 4 registros
            const recent = sets.slice(0, 4);
            const weights = recent.map(s => s.weight);
            const maxRecent = Math.max(...weights);
            const minRecent = Math.min(...weights);

            // Si no hay progreso en peso (menos de 2.5kg de diferencia)
            if (maxRecent - minRecent < 2.5 && sets.length >= 8) {
                // Verificar si antes había progreso
                const older = sets.slice(4, 8);
                if (older.length >= 4) {
                    const avgOlder = older.reduce((sum, s) => sum + s.weight, 0) / older.length;
                    if (Math.abs(maxRecent - avgOlder) < 2.5) {
                        alerts.push({
                            type: 'PROGRESS_STALL',
                            ...ALERT_TYPES.PROGRESS_STALL,
                            title: `Estancamiento en ${exercise}`,
                            message: 'No ha habido progreso en peso en las últimas 4 sesiones.',
                            exercise,
                            suggestion: 'Considera: cambiar variante, técnica intensificadora, o rango de reps'
                        });
                    }
                }
            }
        });

        return alerts;
    }

    /**
     * Verifica grupos musculares rezagados
     */
    function checkLaggingMuscles(history) {
        const alerts = [];
        const muscleVolume = {};
        const targetVolume = {
            chest: 12, back: 14, shoulders: 10, quadriceps: 12,
            hamstrings: 10, biceps: 10, triceps: 10, calves: 8
        };

        // Calcular volumen por grupo en última semana
        const recentSessions = history.filter(s => isRecent(s.date, 7));
        recentSessions.forEach(session => {
            session.exercises?.forEach(ex => {
                const muscle = ex.muscleGroup || detectMuscleGroup(ex.name);
                if (!muscle) return;

                if (!muscleVolume[muscle]) {
                    muscleVolume[muscle] = 0;
                }
                muscleVolume[muscle] += ex.sets?.length || 0;
            });
        });

        // Verificar grupos con bajo volumen
        Object.entries(targetVolume).forEach(([muscle, target]) => {
            const actual = muscleVolume[muscle] || 0;
            if (actual < target * 0.6) { // Menos del 60% del objetivo
                alerts.push({
                    type: 'LAGGING_GROUP',
                    ...ALERT_TYPES.LAGGING_GROUP,
                    title: `${capitalize(muscle)} necesita más volumen`,
                    message: `Solo ${actual} series esta semana (recomendado: ${target})`,
                    muscle,
                    actual,
                    target,
                    suggestion: `Añade ${target - actual} series más de ${muscle}`
                });
            }
        });

        return alerts;
    }

    /**
     * Verifica niveles de pump
     */
    function checkPumpLevels(history) {
        const alerts = [];
        const recentSessions = history.filter(s => isRecent(s.date, 14));

        const pumpByMuscle = {};
        recentSessions.forEach(session => {
            session.exercises?.forEach(ex => {
                if (!ex.pumpRating) return;
                const muscle = ex.muscleGroup || 'general';

                if (!pumpByMuscle[muscle]) {
                    pumpByMuscle[muscle] = { total: 0, count: 0 };
                }
                pumpByMuscle[muscle].total += ex.pumpRating;
                pumpByMuscle[muscle].count++;
            });
        });

        Object.entries(pumpByMuscle).forEach(([muscle, data]) => {
            if (data.count < 3) return;

            const avgPump = data.total / data.count;
            if (avgPump < 2.5) {
                alerts.push({
                    type: 'PUMP_LOW',
                    ...ALERT_TYPES.PUMP_LOW,
                    title: `Pump bajo en ${capitalize(muscle)}`,
                    message: `Promedio de pump: ${avgPump.toFixed(1)}/5`,
                    muscle,
                    value: avgPump,
                    suggestion: 'Considera: más tiempo bajo tensión, rangos de rep más altos, o técnicas metabólicas'
                });
            }
        });

        return alerts;
    }

    /**
     * Genera sugerencias de progresión para un ejercicio
     */
    function getSuggestionForExercise(exerciseName, lastPerformance, targetRIR = 2) {
        const history = getExerciseHistory(exerciseName);

        if (history.length === 0 && !lastPerformance) {
            return {
                type: 'new_exercise',
                message: 'Primera vez con este ejercicio. Empieza conservador y ajusta según sensaciones.',
                weight: null,
                reps: 10
            };
        }

        const last = lastPerformance || history[0];
        const { weight, reps, rpe } = last;
        const rir = 10 - rpe;

        let suggestion = {
            weight,
            reps,
            type: 'maintain',
            message: 'Mantén peso y reps'
        };

        // Lógica de progresión inteligente
        if (rir > targetRIR + 2) {
            // Mucho margen - subir peso significativamente
            suggestion = {
                weight: weight + 5,
                reps,
                type: 'increase_weight',
                message: `Sube peso a ${weight + 5}kg - tenías mucho margen (RIR ${rir})`
            };
        } else if (rir > targetRIR) {
            // Algo de margen - subir peso ligeramente
            suggestion = {
                weight: weight + 2.5,
                reps,
                type: 'increase_weight_small',
                message: `Prueba con ${weight + 2.5}kg - aún tienes margen`
            };
        } else if (rir === targetRIR) {
            // Perfecto - intentar más reps
            suggestion = {
                weight,
                reps: reps + 1,
                type: 'increase_reps',
                message: `Perfecto. Intenta ${reps + 1} reps con mismo peso`
            };
        } else if (rir < targetRIR - 1) {
            // Muy cerca del fallo - reducir
            suggestion = {
                weight: Math.round(weight * 0.95), // -5%
                reps,
                type: 'decrease_weight',
                message: `Reduce a ${Math.round(weight * 0.95)}kg - estás superando el target RIR`
            };
        }

        // Verificar si hay estancamiento
        if (history.length >= 4) {
            const weights = history.slice(0, 4).map(h => h.weight);
            if (Math.max(...weights) - Math.min(...weights) < 2.5) {
                suggestion.stallWarning = true;
                suggestion.stallMessage = 'Posible estancamiento detectado. Considera cambiar la variante del ejercicio.';
            }
        }

        return suggestion;
    }

    /**
     * Obtiene historial de un ejercicio específico
     */
    function getExerciseHistory(exerciseName) {
        const history = getPerformanceHistory();
        const exerciseData = [];

        history.forEach(session => {
            session.exercises?.forEach(ex => {
                if ((ex.name || ex.exerciseName) === exerciseName) {
                    ex.sets?.forEach(set => {
                        exerciseData.push({
                            date: session.date,
                            weight: set.weight,
                            reps: set.reps,
                            rpe: set.rpe,
                            rir: 10 - (set.rpe || 7)
                        });
                    });
                }
            });
        });

        // Ordenar por fecha descendente
        exerciseData.sort((a, b) => new Date(b.date) - new Date(a.date));
        return exerciseData;
    }

    // Helpers
    function getPerformanceHistory() {
        const enhanced = JSON.parse(localStorage.getItem('rpCoach_enhanced_sessions') || '[]');
        const logs = JSON.parse(localStorage.getItem('rpCoach_session_logs') || '[]');
        return [...enhanced, ...logs].sort((a, b) =>
            new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)
        );
    }

    function isRecent(dateStr, days) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);
        return diffDays <= days;
    }

    function detectMuscleGroup(exerciseName) {
        const name = (exerciseName || '').toLowerCase();
        if (name.includes('press') && (name.includes('banca') || name.includes('pecho'))) return 'chest';
        if (name.includes('remo') || name.includes('jalón') || name.includes('dominada')) return 'back';
        if (name.includes('press militar') || name.includes('lateral')) return 'shoulders';
        if (name.includes('sentadilla') || name.includes('prensa') || name.includes('extensión')) return 'quadriceps';
        if (name.includes('curl femoral') || name.includes('rumano')) return 'hamstrings';
        if (name.includes('curl') && !name.includes('femoral')) return 'biceps';
        if (name.includes('tríceps') || name.includes('extensión')) return 'triceps';
        if (name.includes('pantorrilla') || name.includes('gemelo')) return 'calves';
        return null;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function saveAlerts(alerts) {
        localStorage.setItem(ALERTS_KEY, JSON.stringify({
            alerts,
            generatedAt: new Date().toISOString()
        }));
    }

    function getActiveAlerts() {
        const stored = localStorage.getItem(ALERTS_KEY);
        if (!stored) return [];
        const data = JSON.parse(stored);
        return data.alerts || [];
    }

    function dismissAlert(alertIndex) {
        const alerts = getActiveAlerts();
        alerts.splice(alertIndex, 1);
        saveAlerts(alerts);
    }

    // API Pública
    return {
        analyzeAndGenerateAlerts,
        getSuggestionForExercise,
        getExerciseHistory,
        getActiveAlerts,
        dismissAlert,
        ALERT_TYPES
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.SmartAlerts = SmartAlerts;
}
