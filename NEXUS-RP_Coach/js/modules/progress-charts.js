/**
 * NEXUS-RP Coach - Gráficas de Progreso con Canvas
 * 
 * Visualización de progreso sin dependencias externas
 */

const ProgressChartsModule = (() => {
    /**
     * Dibuja una gráfica de línea simple
     */
    function drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;

        const padding = { top: 20, right: 20, bottom: 30, left: 50 };
        const chartWidth = actualWidth - padding.left - padding.right;
        const chartHeight = actualHeight - padding.top - padding.bottom;

        // Limpiar canvas
        ctx.fillStyle = options.background || '#1A1A2E';
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        if (data.length < 2) {
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Necesitas más datos para ver la gráfica', actualWidth / 2, actualHeight / 2);
            return;
        }

        // Calcular rangos
        const values = data.map(d => d.value);
        const minValue = Math.min(...values) * 0.9;
        const maxValue = Math.max(...values) * 1.1;
        const valueRange = maxValue - minValue;

        // Dibujar grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(actualWidth - padding.right, y);
            ctx.stroke();

            // Labels del eje Y
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            const value = maxValue - (valueRange / 4) * i;
            ctx.fillText(value.toFixed(0), padding.left - 5, y + 4);
        }

        // Dibujar línea principal
        ctx.strokeStyle = options.lineColor || '#E040FB';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const points = data.map((d, i) => ({
            x: padding.left + (chartWidth / (data.length - 1)) * i,
            y: padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight
        }));

        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Área bajo la curva (gradiente)
        const gradient = ctx.createLinearGradient(0, padding.top, 0, actualHeight - padding.bottom);
        gradient.addColorStop(0, 'rgba(224, 64, 251, 0.3)');
        gradient.addColorStop(1, 'rgba(224, 64, 251, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, actualHeight - padding.bottom);
        ctx.lineTo(points[0].x, points[0].y);
        points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.lineTo(points[points.length - 1].x, actualHeight - padding.bottom);
        ctx.closePath();
        ctx.fill();

        // Puntos
        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#E040FB';
            ctx.fill();
            ctx.strokeStyle = '#0D0D1A';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Labels del eje X
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(data[i].label || '', p.x, actualHeight - 10);
        });

        // Título
        if (options.title) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(options.title, padding.left, 14);
        }
    }

    /**
     * Dibuja una barra de progreso horizontal
     */
    function drawProgressBar(canvasId, current, max, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;

        const percentage = Math.min(current / max, 1);
        const barHeight = 20;
        const y = (actualHeight - barHeight) / 2;

        // Fondo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.roundRect(0, y, actualWidth, barHeight, 10);
        ctx.fill();

        // Barra de progreso
        const gradient = ctx.createLinearGradient(0, 0, actualWidth * percentage, 0);
        gradient.addColorStop(0, '#7C4DFF');
        gradient.addColorStop(1, '#E040FB');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, y, actualWidth * percentage, barHeight, 10);
        ctx.fill();

        // Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${current} / ${max}`, actualWidth / 2, actualHeight / 2 + 4);
    }

    /**
     * Dibuja un mini gráfico sparkline
     */
    function drawSparkline(canvasId, data, color = '#E040FB') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;

        if (data.length < 2) return;

        const minValue = Math.min(...data);
        const maxValue = Math.max(...data);
        const range = maxValue - minValue || 1;

        const padding = 4;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        data.forEach((value, i) => {
            const x = padding + ((actualWidth - padding * 2) / (data.length - 1)) * i;
            const y = actualHeight - padding - ((value - minValue) / range) * (actualHeight - padding * 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Punto final
        const lastX = actualWidth - padding;
        const lastY = actualHeight - padding - ((data[data.length - 1] - minValue) / range) * (actualHeight - padding * 2);
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * Genera datos de progreso desde el historial de sesiones
     */
    function getProgressDataFromLogs(exerciseName, metric = 'weight') {
        if (typeof SessionLoggerModule === 'undefined') return [];

        const logs = SessionLoggerModule.getLogsByExercise(exerciseName);
        if (logs.length === 0) return [];

        return logs.slice(-10).map(log => {
            let value = 0;
            if (metric === 'weight') {
                value = Math.max(...log.sets.map(s => s.weight));
            } else if (metric === 'volume') {
                value = log.totalVolume;
            } else if (metric === 'reps') {
                value = Math.max(...log.sets.map(s => s.reps));
            }

            return {
                value,
                label: log.dateFormatted.split(' ')[0],
                date: log.date
            };
        });
    }

    /**
     * Genera datos de autorregulación
     */
    function getAutoregulationTrend() {
        if (typeof AutoregulationModule === 'undefined') return [];

        const history = AutoregulationModule.getEvaluationHistory();
        return history.slice(-7).map(entry => ({
            value: 10 - ((entry.scores.fatigue + entry.scores.soreness) / 2),
            label: new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short' }),
            date: entry.date
        }));
    }

    /**
     * Renderiza el dashboard de gráficas
     */
    function renderDashboardCharts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="charts-grid">
                <div class="chart-card">
                    <h4 class="chart-title">📈 Tendencia de Recuperación</h4>
                    <canvas id="chart-recovery" class="chart-canvas"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">🏋️ Progreso de Fuerza</h4>
                    <canvas id="chart-strength" class="chart-canvas"></canvas>
                </div>
            </div>
        `;

        // Renderizar gráficas después de que el DOM se actualice
        setTimeout(() => {
            const recoveryData = getAutoregulationTrend();
            drawLineChart('chart-recovery', recoveryData, {
                title: '',
                lineColor: '#00BFA5'
            });

            // Obtener el ejercicio más frecuente
            const logs = SessionLoggerModule ? SessionLoggerModule.getAllLogs() : [];
            if (logs.length > 0) {
                const exercises = {};
                logs.forEach(log => {
                    exercises[log.exercise] = (exercises[log.exercise] || 0) + 1;
                });
                const topExercise = Object.entries(exercises).sort((a, b) => b[1] - a[1])[0]?.[0];

                if (topExercise) {
                    const strengthData = getProgressDataFromLogs(topExercise, 'weight');
                    drawLineChart('chart-strength', strengthData, {
                        title: topExercise,
                        lineColor: '#E040FB'
                    });
                }
            }
        }, 100);
    }

    /**
     * Dibuja gráfica de progreso del Mesociclo (Volumen, Intensidad, Esfuerzo) TEÓRICA
     */
    function drawMesocycleProgressionChart(canvasId, methodology = 'Y3T', level = 'intermediate') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        const actualWidth = container.offsetWidth || 600;
        const actualHeight = container.offsetHeight || 220;

        canvas.width = actualWidth * 2;
        canvas.height = actualHeight * 2;
        ctx.scale(2, 2);

        const padding = { top: 30, right: 30, bottom: 40, left: 40 };
        const chartW = actualWidth - padding.left - padding.right;
        const chartH = actualHeight - padding.top - padding.bottom;

        const bgGradient = ctx.createLinearGradient(0, 0, 0, actualHeight);
        bgGradient.addColorStop(0, '#1A1A2E');
        bgGradient.addColorStop(1, '#151525');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        const labels = ['S1 (Base)', 'S2 (Prog)', 'S3 (Int)', 'S4 (Peak)', 'S5 (Deload)'];

        let renderData = null;
        if (typeof WorkoutUIController !== 'undefined' && typeof WorkoutUIController.getMesocycleRenderData === 'function') {
            renderData = WorkoutUIController.getMesocycleRenderData(methodology, level);
        }

        if (!renderData) {
            renderData = {
                volData: [40, 60, 80, 100, 20],
                effData: [40, 60, 80, 100, 10],
                intData: [60, 70, 85, 100, 50],
                rawSets: [3, 4, 3, 2, 1]
            };
        }

        const datasets = [
            { label: 'Volumen', color: '#3B82F6', data: renderData.volData },
            { label: 'Esfuerzo', color: '#EF4444', data: renderData.effData },
            { label: 'Intensidad', color: '#F59E0B', data: renderData.intData }
        ];

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            let y = padding.top + (chartH / 4) * i;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(actualWidth - padding.right, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, actualHeight - padding.bottom);
        ctx.lineTo(actualWidth - padding.right, actualHeight - padding.bottom);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '600 12px Inter, sans-serif';
        const legendTotalW = datasets.length * 110;
        const legendStartX = (actualWidth - legendTotalW) / 2 + 10;

        datasets.forEach((ds, i) => {
            let x = legendStartX + (i * 110);
            let y = 18;
            ctx.fillStyle = ds.color;
            ctx.beginPath();
            ctx.roundRect(x, y - 10, 14, 14, 3);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(ds.label, x + 22, y + 2);
        });

        datasets.forEach((ds) => {
            ctx.strokeStyle = ds.color;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = ds.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();

            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            ctx.shadowBlur = 0;

            points.forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = ds.color;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#0F0F1A';
                ctx.fill();
            });
        });

        datasets.forEach((ds) => {
            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            points.forEach((p, i) => {
                if (ds.label === 'Volumen' && renderData && renderData.rawSets) {
                    const text = `${renderData.rawSets[i]} sets`;
                    ctx.font = '700 10.5px Inter, sans-serif';
                    const tw = ctx.measureText(text).width;

                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y - 28, tw + 12, 18, 4);
                    ctx.fill();

                    ctx.fillStyle = '#60A5FA';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, p.x, p.y - 19);
                }

                if (ds.label === 'Esfuerzo' && renderData && renderData.effData) {
                    let rirScore = renderData.effData[i];
                    let rirText = 'RIR 3';
                    if (rirScore >= 100) rirText = 'FALLO';
                    else if (rirScore >= 85) rirText = 'RIR 1';
                    else if (rirScore >= 65) rirText = 'RIR 2';
                    else if (rirScore <= 20) rirText = 'Recup.';

                    ctx.font = '700 9px Inter, sans-serif';
                    const tw = ctx.measureText(rirText).width;

                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y + 12, tw + 12, 16, 4);
                    ctx.fill();

                    ctx.fillStyle = '#F87171';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(rirText, p.x, p.y + 20);
                }
            });
        });

        ctx.fillStyle = '#C0C0D0';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((text, i) => {
            let x = padding.left + (chartW / 4) * i;
            ctx.fillText(text, x, actualHeight - 15);
        });
    }

    /**
     * Dibuja gráfica de progreso del Mesociclo (CUMPLIMIENTO REAL)
     */
    function drawComplianceProgressionChart(canvasId, methodology = 'Y3T', level = 'intermediate') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        // Si el contenedor mide 0 (porque la pestaña está oculta), usa sus dimensiones por CSS
        const actualWidth = container.offsetWidth || 600;
        const actualHeight = container.offsetHeight || 220;

        canvas.width = actualWidth * 2;
        canvas.height = actualHeight * 2;
        ctx.scale(2, 2);

        const padding = { top: 30, right: 30, bottom: 40, left: 40 };
        const chartW = actualWidth - padding.left - padding.right;
        const chartH = actualHeight - padding.top - padding.bottom;

        // Limpiar con fondo premium
        const bgGradient = ctx.createLinearGradient(0, 0, 0, actualHeight);
        bgGradient.addColorStop(0, '#1A1A2E');
        bgGradient.addColorStop(1, '#151525');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        const labels = ['S1 (Base)', 'S2 (Prog)', 'S3 (Int)', 'S4 (Peak)', 'S5 (Deload)'];

        // Extraer los datos teóricos de la metodología
        let renderData = null;
        if (typeof WorkoutUIController !== 'undefined' && typeof WorkoutUIController.getMesocycleRenderData === 'function') {
            renderData = WorkoutUIController.getMesocycleRenderData(methodology, level);
        }

        // Fallback robusto
        if (!renderData) {
            renderData = {
                volData: [40, 60, 80, 100, 20],
                effData: [40, 60, 80, 100, 10],
                intData: [60, 70, 85, 100, 50],
                rawSets: [3, 4, 3, 2, 1]
            };
        }

        // === NUEVO LÓGICO DE CUMPLIMIENTO (COMPLIANCE) ===
        // 1. Deducir cuántos días a la semana tiene la rutina actual
        let targetSessionsPerWeek = 4; // default
        try {
            const savedRoutine = localStorage.getItem('rpCoach_currentRoutine');
            if (savedRoutine) {
                const routine = JSON.parse(savedRoutine);
                if (routine.days && routine.days.length) {
                    targetSessionsPerWeek = routine.days.length;
                }
            }
        } catch (e) { }

        // 2. Extraer logs y agrupar por mesocycleWeek
        let complianceRatios = [0, 0, 0, 0, 0]; // S1 a S5
        if (typeof SessionLoggerModule !== 'undefined') {
            const allLogs = SessionLoggerModule.getAllLogs();
            // Contar cuántos entrenos hay por cada semana del mesociclo
            const sessionsPerWeekCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            allLogs.forEach(log => {
                const w = parseInt(log.weekNumber);
                if (w >= 1 && w <= 5) {
                    sessionsPerWeekCount[w]++;
                }
            });

            // Opcional: Dividir entre `targetSessionsPerWeek` para tener un log "por día", asumiendo que el usuario registra 1 vez = 1 ejercicio.
            // Para simplificar: asumiremos que cada 'saveLog' en SessionLoggerModule es una sesión completa o un ejercicio completado.
            // Es mejor agrupar por fecha única para saber cuántos DÍAS entrenó realmente.
            const uniqueDaysPerWeek = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
            allLogs.forEach(log => {
                const w = parseInt(log.weekNumber);
                if (w >= 1 && w <= 5) {
                    uniqueDaysPerWeek[w].add(log.dateFormatted);
                }
            });

            for (let w = 1; w <= 5; w++) {
                const completedDays = uniqueDaysPerWeek[w].size;
                complianceRatios[w - 1] = Math.min(completedDays / targetSessionsPerWeek, 1.0);
            }
        }

        // 3. Multiplicar Data por Compliance Ratio
        const actualVolData = renderData.volData.map((val, i) => val * complianceRatios[i]);
        const actualEffData = renderData.effData.map((val, i) => val * complianceRatios[i]);
        const actualIntData = renderData.intData.map((val, i) => val * complianceRatios[i]);

        const datasets = [
            { label: 'Volumen', color: '#3B82F6', data: actualVolData, rawSets: renderData.rawSets, theoryEff: renderData.effData, ratio: complianceRatios },
            { label: 'Esfuerzo', color: '#EF4444', data: actualEffData, ratio: complianceRatios },
            { label: 'Intensidad', color: '#F59E0B', data: actualIntData, ratio: complianceRatios }
        ];

        // Grid Y refinado (Líneas sutiles)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            let y = padding.top + (chartH / 4) * i;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(actualWidth - padding.right, y);
        }
        ctx.stroke();

        // Ejes X / Y (Lineas base sólidas)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, actualHeight - padding.bottom);
        ctx.lineTo(actualWidth - padding.right, actualHeight - padding.bottom);
        ctx.stroke();

        // Leyenda SUPERIOR (fuera de la malla para evitar bloqueos)
        ctx.textAlign = 'left';
        ctx.font = '600 12px Inter, sans-serif'; // Texto más legible
        const legendTotalW = datasets.length * 110;
        const legendStartX = (actualWidth - legendTotalW) / 2 + 10;

        datasets.forEach((ds, i) => {
            let x = legendStartX + (i * 110);
            let y = 18; // Pegarlo al techo

            ctx.fillStyle = ds.color;
            ctx.beginPath();
            ctx.roundRect(x, y - 10, 14, 14, 3); // Botón de color
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(ds.label, x + 22, y + 2); // Texto más legible
        });

        // Dibujar curvas con Neon Glow
        datasets.forEach((ds) => {
            ctx.strokeStyle = ds.color;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = ds.color;
            ctx.shadowBlur = 8; // Efecto Neon premium
            ctx.beginPath();

            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            // Desactivar sombra para puntos
            ctx.shadowBlur = 0;

            // Dibujar Puntos Intersección Premium
            points.forEach((p, i) => {
                // Ribete externo
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = ds.color;
                ctx.fill();

                // Centro oscuro
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#0F0F1A';
                ctx.fill();
            });
        });

        // === CAPA SUPERIOR (Z-INDEX): Etiquetas y Datos Duros ===
        // Se dibujan al final para garantizar que ninguna línea de otro dataset pase por encima (encimado)
        datasets.forEach((ds) => {
            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            points.forEach((p, i) => {
                // Solo mostrar la etiqueta si el cumplimiento > 0 para que no floten en el aire
                if (ds.ratio && ds.ratio[i] === 0) return;

                // Etiqueta de Volumen (Arriba)
                if (ds.label === 'Volumen' && ds.rawSets) {
                    const fracSets = (ds.rawSets[i] * ds.ratio[i]).toFixed(1).replace('.0', '');
                    const text = `${fracSets} sets`;
                    ctx.font = '700 10.5px Inter, sans-serif';
                    const tw = ctx.measureText(text).width;

                    // Fondo tipo cápsula (Pill) para asegurar legibilidad
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)'; // Color de fondo oscuro con ligera transparencia
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y - 28, tw + 12, 18, 4);
                    ctx.fill();

                    // Texto Premium Neon
                    ctx.fillStyle = '#60A5FA';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, p.x, p.y - 19);
                }

                // Etiqueta de Esfuerzo/RIR (Abajo)
                if (ds.label === 'Esfuerzo' && datasets[0].theoryEff) {
                    // Calculamos el texto del RIR basado en el esfuerzo REQUERIDO, 
                    // pero solo si lo estamos cumpliendo
                    let rirScore = datasets[0].theoryEff[i]; // Theoretical intended effort 
                    let rirText = 'RIR 3';
                    if (rirScore >= 100) rirText = 'FALLO';
                    else if (rirScore >= 85) rirText = 'RIR 1';
                    else if (rirScore >= 65) rirText = 'RIR 2';
                    else if (rirScore <= 20) rirText = 'Recup.';

                    // Append percentage completed
                    let completedPct = Math.round(ds.ratio[i] * 100) + '%';
                    let fullText = `${rirText} (${completedPct})`;

                    ctx.font = '700 9px Inter, sans-serif';
                    const tw = ctx.measureText(fullText).width;

                    // Fondo cápsula (Pill)
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y + 12, tw + 12, 16, 4);
                    ctx.fill();

                    // Texto Rojo Neon
                    ctx.fillStyle = '#F87171';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(fullText, p.x, p.y + 20);
                }
            });
        });

        // Eje X Labels - Inferiores, más grandes y legibles
        ctx.fillStyle = '#C0C0D0';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((text, i) => {
            let x = padding.left + (chartW / 4) * i;
            ctx.fillText(text, x, actualHeight - 15);
        });
    }

    // API Pública
    return {
        drawLineChart,
        drawProgressBar,
        drawSparkline,
        getProgressDataFromLogs,
        getAutoregulationTrend,
        renderDashboardCharts,
        drawMesocycleProgressionChart,
        drawComplianceProgressionChart
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ProgressChartsModule = ProgressChartsModule;
}
