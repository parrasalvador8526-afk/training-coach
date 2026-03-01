/**
 * NEXUS-RP Coach - Módulo de Tablas Progresivas
 * Sistema de anotaciones de entrenamiento y cálculo de siguiente sesión
 */

const TablasProgresivas = (() => {

    // =============================================
    // RENDERIZADO DE TABLA DE REGISTRO
    // =============================================

    function renderTablaRegistro(ejercicios, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const ejerciciosList = ejercicios || [
            { nombre: 'Press Banca', sets: 4, repsTarget: '6-8' },
            { nombre: 'Press Inclinado', sets: 3, repsTarget: '8-10' },
            { nombre: 'Aperturas', sets: 3, repsTarget: '10-12' }
        ];

        container.innerHTML = `
            <div class="card mt-3">
                <div class="card__header">
                    <h4>📝 Registro de Sesión</h4>
                    <span class="rp-badge">En Vivo</span>
                </div>
                
                <table class="data-table mt-2" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Ejercicio</th>
                            <th style="width: 15%;">Set</th>
                            <th style="width: 15%;">Peso (kg)</th>
                            <th style="width: 15%;">Reps</th>
                            <th style="width: 10%;">RIR</th>
                            <th style="width: 15%;">Notas</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-registro-body">
                        ${generarFilasRegistro(ejerciciosList)}
                    </tbody>
                </table>
                
                <div class="flex gap-2 mt-3">
                    <button class="btn btn--primary btn--block" onclick="TablasProgresivas.guardarSesion()">
                        💾 Guardar Sesión
                    </button>
                    <button class="btn btn--secondary" onclick="TablasProgresivas.calcularProgresion()">
                        📈 Ver Progresión
                    </button>
                </div>
            </div>
        `;
    }

    function generarFilasRegistro(ejercicios) {
        let html = '';
        ejercicios.forEach((ej, ejIndex) => {
            for (let set = 1; set <= ej.sets; set++) {
                const isFirstSet = set === 1;
                html += `
                    <tr data-ejercicio="${ej.nombre}" data-set="${set}">
                        ${isFirstSet ? `<td rowspan="${ej.sets}" style="vertical-align: middle; font-weight: 600;">${ej.nombre}<br><small class="text-muted">${ej.repsTarget} reps</small></td>` : ''}
                        <td style="text-align: center;">${set}</td>
                        <td><input type="number" class="form-input form-input--sm input-peso" placeholder="0" step="0.5"></td>
                        <td><input type="number" class="form-input form-input--sm input-reps" placeholder="0" min="1" max="50"></td>
                        <td><input type="number" class="form-input form-input--sm input-rir" placeholder="2" min="0" max="5"></td>
                        <td><input type="text" class="form-input form-input--sm input-notas" placeholder="..."></td>
                    </tr>
                `;
            }
        });
        return html;
    }

    // =============================================
    // TABLA DE SIGUIENTE SESIÓN PROGRESIVA
    // =============================================

    function renderTablaProgresion(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Cargar sesión anterior
        const ultimaSesion = cargarUltimaSesion();

        if (!ultimaSesion || ultimaSesion.length === 0) {
            container.innerHTML = `
                <div class="alert alert--info">
                    <span>💡</span>
                    <span>Completa tu primera sesión para ver las recomendaciones de progresión.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="card mt-3">
                <div class="card__header">
                    <h4>🎯 Próxima Sesión Progresiva</h4>
                    <span class="rp-badge" style="background: #10B981;">Calculado</span>
                </div>
                
                <p class="text-muted mb-2">Basado en tu último rendimiento, estos son los objetivos para la próxima sesión:</p>
                
                <table class="data-table mt-2">
                    <thead>
                        <tr>
                            <th>Ejercicio</th>
                            <th>Último</th>
                            <th>Próximo Objetivo</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generarFilasProgresion(ultimaSesion)}
                    </tbody>
                </table>
                
                <div class="alert alert--success mt-3" style="padding: 10px;">
                    <span>📈</span>
                    <div>
                        <strong>Reglas de Sobrecarga Progresiva:</strong>
                        <ul style="margin: 8px 0 0 20px; font-size: 0.85rem;">
                            <li>Si lograste RIR ≤ 1 → <strong>+2.5kg</strong> la próxima sesión</li>
                            <li>Si lograste RIR 2-3 → <strong>+1-2 reps</strong> antes de subir peso</li>
                            <li>Si no llegaste al rango → <strong>mantén peso</strong>, mejora técnica</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    function generarFilasProgresion(sesion) {
        return sesion.map(ejercicio => {
            const progresion = calcularProgresionEjercicio(ejercicio);

            return `
                <tr>
                    <td><strong>${ejercicio.nombre}</strong></td>
                    <td>
                        ${ejercicio.peso}kg × ${ejercicio.reps}<br>
                        <small class="text-muted">RIR: ${ejercicio.rir}</small>
                    </td>
                    <td style="color: #10B981;">
                        <strong>${progresion.peso}kg × ${progresion.reps}</strong><br>
                        <small>RIR objetivo: ${progresion.rirTarget}</small>
                    </td>
                    <td>
                        <span class="rp-badge" style="background: ${progresion.color}; font-size: 0.75rem;">
                            ${progresion.accion}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function calcularProgresionEjercicio(ejercicio) {
        const { peso, reps, rir } = ejercicio;
        let nuevoPeso = peso;
        let nuevasReps = reps;
        let accion = '';
        let color = '#3B82F6';

        if (rir <= 1) {
            // Progresión por peso
            nuevoPeso = peso + 2.5;
            nuevasReps = Math.max(reps - 2, 6); // Bajar reps al subir peso
            accion = '+2.5kg';
            color = '#10B981';
        } else if (rir <= 3 && reps < 12) {
            // Progresión por reps
            nuevasReps = reps + 1;
            accion = '+1 rep';
            color = '#8B5CF6';
        } else {
            // Mantener
            accion = 'Mantener';
            color = '#F59E0B';
        }

        return {
            peso: nuevoPeso,
            reps: nuevasReps,
            rirTarget: 2,
            accion,
            color
        };
    }

    // =============================================
    // PERSISTENCIA
    // =============================================

    function guardarSesion() {
        const filas = document.querySelectorAll('#tabla-registro-body tr');
        const sesion = [];
        let ejercicioActual = null;

        filas.forEach(fila => {
            const ejercicioNombre = fila.dataset.ejercicio;
            const set = parseInt(fila.dataset.set);
            const peso = parseFloat(fila.querySelector('.input-peso')?.value) || 0;
            const reps = parseInt(fila.querySelector('.input-reps')?.value) || 0;
            const rir = parseInt(fila.querySelector('.input-rir')?.value) || 2;
            const notas = fila.querySelector('.input-notas')?.value || '';

            if (peso > 0 && reps > 0) {
                // Buscar o crear entrada del ejercicio
                let ejercicio = sesion.find(e => e.nombre === ejercicioNombre);
                if (!ejercicio) {
                    ejercicio = {
                        nombre: ejercicioNombre,
                        peso: 0,
                        reps: 0,
                        rir: 0,
                        sets: []
                    };
                    sesion.push(ejercicio);
                }

                ejercicio.sets.push({ set, peso, reps, rir, notas });

                // Actualizar el mejor set (mayor peso o más reps)
                if (peso > ejercicio.peso || (peso === ejercicio.peso && reps > ejercicio.reps)) {
                    ejercicio.peso = peso;
                    ejercicio.reps = reps;
                    ejercicio.rir = rir;
                }
            }
        });

        if (sesion.length === 0) {
            showNotification('⚠️ No hay datos para guardar', 'warning');
            return;
        }

        // Guardar en localStorage
        const historial = JSON.parse(localStorage.getItem('rpcoach_sesiones') || '[]');
        historial.push({
            fecha: new Date().toISOString(),
            ejercicios: sesion
        });
        localStorage.setItem('rpcoach_sesiones', JSON.stringify(historial));

        // Guardar última sesión para progresión
        localStorage.setItem('rpcoach_ultima_sesion', JSON.stringify(sesion));

        showNotification('✅ Sesión guardada correctamente', 'success');
    }

    function cargarUltimaSesion() {
        try {
            const data = localStorage.getItem('rpcoach_ultima_sesion');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function calcularProgresion() {
        const container = document.getElementById('progresion-container');
        if (container) {
            renderTablaProgresion('progresion-container');
        } else {
            // Si no existe el contenedor, mostrarlo en un modal
            const modal = document.createElement('div');
            modal.id = 'progresion-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
            modal.innerHTML = `
                <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3>📈 Análisis de Progresión</h3>
                        <button onclick="document.getElementById('progresion-modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    <div id="modal-progresion-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            renderTablaProgresion('modal-progresion-content');
        }
    }

    // =============================================
    // UTILIDAD
    // =============================================

    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        console.log(`[${type}] ${message}`);
        alert(message);
    }

    // API Pública
    return {
        renderTablaRegistro,
        renderTablaProgresion,
        guardarSesion,
        calcularProgresion,
        cargarUltimaSesion
    };
})();

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.TablasProgresivas = TablasProgresivas;
}
