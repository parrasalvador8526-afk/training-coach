/**
 * NEXUS-RP Coach - Módulo RIR Dinámico por Semana
 * Inspirado en RP Hypertrophy App
 * 
 * Dicta el esfuerzo exacto (RIR) según la semana
 * del mesociclo y la metodología seleccionada.
 */

const RIRDynamicModule = (() => {
    // Configuración RIR estándar por semana (mesociclo típico 4-5 semanas)
    const STANDARD_RIR_PROGRESSION = {
        week1: { rir: 3, intensity: '75-80%', description: 'Acumulación inicial - Técnica con reserva' },
        week2: { rir: 2, intensity: '80-85%', description: 'Progresión - Aumentando esfuerzo' },
        week3: { rir: 1, intensity: '85-90%', description: 'Intensificación - Cerca del límite' },
        week4: { rir: 0, intensity: '90-95%', description: 'Peak - Máximo esfuerzo (fallo)' },
        week5: { rir: 4, intensity: '60-70%', description: 'Deload - Recuperación activa' }
    };

    // Configuraciones específicas por metodología
    const METHODOLOGY_RIR_CONFIGS = {
        'HeavyDuty': {
            name: 'Heavy Duty',
            weeks: {
                week1: { rir: 0, intensity: '90-100%', description: 'Siempre al fallo absoluto' },
                week2: { rir: 0, intensity: '90-100%', description: 'Siempre al fallo absoluto' },
                week3: { rir: 0, intensity: '90-100%', description: 'Siempre al fallo absoluto + técnicas' },
                week4: { rir: 5, intensity: '50-60%', description: 'Deload obligatorio' }
            },
            note: 'Heavy Duty siempre trabaja al fallo. El RIR 0 es la norma.'
        },
        'BloodAndGuts': {
            name: 'Blood & Guts',
            weeks: {
                week1: { rir: 1, intensity: '85-90%', description: 'Warm-up sets + 1 working set cercano' },
                week2: { rir: 0, intensity: '90-95%', description: 'Working sets al fallo' },
                week3: { rir: 0, intensity: '95-100%', description: 'Fallo + técnicas de intensidad' },
                week4: { rir: 0, intensity: '95-100%', description: 'Fallo + forced reps' },
                week5: { rir: 4, intensity: '60%', description: 'Deload' }
            },
            note: 'Estilo Dorian Yates - 1 working set al fallo después de warm-ups.'
        },
        'Y3T': {
            name: 'Y3T (Yoda 3 Training)',
            weeks: {
                week1: { rir: 2, intensity: '80-85%', description: 'Semana pesada (6-10 reps)' },
                week2: { rir: 1, intensity: '75-80%', description: 'Semana moderada (10-14 reps)' },
                week3: { rir: 0, intensity: '65-75%', description: 'Semana de aniquilación (15-30 reps)' },
                week4: { rir: 2, intensity: '80-85%', description: 'Reinicio ciclo - Pesada' }
            },
            note: 'Ciclo ondulante de 3 semanas. RIR varía según fase.'
        },
        'GVT': {
            name: 'GVT (German Volume Training)',
            weeks: {
                week1: { rir: 3, intensity: '60%', description: '10x10 con reserva inicial' },
                week2: { rir: 2, intensity: '62.5%', description: '10x10 aumentando intensidad' },
                week3: { rir: 1, intensity: '65%', description: '10x10 cerca del límite' },
                week4: { rir: 0, intensity: '67.5%', description: '10x10 máximo esfuerzo' },
                week5: { rir: 5, intensity: '50%', description: 'Deload - reducir a 5x10' }
            },
            note: 'Alto volumen = RIR más conservador. El peso es fijo pero la fatiga acumula.'
        },
        'DUP': {
            name: 'DUP (Daily Undulating Periodization)',
            weeks: {
                week1: { rir: 3, intensity: 'Variable', description: 'Cada día diferente RIR base' },
                week2: { rir: 2, intensity: 'Variable', description: 'Progresión en todos los días' },
                week3: { rir: 1, intensity: 'Variable', description: 'Intensificación' },
                week4: { rir: 0, intensity: 'Variable', description: 'Peak' },
                week5: { rir: 4, intensity: 'Reducido', description: 'Deload' }
            },
            dailyVariation: {
                strength: 0,    // Día de fuerza siempre al fallo
                hypertrophy: 1, // Día de hipertrofia cerca
                power: 2        // Día de potencia con reserva
            },
            note: 'El RIR varía según el tipo de día dentro de la semana.'
        },
        'DCTraining': {
            name: 'DC Training (Doggcrapp)',
            weeks: {
                week1: { rir: 0, intensity: '90-95%', description: 'Rest-pause al fallo' },
                week2: { rir: 0, intensity: '92-97%', description: 'Aumentar peso si es posible' },
                week3: { rir: 0, intensity: '95-100%', description: 'Máximo esfuerzo' },
                week4: { rir: 5, intensity: '50%', description: 'Cruise/Deload (2 semanas)' }
            },
            note: 'Rest-pause siempre al fallo. Blast & Cruise.'
        },
        'FST7': {
            name: 'FST-7',
            weeks: {
                week1: { rir: 2, intensity: '70-75%', description: 'FST-7 sets con reserva' },
                week2: { rir: 1, intensity: '75-80%', description: 'Aumentando pump' },
                week3: { rir: 0, intensity: '80-85%', description: 'FST-7 sets al fallo' },
                week4: { rir: 0, intensity: '80-85%', description: 'Máximo pump' },
                week5: { rir: 3, intensity: '60%', description: 'Deload - reducir a FST-4' }
            },
            note: 'Los 7 sets finales son para pump, no para RIR extremo.'
        },
        'SST': {
            name: 'SST (Sarcoplasm Stimulating Training)',
            weeks: {
                week1: { rir: 1, intensity: '65-70%', description: 'Múltiples fallos por protocolo' },
                week2: { rir: 0, intensity: '67-72%', description: 'Más fallos por set' },
                week3: { rir: 0, intensity: '70-75%', description: 'Máximo estrés metabólico' },
                week4: { rir: 4, intensity: '50%', description: 'Deload obligatorio' }
            },
            note: 'SST alcanza múltiples fallos por set extendido. El RIR 0 es por fallo, no por peso.'
        },
        'MTUT': {
            name: 'MTUT (Tiempo Bajo Tensión)',
            weeks: {
                week1: { rir: 3, intensity: '40-50%', description: 'Tempo lento con reserva' },
                week2: { rir: 2, intensity: '45-55%', description: 'Aumentando TUT' },
                week3: { rir: 1, intensity: '50-60%', description: 'TUT máximo' },
                week4: { rir: 0, intensity: '55-65%', description: 'Fallo por tensión' },
                week5: { rir: 4, intensity: '40%', description: 'Deload - tempo normal' }
            },
            note: 'El peso es bajo pero el fallo viene por tiempo bajo tensión.'
        },
        '531': {
            name: '5/3/1 (Wendler)',
            weeks: {
                week1: { rir: 3, intensity: '65-75%', description: '5+ reps @ 85%' },
                week2: { rir: 2, intensity: '70-80%', description: '3+ reps @ 90%' },
                week3: { rir: 1, intensity: '75-85%', description: '1+ reps @ 95%' },
                week4: { rir: 5, intensity: '40-60%', description: 'Deload' }
            },
            note: 'El "+" significa AMRAP, pero con buena forma. No grind extremo.'
        },
        'RestPause': {
            name: 'Rest-Pause System',
            weeks: {
                week1: { rir: 1, intensity: '75-80%', description: '2 secuencias rest-pause' },
                week2: { rir: 0, intensity: '77-82%', description: '3 secuencias rest-pause' },
                week3: { rir: 0, intensity: '80-85%', description: '3+ secuencias, técnicas' },
                week4: { rir: 4, intensity: '60%', description: 'Deload - sin rest-pause' }
            },
            note: 'Cada secuencia va al fallo. El RIR se refiere a la serie inicial.'
        }
    };

    /**
     * Obtiene la configuración RIR para una metodología y semana
     * @param {string} methodology - ID de la metodología
     * @param {number} week - Número de semana (1-5)
     * @returns {Object} Configuración RIR
     */
    function getRIRForWeek(methodology, week) {
        const weekKey = `week${Math.min(week, 5)}`;

        if (METHODOLOGY_RIR_CONFIGS[methodology]) {
            const config = METHODOLOGY_RIR_CONFIGS[methodology];
            const weekConfig = config.weeks[weekKey] || STANDARD_RIR_PROGRESSION[weekKey];
            return {
                ...weekConfig,
                methodology: config.name,
                note: config.note
            };
        }

        return {
            ...STANDARD_RIR_PROGRESSION[weekKey],
            methodology: 'Estándar',
            note: 'Progresión estándar de mesociclo.'
        };
    }

    /**
     * Obtiene la progresión completa del mesociclo
     * @param {string} methodology - ID de la metodología
     * @returns {Object} Progresión completa
     */
    function getFullProgression(methodology) {
        const weeks = [];
        const numWeeks = methodology === 'Y3T' ? 4 : 5;

        for (let i = 1; i <= numWeeks; i++) {
            weeks.push({
                week: i,
                ...getRIRForWeek(methodology, i)
            });
        }

        return {
            methodology: METHODOLOGY_RIR_CONFIGS[methodology]?.name || 'Estándar',
            totalWeeks: numWeeks,
            weeks,
            note: METHODOLOGY_RIR_CONFIGS[methodology]?.note || ''
        };
    }

    /**
     * Convierte RIR a RPE
     * @param {number} rir - Repeticiones en Reserva
     * @returns {number} RPE equivalente
     */
    function rirToRPE(rir) {
        return 10 - rir;
    }

    /**
     * Convierte RPE a RIR
     * @param {number} rpe - Rating of Perceived Exertion
     * @returns {number} RIR equivalente
     */
    function rpeToRIR(rpe) {
        return 10 - rpe;
    }

    /**
     * Obtiene el color del indicador según RIR
     * @param {number} rir - Repeticiones en Reserva
     * @returns {string} Clase CSS de color
     */
    function getRIRColor(rir) {
        if (rir >= 4) return 'success';      // Verde - Deload/Fácil
        if (rir >= 2) return 'optimal';      // Azul - Óptimo
        if (rir >= 1) return 'warning';      // Amarillo - Intenso
        return 'critical';                    // Rojo - Fallo
    }

    /**
     * Obtiene descriptor textual del RIR
     * @param {number} rir - Repeticiones en Reserva
     * @returns {string} Descripción
     */
    function getRIRDescription(rir) {
        const descriptions = {
            0: 'Fallo muscular - última rep posible',
            1: 'Una rep más posible - muy cerca del fallo',
            2: 'Dos reps más - esfuerzo considerable',
            3: 'Tres reps más - trabajo moderado',
            4: 'Cuatro+ reps - esfuerzo controlado',
            5: 'Deload - recuperación activa'
        };
        return descriptions[Math.min(rir, 5)] || descriptions[4];
    }

    /**
     * Lista todas las metodologías disponibles
     * @returns {Array} Lista de metodologías
     */
    function getAvailableMethodologies() {
        return Object.entries(METHODOLOGY_RIR_CONFIGS).map(([id, config]) => ({
            id,
            name: config.name,
            note: config.note
        }));
    }

    // API Pública
    return {
        getRIRForWeek,
        getFullProgression,
        rirToRPE,
        rpeToRIR,
        getRIRColor,
        getRIRDescription,
        getAvailableMethodologies,
        STANDARD_RIR_PROGRESSION
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.RIRDynamicModule = RIRDynamicModule;
}
