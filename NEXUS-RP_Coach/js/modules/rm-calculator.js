/* =============================================
   NEXUS-RP Coach — Módulo Calculadora de RM
   14 fórmulas científicas + estimación por RPE
   + Protocolo de test directo + Tabla de %
   ============================================= */

const RMCalculatorModule = (() => {

    // =============================================
    // 1. FÓRMULAS DE 1RM INDIRECTO
    // =============================================

    const FORMULAS = {
        epley: {
            nombre: 'Epley (1985)',
            fn: (w, r) => w * (1 + r / 30),
            precision: 'Alta (1-10 reps)',
            descripcion: 'Fórmula lineal más utilizada mundialmente'
        },
        brzycki: {
            nombre: 'Brzycki (1993)',
            fn: (w, r) => w * (36 / (37 - r)),
            precision: 'Alta (1-10 reps)',
            descripcion: 'Estándar en fuerza, precisa en rangos bajos'
        },
        lombardi: {
            nombre: 'Lombardi',
            fn: (w, r) => w * Math.pow(r, 0.10),
            precision: 'Media',
            descripcion: 'Modelo exponencial, tiende a subestimar'
        },
        mayhew: {
            nombre: 'Mayhew (1992)',
            fn: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
            precision: 'Alta (5-15 reps)',
            descripcion: 'Exponencial, precisa en rangos medios-altos'
        },
        oconner: {
            nombre: "O'Conner",
            fn: (w, r) => w * (1 + r / 40),
            precision: 'Media',
            descripcion: 'Lineal conservadora, menor sobreestimación'
        },
        wathen: {
            nombre: 'Wathen (1994)',
            fn: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
            precision: 'Alta (1-12 reps)',
            descripcion: 'Exponencial, muy precisa en fuerza máxima'
        },
        lander: {
            nombre: 'Lander (1985)',
            fn: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
            precision: 'Alta (1-10 reps)',
            descripcion: 'Lineal, precisa en repeticiones bajas'
        },
        adams: {
            nombre: 'Adams (1998)',
            fn: (w, r) => w * (1 / (1 - 0.02 * r)),
            precision: 'Media-Alta',
            descripcion: 'Inversa, buena para rangos medios'
        },
        baechle: {
            nombre: 'Baechle (2000)',
            fn: (w, r) => w * (1 + 0.033 * r),
            precision: 'Alta',
            descripcion: 'NSCA, equivalente a Epley'
        },
        berger: {
            nombre: 'Berger (1961)',
            fn: (w, r) => w / (1.0261 * Math.exp(-0.0262 * r)),
            precision: 'Media',
            descripcion: 'Modelo pionero exponencial'
        },
        brown: {
            nombre: 'Brown (1992)',
            fn: (w, r) => (w * r * 0.0338) + w,
            precision: 'Media',
            descripcion: 'Lineal simplificada'
        },
        kemmler: {
            nombre: 'Kemmler',
            fn: (w, r) => w * (1 + 0.025 * r),
            precision: 'Media',
            descripcion: 'Conservadora, menor sobreestimación'
        },
        naclerio: {
            nombre: 'Naclerio',
            fn: (w, r) => w * (1 + 0.03 * r),
            precision: 'Media-Alta',
            descripcion: 'Ajuste latino, intermedia entre Epley y Kemmler'
        },
        desgorces: {
            nombre: 'Desgorces',
            fn: (w, r) => (100 * w) / (83.7677 * Math.exp(-0.0338 * r) + 17.6846),
            precision: 'Alta (5-20 reps)',
            descripcion: 'Exponencial moderna, excelente en rangos altos'
        }
    };

    /**
     * Calcula 1RM con todas las fórmulas
     * @param {number} peso - Peso levantado (kg)
     * @param {number} reps - Repeticiones realizadas
     * @returns {Object} Resultados por fórmula + promedio
     */
    function calcularTodas(peso, reps) {
        if (!peso || peso <= 0 || !reps || reps <= 0) return null;
        if (reps === 1) {
            const resultado = {};
            for (const key of Object.keys(FORMULAS)) {
                resultado[key] = { valor: peso, nombre: FORMULAS[key].nombre };
            }
            resultado.promedio = peso;
            resultado.min = peso;
            resultado.max = peso;
            return resultado;
        }

        const resultado = {};
        const valores = [];

        for (const [key, formula] of Object.entries(FORMULAS)) {
            const val = Math.round(formula.fn(peso, reps) * 10) / 10;
            resultado[key] = { valor: val, nombre: formula.nombre, precision: formula.precision };
            valores.push(val);
        }

        resultado.promedio = Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
        resultado.min = Math.round(Math.min(...valores) * 10) / 10;
        resultado.max = Math.round(Math.max(...valores) * 10) / 10;

        return resultado;
    }

    /**
     * Calcula 1RM con las 3 fórmulas más precisas y promedia
     */
    function calcularPreciso(peso, reps) {
        if (!peso || peso <= 0 || !reps || reps <= 0) return 0;
        if (reps === 1) return peso;

        const epley = FORMULAS.epley.fn(peso, reps);
        const brzycki = FORMULAS.brzycki.fn(peso, reps);
        const wathen = FORMULAS.wathen.fn(peso, reps);

        return Math.round(((epley + brzycki + wathen) / 3) * 10) / 10;
    }

    // =============================================
    // 2. TABLA RPE → %1RM (Tuchscherer / RTS)
    // =============================================

    const RPE_TABLE = {
        1:  { 10: 100.0, 9.5: 98.0, 9: 96.0, 8.5: 94.0, 8: 92.0, 7.5: 90.5, 7: 89.0, 6.5: 87.5, 6: 86.0 },
        2:  { 10: 95.0, 9.5: 93.5, 9: 92.0, 8.5: 90.5, 8: 89.0, 7.5: 87.5, 7: 86.0, 6.5: 84.5, 6: 83.0 },
        3:  { 10: 92.0, 9.5: 90.5, 9: 89.0, 8.5: 87.5, 8: 86.0, 7.5: 85.0, 7: 84.0, 6.5: 82.5, 6: 81.0 },
        4:  { 10: 89.0, 9.5: 87.5, 9: 86.0, 8.5: 85.0, 8: 84.0, 7.5: 82.5, 7: 81.0, 6.5: 80.0, 6: 79.0 },
        5:  { 10: 86.0, 9.5: 85.0, 9: 84.0, 8.5: 82.5, 8: 81.0, 7.5: 80.0, 7: 79.0, 6.5: 77.5, 6: 76.0 },
        6:  { 10: 84.0, 9.5: 82.5, 9: 81.0, 8.5: 80.0, 8: 79.0, 7.5: 77.5, 7: 76.0, 6.5: 75.0, 6: 74.0 },
        7:  { 10: 81.0, 9.5: 80.0, 9: 79.0, 8.5: 77.5, 8: 76.0, 7.5: 75.0, 7: 74.0, 6.5: 73.0, 6: 72.0 },
        8:  { 10: 79.0, 9.5: 77.5, 9: 76.0, 8.5: 75.0, 8: 74.0, 7.5: 73.0, 7: 72.0, 6.5: 70.5, 6: 69.0 },
        9:  { 10: 76.0, 9.5: 75.0, 9: 74.0, 8.5: 73.0, 8: 72.0, 7.5: 70.5, 7: 69.0, 6.5: 68.0, 6: 67.0 },
        10: { 10: 74.0, 9.5: 73.0, 9: 72.0, 8.5: 70.5, 8: 69.0, 7.5: 68.0, 7: 67.0, 6.5: 66.0, 6: 65.0 }
    };

    /**
     * Estima 1RM basándose en RPE (Tuchscherer)
     * @param {number} peso - Peso levantado
     * @param {number} reps - Repeticiones realizadas (1-10)
     * @param {number} rpe - RPE reportado (6-10, permite .5)
     * @returns {number} e1RM estimado
     */
    function calcularPorRPE(peso, reps, rpe) {
        if (!peso || peso <= 0 || !reps || reps < 1 || reps > 10) return 0;
        if (rpe < 6 || rpe > 10) return 0;

        // Redondear RPE al .5 más cercano
        rpe = Math.round(rpe * 2) / 2;

        const porcentaje = RPE_TABLE[reps]?.[rpe];
        if (!porcentaje) return 0;

        return Math.round((peso / (porcentaje / 100)) * 10) / 10;
    }

    /**
     * Obtiene el %1RM de la tabla RPE
     */
    function getPorcentajeRPE(reps, rpe) {
        if (reps < 1 || reps > 10 || rpe < 6 || rpe > 10) return null;
        rpe = Math.round(rpe * 2) / 2;
        return RPE_TABLE[reps]?.[rpe] || null;
    }

    // =============================================
    // 3. TABLA DE PORCENTAJES DE 1RM
    // =============================================

    /**
     * Genera tabla de pesos para cada porcentaje del 1RM
     * @param {number} rm1 - 1RM calculado
     * @returns {Array} Array de { porcentaje, peso, repsEstimadas }
     */
    function generarTablaPorcentajes(rm1) {
        if (!rm1 || rm1 <= 0) return [];

        const porcentajes = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
        const repsEstimadas = [1, 2, 4, 6, 8, 10, 12, 15, 18, 22, 26];

        return porcentajes.map((pct, i) => ({
            porcentaje: pct,
            peso: Math.round((rm1 * pct / 100) * 10) / 10,
            repsEstimadas: repsEstimadas[i],
            zona: pct >= 90 ? 'Fuerza máxima' :
                  pct >= 80 ? 'Fuerza-Hipertrofia' :
                  pct >= 65 ? 'Hipertrofia' :
                  'Resistencia muscular'
        }));
    }

    // =============================================
    // 4. PROTOCOLO DE TEST DIRECTO 1RM
    // =============================================

    const PROTOCOLO_TEST_DIRECTO = {
        prerrequisitos: [
            'Mínimo 6-12 meses de experiencia en entrenamiento',
            'Sin lesiones activas en la zona a evaluar',
            'Mínimo 7 horas de sueño la noche anterior',
            'No haber entrenado el mismo grupo en 48-72 horas',
            'Hidratación y alimentación adecuada'
        ],
        pasos: [
            { serie: 'Calentamiento', carga: '—', reps: '5-10 min', descanso: '—', nota: 'Actividad cardiovascular ligera + movilidad articular' },
            { serie: 'Serie 1', carga: '40-60% e1RM', reps: '5-10', descanso: '1 min', nota: 'Calentamiento específico con el ejercicio' },
            { serie: 'Serie 2', carga: '60-70% e1RM', reps: '3-5', descanso: '2 min', nota: 'Activar el patrón de movimiento' },
            { serie: 'Serie 3', carga: '75-80% e1RM', reps: '2-3', descanso: '2-3 min', nota: 'Aproximación a cargas pesadas' },
            { serie: 'Serie 4', carga: '90-95% e1RM', reps: '1', descanso: '3-5 min', nota: 'Confirmación de capacidad' },
            { serie: 'Intento 1RM', carga: '100-105% e1RM', reps: '1', descanso: '3-5 min', nota: 'Intento máximo con técnica perfecta' },
            { serie: 'Ajuste', carga: '±2.5-5%', reps: '1', descanso: '3-5 min', nota: 'Si éxito: subir 2-5%. Si fallo: bajar 2.5-5%' }
        ],
        reglas: [
            'Máximo 3-5 intentos de 1RM para evitar fatiga excesiva',
            'Siempre con spotter (observador) en ejercicios compuestos',
            'Detener si hay dolor articular o pérdida de técnica',
            'Registrar el peso más alto completado con técnica correcta'
        ]
    };

    // =============================================
    // 5. ÍNDICE HOOPER (Readiness Avanzado)
    // =============================================

    /**
     * Calcula el Índice Hooper para evaluación de readiness
     * @param {number} sueno - Calidad de sueño (1=excelente, 7=pésimo)
     * @param {number} estres - Nivel de estrés (1=sin estrés, 7=extremo)
     * @param {number} fatiga - Nivel de fatiga (1=recuperado, 7=agotado)
     * @param {number} doms - Dolor muscular (1=sin dolor, 7=severo)
     * @returns {Object} { total, nivel, color, recomendacion }
     */
    function calcularHooper(sueno, estres, fatiga, doms) {
        const total = sueno + estres + fatiga + doms;

        let nivel, color, recomendacion;
        if (total <= 8) {
            nivel = 'Excelente';
            color = '#00E676';
            recomendacion = 'Entrenamiento al 100% del plan. Condiciones óptimas para PR.';
        } else if (total <= 12) {
            nivel = 'Buena';
            color = '#7C4DFF';
            recomendacion = 'Proceder normalmente con el entrenamiento planificado.';
        } else if (total <= 16) {
            nivel = 'Moderada';
            color = '#FFB300';
            recomendacion = 'Considerar reducir volumen o intensidad 10-20%.';
        } else if (total <= 20) {
            nivel = 'Baja';
            color = '#FF9100';
            recomendacion = 'Reducir carga significativamente. Priorizar recuperación.';
        } else {
            nivel = 'Crítica';
            color = '#FF5252';
            recomendacion = 'Descanso activo o día libre. No forzar el entrenamiento.';
        }

        return { total, nivel, color, recomendacion };
    }

    // =============================================
    // 6. RENDER UI — Calculadora de RM
    // =============================================

    function renderCalculadoraRM() {
        const container = document.getElementById('rm-calculator-container');
        if (!container) return;

        container.innerHTML = `
            <div class="rm-calc-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label class="form-label">Peso levantado (kg)</label>
                    <input type="number" id="rm-peso" class="form-input" placeholder="Ej: 80" min="1" max="500" step="0.5">
                </div>
                <div class="form-group">
                    <label class="form-label">Repeticiones realizadas</label>
                    <input type="number" id="rm-reps" class="form-input" placeholder="Ej: 8" min="1" max="30">
                </div>
            </div>
            <button class="btn btn--primary mt-2" onclick="RMCalculatorModule.ejecutarCalculo()" style="width:100%;">
                Calcular 1RM
            </button>
            <div id="rm-resultado" class="mt-3"></div>
        `;
    }

    function ejecutarCalculo() {
        const peso = parseFloat(document.getElementById('rm-peso')?.value);
        const reps = parseInt(document.getElementById('rm-reps')?.value);
        const contenedor = document.getElementById('rm-resultado');
        if (!contenedor) return;

        if (!peso || !reps || peso <= 0 || reps <= 0) {
            contenedor.innerHTML = '<p class="text-danger">Ingresa peso y repeticiones válidos.</p>';
            return;
        }

        const resultados = calcularTodas(peso, reps);
        if (!resultados) return;

        // Top 3 fórmulas más confiables
        const top3 = calcularPreciso(peso, reps);

        let html = `
            <div class="card" style="background: linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15)); border:1px solid rgba(224,64,251,0.3);">
                <div style="text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">1RM Estimado (Promedio Top 3)</div>
                    <div style="font-size:2.5rem; font-weight:800; background:var(--gradient-primary); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${top3} kg</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">Rango: ${resultados.min} — ${resultados.max} kg | Promedio general: ${resultados.promedio} kg</div>
                </div>
            </div>

            <details class="mt-2" style="cursor:pointer;">
                <summary style="font-weight:600; color:var(--rp-primary); padding:8px 0;">Ver detalle de las 14 fórmulas</summary>
                <table class="data-table mt-1" style="font-size:0.8rem;">
                    <tr><th>Fórmula</th><th>1RM (kg)</th><th>Precisión</th></tr>
        `;

        for (const [key, data] of Object.entries(resultados)) {
            if (typeof data === 'object' && data.valor) {
                const diff = data.valor - top3;
                const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
                html += `<tr>
                    <td>${data.nombre}</td>
                    <td><strong>${data.valor}</strong> <span style="color:var(--text-muted); font-size:0.7rem;">(${diffStr})</span></td>
                    <td style="font-size:0.7rem;">${data.precision || ''}</td>
                </tr>`;
            }
        }

        html += '</table></details>';

        // Tabla de porcentajes
        const tabla = generarTablaPorcentajes(top3);
        html += `
            <details class="mt-2" style="cursor:pointer;">
                <summary style="font-weight:600; color:var(--rp-accent); padding:8px 0;">Tabla de cargas por porcentaje de 1RM</summary>
                <table class="data-table mt-1" style="font-size:0.8rem;">
                    <tr><th>%1RM</th><th>Peso (kg)</th><th>Reps est.</th><th>Zona</th></tr>
        `;
        tabla.forEach(row => {
            const zonColor = row.porcentaje >= 90 ? 'var(--rp-danger)' :
                             row.porcentaje >= 80 ? 'var(--rp-primary)' :
                             row.porcentaje >= 65 ? 'var(--rp-accent)' : 'var(--rp-warning)';
            html += `<tr>
                <td>${row.porcentaje}%</td>
                <td><strong>${row.peso}</strong></td>
                <td>${row.repsEstimadas}</td>
                <td style="color:${zonColor}; font-size:0.7rem;">${row.zona}</td>
            </tr>`;
        });
        html += '</table></details>';

        contenedor.innerHTML = html;
    }

    // =============================================
    // 7. RENDER UI — Calculadora por RPE
    // =============================================

    function renderCalculadoraRPE() {
        const container = document.getElementById('rpe-calculator-container');
        if (!container) return;

        container.innerHTML = `
            <div class="rm-calc-grid" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label class="form-label">Peso (kg)</label>
                    <input type="number" id="rpe-peso" class="form-input" placeholder="80" min="1" max="500" step="0.5">
                </div>
                <div class="form-group">
                    <label class="form-label">Reps (1-10)</label>
                    <input type="number" id="rpe-reps" class="form-input" placeholder="5" min="1" max="10">
                </div>
                <div class="form-group">
                    <label class="form-label">RPE (6-10)</label>
                    <input type="number" id="rpe-valor" class="form-input" placeholder="8" min="6" max="10" step="0.5">
                </div>
            </div>
            <button class="btn btn--primary mt-2" onclick="RMCalculatorModule.ejecutarCalculoRPE()" style="width:100%;">
                Estimar e1RM por RPE
            </button>
            <div id="rpe-resultado" class="mt-3"></div>

            <details class="mt-3" style="cursor:pointer;">
                <summary style="font-weight:600; color:var(--rp-secondary); padding:8px 0;">Ver tabla completa RPE → %1RM (Tuchscherer)</summary>
                <div style="overflow-x:auto;">
                    <table class="data-table mt-1" style="font-size:0.7rem;">
                        <tr><th>Reps</th><th>RPE 10</th><th>RPE 9.5</th><th>RPE 9</th><th>RPE 8.5</th><th>RPE 8</th><th>RPE 7.5</th><th>RPE 7</th><th>RPE 6.5</th><th>RPE 6</th></tr>
                        ${[1,2,3,4,5,6,7,8,9,10].map(r => `<tr>
                            <td><strong>${r}</strong></td>
                            ${[10,9.5,9,8.5,8,7.5,7,6.5,6].map(rpe => `<td>${RPE_TABLE[r][rpe]}%</td>`).join('')}
                        </tr>`).join('')}
                    </table>
                </div>
            </details>
        `;
    }

    function ejecutarCalculoRPE() {
        const peso = parseFloat(document.getElementById('rpe-peso')?.value);
        const reps = parseInt(document.getElementById('rpe-reps')?.value);
        const rpe = parseFloat(document.getElementById('rpe-valor')?.value);
        const contenedor = document.getElementById('rpe-resultado');
        if (!contenedor) return;

        if (!peso || !reps || !rpe) {
            contenedor.innerHTML = '<p class="text-danger">Completa todos los campos.</p>';
            return;
        }

        const e1rm = calcularPorRPE(peso, reps, rpe);
        const porcentaje = getPorcentajeRPE(reps, rpe);

        if (!e1rm || !porcentaje) {
            contenedor.innerHTML = '<p class="text-danger">Valores fuera de rango. Reps: 1-10, RPE: 6-10.</p>';
            return;
        }

        // Comparar con fórmulas clásicas
        const clasico = calcularPreciso(peso, reps);
        const diff = e1rm - clasico;
        const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);

        contenedor.innerHTML = `
            <div class="card" style="background: linear-gradient(135deg, rgba(124,77,255,0.15), rgba(0,191,165,0.15)); border:1px solid rgba(124,77,255,0.3);">
                <div style="text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">e1RM estimado por RPE</div>
                    <div style="font-size:2.5rem; font-weight:800; color:var(--rp-secondary);">${e1rm} kg</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary);">
                        ${peso} kg × ${reps} reps @ RPE ${rpe} = <strong>${porcentaje}%</strong> del 1RM
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                        vs. Fórmulas clásicas: ${clasico} kg (${diffStr} kg)
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // 8. RENDER UI — Protocolo Test Directo
    // =============================================

    function renderProtocoloTest() {
        const container = document.getElementById('protocolo-test-container');
        if (!container) return;

        const proto = PROTOCOLO_TEST_DIRECTO;

        let html = `
            <div class="alert alert--info mb-2">
                <span>⚠️</span>
                <span>Realiza este test solo si tienes experiencia y supervisión adecuada.</span>
            </div>

            <h5 style="color:var(--rp-warning);">Prerrequisitos</h5>
            <ul style="list-style:none; padding:0; margin:8px 0;">
                ${proto.prerrequisitos.map(p => `<li style="padding:4px 0; font-size:0.85rem; color:var(--text-secondary);">✅ ${p}</li>`).join('')}
            </ul>

            <h5 class="mt-2" style="color:var(--rp-primary);">Protocolo paso a paso (NSCA)</h5>
            <div class="form-group mt-1">
                <label class="form-label">Tu 1RM estimado actual (kg) — para calcular cargas del protocolo:</label>
                <input type="number" id="proto-e1rm" class="form-input" placeholder="Ej: 100" min="1" max="500" step="0.5"
                       oninput="RMCalculatorModule.actualizarProtocolo()">
            </div>
            <table class="data-table mt-2" style="font-size:0.8rem;" id="protocolo-tabla">
                <tr><th>Paso</th><th>Carga</th><th>Reps</th><th>Descanso</th><th>Indicación</th></tr>
        `;

        proto.pasos.forEach(p => {
            html += `<tr>
                <td><strong>${p.serie}</strong></td>
                <td>${p.carga}</td>
                <td>${p.reps}</td>
                <td>${p.descanso}</td>
                <td style="font-size:0.75rem; color:var(--text-secondary);">${p.nota}</td>
            </tr>`;
        });

        html += `</table>
            <h5 class="mt-2" style="color:var(--rp-danger);">Reglas de seguridad</h5>
            <ul style="list-style:none; padding:0; margin:8px 0;">
                ${proto.reglas.map(r => `<li style="padding:4px 0; font-size:0.85rem; color:var(--text-secondary);">🛡️ ${r}</li>`).join('')}
            </ul>
        `;

        container.innerHTML = html;
    }

    function actualizarProtocolo() {
        const e1rm = parseFloat(document.getElementById('proto-e1rm')?.value);
        if (!e1rm || e1rm <= 0) return;

        const tabla = document.getElementById('protocolo-tabla');
        if (!tabla) return;

        const filas = tabla.querySelectorAll('tr');
        // Fila 2 (Serie 1): 40-60%
        if (filas[2]) {
            const c1 = Math.round(e1rm * 0.5);
            filas[2].cells[1].innerHTML = `<strong>${c1} kg</strong> <span style="color:var(--text-muted);">(~50%)</span>`;
        }
        // Fila 3 (Serie 2): 60-70%
        if (filas[3]) {
            const c2 = Math.round(e1rm * 0.65);
            filas[3].cells[1].innerHTML = `<strong>${c2} kg</strong> <span style="color:var(--text-muted);">(~65%)</span>`;
        }
        // Fila 4 (Serie 3): 75-80%
        if (filas[4]) {
            const c3 = Math.round(e1rm * 0.775);
            filas[4].cells[1].innerHTML = `<strong>${c3} kg</strong> <span style="color:var(--text-muted);">(~78%)</span>`;
        }
        // Fila 5 (Serie 4): 90-95%
        if (filas[5]) {
            const c4 = Math.round(e1rm * 0.925);
            filas[5].cells[1].innerHTML = `<strong>${c4} kg</strong> <span style="color:var(--text-muted);">(~93%)</span>`;
        }
        // Fila 6 (Intento 1RM): 100-105%
        if (filas[6]) {
            filas[6].cells[1].innerHTML = `<strong>${Math.round(e1rm)} — ${Math.round(e1rm * 1.05)} kg</strong> <span style="color:var(--text-muted);">(100-105%)</span>`;
        }
    }

    // =============================================
    // 9. INICIALIZAR TODOS LOS COMPONENTES
    // =============================================

    function initAll() {
        renderCalculadoraRM();
        renderCalculadoraRPE();
        renderProtocoloTest();
    }

    // =============================================
    // API PÚBLICA
    // =============================================

    return {
        FORMULAS,
        RPE_TABLE,
        PROTOCOLO_TEST_DIRECTO,
        calcularTodas,
        calcularPreciso,
        calcularPorRPE,
        getPorcentajeRPE,
        generarTablaPorcentajes,
        calcularHooper,
        renderCalculadoraRM,
        renderCalculadoraRPE,
        renderProtocoloTest,
        ejecutarCalculo,
        ejecutarCalculoRPE,
        actualizarProtocolo,
        initAll
    };

})();

// Exponer globalmente
window.RMCalculatorModule = RMCalculatorModule;

console.log('✅ RMCalculatorModule cargado — 14 fórmulas + RPE + Protocolo Test');
