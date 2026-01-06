// ============================================
// REST-PAUSE SYSTEM - NEXUS PATCH V3
// Archivo: rest-pause-inject.js
// ============================================
// Uses JavaScript Proxy to intercept ALL RoutineGenerator instantiations
// and fix the methodology ID extraction issue at the most fundamental level
// ============================================

(function () {
    'use strict';

    console.log('🔄 Rest-Pause Inject V3: Using Proxy approach...');

    // ========== CONFIGURATION ==========
    const REST_PAUSE_CONFIG = {
        id: 'rest-pause',
        nombre: 'Rest-Pause System',
        autor: 'Raúl Carrasco',

        estructuraSemanas: {
            1: 'RP-Base',
            2: 'RP-Cluster',
            3: 'RP-Extended',
            4: 'Deload',
            5: 'RP-Cluster',
            6: 'Deload'
        },

        parametrosSemana: {
            'RP-Base': {
                series: '2-3',
                reps: '8-12 + Rest-Pause (2 secuencias)',
                rir: 1,
                descanso: '2-3 min',
                tecnicas: ['Rest-Pause Clásico'],
                intensidad: '70-75% 1RM',
                notas: 'Adaptación al sistema. 10-15s entre secuencias.'
            },
            'RP-Cluster': {
                series: '2',
                reps: '6-8 + Cluster + Rest-Pause',
                rir: 0,
                descanso: '2-3 min',
                tecnicas: ['Cluster Sets', 'Rest-Pause Extendido'],
                intensidad: '75-80% 1RM',
                notas: 'Máxima tensión mecánica. 15-20s entre secuencias.'
            },
            'RP-Extended': {
                series: '1-2',
                reps: '10-12 + 3 secuencias Rest-Pause',
                rir: 0,
                descanso: '3 min',
                tecnicas: ['Rest-Pause Extremo', 'Myo-Reps'],
                intensidad: '70-75% 1RM',
                notas: 'Máximo estrés metabólico. 10-15s entre secuencias.'
            },
            'Deload': {
                series: '2',
                reps: '12-15',
                rir: 3,
                descanso: '90s',
                tecnicas: [],
                intensidad: '50-60% 1RM',
                notas: 'Semana de recuperación activa.'
            }
        },

        tip: 'Rest-Pause funciona mejor con frecuencias de 4-5 días para permitir recuperación adecuada'
    };

    // ========== HELPER FUNCTION ==========
    window.getMetodologiaId = function (metodologia) {
        if (metodologia && typeof metodologia === 'object') {
            return metodologia.id || metodologia.nombre || 'y3t';
        }
        if (typeof metodologia === 'string') {
            return metodologia;
        }
        return 'y3t';
    };

    // ========== PATCH GLOBAL DATA ==========
    function patchGlobalData() {
        // METODOLOGIAS_BASE
        if (typeof METODOLOGIAS_BASE !== 'undefined' && !METODOLOGIAS_BASE['rest-pause']) {
            METODOLOGIAS_BASE['rest-pause'] = {
                id: 'rest-pause',
                nombre: 'Rest-Pause System',
                autor: 'Raúl Carrasco',
                tipo: 'Híbrido',
                descripcion: 'Sistema de alta intensidad con series extendidas mediante micro-descansos.',
                nivelMinimo: 'intermedio'
            };
            console.log('✅ METODOLOGIAS_BASE parcheado');
        }

        // AJUSTES_POR_METODOLOGIA
        if (typeof AJUSTES_POR_METODOLOGIA !== 'undefined' && !AJUSTES_POR_METODOLOGIA['rest-pause']) {
            AJUSTES_POR_METODOLOGIA['rest-pause'] = {
                frecuenciaRecomendada: [4, 5],
                descripcionFrec: REST_PAUSE_CONFIG.tip,
                divisionesCompatibles: ['upper-lower', 'push-pull-legs', 'full-body'],
                series: { min: 1, max: 3 },
                reps: { min: 6, max: 12 },
                rir: { min: 0, max: 1 },
                descanso: { min: 120, max: 180 }
            };
            console.log('✅ AJUSTES_POR_METODOLOGIA parcheado');
        }
    }

    // ========== PROXY APPROACH - INTERCEPT EVERYTHING ==========
    function installProxy() {
        if (typeof RoutineGenerator === 'undefined') {
            console.log('⏳ Esperando RoutineGenerator...');
            setTimeout(installProxy, 100);
            return;
        }

        if (window._rpProxyInstalled) {
            console.log('✓ Proxy ya instalado');
            return;
        }

        const OriginalGenerator = window.RoutineGenerator;

        // Create a Proxy that wraps the constructor
        window.RoutineGenerator = new Proxy(OriginalGenerator, {
            construct(target, args) {
                const [config] = args;

                // FIX: Extract ID from methodology object
                if (config && config.metodologia) {
                    const originalMetodologia = config.metodologia;
                    const extractedId = getMetodologiaId(originalMetodologia);
                    console.log(`🔧 Proxy: Extracted ID "${extractedId}" from:`, originalMetodologia);

                    // Create a modified config with string ID
                    args[0] = { ...config, metodologia: extractedId };
                }

                // Create instance with fixed config
                const instance = Reflect.construct(target, args);

                // Ensure the instance has the correct string ID
                instance.metodologia = getMetodologiaId(instance.metodologia);
                console.log(`✅ Proxy: Instance metodologia = "${instance.metodologia}"`);

                // Patch methods on this specific instance
                patchInstance(instance);

                return instance;
            },

            // Forward all other operations to the original
            get(target, prop) {
                if (prop === '_rpProxyInstalled') return true;
                return Reflect.get(target, prop);
            },

            set(target, prop, value) {
                return Reflect.set(target, prop, value);
            }
        });

        // Copy prototype methods
        window.RoutineGenerator.prototype = OriginalGenerator.prototype;

        window._rpProxyInstalled = true;
        console.log('✅ Proxy instalado en RoutineGenerator');
    }

    // ========== PATCH INSTANCE METHODS ==========
    function patchInstance(instance) {
        const metodologiaId = getMetodologiaId(instance.metodologia);

        if (metodologiaId === 'rest-pause') {
            console.log('🔧 Parchando instancia para rest-pause...');

            // Override getTipoSemana for this instance
            const originalGetTipoSemana = instance.getTipoSemana?.bind(instance);
            instance.getTipoSemana = function (numSemana) {
                const tipo = REST_PAUSE_CONFIG.estructuraSemanas[numSemana] || 'RP-Base';
                console.log(`📅 getTipoSemana(${numSemana}) = "${tipo}"`);
                return tipo;
            };

            // Override getParametrosSemana for this instance
            const originalGetParametrosSemana = instance.getParametrosSemana?.bind(instance);
            instance.getParametrosSemana = function (tipoSemana) {
                if (REST_PAUSE_CONFIG.parametrosSemana[tipoSemana]) {
                    console.log(`📊 getParametrosSemana("${tipoSemana}") = rest-pause params`);
                    return REST_PAUSE_CONFIG.parametrosSemana[tipoSemana];
                }
                return originalGetParametrosSemana ? originalGetParametrosSemana(tipoSemana) : null;
            };
        }
    }

    // ========== PATCH PROTOTYPE AS FALLBACK ==========
    function patchPrototype() {
        if (typeof RoutineGenerator === 'undefined') {
            setTimeout(patchPrototype, 100);
            return;
        }

        const proto = RoutineGenerator.prototype;

        // Patch getTipoSemana on prototype
        if (proto.getTipoSemana && !proto._rpTipoSemanaPatched) {
            const original = proto.getTipoSemana;
            proto.getTipoSemana = function (numSemana) {
                const metodologiaId = getMetodologiaId(this.metodologia);
                if (metodologiaId === 'rest-pause') {
                    const tipo = REST_PAUSE_CONFIG.estructuraSemanas[numSemana] || 'RP-Base';
                    console.log(`📅 [Prototype] getTipoSemana(${numSemana}) = "${tipo}"`);
                    return tipo;
                }
                return original.call(this, numSemana);
            };
            proto._rpTipoSemanaPatched = true;
            console.log('✅ getTipoSemana prototype parcheado');
        }

        // Patch getParametrosSemana on prototype  
        if (proto.getParametrosSemana && !proto._rpParametrosSemanaPatched) {
            const original = proto.getParametrosSemana;
            proto.getParametrosSemana = function (tipoSemana) {
                if (REST_PAUSE_CONFIG.parametrosSemana[tipoSemana]) {
                    console.log(`📊 [Prototype] getParametrosSemana("${tipoSemana}") = rest-pause params`);
                    return REST_PAUSE_CONFIG.parametrosSemana[tipoSemana];
                }
                return original.call(this, tipoSemana);
            };
            proto._rpParametrosSemanaPatched = true;
            console.log('✅ getParametrosSemana prototype parcheado');
        }
    }

    // ========== LAST RESORT: OBSERVE AND FIX DOM ==========
    function observeAndFixDOM() {
        const observer = new MutationObserver(() => {
            // Fix any Y3T text that should be Rest-Pause
            const metodologiaElement = document.querySelector('[data-metodologia]');
            const currentId = metodologiaElement?.dataset?.metodologia ||
                getMetodologiaId(window.AppState?.rutinaConfig?.metodologia);

            if (currentId === 'rest-pause') {
                // Fix titles
                document.querySelectorAll('h1, h2, .routine-title').forEach(el => {
                    if (el.textContent?.toLowerCase().includes('y3t')) {
                        el.textContent = el.textContent.replace(/y3t/gi, 'Rest-Pause');
                        console.log('🔧 Fixed title text');
                    }
                });

                // Fix stat values
                document.querySelectorAll('.stat-value').forEach(el => {
                    if (el.textContent?.toLowerCase().trim() === 'y3t') {
                        el.textContent = 'rest-pause';
                        console.log('🔧 Fixed stat value');
                    }
                });

                // Fix week type text
                document.querySelectorAll('.week-type, .tipo-semana').forEach(el => {
                    const text = el.textContent?.toLowerCase().trim();
                    if (['pesado', 'moderado', 'ligero'].includes(text)) {
                        const weekNum = parseInt(el.closest('[data-semana]')?.dataset?.semana || '1');
                        el.textContent = REST_PAUSE_CONFIG.estructuraSemanas[weekNum] || 'RP-Base';
                        console.log('🔧 Fixed week type');
                    }
                });

                // Fix tip text
                document.querySelectorAll('.tip, .info-text, .description').forEach(el => {
                    if (el.textContent?.includes('Y3T funciona mejor')) {
                        el.textContent = REST_PAUSE_CONFIG.tip;
                        console.log('🔧 Fixed tip text');
                    }
                });
            }
        });

        setTimeout(() => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
            console.log('✅ DOM observer activo');
        }, 1000);
    }

    // ========== FORCE PATCH (MANUAL TRIGGER) ==========
    window.forceRestPausePatch = function () {
        console.log('⚡ Forzando parche V3...');
        patchGlobalData();
        patchPrototype();

        // If there's an existing generator instance, patch it
        if (window.generadorRutina) {
            window.generadorRutina.metodologia = getMetodologiaId(window.generadorRutina.metodologia);
            patchInstance(window.generadorRutina);
        }

        console.log('✅ Parche V3 forzado aplicado');
    };

    // ========== INITIALIZE ==========
    function init() {
        patchGlobalData();
        installProxy();
        patchPrototype();
        observeAndFixDOM();

        // Also apply after a delay to catch late-loaded modules
        setTimeout(() => {
            patchGlobalData();
            patchPrototype();
            window.forceRestPausePatch();
        }, 2000);

        console.log('🎉 Rest-Pause Inject V3: Inicialización completa');
    }

    // ========== START ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
