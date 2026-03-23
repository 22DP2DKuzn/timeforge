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

        page.innerHTML = `
            <div class="page-header">
                <h1>${I18n.t('analytics.title')}</h1>
                <div class="page-header-actions">
                    <select id="analytics-period" class="btn btn-secondary" style="padding:8px 14px;font-size:0.85rem">
                        <option value="week" ${period==='week'?'selected':''}>${I18n.t('analytics.lastWeek')}</option>
                        <option value="month" ${period==='month'?'selected':''}>${I18n.t('analytics.lastMonth')}</option>
                        <option value="year" ${period==='year'?'selected':''}>${I18n.t('analytics.lastYear')}</option>
                    </select>
                </div>
            </div>
            <div class="two-column">
                <div class="chart-container">
                    <div class="card-header"><span class="card-title">📊 ${I18n.t('analytics.completedTasks')}</span></div>
                    <canvas id="chart-tasks" height="260"></canvas>
                </div>
                <div class="chart-container">
                    <div class="card-header"><span class="card-title">⏱️ ${I18n.t('analytics.focusSessions')}</span></div>
                    <canvas id="chart-focus" height="260"></canvas>
                </div>
            </div>
            <div class="two-column" style="margin-top:20px">
                <div class="chart-container">
                    <div class="card-header"><span class="card-title">📁 ${I18n.t('analytics.timeByProject')}</span></div>
                    <canvas id="chart-projects" height="260"></canvas>
                </div>
                <div class="chart-container">
                    <div class="card-header"><span class="card-title">🏷️ ${I18n.t('analytics.timeByCategory')}</span></div>
                    <canvas id="chart-categories" height="260"></canvas>
                </div>
            </div>
        `;

        document.getElementById('analytics-period').addEventListener('change', e => {
            period = e.target.value;
            drawCharts(user);
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
