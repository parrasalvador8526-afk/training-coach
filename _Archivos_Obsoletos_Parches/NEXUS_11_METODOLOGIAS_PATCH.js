/**
 * NEXUS 11 Metodologías Patch v2.0
 * ================================
 * Este parche corrige el problema donde solo aparecen 7 de las 11 metodologías
 * en el selector de rutinas.
 * 
 * Metodologías agregadas:
 * - GVT (German Volume Training) - Tipo: "Alto Volumen"
 * - DUP (Daily Undulating Periodization) - Tipo: "Periodización"
 * - 5/3/1 (Jim Wendler) - Tipo: "Fuerza"
 * - DC Training (Dante Trudel) - Tipo: "Alta Intensidad"
 * 
 * Fecha: 2026-01-02 v2.0 - Corregido bug de parámetros
 */

(function () {
    'use strict';

    console.log('🔧 NEXUS 11 Metodologías Patch v2.0 - Iniciando...');

    // ============================================
    // 1. DEFINIR LOS INDICADORES PARA LAS METODOLOGÍAS FALTANTES
    // ============================================

    const indicadoresFaltantes = {
        'gvt': {
            intensidad: 60,
            volumen: 100,
            frecuencia: 70,
            fatiga: 90,
            tiempo: 75
        },
        'dup': {
            intensidad: 75,
            volumen: 80,
            frecuencia: 85,
            fatiga: 70,
            tiempo: 70
        },
        '531': {
            intensidad: 85,
            volumen: 60,
            frecuencia: 65,
            fatiga: 55,
            tiempo: 60
        },
        'dc': {
            intensidad: 95,
            volumen: 40,
            frecuencia: 50,
            fatiga: 85,
            tiempo: 45
        }
    };

    // Agregar indicadores al objeto global si existe
    if (window.indicadoresMetodologia) {
        Object.assign(window.indicadoresMetodologia, indicadoresFaltantes);
        console.log('✅ Indicadores agregados para: GVT, DUP, 5/3/1, DC Training');
    }

    // ============================================
    // 2. DEFINIR AJUSTES POR METODOLOGÍA FALTANTES
    // ============================================

    const ajustesFaltantes = {
        'gvt': {
            factorVolumen: 1.5,
            factorIntensidad: 0.6,
            seriesBase: 10,
            repsBase: 10,
            descansoBase: 60,
            tecnicasPermitidas: ['superseries'],
            enfoque: 'volumen',
            progresion: 'lineal'
        },
        'dup': {
            factorVolumen: 1.0,
            factorIntensidad: 0.85,
            seriesBase: 4,
            repsBase: null,
            descansoBase: 120,
            tecnicasPermitidas: ['cluster', 'pausa'],
            enfoque: 'periodizacion',
            progresion: 'ondulante'
        },
        '531': {
            factorVolumen: 0.7,
            factorIntensidad: 0.9,
            seriesBase: 3,
            repsBase: null,
            descansoBase: 180,
            tecnicasPermitidas: ['joker', 'fsl', 'bbb'],
            enfoque: 'fuerza',
            progresion: 'porcentual'
        },
        'dc': {
            factorVolumen: 0.4,
            factorIntensidad: 1.0,
            seriesBase: 1,
            repsBase: null,
            descansoBase: 30,
            tecnicasPermitidas: ['rest-pause', 'extremas', 'negativas'],
            enfoque: 'intensidad',
            progresion: 'cargas'
        }
    };

    // Agregar ajustes al objeto global si existe
    if (window.AJUSTES_POR_METODOLOGIA) {
        Object.assign(window.AJUSTES_POR_METODOLOGIA, ajustesFaltantes);
        console.log('✅ Ajustes de metodología agregados para: GVT, DUP, 5/3/1, DC Training');
    }

    // ============================================
    // 3. ASEGURAR QUE LAS 4 METODOLOGÍAS EXISTAN EN METODOLOGIAS_BASE
    // ============================================

    if (window.protocolosData && window.protocolosData.METODOLOGIAS_BASE) {
        const base = window.protocolosData.METODOLOGIAS_BASE;

        // Verificar y agregar GVT si falta
        if (!base.gvt) {
            base.gvt = {
                id: 'gvt',
                nombre: 'GVT',
                nombreCompleto: 'German Volume Training',
                creador: 'Vince Gironda / Charles Poliquin',
                tipo: 'Alto Volumen',
                descripcion: 'Sistema de alto volumen con 10 series de 10 repeticiones para máxima hipertrofia sarcoplasmática.',
                descripcionCorta: '10x10 para volumen muscular extremo',
                nivelMinimo: 'intermedio',
                nivelesPermitidos: ['intermedio', 'avanzado'],
                duracionCiclo: { principiante: null, intermedio: 4, avanzado: 6 },
                frecuenciaSemanal: { min: 4, max: 5 },
                caracteristicas: ['Alto volumen', 'Hipertrofia', 'Resistencia muscular']
            };
            console.log('✅ GVT agregado a METODOLOGIAS_BASE');
        }

        // Verificar y agregar DUP si falta
        if (!base.dup) {
            base.dup = {
                id: 'dup',
                nombre: 'DUP',
                nombreCompleto: 'Daily Undulating Periodization',
                creador: 'Dr. Mike Zourdos',
                tipo: 'Periodización',
                descripcion: 'Periodización ondulante diaria que alterna entre hipertrofia, fuerza y potencia.',
                descripcionCorta: 'Variación diaria de intensidad y volumen',
                nivelMinimo: 'intermedio',
                nivelesPermitidos: ['intermedio', 'avanzado'],
                duracionCiclo: { principiante: null, intermedio: 6, avanzado: 8 },
                frecuenciaSemanal: { min: 3, max: 6 },
                caracteristicas: ['Periodización', 'Versatilidad', 'Fuerza + Hipertrofia']
            };
            console.log('✅ DUP agregado a METODOLOGIAS_BASE');
        }

        // Verificar y agregar 5/3/1 si falta
        if (!base['531']) {
            base['531'] = {
                id: '531',
                nombre: '5/3/1',
                nombreCompleto: '5/3/1 Wendler',
                creador: 'Jim Wendler',
                tipo: 'Fuerza',
                descripcion: 'Sistema de fuerza progresiva basado en porcentajes del 1RM con ciclos de 4 semanas.',
                descripcionCorta: 'Fuerza progresiva con submáximos',
                nivelMinimo: 'intermedio',
                nivelesPermitidos: ['intermedio', 'avanzado'],
                duracionCiclo: { principiante: null, intermedio: 4, avanzado: 4 },
                frecuenciaSemanal: { min: 3, max: 4 },
                caracteristicas: ['Fuerza', 'Progresión lenta', 'Sostenible']
            };
            console.log('✅ 5/3/1 agregado a METODOLOGIAS_BASE');
        }

        // Verificar y agregar DC Training si falta
        if (!base.dc) {
            base.dc = {
                id: 'dc',
                nombre: 'DC Training',
                nombreCompleto: 'Doggcrapp Training',
                creador: 'Dante Trudel',
                tipo: 'Alta Intensidad',
                descripcion: 'Entrenamiento de alta intensidad con rest-pause, extremas y estiramientos bajo carga.',
                descripcionCorta: 'Rest-pause extremo + estiramientos',
                nivelMinimo: 'avanzado',
                nivelesPermitidos: ['avanzado'],
                duracionCiclo: { principiante: null, intermedio: null, avanzado: 6 },
                frecuenciaSemanal: { min: 3, max: 4 },
                caracteristicas: ['Alta intensidad', 'Rest-pause', 'Bajo volumen']
            };
            console.log('✅ DC Training agregado a METODOLOGIAS_BASE');
        }
    }

    // ============================================
    // 4. PARCHAR LA FUNCIÓN renderTodasMetodologias
    // ============================================

    // Guardar la función original
    const originalRenderTodasMetodologias = window.renderTodasMetodologias;

    // Nueva función que incluye todos los tipos y maneja argumentos correctamente
    window.renderTodasMetodologias = function (arg1, arg2, arg3) {
        console.log('🔄 renderTodasMetodologias parchado v2.0 ejecutándose...');

        // Detectar formato de argumentos
        let container, metodologias, nivelUsuario;

        if (arg1 instanceof HTMLElement) {
            // Formato: (container, metodologias, nivel)
            container = arg1;
            metodologias = arg2;
            nivelUsuario = arg3 || 'avanzado';
        } else if (typeof arg1 === 'string' && document.getElementById(arg1)) {
            // Formato: (containerId, metodologias, nivel)
            container = document.getElementById(arg1);
            metodologias = arg2;
            nivelUsuario = arg3 || 'avanzado';
        } else if (Array.isArray(arg1)) {
            // Formato original: (metodologias, nivel)
            container = document.getElementById('metodologiasContainer');
            metodologias = arg1;
            nivelUsuario = arg2 || 'avanzado';
        } else {
            // Fallback: buscar el contenedor
            container = document.getElementById('metodologiasContainer');
            metodologias = arg1 || [];
            nivelUsuario = arg2 || 'avanzado';
        }

        // Verificar que tenemos container
        if (!container) {
            console.error('❌ No se encontró el contenedor de metodologías');
            if (originalRenderTodasMetodologias) {
                return originalRenderTodasMetodologias.apply(this, arguments);
            }
            return;
        }

        // Si metodologias está vacío, generar las opciones
        if (!metodologias || !Array.isArray(metodologias) || metodologias.length === 0) {
            if (window.generarTodasLasOpcionesMetodologia) {
                metodologias = window.generarTodasLasOpcionesMetodologia({ nivel: nivelUsuario });
            } else {
                console.error('❌ No hay metodologías disponibles');
                return;
            }
        }

        // Limpiar contenedor
        container.innerHTML = '';

        // Definir TODOS los grupos de metodologías (corregido para incluir los 7 tipos)
        const grupos = {
            'TM': { nombre: '🏋️ Tensión Mecánica', metodologias: [] },
            'Híbrido': { nombre: '⚡ Híbrido', metodologias: [] },
            'EM': { nombre: '💪 Estrés Metabólico', metodologias: [] },
            'Fuerza': { nombre: '🎯 Fuerza', metodologias: [] },
            'Alto Volumen': { nombre: '📊 Alto Volumen', metodologias: [] },
            'Periodización': { nombre: '📅 Periodización', metodologias: [] },
            'Alta Intensidad': { nombre: '🔥 Alta Intensidad', metodologias: [] }
        };

        // Agrupar metodologías por tipo
        metodologias.forEach(met => {
            const tipo = met.tipo || 'Híbrido';
            if (grupos[tipo]) {
                grupos[tipo].metodologias.push(met);
            } else {
                // Si tiene un tipo desconocido, agregarlo a Híbrido
                grupos['Híbrido'].metodologias.push(met);
            }
        });

        // Renderizar cada grupo que tenga metodologías
        Object.keys(grupos).forEach(tipoKey => {
            const grupo = grupos[tipoKey];
            if (grupo.metodologias.length === 0) return;

            // Crear contenedor del grupo
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'metodologia-group mb-6';

            const safeKey = tipoKey.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

            grupoDiv.innerHTML = `
                <h5 class="text-lg font-semibold text-purple-300 mb-3 border-b border-gray-700 pb-2">
                    ${grupo.nombre}
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="grupo-${safeKey}">
                </div>
            `;

            const gridContainer = grupoDiv.querySelector(`#grupo-${safeKey}`);

            // Renderizar cada metodología del grupo
            grupo.metodologias.forEach(met => {
                const card = crearTarjetaMetodologiaV2(met, nivelUsuario);
                gridContainer.appendChild(card);
            });

            container.appendChild(grupoDiv);
        });

        console.log(`✅ Renderizadas ${metodologias.length} metodologías en ${Object.keys(grupos).filter(k => grupos[k].metodologias.length > 0).length} grupos`);
    };

    // ============================================
    // 5. FUNCIÓN AUXILIAR PARA CREAR TARJETAS
    // ============================================

    function crearTarjetaMetodologiaV2(met, nivelUsuario) {
        const card = document.createElement('div');
        card.className = 'metodologia-card bg-gray-800/60 rounded-xl p-4 cursor-pointer hover:bg-gray-700/60 transition-all duration-300 border border-gray-700 hover:border-purple-500';
        card.onclick = () => {
            if (window.seleccionarMetodologia) {
                window.seleccionarMetodologia(met.id);
            }
        };

        // Verificar si está disponible para el nivel del usuario
        const nivelesPermitidos = met.nivelesPermitidos || ['principiante', 'intermedio', 'avanzado'];
        const disponible = nivelesPermitidos.includes(nivelUsuario);

        if (!disponible) {
            card.classList.add('opacity-50', 'cursor-not-allowed');
            card.onclick = () => {
                alert(`Esta metodología requiere nivel: ${met.nivelMinimo || 'intermedio'}`);
            };
        }

        // Obtener indicadores
        const indicadores = window.indicadoresMetodologia ? window.indicadoresMetodologia[met.id] : null;

        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h5 class="font-bold text-white text-lg">${met.nombre}</h5>
                <span class="text-xs px-2 py-1 rounded-full ${disponible ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'}">
                    ${disponible ? '✓ Disponible' : '🔒 ' + (met.nivelMinimo || 'intermedio')}
                </span>
            </div>
            <p class="text-sm text-gray-400 mb-3">${met.creador || ''}</p>
            <p class="text-sm text-gray-300 mb-4 line-clamp-2">${met.descripcion || met.descripcionCorta || ''}</p>
            ${indicadores ? `
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1">
                    <span class="text-red-400">⚡</span>
                    <span class="text-gray-400">Intensidad:</span>
                    <span class="text-white">${indicadores.intensidad}%</span>
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-blue-400">📊</span>
                    <span class="text-gray-400">Volumen:</span>
                    <span class="text-white">${indicadores.volumen}%</span>
                </div>
            </div>
            ` : ''}
        `;

        return card;
    }

    // ============================================
    // 6. PARCHAR generarTodasLasOpcionesMetodologia
    // ============================================

    const originalGenerarOpciones = window.generarTodasLasOpcionesMetodologia;

    window.generarTodasLasOpcionesMetodologia = function (datosUsuario) {
        console.log('🔄 generarTodasLasOpcionesMetodologia parchado ejecutándose...');

        if (!window.protocolosData || !window.protocolosData.METODOLOGIAS_BASE) {
            console.error('❌ protocolosData.METODOLOGIAS_BASE no encontrado');
            return originalGenerarOpciones ? originalGenerarOpciones(datosUsuario) : [];
        }

        const metodologias = Object.values(window.protocolosData.METODOLOGIAS_BASE);
        const nivel = datosUsuario?.nivel || 'principiante';

        // Filtrar metodologías disponibles para el nivel del usuario
        const disponibles = metodologias.filter(met => {
            const nivelesPermitidos = met.nivelesPermitidos || ['principiante', 'intermedio', 'avanzado'];
            return nivelesPermitidos.includes(nivel);
        });

        // Eliminar duplicados por ID
        const seen = new Set();
        const unicas = disponibles.filter(met => {
            if (seen.has(met.id)) return false;
            seen.add(met.id);
            return true;
        });

        console.log(`✅ ${unicas.length} metodologías únicas disponibles para nivel ${nivel}`);

        return unicas.map(met => ({
            ...met,
            disponible: true,
            prioridad: window.calcularPrioridadRecomendacion ?
                window.calcularPrioridadRecomendacion(met, datosUsuario) : 50
        }));
    };

    // ============================================
    // 7. FUNCIÓN DE VERIFICACIÓN
    // ============================================

    window.verificarMetodologiasNEXUS = function () {
        const nivel = 'avanzado';
        if (window.generarTodasLasOpcionesMetodologia) {
            const metodologias = window.generarTodasLasOpcionesMetodologia({ nivel });
            console.log('=== VERIFICACIÓN DE METODOLOGÍAS ===');
            console.log(`Total: ${metodologias.length} metodologías`);
            metodologias.forEach((m, i) => {
                console.log(`${i + 1}. ${m.nombre} (${m.tipo || 'Sin tipo'}) - ${m.creador || 'Sin creador'}`);
            });
            return metodologias.map(m => m.nombre);
        }
        return [];
    };

    console.log('✅ NEXUS 11 Metodologías Patch v2.0 - Instalado correctamente');
    console.log('📊 Ejecuta verificarMetodologiasNEXUS() para ver la lista completa');
    console.log('📊 Metodologías: Heavy Duty, Blood & Guts, MTUT, Y3T, Rest-Pause, FST-7, SST, GVT, DUP, 5/3/1, DC Training');

})();
