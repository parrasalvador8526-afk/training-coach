/**
 * NEXUS-RP Coach - Dashboard de Evolución
 * Fusiona "Métricas y Progreso" + "Progresión" en una vista unificada premium:
 * anillos de progreso estilo Apple Watch + gráficas Chart.js de volumen y fuerza.
 */
const EvolutionDashboard = (() => {
    'use strict';

    const SUBTAB_KEY = 'rpCoach_evolution_subtab';
    let charts = {};

    // ── Helpers de datos ──

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }

    function sessionDate(s) {
        return (s.date || s.completedAt || s.startedAt || s.createdAt || '').split('T')[0];
    }

    function getSessions() {
        // Tres almacenes históricos coexisten en la app; el flujo de
        // entrenamiento activo escribe en rpCoach_session_history.
        const history = readJSON('rpCoach_session_history', []);
        const enhanced = readJSON('rpCoach_enhanced_logs', []);
        const legacy = readJSON('rpCoach_session_logs', []);
        return [...history, ...enhanced, ...legacy].filter(s => sessionDate(s));
    }

    function startOfWeek(d = new Date()) {
        const date = new Date(d);
        const day = (date.getDay() + 6) % 7; // lunes = 0
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function sessionStats(session) {
        // rpCoach_session_history trae los totales precalculados
        if (session.stats?.totalSets) {
            return { sets: session.stats.totalSets, tonnage: session.stats.totalVolume || 0 };
        }
        let sets = 0, tonnage = 0;
        (session.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(set => {
                sets++;
                tonnage += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
            });
        });
        return { sets, tonnage };
    }

    // ── Métricas de los anillos ──

    function computeAdherencia() {
        const monday = startOfWeek();
        const sessions = getSessions().filter(s => new Date(sessionDate(s) + 'T12:00:00') >= monday);
        // Días planificados por semana según rutina activa (fallback 4)
        let planned = 4;
        const routine = readJSON('rpCoach_active_routine', null);
        if (routine?.days?.length) {
            const week1 = routine.days.filter(d => (d.weekNumber || 1) === 1);
            planned = Math.min(7, Math.max(1, week1.length || routine.days.length));
        }
        const done = new Set(sessions.map(sessionDate)).size;
        return { value: Math.min(1, done / planned), label: `${done}/${planned} sesiones`, done, planned };
    }

    function computeVolumen() {
        const monday = startOfWeek();
        const sessions = getSessions().filter(s => new Date(sessionDate(s) + 'T12:00:00') >= monday);
        const sets = sessions.reduce((sum, s) => sum + sessionStats(s).sets, 0);
        // Target semanal de series: intenta MEV-MRV global, fallback 60
        let target = 60;
        try {
            if (typeof VolumeMEVMRV !== 'undefined' && VolumeMEVMRV.getWeeklyTarget) {
                target = VolumeMEVMRV.getWeeklyTarget() || target;
            }
        } catch { }
        return { value: Math.min(1, sets / target), label: `${sets}/${target} series`, sets, target };
    }

    function computeReadiness() {
        const history = readJSON('rpCoach_readiness_history', []);
        const recent = history.slice(-7);
        if (!recent.length) return { value: 0, label: 'Sin datos', avg: null };
        const avg = recent.reduce((sum, h) => sum + (h.score || 0), 0) / recent.length;
        return { value: Math.min(1, avg / 5), label: `${avg.toFixed(1)}/5 promedio`, avg };
    }

    // ── Render de anillos (SVG estilo Apple Watch) ──

    function ringSVG(pct, color, icon) {
        const r = 52, c = 2 * Math.PI * r;
        const offset = c * (1 - Math.max(0.001, pct));
        return `
            <svg viewBox="0 0 120 120" class="evo-ring-svg">
                <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}22" stroke-width="11"/>
                <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="11"
                    stroke-linecap="round" transform="rotate(-90 60 60)"
                    stroke-dasharray="${c}" stroke-dashoffset="${c}"
                    class="evo-ring-progress" data-offset="${offset}"
                    style="filter: drop-shadow(0 0 6px ${color}66);"/>
                <text x="60" y="56" text-anchor="middle" font-size="22">${icon}</text>
                <text x="60" y="80" text-anchor="middle" font-size="17" font-weight="800"
                    fill="${color}">${Math.round(pct * 100)}%</text>
            </svg>`;
    }

    function renderRings() {
        const container = document.getElementById('evolution-rings');
        if (!container) return;

        const rings = [
            { ...computeAdherencia(), titulo: 'Adherencia', color: '#E040FB', icon: '🎯' },
            { ...computeVolumen(), titulo: 'Volumen', color: '#00E676', icon: '🏋️' },
            { ...computeReadiness(), titulo: 'Readiness', color: '#00BFA5', icon: '⚡' }
        ];

        container.innerHTML = rings.map(r => `
            <div class="evo-ring">
                ${ringSVG(r.value, r.color, r.icon)}
                <div class="evo-ring__title">${r.titulo}</div>
                <div class="evo-ring__label">${r.label}</div>
            </div>
        `).join('');

        // Animar el llenado tras el primer paint
        requestAnimationFrame(() => {
            container.querySelectorAll('.evo-ring-progress').forEach(circle => {
                circle.style.strokeDashoffset = circle.dataset.offset;
            });
        });
    }

    // ── Gráficas (Chart.js ya está cargado por CDN) ──

    function destroyChart(id) {
        if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    }

    function renderVolumeChart() {
        const canvas = document.getElementById('chart-evo-volume');
        if (!canvas || typeof Chart === 'undefined') return;

        // Series por semana (últimas 6 semanas calendario)
        const byWeek = {};
        getSessions().forEach(s => {
            const monday = startOfWeek(new Date(sessionDate(s) + 'T12:00:00'));
            const key = monday.toISOString().split('T')[0];
            byWeek[key] = (byWeek[key] || 0) + sessionStats(s).sets;
        });
        const keys = Object.keys(byWeek).sort().slice(-6);
        const labels = keys.map(k => new Date(k + 'T12:00:00')
            .toLocaleDateString('es', { day: 'numeric', month: 'short' }));

        destroyChart('volume');
        charts.volume = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Series por semana',
                    data: keys.length ? keys.map(k => byWeek[k]) : [0],
                    backgroundColor: 'rgba(224,64,251,0.55)',
                    borderColor: '#E040FB',
                    borderWidth: 1.5,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#B0B0C0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#B0B0C0' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
                }
            }
        });
    }

    function renderTonnageChart() {
        const canvas = document.getElementById('chart-evo-tonnage');
        if (!canvas || typeof Chart === 'undefined') return;

        const sessions = getSessions()
            .sort((a, b) => sessionDate(a).localeCompare(sessionDate(b)))
            .slice(-12);

        destroyChart('tonnage');
        charts.tonnage = new Chart(canvas, {
            type: 'line',
            data: {
                labels: sessions.length
                    ? sessions.map(s => new Date(sessionDate(s) + 'T12:00:00')
                        .toLocaleDateString('es', { day: 'numeric', month: 'short' }))
                    : ['Sin datos'],
                datasets: [{
                    label: 'Tonelaje (kg)',
                    data: sessions.length ? sessions.map(s => sessionStats(s).tonnage) : [0],
                    borderColor: '#00BFA5',
                    backgroundColor: 'rgba(0,191,165,0.12)',
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#00BFA5',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#B0B0C0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#B0B0C0' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
                }
            }
        });
    }

    // ── PRs recientes ──

    function renderRecentPRs() {
        const container = document.getElementById('evolution-prs');
        if (!container) return;
        const prs = readJSON('rpCoach_strength_prs', [])
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .slice(0, 3);

        if (!prs.length) {
            container.innerHTML = '<p class="text-muted" style="font-size:0.78rem;">Aún no registras PRs. Hazlo desde la pestaña Fuerza 💪</p>';
            return;
        }
        container.innerHTML = prs.map(pr => `
            <div class="evo-pr-row">
                <span>🏆 <strong>${pr.exercise}</strong></span>
                <span style="color:#00E676; font-weight:700;">${pr.weight}kg × ${pr.reps}</span>
                <span class="text-muted" style="font-size:0.7rem;">${pr.date || ''}</span>
            </div>
        `).join('');
    }

    // ── Sub-tabs ──

    function getSub() {
        return localStorage.getItem(SUBTAB_KEY) || 'resumen';
    }

    function setSub(sub) {
        localStorage.setItem(SUBTAB_KEY, sub);
    }

    function render() {
        renderRings();
        renderVolumeChart();
        renderTonnageChart();
        renderRecentPRs();
        // Marcar sub-tab activa
        document.querySelectorAll('.evo-subtab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sub === getSub());
        });
    }

    return { render, getSub, setSub };
})();

if (typeof window !== 'undefined') {
    window.EvolutionDashboard = EvolutionDashboard;
}
