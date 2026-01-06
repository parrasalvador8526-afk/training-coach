/**
 * NEXUS-RP Coach - Workout UI Controller
 * Controlador de UI para la sección ENTRENAR
 * 
 * Conecta la interfaz de usuario con los módulos:
 * - MethodologyEngine
 * - RoutineGenerator
 * - ActiveWorkout
 * - NEXUSBridge
 */

const WorkoutUIController = (() => {
    // Referencias a elementos del DOM
    let elements = {};

    /**
     * Inicializa el controlador
     */
    function init() {
        console.log('🎮 WorkoutUIController: Inicializando...');

        // Cachear elementos del DOM
        cacheElements();

        // Configurar event listeners
        setupEventListeners();

        // Inicializar vista
        updateMethodologyPreview();
        updateUIState();

        // Escuchar cambios de metodología
        window.addEventListener('methodologyChange', handleMethodologyChange);
        window.addEventListener('protocolChange', handleProtocolChange);

        console.log('✅ WorkoutUIController: Listo');
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    function cacheElements() {
        elements = {
            // Estados
            noRoutineState: document.getElementById('no-routine-state'),
            activeWorkoutState: document.getElementById('active-workout-state'),

            // Preview de metodología
            previewName: document.getElementById('preview-methodology-name'),
            previewParams: document.getElementById('preview-methodology-params'),

            // Botones principales
            btnCreateRoutine: document.getElementById('btn-create-routine'),
            btnImportNexus: document.getElementById('btn-import-nexus'),
            btnStartWorkout: document.getElementById('btn-start-workout'),

            // Modal crear rutina
            createModal: document.getElementById('create-routine-modal'),
            btnCloseModal: document.getElementById('btn-close-modal'),
            btnCancelRoutine: document.getElementById('btn-cancel-routine'),
            btnGenerateRoutine: document.getElementById('btn-generate-routine'),

            // Selectores del modal
            methodologySelect: document.getElementById('routine-methodology'),
            protocolSelect: document.getElementById('routine-protocol'),
            splitSelect: document.getElementById('routine-split'),
            levelSelect: document.getElementById('routine-level'),
            protocolDescription: document.getElementById('protocol-description'),
            summaryText: document.getElementById('summary-text'),

            // Entrenamiento activo
            currentExerciseName: document.getElementById('current-exercise-name'),
            exerciseProgress: document.getElementById('exercise-progress'),
            setProgress: document.getElementById('set-progress'),
            targetRir: document.getElementById('target-rir'),
            suggestionText: document.getElementById('suggestion-text'),
            workoutWeight: document.getElementById('workout-weight'),
            workoutReps: document.getElementById('workout-reps'),
            workoutRpe: document.getElementById('workout-rpe'),
            workoutRpeValue: document.getElementById('workout-rpe-value'),
            btnCompleteSet: document.getElementById('btn-complete-set'),
            setFeedback: document.getElementById('set-feedback'),
            feedbackIcon: document.getElementById('feedback-icon'),
            feedbackMessage: document.getElementById('feedback-message'),
            feedbackSuggestion: document.getElementById('feedback-suggestion'),
            workoutTimer: document.getElementById('workout-timer'),
            timerCountdown: document.getElementById('timer-countdown'),
            btnSkipTimer: document.getElementById('btn-skip-timer'),
            completedSetsList: document.getElementById('completed-sets-list'),

            // Feedback ejercicio
            exerciseFeedbackModal: document.getElementById('exercise-feedback-modal'),
            feedbackPump: document.getElementById('feedback-pump'),
            feedbackJoints: document.getElementById('feedback-joints'),
            btnSubmitFeedback: document.getElementById('btn-submit-feedback')
        };
    }

    /**
     * Configura event listeners
     */
    function setupEventListeners() {
        // Botón Crear Rutina
        if (elements.btnCreateRoutine) {
            elements.btnCreateRoutine.addEventListener('click', showCreateModal);
        }

        // Botón Importar desde NEXUS
        if (elements.btnImportNexus) {
            elements.btnImportNexus.addEventListener('click', importFromNEXUS);
        }

        // Botón Cerrar Modal
        if (elements.btnCloseModal) {
            elements.btnCloseModal.addEventListener('click', hideCreateModal);
        }

        // Botón Cancelar Rutina
        if (elements.btnCancelRoutine) {
            elements.btnCancelRoutine.addEventListener('click', hideCreateModal);
        }

        // Selector de Metodología en modal
        if (elements.methodologySelect) {
            elements.methodologySelect.addEventListener('change', handleModalMethodologyChange);
        }

        // Selector de Protocolo en modal
        if (elements.protocolSelect) {
            elements.protocolSelect.addEventListener('change', handleModalProtocolChange);
        }

        // Botón Generar Rutina
        if (elements.btnGenerateRoutine) {
            elements.btnGenerateRoutine.addEventListener('click', generateRoutine);
        }

        // Botón Iniciar Entrenamiento
        if (elements.btnStartWorkout) {
            elements.btnStartWorkout.addEventListener('click', startWorkout);
        }

        // RPE Slider
        if (elements.workoutRpe) {
            elements.workoutRpe.addEventListener('input', () => {
                if (elements.workoutRpeValue) {
                    elements.workoutRpeValue.textContent = elements.workoutRpe.value;
                }
            });
        }

        // Botón Completar Set
        if (elements.btnCompleteSet) {
            elements.btnCompleteSet.addEventListener('click', completeSet);
        }

        // Botón Saltar Timer
        if (elements.btnSkipTimer) {
            elements.btnSkipTimer.addEventListener('click', skipTimer);
        }

        // Botón Enviar Feedback
        if (elements.btnSubmitFeedback) {
            elements.btnSubmitFeedback.addEventListener('click', submitFeedbackAndNext);
        }
    }

    /**
     * Actualiza preview de metodología en la pantalla principal
     */
    function updateMethodologyPreview() {
        if (!window.MethodologyEngine) return;

        const params = MethodologyEngine.getCurrentParameters();

        if (elements.previewName) {
            elements.previewName.textContent = `${params.methodology} - ${params.protocol}`;
        }

        if (elements.previewParams) {
            elements.previewParams.textContent =
                `Sets: ${params.sets} | Reps: ${params.reps} | Descanso: ${params.rest}s | RIR: ${params.rir}`;
        }
    }

    /**
     * Muestra el modal de crear rutina
     */
    function showCreateModal() {
        if (elements.createModal) {
            elements.createModal.classList.remove('hidden');
            elements.noRoutineState.classList.add('hidden');

            // Actualizar protocolos según metodología seleccionada
            handleModalMethodologyChange();
        }
    }

    /**
     * Oculta el modal de crear rutina
     */
    function hideCreateModal() {
        if (elements.createModal) {
            elements.createModal.classList.add('hidden');
            elements.noRoutineState.classList.remove('hidden');
        }
    }

    /**
     * Maneja cambio de metodología en el modal
     */
    function handleModalMethodologyChange() {
        const methodologyId = elements.methodologySelect?.value;
        if (!methodologyId || !window.MethodologyEngine) return;

        // Obtener protocolos de la metodología
        const methodologies = MethodologyEngine.EMBEDDED_METHODOLOGIES;
        const methodology = methodologies[methodologyId];

        if (!methodology || !elements.protocolSelect) return;

        // Actualizar selector de protocolos
        elements.protocolSelect.innerHTML = methodology.protocols.map(p =>
            `<option value="${p.id}">${p.name} (${p.reps} reps)</option>`
        ).join('');

        // Actualizar descripción y resumen
        handleModalProtocolChange();
    }

    /**
     * Maneja cambio de protocolo en el modal
     */
    function handleModalProtocolChange() {
        const methodologyId = elements.methodologySelect?.value;
        const protocolId = elements.protocolSelect?.value;

        if (!methodologyId || !window.MethodologyEngine) return;

        const methodologies = MethodologyEngine.EMBEDDED_METHODOLOGIES;
        const methodology = methodologies[methodologyId];

        if (!methodology) return;

        const protocol = methodology.protocols.find(p => p.id === protocolId) || methodology.protocols[0];

        if (!protocol) return;

        // Actualizar descripción
        if (elements.protocolDescription) {
            const restText = Array.isArray(protocol.rest)
                ? protocol.rest.join('→') + 's'
                : protocol.rest + 's';
            elements.protocolDescription.textContent =
                `📋 ${protocol.name}: ${protocol.reps}, ${protocol.sets} sets, descanso ${restText}`;
        }

        // Actualizar resumen
        if (elements.summaryText) {
            const restValue = Array.isArray(protocol.rest) ? protocol.rest[0] : protocol.rest;
            elements.summaryText.textContent =
                `Sets: ${protocol.sets} | Reps: ${protocol.reps} | RIR: ${protocol.rir} | Descanso: ${restValue}s`;
        }
    }

    /**
     * Genera la rutina con los parámetros seleccionados
     */
    function generateRoutine() {
        const methodology = elements.methodologySelect?.value || 'Y3T';
        const protocol = elements.protocolSelect?.value;
        const split = elements.splitSelect?.value || 'push_pull_legs';
        const level = elements.levelSelect?.value || 'intermediate';

        console.log('🔨 Generando rutina:', { methodology, protocol, split, level });

        // Siempre crear rutina básica para asegurar funcionamiento
        const routine = createBasicRoutine(methodology, protocol, split, level);

        console.log('✅ Rutina generada:', routine);

        // Ocultar modal
        if (elements.createModal) {
            elements.createModal.classList.add('hidden');
        }

        // Mostrar estado listo para entrenar
        showReadyToTrainState(routine);

        // Notificar éxito
        showNotification('¡Rutina generada con éxito!', 'success');
    }

    /**
     * Crea una rutina básica (fallback)
     */
    function createBasicRoutine(methodology, protocol, split, level) {
        const methodologies = window.MethodologyEngine?.EMBEDDED_METHODOLOGIES || {};
        const meth = methodologies[methodology] || {};
        const prot = meth.protocols?.find(p => p.id === protocol) || meth.protocols?.[0] || {};

        const routine = {
            id: 'routine_' + Date.now(),
            methodology,
            protocol,
            split,
            level,
            createdAt: new Date().toISOString(),
            parameters: {
                sets: prot.sets || '3-4',
                reps: prot.reps || '8-12',
                rest: prot.rest || 90,
                rir: prot.rir !== undefined ? prot.rir : 2,
                rpe: prot.rpe || '7-8'
            },
            days: generateDaysForSplit(split, methodology, prot)
        };

        // Guardar en localStorage
        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

        return routine;
    }

    /**
     * Genera días según el split seleccionado
     */
    function generateDaysForSplit(split, methodology, protocol) {
        const splits = {
            push_pull_legs: [
                { name: 'Push', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
                { name: 'Pull', muscles: ['Espalda', 'Bíceps'] },
                { name: 'Legs', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] },
                { name: 'Push 2', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
                { name: 'Pull 2', muscles: ['Espalda', 'Bíceps'] },
                { name: 'Legs 2', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] }
            ],
            upper_lower: [
                { name: 'Upper A', muscles: ['Pecho', 'Espalda', 'Hombros'] },
                { name: 'Lower A', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] },
                { name: 'Upper B', muscles: ['Espalda', 'Pecho', 'Brazos'] },
                { name: 'Lower B', muscles: ['Isquiotibiales', 'Cuádriceps', 'Pantorrillas'] }
            ],
            bro_split: [
                { name: 'Pecho', muscles: ['Pecho'] },
                { name: 'Espalda', muscles: ['Espalda'] },
                { name: 'Hombros', muscles: ['Hombros'] },
                { name: 'Piernas', muscles: ['Cuádriceps', 'Isquiotibiales'] },
                { name: 'Brazos', muscles: ['Bíceps', 'Tríceps'] }
            ],
            hit_3day: [
                { name: 'Día A', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
                { name: 'Día B', muscles: ['Espalda', 'Bíceps'] },
                { name: 'Día C', muscles: ['Piernas'] }
            ],
            full_body: [
                { name: 'Full Body A', muscles: ['Pecho', 'Espalda', 'Piernas'] },
                { name: 'Full Body B', muscles: ['Hombros', 'Brazos', 'Piernas'] },
                { name: 'Full Body C', muscles: ['Espalda', 'Pecho', 'Core'] }
            ]
        };

        const days = splits[split] || splits.push_pull_legs;

        return days.map((day, idx) => ({
            dayNumber: idx + 1,
            name: day.name,
            muscles: day.muscles,
            exercises: generateExercisesForMuscles(day.muscles, protocol),
            completed: false
        }));
    }

    /**
     * Genera ejercicios para los grupos musculares
     */
    function generateExercisesForMuscles(muscles, protocol) {
        const exerciseDB = {
            'Pecho': ['Press Banca', 'Press Inclinado', 'Cruces Cable'],
            'Espalda': ['Jalón Dorsal', 'Remo', 'Pullover'],
            'Hombros': ['Press Militar', 'Elevaciones Laterales', 'Face Pulls'],
            'Cuádriceps': ['Sentadilla', 'Prensa', 'Extensiones'],
            'Isquiotibiales': ['Curl Femoral', 'Peso Muerto Rumano'],
            'Glúteos': ['Hip Thrust', 'Sentadilla Sumo'],
            'Bíceps': ['Curl Barra', 'Curl Martillo'],
            'Tríceps': ['Press Francés', 'Extensiones Cable'],
            'Piernas': ['Sentadilla', 'Prensa', 'Curl Femoral'],
            'Brazos': ['Curl Barra', 'Press Francés'],
            'Core': ['Plancha', 'Crunches'],
            'Pantorrillas': ['Elevación Talones']
        };

        const exercises = [];
        muscles.forEach((muscle, muscleIdx) => {
            const muscleExercises = exerciseDB[muscle] || ['Ejercicio Genérico'];
            muscleExercises.slice(0, 2).forEach((exName, exIdx) => {
                exercises.push({
                    id: `ex_${Date.now()}_${muscleIdx}_${exIdx}`,
                    name: exName,
                    muscleGroup: muscle,
                    sets: parseInt(protocol.sets) || 3,
                    targetReps: protocol.reps || '8-12',
                    targetRIR: protocol.rir !== undefined ? protocol.rir : 2,
                    restSeconds: Array.isArray(protocol.rest) ? protocol.rest[0] : (protocol.rest || 90)
                });
            });
        });

        return exercises;
    }

    /**
     * Muestra estado listo para entrenar
     */
    function showReadyToTrainState(routine) {
        // Re-obtener el elemento para asegurar que tenemos la referencia correcta
        const container = document.getElementById('no-routine-state');
        if (!container) {
            console.error('Container no-routine-state no encontrado');
            return;
        }

        // Asegurar que el elemento es visible
        container.classList.remove('hidden');

        // Obtener el nombre de la metodología de forma legible
        const methodologies = window.MethodologyEngine?.EMBEDDED_METHODOLOGIES || {};
        const methName = methodologies[routine.methodology]?.name || routine.methodology;

        container.innerHTML = `
            <div class="card__header">
                <h3 class="card__title">✅ Rutina Lista</h3>
                <span class="rp-badge">${methName}</span>
            </div>
            <p class="mb-2">${routine.days?.length || 0} días de entrenamiento generados</p>
            
            <div class="alert alert--success mb-2">
                <span>📋</span>
                <div>
                    <strong>Próximo: ${routine.days?.[0]?.name || 'Día 1'}</strong>
                    <p>${routine.days?.[0]?.exercises?.length || 0} ejercicios | ${routine.days?.[0]?.muscles?.join(', ') || 'Múltiples grupos'}</p>
                </div>
            </div>

            <button id="btn-start-workout-now" class="btn btn--primary btn--block mt-2" 
                style="font-size: 1.2rem; padding: 1rem; background: linear-gradient(135deg, #10B981, #059669);">
                🚀 INICIAR ENTRENAMIENTO
            </button>
            <button id="btn-view-routine" class="btn btn--secondary btn--block mt-1">
                👁️ Ver Rutina Completa
            </button>
            <button id="btn-new-routine" class="btn btn--secondary btn--block mt-1" style="opacity: 0.7;">
                🔄 Crear Otra Rutina
            </button>
        `;

        // Añadir listeners a los nuevos botones
        document.getElementById('btn-start-workout-now')?.addEventListener('click', startWorkout);
        document.getElementById('btn-new-routine')?.addEventListener('click', () => {
            // Recargar para crear nueva rutina
            localStorage.removeItem('rpCoach_active_routine');
            location.reload();
        });

        console.log('✅ Estado de rutina lista mostrado');
    }

    /**
     * Importa rutina desde NEXUS
     */
    function importFromNEXUS() {
        if (!window.NEXUSBridge) {
            showNotification('Bridge de NEXUS no disponible', 'error');
            return;
        }

        const result = NEXUSBridge.importFromNEXUS();

        if (result.success) {
            showNotification(`Rutina importada: ${result.routine.methodology}`, 'success');
            showReadyToTrainState(result.routine);
        } else {
            showNotification(result.message || 'No se encontraron rutinas en NEXUS', 'warning');
        }
    }

    /**
     * Inicia el entrenamiento
     */
    function startWorkout() {
        console.log('🚀 Iniciando entrenamiento...');

        if (!window.ActiveWorkout) {
            console.error('ActiveWorkout no disponible');
            showNotification('Error: Módulo de entrenamiento no cargado', 'error');
            return;
        }

        // Verificar si hay rutina activa
        const routineData = localStorage.getItem('rpCoach_active_routine');
        if (!routineData) {
            showNotification('Primero debes crear o importar una rutina', 'warning');
            return;
        }

        const workoutState = ActiveWorkout.startWorkout();

        if (workoutState) {
            console.log('✅ Entrenamiento iniciado correctamente', workoutState);
            showActiveWorkoutUI(workoutState);
            updateActiveWorkoutDisplay();
            showNotification(`¡Entrenando ${workoutState.dayName}!`, 'success');
        } else {
            showNotification('Error al iniciar entrenamiento', 'error');
        }
    }

    /**
     * Muestra la UI de entrenamiento activo
     */
    function showActiveWorkoutUI(workoutState) {
        // Ocultar estado de no rutina/rutina lista
        const noRoutineState = document.getElementById('no-routine-state');
        if (noRoutineState) {
            noRoutineState.classList.add('hidden');
        }

        // Mostrar estado de entrenamiento activo
        const activeState = document.getElementById('active-workout-state');
        if (activeState) {
            activeState.classList.remove('hidden');
        } else {
            console.log('Creando UI de entrenamiento activo...');
            // Si no existe el estado activo, crearlo dinámicamente
            createActiveWorkoutUI(workoutState);
        }
    }

    /**
     * Crea la UI de entrenamiento activo dinámicamente si no existe
     */
    function createActiveWorkoutUI(workoutState) {
        const moduleWorkout = document.getElementById('module-workout');
        if (!moduleWorkout) return;

        // Obtener primer ejercicio para mostrar datos
        const firstEx = workoutState.exercises?.[0] || {};
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
        const params = routine.parameters || {};

        // Crear contenedor de entrenamiento activo
        const activeUI = document.createElement('div');
        activeUI.id = 'active-workout-state';
        activeUI.className = 'active-workout-container';

        activeUI.innerHTML = `
            <!-- Header con info del protocolo -->
            <div class="alert alert--info mb-2">
                <span>📋</span>
                <div style="width: 100%;">
                    <strong id="protocol-name">${routine.protocolName || 'Protocolo'}</strong>
                    <p id="protocol-description" style="font-size: 0.85rem; margin-top: 4px;">
                        ${routine.protocolDescription || 'Sigue las instrucciones de la metodología'}
                    </p>
                </div>
            </div>

            <!-- Card principal del ejercicio -->
            <div class="card card--highlight">
                <div class="card__header">
                    <h3 id="current-exercise-name" class="card__title">${firstEx.name || 'Cargando...'}</h3>
                    <span id="exercise-progress" class="rp-badge">1/${workoutState.exercises?.length || 1}</span>
                </div>
                
                <!-- Grupo muscular y tipo -->
                <div class="flex-between mb-2" style="font-size: 0.9rem; color: var(--text-muted);">
                    <span id="muscle-group">🎯 ${firstEx.muscleGroup || ''}</span>
                    <span id="exercise-type">${firstEx.isPrimary ? '⭐ Principal' : '○ Accesorio'}</span>
                </div>

                <!-- Parámetros del protocolo -->
                <div class="module-grid mb-2" style="gap: 8px;">
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-sets" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.sets || params.sets || '3'}</div>
                        <div class="stat-box__label">Sets</div>
                    </div>
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-reps" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.targetReps || params.reps || '8-12'}</div>
                        <div class="stat-box__label">Reps</div>
                    </div>
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-rir" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.targetRIR !== undefined ? firstEx.targetRIR : 2}</div>
                        <div class="stat-box__label">RIR</div>
                    </div>
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-rest" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.restSeconds || params.rest || 90}s</div>
                        <div class="stat-box__label">Descanso</div>
                    </div>
                </div>

                <!-- Tempo si aplica -->
                ${params.tempo ? `
                <div class="alert alert--warning mb-2" style="padding: 8px;">
                    <span>⏱️</span>
                    <span><strong>Tempo:</strong> ${params.tempo} (Concéntrico-Pausa-Excéntrico)</span>
                </div>
                ` : ''}

                <!-- Load si aplica -->
                ${params.load ? `
                <div class="alert mb-2" style="padding: 8px; background: rgba(59, 130, 246, 0.1);">
                    <span>🏋️</span>
                    <span><strong>Carga:</strong> ${params.load}</span>
                </div>
                ` : ''}

                <!-- Progreso de sets -->
                <div class="flex-between mb-2">
                    <span id="set-progress">Set <strong>1</strong> de ${firstEx.sets || 3}</span>
                    <span id="target-rir">RIR → <strong>${firstEx.targetRIR !== undefined ? firstEx.targetRIR : 2}</strong></span>
                </div>

                <!-- Inputs del set -->
                <div class="module-grid">
                    <div class="form-group">
                        <label class="form-label">Peso (kg)</label>
                        <input type="number" id="workout-weight" class="form-input" placeholder="0" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reps realizadas</label>
                        <input type="number" id="workout-reps" class="form-input" placeholder="${getFirstNumber(firstEx.targetReps) || 10}">
                    </div>
                </div>

                <!-- RPE Slider -->
                <div class="form-group mt-2">
                    <label class="form-label flex-between">
                        <span>📊 RPE (Esfuerzo)</span>
                        <span id="workout-rpe-value" class="text-primary">7</span>
                    </label>
                    <input type="range" id="workout-rpe" class="range-slider" min="5" max="10" step="0.5" value="7">
                    <div class="range-value" style="font-size: 0.75rem;">
                        <span>5-Fácil</span>
                        <span>7-8 Moderado</span>
                        <span>10-Fallo</span>
                    </div>
                </div>

                <!-- Intensificadores -->
                <div id="intensifiers-section" class="mt-2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                    <label class="form-label">💪 Técnicas Intensificadoras Usadas:</label>
                    <div id="intensifier-checkboxes" class="intensifier-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
                        ${generateIntensifierCheckboxes(firstEx.availableIntensifiers || params.intensifiers || [])}
                    </div>
                </div>

                <button id="btn-complete-set" class="btn btn--primary btn--block mt-2"
                    style="background: linear-gradient(135deg, #10B981, #059669); font-size: 1.1rem; padding: 1rem;">
                    ✓ SET COMPLETADO
                </button>
            </div>

            <!-- Feedback del set -->
            <div id="set-feedback" class="alert mt-2 hidden">
                <span id="feedback-icon">✅</span>
                <div>
                    <strong id="feedback-message">¡Perfecto!</strong>
                    <p id="feedback-suggestion">Justo en el target RIR</p>
                </div>
            </div>

            <!-- Timer de descanso -->
            <div id="workout-timer" class="card mt-2 hidden" style="text-align: center;">
                <h4>⏱️ Descanso</h4>
                <span id="timer-countdown" class="stat-box__value" style="font-size: 2.5rem; display: block;">02:00</span>
                <p id="timer-rest-type" class="text-muted" style="font-size: 0.85rem;">Descanso estándar</p>
                <button id="btn-skip-timer" class="btn btn--secondary btn--block mt-1">
                    ⏭️ Saltar Timer
                </button>
            </div>

            <!-- Sets completados -->
            <div class="card mt-2">
                <h4>📋 Sets Completados</h4>
                <div id="completed-sets-list" class="mt-1">
                    <p class="text-muted">Aún no has completado sets</p>
                </div>
            </div>

            <!-- Botones de control -->
            <button id="btn-finish-exercise" class="btn btn--secondary btn--block mt-2">
                ⏭️ Terminar Ejercicio
            </button>
            <button id="btn-cancel-workout" class="btn btn--secondary btn--block mt-1" style="opacity: 0.6;">
                ❌ Cancelar Entrenamiento
            </button>
        `;

        moduleWorkout.appendChild(activeUI);

        // Configurar event listeners para los nuevos elementos
        setupActiveWorkoutListeners();

        // Actualizar cache de elementos
        cacheElements();
    }

    /**
     * Genera checkboxes para intensificadores
     */
    function generateIntensifierCheckboxes(intensifiers) {
        if (!intensifiers || intensifiers.length === 0) {
            return '<span class="text-muted">Sin técnicas adicionales para este protocolo</span>';
        }

        return intensifiers.map((int, idx) => `
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <input type="checkbox" class="intensifier-checkbox" value="${int}" id="int-${idx}">
                <span style="font-size: 0.85rem;">${int}</span>
            </label>
        `).join('');
    }

    /**
     * Obtiene el primer número de un string de reps
     */
    function getFirstNumber(repsStr) {
        if (typeof repsStr === 'number') return repsStr;
        if (!repsStr) return 10;
        const match = repsStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 10;
    }

    /**
     * Configura listeners para los elementos de entrenamiento activo
     */
    function setupActiveWorkoutListeners() {
        // RPE Slider
        const rpeSlider = document.getElementById('workout-rpe');
        if (rpeSlider) {
            rpeSlider.addEventListener('input', () => {
                const valueEl = document.getElementById('workout-rpe-value');
                if (valueEl) valueEl.textContent = rpeSlider.value;
            });
        }

        // Botón Completar Set
        const btnComplete = document.getElementById('btn-complete-set');
        if (btnComplete) {
            btnComplete.addEventListener('click', completeSet);
        }

        // Botón Saltar Timer
        const btnSkip = document.getElementById('btn-skip-timer');
        if (btnSkip) {
            btnSkip.addEventListener('click', skipTimer);
        }

        // Botón Terminar Ejercicio
        const btnFinish = document.getElementById('btn-finish-exercise');
        if (btnFinish) {
            btnFinish.addEventListener('click', () => {
                if (window.ActiveWorkout) {
                    const nextEx = ActiveWorkout.nextExercise();
                    if (nextEx) {
                        updateActiveWorkoutDisplay();
                        showNotification(`Siguiente: ${nextEx.name}`, 'info');
                    } else {
                        finishWorkout();
                    }
                }
            });
        }

        // Botón Cancelar
        const btnCancel = document.getElementById('btn-cancel-workout');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                if (confirm('¿Seguro que quieres cancelar el entrenamiento?')) {
                    if (window.ActiveWorkout) ActiveWorkout.cancelWorkout();
                    location.reload();
                }
            });
        }
    }

    /**
     * Actualiza el display del entrenamiento activo
     */
    function updateActiveWorkoutDisplay() {
        if (!window.ActiveWorkout) return;

        const exercise = ActiveWorkout.getCurrentExercise();
        if (!exercise) {
            console.log('No hay ejercicio actual');
            return;
        }

        console.log('📋 Ejercicio actual:', exercise);

        // Obtener parámetros actualizados del protocolo
        const params = window.MethodologyEngine?.getCurrentParameters() || {};
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');

        // Actualizar nombre del ejercicio
        const nameEl = document.getElementById('current-exercise-name');
        if (nameEl) nameEl.textContent = exercise.name;

        // Actualizar grupo muscular
        const muscleEl = document.getElementById('muscle-group');
        if (muscleEl) muscleEl.textContent = `🎯 ${exercise.muscleGroup || ''}`;

        // Actualizar progreso de ejercicio
        const progressEl = document.getElementById('exercise-progress');
        if (progressEl) progressEl.textContent = `${exercise.exerciseNumber}/${exercise.totalExercises}`;

        // Actualizar progreso de set
        const setProgressEl = document.getElementById('set-progress');
        if (setProgressEl) setProgressEl.innerHTML = `Set <strong>${exercise.setNumber}</strong> de ${exercise.totalSets}`;

        // Actualizar RIR target
        const rirEl = document.getElementById('target-rir');
        if (rirEl) rirEl.innerHTML = `RIR → <strong>${exercise.targetRIR !== undefined ? exercise.targetRIR : params.rir || 2}</strong>`;

        // Actualizar parámetros en stat boxes
        const paramSets = document.getElementById('param-sets');
        if (paramSets) paramSets.textContent = exercise.sets || params.sets || '3';

        const paramReps = document.getElementById('param-reps');
        if (paramReps) paramReps.textContent = exercise.targetReps || params.reps || '8-12';

        const paramRir = document.getElementById('param-rir');
        if (paramRir) paramRir.textContent = exercise.targetRIR !== undefined ? exercise.targetRIR : (params.rir || 2);

        const paramRest = document.getElementById('param-rest');
        if (paramRest) {
            const restValue = exercise.restSeconds || params.rest || 90;
            paramRest.textContent = `${restValue}s`;
        }

        // Actualizar tempo si existe (crear/actualizar elemento)
        updateProtocolDetail('tempo-display', '⏱️ Tempo:', params.tempo, 'Concéntrico-Pausa-Excéntrico');

        // Actualizar load si existe
        updateProtocolDetail('load-display', '🏋️ Carga:', params.load);

        // Actualizar failures/tipo de fallo si existe
        updateProtocolDetail('failures-display', '🎯 Fallo:', params.failures);

        // Actualizar intensificadores disponibles
        const intensifiersContainer = document.getElementById('intensifier-checkboxes');
        if (intensifiersContainer && (exercise.availableIntensifiers || params.intensifiers)) {
            intensifiersContainer.innerHTML = generateIntensifierCheckboxes(
                exercise.availableIntensifiers || params.intensifiers || []
            );
        }

        // Actualizar sugerencia
        const suggestionEl = document.getElementById('suggestion-text');
        if (suggestionEl && exercise.suggestion) {
            suggestionEl.textContent = exercise.suggestion.message;
        }

        // Actualizar placeholders
        const weightEl = document.getElementById('workout-weight');
        if (weightEl && exercise.suggestion?.weight) {
            weightEl.placeholder = exercise.suggestion.weight;
        }

        const repsEl = document.getElementById('workout-reps');
        if (repsEl) {
            const targetReps = typeof exercise.targetReps === 'string'
                ? exercise.targetReps.match(/\d+/)?.[0] || '10'
                : exercise.targetReps || 10;
            repsEl.placeholder = targetReps;
        }
    }

    /**
     * Actualiza o crea un elemento de detalle del protocolo
     */
    function updateProtocolDetail(elementId, label, value, suffix = '') {
        let container = document.getElementById(elementId);
        const parent = document.getElementById('active-workout-state')?.querySelector('.card--highlight');

        if (!value) {
            // Si no hay valor, ocultar el elemento si existe
            if (container) container.style.display = 'none';
            return;
        }

        if (!container && parent) {
            // Crear el elemento si no existe
            container = document.createElement('div');
            container.id = elementId;
            container.className = 'alert mb-2';
            container.style.padding = '8px';
            container.style.background = 'rgba(59, 130, 246, 0.1)';

            // Insertar después de los parámetros principales
            const moduleGrid = parent.querySelector('.module-grid');
            if (moduleGrid) {
                moduleGrid.parentNode.insertBefore(container, moduleGrid.nextSibling);
            }
        }

        if (container) {
            container.style.display = 'block';
            container.innerHTML = `<span><strong>${label}</strong> ${value}${suffix ? ` (${suffix})` : ''}</span>`;
        }
    }

    /**
     * Completa un set
     */
    function completeSet() {
        if (!window.ActiveWorkout) return;

        const setData = {
            weight: elements.workoutWeight?.value,
            reps: elements.workoutReps?.value,
            rpe: elements.workoutRpe?.value
        };

        const result = ActiveWorkout.completeSet(setData);

        if (result) {
            // Mostrar feedback
            showSetFeedback(result.feedback);

            // Añadir a lista de sets completados
            addCompletedSetToList(result.setRecord);

            // Limpiar inputs
            if (elements.workoutWeight) elements.workoutWeight.value = '';
            if (elements.workoutReps) elements.workoutReps.value = '';

            if (result.needsFeedback) {
                // Mostrar modal de feedback del ejercicio
                showExerciseFeedbackModal();
            } else {
                // Iniciar timer de descanso
                startRestTimer();
                // Actualizar display
                updateActiveWorkoutDisplay();
            }
        }
    }

    /**
     * Muestra feedback del set
     */
    function showSetFeedback(feedback) {
        if (!elements.setFeedback) return;

        elements.setFeedback.classList.remove('hidden', 'alert--success', 'alert--warning', 'alert--danger', 'alert--info');
        elements.setFeedback.classList.add(`alert--${feedback.type === 'optimal' ? 'success' : feedback.type}`);

        if (elements.feedbackIcon) elements.feedbackIcon.textContent = feedback.icon;
        if (elements.feedbackMessage) elements.feedbackMessage.textContent = feedback.message;
        if (elements.feedbackSuggestion) elements.feedbackSuggestion.textContent = feedback.suggestion;

        // Ocultar después de 3 segundos
        setTimeout(() => {
            elements.setFeedback.classList.add('hidden');
        }, 3000);
    }

    /**
     * Añade set completado a la lista
     */
    function addCompletedSetToList(setRecord) {
        if (!elements.completedSetsList) return;

        // Limpiar mensaje inicial si existe
        if (elements.completedSetsList.querySelector('.text-muted')) {
            elements.completedSetsList.innerHTML = '';
        }

        const setElement = document.createElement('div');
        setElement.className = 'flex-between mb-1 p-1';
        setElement.style.background = 'rgba(16, 185, 129, 0.1)';
        setElement.style.borderRadius = '8px';
        setElement.innerHTML = `
            <span>Set ${setRecord.setNumber}</span>
            <span><strong>${setRecord.weight}kg</strong> x ${setRecord.reps} @ RPE ${setRecord.rpe}</span>
        `;

        elements.completedSetsList.appendChild(setElement);
    }

    /**
     * Inicia timer de descanso
     */
    function startRestTimer() {
        if (!elements.workoutTimer) return;

        // Obtener tiempo de descanso dinámico desde MethodologyEngine
        const currentMethod = window.MethodologyEngine?.methodology;
        const params = window.MethodologyEngine?.getCurrentParameters();
        const exercise = window.ActiveWorkout?.getCurrentExercise();
        const setNumber = exercise?.setNumber || 1;

        // Usar RestTimerModule si está disponible para rest dinámico
        let restConfig;
        if (window.RestTimerModule?.getRestConfig) {
            restConfig = window.RestTimerModule.getRestConfig(currentMethod, setNumber);
        }

        let restSeconds = restConfig?.default || params?.rest || 90;
        let restTypeText = 'Descanso estándar';

        // Manejar rest arrays (SST-RIV variado por set)
        if (restConfig?.isVariableRest && restConfig.restArray) {
            const restIndex = Math.min(setNumber - 1, restConfig.restArray.length - 1);
            restSeconds = restConfig.restArray[restIndex];
            restTypeText = `Descanso progresivo: Set ${setNumber} = ${restSeconds}s`;
        } else if (restConfig?.note) {
            restTypeText = restConfig.note;
        }

        elements.workoutTimer.classList.remove('hidden');

        // Actualizar info del tipo de descanso
        const restTypeEl = document.getElementById('timer-rest-type');
        if (restTypeEl) {
            restTypeEl.textContent = restTypeText;
        }

        const updateTimer = () => {
            const mins = Math.floor(restSeconds / 60);
            const secs = restSeconds % 60;
            if (elements.timerCountdown) {
                elements.timerCountdown.textContent =
                    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            if (restSeconds <= 0) {
                elements.workoutTimer.classList.add('hidden');
                // Notificar que terminó el descanso
                showNotification('¡Tiempo de descanso terminado!', 'info');
            } else {
                restSeconds--;
                setTimeout(updateTimer, 1000);
            }
        };

        updateTimer();
    }

    /**
     * Salta el timer de descanso
     */
    function skipTimer() {
        if (elements.workoutTimer) {
            elements.workoutTimer.classList.add('hidden');
        }
    }

    /**
     * Muestra modal de feedback del ejercicio
     */
    function showExerciseFeedbackModal() {
        if (elements.exerciseFeedbackModal) {
            elements.exerciseFeedbackModal.classList.remove('hidden');
        }
    }

    /**
     * Envía feedback y avanza al siguiente ejercicio
     */
    function submitFeedbackAndNext() {
        if (!window.ActiveWorkout) return;

        const feedback = {
            pump: elements.feedbackPump?.value || 3,
            jointComfort: elements.feedbackJoints?.value || 4
        };

        ActiveWorkout.submitExerciseFeedback(feedback);

        // Ocultar modal
        if (elements.exerciseFeedbackModal) {
            elements.exerciseFeedbackModal.classList.add('hidden');
        }

        // Limpiar lista de sets
        if (elements.completedSetsList) {
            elements.completedSetsList.innerHTML = '<p class="text-muted">Aún no has completado sets</p>';
        }

        // Avanzar al siguiente ejercicio
        const nextExercise = ActiveWorkout.nextExercise();

        if (nextExercise) {
            updateActiveWorkoutDisplay();
            showNotification(`Siguiente: ${nextExercise.name}`, 'info');
        } else {
            // Entrenamiento terminado
            finishWorkout();
        }
    }

    /**
     * Finaliza el entrenamiento
     */
    function finishWorkout() {
        if (!window.ActiveWorkout) return;

        const summary = ActiveWorkout.finishWorkout();

        if (summary) {
            showWorkoutSummary(summary);
        }
    }

    /**
     * Muestra resumen del entrenamiento
     */
    function showWorkoutSummary(summary) {
        if (!elements.activeWorkoutState) return;

        elements.activeWorkoutState.innerHTML = `
            <div class="card card--highlight">
                <div class="card__header">
                    <h3 class="card__title">🎉 ¡Entrenamiento Completado!</h3>
                </div>
                <div class="dashboard-grid">
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.stats.totalSets}</div>
                        <div class="stat-box__label">Sets Totales</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.stats.totalVolume.toLocaleString()}</div>
                        <div class="stat-box__label">Volumen (kg)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.duration}</div>
                        <div class="stat-box__label">Minutos</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.stats.avgRPE}</div>
                        <div class="stat-box__label">RPE Promedio</div>
                    </div>
                </div>
                <button id="btn-new-workout" class="btn btn--primary btn--block mt-2">
                    🔄 Nuevo Entrenamiento
                </button>
            </div>
        `;

        document.getElementById('btn-new-workout')?.addEventListener('click', () => {
            location.reload();
        });
    }

    /**
     * Muestra notificación
     */
    function showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert--${type}`;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.animation = 'fadeIn 0.3s ease';
        notification.innerHTML = `<span>${message}</span>`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Maneja cambio de metodología global
     */
    function handleMethodologyChange(event) {
        updateMethodologyPreview();
    }

    /**
     * Maneja cambio de protocolo global
     */
    function handleProtocolChange(event) {
        updateMethodologyPreview();
    }

    /**
     * Actualiza estado de la UI según datos existentes
     */
    function updateUIState() {
        // Verificar si hay rutina activa
        const routine = localStorage.getItem('rpCoach_active_routine');
        if (routine) {
            const parsedRoutine = JSON.parse(routine);
            showReadyToTrainState(parsedRoutine);
        }

        // Verificar si hay entrenamiento en progreso
        if (window.ActiveWorkout?.isWorkoutActive()) {
            showActiveWorkoutUI();
            updateActiveWorkoutDisplay();
        }
    }

    // Inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API Pública
    return {
        init,
        showCreateModal,
        hideCreateModal,
        generateRoutine,
        startWorkout,
        updateUIState
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.WorkoutUIController = WorkoutUIController;
}
