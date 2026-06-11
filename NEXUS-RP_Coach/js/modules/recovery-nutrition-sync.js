/**
 * NEXUS-RP Coach - Sinergia Entrenamiento ↔ Nutrición
 * Detecta PRs, fatiga extrema o día de descanso y auto-ajusta las
 * calorías/carbohidratos del día para priorizar la recuperación.
 * El ajuste es visible y reversible desde el Coach Nutricional.
 */
const RecoveryNutritionSync = (() => {
    'use strict';

    const ADJUSTMENT_KEY = 'rpCoach_nutrition_adjustment';

    const REGLAS = {
        pr: {
            titulo: '🏆 ¡PR detectado hoy!',
            detalle: 'Registraste un récord personal. Subimos calorías y carbohidratos para maximizar la recuperación y consolidar la adaptación.',
            calc: base => ({ kcalDelta: 250, carbDelta: Math.round(base.carb * 0.15) })
        },
        fatiga: {
            titulo: '🥵 Fatiga extrema detectada',
            detalle: 'Tu readiness está en rojo o reportaste una sesión muy demandante. Aumentamos carbohidratos para reponer glucógeno y acelerar la recuperación.',
            calc: base => ({ kcalDelta: Math.round(base.kcal * 0.10), carbDelta: Math.round(base.carb * 0.12) })
        },
        descanso: {
            titulo: '😴 Día de descanso',
            detalle: 'Hoy no entrenaste. Bajamos ligeramente calorías y carbohidratos siguiendo tu ciclado ondulante.',
            calc: base => ({ kcalDelta: -Math.round(base.kcal * 0.10), carbDelta: -Math.round(base.carb * 0.20) })
        }
    };

    // ── Utilidades ──

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }

    function hoy() {
        return new Date().toISOString().split('T')[0];
    }

    function getAdjustment() {
        const adj = readJSON(ADJUSTMENT_KEY, null);
        return (adj && adj.date === hoy()) ? adj : null;
    }

    // ── Detección de señales del día ──

    function huboPRHoy() {
        return readJSON('rpCoach_strength_prs', []).some(pr => pr.date === hoy());
    }

    function huboSesionHoy() {
        const sessions = [
            ...readJSON('rpCoach_session_history', []),
            ...readJSON('rpCoach_enhanced_logs', []),
            ...readJSON('rpCoach_session_logs', [])
        ];
        return sessions.some(s => {
            const d = (s.date || s.completedAt || s.startedAt || s.createdAt || '').split('T')[0];
            return d === hoy();
        });
    }

    function fatigaExtremaHoy() {
        if (localStorage.getItem('rpCoach_fatigue_carb_boost') === 'true') return true;
        const history = readJSON('rpCoach_readiness_history', []);
        const today = history.find(h => h.date === hoy());
        return !!today && today.score <= 2;
    }

    /**
     * Evalúa las reglas del día y guarda el ajuste (idempotente: si la razón
     * no cambió, respeta el estado actual incluido un "ignored" del usuario).
     */
    function evaluateToday() {
        let reason = null;
        if (huboPRHoy()) reason = 'pr';
        else if (fatigaExtremaHoy()) reason = 'fatiga';
        else if (!huboSesionHoy() && new Date().getHours() >= 18) reason = 'descanso';

        const actual = getAdjustment();

        if (!reason) {
            if (actual) localStorage.removeItem(ADJUSTMENT_KEY);
            return null;
        }
        if (actual && actual.reason === reason) return actual; // respeta decisión del usuario

        const base = window.NutritionFlexible
            ? NutritionFlexible.getTargetsBase()
            : { kcal: 2500, prot: 180, carb: 280, grasa: 75 };
        const deltas = REGLAS[reason].calc(base);

        const adjustment = {
            date: hoy(),
            reason,
            titulo: REGLAS[reason].titulo,
            detalle: REGLAS[reason].detalle,
            kcalDelta: deltas.kcalDelta,
            carbDelta: deltas.carbDelta,
            status: 'applied'
        };
        localStorage.setItem(ADJUSTMENT_KEY, JSON.stringify(adjustment));
        // Refrescar UI de inmediato si el usuario ya está en el Coach Nutricional
        renderBanner();
        if (window.NutritionFlexible &&
            document.getElementById('nutri-sub-flexible')?.offsetParent !== null) {
            NutritionFlexible.render();
        }
        window.dispatchEvent(new CustomEvent('rp:nutrition-adjusted', { detail: adjustment }));
        return adjustment;
    }

    function setStatus(status) {
        const adj = getAdjustment();
        if (!adj) return;
        adj.status = status;
        localStorage.setItem(ADJUSTMENT_KEY, JSON.stringify(adj));
        renderBanner();
        if (window.NutritionFlexible) NutritionFlexible.render();
        window.dispatchEvent(new CustomEvent('rp:nutrition-adjusted', { detail: adj }));
    }

    // ── Banner en el Coach Nutricional ──

    function renderBanner() {
        const container = document.getElementById('nutrition-adjustment-banner');
        if (!container) return;

        const adj = getAdjustment();
        if (!adj) { container.innerHTML = ''; return; }

        const signo = v => (v >= 0 ? '+' : '') + v;
        const ignorado = adj.status === 'ignored';

        container.innerHTML = `
            <div class="coach-adjustment-banner ${ignorado ? 'coach-adjustment-banner--ignored' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <div>
                        <strong style="font-size:0.9rem;">${adj.titulo}</strong>
                        <p style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px;">${adj.detalle}</p>
                        <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                            <span class="rp-badge" style="background:${ignorado ? '#555' : '#10B981'};">
                                ${signo(adj.kcalDelta)} kcal</span>
                            <span class="rp-badge" style="background:${ignorado ? '#555' : '#F59E0B'};">
                                ${signo(adj.carbDelta)}g carbos</span>
                            ${ignorado ? '<span class="rp-badge" style="background:#555;">Ignorado</span>' : ''}
                        </div>
                    </div>
                    <button id="btn-toggle-adjustment" class="btn btn--sm"
                        style="background:${ignorado ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.08)'}; color:white; white-space:nowrap;">
                        ${ignorado ? '✓ Aplicar' : '✕ Ignorar'}
                    </button>
                </div>
            </div>
        `;

        container.querySelector('#btn-toggle-adjustment')?.addEventListener('click', () => {
            setStatus(ignorado ? 'applied' : 'ignored');
        });
    }

    // ── Hooks no invasivos sobre los módulos de entrenamiento ──

    function hookTrainingModules() {
        // Al terminar una sesión → re-evaluar
        if (window.EnhancedSessionLogger?.finishSession) {
            const original = EnhancedSessionLogger.finishSession;
            EnhancedSessionLogger.finishSession = function (...args) {
                const result = original.apply(this, args);
                try {
                    window.dispatchEvent(new CustomEvent('rp:session-completed', { detail: result }));
                    evaluateToday();
                    renderBanner();
                } catch { }
                return result;
            };
        }
        // Cambios de PRs o readiness desde otra pestaña
        window.addEventListener('storage', e => {
            if (e.key === 'rpCoach_strength_prs' || e.key === 'rpCoach_readiness_history') {
                evaluateToday();
                renderBanner();
            }
        });
    }

    function init() {
        hookTrainingModules();
        evaluateToday();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { evaluateToday, getAdjustment, setStatus, renderBanner };
})();

if (typeof window !== 'undefined') {
    window.RecoveryNutritionSync = RecoveryNutritionSync;
}
