/**
 * NEXUS-RP Coach - Fatigue Heatmap (Sobrecarga Localizada)
 * Mapa de calor de fatiga por grupo muscular.
 * Cruza volumen semanal vs Volume Landmarks (MEV/MAV/MRV),
 * intensidad (RPE/RIR) y tiempo de recuperación para generar
 * un score compuesto de fatiga 0-100 por músculo.
 */

const FatigueHeatmap = (() => {
    // Mapeo español → inglés (para cruzar con VOLUME_LANDMARKS)
    const MUSCLE_MAP = {
        'Pecho': 'chest',
        'Espalda': 'back',
        'Hombros': 'shoulders',
        'Cuádriceps': 'quadriceps',
        'Isquiotibiales': 'hamstrings',
        'Glúteos': 'glutes',
        'Bíceps': 'biceps',
        'Tríceps': 'triceps',
        'Pantorrillas': 'calves',
        'Core': 'abs'
    };

    // Mapeo inverso inglés → español
    const MUSCLE_MAP_INV = Object.fromEntries(
        Object.entries(MUSCLE_MAP).map(([k, v]) => [v, k])
    );

    // Grupos musculares principales (10)
    const MUSCLE_GROUPS = [
        { id: 'chest', name: 'Pecho', icon: '🫁', position: 'upper' },
        { id: 'back', name: 'Espalda', icon: '🔙', position: 'upper' },
        { id: 'shoulders', name: 'Hombros', icon: '🎯', position: 'upper' },
        { id: 'biceps', name: 'Bíceps', icon: '💪', position: 'arms' },
        { id: 'triceps', name: 'Tríceps', icon: '🦾', position: 'arms' },
        { id: 'quadriceps', name: 'Cuádriceps', icon: '🦵', position: 'lower' },
        { id: 'hamstrings', name: 'Isquiotibiales', icon: '🦿', position: 'lower' },
        { id: 'glutes', name: 'Glúteos', icon: '🍑', position: 'lower' },
        { id: 'calves', name: 'Pantorrillas', icon: '🦶', position: 'lower' },
        { id: 'abs', name: 'Core', icon: '🧱', position: 'core' }
    ];

    /**
     * Calcula fatiga por grupo muscular cruzando 3 fuentes:
     * 1. Volumen semanal (series 7 días) vs Volume Landmarks
     * 2. Intensidad promedio (RPE/RIR)
     * 3. Tiempo desde última sesión de ese músculo
     * @returns {Object} muscleData[muscleId] = { fatigueScore, zone, color, ... }
     */
    function calculateMuscleFatigue() {
        const sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

        const recentSessions = sessions.filter(s => new Date(s.date).getTime() > oneWeekAgo);

        const muscleData = {};

        MUSCLE_GROUPS.forEach(mg => {
            const spanishName = MUSCLE_MAP_INV[mg.id];

            let weeklySets = 0;
            let lastTrainedDate = null;
            let totalRPE = 0;
            let rpeCount = 0;
            let totalRIR = 0;
            let rirCount = 0;

            recentSessions.forEach(sess => {
                const muscleVol = sess.muscleVolume?.[spanishName] || 0;
                if (muscleVol > 0) {
                    weeklySets += muscleVol;
                    const sessDate = new Date(sess.date);
                    if (!lastTrainedDate || sessDate > lastTrainedDate) lastTrainedDate = sessDate;

                    (sess.exercises || []).forEach(ex => {
                        if (ex.muscleGroup === spanishName) {
                            const rpe = parseFloat(ex.avgRPE);
                            if (!isNaN(rpe) && rpe > 0) { totalRPE += rpe; rpeCount++; }
                            (ex.sets || []).forEach(s => {
                                if (!isNaN(s.rir) && s.rir >= 0) { totalRIR += s.rir; rirCount++; }
                            });
                        }
                    });
                }
            });

            // Cruzar con Volume Landmarks (MEV/MAV/MRV)
            const landmarks = window.VolumeMEVMRVModule?.getVolumeLandmarks?.(mg.id) || null;
            const mrv = landmarks?.MRV || 18;
            const mav = landmarks?.MAV?.high || landmarks?.MAV || 14;
            const mev = landmarks?.MEV || 6;

            // Ratio volumen vs MRV (cap 120% para overreaching)
            const volumeRatio = Math.min(mrv > 0 ? (weeklySets / mrv) * 100 : 0, 120);

            // Tiempo desde última sesión (horas)
            const hoursSinceTraining = lastTrainedDate
                ? (now - lastTrainedDate.getTime()) / (1000 * 60 * 60)
                : 999;

            // Estimación de recuperación basada en volumen + intensidad
            const avgRPE = rpeCount > 0 ? totalRPE / rpeCount : 7;
            const intensityFactor = avgRPE / 10; // 0.5-1.0
            const estimatedRecoveryHours = Math.max(48 * intensityFactor + (weeklySets * 1.5), 24);
            const recoveryPercent = Math.min((hoursSinceTraining / estimatedRecoveryHours) * 100, 100);

            // Score compuesto de fatiga (0-100)
            // Volumen vs MRV (50%) + Recuperación invertida (30%) + Intensidad (20%)
            const fatigueScore = Math.min(Math.round(
                (volumeRatio * 0.50) +
                ((100 - recoveryPercent) * 0.30) +
                (intensityFactor * 100 * 0.20)
            ), 100);

            // Zona y color
            let zone, color, label;
            if (weeklySets === 0) {
                zone = 'rest'; color = '#6B7280'; label = 'Sin datos';
            } else if (fatigueScore <= 25) {
                zone = 'fresh'; color = '#10B981'; label = 'Fresco';
            } else if (fatigueScore <= 50) {
                zone = 'loaded'; color = '#F59E0B'; label = 'Cargado';
            } else if (fatigueScore <= 75) {
                zone = 'fatigued'; color = '#EF4444'; label = 'Fatigado';
            } else {
                zone = 'overreached'; color = '#7C3AED'; label = 'Sobrecarga';
            }

            // Sugerencia contextual
            let suggestion = '';
            if (weeklySets === 0) {
                suggestion = 'Sin estímulo esta semana.';
            } else if (weeklySets >= mrv) {
                suggestion = `Alcanzaste MRV (${mrv} series). Reduce volumen o descansa.`;
            } else if (weeklySets >= mav) {
                suggestion = `Zona MAV-MRV (${weeklySets}/${mrv}). Espacio para ${mrv - weeklySets} series más.`;
            } else if (weeklySets < mev) {
                suggestion = `Debajo de MEV (${weeklySets}/${mev}). Añade ${mev - weeklySets} series para estímulo mínimo.`;
            } else {
                suggestion = `${weeklySets} series (MEV-MAV). Zona óptima.`;
            }

            // Tiempo restante de recuperación estimado
            const recoveryRemaining = recoveryPercent >= 100
                ? 0
                : Math.round(estimatedRecoveryHours - hoursSinceTraining);

            muscleData[mg.id] = {
                ...mg,
                weeklySets,
                mev, mav, mrv,
                volumeRatio: Math.round(volumeRatio),
                lastTrainedDate,
                hoursSinceTraining: Math.round(hoursSinceTraining),
                avgRPE: rpeCount > 0 ? (totalRPE / rpeCount).toFixed(1) : '-',
                avgRIR: rirCount > 0 ? (totalRIR / rirCount).toFixed(1) : '-',
                recoveryPercent: Math.round(recoveryPercent),
                recoveryRemaining: Math.max(recoveryRemaining, 0),
                fatigueScore,
                zone, color, label,
                suggestion
            };
        });

        return muscleData;
    }

    /**
     * Genera sugerencias de ajuste para los músculos del día de hoy
     * @param {string[]} todayMuscles - Nombres en español de los músculos del día
     * @returns {Array} Sugerencias con nivel y acción
     */
    function getSuggestionsForToday(todayMuscles) {
        const fatigueData = calculateMuscleFatigue();
        const suggestions = [];

        todayMuscles.forEach(muscleName => {
            const englishId = MUSCLE_MAP[muscleName];
            const data = fatigueData[englishId];
            if (!data || data.zone === 'rest') return;

            if (data.zone === 'overreached') {
                suggestions.push({
                    muscle: muscleName, level: 'danger',
                    action: `Reduce ${muscleName} -2 series hoy (fatiga ${data.fatigueScore}%)`
                });
            } else if (data.zone === 'fatigued' && data.weeklySets >= data.mav) {
                suggestions.push({
                    muscle: muscleName, level: 'warning',
                    action: `${muscleName} cargado (${data.weeklySets}/${data.mrv} series). Modera intensidad.`
                });
            } else if (data.zone === 'fresh' && data.weeklySets < data.mev) {
                suggestions.push({
                    muscle: muscleName, level: 'opportunity',
                    action: `${muscleName} fresco. Puedes añadir +2 series extra hoy.`
                });
            }
        });

        return suggestions;
    }

    /**
     * Obtiene resumen global de fatiga
     * @returns {Object} { avgScore, zone, color, label, musclesOverMRV, musclesBelowMEV }
     */
    function getGlobalSummary() {
        const data = calculateMuscleFatigue();
        const entries = Object.values(data).filter(d => d.zone !== 'rest');

        if (entries.length === 0) {
            return { avgScore: 0, zone: 'rest', color: '#6B7280', label: 'Sin datos', musclesOverMRV: 0, musclesBelowMEV: 0 };
        }

        const avgScore = Math.round(entries.reduce((s, d) => s + d.fatigueScore, 0) / entries.length);
        const musclesOverMRV = entries.filter(d => d.weeklySets >= d.mrv).length;
        const musclesBelowMEV = entries.filter(d => d.weeklySets > 0 && d.weeklySets < d.mev).length;

        let zone, color, label;
        if (avgScore <= 25) { zone = 'fresh'; color = '#10B981'; label = 'Fresco'; }
        else if (avgScore <= 50) { zone = 'loaded'; color = '#F59E0B'; label = 'Cargado'; }
        else if (avgScore <= 75) { zone = 'fatigued'; color = '#EF4444'; label = 'Fatigado'; }
        else { zone = 'overreached'; color = '#7C3AED'; label = 'Sobrecarga'; }

        return { avgScore, zone, color, label, musclesOverMRV, musclesBelowMEV };
    }

    return {
        calculateMuscleFatigue,
        getSuggestionsForToday,
        getGlobalSummary,
        MUSCLE_MAP,
        MUSCLE_MAP_INV,
        MUSCLE_GROUPS
    };
})();

if (typeof window !== 'undefined') {
    window.FatigueHeatmap = FatigueHeatmap;
}
