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

        // Color de la fase activa para las celdas pendientes
        const phaseColor = weekData.color;
        // Convertir hex a rgb para poder usar con rgba
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return r + ',' + g + ',' + b;
        };
        const phaseRgb = hexToRgb(phaseColor);

        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(weekStart);
            cellDate.setDate(cellDate.getDate() + d);
            const dateKey = cellDate.toISOString().split('T')[0];
            const dayNumber = cellDate.getDate();
            const monthName = cellDate.toLocaleDateString('es', { month: 'short' });

            const planned = weekData.plannedDays.find(p => p.plannedDate === dateKey);
            const attendance = weekData.attendance[dateKey];

            let cellClass = 'calendar-cell';
            let cellStyle = '';
            let content = '';

            if (planned) {
                const status = attendance?.status || 'pending';
                if (status === 'pending') {
                    // Usar el color de la fase para celdas pendientes
                    cellClass += ' calendar-cell--pending';
                    cellStyle = 'background: rgba(' + phaseRgb + ', 0.15); border-color: rgba(' + phaseRgb + ', 0.35); color: ' + phaseColor + ';';
                } else {
                    cellClass += ' calendar-cell--' + status;
                }
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

            html += '<div class="' + cellClass + '"' + (cellStyle ? ' style="' + cellStyle + '"' : '') + ' data-date="' + dateKey + '" title="' +
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

    function getCurrentWeek(calendarData) {
        const today = new Date().toISOString().split('T')[0];
        for (let w = 1; w <= 5; w++) {
            const week = calendarData.weeks[w];
            const dates = week.plannedDays.map(d => d.plannedDate);
            if (dates.length === 0) continue;
            const firstDate = dates[0];
            // La semana abarca 7 días desde el primer día planeado
            const weekEnd = new Date(firstDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const weekEndStr = weekEnd.toISOString().split('T')[0];
            if (today >= firstDate && today <= weekEndStr) return w;
        }
        // Si pasó todo el mesociclo, retornar 5
        const lastWeekDates = calendarData.weeks[5].plannedDays.map(d => d.plannedDate);
        if (lastWeekDates.length > 0 && today > lastWeekDates[lastWeekDates.length - 1]) return 5;
        return 1;
    }

    function calculateExtraStats(calendarData) {
        let currentStreak = 0;
        let bestWeekPct = 0;
        let bestWeekNum = 1;
        let totalVolume = 0;
        let rpeSum = 0;
        let rpeCount = 0;
        let totalSetsAll = 0;
        let daysRemaining = 0;
        const today = new Date().toISOString().split('T')[0];

        // Recopilar todas las fechas completadas en orden
        const allDates = [];
        for (let w = 1; w <= 5; w++) {
            const week = calendarData.weeks[w];
            const completed = Object.values(week.attendance).filter(a => a.status === 'completed');
            const total = week.plannedDays.length;
            const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;
            if (pct > bestWeekPct) { bestWeekPct = pct; bestWeekNum = w; }

            completed.forEach(a => {
                if (a.stats) {
                    totalVolume += a.stats.totalVolume || 0;
                    totalSetsAll += a.stats.totalSets || 0;
                    if (a.stats.avgRPE && a.stats.avgRPE !== '-') {
                        rpeSum += parseFloat(a.stats.avgRPE);
                        rpeCount++;
                    }
                }
            });

            // Días restantes (pendientes)
            week.plannedDays.forEach(d => {
                if (d.plannedDate >= today) daysRemaining++;
            });

            // Para racha
            week.plannedDays.forEach(d => {
                allDates.push({ date: d.plannedDate, status: week.attendance[d.plannedDate]?.status || 'pending' });
            });
        }

        // Calcular racha actual (últimas sesiones completadas consecutivas)
        allDates.sort((a, b) => a.date.localeCompare(b.date));
        // Filtrar solo fechas pasadas o de hoy
        const pastDates = allDates.filter(d => d.date <= today);
        for (let i = pastDates.length - 1; i >= 0; i--) {
            if (pastDates[i].status === 'completed') currentStreak++;
            else break;
        }

        return {
            currentStreak,
            bestWeekPct,
            bestWeekNum,
            totalVolume,
            avgRPE: rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : '-',
            totalSets: totalSetsAll,
            daysRemaining
        };
    }

    function renderMesocycleSummary() {
        const calendarData = getCalendarData();
        if (!calendarData) return;

        const section = document.getElementById('mesocycle-summary-section');
        if (!section) return;

        // Mostrar siempre que exista calendario (no requerir sesiones completadas)
        section.style.display = 'block';

        const s = calendarData.summary;
        const currentWeek = getCurrentWeek(calendarData);
        const currentPhase = MESOCYCLE_PHASES[currentWeek];
        const currentRIR = calendarData.weeks[currentWeek].rir;
        const extra = calculateExtraStats(calendarData);

        // Obtener info de rutina
        let methodology = calendarData.methodology || '-';
        let splitName = calendarData.split || '-';
        const splitLabels = {
            'push_pull_legs': 'Push/Pull/Legs',
            'upper_lower': 'Upper/Lower',
            'bro_split': 'Bro Split',
            'hit_3day': 'HIT 3 días',
            'full_body': 'Full Body'
        };
        splitName = splitLabels[splitName] || splitName;

        // ===== Info Bar compacta (una línea) =====
        const infoBar = document.getElementById('mesocycle-info-bar');
        if (infoBar) {
            infoBar.innerHTML =
                '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; font-size: 0.78rem;">' +
                    '<span style="padding: 3px 10px; background: rgba(255,255,255,0.06); border-radius: 12px; color: ' + currentPhase.color + '; font-weight: 600;">S' + currentWeek + ' · ' + currentPhase.name + '</span>' +
                    '<span style="padding: 3px 10px; background: rgba(255,255,255,0.06); border-radius: 12px; color: #E0E0E0;">' + methodology + '</span>' +
                    '<span style="padding: 3px 10px; background: rgba(255,255,255,0.06); border-radius: 12px; color: #E0E0E0;">' + splitName + '</span>' +
                    '<span style="padding: 3px 10px; background: rgba(255,179,0,0.1); border-radius: 12px; color: #FFB300; font-weight: 600;">RIR ' + currentRIR + '</span>' +
                    '<span style="padding: 3px 10px; background: rgba(139,92,246,0.1); border-radius: 12px; color: #8B5CF6;">' + extra.daysRemaining + ' días restantes</span>' +
                '</div>';
        }

        // ===== Timeline compacto =====
        const timeline = document.getElementById('mesocycle-timeline');
        if (timeline) {
            let timelineHTML = '<div style="display: flex; gap: 2px; margin-bottom: 10px;">';
            for (let w = 1; w <= 5; w++) {
                const phase = MESOCYCLE_PHASES[w];
                const week = calendarData.weeks[w];
                const completed = Object.values(week.attendance).filter(a => a.status === 'completed').length;
                const total = week.plannedDays.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isActive = w === currentWeek;
                const isPast = w < currentWeek;

                let bgColor = 'rgba(255,255,255,0.05)';
                if (isPast && pct >= 80) bgColor = 'rgba(16,185,129,0.25)';
                else if (isPast && pct >= 50) bgColor = 'rgba(245,158,11,0.25)';
                else if (isPast) bgColor = 'rgba(239,68,68,0.2)';
                if (isActive) bgColor = 'rgba(59,130,246,0.15)';

                const border = isActive ? '2px solid ' + phase.color : '1px solid rgba(255,255,255,0.06)';
                const radius = w === 1 ? '6px 0 0 6px' : w === 5 ? '0 6px 6px 0' : '0';

                timelineHTML +=
                    '<div style="flex:1; text-align:center; padding:4px 2px; background:' + bgColor + '; border:' + border + '; border-radius:' + radius + '; position:relative;" title="' + phase.name + ' (' + pct + '%)">' +
                        '<div style="font-size:0.6rem; color:' + phase.color + '; font-weight:700;">' + phase.name.substring(0, 4) + '</div>' +
                        '<div style="font-size:0.7rem; font-weight:600; color:#E0E0E0;">S' + w + '</div>' +
                        (isActive ? '<div style="position:absolute; bottom:-3px; left:50%; transform:translateX(-50%); width:6px; height:6px; background:' + phase.color + '; border-radius:50%;"></div>' : '') +
                    '</div>';
            }
            timelineHTML += '</div>';
            timeline.innerHTML = timelineHTML;
        }

        // ===== Stats compactos en línea (sin stat-boxes grandes) =====
        const statsContainer = document.getElementById('mesocycle-summary-stats');
        if (statsContainer) {
            const complianceColor = s.compliancePercent >= 80 ? '#00E676' : s.compliancePercent >= 50 ? '#FFB300' : '#FF5252';
            statsContainer.innerHTML =
                '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 6px;">' +
                    '<div style="text-align:center; padding:6px 4px; background:rgba(255,255,255,0.04); border-radius:6px;">' +
                        '<div style="font-size:1.1rem; font-weight:700; color:#00E676;">' + s.totalCompleted + '<span style="font-size:0.7rem; color:var(--text-muted);">/' + s.totalPlanned + '</span></div>' +
                        '<div style="font-size:0.65rem; color:var(--text-muted);">Sesiones</div>' +
                    '</div>' +
                    '<div style="text-align:center; padding:6px 4px; background:rgba(255,255,255,0.04); border-radius:6px;">' +
                        '<div style="font-size:1.1rem; font-weight:700; color:' + complianceColor + ';">' + s.compliancePercent + '%</div>' +
                        '<div style="font-size:0.65rem; color:var(--text-muted);">% Asistencia</div>' +
                    '</div>' +
                    '<div style="text-align:center; padding:6px 4px; background:rgba(255,255,255,0.04); border-radius:6px;">' +
                        '<div style="font-size:1.1rem; font-weight:700; color:#F59E0B;">' + extra.currentStreak + '</div>' +
                        '<div style="font-size:0.65rem; color:var(--text-muted);">Sesiones sin faltar</div>' +
                    '</div>' +
                    '<div style="text-align:center; padding:6px 4px; background:rgba(255,255,255,0.04); border-radius:6px;">' +
                        '<div style="font-size:1.1rem; font-weight:700; color:#E040FB;">' + extra.avgRPE + '</div>' +
                        '<div style="font-size:0.65rem; color:var(--text-muted);">Esfuerzo Prom.</div>' +
                    '</div>' +
                '</div>' +
                (s.totalMissed > 0 ? '<div style="font-size:0.75rem; color:#FF5252; text-align:right; margin-bottom:4px;">' + s.totalMissed + ' sesión(es) faltada(s)</div>' : '');
        }

        // ===== Tabla compacta semana por semana =====
        const detailsContainer = document.getElementById('mesocycle-summary-details');
        if (detailsContainer) {
            let tableHTML = '<table class="data-table" style="font-size:0.8rem;"><tr>' +
                '<th>Sem</th><th>Fase</th><th>RIR</th><th>Progreso</th><th>%</th></tr>';

            for (let w = 1; w <= 5; w++) {
                const week = calendarData.weeks[w];
                const completed = Object.values(week.attendance).filter(a => a.status === 'completed').length;
                const missed = Object.values(week.attendance).filter(a => a.status === 'missed').length;
                const total = week.plannedDays.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isActive = w === currentWeek;

                tableHTML += '<tr' + (isActive ? ' style="background:rgba(255,255,255,0.04);"' : '') + '>' +
                    '<td style="font-weight:600;">' + (isActive ? '▶ ' : '') + 'S' + w + '</td>' +
                    '<td><span style="color:' + week.color + '; font-weight:600;">' + week.name + '</span></td>' +
                    '<td style="color:#FFB300; font-weight:600;">' + week.rir + '</td>' +
                    '<td>' +
                        '<span style="color:#00E676;">' + completed + '</span>' +
                        (missed > 0 ? ' · <span style="color:#FF5252;">' + missed + ' falta</span>' : '') +
                        '<span style="color:var(--text-muted);"> / ' + total + '</span>' +
                    '</td>' +
                    '<td style="font-weight:700; color:' + (pct >= 80 ? '#00E676' : pct >= 50 ? '#FFB300' : '#FF5252') + ';">' + pct + '%</td></tr>';
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
        const padding = { top: 38, right: 20, bottom: 35, left: 40 };
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
