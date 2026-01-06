/**
 * NEXUS-RP Coach - Active Workout Module
 * Sistema de Entrenamiento Guiado en Tiempo Real
 * 
 * Guía al usuario durante el entrenamiento:
 * - Muestra ejercicio actual con sugerencias
 * - Registra cada set individualmente
 * - Proporciona feedback inmediato
 * - Timer automático entre sets
 * - Feedback por ejercicio (pump, joints)
 */

const ActiveWorkout = (() => {
    const STATE_KEY = 'rpCoach_workout_state';

    // Estado del entrenamiento actual
    let workoutState = {
        isActive: false,
        startTime: null,
        currentDayIndex: 0,
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        exercises: [],
        completedSets: [],
        exerciseFeedback: []
    };

    /**
     * Inicia una sesión de entrenamiento
     * Lee directamente de localStorage para ser independiente
     */
    function startWorkout() {
        // Leer rutina directamente de localStorage
        const routineData = localStorage.getItem('rpCoach_active_routine');
        if (!routineData) {
            console.error('No hay rutina activa en localStorage');
            return null;
        }

        let routine;
        try {
            routine = JSON.parse(routineData);
        } catch (e) {
            console.error('Error parseando rutina:', e);
            return null;
        }

        // Encontrar el día actual (el primero no completado)
        const currentDayIndex = routine.currentDayIndex || 0;
        const currentDay = routine.days?.[currentDayIndex];

        if (!currentDay || !currentDay.exercises || currentDay.exercises.length === 0) {
            console.error('No hay ejercicios para el día actual');
            return null;
        }

        // Obtener parámetros de la metodología
        const methodParams = window.MethodologyEngine?.getCurrentParameters() || {};

        workoutState = {
            isActive: true,
            startTime: new Date().toISOString(),
            routineId: routine.id,
            methodology: routine.methodology,
            protocol: routine.protocol,
            currentDayIndex: currentDayIndex,
            dayName: currentDay.name,
            muscles: currentDay.muscles || [],
            weekNumber: routine.currentWeek || 1,
            currentExerciseIndex: 0,
            currentSetNumber: 1,
            exercises: currentDay.exercises.map(ex => ({
                ...ex,
                // Usar parámetros de metodología si no están definidos en ejercicio
                sets: ex.sets || parseInt(methodParams.sets) || 3,
                targetReps: ex.targetReps || methodParams.reps || '8-12',
                targetRIR: ex.targetRIR !== undefined ? ex.targetRIR : (methodParams.rir !== undefined ? methodParams.rir : 2),
                restSeconds: ex.restSeconds || methodParams.rest || 90,
                setsCompleted: [],
                feedback: null
            })),
            completedExercises: 0,
            totalVolume: 0,
            // Parámetros de metodología para referencia
            methodologyParams: methodParams
        };

        saveState();

        console.log('🏋️ Entrenamiento iniciado:', {
            day: workoutState.dayName,
            exercises: workoutState.exercises.length,
            methodology: workoutState.methodology
        });

        return workoutState;
    }

    /**
     * Obtiene el ejercicio actual
     */
    function getCurrentExercise() {
        if (!workoutState.isActive) return null;

        const exercise = workoutState.exercises[workoutState.currentExerciseIndex];
        if (!exercise) return null;

        // Calcular sugerencia de peso
        const lastSet = exercise.setsCompleted.length > 0
            ? exercise.setsCompleted[exercise.setsCompleted.length - 1]
            : null;

        const suggestion = lastSet
            ? calculateNextSetSuggestion(lastSet)
            : getInitialSuggestion(exercise);

        return {
            ...exercise,
            setNumber: workoutState.currentSetNumber,
            totalSets: exercise.sets,
            suggestion,
            isLastSet: workoutState.currentSetNumber >= exercise.sets,
            exerciseNumber: workoutState.currentExerciseIndex + 1,
            totalExercises: workoutState.exercises.length
        };
    }

    /**
     * Obtiene sugerencia inicial basada en historial
     */
    function getInitialSuggestion(exercise) {
        // Intentar obtener del historial usando EnhancedSessionLogger
        if (typeof EnhancedSessionLogger !== 'undefined') {
            const lastLog = EnhancedSessionLogger.getLastLogForExercise(exercise.name);
            if (lastLog && lastLog.sets && lastLog.sets.length > 0) {
                const lastSet = lastLog.sets[0];
                return {
                    weight: lastSet.weight,
                    reps: lastSet.reps,
                    message: `📊 Basado en tu última sesión: ${lastSet.weight}kg x ${lastSet.reps}`
                };
            }
        }

        // Usar peso sugerido por defecto
        return {
            weight: exercise.suggestedWeight || 0,
            reps: parseReps(exercise.targetReps),
            message: '🆕 Primera vez - ajusta según sensaciones'
        };
    }

    /**
     * Calcula sugerencia para el próximo set
     */
    function calculateNextSetSuggestion(lastSet) {
        const { weight, reps, rpe } = lastSet;
        const rir = 10 - rpe;
        const targetRIR = workoutState.exercises[workoutState.currentExerciseIndex].targetRIR;

        let suggestion = { weight, reps, message: '' };

        if (rir > targetRIR + 1) {
            // Mucho margen - subir peso ligeramente
            suggestion.weight = weight + 2.5;
            suggestion.message = '📈 Tienes margen - considera subir peso';
        } else if (rir < targetRIR - 1) {
            // Muy cerca del fallo - bajar peso
            suggestion.weight = Math.max(weight - 2.5, 5);
            suggestion.message = '⚠️ Muy cerca del fallo - considera bajar peso';
        } else if (rir === targetRIR) {
            suggestion.message = '✅ Perfecto - mantén peso y esfuerzo';
        } else {
            suggestion.message = '👍 Buen set - intenta mantener';
        }

        return suggestion;
    }

    /**
     * Registra un set completado
     */
    function completeSet(setData) {
        if (!workoutState.isActive) return null;

        const { weight, reps, rpe, technique = 'normal', notes = '' } = setData;
        const exercise = workoutState.exercises[workoutState.currentExerciseIndex];

        // Crear registro del set
        const setRecord = {
            setNumber: workoutState.currentSetNumber,
            weight: parseFloat(weight) || 0,
            reps: parseInt(reps) || 0,
            rpe: parseFloat(rpe) || 7,
            rir: 10 - (parseFloat(rpe) || 7),
            technique,
            notes,
            timestamp: new Date().toISOString(),
            volume: (parseFloat(weight) || 0) * (parseInt(reps) || 0)
        };

        // Añadir al ejercicio actual
        exercise.setsCompleted.push(setRecord);
        workoutState.totalVolume += setRecord.volume;

        // Generar feedback inmediato
        const feedback = generateSetFeedback(setRecord, exercise.targetRIR);

        // Verificar si hay más sets
        if (workoutState.currentSetNumber < exercise.sets) {
            workoutState.currentSetNumber++;
        } else {
            // Set completado - marcar ejercicio para feedback
            exercise.completed = true;
        }

        saveState();

        return {
            setRecord,
            feedback,
            exerciseCompleted: exercise.completed,
            needsFeedback: exercise.completed
        };
    }

    /**
     * Genera feedback inmediato para el set
     */
    function generateSetFeedback(set, targetRIR) {
        const { rpe, reps, weight } = set;
        const rir = 10 - rpe;

        let feedback = {
            type: 'info',
            icon: '✅',
            message: '',
            suggestion: ''
        };

        if (rir > targetRIR + 2) {
            feedback = {
                type: 'success',
                icon: '💪',
                message: 'Tienes mucho margen',
                suggestion: 'Próximo set: +2.5kg'
            };
        } else if (rir > targetRIR) {
            feedback = {
                type: 'success',
                icon: '👍',
                message: 'Buen esfuerzo',
                suggestion: 'Próximo set: mantén o +1 rep'
            };
        } else if (rir === targetRIR) {
            feedback = {
                type: 'optimal',
                icon: '🎯',
                message: '¡Perfecto!',
                suggestion: 'Justo en el target RIR'
            };
        } else if (rir === targetRIR - 1) {
            feedback = {
                type: 'warning',
                icon: '⚡',
                message: 'Muy cerca del fallo',
                suggestion: 'Próximo set: considera -2.5kg'
            };
        } else {
            feedback = {
                type: 'danger',
                icon: '🔥',
                message: 'Llegaste al fallo',
                suggestion: 'Próximo set: reduce peso 5%'
            };
        }

        return feedback;
    }

    /**
     * Registra feedback del ejercicio (pump, joints)
     */
    function submitExerciseFeedback(feedbackData) {
        if (!workoutState.isActive) return null;

        const { pump, jointComfort, notes = '' } = feedbackData;
        const exercise = workoutState.exercises[workoutState.currentExerciseIndex];

        exercise.feedback = {
            pump: parseInt(pump) || 3,
            jointComfort: parseInt(jointComfort) || 4,
            notes,
            timestamp: new Date().toISOString()
        };

        saveState();
        return exercise.feedback;
    }

    /**
     * Avanza al siguiente ejercicio
     */
    function nextExercise() {
        if (!workoutState.isActive) return null;

        // Verificar si quedan más ejercicios
        if (workoutState.currentExerciseIndex < workoutState.exercises.length - 1) {
            workoutState.currentExerciseIndex++;
            workoutState.currentSetNumber = 1;
            workoutState.completedExercises++;
            saveState();
            return getCurrentExercise();
        }

        // No hay más ejercicios - sesión completa
        return null;
    }

    /**
     * Finaliza el entrenamiento
     */
    function finishWorkout(finalFeedback = {}) {
        if (!workoutState.isActive) return null;

        const endTime = new Date();
        const startTime = new Date(workoutState.startTime);
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

        // Calcular estadísticas
        const stats = calculateWorkoutStats();

        const summary = {
            id: 'workout_' + Date.now(),
            routineId: workoutState.routineId,
            dayName: workoutState.dayName,
            weekNumber: workoutState.weekNumber,
            date: endTime.toISOString(),
            duration: durationMinutes,
            exercises: workoutState.exercises.map(ex => ({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: ex.setsCompleted,
                feedback: ex.feedback
            })),
            stats,
            overallRating: finalFeedback.rating || 0,
            notes: finalFeedback.notes || '',
            newPRs: stats.newPRs
        };

        // Guardar en historial usando EnhancedSessionLogger si está disponible
        if (typeof EnhancedSessionLogger !== 'undefined') {
            workoutState.exercises.forEach(exercise => {
                if (exercise.setsCompleted.length > 0) {
                    EnhancedSessionLogger.addExerciseToSession({
                        exerciseName: exercise.name,
                        muscleGroup: exercise.muscleGroup,
                        sets: exercise.setsCompleted,
                        pumpRating: exercise.feedback?.pump || 3,
                        jointComfort: exercise.feedback?.jointComfort || 4
                    });
                }
            });
        }

        // Actualizar progreso en la rutina
        workoutState.exercises.forEach((exercise, idx) => {
            if (exercise.setsCompleted.length > 0) {
                RoutineGenerator.updateExerciseProgress(
                    workoutState.currentDayIndex,
                    exercise.id,
                    exercise.setsCompleted[exercise.setsCompleted.length - 1]
                );
            }
        });

        // Avanzar al siguiente día en la rutina
        RoutineGenerator.advanceToNextDay();

        // Limpiar estado
        clearState();

        return summary;
    }

    /**
     * Calcula estadísticas del entrenamiento
     */
    function calculateWorkoutStats() {
        const exercises = workoutState.exercises;

        let totalSets = 0;
        let totalReps = 0;
        let totalVolume = 0;
        let avgRPE = 0;
        let avgPump = 0;
        let rpeCount = 0;
        let pumpCount = 0;
        const newPRs = [];

        exercises.forEach(ex => {
            ex.setsCompleted.forEach(set => {
                totalSets++;
                totalReps += set.reps;
                totalVolume += set.volume;
                if (set.rpe) {
                    avgRPE += set.rpe;
                    rpeCount++;
                }
            });

            if (ex.feedback?.pump) {
                avgPump += ex.feedback.pump;
                pumpCount++;
            }

            // Verificar PRs
            const maxWeight = Math.max(...ex.setsCompleted.map(s => s.weight), 0);
            if (maxWeight > 0) {
                // Aquí podrías comparar con historial para detectar PRs
                // Por ahora, simplemente verificamos si es un peso notable
            }
        });

        return {
            totalSets,
            totalReps,
            totalVolume,
            avgRPE: rpeCount > 0 ? (avgRPE / rpeCount).toFixed(1) : 0,
            avgPump: pumpCount > 0 ? (avgPump / pumpCount).toFixed(1) : 0,
            exercisesCompleted: exercises.filter(e => e.completed).length,
            totalExercises: exercises.length,
            newPRs
        };
    }

    /**
     * Obtiene el estado actual del entrenamiento
     */
    function getWorkoutState() {
        return { ...workoutState };
    }

    /**
     * Verifica si hay un entrenamiento activo
     */
    function isWorkoutActive() {
        return workoutState.isActive;
    }

    /**
     * Pausa el entrenamiento (guarda estado)
     */
    function pauseWorkout() {
        saveState();
        return true;
    }

    /**
     * Reanuda un entrenamiento pausado
     */
    function resumeWorkout() {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            workoutState = JSON.parse(saved);
            return workoutState;
        }
        return null;
    }

    /**
     * Cancela el entrenamiento actual
     */
    function cancelWorkout() {
        clearState();
        return true;
    }

    // Helpers
    function parseReps(repString) {
        if (typeof repString === 'number') return repString;
        if (!repString) return 10;

        // Parsear rangos como "8-12" o valores fijos
        const match = repString.match(/(\d+)/);
        return match ? parseInt(match[1]) : 10;
    }

    function saveState() {
        localStorage.setItem(STATE_KEY, JSON.stringify(workoutState));
    }

    function clearState() {
        workoutState = {
            isActive: false,
            startTime: null,
            currentDayIndex: 0,
            currentExerciseIndex: 0,
            currentSetNumber: 1,
            exercises: [],
            completedSets: [],
            exerciseFeedback: []
        };
        localStorage.removeItem(STATE_KEY);
    }

    // Intentar reanudar sesión al cargar
    function init() {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            if (state.isActive) {
                workoutState = state;
                console.log('📋 Sesión de entrenamiento restaurada');
            }
        }
    }

    // Inicializar
    init();

    // API Pública
    return {
        startWorkout,
        getCurrentExercise,
        completeSet,
        submitExerciseFeedback,
        nextExercise,
        finishWorkout,
        getWorkoutState,
        isWorkoutActive,
        pauseWorkout,
        resumeWorkout,
        cancelWorkout
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ActiveWorkout = ActiveWorkout;
}
