/**
 * NEXUS-RP Coach - Coach Nutricional (Unificado)
 * Vista diaria con Toggle Estricto/Flexible y Motor de Sustitución Inteligente.
 */
const NutritionFlexible = (() => {
    'use strict';

    const MODE_KEY = 'rpCoach_nutrition_mode'; // 'strict' o 'flexible'
    const VARIATIONS_KEY = 'rpCoach_nutrition_variations';
    const MANUAL_TARGETS_KEY = 'rpCoach_nutrition_targets_manual';
    const ADJUSTMENT_KEY = 'rpCoach_nutrition_adjustment';
    const EXTRAS_KEY = 'rpCoach_nutrition_extras'; // alimentos añadidos desde Tiendas
    const COUNTRY_KEY = 'rpCoach_country';
    const HYDRATION_KEY = 'rpCoach_hydration'; // ml de agua por día
    const GOAL_KEY = 'rpCoach_nutrition_goal'; // 'cut' | 'maintain' | 'bulk'
    const RECENTS_KEY = 'rpCoach_food_recents'; // alimentos recientes/favoritos (acceso rápido)

    // Objetivos nutricionales: factor sobre el TDEE de mantenimiento
    const GOAL_DEFS = {
        cut:      { factor: 0.82, label: '🔥 Definir',  desc: 'Perder grasa' },
        maintain: { factor: 1.00, label: '⚖️ Mantener', desc: 'Recomposición' },
        bulk:     { factor: 1.12, label: '💪 Volumen',  desc: 'Ganar músculo' }
    };

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

    // ── Validación estricta de macros ──

    function isValidMacro(val) {
        return typeof val === 'number' && !isNaN(val) && val > 0;
    }

    function hasValidBioMacros() {
        try {
            const m = window.BioimpedanciaRP?.getDatosCalculados?.()?.metricas?.macros;
            return !!(m &&
                isValidMacro(m.calorias) &&
                isValidMacro(m.proteina) &&
                isValidMacro(m.carbohidratos) &&
                isValidMacro(m.grasas));
        } catch { return false; }
    }

    function hasValidManualMacros() {
        const t = readJSON(MANUAL_TARGETS_KEY, null);
        return !!(t &&
            isValidMacro(t.kcal) &&
            isValidMacro(t.prot) &&
            isValidMacro(t.carb) &&
            isValidMacro(t.grasa));
    }

    // ── Auto-cálculo desde perfil ──

    function tryAutoCalcFromProfile() {
        try {
            const p = readJSON('rpCoach_profile', null);
            if (!p) return false;

            const peso   = parseFloat(p.weight);
            const altura = parseFloat(p.height);
            const edad   = parseInt(p.age);
            const sexo   = (p.gender === 'male'   || p.gender === 'M') ? 'M'
                         : (p.gender === 'female' || p.gender === 'F') ? 'F'
                         : null;

            if (!peso || !altura || !edad || !sexo || peso < 30 || altura < 100 || edad < 10) return false;

            // Mifflin-St Jeor TMB
            const tmb = sexo === 'M'
                ? 10 * peso + 6.25 * altura - 5 * edad + 5
                : 10 * peso + 6.25 * altura - 5 * edad - 161;

            const tdee = Math.round(tmb * 1.55); // nivel moderado por defecto

            // % grasa estimado desde IMC
            const alturaM  = altura / 100;
            const imc      = peso / (alturaM * alturaM);
            const pctGrasa = sexo === 'M'
                ? (imc < 25 ? 15 : imc < 30 ? 22 : 30)
                : (imc < 25 ? 23 : imc < 30 ? 30 : 38);
            const masaGrasa = peso * (pctGrasa / 100);
            const ffm       = peso - masaGrasa;

            // Proteína por masa magra, grasa 25% del TDEE y carbohidratos =
            // calorías restantes, para que P+C+G sumen exactamente el TDEE.
            const proteina = Math.round(ffm * 2.2);
            let grasaKcal = tdee * 0.25;
            let carbKcal  = tdee - proteina * 4 - grasaKcal;
            if (carbKcal < tdee * 0.10) {
                grasaKcal = Math.max(tdee * 0.20, tdee - proteina * 4 - tdee * 0.10);
                carbKcal  = Math.max(0, tdee - proteina * 4 - grasaKcal);
            }
            const carbos = Math.round(carbKcal / 4);
            const grasas = Math.round(grasaKcal / 9);

            const bioData = {
                nombre: p.name || '',
                edad, sexo, peso, altura,
                actividad: 'moderado',
                autoCalculated: true,
                fechaActualizacion: new Date().toISOString(),
                metricas: {
                    tmb: Math.round(tmb),
                    tdee,
                    imc: parseFloat(imc.toFixed(1)),
                    clasificacionIMC: imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad',
                    porcentajeGrasa: pctGrasa,
                    masaGrasa: parseFloat(masaGrasa.toFixed(1)),
                    ffm: parseFloat(ffm.toFixed(1)),
                    macros: { calorias: tdee, proteina, carbohidratos: carbos, grasas }
                }
            };

            localStorage.setItem('rpCoach_bioimpedancia', JSON.stringify(bioData));
            if (typeof window.showNotification === 'function') {
                window.showNotification('✅ Macros calculados desde tu perfil', 'success');
            }
            return true;
        } catch { return false; }
    }

    // ── Objetivo nutricional (Definir / Mantener / Volumen) ──

    function getBioInfo() {
        try {
            const d = window.BioimpedanciaRP?.getDatosCalculados?.();
            if (!d) return null;
            return {
                sexo: d.sexo || 'M',
                grasa: parseFloat(d.metricas?.porcentajeGrasa),
                imc: parseFloat(d.metricas?.imc),
                peso: parseFloat(d.peso)
            };
        } catch { return null; }
    }

    // Recomendación según composición, con UMBRALES DIFERENCIADOS POR SEXO
    function getRecommendedGoal() {
        const b = getBioInfo();
        if (!b) return 'maintain';
        const esHombre = (b.sexo === 'M');
        const altoGrasa = esHombre ? 20 : 28; // % grasa "alto" → conviene definir
        const bajoGrasa = esHombre ? 12 : 20; // % grasa "magro" → margen para volumen
        if ((b.grasa && b.grasa >= altoGrasa) || (b.imc && b.imc >= 25)) return 'cut';
        if ((b.grasa && b.grasa <= bajoGrasa) || (b.imc && b.imc < 20)) return 'bulk';
        return 'maintain';
    }

    function getGoal() {
        const saved = localStorage.getItem(GOAL_KEY);
        if (saved && GOAL_DEFS[saved]) return saved;
        const b = getBioInfo();
        const rec = getRecommendedGoal();
        // Recomendar y fijar SOLO cuando ya hay datos del usuario
        if (b && (b.grasa || b.imc)) localStorage.setItem(GOAL_KEY, rec);
        return rec;
    }

    function setGoal(goal) {
        if (GOAL_DEFS[goal]) { localStorage.setItem(GOAL_KEY, goal); render(); }
    }

    // Piso calórico de seguridad DIFERENCIADO POR SEXO (déficit nunca peligroso)
    function pisoCalorico(sexo) {
        return sexo === 'F' ? 1200 : 1500;
    }

    // Reparte calorías en macros coherentes: proteína fija, grasa 25%, carbos = resto
    function repartirMacros(cal, proteina) {
        const protKcal = proteina * 4;
        let grasaKcal = cal * 0.25;
        let carbKcal = cal - protKcal - grasaKcal;
        const carbMin = cal * 0.10;
        if (carbKcal < carbMin) {
            grasaKcal = Math.max(cal * 0.20, cal - protKcal - carbMin);
            carbKcal = Math.max(0, cal - protKcal - grasaKcal);
        }
        return { carb: Math.round(carbKcal / 4), grasa: Math.round(grasaKcal / 9) };
    }

    // Aplica el objetivo al mantenimiento: ajusta calorías (con piso por sexo) y
    // recalcula carbos/grasas manteniendo la proteína (clave para conservar músculo).
    function applyGoal(base) {
        const def = GOAL_DEFS[getGoal()];
        if (!def || def.factor === 1) return base;
        const sexo = getBioInfo()?.sexo || 'M';
        const cal = Math.max(pisoCalorico(sexo), Math.round(base.kcal * def.factor));
        const r = repartirMacros(cal, base.prot);
        return { kcal: cal, prot: base.prot, carb: r.carb, grasa: r.grasa };
    }

    // ── Targets ──

    function getTargetsBaseRaw() {
        try {
            const m = window.BioimpedanciaRP?.getDatosCalculados?.()?.metricas?.macros;
            if (m && isValidMacro(m.calorias) && isValidMacro(m.proteina) &&
                isValidMacro(m.carbohidratos) && isValidMacro(m.grasas)) {
                return { kcal: m.calorias, prot: m.proteina, carb: m.carbohidratos, grasa: m.grasas };
            }
        } catch { }
        const t = readJSON(MANUAL_TARGETS_KEY, null);
        if (t && isValidMacro(t.kcal) && isValidMacro(t.prot) &&
            isValidMacro(t.carb) && isValidMacro(t.grasa)) {
            return t;
        }
        return { ...DEFAULTS };
    }

    // Targets de mantenimiento ajustados por el objetivo activo
    function getTargetsBase() {
        return applyGoal(getTargetsBaseRaw());
    }

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

    // ── Lógica de Modo y Variaciones ──

    function getMode() {
        return localStorage.getItem(MODE_KEY) || 'strict';
    }

    function setMode(mode) {
        localStorage.setItem(MODE_KEY, mode);
        render();
    }

    function getVariations() {
        return readJSON(VARIATIONS_KEY, {});
    }

    function addVariation(originalName, replacementItem) {
        const v = getVariations();
        const date = hoy();
        if (!v[date]) v[date] = [];
        // Quitamos la variación anterior de este mismo alimento si existe
        v[date] = v[date].filter(item => item.original !== originalName);
        v[date].push({
            original: originalName,
            replacement: replacementItem
        });
        localStorage.setItem(VARIATIONS_KEY, JSON.stringify(v));
        render();
    }

    function removeVariation(originalName) {
        const v = getVariations();
        const date = hoy();
        if (v[date]) {
            v[date] = v[date].filter(item => item.original !== originalName);
            localStorage.setItem(VARIATIONS_KEY, JSON.stringify(v));
            render();
        }
    }

    // ── Extras de tienda (alimentos añadidos sobre el menú) ──

    function getExtras() {
        return readJSON(EXTRAS_KEY, {});
    }

    function getExtrasHoy() {
        return getExtras()[hoy()] || [];
    }

    /** Añade un alimento (p.ej. comprado en una tienda) al día actual. */
    function addFood(item) {
        if (!item) return;
        const all = getExtras();
        const date = hoy();
        if (!all[date]) all[date] = [];
        all[date].push({
            nombre: item.nombre,
            gramos: item.gramos || null,
            kcal: Math.round(item.kcal || 0),
            prot: Math.round(item.prot || 0),
            carb: Math.round(item.carb || 0),
            grasa: Math.round(item.grasa || 0),
            fuente: item.fuente || 'tienda'
        });
        localStorage.setItem(EXTRAS_KEY, JSON.stringify(all));
        recordRecent(item); // memoriza para acceso rápido
        if (typeof window.showNotification === 'function') {
            window.showNotification(`✅ ${item.nombre} sumado a tu día`, 'success');
        }
        render();
    }

    // ── Acceso rápido: alimentos recientes y favoritos ──

    function getRecents() {
        return readJSON(RECENTS_KEY, []);
    }

    /** Memoriza el alimento (dedup por nombre, lo más reciente primero). */
    function recordRecent(item) {
        if (!item || !item.nombre) return;
        let list = getRecents();
        const previo = list.find(r => r.nombre === item.nombre);
        const fav = previo ? !!previo.fav : false;
        list = list.filter(r => r.nombre !== item.nombre);
        list.unshift({
            nombre: item.nombre,
            gramos: item.gramos || null,
            kcal: Math.round(item.kcal || 0),
            prot: Math.round(item.prot || 0),
            carb: Math.round(item.carb || 0),
            grasa: Math.round(item.grasa || 0),
            fuente: item.fuente || 'manual',
            fav
        });
        if (list.length > 16) list = list.slice(0, 16);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
    }

    /** Favoritos primero, luego recientes; máximo 8 para el acceso rápido. */
    function getQuickFoods() {
        const list = getRecents();
        return [...list.filter(r => r.fav), ...list.filter(r => !r.fav)].slice(0, 8);
    }

    function toggleFav(nombre) {
        const list = getRecents();
        const r = list.find(x => x.nombre === nombre);
        if (r) { r.fav = !r.fav; localStorage.setItem(RECENTS_KEY, JSON.stringify(list)); render(); }
    }

    function quickAdd(nombre) {
        const r = getRecents().find(x => x.nombre === nombre);
        if (r) addFood({ ...r });
    }

    function removeFood(idx) {
        const all = getExtras();
        const date = hoy();
        if (all[date] && all[date][idx] !== undefined) {
            all[date].splice(idx, 1);
            localStorage.setItem(EXTRAS_KEY, JSON.stringify(all));
            render();
        }
    }

    // ── Hidratación ──

    function getHydrationGoal() {
        // 35 ml por kg de peso si hay perfil; si no, 2500 ml por defecto
        try {
            const bio = window.BioimpedanciaRP?.getDatosCalculados?.();
            const peso = parseFloat(bio?.peso);
            if (peso && peso > 30) return Math.round(peso * 35 / 100) * 100;
        } catch { }
        const p = readJSON('rpCoach_profile', null);
        const peso = parseFloat(p?.weight);
        if (peso && peso > 30) return Math.round(peso * 35 / 100) * 100;
        return 2500;
    }

    function getHydrationHoy() {
        return readJSON(HYDRATION_KEY, {})[hoy()] || 0;
    }

    function addWater(ml) {
        const all = readJSON(HYDRATION_KEY, {});
        const date = hoy();
        all[date] = Math.max(0, (all[date] || 0) + ml);
        localStorage.setItem(HYDRATION_KEY, JSON.stringify(all));
        render();
    }

    // ── Catálogo de productos de tienda (para sustitución desde el menú) ──

    function getCountry() {
        return (window.NutritionStores?.getCountry?.())
            || localStorage.getItem(COUNTRY_KEY)
            || 'MX';
    }

    /** Aplana todos los productos del país en una sola lista con su tienda. */
    function getStoreProducts(country) {
        const stores = window.TIENDAS_DB?.[country] || [];
        const out = [];
        stores.forEach(s => (s.productos || []).forEach(p => {
            out.push({ ...p, tienda: s.nombre, tiendaEmoji: s.emoji, storeId: s.id });
        }));
        return out;
    }

    // ── Generar Menú Final ──

    /** Construye la "comida" virtual con los extras de tienda añadidos hoy. */
    function buildExtrasComida() {
        const extras = getExtrasHoy();
        if (!extras.length) return null;
        const items = extras.map((e, idx) => ({ ...e, isExtra: true, extraIdx: idx }));
        const totales = items.reduce((acc, i) => ({
            kcal: acc.kcal + i.kcal, prot: acc.prot + i.prot,
            carb: acc.carb + i.carb, grasa: acc.grasa + i.grasa
        }), { kcal: 0, prot: 0, carb: 0, grasa: 0 });
        return { nombre: '🛒 Agregados de tienda', isExtras: true, items, totales };
    }

    /** Añade la comida de extras al final del menú (sin mutar el original). */
    function withExtras(menu) {
        const extrasComida = buildExtrasComida();
        return extrasComida ? [...menu, extrasComida] : menu;
    }

    function getMenuDelDia() {
        const targets = getTargetsHoy();
        // Generamos el menú base (estricto) llamando a NutricionRP
        let menuBase = null;
        if (window.NutricionRP && typeof window.NutricionRP.generarMenuDiario === 'function') {
            // generarMenuDiario espera { calorias, proteina, carbohidratos, grasas }
            const macrosRP = {
                calorias: targets.kcal,
                proteina: targets.prot,
                carbohidratos: targets.carb,
                grasas: targets.grasa
            };
            menuBase = window.NutricionRP.generarMenuDiario(macrosRP);
        }

        if (!menuBase) return withExtras([]); // Fallback: al menos muestra los extras

        // Si estamos en modo flexible, aplicamos las variaciones de hoy
        const mode = getMode();
        if (mode === 'flexible') {
            const v = getVariations();
            const todayVars = v[hoy()] || [];
            
            // Clonamos profundo para no mutar la base original
            const menuAdaptado = JSON.parse(JSON.stringify(menuBase));
            
            menuAdaptado.forEach(comida => {
                let recalculate = false;
                comida.items.forEach((item, idx) => {
                    const variation = todayVars.find(vari => vari.original === item.nombre);
                    if (variation) {
                        // Reemplazar item
                        comida.items[idx] = {
                            ...variation.replacement,
                            isReplacement: true,
                            originalName: item.nombre
                        };
                        recalculate = true;
                    }
                });
                
                // Si hubo cambios, recalculamos los totales de la comida
                if (recalculate) {
                    comida.totales = comida.items.reduce((acc, i) => ({
                        kcal: acc.kcal + i.kcal,
                        prot: acc.prot + i.prot,
                        carb: acc.carb + i.carb,
                        grasa: acc.grasa + i.grasa
                    }), { kcal: 0, prot: 0, carb: 0, grasa: 0 });
                }
            });
            return withExtras(menuAdaptado);
        }

        return withExtras(menuBase); // Modo estricto devuelve el base
    }

    function getConsumidoHoy() {
        const menu = getMenuDelDia();
        return menu.reduce((acc, c) => ({
            kcal: acc.kcal + c.totales.kcal,
            prot: acc.prot + c.totales.prot,
            carb: acc.carb + c.totales.carb,
            grasa: acc.grasa + c.totales.grasa
        }), { kcal: 0, prot: 0, carb: 0, grasa: 0 });
    }

    // ── Sustitución UI ──

    // Badge de cercanía calórica respecto al alimento original
    function diffBadge(diff) {
        const d = Math.round(diff);
        if (d <= 25) return `<span style="background:rgba(16,185,129,0.18); color:#34D399; font-size:0.62rem; font-weight:700; padding:2px 7px; border-radius:20px; white-space:nowrap;">≈ igual</span>`;
        const color = d <= 70 ? '#FBBF24' : '#F87171';
        const bg = d <= 70 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)';
        return `<span style="background:${bg}; color:${color}; font-size:0.62rem; font-weight:700; padding:2px 7px; border-radius:20px; white-space:nowrap;">±${d} kcal</span>`;
    }

    // Reescala un alimento (porción + macros) para igualar las calorías objetivo.
    // Así un equivalente casero se ajusta a las kcal del alimento que reemplaza.
    function scaleToKcal(a, targetKcal) {
        const f = a.kcal > 0 ? Math.min(3, Math.max(0.3, targetKcal / a.kcal)) : 1;
        const g = a.gramos ? Math.round(a.gramos * f) : null;
        return {
            ...a,
            gramos: g,
            porcion: g ? `${g}g` : a.porcion,
            kcal: Math.round(a.kcal * f),
            prot: Math.round(a.prot * f),
            carb: Math.round(a.carb * f),
            grasa: Math.round(a.grasa * f),
            diff: Math.abs(Math.round(a.kcal * f) - targetKcal)
        };
    }

    // Equivalentes caseros desde ALIMENTOS_DB. Devuelve 10 opciones priorizando
    // la misma categoría del alimento original (p.ej. pan integral → otros
    // carbohidratos) y reescala cada porción para igualar sus calorías.
    function getEquivalentes(item) {
        const db = window.ALIMENTOS_DB || [];
        const orig = db.find(a => a.nombre === item.nombre);
        const cat = orig?.cat || null;
        const score = a =>
            Math.abs(a.kcal - item.kcal) + Math.abs(a.prot - item.prot) * 4
            - (cat && a.cat === cat ? 100000 : 0); // misma categoría siempre primero
        return db
            .filter(a => a.nombre !== item.nombre)
            .sort((a, b) => score(a) - score(b))
            .slice(0, 10)
            .map(a => scaleToKcal(a, item.kcal)); // ajusta porción a las kcal objetivo
    }

    // Productos de tienda del país, ordenados por cercanía calórica al original
    function getEquivalentesTienda(item, country) {
        return getStoreProducts(country)
            .map(p => ({ ...p, diff: Math.abs(p.kcal - item.kcal) }))
            .sort((a, b) => a.diff - b.diff)
            .slice(0, 10);
    }

    function cardCasaHTML(sug, idx) {
        return `
            <div class="sustitucion-card" data-idx="${idx}">
                <div>
                    <div style="font-weight: 600; color: #E0E0E0;">${sug.nombre}</div>
                    <div style="font-size: 0.72rem; color: #A78BFA;">${sug.porcion || ''}</div>
                </div>
                <div style="text-align: right; font-size: 0.78rem; color: var(--text-muted);">
                    <div style="margin-bottom:3px;">${diffBadge(sug.diff)}</div>
                    ${sug.kcal} kcal · P ${sug.prot} · C ${sug.carb} · G ${sug.grasa}
                </div>
            </div>`;
    }

    function cardTiendaHTML(sug, idx) {
        return `
            <div class="sustitucion-card sustitucion-card--tienda" data-idx="${idx}"
                 style="border-left:2px solid #E040FB;">
                <div>
                    <div style="font-weight: 600; color: #E0E0E0;">${sug.nombre}</div>
                    <div style="font-size: 0.72rem; color: #E879F9;">${sug.tiendaEmoji} ${sug.tienda} · ${sug.porcion || ''}</div>
                </div>
                <div style="text-align: right; font-size: 0.78rem; color: var(--text-muted);">
                    <div style="margin-bottom:3px;">${diffBadge(sug.diff)}</div>
                    ${sug.kcal} kcal · P ${sug.prot} · C ${sug.carb} · G ${sug.grasa}
                </div>
            </div>`;
    }

    function openSustitucionModal(item) {
        const modal = document.getElementById('sustitucion-modal');
        const originalInfo = document.getElementById('sustitucion-original-info');
        const sugContainer = document.getElementById('sustitucion-sugerencias-container');

        if (!modal || !originalInfo || !sugContainer) return;

        originalInfo.innerHTML = `Sustituyendo: <strong>${item.nombre}</strong> (${item.gramos || '-'}g) <br> Macros objetivo: ${item.kcal} kcal · P: ${item.prot}g · C: ${item.carb}g · G: ${item.grasa}g`;

        const aplicar = (sug, etiquetaTienda) => {
            addVariation(item.nombre, {
                nombre: etiquetaTienda ? `${sug.nombre} · ${etiquetaTienda}` : sug.nombre,
                gramos: sug.gramos || null,
                kcal: sug.kcal, prot: sug.prot, carb: sug.carb, grasa: sug.grasa
            });
            closeSustitucionModal();
        };

        // Panel de tienda (se reconstruye al cambiar de país)
        function renderTiendaPanel() {
            const country = getCountry();
            const sugTienda = getEquivalentesTienda(item, country);
            const panel = document.getElementById('sust-panel-tienda');
            if (!panel) return;
            panel.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
                    <span class="text-muted" style="font-size:0.72rem;">📍 Tiendas en:</span>
                    <button class="sust-country" data-country="MX"
                        style="font-size:0.7rem; padding:3px 9px; border-radius:20px; border:none; cursor:pointer; ${country === 'MX' ? 'background:var(--gradient-primary); color:#fff;' : 'background:rgba(255,255,255,0.08); color:#bbb;'}">🇲🇽 México</button>
                    <button class="sust-country" data-country="US"
                        style="font-size:0.7rem; padding:3px 9px; border-radius:20px; border:none; cursor:pointer; ${country === 'US' ? 'background:var(--gradient-primary); color:#fff;' : 'background:rgba(255,255,255,0.08); color:#bbb;'}">🇺🇸 USA</button>
                </div>
                <p class="text-muted" style="font-size:0.72rem; margin-bottom:10px;">Si hoy no puedes cocinarlo, elige algo equivalente que consigas en la tienda. Se ajusta a las calorías y actualiza tus macros.</p>
                ${sugTienda.length
                    ? sugTienda.map((s, i) => cardTiendaHTML(s, i)).join('')
                    : '<p class="text-muted" style="font-size:0.78rem;">No hay productos de tienda para este país.</p>'}
            `;
            panel.querySelectorAll('.sustitucion-card--tienda').forEach(card => {
                card.addEventListener('click', () => aplicar(sugTienda[card.dataset.idx], sugTienda[card.dataset.idx].tienda));
            });
            panel.querySelectorAll('.sust-country').forEach(btn => {
                btn.addEventListener('click', () => {
                    localStorage.setItem(COUNTRY_KEY, btn.dataset.country);
                    renderTiendaPanel();
                });
            });
        }

        const equivalentes = getEquivalentes(item);
        const revertBtn = item.isReplacement ? `
            <button id="btn-revertir-sustitucion" class="btn btn--block mt-3" style="background: rgba(239, 68, 68, 0.2); color: #EF4444;">
                🔄 Revertir al alimento original
            </button>` : '';

        sugContainer.innerHTML = `
            <div class="sust-tabs" style="display:flex; gap:6px; margin-bottom:14px;">
                <button class="sust-tab active" data-tab="casa"
                    style="flex:1; padding:9px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:0.8rem; background:var(--rp-accent); color:#04211c;">🍳 Equivalentes</button>
                <button class="sust-tab" data-tab="tienda"
                    style="flex:1; padding:9px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:0.8rem; background:rgba(255,255,255,0.08); color:#bbb;">🛒 De tienda</button>
            </div>
            <div id="sust-panel-casa">
                ${equivalentes.length
                    ? equivalentes.map((s, i) => cardCasaHTML(s, i)).join('')
                    : '<p class="text-muted">No se encontraron equivalentes similares.</p>'}
            </div>
            <div id="sust-panel-tienda" class="hidden"></div>
            ${revertBtn}
        `;

        // Bind equivalentes caseros
        sugContainer.querySelectorAll('#sust-panel-casa .sustitucion-card').forEach(card => {
            card.addEventListener('click', () => aplicar(equivalentes[card.dataset.idx]));
        });

        // Bind toggle de pestañas
        const panelCasa = sugContainer.querySelector('#sust-panel-casa');
        const panelTienda = sugContainer.querySelector('#sust-panel-tienda');
        let tiendaCargada = false;
        sugContainer.querySelectorAll('.sust-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const esTienda = tab.dataset.tab === 'tienda';
                sugContainer.querySelectorAll('.sust-tab').forEach(t => {
                    const on = t.dataset.tab === tab.dataset.tab;
                    t.classList.toggle('active', on);
                    t.style.background = on ? (t.dataset.tab === 'tienda' ? '#E040FB' : 'var(--rp-accent)') : 'rgba(255,255,255,0.08)';
                    t.style.color = on ? (t.dataset.tab === 'tienda' ? '#fff' : '#04211c') : '#bbb';
                });
                panelCasa.classList.toggle('hidden', esTienda);
                panelTienda.classList.toggle('hidden', !esTienda);
                if (esTienda && !tiendaCargada) { renderTiendaPanel(); tiendaCargada = true; }
            });
        });

        // Revertir sustitución
        if (item.isReplacement) {
            document.getElementById('btn-revertir-sustitucion')?.addEventListener('click', () => {
                removeVariation(item.originalName);
                closeSustitucionModal();
            });
        }

        modal.classList.remove('hidden');
    }

    function closeSustitucionModal() {
        document.getElementById('sustitucion-modal')?.classList.add('hidden');
    }

    // ── Render ──

    function barHTML(macro, consumido, target) {
        const pct = target > 0 ? (consumido / target) * 100 : 0;
        const over = pct > 105; // 5% de tolerancia en flexible
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

    function goalSelectorHTML() {
        const goal = getGoal();
        const rec = getRecommendedGoal();
        const raw = getTargetsBaseRaw().kcal;
        const adj = getTargetsBase().kcal;
        const delta = adj - raw;
        const deltaTxt = delta === 0 ? 'mantenimiento'
            : (delta > 0 ? '+' : '−') + Math.abs(delta) + ' kcal';
        return `
            <div style="margin: 2px 0 14px;">
                <div style="display:flex; gap:6px;">
                    ${Object.entries(GOAL_DEFS).map(([k, d]) => {
                        const on = k === goal;
                        return `<button class="goal-chip" data-goal="${k}"
                            style="flex:1; padding:9px 4px; border:none; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.72rem; line-height:1.2;
                                   background:${on ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.06)'}; color:${on ? '#fff' : '#9aa'};">
                            ${d.label}${k === rec ? ' <span style="font-size:0.62rem;">✦</span>' : ''}
                        </button>`;
                    }).join('')}
                </div>
                <div class="text-muted" style="font-size:0.68rem; margin-top:6px; text-align:center;">
                    ${GOAL_DEFS[goal].desc} · ${deltaTxt}${goal === rec ? ' · ✓ recomendado para ti' : ''}
                </div>
            </div>`;
    }

    function quickAccessHTML() {
        const foods = getQuickFoods();
        if (!foods.length) return '';
        return `
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>⚡ Acceso rápido</h4>
                    <span class="text-muted" style="font-size:0.7rem;">toca para sumar a tu día</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
                    ${foods.map(f => {
                        const n = encodeURIComponent(f.nombre);
                        return `<div style="display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:5px 6px 5px 10px;">
                            <button class="quick-fav" data-nombre="${n}" title="Favorito" style="background:none; border:none; cursor:pointer; font-size:0.9rem; line-height:1; color:${f.fav ? '#FBBF24' : '#667085'};">${f.fav ? '★' : '☆'}</button>
                            <button class="quick-add" data-nombre="${n}" style="background:none; border:none; cursor:pointer; color:#E0E0E0; font-size:0.76rem; font-weight:600;">
                                ${f.nombre} <span class="text-muted" style="font-size:0.64rem;">${f.kcal} kcal</span>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    }

    function hydrationCardHTML() {
        const ml = getHydrationHoy();
        const goal = getHydrationGoal();
        const pct = Math.min(100, goal > 0 ? Math.round(ml / goal * 100) : 0);
        const vasos = Math.round(ml / 250);
        return `
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>💧 Hidratación</h4>
                    <span class="rp-badge" style="background:#3B82F6;">${ml} / ${goal} ml</span>
                </div>
                <div class="macro-bar__track" style="margin-top:6px;">
                    <div class="macro-bar__fill" style="width:${pct}%; background:linear-gradient(90deg,#3B82F6AA,#3B82F6);"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; gap:8px;">
                    <span class="text-muted" style="font-size:0.72rem;">≈ ${vasos} vaso${vasos === 1 ? '' : 's'} de 250 ml</span>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn--sm hydration-btn" data-ml="-250" style="background:rgba(255,255,255,0.08); color:#bbb; min-width:42px;">−</button>
                        <button class="btn btn--sm hydration-btn" data-ml="250" style="background:rgba(59,130,246,0.2); color:#93C5FD; font-weight:700;">＋ Vaso</button>
                        <button class="btn btn--sm hydration-btn" data-ml="500" style="background:rgba(59,130,246,0.2); color:#93C5FD; font-weight:700;">＋ Botella</button>
                    </div>
                </div>
            </div>`;
    }

    function render() {
        const container = document.getElementById('nutri-sub-flexible');
        if (!container) return;

        const onboardingView = document.getElementById('nutri-onboarding-view');
        const subtabs = document.querySelector('.nutri-subtabs');
        const usingDefaults = !hasValidBioMacros() && !hasValidManualMacros();

        if (usingDefaults) {
            if (onboardingView) onboardingView.classList.remove('hidden');
            if (subtabs) subtabs.classList.add('hidden');
            container.classList.add('hidden');

            if (window.BioimpedanciaRP) {
                if (!document.getElementById('bio-nombre')) {
                    window.BioimpedanciaRP.init();
                }

                // 300ms: margen para que BioimpedanciaRP.setupEventListeners (200ms) enlace primero
                setTimeout(() => {
                    const btnCalcular = document.getElementById('btn-calcular-bio');
                    const btnContinue = document.getElementById('btn-continue-onboarding');

                    if (btnCalcular && !btnCalcular.dataset.nexusBound) {
                        btnCalcular.dataset.nexusBound = 'true';
                        btnCalcular.addEventListener('click', () => {
                            setTimeout(() => {
                                if (hasValidBioMacros()) {
                                    document.getElementById('btn-calcular-bio')?.classList.add('hidden');
                                    const cont = document.getElementById('btn-continue-onboarding');
                                    if (cont) {
                                        cont.classList.remove('hidden');
                                        setTimeout(() => cont.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                                    }
                                }
                            }, 500);
                        });
                    }

                    if (btnContinue && !btnContinue.dataset.nexusBound) {
                        btnContinue.dataset.nexusBound = 'true';
                        btnContinue.addEventListener('click', () => {
                            onboardingView?.classList.add('hidden');
                            subtabs?.classList.remove('hidden');
                            container.classList.remove('hidden');
                            render();
                        });
                    }
                }, 300);
            }
            return;
        }

        if (onboardingView) onboardingView.classList.add('hidden');
        if (subtabs) subtabs.classList.remove('hidden');
        container.classList.remove('hidden');

        const mode = getMode();
        const targets = getTargetsHoy();
        const menu = getMenuDelDia();
        const consumido = getConsumidoHoy();

        container.innerHTML = `
            <!-- Toggle Estricto / Flexible -->
            <div class="nutri-toggle-container">
                <button class="nutri-toggle-btn ${mode === 'strict' ? 'active' : ''}" data-mode="strict">
                    🔒 Modo Estricto
                </button>
                <button class="nutri-toggle-btn ${mode === 'flexible' ? 'active' : ''}" data-mode="flexible">
                    🔄 Modo Flexible
                </button>
            </div>

            <!-- Progreso Diario -->
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>🎯 Progreso de Hoy</h4>
                    <div style="display: flex; gap: 8px;">
                        <span class="rp-badge" style="background: #E040FB; cursor: pointer;" id="btn-edit-bio" title="Editar Métricas Corporales">⚙️ Ajustar</span>
                        <span class="rp-badge" style="background:var(--rp-accent);">${hoy()}</span>
                    </div>
                </div>
                ${goalSelectorHTML()}
                ${MACROS_UI.map(m => barHTML(m, consumido[m.id], targets[m.id])).join('')}
                ${mode === 'flexible' ? `
                    <div class="alert alert--info mt-2" style="padding: 8px; font-size: 0.75rem;">
                        <span>💡</span>
                        <span>Estás en <strong>Modo Adaptación</strong>. Toca cualquier alimento de tu menú para sustituirlo inteligentemente.</span>
                    </div>
                ` : `
                    <div class="alert alert--info mt-2" style="padding: 8px; font-size: 0.75rem;">
                        <span>🔒</span>
                        <span>Menú fijo diseñado para máxima precisión. No se permiten sustituciones.</span>
                    </div>
                `}
            </div>

            ${hydrationCardHTML()}

            ${quickAccessHTML()}

            <!-- Menú del Día -->
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>🍽️ Mi Menú de Hoy</h4>
                </div>
                ${menu && menu.length ? menu.map(comida => `
                    <div style="margin-top:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.9rem; color: #E0E0E0;">${comida.nombre}</strong>
                            <span class="text-muted" style="font-size:0.7rem;">
                                ${comida.totales.kcal} kcal · P ${comida.totales.prot}g · C ${comida.totales.carb}g · G ${comida.totales.grasa}g
                            </span>
                        </div>
                        <div style="margin-top: 8px;">
                        ${comida.items.map((i, idx) => i.isExtra ? `
                            <div class="food-item-wrapper"
                                 style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:8px 6px; border-radius:6px; border-bottom:1px solid rgba(255,255,255,0.04); background: rgba(224,64,251,0.06); border-left: 2px solid #E040FB;">
                                <span>
                                    🛒 ${i.nombre}
                                    <span class="text-muted" style="font-size:0.65rem;">(${i.gramos || '-'}g)</span>
                                </span>
                                <span style="display:flex; gap:10px; align-items:center;">
                                    <span class="text-muted">${i.kcal} kcal</span>
                                    <button class="btn-remove-extra" data-extra-idx="${i.extraIdx}" title="Quitar"
                                        style="background:none; border:none; color:#EF4444; font-size:1.1rem; line-height:1; cursor:pointer; padding:0 2px;">&times;</button>
                                </span>
                            </div>` : `
                            <div class="food-item-wrapper ${mode === 'flexible' ? 'food-item-flexible' : ''}"
                                 data-c-idx="${menu.indexOf(comida)}" data-i-idx="${idx}"
                                 style="display:flex; justify-content:space-between; font-size:0.8rem; padding:8px 6px; border-radius:6px; border-bottom:1px solid rgba(255,255,255,0.04); ${i.isReplacement ? 'background: rgba(16,185,129,0.05); border-left: 2px solid #10B981;' : ''}">
                                <span>
                                    ${i.isReplacement ? '🔄 ' : ''}${i.nombre}
                                    <span class="text-muted" style="font-size:0.65rem;">(${i.gramos || '-'}g)</span>
                                </span>
                                <span class="${i.isReplacement ? 'text-success' : 'text-muted'}">${i.kcal} kcal</span>
                            </div>`).join('')}
                        </div>
                    </div>`).join('') 
                : '<p class="text-muted" style="font-size:0.8rem; padding:10px;">No se pudo generar el menú. Verifica tus datos.</p>'}
            </div>
        `;

        // Animar barras
        requestAnimationFrame(() => {
            container.querySelectorAll('.macro-bar__fill').forEach(el => {
                el.style.width = el.dataset.width + '%';
            });
        });

        bindEvents(container, menu);
    }

    function bindEvents(container, menu) {
        // Toggle Estricto/Flexible
        container.querySelectorAll('.nutri-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setMode(btn.dataset.mode);
            });
        });

        // Botón Ajustar Bioimpedancia
        document.getElementById('btn-edit-bio')?.addEventListener('click', () => {
            const onboardingView = document.getElementById('nutri-onboarding-view');
            const subtabs = document.querySelector('.nutri-subtabs');
            
            if (onboardingView) onboardingView.classList.remove('hidden');
            if (subtabs) subtabs.classList.add('hidden');
            container.classList.add('hidden'); // Ocultar el menú actual
            
            if (window.BioimpedanciaRP) {
                window.BioimpedanciaRP.init();
                
                setTimeout(() => {
                    const btnCalcular = document.getElementById('btn-calcular-bio');
                    const btnContinue = document.getElementById('btn-continue-onboarding');
                    
                    if (btnCalcular && !btnCalcular.dataset.nexusBound) {
                        btnCalcular.dataset.nexusBound = 'true';
                        btnCalcular.addEventListener('click', () => {
                            setTimeout(() => {
                                if (hasValidBioMacros()) {
                                    btnCalcular.classList.add('hidden');
                                    if (btnContinue) {
                                        btnContinue.classList.remove('hidden');
                                        setTimeout(() => btnContinue.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                                    }
                                }
                            }, 500);
                        });
                    }
                    
                    // Si ya hay datos, mostramos el botón continuar de una vez
                    if (hasValidBioMacros()) {
                        if (btnCalcular) btnCalcular.classList.add('hidden');
                        if (btnContinue) btnContinue.classList.remove('hidden');
                    }

                    if (btnContinue && !btnContinue.dataset.nexusBound) {
                        btnContinue.dataset.nexusBound = 'true';
                        btnContinue.addEventListener('click', () => {
                            onboardingView?.classList.add('hidden');
                            subtabs?.classList.remove('hidden');
                            container.classList.remove('hidden');
                            render();
                        });
                    }
                }, 300);
            }
        });

        // Eventos Click en Alimentos (Solo en Flexible)
        if (getMode() === 'flexible') {
            container.querySelectorAll('.food-item-flexible').forEach(el => {
                el.addEventListener('click', (e) => {
                    const cIdx = el.dataset.cIdx;
                    const iIdx = el.dataset.iIdx;
                    const item = menu[cIdx].items[iIdx];
                    openSustitucionModal(item);
                });
            });
        }

        // Quitar extras de tienda (disponible en cualquier modo)
        container.querySelectorAll('.btn-remove-extra').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFood(parseInt(btn.dataset.extraIdx));
            });
        });

        // Hidratación
        container.querySelectorAll('.hydration-btn').forEach(btn => {
            btn.addEventListener('click', () => addWater(parseInt(btn.dataset.ml)));
        });

        // Objetivo nutricional (Definir / Mantener / Volumen)
        container.querySelectorAll('.goal-chip').forEach(btn => {
            btn.addEventListener('click', () => setGoal(btn.dataset.goal));
        });

        // Acceso rápido (favoritos / recientes)
        container.querySelectorAll('.quick-add').forEach(btn => {
            btn.addEventListener('click', () => quickAdd(decodeURIComponent(btn.dataset.nombre)));
        });
        container.querySelectorAll('.quick-fav').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(decodeURIComponent(btn.dataset.nombre)); });
        });

        // Modal close
        document.getElementById('btn-close-sustitucion')?.addEventListener('click', closeSustitucionModal);
        
        // Cerrar al clickear fuera
        document.getElementById('sustitucion-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'sustitucion-modal') closeSustitucionModal();
        });
    }

    function init() {
        render();
    }

    // Adaptar métodos antiguos para retrocompatibilidad
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

    // addFood y removeFood se deprecian bajo este nuevo paradigma, pero se pueden mantener como no-op o wrappers.

    return { init, render, getTargetsHoy, getTargetsBase, getConsumidoHoy, getRemainingHoy, addFood, removeFood, getExtrasHoy, addWater, getHydrationHoy, getGoal, setGoal, getRecommendedGoal };
})();

if (typeof window !== 'undefined') {
    window.NutritionFlexible = NutritionFlexible;
}
