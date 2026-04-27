/* ============================================
   TimeForge — Analytics
   Task charts, focus stats, time distribution
   Uses simple canvas-based bar/pie charts
   ============================================ */

const Analytics = (() => {

    let period = 'month'; // week | month | year

    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('analytics-page');
        const lang = I18n.getLang();

        const allTasks    = Store.getTasks(user.id);
        const allSessions = Store.getFocusSessions(user.id).filter(s => s.completed && s.type === 'work');
        const completed   = allTasks.filter(t => t.status === 'completed').length;
        const totalFocusH = Math.round(allSessions.reduce((s, f) => s + f.duration, 0) / 3600 * 10) / 10;
        const rate        = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
        const bestStreak  = user.streak || 0;

        page.innerHTML = `
            <div class="site-page site-page-analytics">
            <section class="page-hero">
                <div class="page-hero-main">
                    <span class="page-eyebrow">${lang === 'lv' ? 'Analītika' : 'Insights'}</span>
                    <h1>${I18n.t('analytics.title')}</h1>
                    <p>${lang === 'lv' ? 'Pārskatāmi rādītāji par fokusa laiku, izpildi un darba sadalījumu.' : 'Clear performance reporting for focus time, completion, and work distribution.'}</p>
                </div>
                <div class="page-metrics">
                    <div class="metric-chip"><strong>${completed}</strong><span>${lang === 'lv' ? 'pabeigti' : 'completed'}</span></div>
                    <div class="metric-chip"><strong>${totalFocusH}h</strong><span>${lang === 'lv' ? 'fokuss' : 'focus'}</span></div>
                    <div class="metric-chip"><strong>${rate}%</strong><span>${lang === 'lv' ? 'izpilde' : 'rate'}</span></div>
                    <div class="metric-chip"><strong>${bestStreak}</strong><span>${lang === 'lv' ? 'sērija' : 'streak'}</span></div>
                </div>
            </section>
            <!-- ═══ ANALYTICS HEADER ═══ -->
            <div class="analytics-header">
                <div class="analytics-header-left">
                    <h1>${I18n.t('analytics.title')}</h1>
                    <p class="analytics-subtitle">${lang === 'lv' ? 'Jūsu produktivitātes dati' : 'Your productivity insights'}</p>
                </div>
                <div class="analytics-period-wrap">
                    <label class="analytics-period-label">${lang === 'lv' ? 'Periods:' : 'Period:'}</label>
                    <div class="analytics-period-tabs">
                        <button class="analytics-period-btn ${period==='week'?'active':''}" data-period="week">${I18n.t('analytics.lastWeek')}</button>
                        <button class="analytics-period-btn ${period==='month'?'active':''}" data-period="month">${I18n.t('analytics.lastMonth')}</button>
                        <button class="analytics-period-btn ${period==='year'?'active':''}" data-period="year">${I18n.t('analytics.lastYear')}</button>
                    </div>
                </div>
            </div>

            <!-- ═══ MINI STATS ROW ═══ -->
            <div class="analytics-kpi-row">
                <div class="analytics-kpi">
                    <div class="analytics-kpi-icon" style="background:rgba(86,65,255,0.12);color:#7c6dff">✅</div>
                    <div class="analytics-kpi-body">
                        <div class="analytics-kpi-val">${completed}</div>
                        <div class="analytics-kpi-label">${lang === 'lv' ? 'Pabeigti uzdevumi' : 'Tasks Completed'}</div>
                    </div>
                </div>
                <div class="analytics-kpi">
                    <div class="analytics-kpi-icon" style="background:rgba(255,108,210,0.12);color:#FF6CD2">⏱️</div>
                    <div class="analytics-kpi-body">
                        <div class="analytics-kpi-val">${totalFocusH}h</div>
                        <div class="analytics-kpi-label">${lang === 'lv' ? 'Fokusa laiks' : 'Focus Time'}</div>
                    </div>
                </div>
                <div class="analytics-kpi">
                    <div class="analytics-kpi-icon" style="background:rgba(74,222,128,0.12);color:#4ade80">📈</div>
                    <div class="analytics-kpi-body">
                        <div class="analytics-kpi-val">${rate}%</div>
                        <div class="analytics-kpi-label">${lang === 'lv' ? 'Izpildes līmenis' : 'Completion Rate'}</div>
                    </div>
                </div>
                <div class="analytics-kpi">
                    <div class="analytics-kpi-icon" style="background:rgba(251,146,60,0.12);color:#fb923c">🔥</div>
                    <div class="analytics-kpi-body">
                        <div class="analytics-kpi-val">${bestStreak}</div>
                        <div class="analytics-kpi-label">${lang === 'lv' ? 'Dienu sērija' : 'Day Streak'}</div>
                    </div>
                </div>
            </div>

            <!-- ═══ CHARTS GRID ═══ -->
            <div class="analytics-charts-grid">
                <div class="analytics-chart-card analytics-chart-wide">
                    <div class="analytics-chart-title">
                        <span class="analytics-chart-icon">📊</span>
                        ${I18n.t('analytics.completedTasks')}
                    </div>
                    <canvas id="chart-tasks" height="240"></canvas>
                </div>
                <div class="analytics-chart-card analytics-chart-wide">
                    <div class="analytics-chart-title">
                        <span class="analytics-chart-icon">⏱️</span>
                        ${I18n.t('analytics.focusSessions')}
                    </div>
                    <canvas id="chart-focus" height="240"></canvas>
                </div>
                <div class="analytics-chart-card">
                    <div class="analytics-chart-title">
                        <span class="analytics-chart-icon">📁</span>
                        ${I18n.t('analytics.timeByProject')}
                    </div>
                    <canvas id="chart-projects" height="240"></canvas>
                </div>
                <div class="analytics-chart-card">
                    <div class="analytics-chart-title">
                        <span class="analytics-chart-icon">🏷️</span>
                        ${I18n.t('analytics.timeByCategory')}
                    </div>
                    <canvas id="chart-categories" height="240"></canvas>
                </div>
            </div>
            </div>
        `;

        page.querySelectorAll('.analytics-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                page.querySelectorAll('.analytics-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                period = btn.dataset.period;
                drawCharts(user);
            });
        });

        setTimeout(() => drawCharts(user), 50);
    }

    function getDateRange() {
        const now = new Date();
        let start;
        if (period === 'week') { start = new Date(now); start.setDate(start.getDate() - 7); }
        else if (period === 'month') { start = new Date(now); start.setMonth(start.getMonth() - 1); }
        else { start = new Date(now); start.setFullYear(start.getFullYear() - 1); }
        return { start: Utils.toISODate(start), end: Utils.toISODate(now) };
    }

    function drawCharts(user) {
        const range = getDateRange();
        const tasks = Store.getTasks(user.id).filter(t => t.completedAt && t.completedAt >= range.start);
        const sessions = Store.getFocusSessions(user.id).filter(s => s.completed && s.type === 'work' && s.createdAt >= range.start);

        drawBarChart('chart-tasks', groupByDate(tasks, 'completedAt'), '#5641FF');
        drawBarChart('chart-focus', groupByDate(sessions, 'createdAt'), '#FF6CD2');
        drawPieChart('chart-projects', groupTasksByProject(user, tasks));
        drawPieChart('chart-categories', groupByCategory(tasks));
    }

    function groupByDate(items, dateField) {
        const groups = {};
        items.forEach(item => {
            const d = (item[dateField] || '').substring(0, 10);
            if (d) groups[d] = (groups[d] || 0) + 1;
        });
        // Sort by date
        const sorted = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
        // Limit labels
        const maxBars = period === 'year' ? 12 : (period === 'month' ? 30 : 7);
        return sorted.slice(-maxBars);
    }

    function groupTasksByProject(user, tasks) {
        const projects = Store.getProjects(user.id);
        const groups = {};
        tasks.forEach(t => {
            const p = projects.find(pr => pr.id === t.projectId);
            const name = p ? p.name : (I18n.getLang() === 'lv' ? 'Bez projekta' : 'No project');
            groups[name] = (groups[name] || 0) + 1;
        });
        return Object.entries(groups);
    }

    function groupByCategory(tasks) {
        const groups = {};
        tasks.forEach(t => {
            const cat = I18n.t('tasks.' + t.category) || t.category;
            groups[cat] = (groups[cat] || 0) + 1;
        });
        return Object.entries(groups);
    }

    /* ===== Simple Canvas Bar Chart ===== */
    function drawBarChart(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.parentElement.clientWidth - 40;
        const h = 240;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        if (data.length === 0) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary');
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(I18n.getLang() === 'lv' ? 'Nav datu' : 'No data', w / 2, h / 2);
            return;
        }

        const maxVal = Math.max(...data.map(d => d[1]), 1);
        const barW = Math.max(8, Math.min(40, (w - 60) / data.length - 4));
        const chartH = h - 40;
        const startX = 40;

        // Y axis
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = 10 + (chartH / 4) * i;
            ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(w, y); ctx.stroke();
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary');
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), startX - 6, y + 4);
        }

        // Bars
        const gap = (w - startX) / data.length;
        data.forEach(([label, val], i) => {
            const barH = (val / maxVal) * chartH;
            const x = startX + i * gap + (gap - barW) / 2;
            const y = 10 + chartH - barH;

            // Gradient bar
            const grad = ctx.createLinearGradient(x, y, x, y + barH);
            grad.addColorStop(0, color);
            grad.addColorStop(1, color + '66');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
            ctx.fill();

            // Label
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary');
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center';
            const shortLabel = label.length > 5 ? label.substring(5) : label;
            ctx.fillText(shortLabel, x + barW / 2, h - 4);
        });
    }

    /* ===== Simple Canvas Pie Chart ===== */
    function drawPieChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.parentElement.clientWidth - 40;
        const h = 240;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        if (data.length === 0) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary');
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(I18n.getLang() === 'lv' ? 'Nav datu' : 'No data', w / 2, h / 2);
            return;
        }

        const colors = ['#5641FF','#FF6CD2','#4ade80','#60a5fa','#fb923c','#facc15','#f43f5e','#a78bfa','#34d399'];
        const total = data.reduce((s, d) => s + d[1], 0);
        const cx = w * 0.35;
        const cy = h / 2;
        const r = Math.min(cx - 20, cy - 20, 90);
        let startAngle = -Math.PI / 2;

        data.forEach(([label, val], i) => {
            const slice = (val / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, startAngle + slice);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            startAngle += slice;
        });

        // Donut hole
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
        ctx.fill();

        // Legend
        const legendX = w * 0.65;
        let legendY = 20;
        ctx.textAlign = 'left';
        data.forEach(([label, val], i) => {
            const pct = Math.round((val / total) * 100);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(legendX, legendY, 12, 12);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(`${label} (${pct}%)`, legendX + 18, legendY + 10);
            legendY += 22;
        });
    }

    return { renderPage };
})();
