/**
 * NEXUS-RP Coach - Plan Flexible de Nutrición
 * Diario de comidas + barras de macros fluidas + targets efectivos del día
 * (targets base de BioimpedanciaRP + ajuste del coach de recuperación).
 */
const NutritionFlexible = (() => {
    'use strict';

    const LOG_KEY = 'rpCoach_nutrition_log';
    const MANUAL_TARGETS_KEY = 'rpCoach_nutrition_targets_manual';
    const ADJUSTMENT_KEY = 'rpCoach_nutrition_adjustment';

    const DEFAULTS = { kcal: 2500, prot: 180, carb: 280, grasa: 75 };

    const MACROS_UI = [
        { id: 'kcal', label: '🔥 Calorías', unidad: 'kcal', color: '#F59E0B' },
        { id: 'prot', label: '💪 Proteína', unidad: 'g', color: '#EF4444' },
        { id: 'carb', label: '🍚 Carbohidratos', unidad: 'g', color: '#10B981' },
        { id: 'grasa', label: '🥑 Grasas', unidad: 'g', color: '#3B82F6' }
    ];

    // ── Utilidades ──

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }

    function hoy() {
        return new Date().toISOString().split('T')[0];
    }

    // ── Targets ──

    function getTargetsBase() {
        try {
            const bio = window.BioimpedanciaRP?.getDatosCalculados?.();
            const m = bio?.metricas?.macros;
            if (m?.calorias) {
                return { kcal: m.calorias, prot: m.proteina, carb: m.carbohidratos, grasa: m.grasas };
            }
        } catch { }
        return readJSON(MANUAL_TARGETS_KEY, null) || { ...DEFAULTS };
    }

    /** Targets del día con el ajuste del coach aplicado (si no fue ignorado) */
    function getTargetsHoy() {
        const base = getTargetsBase();
        const adj = readJSON(ADJUSTMENT_KEY, null);
        if (adj && adj.date === hoy() && adj.status === 'applied') {
            return {
                ...base,
                kcal: Math.round(base.kcal + (adj.kcalDelta || 0)),
                carb: Math.round(base.carb + (adj.carbDelta || 0))
            };
        }
        return base;
    }

    // ── Diario ──

    function getLog() {
        return readJSON(LOG_KEY, {});
    }

    function getMealsHoy() {
        return getLog()[hoy()] || [];
    }

    function addFood(food) {
        const log = getLog();
        const date = hoy();
        if (!log[date]) log[date] = [];
        log[date].push({
            id: 'meal_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            nombre: food.nombre || 'Alimento',
            kcal: Math.round(parseFloat(food.kcal) || 0),
            prot: Math.round((parseFloat(food.prot) || 0) * 10) / 10,
            carb: Math.round((parseFloat(food.carb) || 0) * 10) / 10,
            grasa: Math.round((parseFloat(food.grasa) || 0) * 10) / 10,
            gramos: parseFloat(food.gramos) || null,
            hora: new Date().toTimeString().slice(0, 5),
            fuente: food.fuente || 'manual'
        });
        localStorage.setItem(LOG_KEY, JSON.stringify(log));
        render();
        window.dispatchEvent(new CustomEvent('rp:food-logged'));
    }

    function removeFood(id) {
        const log = getLog();
        const date = hoy();
        log[date] = (log[date] || []).filter(m => m.id !== id);
        localStorage.setItem(LOG_KEY, JSON.stringify(log));
        render();
    }

    function getConsumidoHoy() {
        return getMealsHoy().reduce((acc, m) => ({
            kcal: acc.kcal + (m.kcal || 0),
            prot: acc.prot + (m.prot || 0),
            carb: acc.carb + (m.carb || 0),
            grasa: acc.grasa + (m.grasa || 0)
        }), { kcal: 0, prot: 0, carb: 0, grasa: 0 });
    }

    /** Macros que FALTAN hoy (para el asistente de tiendas) */
    function getRemainingHoy() {
        const t = getTargetsHoy();
        const c = getConsumidoHoy();
        return {
            kcal: Math.max(0, t.kcal - c.kcal),
            prot: Math.max(0, t.prot - c.prot),
            carb: Math.max(0, t.carb - c.carb),
            grasa: Math.max(0, t.grasa - c.grasa)
        };
    }

    // ── Render ──

    function barHTML(macro, consumido, target) {
        const pct = target > 0 ? (consumido / target) * 100 : 0;
        const over = pct > 100;
        return `
            <div class="macro-bar">
                <div class="macro-bar__head">
                    <span style="font-weight:700;">${macro.label}</span>
                    <span style="color:${over ? '#FF5252' : macro.color}; font-weight:700;">
                        ${Math.round(consumido)} / ${Math.round(target)} ${macro.unidad}
                        ${over ? ' ⚠️' : ''}
                    </span>
                </div>
                <div class="macro-bar__track">
                    <div class="macro-bar__fill ${over ? 'macro-bar__fill--over' : ''}"
                        data-width="${Math.min(100, pct)}"
                        style="background: linear-gradient(90deg, ${macro.color}AA, ${macro.color});"></div>
                </div>
            </div>`;
    }

    function render() {
        const container = document.getElementById('nutri-sub-flexible');
        if (!container) return;

        const targets = getTargetsHoy();
        const consumido = getConsumidoHoy();
        const meals = getMealsHoy();
        const usingDefaults = !window.BioimpedanciaRP?.getDatosCalculados?.()?.metricas?.macros
            && !readJSON(MANUAL_TARGETS_KEY, null);

        const quickFoods = (window.ALIMENTOS_DB || []).filter(a =>
            ['Pechuga de pollo', 'Huevo entero', 'Proteína whey (scoop)', 'Arroz blanco cocido',
                'Avena en hojuelas', 'Plátano', 'Yogur griego natural', 'Aguacate'].includes(a.nombre));

        container.innerHTML = `
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>🎯 Macros de Hoy</h4>
                    <span class="rp-badge" style="background:var(--rp-accent);">${hoy()}</span>
                </div>
                ${usingDefaults ? `
                <div class="alert alert--warning" style="padding:8px; font-size:0.75rem; margin-bottom:10px;">
                    <span>ℹ️</span>
                    <span>Usando targets genéricos. Completa tus datos en <strong>Perfil → DATOS</strong> para personalizarlos.</span>
                </div>` : ''}
                ${MACROS_UI.map(m => barHTML(m, consumido[m.id], targets[m.id])).join('')}
            </div>

            <div class="card glass-card mt-2">
                <div class="card__header"><h4>⚡ Registro rápido</h4></div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                    ${quickFoods.map((a, i) => `
                        <button class="store-chip quick-food-btn" data-idx="${(window.ALIMENTOS_DB || []).indexOf(a)}"
                            title="${a.porcion} · ${a.kcal} kcal · ${a.prot}g P">
                            ${a.nombre}
                        </button>`).join('')}
                </div>

                <div class="form-group mt-3">
                    <label class="form-label" style="font-size:0.75rem;">Buscar en base de alimentos</label>
                    <input type="text" id="flexible-food-search" class="form-input" list="flexible-food-list"
                        placeholder="Ej. arroz, atún, avena...">
                    <datalist id="flexible-food-list">
                        ${(window.ALIMENTOS_DB || []).map(a => `<option value="${a.nombre}">${a.porcion} · ${a.kcal}kcal</option>`).join('')}
                    </datalist>
                    <button id="btn-add-searched-food" class="btn btn--primary btn--block mt-2">＋ Agregar porción</button>
                </div>

                <details style="margin-top:10px;">
                    <summary style="font-size:0.78rem; color:var(--text-secondary); cursor:pointer;">✏️ Entrada manual (nombre + macros)</summary>
                    <div class="module-grid mt-2" style="gap:8px;">
                        <div class="form-group" style="grid-column:1/-1;">
                            <input type="text" id="manual-food-name" class="form-input" placeholder="Nombre del alimento">
                        </div>
                        <div class="form-group"><input type="number" id="manual-food-kcal" class="form-input" placeholder="kcal"></div>
                        <div class="form-group"><input type="number" id="manual-food-prot" class="form-input" placeholder="Proteína g"></div>
                        <div class="form-group"><input type="number" id="manual-food-carb" class="form-input" placeholder="Carbos g"></div>
                        <div class="form-group"><input type="number" id="manual-food-grasa" class="form-input" placeholder="Grasas g"></div>
                    </div>
                    <button id="btn-add-manual-food" class="btn btn--block mt-2"
                        style="background:linear-gradient(135deg,#10B981,#059669); color:white;">💾 Registrar</button>
                </details>
            </div>

            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>📒 Diario de hoy</h4>
                    <span class="rp-badge">${meals.length} registro${meals.length === 1 ? '' : 's'}</span>
                </div>
                <div id="flexible-meal-list">
                    ${meals.length ? meals.map(m => `
                        <div class="meal-row">
                            <div>
                                <div><strong>${m.nombre}</strong> <span class="text-muted" style="font-size:0.65rem;">${m.hora || ''}</span></div>
                                <div class="meal-row__macros">${m.kcal} kcal · P ${m.prot}g · C ${m.carb}g · G ${m.grasa}g</div>
                            </div>
                            <button class="btn-del" data-meal-id="${m.id}" title="Eliminar">✕</button>
                        </div>`).join('')
                : '<p class="text-muted" style="font-size:0.78rem; padding:8px 0;">Aún no registras comidas hoy. Usa el registro rápido, el buscador o el escáner 📷</p>'}
                </div>
            </div>
        `;

        // Animar barras tras el paint
        requestAnimationFrame(() => {
            container.querySelectorAll('.macro-bar__fill').forEach(el => {
                el.style.width = el.dataset.width + '%';
            });
        });

        bindEvents(container);
    }

    function bindEvents(container) {
        container.querySelectorAll('.quick-food-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const food = (window.ALIMENTOS_DB || [])[parseInt(btn.dataset.idx)];
                if (food) addFood({ ...food, fuente: 'rapido' });
            });
        });

        const searchInput = container.querySelector('#flexible-food-search');
        container.querySelector('#btn-add-searched-food')?.addEventListener('click', () => {
            const food = (window.ALIMENTOS_DB || []).find(a =>
                a.nombre.toLowerCase() === (searchInput?.value || '').trim().toLowerCase());
            if (food) {
                addFood({ ...food, fuente: 'busqueda' });
            } else if (searchInput) {
                searchInput.style.borderColor = 'var(--rp-danger)';
                setTimeout(() => { searchInput.style.borderColor = ''; }, 1200);
            }
        });

        container.querySelector('#btn-add-manual-food')?.addEventListener('click', () => {
            const nombre = container.querySelector('#manual-food-name')?.value.trim();
            const kcal = parseFloat(container.querySelector('#manual-food-kcal')?.value);
            if (!nombre || isNaN(kcal)) return;
            addFood({
                nombre, kcal,
                prot: container.querySelector('#manual-food-prot')?.value || 0,
                carb: container.querySelector('#manual-food-carb')?.value || 0,
                grasa: container.querySelector('#manual-food-grasa')?.value || 0,
                fuente: 'manual'
            });
        });

        container.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', () => removeFood(btn.dataset.mealId));
        });
    }

    function init() {
        render();
    }

    return { init, render, addFood, removeFood, getTargetsHoy, getTargetsBase, getConsumidoHoy, getRemainingHoy };
})();

if (typeof window !== 'undefined') {
    window.NutritionFlexible = NutritionFlexible;
}
