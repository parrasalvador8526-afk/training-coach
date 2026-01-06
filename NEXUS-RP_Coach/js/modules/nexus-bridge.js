/**
 * NEXUS Integration Bridge
 * Puente de Sincronización Bidireccional NEXUS ↔ RP Coach
 * 
 * Funcionalidades:
 * - Sincronización automática de rutinas
 * - Detección de cambios en tiempo real
 * - Importación inteligente desde NEXUS
 * - Exportación de progreso a NEXUS
 * - Sistema de notificaciones cruzadas
 */

const NEXUSBridge = (() => {
    // Claves de localStorage compartidas
    const KEYS = {
        // Claves de NEXUS principal
        NEXUS_ROUTINE: 'nexus_routine',
        NEXUS_EXPORTED: 'nexus_exported_routine',
        NEXUS_PROFILE: 'nexus_user_profile',
        NEXUS_SETTINGS: 'nexus_settings',

        // Claves de RP Coach
        RP_ROUTINE: 'rpCoach_active_routine',
        RP_PROGRESS: 'rpCoach_progress',
        RP_STATE: 'rpCoach_appState',

        // Claves de sincronización
        SYNC_STATUS: 'nexus_rp_sync_status',
        LAST_SYNC: 'nexus_rp_last_sync',
        PENDING_CHANGES: 'nexus_rp_pending_changes'
    };

    let syncInterval = null;
    let lastRoutineHash = null;

    /**
     * Inicializa el puente de integración
     */
    function init() {
        console.log('🔗 NEXUS Bridge: Inicializando...');

        // Verificar si hay datos de NEXUS disponibles
        checkNEXUSData();

        // Configurar sincronización automática
        startAutoSync();

        // Escuchar cambios en storage (para sincronización entre pestañas)
        window.addEventListener('storage', handleStorageChange);

        console.log('✅ NEXUS Bridge: Listo');
    }

    /**
     * Verifica si hay datos disponibles de NEXUS
     */
    function checkNEXUSData() {
        const nexusRoutine = localStorage.getItem(KEYS.NEXUS_ROUTINE);
        const nexusExported = localStorage.getItem(KEYS.NEXUS_EXPORTED);
        const nexusProfile = localStorage.getItem(KEYS.NEXUS_PROFILE);

        const status = {
            routineAvailable: !!nexusRoutine || !!nexusExported,
            profileAvailable: !!nexusProfile,
            lastCheck: new Date().toISOString()
        };

        localStorage.setItem(KEYS.SYNC_STATUS, JSON.stringify(status));
        return status;
    }

    /**
     * Importa rutina desde NEXUS principal
     * Detecta automáticamente el formato y convierte a formato RP Coach
     */
    function importFromNEXUS() {
        // Intentar múltiples fuentes de datos
        let nexusData = null;
        let source = null;

        // Prioridad 1: Rutina exportada directamente
        const exported = localStorage.getItem(KEYS.NEXUS_EXPORTED);
        if (exported) {
            nexusData = JSON.parse(exported);
            source = 'nexus_exported';
        }

        // Prioridad 2: Rutina activa de NEXUS
        if (!nexusData) {
            const routine = localStorage.getItem(KEYS.NEXUS_ROUTINE);
            if (routine) {
                nexusData = JSON.parse(routine);
                source = 'nexus_routine';
            }
        }

        if (!nexusData) {
            return {
                success: false,
                message: 'No se encontraron datos de NEXUS para importar',
                suggestion: 'Genera una rutina en NEXUS primero'
            };
        }

        // Convertir al formato RP Coach
        const rpRoutine = convertNEXUSToRP(nexusData, source);

        // Guardar en RP Coach
        localStorage.setItem(KEYS.RP_ROUTINE, JSON.stringify(rpRoutine));

        // Registrar sincronización
        updateSyncLog('import', source);

        return {
            success: true,
            routine: rpRoutine,
            source,
            message: `Rutina importada correctamente desde ${source}`
        };
    }

    /**
     * Convierte formato NEXUS al formato RP Coach
     */
    function convertNEXUSToRP(nexusData, source) {
        const routine = {
            id: 'imported_' + Date.now(),
            createdAt: new Date().toISOString(),
            importedFrom: 'NEXUS',
            source,
            methodology: nexusData.metodologia || nexusData.methodology || 'Y3T',
            split: nexusData.split || detectSplit(nexusData),
            experienceLevel: nexusData.nivel || nexusData.level || 'intermediate',
            mesocycleWeeks: nexusData.duracionCiclo || nexusData.weeks || 4,
            currentWeek: nexusData.semanaActual || 1,
            currentDay: 0,
            days: [],
            originalData: nexusData, // Mantener datos originales
            status: 'active'
        };

        // Convertir días/semanas
        if (nexusData.semanas && Array.isArray(nexusData.semanas)) {
            // Formato con semanas
            nexusData.semanas.forEach((semana, weekIdx) => {
                if (semana.dias && Array.isArray(semana.dias)) {
                    semana.dias.forEach((dia, dayIdx) => {
                        routine.days.push(convertDayToRP(dia, weekIdx + 1, dayIdx + 1));
                    });
                }
            });
        } else if (nexusData.dias && Array.isArray(nexusData.dias)) {
            // Formato con días directos
            nexusData.dias.forEach((dia, idx) => {
                routine.days.push(convertDayToRP(dia, 1, idx + 1));
            });
        } else if (nexusData.days && Array.isArray(nexusData.days)) {
            // Formato RP Coach directo
            routine.days = nexusData.days;
        }

        return routine;
    }

    /**
     * Convierte un día de NEXUS a formato RP Coach
     */
    function convertDayToRP(diaData, weekNumber, dayNumber) {
        const day = {
            dayNumber,
            weekNumber,
            name: diaData.nombre || diaData.name || `Día ${dayNumber}`,
            muscles: diaData.grupos || diaData.muscles || [],
            exercises: [],
            completed: false
        };

        // Convertir ejercicios
        const ejercicios = diaData.ejercicios || diaData.exercises || [];
        ejercicios.forEach((ejercicio, idx) => {
            day.exercises.push({
                id: `ex_${Date.now()}_${idx}`,
                name: ejercicio.nombre || ejercicio.name || ejercicio.ejercicio || 'Ejercicio',
                muscleGroup: ejercicio.grupo || ejercicio.muscleGroup || '',
                type: ejercicio.tipo || ejercicio.type || 'compound',
                sets: ejercicio.series || ejercicio.sets || 3,
                targetReps: ejercicio.repeticiones || ejercicio.reps || '8-12',
                targetRIR: ejercicio.rir || ejercicio.RIR || 2,
                restSeconds: parseRestTime(ejercicio.descanso || ejercicio.rest),
                suggestedWeight: ejercicio.peso || ejercicio.weight || null,
                intensifier: ejercicio.intensificador || ejercicio.intensifier || null,
                variantRep: ejercicio.varianteRep || ejercicio.repVariant || null,
                tempo: ejercicio.tempo || null,
                notes: ejercicio.notas || ejercicio.notes || '',
                completed: false,
                setsCompleted: []
            });
        });

        return day;
    }

    /**
     * Exporta progreso de RP Coach a NEXUS
     */
    function exportToNEXUS() {
        const rpRoutine = localStorage.getItem(KEYS.RP_ROUTINE);
        if (!rpRoutine) {
            return { success: false, message: 'No hay rutina activa en RP Coach' };
        }

        const routine = JSON.parse(rpRoutine);

        // Añadir datos de progreso
        const progressData = getProgressSummary();

        const exportData = {
            ...routine,
            progressData,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'RP_Coach'
        };

        localStorage.setItem(KEYS.NEXUS_EXPORTED, JSON.stringify(exportData));
        updateSyncLog('export', 'rp_coach');

        return {
            success: true,
            message: 'Progreso exportado a NEXUS correctamente',
            data: exportData
        };
    }

    /**
     * Obtiene resumen de progreso
     */
    function getProgressSummary() {
        const sessions = JSON.parse(localStorage.getItem('rpCoach_enhanced_sessions') || '[]');
        const logs = JSON.parse(localStorage.getItem('rpCoach_session_logs') || '[]');

        // Calcular estadísticas
        let totalVolume = 0;
        let totalSets = 0;
        let exerciseStats = {};

        [...sessions, ...logs].forEach(session => {
            if (session.exercises) {
                session.exercises.forEach(ex => {
                    const exName = ex.name || ex.exerciseName;
                    if (!exerciseStats[exName]) {
                        exerciseStats[exName] = {
                            maxWeight: 0,
                            maxReps: 0,
                            totalSets: 0,
                            avgPump: 0,
                            pumpCount: 0
                        };
                    }

                    if (ex.sets && Array.isArray(ex.sets)) {
                        ex.sets.forEach(set => {
                            totalSets++;
                            totalVolume += (set.weight || 0) * (set.reps || 0);

                            if (set.weight > exerciseStats[exName].maxWeight) {
                                exerciseStats[exName].maxWeight = set.weight;
                            }
                            if (set.reps > exerciseStats[exName].maxReps) {
                                exerciseStats[exName].maxReps = set.reps;
                            }
                            exerciseStats[exName].totalSets++;
                        });
                    }

                    if (ex.pumpRating) {
                        exerciseStats[exName].avgPump += ex.pumpRating;
                        exerciseStats[exName].pumpCount++;
                    }
                });
            }
        });

        // Calcular promedios de pump
        Object.keys(exerciseStats).forEach(ex => {
            if (exerciseStats[ex].pumpCount > 0) {
                exerciseStats[ex].avgPump =
                    (exerciseStats[ex].avgPump / exerciseStats[ex].pumpCount).toFixed(1);
            }
        });

        return {
            totalVolume,
            totalSets,
            totalSessions: sessions.length + logs.length,
            exerciseStats,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Sincronización automática
     */
    function startAutoSync() {
        if (syncInterval) clearInterval(syncInterval);

        // Verificar cambios cada 30 segundos
        syncInterval = setInterval(() => {
            const currentHash = calculateRoutineHash();
            if (currentHash !== lastRoutineHash) {
                console.log('🔄 NEXUS Bridge: Cambio detectado, sincronizando...');
                lastRoutineHash = currentHash;
                // Notificar cambio
                dispatchSyncEvent('routine_changed');
            }
        }, 30000);
    }

    /**
     * Calcula hash de la rutina para detectar cambios
     */
    function calculateRoutineHash() {
        const nexus = localStorage.getItem(KEYS.NEXUS_ROUTINE) || '';
        const rp = localStorage.getItem(KEYS.RP_ROUTINE) || '';
        return simpleHash(nexus + rp);
    }

    /**
     * Hash simple para detectar cambios
     */
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    /**
     * Maneja cambios en localStorage (sincronización entre pestañas)
     */
    function handleStorageChange(event) {
        if (event.key === KEYS.NEXUS_ROUTINE || event.key === KEYS.NEXUS_EXPORTED) {
            console.log('📡 NEXUS Bridge: Cambio detectado desde otra pestaña');
            dispatchSyncEvent('nexus_updated');
        }
    }

    /**
     * Dispara evento de sincronización
     */
    function dispatchSyncEvent(type) {
        const event = new CustomEvent('nexusBridgeSync', {
            detail: { type, timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Actualiza log de sincronización
     */
    function updateSyncLog(action, source) {
        localStorage.setItem(KEYS.LAST_SYNC, JSON.stringify({
            action,
            source,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Detecta el tipo de split basado en los datos
     */
    function detectSplit(data) {
        const dias = data.dias || data.days || [];
        const numDays = dias.length;

        if (numDays <= 3) return 'full_body';
        if (numDays === 4) return 'upper_lower';
        if (numDays === 5) return 'bro_split';
        if (numDays >= 6) return 'push_pull_legs';

        return 'custom';
    }

    /**
     * Parsea tiempo de descanso
     */
    function parseRestTime(rest) {
        if (typeof rest === 'number') return rest;
        if (!rest) return 90;

        // Intentar parsear formatos comunes
        const match = rest.toString().match(/(\d+)/);
        return match ? parseInt(match[1]) : 90;
    }

    /**
     * Verifica estado de sincronización
     */
    function getSyncStatus() {
        const status = localStorage.getItem(KEYS.SYNC_STATUS);
        const lastSync = localStorage.getItem(KEYS.LAST_SYNC);

        return {
            status: status ? JSON.parse(status) : null,
            lastSync: lastSync ? JSON.parse(lastSync) : null,
            nexusAvailable: checkNEXUSData().routineAvailable
        };
    }

    /**
     * Limpia datos de sincronización
     */
    function clearSyncData() {
        localStorage.removeItem(KEYS.SYNC_STATUS);
        localStorage.removeItem(KEYS.LAST_SYNC);
        localStorage.removeItem(KEYS.PENDING_CHANGES);
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
        checkNEXUSData,
        importFromNEXUS,
        exportToNEXUS,
        getSyncStatus,
        getProgressSummary,
        clearSyncData,
        KEYS
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.NEXUSBridge = NEXUSBridge;
}
