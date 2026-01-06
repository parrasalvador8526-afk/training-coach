/**
 * NEXUS-RP Coach - Módulo de Volumen MEV → MRV
 * Inspirado en RP Hypertrophy App
 * 
 * Calcula automáticamente el rango de volumen óptimo
 * por grupo muscular: MEV (Mínimo Efectivo) a MRV (Máximo Recuperable)
 */

const VolumeMEVMRVModule = (() => {
    // Volúmenes base por grupo muscular (series semanales)
    // Basados en investigación de Dr. Mike Israetel / Renaissance Periodization
    // VERIFICADO: Datos alineados con RP Strength Volume Landmarks
    // MV = Maintenance Volume (para no perder masa)
    // MEV = Minimum Effective Volume (para crecer)
    // MAV = Maximum Adaptive Volume (zona óptima)
    // MRV = Maximum Recoverable Volume (límite antes de sobreentrenamiento)
    const VOLUME_LANDMARKS = {
        chest: {
            name: 'Pecho',
            icon: '💪',
            MV: 6,     // Mantenimiento
            MEV: 8,    // Mínimo para crecer
            MAV: { low: 12, high: 16 },  // Óptimo
            MRV: 20,   // Máximo recuperable
            notes: 'Pectorales responden bien a volumen moderado-alto',
            frequency: '2-3x/semana',
            recoveryTime: '48-72h'
        },
        back: {
            name: 'Espalda',
            icon: '🔙',
            MEV: 10,
            MAV: { low: 14, high: 18 },
            MRV: 22,
            notes: 'Incluye trabajo de grosor y ancho. Gran masa muscular = más volumen'
        },
        shoulders: {
            name: 'Hombros',
            icon: '🎯',
            MEV: 6,
            MAV: { low: 10, high: 14 },
            MRV: 18,
            notes: 'Deltoides frontales reciben estímulo de press. Laterales necesitan más'
        },
        quadriceps: {
            name: 'Cuádriceps',
            icon: '🦵',
            MEV: 8,
            MAV: { low: 12, high: 16 },
            MRV: 20,
            notes: 'Músculos grandes con alta capacidad de recuperación'
        },
        hamstrings: {
            name: 'Isquiotibiales',
            icon: '🦿',
            MEV: 6,
            MAV: { low: 10, high: 12 },
            MRV: 16,
            notes: 'No contar sentadillas/prensa como volumen directo'
        },
        glutes: {
            name: 'Glúteos',
            icon: '🍑',
            MEV: 0,
            MAV: { low: 4, high: 8 },
            MRV: 12,
            notes: 'MEV puede ser 0 si haces sentadillas y peso muerto'
        },
        calves: {
            name: 'Pantorrillas',
            icon: '🦶',
            MEV: 6,
            MAV: { low: 10, high: 14 },
            MRV: 16,
            notes: 'Alto volumen y frecuencia suelen ser necesarios'
        },
        biceps: {
            name: 'Bíceps',
            icon: '💪',
            MEV: 6,
            MAV: { low: 10, high: 14 },
            MRV: 18,
            notes: 'Reciben estímulo de jalones. Trabajo directo adicional'
        },
        triceps: {
            name: 'Tríceps',
            icon: '💪',
            MEV: 6,
            MAV: { low: 10, high: 14 },
            MRV: 18,
            notes: 'Reciben estímulo de presses. Trabajo directo adicional'
        },
        forearms: {
            name: 'Antebrazos',
            icon: '🤚',
            MEV: 0,
            MAV: { low: 4, high: 8 },
            MRV: 12,
            notes: 'Trabajo indirecto suele ser suficiente'
        },
        abs: {
            name: 'Abdominales',
            icon: '🎯',
            MEV: 0,
            MAV: { low: 6, high: 10 },
            MRV: 16,
            notes: 'Estabilización en compuestos cuenta. Trabajo directo opcional'
        },
        traps: {
            name: 'Trapecios',
            icon: '🔺',
            MEV: 0,
            MAV: { low: 6, high: 10 },
            MRV: 16,
            notes: 'Trabajo indirecto significativo en peso muerto y remos'
        }
    };

    // Ajustes por nivel de experiencia
    const EXPERIENCE_MULTIPLIERS = {
        beginner: {
            label: 'Principiante',
            multiplier: 0.7,
            description: 'Menos volumen necesario - mayor sensibilidad al estímulo'
        },
        intermediate: {
            label: 'Intermedio',
            multiplier: 1.0,
            description: 'Volumen estándar - base de referencia'
        },
        advanced: {
            label: 'Avanzado',
            multiplier: 1.2,
            description: 'Más volumen necesario - mayor tolerancia'
        }
    };

    // Ajustes por metodología
    const METHODOLOGY_ADJUSTMENTS = {
        'HeavyDuty': { factor: 0.3, note: 'Volumen ultra-bajo compensado por intensidad máxima' },
        'BloodAndGuts': { factor: 0.4, note: 'Bajo volumen, alta intensidad' },
        'DCTraining': { factor: 0.4, note: 'Rest-pause = menos series pero más efectivas' },
        'GVT': { factor: 1.3, note: '10x10 = alto volumen de trabajo' },
        'Y3T': { factor: 1.1, note: 'Volumen variable por semana' },
        'FST7': { factor: 1.2, note: '7 sets finales aumentan volumen total' },
        'SST': { factor: 0.8, note: 'Múltiples fallos por set = menos series necesarias' },
        'MTUT': { factor: 0.9, note: 'TUT extremo reduce necesidad de volumen' },
        'DUP': { factor: 1.0, note: 'Volumen estándar' },
        '531': { factor: 0.9, note: 'Énfasis en fuerza, volumen moderado' },
        'RestPause': { factor: 0.6, note: 'Series extendidas = más trabajo por serie' }
    };

    /**
     * Obtiene el multiplicador de volumen dinámicamente desde MethodologyEngine
     * Usa el tipo de metodología (HIT/VOLUME/HYBRID) para calcular el factor
     * @param {string} methodology - ID de la metodología
     * @returns {Object} Factor y nota explicativa
     */
    function getVolumeMultiplierFromEngine(methodology) {
        const methData = window.MethodologyEngine?.getMethodology(methodology);

        if (methData?.type) {
            // Multiplicadores basados en tipo de metodología
            const typeMultipliers = {
                HIT: { factor: 0.35, note: 'Volumen ultra-bajo compensado por intensidad máxima (fallo muscular)' },
                HYBRID: { factor: 0.7, note: 'Volumen moderado con componentes de intensidad y volumen' },
                VOLUME: { factor: 1.0, note: 'Volumen estándar para hipertrofia óptima' }
            };

            const typeConfig = typeMultipliers[methData.type] || typeMultipliers.VOLUME;

            // Ajuste adicional basado en intensidad de la metodología
            let intensityAdjustment = 1.0;
            if (methData.intensity?.includes('máx') || methData.intensity?.includes('fallo')) {
                intensityAdjustment = 0.9; // 10% menos volumen para metodologías de máxima intensidad
            }

            return {
                factor: typeConfig.factor * intensityAdjustment,
                note: `${methData.name}: ${typeConfig.note}`,
                type: methData.type,
                methodologyName: methData.name
            };
        }

        // Fallback a METHODOLOGY_ADJUSTMENTS estático
        return METHODOLOGY_ADJUSTMENTS[methodology] || { factor: 1, note: 'Sin ajuste especial' };
    }

    /**
     * Obtiene los landmarks de volumen para un grupo muscular
     * @param {string} muscleGroup - ID del grupo muscular
     * @param {string} experienceLevel - Nivel de experiencia
     * @param {string} methodology - Metodología seleccionada (opcional)
     * @returns {Object} Volúmenes ajustados
     */
    function getVolumeLandmarks(muscleGroup, experienceLevel = 'intermediate', methodology = null) {
        const base = VOLUME_LANDMARKS[muscleGroup];
        if (!base) {
            return null;
        }

        const expMultiplier = EXPERIENCE_MULTIPLIERS[experienceLevel]?.multiplier || 1;

        // Usar multiplicador dinámico desde MethodologyEngine con fallback
        const methAdjustment = methodology
            ? getVolumeMultiplierFromEngine(methodology)
            : { factor: 1, note: null };

        const totalMultiplier = expMultiplier * methAdjustment.factor;

        return {
            muscleGroup: base.name,
            icon: base.icon,
            MEV: Math.round(base.MEV * totalMultiplier),
            MAV: {
                low: Math.round(base.MAV.low * totalMultiplier),
                high: Math.round(base.MAV.high * totalMultiplier)
            },
            MRV: Math.round(base.MRV * totalMultiplier),
            notes: base.notes,
            adjustments: {
                experience: EXPERIENCE_MULTIPLIERS[experienceLevel]?.label || 'Intermedio',
                methodology: methodology ? METHODOLOGY_ADJUSTMENTS[methodology]?.note : null,
                totalMultiplier: totalMultiplier.toFixed(2)
            }
        };
    }

    /**
     * Determina la zona de volumen actual
     * @param {number} currentVolume - Volumen actual (series)
     * @param {Object} landmarks - Landmarks de volumen
     * @returns {Object} Zona y recomendación
     */
    function evaluateCurrentVolume(currentVolume, landmarks) {
        if (currentVolume < landmarks.MEV) {
            return {
                zone: 'BELOW_MEV',
                label: 'Por debajo del MEV',
                color: 'danger',
                percentage: (currentVolume / landmarks.MRV * 100).toFixed(0),
                recommendation: `Aumenta a mínimo ${landmarks.MEV} series para progresar`
            };
        }

        if (currentVolume <= landmarks.MAV.low) {
            return {
                zone: 'MEV_TO_MAV',
                label: 'Entre MEV y MAV',
                color: 'warning',
                percentage: (currentVolume / landmarks.MRV * 100).toFixed(0),
                recommendation: `Buen punto de partida. Puedes aumentar hasta ${landmarks.MAV.high} series`
            };
        }

        if (currentVolume <= landmarks.MAV.high) {
            return {
                zone: 'MAV_OPTIMAL',
                label: 'Zona MAV Óptima',
                color: 'optimal',
                percentage: (currentVolume / landmarks.MRV * 100).toFixed(0),
                recommendation: 'Volumen óptimo para la mayoría de personas'
            };
        }

        if (currentVolume <= landmarks.MRV) {
            return {
                zone: 'MAV_TO_MRV',
                label: 'Entre MAV y MRV',
                color: 'warning',
                percentage: (currentVolume / landmarks.MRV * 100).toFixed(0),
                recommendation: 'Volumen alto - monitorea recuperación de cerca'
            };
        }

        return {
            zone: 'ABOVE_MRV',
            label: 'Por encima del MRV',
            color: 'critical',
            percentage: 100,
            recommendation: '⚠️ Reduce volumen - riesgo de sobreentrenamiento'
        };
    }

    /**
     * Calcula la progresión de volumen para un mesociclo
     * @param {Object} landmarks - Landmarks de volumen
     * @param {number} weeks - Número de semanas
     * @returns {Array} Progresión semanal
     */
    function calculateVolumeProgression(landmarks, weeks = 4) {
        const progression = [];
        const startVolume = landmarks.MEV;
        const peakVolume = landmarks.MAV.high;
        const weeklyIncrease = (peakVolume - startVolume) / (weeks - 1);

        for (let week = 1; week <= weeks; week++) {
            if (week === weeks) {
                // Deload week
                progression.push({
                    week,
                    volume: Math.round(startVolume * 0.5),
                    phase: 'DELOAD',
                    note: 'Semana de descarga - 50% del volumen inicial'
                });
            } else {
                const volume = Math.round(startVolume + (weeklyIncrease * (week - 1)));
                progression.push({
                    week,
                    volume,
                    phase: week === 1 ? 'MEV' : (week === weeks - 1 ? 'PEAK' : 'PROGRESSION'),
                    note: week === 1 ? 'Inicio en MEV' : `+${Math.round(weeklyIncrease)} series vs semana anterior`
                });
            }
        }

        return progression;
    }

    /**
     * Obtiene todos los grupos musculares disponibles
     * @returns {Array} Lista de grupos
     */
    function getAllMuscleGroups() {
        return Object.entries(VOLUME_LANDMARKS).map(([id, data]) => ({
            id,
            name: data.name,
            icon: data.icon
        }));
    }

    /**
     * Obtener la nota de ajuste por metodología
     * @param {string} methodology - ID de la metodología
     * @returns {Object} Información de ajuste
     */
    function getMethodologyNote(methodology) {
        return METHODOLOGY_ADJUSTMENTS[methodology] || { factor: 1, note: 'Sin ajuste especial' };
    }

    // API Pública
    return {
        getVolumeLandmarks,
        evaluateCurrentVolume,
        calculateVolumeProgression,
        getAllMuscleGroups,
        getMethodologyNote,
        VOLUME_LANDMARKS,
        EXPERIENCE_MULTIPLIERS
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.VolumeMEVMRVModule = VolumeMEVMRVModule;
}
