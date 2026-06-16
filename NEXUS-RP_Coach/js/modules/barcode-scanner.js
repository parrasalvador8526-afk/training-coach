/**
 * NEXUS-RP Coach - Escáner de Códigos de Barras
 * BarcodeDetector nativo → fallback ZXing (CDN, carga perezosa).
 * Busca macros en Open Food Facts (gratuita, sin key) con cache local
 * para funcionar sin señal dentro de la tienda.
 */
const BarcodeScannerRP = (() => {
    'use strict';

    const OFF_API = 'https://world.openfoodfacts.org/api/v2/product/';
    const OFF_FIELDS = '?fields=product_name,product_name_es,brands,nutriments';
    const CACHE_KEY = 'rpCoach_off_cache';
    const ZXING_CDN = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';

    let stream = null;
    let scanning = false;
    let zxingReader = null;
    let currentProduct = null;

    // ── Cache de productos ──

    function getCache() {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
        catch { return {}; }
    }

    function cacheProduct(code, product) {
        const cache = getCache();
        cache[code] = { ...product, ts: Date.now() };
        // Limitar a 100 productos
        const keys = Object.keys(cache);
        if (keys.length > 100) {
            keys.sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0));
            delete cache[keys[0]];
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    // ── Open Food Facts ──

    async function lookupBarcode(code) {
        code = String(code).trim();
        const cached = getCache()[code];

        try {
            const res = await fetch(OFF_API + encodeURIComponent(code) + '.json' + OFF_FIELDS);
            const data = await res.json();
            if (data.status === 1 && data.product) {
                const n = data.product.nutriments || {};
                const product = {
                    codigo: code,
                    nombre: data.product.product_name_es || data.product.product_name || 'Producto ' + code,
                    marca: data.product.brands || '',
                    kcal100: Math.round(n['energy-kcal_100g'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)),
                    prot100: n['proteins_100g'] || 0,
                    carb100: n['carbohydrates_100g'] || 0,
                    grasa100: n['fat_100g'] || 0
                };
                cacheProduct(code, product);
                return product;
            }
            return cached || null;
        } catch {
            // Sin internet: usar cache (clave para el súper sin señal)
            return cached || null;
        }
    }

    // ── Detección ──

    async function loadZXing() {
        if (window.ZXing) return true;
        return new Promise(resolve => {
            const script = document.createElement('script');
            script.src = ZXING_CDN;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    async function startCamera() {
        const video = document.getElementById('scanner-video');
        const status = document.getElementById('scanner-status');
        if (!video) return;

        if (!window.isSecureContext) {
            setStatus('🔒 La cámara requiere HTTPS o localhost. Sirve la app con <code>npx serve</code> (ver COMO_SERVIR_LA_APP.md) o usa la entrada manual de abajo.');
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus('Este navegador no soporta cámara. Usa la entrada manual.');
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            video.srcObject = stream;
            video.style.display = 'block';
            await video.play();
            scanning = true;
            document.getElementById('btn-scanner-start')?.classList.add('hidden');
            document.getElementById('btn-scanner-stop')?.classList.remove('hidden');

            if ('BarcodeDetector' in window) {
                setStatus('📷 Apunta al código de barras…');
                scanLoopNative(video);
            } else if (await loadZXing()) {
                setStatus('📷 Apunta al código de barras… (modo compatibilidad)');
                scanLoopZXing(video);
            } else {
                setStatus('No se pudo cargar el lector. Usa la entrada manual.');
                stopCamera();
            }
        } catch (e) {
            setStatus('No se pudo acceder a la cámara (' + e.name + '). Usa la entrada manual.');
        }
    }

    async function scanLoopNative(video) {
        const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
        });
        const tick = async () => {
            if (!scanning) return;
            try {
                const codes = await detector.detect(video);
                if (codes.length) {
                    onCodeDetected(codes[0].rawValue);
                    return;
                }
            } catch { }
            requestAnimationFrame(tick);
        };
        tick();
    }

    function scanLoopZXing(video) {
        try {
            zxingReader = new window.ZXing.BrowserMultiFormatReader();
            zxingReader.decodeFromVideoElement(video, (result) => {
                if (result && scanning) onCodeDetected(result.getText());
            });
        } catch {
            setStatus('Error iniciando el lector. Usa la entrada manual.');
        }
    }

    function stopCamera() {
        scanning = false;
        if (zxingReader) { try { zxingReader.reset(); } catch { } zxingReader = null; }
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        const video = document.getElementById('scanner-video');
        if (video) { video.srcObject = null; video.style.display = 'none'; }
        document.getElementById('btn-scanner-start')?.classList.remove('hidden');
        document.getElementById('btn-scanner-stop')?.classList.add('hidden');
    }

    async function onCodeDetected(code) {
        stopCamera();
        if (navigator.vibrate) navigator.vibrate(80);
        setStatus('✅ Código <strong>' + code + '</strong> detectado. Buscando…');
        await searchAndShow(code);
    }

    async function searchAndShow(code) {
        const resultBox = document.getElementById('scanner-result');
        if (resultBox) resultBox.innerHTML = '<div class="skeleton" style="height:80px; margin-top:10px;"></div>';

        const product = await lookupBarcode(code);
        if (!product) {
            setStatus('❌ Producto no encontrado en Open Food Facts. Regístralo manualmente en el Plan Flexible.');
            if (resultBox) resultBox.innerHTML = '';
            return;
        }
        currentProduct = product;
        setStatus('');
        if (resultBox) {
            resultBox.innerHTML = `
                <div class="card mt-2" style="border:1px solid rgba(0,230,118,0.3);">
                    <div class="card__header">
                        <h4 style="font-size:0.9rem;">🏷️ ${product.nombre}</h4>
                    </div>
                    ${product.marca ? `<p class="text-muted" style="font-size:0.72rem;">${product.marca}</p>` : ''}
                    <p style="font-size:0.78rem; margin-top:6px;">
                        Por 100g: <strong>${product.kcal100} kcal</strong> · P ${product.prot100}g · C ${product.carb100}g · G ${product.grasa100}g
                    </p>
                    <div class="form-group mt-2">
                        <label class="form-label" style="font-size:0.75rem;">¿Cuántos gramos consumiste?</label>
                        <input type="number" id="scanner-grams" class="form-input" value="100" min="1">
                    </div>
                    <button id="btn-scanner-add" class="btn btn--primary btn--block mt-2">＋ Registrar en mi día</button>
                </div>`;

            document.getElementById('btn-scanner-add')?.addEventListener('click', () => {
                const g = parseFloat(document.getElementById('scanner-grams')?.value) || 100;
                const f = g / 100;
                if (window.NutritionFlexible) {
                    NutritionFlexible.addFood({
                        nombre: product.nombre,
                        kcal: product.kcal100 * f,
                        prot: product.prot100 * f,
                        carb: product.carb100 * f,
                        grasa: product.grasa100 * f,
                        gramos: g,
                        fuente: 'escaner'
                    });
                    setStatus('✅ Registrado: ' + product.nombre + ' (' + g + 'g). Revisa tus barras en "Hoy".');
                    resultBox.innerHTML = '';
                }
            });
        }
    }

    function setStatus(html) {
        const status = document.getElementById('scanner-status');
        if (status) status.innerHTML = html;
    }

    // ── Render ──

    function render() {
        const container = document.getElementById('nutri-sub-scanner');
        if (!container) return;

        container.innerHTML = `
            <div class="card glass-card mt-2">
                <div class="card__header">
                    <h4>📷 Escáner de Alimentos</h4>
                    <span class="rp-badge" style="background:#10B981;">Open Food Facts</span>
                </div>
                <p class="text-muted" style="font-size:0.78rem;">Escanea el código de barras de cualquier producto y regístralo en tu Plan Flexible con sus macros reales.</p>

                <video id="scanner-video" playsinline muted style="display:none; margin-top:10px;"></video>
                <div id="scanner-status" class="scanner-status"></div>

                <button id="btn-scanner-start" class="btn btn--primary btn--block mt-2">📷 Iniciar escáner</button>
                <button id="btn-scanner-stop" class="btn btn--block mt-2 hidden"
                    style="background:var(--rp-danger); color:white;">⏹ Detener cámara</button>

                <div class="form-group mt-3">
                    <label class="form-label" style="font-size:0.75rem;">O escribe el código de barras</label>
                    <div style="display:flex; gap:6px;">
                        <input type="text" id="scanner-manual-code" class="form-input" inputmode="numeric"
                            placeholder="Ej. 7501055300846">
                        <button id="btn-scanner-lookup" class="btn"
                            style="background:var(--rp-accent); color:#04211c; font-weight:800; min-width:90px;">Buscar</button>
                    </div>
                </div>
                <div id="scanner-result"></div>
            </div>

            ${calculadoraHTML()}
        `;

        container.querySelector('#btn-scanner-start')?.addEventListener('click', startCamera);
        container.querySelector('#btn-scanner-stop')?.addEventListener('click', stopCamera);
        container.querySelector('#btn-scanner-lookup')?.addEventListener('click', () => {
            const code = container.querySelector('#scanner-manual-code')?.value.trim();
            if (code) searchAndShow(code);
        });

        bindCalculadora(container);
    }

    // ── Calculadora de calorías (sin código de barras) ──

    function r(n) { return Math.round((Number(n) || 0)); }
    function r1(n) { const v = Number(n) || 0; return Math.round(v * 10) / 10; }

    function calculadoraHTML() {
        const db = window.ALIMENTOS_DB || [];
        const opciones = db
            .map((a, i) => `<option value="${i}">${a.nombre} (${a.porcion})</option>`)
            .join('');
        return `
            <div class="card glass-card mt-2" id="calc-card">
                <div class="card__header">
                    <h4>🧮 Calculadora de calorías</h4>
                    <span class="rp-badge" style="background:var(--rp-accent); color:#04211c;">Sin código</span>
                </div>
                <p class="text-muted" style="font-size:0.78rem;">¿Comida casera, fruta a granel o restaurante? Calcula sus calorías y macros y súmalos a tu día.</p>

                <div class="calc-tabs" style="display:flex; gap:6px; margin:12px 0;">
                    <button class="calc-tab active" data-tab="alimento" style="flex:1; padding:8px; border:none; border-radius:9px; cursor:pointer; font-weight:700; font-size:0.74rem; background:var(--rp-accent); color:#04211c;">🍎 Alimento</button>
                    <button class="calc-tab" data-tab="macros" style="flex:1; padding:8px; border:none; border-radius:9px; cursor:pointer; font-weight:700; font-size:0.74rem; background:rgba(255,255,255,0.08); color:#bbb;">💪 Macros</button>
                    <button class="calc-tab" data-tab="etiqueta" style="flex:1; padding:8px; border:none; border-radius:9px; cursor:pointer; font-weight:700; font-size:0.74rem; background:rgba(255,255,255,0.08); color:#bbb;">🏷️ Etiqueta</button>
                </div>

                <!-- Modo 1: Por alimento (ALIMENTOS_DB) -->
                <div id="calc-panel-alimento" class="calc-panel">
                    <div class="form-group">
                        <label class="form-label" style="font-size:0.75rem;">Elige un alimento</label>
                        <select id="calc-food" class="form-input">${opciones}</select>
                    </div>
                    <div class="form-group mt-2">
                        <label class="form-label" style="font-size:0.75rem;">Gramos consumidos</label>
                        <input type="number" id="calc-food-grams" class="form-input" value="100" min="1" inputmode="numeric">
                    </div>
                </div>

                <!-- Modo 2: Por macros (calcula kcal) -->
                <div id="calc-panel-macros" class="calc-panel hidden">
                    <div class="form-group">
                        <label class="form-label" style="font-size:0.75rem;">Nombre (opcional)</label>
                        <input type="text" id="calc-macro-name" class="form-input" placeholder="Ej. Tacos de la calle">
                    </div>
                    <div style="display:flex; gap:6px;" class="mt-2">
                        <div class="form-group" style="flex:1;"><label class="form-label" style="font-size:0.72rem;">Proteína (g)</label><input type="number" id="calc-macro-p" class="form-input" value="0" min="0" inputmode="decimal"></div>
                        <div class="form-group" style="flex:1;"><label class="form-label" style="font-size:0.72rem;">Carbos (g)</label><input type="number" id="calc-macro-c" class="form-input" value="0" min="0" inputmode="decimal"></div>
                        <div class="form-group" style="flex:1;"><label class="form-label" style="font-size:0.72rem;">Grasas (g)</label><input type="number" id="calc-macro-g" class="form-input" value="0" min="0" inputmode="decimal"></div>
                    </div>
                </div>

                <!-- Modo 3: Por etiqueta (valores por 100g) -->
                <div id="calc-panel-etiqueta" class="calc-panel hidden">
                    <div class="form-group">
                        <label class="form-label" style="font-size:0.75rem;">Nombre (opcional)</label>
                        <input type="text" id="calc-lbl-name" class="form-input" placeholder="Ej. Galletas marca X">
                    </div>
                    <p class="text-muted" style="font-size:0.7rem; margin-top:6px;">Valores por 100 g (como vienen en la etiqueta):</p>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <div class="form-group" style="flex:1; min-width:70px;"><label class="form-label" style="font-size:0.72rem;">kcal/100g</label><input type="number" id="calc-lbl-kcal" class="form-input" value="0" min="0" inputmode="numeric"></div>
                        <div class="form-group" style="flex:1; min-width:60px;"><label class="form-label" style="font-size:0.72rem;">P/100g</label><input type="number" id="calc-lbl-p" class="form-input" value="0" min="0" inputmode="decimal"></div>
                        <div class="form-group" style="flex:1; min-width:60px;"><label class="form-label" style="font-size:0.72rem;">C/100g</label><input type="number" id="calc-lbl-c" class="form-input" value="0" min="0" inputmode="decimal"></div>
                        <div class="form-group" style="flex:1; min-width:60px;"><label class="form-label" style="font-size:0.72rem;">G/100g</label><input type="number" id="calc-lbl-g" class="form-input" value="0" min="0" inputmode="decimal"></div>
                    </div>
                    <div class="form-group mt-2">
                        <label class="form-label" style="font-size:0.75rem;">Gramos consumidos</label>
                        <input type="number" id="calc-lbl-grams" class="form-input" value="100" min="1" inputmode="numeric">
                    </div>
                </div>

                <div id="calc-result" class="card mt-2" style="background:rgba(0,230,118,0.06); border:1px solid rgba(0,230,118,0.25); padding:12px; text-align:center;">
                    <div style="font-size:1.5rem; font-weight:800; color:#34D399;" id="calc-kcal">0 kcal</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);" id="calc-macros">P 0g · C 0g · G 0g</div>
                </div>
                <button id="calc-add" class="btn btn--primary btn--block mt-2">＋ Registrar en mi día</button>
            </div>
        `;
    }

    // Estado actual de la calculadora según el modo activo
    function calcActiveMode(container) {
        const tab = container.querySelector('.calc-tab.active');
        return tab ? tab.dataset.tab : 'alimento';
    }

    function calcCompute(container) {
        const mode = calcActiveMode(container);
        const db = window.ALIMENTOS_DB || [];
        if (mode === 'alimento') {
            const idx = parseInt(container.querySelector('#calc-food')?.value);
            const food = db[idx];
            const g = parseFloat(container.querySelector('#calc-food-grams')?.value) || 0;
            if (!food || !food.gramos || g <= 0) return null;
            const f = g / food.gramos;
            return { nombre: food.nombre, gramos: r(g), kcal: r(food.kcal * f), prot: r1(food.prot * f), carb: r1(food.carb * f), grasa: r1(food.grasa * f) };
        }
        if (mode === 'macros') {
            const p = parseFloat(container.querySelector('#calc-macro-p')?.value) || 0;
            const c = parseFloat(container.querySelector('#calc-macro-c')?.value) || 0;
            const gr = parseFloat(container.querySelector('#calc-macro-g')?.value) || 0;
            const nombre = container.querySelector('#calc-macro-name')?.value.trim() || 'Alimento manual';
            return { nombre, gramos: null, kcal: r(p * 4 + c * 4 + gr * 9), prot: r1(p), carb: r1(c), grasa: r1(gr) };
        }
        // etiqueta
        const k = parseFloat(container.querySelector('#calc-lbl-kcal')?.value) || 0;
        const p = parseFloat(container.querySelector('#calc-lbl-p')?.value) || 0;
        const c = parseFloat(container.querySelector('#calc-lbl-c')?.value) || 0;
        const gr = parseFloat(container.querySelector('#calc-lbl-g')?.value) || 0;
        const g = parseFloat(container.querySelector('#calc-lbl-grams')?.value) || 0;
        const nombre = container.querySelector('#calc-lbl-name')?.value.trim() || 'Producto (etiqueta)';
        if (g <= 0) return null;
        const f = g / 100;
        return { nombre, gramos: r(g), kcal: r(k * f), prot: r1(p * f), carb: r1(c * f), grasa: r1(gr * f) };
    }

    function calcRefresh(container) {
        const res = calcCompute(container);
        const kEl = container.querySelector('#calc-kcal');
        const mEl = container.querySelector('#calc-macros');
        if (!kEl || !mEl) return;
        if (!res) { kEl.textContent = '0 kcal'; mEl.textContent = 'Completa los datos'; return; }
        kEl.textContent = res.kcal + ' kcal';
        mEl.textContent = `P ${res.prot}g · C ${res.carb}g · G ${res.grasa}g${res.gramos ? ' · ' + res.gramos + 'g' : ''}`;
    }

    function bindCalculadora(container) {
        // Cambio de pestañas
        container.querySelectorAll('.calc-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.calc-tab').forEach(t => {
                    const on = t === tab;
                    t.classList.toggle('active', on);
                    t.style.background = on ? 'var(--rp-accent)' : 'rgba(255,255,255,0.08)';
                    t.style.color = on ? '#04211c' : '#bbb';
                });
                ['alimento', 'macros', 'etiqueta'].forEach(m =>
                    container.querySelector('#calc-panel-' + m)?.classList.toggle('hidden', m !== tab.dataset.tab));
                calcRefresh(container);
            });
        });

        // Recalcular en vivo ante cualquier cambio
        container.querySelectorAll('#calc-card input, #calc-card select').forEach(el => {
            el.addEventListener('input', () => calcRefresh(container));
            el.addEventListener('change', () => calcRefresh(container));
        });

        // Registrar en el día
        container.querySelector('#calc-add')?.addEventListener('click', () => {
            const res = calcCompute(container);
            if (!res || res.kcal <= 0) {
                setStatus('⚠️ Completa los datos: las calorías deben ser mayores a 0.');
                return;
            }
            if (window.NutritionFlexible?.addFood) {
                NutritionFlexible.addFood({ ...res, fuente: 'calculadora' });
                setStatus('✅ Registrado: ' + res.nombre + ' (' + res.kcal + ' kcal). Revisa tus barras en "Mi Menú de Hoy".');
            }
        });

        calcRefresh(container);
    }

    function init() {
        render();
    }

    return { init, render, lookupBarcode, stopCamera };
})();

if (typeof window !== 'undefined') {
    window.BarcodeScannerRP = BarcodeScannerRP;
}
