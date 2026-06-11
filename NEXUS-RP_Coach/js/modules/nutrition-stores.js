/**
 * NEXUS-RP Coach - Asistente Geonutricional
 * Detecta el país (GPS + reverse-geocoding gratuito, fallback manual),
 * muestra tiendas locales y sugiere qué comprar según los macros
 * que le FALTAN al usuario hoy (gap del Plan Flexible).
 */
const NutritionStores = (() => {
    'use strict';

    const COUNTRY_KEY = 'rpCoach_country';
    const GEO_API = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

    let selectedStoreId = null;

    function getCountry() {
        return localStorage.getItem(COUNTRY_KEY) || null;
    }

    function setCountry(code) {
        const valid = window.TIENDAS_DB?.[code] ? code : 'MX';
        localStorage.setItem(COUNTRY_KEY, valid);
        selectedStoreId = null;
        render();
    }

    /** Detección automática: GPS → reverse geocode (sin API key) */
    function detectCountry() {
        const status = document.getElementById('geo-status');
        if (!navigator.geolocation) {
            if (status) status.textContent = 'Tu navegador no soporta geolocalización. Elige tu país manualmente.';
            return;
        }
        if (status) status.innerHTML = '<span class="skeleton" style="display:inline-block; width:160px; height:12px;"></span> Detectando ubicación…';

        navigator.geolocation.getCurrentPosition(async pos => {
            try {
                const { latitude, longitude } = pos.coords;
                const res = await fetch(`${GEO_API}?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`);
                const data = await res.json();
                const code = (data.countryCode === 'US') ? 'US' : 'MX';
                if (status) status.textContent = `📍 Detectado: ${data.countryName || code}`;
                setCountry(code);
            } catch {
                if (status) status.textContent = 'No se pudo detectar el país (¿sin internet?). Elige manualmente.';
            }
        }, () => {
            if (status) status.textContent = 'Permiso de ubicación denegado. Elige tu país manualmente.';
        }, { timeout: 8000 });
    }

    // ── Motor de sugerencias: cerrar el gap de macros del día ──

    /**
     * Greedy: en cada ronda elige el producto que más reduce el gap restante,
     * priorizando proteína (peso 3x), sin pasarse de las calorías que faltan (+margen).
     */
    function suggestForStore(store, remaining) {
        const sugerencias = [];
        const gap = { ...remaining };
        const usados = new Set();
        const MARGEN_KCAL = 120;

        for (let ronda = 0; ronda < 5; ronda++) {
            let mejor = null, mejorScore = 0;

            store.productos.forEach(p => {
                if (usados.has(p.nombre)) return;
                if (gap.kcal <= 150) return; // ya casi cerró el día
                if (p.kcal > gap.kcal + MARGEN_KCAL) return; // se pasaría de calorías

                const aporteProt = Math.min(p.prot, gap.prot);
                const aporteCarb = Math.min(p.carb, gap.carb);
                const aporteGrasa = Math.min(p.grasa, gap.grasa);
                // Penaliza macros que se exceden del gap
                const excesoCarb = Math.max(0, p.carb - gap.carb);
                const excesoGrasa = Math.max(0, p.grasa - gap.grasa);

                const score = aporteProt * 3 + aporteCarb * 1 + aporteGrasa * 0.8
                    - excesoCarb * 0.5 - excesoGrasa * 0.8
                    + (p.tags?.includes('limpio') ? 2 : 0);

                if (score > mejorScore) { mejorScore = score; mejor = p; }
            });

            if (!mejor || mejorScore <= 0) break;
            sugerencias.push(mejor);
            usados.add(mejor.nombre);
            gap.kcal = Math.max(0, gap.kcal - mejor.kcal);
            gap.prot = Math.max(0, gap.prot - mejor.prot);
            gap.carb = Math.max(0, gap.carb - mejor.carb);
            gap.grasa = Math.max(0, gap.grasa - mejor.grasa);
        }
        return { sugerencias, gapFinal: gap };
    }

    // ── Render ──

    function render() {
        const container = document.getElementById('nutri-sub-tiendas');
        if (!container) return;

        const country = getCountry();
        const stores = country ? (window.TIENDAS_DB?.[country] || []) : [];

        container.innerHTML = `
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>🗺️ Asistente Geonutricional</h4>
                    <span class="rp-badge" style="background:var(--rp-accent);">${country || 'Sin país'}</span>
                </div>
                <p class="text-muted" style="font-size:0.78rem;">Te digo <strong>qué comprar en la tienda donde estás</strong> para cerrar exactamente los macros que te faltan hoy.</p>

                <div style="display:flex; gap:6px; margin-top:10px; flex-wrap:wrap;">
                    <button id="btn-detect-country" class="btn btn--sm"
                        style="background:var(--gradient-primary); color:white;">📍 Detectar mi ubicación</button>
                    <button class="store-chip country-btn ${country === 'MX' ? 'active' : ''}" data-country="MX">🇲🇽 México</button>
                    <button class="store-chip country-btn ${country === 'US' ? 'active' : ''}" data-country="US">🇺🇸 USA</button>
                </div>
                <div id="geo-status" class="scanner-status" style="text-align:left;"></div>
            </div>

            ${country ? `
            <div class="card glass-card mt-2">
                <div class="card__header"><h4>🏪 ¿En qué tienda estás?</h4></div>
                <div id="stores-list" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                    ${stores.map(s => `
                        <button class="store-chip store-btn ${s.id === selectedStoreId ? 'active' : ''}" data-store="${s.id}">
                            ${s.emoji} ${s.nombre}
                        </button>`).join('')}
                </div>
                <div id="store-suggestions" class="mt-2"></div>
            </div>` : `
            <div class="alert alert--info mt-2"><span>👆</span><span>Detecta tu ubicación o elige tu país para ver tiendas.</span></div>`}
        `;

        container.querySelector('#btn-detect-country')?.addEventListener('click', detectCountry);
        container.querySelectorAll('.country-btn').forEach(btn => {
            btn.addEventListener('click', () => setCountry(btn.dataset.country));
        });
        container.querySelectorAll('.store-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedStoreId = btn.dataset.store;
                container.querySelectorAll('.store-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.store === selectedStoreId));
                renderSuggestions();
            });
        });

        if (selectedStoreId) renderSuggestions();
    }

    function renderSuggestions() {
        const target = document.getElementById('store-suggestions');
        const country = getCountry();
        const store = (window.TIENDAS_DB?.[country] || []).find(s => s.id === selectedStoreId);
        if (!target || !store) return;

        const remaining = window.NutritionFlexible
            ? NutritionFlexible.getRemainingHoy()
            : { kcal: 2500, prot: 180, carb: 280, grasa: 75 };

        const { sugerencias } = suggestForStore(store, remaining);

        if (remaining.kcal <= 150) {
            target.innerHTML = `
                <div class="alert alert--info mt-2" style="padding:10px;">
                    <span>🎉</span>
                    <span>¡Ya cerraste tus macros de hoy! No necesitas comprar nada en ${store.nombre}.</span>
                </div>`;
            return;
        }

        target.innerHTML = `
            <div class="alert alert--info" style="padding:8px; font-size:0.75rem; margin-top:10px;">
                <span>🧮</span>
                <span>Te faltan: <strong>${Math.round(remaining.kcal)} kcal · ${Math.round(remaining.prot)}g P · ${Math.round(remaining.carb)}g C · ${Math.round(remaining.grasa)}g G</strong></span>
            </div>
            <h4 style="font-size:0.85rem; margin-top:10px;">🛒 Qué comprar en ${store.emoji} ${store.nombre}:</h4>
            ${sugerencias.length ? sugerencias.map((p, i) => `
                <div class="store-suggestion">
                    <div>
                        <div><strong>${p.nombre}</strong> <span class="text-muted" style="font-size:0.68rem;">(${p.porcion})</span></div>
                        <div class="meal-row__macros">${p.kcal} kcal · P ${p.prot}g · C ${p.carb}g · G ${p.grasa}g</div>
                    </div>
                    <button class="btn btn--sm btn-buy-suggestion" data-idx="${i}"
                        style="background:var(--rp-accent); color:#04211c; font-weight:800;">＋ Lo comí</button>
                </div>`).join('')
            : '<p class="text-muted" style="font-size:0.78rem;">No hay productos en esta tienda que encajen con lo que te falta hoy.</p>'}
        `;

        target.querySelectorAll('.btn-buy-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = sugerencias[parseInt(btn.dataset.idx)];
                if (p && window.NutritionFlexible) {
                    NutritionFlexible.addFood({ ...p, fuente: 'tienda:' + store.nombre });
                    renderSuggestions(); // recalcular gap
                }
            });
        });
    }

    function init() {
        render();
    }

    return { init, render, setCountry, getCountry, suggestForStore };
})();

if (typeof window !== 'undefined') {
    window.NutritionStores = NutritionStores;
}
