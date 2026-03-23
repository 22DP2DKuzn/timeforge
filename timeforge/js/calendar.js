/* ============================================
   TimeForge — Calendar
   Month/Week/Day views, drag-drop, navigation
   ============================================ */

const Calendar = (() => {
    let currentDate = new Date();
    let currentView = 'month'; // month | week | day
    let draggedTaskId = null;

    /** Render calendar page */
    function renderPage() {
        const page = document.getElementById('calendar-page');
        const months = I18n.t('calendar.months');
        const monthName = Array.isArray(months) ? months[currentDate.getMonth()] : '';

        page.innerHTML = `
            <div class="page-header">
                <h1>${I18n.t('calendar.title')}</h1>
            </div>
            <div class="calendar-controls">
                <div class="calendar-nav">
                    <button class="cal-nav-btn" id="cal-prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                    <h2 id="cal-title">${monthName} ${currentDate.getFullYear()}</h2>
                    <button class="cal-nav-btn" id="cal-next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
                    <button class="btn btn-sm btn-secondary" id="cal-today">${I18n.t('calendar.today')}</button>
                </div>
                <div class="calendar-view-tabs">
                    <button class="cal-view-btn ${currentView==='month'?'active':''}" data-view="month">${I18n.t('calendar.month')}</button>
                    <button class="cal-view-btn ${currentView==='week'?'active':''}" data-view="week">${I18n.t('calendar.week')}</button>
                    <button class="cal-view-btn ${currentView==='day'?'active':''}" data-view="day">${I18n.t('calendar.day')}</button>
                </div>
            </div>
            <div id="calendar-content" class="cal-view-enter"></div>
        `;

        bindControls();
        renderView();
    }

    function bindControls() {
        document.getElementById('cal-prev')?.addEventListener('click', () => { navigate(-1); });
        document.getElementById('cal-next')?.addEventListener('click', () => { navigate(1); });
        document.getElementById('cal-today')?.addEventListener('click', () => { currentDate = new Date(); renderPage(); });
        document.querySelectorAll('.cal-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentView = btn.dataset.view;
                document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderView();
            });
        });
    }

    function navigate(dir) {
        if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + dir);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + dir * 7);
        else currentDate.setDate(currentDate.getDate() + dir);
        updateTitle();
        renderView();
    }

    function updateTitle() {
        const months = I18n.t('calendar.months');
        const el = document.getElementById('cal-title');
        if (!el) return;
        if (currentView === 'month') {
            el.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (currentView === 'week') {
            const start = getWeekStart(currentDate);
            const end = new Date(start); end.setDate(end.getDate() + 6);
            el.textContent = `${Utils.formatDate(start)} – ${Utils.formatDate(end)}`;
        } else {
            el.textContent = Utils.formatDate(currentDate);
        }
    }

    function renderView() {
        updateTitle();
        const content = document.getElementById('calendar-content');
        if (!content) return;
        content.classList.add('cal-view-enter');
        if (currentView === 'month') renderMonth(content);
        else if (currentView === 'week') renderWeek(content);
        else renderDay(content);
    }

    /** Get Monday of the week containing `date` */
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0,0,0,0);
        return d;
    }

    function getTasksForDate(dateStr) {
        const user = Store.getCurrentUser();
        if (!user) return [];
        return Store.getTasks(user.id).filter(t => t.date === dateStr);
    }

    /* ========================
       MONTH VIEW
       ======================== */
    function renderMonth(container) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDay = Utils.getFirstDayOfMonth(year, month);
        const today = new Date();
        const dayNames = Utils.getDayNames();

        let html = '<div class="calendar-month">';
        dayNames.forEach(d => { html += `<div class="cal-header-cell">${d}</div>`; });

        // Previous month fill
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const prevDays = Utils.getDaysInMonth(prevYear, prevMonth);
        for (let i = firstDay - 1; i >= 0; i--) {
            const d = prevDays - i;
            const dateStr = `${prevYear}-${String(prevMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            html += renderDayCell(dateStr, d, true, false);
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isToday = Utils.isSameDay(new Date(year, month, d), today);
            html += renderDayCell(dateStr, d, false, isToday);
        }

        // Next month fill
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let d = 1; d <= remaining; d++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            const dateStr = `${nextYear}-${String(nextMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            html += renderDayCell(dateStr, d, true, false);
        }

        html += '</div>';
        container.innerHTML = html;
        bindDragDrop();
        bindCellClicks();
    }

    function renderDayCell(dateStr, dayNum, isOtherMonth, isToday) {
        const tasks = getTasksForDate(dateStr);
        const maxShow = 3;
        let eventsHtml = '';
        tasks.slice(0, maxShow).forEach(t => {
            const cls = t.type === 'meeting' ? 'meeting' : `priority-${t.priority}`;
            eventsHtml += `<div class="cal-event ${cls}" draggable="true" data-task-id="${t.id}">${t.time} ${Utils.escapeHtml(t.name)}</div>`;
        });
        if (tasks.length > maxShow) eventsHtml += `<div class="cal-more">+${tasks.length - maxShow}</div>`;

        return `
            <div class="cal-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="cal-day-number">${dayNum}</div>
                <div class="cal-day-events">${eventsHtml}</div>
            </div>
        `;
    }

    /* ========================
       WEEK VIEW (simplified)
       ======================== */
    function renderWeek(container) {
        const start = getWeekStart(currentDate);
        const today = new Date();
        const dayNames = Utils.getDayNames();
        const hours = Array.from({length:16}, (_, i) => i + 6); // 6:00 - 21:00

        let html = '<div class="calendar-week"><div class="cal-week-header"><div class="cal-week-corner"></div>';
        for (let d = 0; d < 7; d++) {
            const date = new Date(start);
            date.setDate(date.getDate() + d);
            const isToday = Utils.isSameDay(date, today);
            html += `<div class="cal-week-day-header ${isToday ? 'today' : ''}">
                <div class="cal-week-day-name">${dayNames[d]}</div>
                <div class="cal-week-day-num">${date.getDate()}</div>
            </div>`;
        }
        html += '</div><div class="cal-week-body">';

        hours.forEach(h => {
            html += `<div class="cal-time-slot">${String(h).padStart(2,'0')}:00</div>`;
            for (let d = 0; d < 7; d++) {
                const date = new Date(start);
                date.setDate(date.getDate() + d);
                const dateStr = Utils.toISODate(date);
                html += `<div class="cal-week-cell" data-date="${dateStr}" data-hour="${h}"></div>`;
            }
        });

        html += '</div></div>';
        container.innerHTML = html;

        // Place events
        for (let d = 0; d < 7; d++) {
            const date = new Date(start);
            date.setDate(date.getDate() + d);
            const dateStr = Utils.toISODate(date);
            const tasks = getTasksForDate(dateStr);
            tasks.forEach(t => {
                const hour = parseInt(t.time.split(':')[0]);
                const cell = container.querySelector(`.cal-week-cell[data-date="${dateStr}"][data-hour="${hour}"]`);
                if (cell) {
                    const cls = t.type === 'meeting' ? 'meeting' : `priority-${t.priority}`;
                    const el = document.createElement('div');
                    el.className = `cal-event ${cls}`;
                    el.textContent = `${t.time} ${t.name}`;
                    el.dataset.taskId = t.id;
                    el.draggable = true;
                    el.style.position = 'relative';
                    cell.appendChild(el);
                }
            });
        }
        bindDragDrop();
        bindCellClicks();
    }

    /* ========================
       DAY VIEW (simplified)
       ======================== */
    function renderDay(container) {
        const dateStr = Utils.toISODate(currentDate);
        const hours = Array.from({length:18}, (_, i) => i + 5); // 5:00 - 22:00
        const tasks = getTasksForDate(dateStr);

        let html = '<div class="calendar-day"><div class="cal-day-time-col">';
        hours.forEach(h => { html += `<div class="cal-day-time">${String(h).padStart(2,'0')}:00</div>`; });
        html += '</div><div class="cal-day-content-col">';
        hours.forEach(h => { html += `<div class="cal-day-slot" data-date="${dateStr}" data-hour="${h}"></div>`; });

        // Place events
        tasks.forEach(t => {
            const hour = parseInt(t.time.split(':')[0]);
            const min = parseInt(t.time.split(':')[1] || 0);
            const topOffset = (hour - 5) * 60 + min;
            const duration = t.duration || 30;
            const cls = t.type === 'meeting' ? 'background:rgba(96,165,250,0.3);color:var(--info);border-left:3px solid var(--info)' :
                         `background:rgba(86,65,255,0.15);color:var(--accent-primary);border-left:3px solid var(--accent-primary)`;
            html += `<div class="cal-day-event" style="top:${topOffset}px;height:${duration}px;${cls}" data-task-id="${t.id}">
                <strong>${t.time}</strong> ${Utils.escapeHtml(t.name)}
            </div>`;
        });

        html += '</div></div>';
        container.innerHTML = html;
        bindDragDrop();
        bindCellClicks();
    }

    /* ========================
       DRAG & DROP
       ======================== */
    function bindDragDrop() {
        document.querySelectorAll('.cal-event[draggable="true"]').forEach(el => {
            el.addEventListener('dragstart', e => {
                draggedTaskId = el.dataset.taskId;
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                draggedTaskId = null;
                document.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
            });
        });

        const dropTargets = document.querySelectorAll('.cal-day-cell, .cal-week-cell, .cal-day-slot');
        dropTargets.forEach(cell => {
            cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
            cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
            cell.addEventListener('drop', e => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                if (!draggedTaskId) return;
                const newDate = cell.dataset.date;
                if (newDate) {
                    Store.updateTask(draggedTaskId, { date: newDate });
                    Toast.info('📅', I18n.getLang() === 'lv' ? 'Uzdevums pārvietots' : 'Task moved');
                    renderView();
                }
            });
        });
    }

    function bindCellClicks() {
        document.querySelectorAll('.cal-day-cell, .cal-week-cell, .cal-day-slot').forEach(cell => {
            cell.addEventListener('dblclick', () => {
                const date = cell.dataset.date;
                if (date) Tasks.openModal(null, date);
            });
        });

        document.querySelectorAll('.cal-event, .cal-day-event').forEach(ev => {
            ev.addEventListener('click', e => {
                e.stopPropagation();
                const taskId = ev.dataset.taskId;
                if (taskId) Tasks.openModal(taskId);
            });
        });
    }

    return { renderPage };
})();
