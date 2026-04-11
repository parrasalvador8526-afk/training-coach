/**
 * NEXUS-RP Coach - Gate Check Module
 * Sistema de evaluación semanal para transición entre fases del mesociclo.
 * Calcula un Gate Score compuesto (0-100) basado en:
 *   - Readiness (40%): promedio últimas 3 evaluaciones pre-entreno
 *   - Performance (35%): progresión de peso en ejercicios recientes
 *   - Fatiga (25%): nivel de fatiga invertido (100 = sin fatiga)
 */

const GateCheck = (() => {
    const STORAGE_KEY = 'rpCoach_gate_check';

    function getState() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    // ── Score Calculations ──

    function calculateGateScore() {
        const readiness = getReadinessScore();
        const fatigue = getFatigueScore();
        const performance = getPerformanceScore();

        const score = Math.round(
            readiness * 0.40 + performance * 0.35 + fatigue * 0.25
        );
        return { score, readiness, fatigue, performance };
    }

    function getReadinessScore() {
        const history = JSON.parse(localStorage.getItem('rpCoach_readiness_history') || '[]');
        if (history.length === 0) return 70;
        const recent = history.slice(-3);
        const avg = recent.reduce((s, r) => s + (r.score || r.total || 5), 0) / recent.length;
        return Math.round((avg / 15) * 100); // max readiness score = 15 (3 inputs × 5)
    }

    function getFatigueScore() {
        // Intentar AutoregulationEngine primero, luego AutoregulationModule
        if (window.AutoregulationEngine?.getFatigueLevel) {
            const fatigue = window.AutoregulationEngine.getFatigueLevel();
            return Math.round(100 - fatigue);
        }
        if (window.AutoregulationModule?.getHistory) {
            const history = window.AutoregulationModule.getHistory();
            if (history.length > 0) {
                const recent = history.slice(-3);
                const avgFatigue = recent.reduce((s, h) => s + (h.fatigue || 3), 0) / recent.length;
                return Math.round(100 - (avgFatigue / 5) * 100);
            }
        }
        const sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        if (sessions.length === 0) return 60; // Sin datos = valor neutro-conservador
        const recent = sessions.slice(-3);
        const avgFatigue = recent.reduce((s, sess) => {
            const f = sess.feedback?.fatigue || sess.fatigue || 3;
            return s + f;
        }, 0) / recent.length;
        return Math.round(100 - (avgFatigue / 5) * 100);
    }

    function getPerformanceScore() {
        const sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        if (sessions.length < 2) return 70;
        const recent = sessions.slice(-3);
        let progressCount = 0;
        recent.forEach(sess => {
            if (sess.exercises) {
                sess.exercises.forEach(ex => {
                    if (ex.weightUsed > (ex.previousWeight || 0)) progressCount++;
                });
            }
        });
        const totalExercises = recent.reduce((s, sess) => s + (sess.exercises?.length || 3), 0);
        return Math.round((progressCount / Math.max(totalExercises, 1)) * 100);
    }

    // ── Recommendation Engine ──

    function generateRecommendation(gateData) {
        const { score } = gateData;
        if (score >= 75) {
            return {
                action: 'advance', light: 'green',
                title: '✅ Listo para Avanzar',
                description: 'Tus métricas indican buena recuperación y rendimiento. Puedes avanzar a la siguiente fase.',
                color: '#10B981'
            };
        } else if (score >= 50) {
            return {
                action: 'caution', light: 'yellow',
                title: '⚠️ Avanzar con Precaución',
                description: 'Recuperación moderada. Puedes avanzar pero considera reducir volumen 10-15% esta semana.',
                color: '#F59E0B'
            };
        } else if (score >= 30) {
            return {
                action: 'repeat', light: 'yellow',
                title: '🔄 Repetir Semana',
                description: 'Fatiga significativa detectada. Se recomienda repetir la semana actual con el mismo estímulo.',
                color: '#F59E0B'
            };
        } else {
            return {
                action: 'deload', light: 'red',
                title: '🛑 Deload Inmediato',
                description: 'Fatiga crítica. Activa semana de descarga para evitar sobreentrenamiento.',
                color: '#EF4444'
            };
        }
    }

    // ── Context ──

    function getCurrentContext() {
        const routine = JSON.parse(localStorage.getItem('rpCoach_currentRoutine') || '{}');
        const methodology = routine.methodology || 'default';
        const mesoMap = window.WorkoutUIController?.getMethodologyMesocycleMap?.() || {};
        const mesoConfig = mesoMap[methodology] || mesoMap['default'] || {
            weeks: 5,
            phases: [
                { week: 1, name: 'Acumulación', rir: 3 },
                { week: 2, name: 'Progresión', rir: 2 },
                { week: 3, name: 'Intensificación', rir: 1 },
                { week: 4, name: 'Peak', rir: 0 },
                { week: 5, name: 'Deload', rir: 4 }
            ]
        };

        let currentWeek = 1;
        if (window.AutoregulationEngine?.getMesocycleState) {
            currentWeek = window.AutoregulationEngine.getMesocycleState().week || 1;
        } else {
            currentWeek = parseInt(localStorage.getItem('rpCoach_mesocycleWeek') || '1');
        }

        const totalWeeks = mesoConfig.weeks;
        const currentPhase = mesoConfig.phases.find(p => p.week === currentWeek);
        const nextPhase = mesoConfig.phases.find(p => p.week === currentWeek + 1);

        return { methodology, currentWeek, totalWeeks, currentPhase, nextPhase, mesoConfig };
    }

    // ── Render ──

    function render() {
        const widget = document.getElementById('gate-check-widget');
        if (!widget) return;

        const ctx = getCurrentContext();

        // No mostrar en semana 1 (no hay gate previo) ni después de la última
        if (ctx.currentWeek <= 1 || ctx.currentWeek > ctx.totalWeeks) {
            widget.style.display = 'none';
            return;
        }

        // Si ya se tomó decisión para esta semana, ocultar
        const state = getState();
        if (state.lastDecisionWeek === ctx.currentWeek && state.decided) {
            widget.style.display = 'none';
            return;
        }

        widget.style.display = 'block';

        // Badge de transición
        const badge = document.getElementById('gate-check-week-badge');
        if (badge) {
            const prevPhase = ctx.mesoConfig.phases.find(p => p.week === ctx.currentWeek - 1);
            const curPhase = ctx.currentPhase;
            badge.textContent = `${prevPhase?.name || 'Sem ' + (ctx.currentWeek - 1)} → ${curPhase?.name || 'Sem ' + ctx.currentWeek}`;
        }

        // Calcular score y recomendación
        const gateData = calculateGateScore();
        const rec = generateRecommendation(gateData);

        // Métricas
        const metrics = [
            { id: 'gate-metric-readiness', value: gateData.readiness },
            { id: 'gate-metric-fatigue', value: gateData.fatigue },
            { id: 'gate-metric-performance', value: gateData.performance }
        ];
        metrics.forEach(m => {
            const el = document.getElementById(m.id);
            if (el) {
                el.textContent = m.value + '%';
                el.style.color = m.value >= 70 ? '#10B981' : m.value >= 50 ? '#F59E0B' : '#EF4444';
            }
        });

        // Score bar
        const scoreValueEl = document.getElementById('gate-score-value');
        if (scoreValueEl) scoreValueEl.textContent = gateData.score + '/100';
        const bar = document.getElementById('gate-score-bar');
        if (bar) {
            bar.style.width = gateData.score + '%';
            bar.style.background = rec.color;
        }

        // Semáforo
        ['green', 'yellow', 'red'].forEach(c => {
            const light = document.getElementById('gate-light-' + c);
            if (light) light.className = 'gate-light';
        });
        const activeLight = document.getElementById('gate-light-' + rec.light);
        if (activeLight) activeLight.classList.add('active-' + rec.light);

        // Recomendación
        const recTitle = document.getElementById('gate-rec-title');
        const recDesc = document.getElementById('gate-rec-description');
        if (recTitle) recTitle.textContent = rec.title;
        if (recDesc) recDesc.textContent = rec.description;

        const recCard = document.getElementById('gate-recommendation');
        if (recCard) {
            recCard.style.background = rec.color + '15';
            recCard.style.borderColor = rec.color + '50';
        }

        // Border del widget
        widget.style.borderLeftColor = rec.color;

        // Guardar estado parcial (sin decisión)
        saveState({ ...state, lastScore: gateData, lastRecommendation: rec, currentWeek: ctx.currentWeek });
    }

    // ── Actions ──

    function acceptRecommendation() {
        const state = getState();
        const rec = state.lastRecommendation;
        if (!rec) return;
        applyAction(rec.action);
    }

    function showOverrideOptions() {
        const el = document.getElementById('gate-override-options');
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }

    function forceAction(action) {
        applyAction(action, true);
    }

    function applyAction(action, forced = false) {
        const ctx = getCurrentContext();
        const state = getState();

        switch (action) {
            case 'advance':
            case 'caution':
                if (window.AutoregulationEngine?.advanceWeek) {
                    window.AutoregulationEngine.advanceWeek();
                }
                break;
            case 'repeat':
                // No avanzar — mantener semana y parámetros actuales
                break;
            case 'deload':
                if (window.AutoregulationModule?.applyReactiveDeload) {
                    window.AutoregulationModule.applyReactiveDeload();
                }
                break;
        }

        // Registrar decisión
        saveState({
            ...state,
            decided: true,
            lastDecisionWeek: ctx.currentWeek,
            actionTaken: action,
            forced,
            timestamp: new Date().toISOString()
        });

        // Ocultar widget
        const widget = document.getElementById('gate-check-widget');
        if (widget) widget.style.display = 'none';

        // Refrescar Home
        if (typeof renderHome === 'function') renderHome();
    }

    return { render, acceptRecommendation, showOverrideOptions, forceAction };
})();
