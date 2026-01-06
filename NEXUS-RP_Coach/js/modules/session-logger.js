/**
 * NEXUS-RP Coach - Módulo de Registro de Sesiones
 * Inspirado en RP Hypertrophy App
 * 
 * Permite registrar cada sesión de entrenamiento con:
 * - Ejercicio, peso, reps, RPE
 * - Calificación general
 * - Historial persistente en LocalStorage
 */

const SessionLoggerModule = (() => {
    const STORAGE_KEY = 'rpCoach_session_logs';
    const EXERCISES_KEY = 'rpCoach_exercise_library';

    // Biblioteca de ejercicios por grupo muscular
    const DEFAULT_EXERCISES = {
        chest: [
            'Press Banca', 'Press Inclinado', 'Press Declinado',
            'Aperturas', 'Cruces en Polea', 'Fondos', 'Pullover'
        ],
        back: [
            'Peso Muerto', 'Remo con Barra', 'Remo T', 'Jalón al Pecho',
            'Remo en Polea', 'Dominadas', 'Pullover', 'Remo Unilateral'
        ],
        shoulders: [
            'Press Militar', 'Press Arnold', 'Elevaciones Laterales',
            'Elevaciones Frontales', 'Pájaro', 'Face Pull', 'Encogimientos'
        ],
        quadriceps: [
            'Sentadilla', 'Prensa', 'Hack Squat', 'Extensión de Pierna',
            'Sentadilla Búlgara', 'Zancadas', 'Sentadilla Frontal'
        ],
        hamstrings: [
            'Curl Femoral', 'Peso Muerto Rumano', 'Buenos Días',
            'Curl Femoral Sentado', 'Hip Thrust'
        ],
        biceps: [
            'Curl con Barra', 'Curl Alterno', 'Curl Martillo',
            'Curl en Banco Scott', 'Curl en Polea', 'Curl Concentrado'
        ],
        triceps: [
            'Press Francés', 'Extensión en Polea', 'Fondos en Banco',
            'Press Cerrado', 'Patada de Tríceps', 'Extensión Overhead'
        ],
        calves: [
            'Elevación de Talones de Pie', 'Elevación de Talones Sentado',
            'Elevación en Prensa', 'Gemelo Unilateral'
        ],
        abs: [
            'Crunch', 'Plancha', 'Rueda Abdominal', 'Leg Raises',
            'Cable Crunch', 'Oblicuo con Cable'
        ]
    };

    /**
     * Estructura de un registro de sesión
     */
    function createSessionLog(data) {
        return {
            id: generateId(),
            date: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            }),
            muscleGroup: data.muscleGroup || '',
            exercise: data.exercise || '',
            sets: data.sets || [],
            totalVolume: calculateTotalVolume(data.sets || []),
            overallRating: data.overallRating || 0,
            notes: data.notes || '',
            methodology: data.methodology || '',
            weekNumber: data.weekNumber || 1
        };
    }

    /**
     * Estructura de un set individual
     */
    function createSet(weight, reps, rpe, technique = 'normal') {
        return {
            weight: parseFloat(weight) || 0,
            reps: parseInt(reps) || 0,
            rpe: parseFloat(rpe) || 0,
            rir: 10 - (parseFloat(rpe) || 0),
            technique,
            volume: (parseFloat(weight) || 0) * (parseInt(reps) || 0)
        };
    }

    /**
     * Genera un ID único
     */
    function generateId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Calcula el volumen total de una lista de sets
     */
    function calculateTotalVolume(sets) {
        return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
    }

    /**
     * Obtiene todos los logs guardados
     */
    function getAllLogs() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Guarda un nuevo log de sesión
     */
    function saveLog(logData) {
        const logs = getAllLogs();
        const newLog = createSessionLog(logData);
        logs.push(newLog);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        return newLog;
    }

    /**
     * Elimina un log por ID
     */
    function deleteLog(logId) {
        const logs = getAllLogs().filter(log => log.id !== logId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    /**
     * Obtiene los logs de un ejercicio específico
     */
    function getLogsByExercise(exerciseName) {
        return getAllLogs().filter(log =>
            log.exercise.toLowerCase() === exerciseName.toLowerCase()
        );
    }

    /**
     * Obtiene los logs de un grupo muscular
     */
    function getLogsByMuscleGroup(muscleGroup) {
        return getAllLogs().filter(log => log.muscleGroup === muscleGroup);
    }

    /**
     * Obtiene los logs de los últimos N días
     */
    function getLogsFromLastDays(days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return getAllLogs().filter(log =>
            new Date(log.date) >= cutoff
        );
    }

    /**
     * Obtiene el último log de un ejercicio (para sobrecarga progresiva)
     */
    function getLastLogForExercise(exerciseName) {
        const logs = getLogsByExercise(exerciseName);
        if (logs.length === 0) return null;

        return logs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    /**
     * Calcula el volumen semanal por grupo muscular
     */
    function getWeeklyVolumeByMuscle(weeksAgo = 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (7 * (weeksAgo + 1)));
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (7 * weeksAgo));

        const weekLogs = getAllLogs().filter(log => {
            const logDate = new Date(log.date);
            return logDate >= startDate && logDate < endDate;
        });

        const volumeByMuscle = {};
        weekLogs.forEach(log => {
            if (!volumeByMuscle[log.muscleGroup]) {
                volumeByMuscle[log.muscleGroup] = {
                    sets: 0,
                    totalVolume: 0,
                    sessions: 0
                };
            }
            volumeByMuscle[log.muscleGroup].sets += log.sets.length;
            volumeByMuscle[log.muscleGroup].totalVolume += log.totalVolume;
            volumeByMuscle[log.muscleGroup].sessions += 1;
        });

        return volumeByMuscle;
    }

    /**
     * Obtiene el PR (record personal) de un ejercicio
     */
    function getPRForExercise(exerciseName) {
        const logs = getLogsByExercise(exerciseName);
        if (logs.length === 0) return null;

        let maxWeight = 0;
        let maxVolume = 0;
        let maxReps = 0;

        logs.forEach(log => {
            log.sets.forEach(set => {
                if (set.weight > maxWeight) maxWeight = set.weight;
                if (set.reps > maxReps) maxReps = set.reps;
            });
            if (log.totalVolume > maxVolume) maxVolume = log.totalVolume;
        });

        return {
            maxWeight,
            maxReps,
            maxVolume,
            exercise: exerciseName
        };
    }

    /**
     * Obtiene estadísticas generales
     */
    function getStats() {
        const logs = getAllLogs();
        const last30Days = getLogsFromLastDays(30);

        return {
            totalSessions: logs.length,
            last30Days: last30Days.length,
            totalSets: logs.reduce((sum, log) => sum + log.sets.length, 0),
            totalVolume: logs.reduce((sum, log) => sum + log.totalVolume, 0),
            averageRating: logs.length > 0
                ? (logs.reduce((sum, log) => sum + log.overallRating, 0) / logs.length).toFixed(1)
                : 0
        };
    }

    /**
     * Obtiene ejercicios por grupo muscular
     */
    function getExercisesForMuscle(muscleGroup) {
        // Primero intentar obtener ejercicios personalizados
        const customExercises = localStorage.getItem(EXERCISES_KEY);
        if (customExercises) {
            const parsed = JSON.parse(customExercises);
            if (parsed[muscleGroup]) {
                return parsed[muscleGroup];
            }
        }
        return DEFAULT_EXERCISES[muscleGroup] || [];
    }

    /**
     * Añade un ejercicio personalizado
     */
    function addCustomExercise(muscleGroup, exerciseName) {
        const stored = localStorage.getItem(EXERCISES_KEY);
        const exercises = stored ? JSON.parse(stored) : { ...DEFAULT_EXERCISES };

        if (!exercises[muscleGroup]) {
            exercises[muscleGroup] = [];
        }

        if (!exercises[muscleGroup].includes(exerciseName)) {
            exercises[muscleGroup].push(exerciseName);
            localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
        }
    }

    /**
     * Limpia todos los logs (con confirmación)
     */
    function clearAllLogs() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Exporta los logs a JSON
     */
    function exportLogs() {
        const logs = getAllLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus_rp_coach_logs_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Importa logs desde JSON
     */
    function importLogs(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            const current = getAllLogs();
            const merged = [...current, ...imported];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return { success: true, imported: imported.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // API Pública
    return {
        createSet,
        saveLog,
        deleteLog,
        getAllLogs,
        getLogsByExercise,
        getLogsByMuscleGroup,
        getLogsFromLastDays,
        getLastLogForExercise,
        getWeeklyVolumeByMuscle,
        getPRForExercise,
        getStats,
        getExercisesForMuscle,
        addCustomExercise,
        clearAllLogs,
        exportLogs,
        importLogs,
        DEFAULT_EXERCISES
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SessionLoggerModule = SessionLoggerModule;
}
