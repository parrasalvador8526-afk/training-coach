/**
 * NEXUS-RP Coach - Controlador Principal
 * 
 * Orquesta todos los módulos y maneja la interfaz de usuario
 */

const RPCoachApp = (() => {
    // Estado de la aplicación
    let state = {
        currentModule: 'dashboard',
        selectedMethodology: 'Y3T',
        currentWeek: 1,
        experienceLevel: 'intermediate'
    };

    /**
     * Inicializa la aplicación
     */
    async function init() {
        console.log('🚀 Iniciando NEXUS-RP Coach...');

        // Cargar estado guardado
        loadState();

        // Inicializar módulos
        await initializeModules();

        // Configurar event listeners
        setupEventListeners();

        // Renderizar vista inicial
        renderCurrentModule();

        console.log('✅ NEXUS-RP Coach inicializado');
    }

    /**
     * Carga el estado guardado del localStorage
     */
    function loadState() {
        const saved = localStorage.getItem('rpCoach_appState');
        if (saved) {
            state = { ...state, ...JSON.parse(saved) };
        }
    }

    /**
     * Guarda el estado actual
     */
    function saveState() {
        localStorage.setItem('rpCoach_appState', JSON.stringify(state));
    }

    /**
     * Inicializa todos los módulos
     */
    async function initializeModules() {
        // Cargar metodologías
        if (window.MethodologiesSyncModule) {
            await MethodologiesSyncModule.loadMethodologies();
            await populateMethodologySelector();
        }
    }

    /**
     * Llena el selector de metodologías
     */
    async function populateMethodologySelector() {
        const selector = document.getElementById('methodology-selector');
        if (!selector) return;

        const methodologies = await MethodologiesSyncModule.getMethodologyList();

        selector.innerHTML = methodologies.map(m =>
            `<option value="${m.id}" ${m.id === state.selectedMethodology ? 'selected' : ''}>
                ${m.name}
            </option>`
        ).join('');
    }

    /**
     * Configura los event listeners
     */
    function setupEventListeners() {
        // Navegación por tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const module = e.currentTarget.dataset.module;
                switchModule(module);
            });
        });

        // Selector de metodología
        const methodSelector = document.getElementById('methodology-selector');
        if (methodSelector) {
            methodSelector.addEventListener('change', (e) => {
                state.selectedMethodology = e.target.value;
                saveState();
                updateModuleWithMethodology();
            });
        }

        // Selector de semana
        const weekSelector = document.getElementById('week-selector');
        if (weekSelector) {
            weekSelector.addEventListener('change', (e) => {
                state.currentWeek = parseInt(e.target.value);
                saveState();
                updateRIRDisplay();
            });
        }

        // Botones de autorregulación
        setupAutoregulationListeners();

        // Formulario de session logger
        setupSessionLoggerListeners();

        // Formulario de sobrecarga progresiva
        setupProgressiveOverloadListeners();
    }

    /**
     * Cambia el módulo activo
     */
    function switchModule(moduleName) {
        state.currentModule = moduleName;
        saveState();

        // Actualizar tabs activas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.module === moduleName);
        });

        // Mostrar/ocultar secciones
        document.querySelectorAll('.module-section').forEach(section => {
            section.classList.toggle('hidden', section.id !== `module-${moduleName}`);
        });

        renderCurrentModule();
    }

    /**
     * Renderiza el módulo actual
     */
    function renderCurrentModule() {
        switch (state.currentModule) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'autoregulation':
                renderAutoregulation();
                break;
            case 'rir':
                renderRIR();
                break;
            case 'volume':
                renderVolume();
                break;
            case 'logger':
                renderSessionLogger();
                break;
            case 'overload':
                renderProgressiveOverload();
                break;
        }
    }

    /**
     * Renderiza el dashboard principal
     */
    function renderDashboard() {
        const container = document.getElementById('dashboard-stats');
        if (!container) return;

        const stats = SessionLoggerModule.getStats();
        const trend = AutoregulationModule.getRecoveryTrend(7);

        container.innerHTML = `
            <div class="stat-box">
                <div class="stat-box__value">${stats.totalSessions}</div>
                <div class="stat-box__label">Sesiones Totales</div>
            </div>
            <div class="stat-box">
                <div class="stat-box__value">${stats.last30Days}</div>
                <div class="stat-box__label">Últimos 30 días</div>
            </div>
            <div class="stat-box">
                <div class="stat-box__value">${stats.totalSets}</div>
                <div class="stat-box__label">Series Totales</div>
            </div>
            <div class="stat-box">
                <div class="stat-box__value">${formatVolume(stats.totalVolume)}</div>
                <div class="stat-box__label">Volumen Total (kg)</div>
            </div>
        `;

        // Mostrar tendencia de recuperación
        const trendContainer = document.getElementById('recovery-trend');
        if (trendContainer) {
            const trendClass = trend.trend === 'EXCELLENT' ? 'success' :
                trend.trend === 'STABLE' ? 'optimal' :
                    trend.trend === 'DECLINING' ? 'warning' : '';

            trendContainer.innerHTML = `
                <div class="status-indicator status-indicator--${trendClass}">
                    ${getTrendIcon(trend.trend)} ${trend.message}
                </div>
            `;
        }

        // Actualizar widgets de autorregulación desde AutoregulationEngine
        updateAutoregulationStatus();

        // Renderizar gráficas de progreso
        if (typeof ProgressChartsModule !== 'undefined') {
            ProgressChartsModule.renderDashboardCharts('dashboard-charts');
        }

        // Renderizar cronómetro de descanso
        if (typeof RestTimerModule !== 'undefined') {
            RestTimerModule.renderTimerUI('timer-section', state.selectedMethodology);
        }
    }

    /**
     * Actualiza los widgets de autorregulación en el Dashboard
     * Conecta con AutoregulationEngine para mostrar fatiga, fase, volumen, etc.
     */
    function updateAutoregulationStatus() {
        if (typeof AutoregulationEngine === 'undefined') {
            console.log('AutoregulationEngine no disponible');
            return;
        }

        // Obtener status desde AutoregulationEngine
        const status = AutoregulationEngine.getStatus();
        const deloadRec = AutoregulationEngine.shouldDeload();
        const currentMethod = window.MethodologyEngine?.methodology;
        const methData = window.MethodologyEngine?.getMethodology(currentMethod);

        // Actualizar fatiga
        const fatigueValue = document.getElementById('fatigue-value');
        const fatigueBar = document.getElementById('fatigue-bar');
        if (fatigueValue && fatigueBar) {
            const fatiguePercent = Math.round(status.fatigue);
            fatigueValue.textContent = `${fatiguePercent}%`;
            fatigueBar.style.width = `${fatiguePercent}%`;

            // Color según nivel de fatiga
            if (fatiguePercent >= 70) {
                fatigueBar.style.background = '#EF4444'; // Rojo
            } else if (fatiguePercent >= 40) {
                fatigueBar.style.background = 'linear-gradient(90deg, #10B981, #F59E0B)';
            } else {
                fatigueBar.style.background = '#10B981'; // Verde
            }
        }

        // Actualizar fase del mesociclo
        const phaseBadge = document.getElementById('mesocycle-phase-badge');
        if (phaseBadge) {
            const phaseNames = {
                accumulation: 'Acumulación',
                intensification: 'Intensificación',
                deload: 'Deload'
            };
            phaseBadge.textContent = phaseNames[status.phase] || status.phase;
        }

        // Actualizar semana actual
        const currentWeekEl = document.getElementById('current-week');
        if (currentWeekEl) {
            currentWeekEl.textContent = status.week || state.currentWeek || 1;
        }

        // Actualizar volumen semanal
        const weeklyVolumeEl = document.getElementById('weekly-volume');
        if (weeklyVolumeEl) {
            weeklyVolumeEl.textContent = status.weeklyVolume || 0;
        }

        // Actualizar recuperación
        const recoveryEl = document.getElementById('recovery-score');
        if (recoveryEl) {
            const recovery = Math.round(100 - status.fatigue);
            recoveryEl.textContent = `${recovery}%`;
        }

        // Mostrar/ocultar recomendación de deload
        const deloadContainer = document.getElementById('deload-recommendation');
        const deloadMessage = document.getElementById('deload-message');
        if (deloadContainer && deloadRec) {
            if (deloadRec.recommended) {
                deloadContainer.classList.remove('hidden');
                if (deloadMessage) {
                    deloadMessage.textContent = deloadRec.reason || 'Tu fatiga acumulada indica que deberías considerar una semana de descarga.';
                }
            } else {
                deloadContainer.classList.add('hidden');
            }
        }

        // Actualizar info de metodología activa
        const methName = document.getElementById('dashboard-methodology-name');
        const methType = document.getElementById('dashboard-methodology-type');
        if (methName && methData) {
            methName.textContent = methData.name || currentMethod;
        }
        if (methType && methData) {
            const typeLabel = methData.type || 'VOLUME';
            const deloadFreq = methData.deload?.frequency || 'Cada 4-6 semanas';
            methType.textContent = `Tipo: ${typeLabel} | Deload: ${deloadFreq}`;
        }
    }

    /**
     * Renderiza el módulo de autorregulación
     */
    function renderAutoregulation() {
        // Los sliders ya están en el HTML, solo actualizamos valores
        updateSliderDisplays();
    }

    /**
     * Configura listeners para autorregulación
     */
    function setupAutoregulationListeners() {
        const sliders = ['pump', 'soreness', 'fatigue'];

        sliders.forEach(name => {
            const slider = document.getElementById(`slider-${name}`);
            const display = document.getElementById(`value-${name}`);

            if (slider && display) {
                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    display.textContent = value;
                    updateSliderLabel(name, value);
                });
            }
        });

        const evalBtn = document.getElementById('btn-evaluate');
        if (evalBtn) {
            evalBtn.addEventListener('click', evaluateAutoregulation);
        }
    }

    /**
     * Evalúa la autorregulación y muestra resultado
     */
    function evaluateAutoregulation() {
        const pump = parseInt(document.getElementById('slider-pump')?.value) || 3;
        const soreness = parseInt(document.getElementById('slider-soreness')?.value) || 3;
        const fatigue = parseInt(document.getElementById('slider-fatigue')?.value) || 3;

        const result = AutoregulationModule.evaluateSession(pump, soreness, fatigue);
        AutoregulationModule.saveEvaluation(result);

        const resultContainer = document.getElementById('autoregulation-result');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="card card--highlight animate-fadeIn">
                    <div class="card__header">
                        <h3 class="card__title">${result.label}</h3>
                        <div class="status-indicator status-indicator--${result.color}">
                            ${result.action}
                        </div>
                    </div>
                    <p>${result.description}</p>
                    ${result.seriesChange !== 0 ? `
                        <p class="mt-2">
                            <strong>Series:</strong> ${result.seriesChange > 0 ? '+' : ''}${result.seriesChange} por grupo
                        </p>
                    ` : ''}
                    ${result.weightChange !== 0 ? `
                        <p>
                            <strong>Peso:</strong> ${result.weightChange > 0 ? '+' : ''}${result.weightChange}%
                        </p>
                    ` : ''}
                </div>
            `;
        }
    }

    /**
     * Renderiza el módulo de RIR dinámico
     */
    function renderRIR() {
        updateRIRDisplay();
    }

    /**
     * Actualiza la visualización de RIR
     */
    function updateRIRDisplay() {
        const config = RIRDynamicModule.getRIRForWeek(state.selectedMethodology, state.currentWeek);

        const rirValue = document.getElementById('rir-value');
        const rirDesc = document.getElementById('rir-description');
        const methodNote = document.getElementById('methodology-note');

        if (rirValue) {
            rirValue.textContent = config.rir;
            rirValue.className = `stat-box__value text-${RIRDynamicModule.getRIRColor(config.rir)}`;
        }

        if (rirDesc) {
            rirDesc.textContent = config.description;
        }

        if (methodNote) {
            methodNote.textContent = config.note;
        }

        // Actualizar indicadores de semana
        updateWeekIndicators();
    }

    /**
     * Actualiza los indicadores visuales de semanas
     */
    function updateWeekIndicators() {
        const progression = RIRDynamicModule.getFullProgression(state.selectedMethodology);
        const container = document.getElementById('week-indicators');

        if (container) {
            container.innerHTML = progression.weeks.map(week => `
                <div class="rir-dot ${week.week === state.currentWeek ? 'active' : ''}">
                    ${week.rir}
                </div>
            `).join('');
        }
    }

    /**
     * Renderiza el módulo de volumen
     */
    function renderVolume() {
        const muscleSelector = document.getElementById('muscle-selector');
        if (!muscleSelector) return;

        const selectedMuscle = muscleSelector.value || 'chest';
        const landmarks = VolumeMEVMRVModule.getVolumeLandmarks(
            selectedMuscle,
            state.experienceLevel,
            state.selectedMethodology
        );

        if (!landmarks) return;

        // Actualizar barra de volumen
        updateVolumeBar(landmarks);

        // Actualizar tabla de valores
        updateVolumeTable(landmarks);
    }

    /**
     * Actualiza la barra visual de volumen
     */
    function updateVolumeBar(landmarks) {
        const bar = document.getElementById('volume-bar');
        if (!bar) return;

        const total = landmarks.MRV;
        const mevWidth = (landmarks.MEV / total * 100);
        const mavWidth = ((landmarks.MAV.high - landmarks.MEV) / total * 100);
        const mrvWidth = ((landmarks.MRV - landmarks.MAV.high) / total * 100);

        bar.innerHTML = `
            <div class="volume-bar__zone volume-bar__mev" style="width: ${mevWidth}%; left: 0;">
                MEV: ${landmarks.MEV}
            </div>
            <div class="volume-bar__zone volume-bar__mav" style="width: ${mavWidth}%; left: ${mevWidth}%;">
                MAV: ${landmarks.MAV.low}-${landmarks.MAV.high}
            </div>
            <div class="volume-bar__zone volume-bar__mrv" style="width: ${mrvWidth}%; left: ${mevWidth + mavWidth}%;">
                MRV: ${landmarks.MRV}
            </div>
        `;
    }

    /**
     * Actualiza la tabla de volumen
     */
    function updateVolumeTable(landmarks) {
        const table = document.getElementById('volume-table');
        if (!table) return;

        table.innerHTML = `
            <tr>
                <th>Zona</th>
                <th>Series/Semana</th>
                <th>Descripción</th>
            </tr>
            <tr>
                <td class="text-warning">MEV</td>
                <td>${landmarks.MEV}</td>
                <td>Mínimo para mantener</td>
            </tr>
            <tr>
                <td class="text-success">MAV</td>
                <td>${landmarks.MAV.low} - ${landmarks.MAV.high}</td>
                <td>Rango óptimo</td>
            </tr>
            <tr>
                <td class="text-danger">MRV</td>
                <td>${landmarks.MRV}</td>
                <td>Máximo recuperable</td>
            </tr>
        `;
    }

    /**
     * Renderiza el session logger
     */
    function renderSessionLogger() {
        const recentLogs = SessionLoggerModule.getLogsFromLastDays(7);
        const container = document.getElementById('recent-logs');

        if (container) {
            if (recentLogs.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay registros recientes</p>';
            } else {
                container.innerHTML = recentLogs.slice(-10).reverse().map(log => `
                    <div class="log-entry">
                        <span class="log-entry__date">${log.dateFormatted}</span>
                        <span class="log-entry__exercise">${log.exercise}</span>
                        <span class="log-entry__data">
                            ${log.sets.length} series · 
                            ${formatVolume(log.totalVolume)} kg
                        </span>
                        <span class="log-entry__rating">
                            ${generateStars(log.overallRating)}
                        </span>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Configura listeners del session logger
     */
    function setupSessionLoggerListeners() {
        const form = document.getElementById('session-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveNewSession();
            });
        }
    }

    /**
     * Guarda una nueva sesión
     */
    function saveNewSession() {
        const exercise = document.getElementById('log-exercise')?.value;
        const weight = parseFloat(document.getElementById('log-weight')?.value);
        const reps = parseInt(document.getElementById('log-reps')?.value);
        const rpe = parseFloat(document.getElementById('log-rpe')?.value);
        const rating = parseInt(document.getElementById('log-rating')?.value);

        if (!exercise || !weight || !reps) {
            alert('Por favor completa los campos requeridos');
            return;
        }

        const log = SessionLoggerModule.saveLog({
            exercise,
            sets: [SessionLoggerModule.createSet(weight, reps, rpe)],
            overallRating: rating,
            methodology: state.selectedMethodology,
            weekNumber: state.currentWeek
        });

        // Limpiar formulario
        document.getElementById('session-form')?.reset();

        // Actualizar vista
        renderSessionLogger();

        // Mostrar confirmación
        showNotification('✅ Sesión guardada correctamente');
    }

    /**
     * Renderiza el módulo de sobrecarga progresiva
     */
    function renderProgressiveOverload() {
        // El formulario está en el HTML
    }

    /**
     * Configura listeners de sobrecarga progresiva
     */
    function setupProgressiveOverloadListeners() {
        const calcBtn = document.getElementById('btn-calculate-overload');
        if (calcBtn) {
            calcBtn.addEventListener('click', calculateOverload);
        }
    }

    /**
     * Calcula la sobrecarga progresiva
     */
    function calculateOverload() {
        const exercise = document.getElementById('overload-exercise')?.value;
        const weight = parseFloat(document.getElementById('overload-weight')?.value);
        const reps = parseInt(document.getElementById('overload-reps')?.value);
        const rpe = parseFloat(document.getElementById('overload-rpe')?.value);
        const targetReps = parseInt(document.getElementById('overload-target-reps')?.value) || reps;
        const targetRIR = parseInt(document.getElementById('overload-target-rir')?.value) || 2;

        if (!exercise || !weight || !reps) {
            alert('Por favor completa los campos requeridos');
            return;
        }

        const result = ProgressiveOverloadModule.calculateNextSession(
            exercise,
            { weight, reps, rpe },
            targetReps,
            targetRIR
        );

        const resultContainer = document.getElementById('overload-result');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="card card--highlight animate-fadeIn">
                    <div class="card__header">
                        <h3 class="card__title">Próxima Sesión</h3>
                        <div class="status-indicator status-indicator--${result.action === 'INCREASE_WEIGHT' ? 'success' : 'optimal'}">
                            ${result.action.replace('_', ' ')}
                        </div>
                    </div>
                    <p class="mb-2">${result.message}</p>
                    <div class="flex gap-2 mt-2">
                        <div class="stat-box">
                            <div class="stat-box__value">${result.recommendation.weight} kg</div>
                            <div class="stat-box__label">Peso Recomendado</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box__value">${result.recommendation.reps}</div>
                            <div class="stat-box__label">Reps Objetivo</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box__value">${result.recommendation.targetRIR}</div>
                            <div class="stat-box__label">RIR Target</div>
                        </div>
                    </div>
                    ${result.recommendation.increment !== 0 ? `
                        <p class="mt-2 text-primary">
                            <strong>Incremento:</strong> ${result.recommendation.increment > 0 ? '+' : ''}${result.recommendation.increment} kg
                        </p>
                    ` : ''}
                </div>
            `;
        }
    }

    /**
     * Actualiza módulos cuando cambia la metodología
     */
    function updateModuleWithMethodology() {
        renderCurrentModule();
        updateRIRDisplay();
    }

    // Utilidades auxiliares
    function formatVolume(volume) {
        if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return Math.round(volume);
    }

    function generateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2;
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '⭐';
        if (halfStar) stars += '✨';
        return stars || '—';
    }

    function getTrendIcon(trend) {
        const icons = {
            'EXCELLENT': '🟢',
            'STABLE': '🔵',
            'DECLINING': '🟡',
            'UNKNOWN': '⚪'
        };
        return icons[trend] || '⚪';
    }

    function updateSliderDisplays() {
        const descriptors = AutoregulationModule.getValueDescriptors();
        ['pump', 'soreness', 'fatigue'].forEach(name => {
            const slider = document.getElementById(`slider-${name}`);
            if (slider) {
                updateSliderLabel(name, parseInt(slider.value));
            }
        });
    }

    function updateSliderLabel(name, value) {
        const descriptors = AutoregulationModule.getValueDescriptors();
        const label = document.getElementById(`label-${name}`);
        if (label && descriptors[name]) {
            label.textContent = descriptors[name][value] || '';
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'alert alert--success animate-fadeIn';
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // API Pública
    return {
        init,
        state,
        switchModule,
        evaluateAutoregulation,
        calculateOverload
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    RPCoachApp.init();
});
