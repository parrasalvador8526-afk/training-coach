/**
 * NEXUS-RP Coach - Calendario Tracker
 * Sistema de calendario con seguimiento de asistencia integrado al mesociclo
 */
const CalendarioTracker = (() => {
    const STORAGE_KEY = 'rpCoach_attendance_calendar';
    const SESSION_HISTORY_KEY = 'rpCoach_session_history';
    const ROUTINE_KEY = 'rpCoach_active_routine';

    const SPLIT_DAYS_MAP = {
        'push_pull_legs': 6,
        'upper_lower': 4,
        'bro_split': 5,
        'hit_3day': 3,
        'full_body': 3
    };

    const MESOCYCLE_PHASES = {
        1: { name: 'Acumulación', color: '#3B82F6' },
        2: { name: 'Progresión', color: '#F59E0B' },
        3: { name: 'Intensificación', color: '#EF4444' },
        4: { name: 'Peak', color: '#DC2626' },
        5: { name: 'Deload', color: '#10B981' }
    };

    let activeWeekView = 1;

    // ========== DATOS ==========

    function getCalendarData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    function saveCalendarData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function recalculateSummary(calendarData) {
        let totalCompleted = 0, totalMissed = 0, totalPlanned = 0;
        Object.values(calendarData.weeks).forEach(week => {
            totalPlanned += week.plannedDays.length;
            Object.values(week.attendance).forEach(a => {
                if (a.status === 'completed') totalCompleted++;
                if (a.status === 'missed') totalMissed++;
            });
        });
        calendarData.summary = {
            totalPlanned,
            totalCompleted,
            totalMissed,
            compliancePercent: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
        };
    }

    // ========== CREACIÓN ==========

    function createCalendarFromRoutine(routine) {
        const split = routine.split || 'push_pull_legs';
        const daysPerWeek = SPLIT_DAYS_MAP[split] || routine.days?.length || 4;
        const startDate = new Date();

        // Ajustar al lunes más cercano (actual o siguiente)
        const dayOfWeek = startDate.getDay();
        if (dayOfWeek === 0) {
            startDate.setDate(startDate.getDate() + 1);
        } else if (dayOfWeek !== 1) {
            startDate.setDate(startDate.getDate() + (8 - dayOfWeek));
        }
        startDate.setHours(0, 0, 0, 0);

        const dayNames = routine.days?.map(d => d.name) || [];
        const weeks = {};

        for (let w = 1; w <= 5; w++) {
            const phase = MESOCYCLE_PHASES[w];
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (w - 1) * 7);

            const plannedDays = [];
            for (let d = 0; d < daysPerWeek; d++) {
                const dayDate = new Date(weekStart);
                dayDate.setDate(dayDate.getDate() + d);
                plannedDays.push({
                    dayIndex: d,
                    dayName: dayNames[d % dayNames.length] || ('Día ' + (d + 1)),
                    plannedDate: dayDate.toISOString().split('T')[0]
                });
            }

            weeks[w] = {
                name: phase.name,
                color: phase.color,
                rir: [3, 2, 1, 0, 4][w - 1],
                plannedDays,
                attendance: {}
            };
        }

        const calendarData = {
            mesocycleId: 'meso_' + Date.now(),
            startDate: startDate.toISOString(),
            methodology: routine.methodologyName || routine.methodology,
            split: routine.split,
            totalWeeks: 5,
            daysPerWeek,
            weeks,
            summary: { totalPlanned: daysPerWeek * 5, totalCompleted: 0, totalMissed: 0, compliancePercent: 0 }
        };

        saveCalendarData(calendarData);
        return calendarData;
    }

    // ========== SINCRONIZACIÓN ==========

    function syncWithSessionHistory() {
        const calendarData = getCalendarData();
        if (!calendarData) return;

        const history = JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) || '[]');
        const today = new Date().toISOString().split('T')[0];

        Object.keys(calendarData.weeks).forEach(weekNum => {
            const week = calendarData.weeks[weekNum];
            week.plannedDays.forEach(planned => {
                const dateKey = planned.plannedDate;

                // Buscar sesión registrada en esa fecha
                const matchingSession = history.find(session => {
                    const sessionDate = new Date(session.date).toISOString().split('T')[0];
                    return sessionDate === dateKey;
                });

                if (matchingSession) {
                    week.attendance[dateKey] = {
                        status: 'completed',
                        sessionId: matchingSession.id,
                        dayName: planned.dayName,
                        stats: {
                            totalSets: matchingSession.stats?.totalSets || 0,
                            totalVolume: matchingSession.stats?.totalVolume || 0,
                            avgRPE: matchingSession.stats?.avgRPE || '-'
                        }
                    };
                } else if (dateKey < today && !week.attendance[dateKey]) {
                    week.attendance[dateKey] = { status: 'missed', sessionId: null, dayName: planned.dayName };
                } else if (dateKey >= today && (!week.attendance[dateKey] || week.attendance[dateKey].status === 'pending')) {
                    week.attendance[dateKey] = { status: 'pending', sessionId: null, dayName: planned.dayName };
                }
            });
        });

        recalculateSummary(calendarData);
        saveCalendarData(calendarData);
    }

    function markAttendance(date, sessionId, stats) {
        const calendarData = getCalendarData();
        if (!calendarData) return false;

        const dateKey = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];

        for (const week of Object.values(calendarData.weeks)) {
            const planned = week.plannedDays.find(d => d.plannedDate === dateKey);
            if (planned) {
                week.attendance[dateKey] = {
                    status: 'completed',
                    sessionId,
                    dayName: planned.dayName,
                    stats: stats || {}
                };
                break;
            }
        }

        recalculateSummary(calendarData);
        saveCalendarData(calendarData);
        renderCalendar();
        renderMesocycleSummary();
        return true;
    }

    // ========== RENDER CALENDARIO ==========

    function renderCalendar() {
        const calendarData = getCalendarData();
        if (!calendarData) {
            const section = document.getElementById('attendance-calendar-section');
            if (section) section.style.display = 'none';
            return;
        }

        const section = document.getElementById('attendance-calendar-section');
        if (section) section.style.display = 'block';

        renderWeekTabs(calendarData);
        renderGrid(calendarData);
        updateComplianceBadge(calendarData);
    }

    function renderWeekTabs(calendarData) {
        const tabsContainer = document.getElementById('calendar-week-tabs');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = [1, 2, 3, 4, 5].map(w => {
            const phase = MESOCYCLE_PHASES[w];
            const weekData = calendarData.weeks[w];
            const completed = Object.values(weekData.attendance).filter(a => a.status === 'completed').length;
            const total = weekData.plannedDays.length;
            const isActive = w === activeWeekView;
            return '<button class="day-tab' + (isActive ? ' active' : '') + '" ' +
                   'data-calendar-week="' + w + '" ' +
                   'style="' + (isActive ? 'background:' + phase.color + '; border-color:' + phase.color + ';' : '') + '">' +
                   'S' + w + ' ' + phase.name + ' (' + completed + '/' + total + ')' +
                   '</button>';
        }).join('');

        tabsContainer.querySelectorAll('.day-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                activeWeekView = parseInt(tab.dataset.calendarWeek);
                renderCalendar();
            });
        });
    }

    function renderGrid(calendarData) {
        const gridContainer = document.getElementById('calendar-grid');
        if (!gridContainer) return;

        const weekData = calendarData.weeks[activeWeekView];
        if (!weekData) return;

        const today = new Date().toISOString().split('T')[0];
        const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        let html = dayHeaders.map(d =>
            '<div class="calendar-grid__header">' + d + '</div>'
        ).join('');

        // Lunes de la semana activa
        const weekStart = new Date(calendarData.startDate);
        weekStart.setDate(weekStart.getDate() + (activeWeekView - 1) * 7);

        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(weekStart);
            cellDate.setDate(cellDate.getDate() + d);
            const dateKey = cellDate.toISOString().split('T')[0];
            const dayNumber = cellDate.getDate();
            const monthName = cellDate.toLocaleDateString('es', { month: 'short' });

            const planned = weekData.plannedDays.find(p => p.plannedDate === dateKey);
            const attendance = weekData.attendance[dateKey];

            let cellClass = 'calendar-cell';
            let content = '';

            if (planned) {
                const status = attendance?.status || 'pending';
                cellClass += ' calendar-cell--' + status;
                const icon = status === 'completed' ? '✓' : status === 'missed' ? '✗' : '●';
                content = '<div class="calendar-cell__day-number">' + dayNumber + ' ' + monthName + '</div>' +
                          '<div class="calendar-cell__day-name">' + planned.dayName + '</div>' +
                          '<div style="font-size: 0.9rem;">' + icon + '</div>';
            } else {
                cellClass += ' calendar-cell--rest';
                content = '<div class="calendar-cell__day-number">' + dayNumber + '</div>' +
                          '<div class="calendar-cell__day-name">Desc.</div>';
            }

            if (dateKey === today) {
                cellClass += ' calendar-cell--today';
            }

            html += '<div class="' + cellClass + '" data-date="' + dateKey + '" title="' +
                    (planned ? planned.dayName : 'Descanso') + '">' + content + '</div>';
        }

        // Barra de progreso semanal
        const completed = Object.values(weekData.attendance).filter(a => a.status === 'completed').length;
        const total = weekData.plannedDays.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        html += '<div style="grid-column: 1 / -1;">' +
                '<div class="calendar-week-progress">' +
                '<div class="calendar-week-progress__fill" style="width: ' + percent + '%; background: ' + weekData.color + ';"></div>' +
                '</div>' +
                '<div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">' +
                completed + '/' + total + ' sesiones completadas (' + percent + '%)' +
                '</div></div>';

        gridContainer.innerHTML = html;
    }

    function updateComplianceBadge(calendarData) {
        const badge = document.getElementById('calendar-compliance-badge');
        if (!badge) return;
        const pct = calendarData.summary.compliancePercent;
        badge.textContent = pct + '% Cumplimiento';
        badge.style.background = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
    }

    // ========== RENDER RESUMEN MESOCICLO ==========

    function renderMesocycleSummary() {
        const calendarData = getCalendarData();
        if (!calendarData) return;

        const section = document.getElementById('mesocycle-summary-section');
        if (!section) return;

        const hasData = Object.values(calendarData.weeks).some(w =>
            Object.keys(w.attendance).length > 0
        );
        if (!hasData) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';

        const s = calendarData.summary;

        // Stat boxes
        const statsContainer = document.getElementById('mesocycle-summary-stats');
        if (statsContainer) {
            statsContainer.innerHTML =
                '<div class="stat-box">' +
                '<div class="stat-box__value" style="color: #00E676;">' + s.totalCompleted + '</div>' +
                '<div class="stat-box__label">Completadas</div></div>' +
                '<div class="stat-box">' +
                '<div class="stat-box__value" style="color: #FF5252;">' + s.totalMissed + '</div>' +
                '<div class="stat-box__label">Faltadas</div></div>' +
                '<div class="stat-box">' +
                '<div class="stat-box__value">' + s.totalPlanned + '</div>' +
                '<div class="stat-box__label">Planeadas</div></div>' +
                '<div class="stat-box">' +
                '<div class="stat-box__value" style="color: ' +
                (s.compliancePercent >= 80 ? '#00E676' : s.compliancePercent >= 50 ? '#FFB300' : '#FF5252') + ';">' +
                s.compliancePercent + '%</div>' +
                '<div class="stat-box__label">Cumplimiento</div></div>';
        }

        // Tabla detallada semana por semana
        const detailsContainer = document.getElementById('mesocycle-summary-details');
        if (detailsContainer) {
            let tableHTML = '<table class="data-table"><tr>' +
                '<th>Semana</th><th>Fase</th><th>Completadas</th><th>Faltadas</th><th>%</th></tr>';

            for (let w = 1; w <= 5; w++) {
                const week = calendarData.weeks[w];
                const completed = Object.values(week.attendance).filter(a => a.status === 'completed').length;
                const missed = Object.values(week.attendance).filter(a => a.status === 'missed').length;
                const total = week.plannedDays.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                tableHTML += '<tr>' +
                    '<td>S' + w + '</td>' +
                    '<td><span style="color: ' + week.color + '; font-weight: 600;">' + week.name + '</span></td>' +
                    '<td style="color: #00E676;">' + completed + '/' + total + '</td>' +
                    '<td style="color: ' + (missed > 0 ? '#FF5252' : 'var(--text-muted)') + ';">' + missed + '</td>' +
                    '<td style="font-weight: 700; color: ' +
                    (pct >= 80 ? '#00E676' : pct >= 50 ? '#FFB300' : '#FF5252') + ';">' + pct + '%</td></tr>';
            }
            tableHTML += '</table>';
            detailsContainer.innerHTML = tableHTML;
        }

        drawAttendanceChart(calendarData);
    }

    function drawAttendanceChart(calendarData) {
        const canvas = document.getElementById('mesocycle-attendance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        const padding = { top: 25, right: 20, bottom: 35, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        // Título
        ctx.fillStyle = '#B0B0C0';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Asistencia por Semana del Mesociclo', width / 2, 14);

        const barGroupWidth = chartW / 5;
        const barWidth = barGroupWidth * 0.55;

        for (let w = 1; w <= 5; w++) {
            const week = calendarData.weeks[w];
            const total = week.plannedDays.length;
            const completed = Object.values(week.attendance).filter(a => a.status === 'completed').length;
            const pct = total > 0 ? completed / total : 0;

            const x = padding.left + (w - 1) * barGroupWidth + (barGroupWidth - barWidth) / 2;
            const barH = pct * chartH;
            const y = padding.top + chartH - barH;

            // Barra fondo
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.roundRect(x, padding.top, barWidth, chartH, 4);
            ctx.fill();

            // Barra completado
            if (barH > 0) {
                ctx.fillStyle = week.color;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barH, 4);
                ctx.fill();
            }

            // Labels
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('S' + w, x + barWidth / 2, height - 8);

            if (pct > 0) {
                ctx.fillStyle = week.color;
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillText(Math.round(pct * 100) + '%', x + barWidth / 2, y - 6);
            }
        }
    }

    // ========== INIT ==========

    function initCalendar() {
        const calendarData = getCalendarData();
        if (!calendarData) {
            const routine = JSON.parse(localStorage.getItem(ROUTINE_KEY) || 'null');
            if (routine) {
                createCalendarFromRoutine(routine);
            } else {
                // Ocultar secciones si no hay datos
                const section = document.getElementById('attendance-calendar-section');
                if (section) section.style.display = 'none';
                const summary = document.getElementById('mesocycle-summary-section');
                if (summary) summary.style.display = 'none';
                return;
            }
        }
        syncWithSessionHistory();
        renderCalendar();
        renderMesocycleSummary();
    }

    function resetCalendar() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // API pública
    return {
        initCalendar,
        createCalendarFromRoutine,
        syncWithSessionHistory,
        markAttendance,
        renderCalendar,
        renderMesocycleSummary,
        getCalendarData,
        resetCalendar
    };
})();
