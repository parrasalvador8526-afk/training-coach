/**
 * NEXUS-RP Coach - Módulo de Cronómetro de Descanso
 * 
 * Timer inteligente con configuraciones por metodología
 */

const RestTimerModule = (() => {
    // Tiempos de descanso por metodología (en segundos)
    const REST_CONFIG = {
        'HeavyDuty': { min: 180, default: 240, max: 300, note: 'Descansos largos para máxima recuperación' },
        'BloodAndGuts': { min: 120, default: 180, max: 240, note: 'Recuperación moderada-alta' },
        'DCTraining': { min: 60, default: 90, max: 120, note: 'Rest-pause requiere descansos cortos' },
        '531': { min: 180, default: 240, max: 300, note: 'Fuerza requiere descansos amplios' },
        'Y3T': { min: 60, default: 120, max: 180, note: 'Variable según semana del ciclo' },
        'GVT': { min: 60, default: 90, max: 120, note: '10x10 con descansos cortos' },
        'DUP': { min: 90, default: 150, max: 210, note: 'Variable según día' },
        'FST7': { min: 30, default: 45, max: 60, note: 'Fascia stretch = descansos mínimos' },
        'SST': { min: 30, default: 60, max: 90, note: 'Sarcoplasma = poco descanso' },
        'MTUT': { min: 90, default: 120, max: 180, note: 'TUT extremo requiere recuperación' },
        'RestPause': { min: 10, default: 20, max: 30, note: 'Rest-pause intra-set' },
        'default': { min: 90, default: 120, max: 180, note: 'Descanso estándar' }
    };

    /**
     * Obtiene el tiempo de descanso dinámicamente desde MethodologyEngine
     * Soporta tiempos variables (arrays) para protocolos como SST-RIV
     * @param {string} methodology - ID de la metodología
     * @param {number} setNumber - Número de set actual (para rest arrays)
     * @returns {Object} Configuración de descanso dinámica
     */
    function getRestFromMethodology(methodology, setNumber = 1) {
        // Intentar obtener desde MethodologyEngine
        const params = window.MethodologyEngine?.getCurrentParameters();
        const methData = window.MethodologyEngine?.getMethodology(methodology);

        if (params?.rest) {
            // Manejar rest array (SST-RIV: [10, 20, 30])
            if (Array.isArray(params.rest)) {
                const restIndex = Math.min(setNumber - 1, params.rest.length - 1);
                const restValue = params.rest[restIndex];
                return {
                    min: Math.round(restValue * 0.5),
                    default: restValue,
                    max: Math.round(restValue * 1.5),
                    note: `${methData?.name || methodology}: Descanso variable por set`,
                    isVariableRest: true,
                    restArray: params.rest
                };
            }

            // Rest único (número o string)
            const restSeconds = typeof params.rest === 'string'
                ? parseInt(params.rest.split('-')[0])
                : params.rest;

            return {
                min: Math.round(restSeconds * 0.7),
                default: restSeconds,
                max: Math.round(restSeconds * 1.3),
                note: methData?.philosophy?.substring(0, 80) || `Descanso para ${methData?.name || methodology}`
            };
        }

        // Fallback a REST_CONFIG
        return REST_CONFIG[methodology] || REST_CONFIG.default;
    }

    // Estado del timer
    let timerState = {
        isRunning: false,
        remainingSeconds: 0,
        initialSeconds: 0,
        intervalId: null,
        onComplete: null
    };

    /**
     * Obtiene la configuración de descanso para una metodología
     * Ahora usa MethodologyEngine dinámicamente con fallback
     */
    function getRestConfig(methodology, setNumber = 1) {
        // Primero intentar desde MethodologyEngine
        const dynamicConfig = getRestFromMethodology(methodology, setNumber);
        if (dynamicConfig) {
            return dynamicConfig;
        }
        // Fallback a config estática
        return REST_CONFIG[methodology] || REST_CONFIG.default;
    }

    /**
     * Inicia el timer
     */
    function start(seconds, onComplete = null, onTick = null) {
        stop(); // Detener cualquier timer anterior

        timerState.isRunning = true;
        timerState.initialSeconds = seconds;
        timerState.remainingSeconds = seconds;
        timerState.onComplete = onComplete;

        updateDisplay();

        timerState.intervalId = setInterval(() => {
            timerState.remainingSeconds--;

            if (onTick) {
                onTick(timerState.remainingSeconds);
            }

            updateDisplay();

            if (timerState.remainingSeconds <= 0) {
                complete();
            }
        }, 1000);
    }

    /**
     * Pausa el timer
     */
    function pause() {
        if (timerState.intervalId) {
            clearInterval(timerState.intervalId);
            timerState.intervalId = null;
        }
        timerState.isRunning = false;
        updateDisplay();
    }

    /**
     * Reanuda el timer
     */
    function resume() {
        if (!timerState.isRunning && timerState.remainingSeconds > 0) {
            timerState.isRunning = true;
            timerState.intervalId = setInterval(() => {
                timerState.remainingSeconds--;
                updateDisplay();
                if (timerState.remainingSeconds <= 0) {
                    complete();
                }
            }, 1000);
        }
    }

    /**
     * Detiene el timer
     */
    function stop() {
        if (timerState.intervalId) {
            clearInterval(timerState.intervalId);
            timerState.intervalId = null;
        }
        timerState.isRunning = false;
        timerState.remainingSeconds = 0;
        updateDisplay();
    }

    /**
     * Añade tiempo al timer
     */
    function addTime(seconds) {
        timerState.remainingSeconds += seconds;
        updateDisplay();
    }

    /**
     * Completa el timer
     */
    function complete() {
        stop();
        playNotification();
        if (timerState.onComplete) {
            timerState.onComplete();
        }
    }

    /**
     * Formatea segundos a MM:SS
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Actualiza el display del timer
     */
    function updateDisplay() {
        const display = document.getElementById('timer-display');
        const progress = document.getElementById('timer-progress');
        const btn = document.getElementById('timer-toggle');

        if (display) {
            display.textContent = formatTime(timerState.remainingSeconds);
            display.classList.toggle('timer--warning', timerState.remainingSeconds <= 10 && timerState.remainingSeconds > 0);
        }

        if (progress && timerState.initialSeconds > 0) {
            const percent = ((timerState.initialSeconds - timerState.remainingSeconds) / timerState.initialSeconds) * 100;
            progress.style.width = `${percent}%`;
        }

        if (btn) {
            btn.textContent = timerState.isRunning ? '⏸️ Pausar' : '▶️ Continuar';
        }
    }

    /**
     * Reproduce notificación de audio/visual
     */
    function playNotification() {
        // Vibración si está disponible
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Notificación visual
        const container = document.getElementById('timer-container');
        if (container) {
            container.classList.add('timer--complete');
            setTimeout(() => container.classList.remove('timer--complete'), 3000);
        }

        // Intentar reproducir sonido (beep simple)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            setTimeout(() => oscillator.stop(), 300);
        } catch (e) {
            console.log('Audio notification not available');
        }
    }

    /**
     * Obtiene el estado actual
     */
    function getState() {
        return { ...timerState };
    }

    /**
     * Renderiza la UI del timer
     */
    function renderTimerUI(containerId, methodology = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const config = getRestConfig(methodology);

        container.innerHTML = `
            <div id="timer-container" class="timer-card">
                <div class="timer-header">
                    <span class="timer-title">⏱️ Cronómetro de Descanso</span>
                    <span class="timer-methodology">${config.note}</span>
                </div>
                
                <div class="timer-display-wrapper">
                    <div id="timer-progress" class="timer-progress"></div>
                    <div id="timer-display" class="timer-display">02:00</div>
                </div>

                <div class="timer-presets">
                    <button class="timer-preset" data-seconds="${config.min}">
                        ${formatTime(config.min)}<br><small>Min</small>
                    </button>
                    <button class="timer-preset active" data-seconds="${config.default}">
                        ${formatTime(config.default)}<br><small>Rec</small>
                    </button>
                    <button class="timer-preset" data-seconds="${config.max}">
                        ${formatTime(config.max)}<br><small>Max</small>
                    </button>
                    <button class="timer-preset" data-seconds="custom">
                        ⚙️<br><small>Custom</small>
                    </button>
                </div>

                <div class="timer-controls">
                    <button id="timer-start" class="btn btn--primary">▶️ Iniciar</button>
                    <button id="timer-toggle" class="btn btn--secondary" style="display:none;">⏸️ Pausar</button>
                    <button id="timer-add30" class="btn btn--secondary">+30s</button>
                    <button id="timer-stop" class="btn btn--danger">⏹️ Reset</button>
                </div>
            </div>
        `;

        // Event listeners
        const presets = container.querySelectorAll('.timer-preset');
        let selectedSeconds = config.default;

        presets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const seconds = e.currentTarget.dataset.seconds;
                if (seconds !== 'custom') {
                    selectedSeconds = parseInt(seconds);
                    presets.forEach(p => p.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    document.getElementById('timer-display').textContent = formatTime(selectedSeconds);
                }
            });
        });

        document.getElementById('timer-start')?.addEventListener('click', () => {
            start(selectedSeconds, () => {
                showTimerNotification('¡Tiempo de descanso terminado! 💪');
            });
            document.getElementById('timer-start').style.display = 'none';
            document.getElementById('timer-toggle').style.display = 'inline-block';
        });

        document.getElementById('timer-toggle')?.addEventListener('click', () => {
            if (timerState.isRunning) {
                pause();
            } else {
                resume();
            }
        });

        document.getElementById('timer-add30')?.addEventListener('click', () => addTime(30));

        document.getElementById('timer-stop')?.addEventListener('click', () => {
            stop();
            document.getElementById('timer-start').style.display = 'inline-block';
            document.getElementById('timer-toggle').style.display = 'none';
            document.getElementById('timer-display').textContent = formatTime(selectedSeconds);
        });

        // Inicializar display
        document.getElementById('timer-display').textContent = formatTime(config.default);
    }

    function showTimerNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'timer-notification animate-fadeIn';
        notification.innerHTML = `
            <div class="timer-notification__content">
                <span class="timer-notification__icon">⏰</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    // API Pública
    return {
        start,
        pause,
        resume,
        stop,
        addTime,
        getState,
        formatTime,
        getRestConfig,
        renderTimerUI,
        REST_CONFIG
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.RestTimerModule = RestTimerModule;
}
