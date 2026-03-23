/* ============================================
   TimeForge — Dashboard
   Stats, upcoming tasks, recent projects, quote
   ============================================ */

const Dashboard = (() => {

    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('dashboard-page');
        const tasks = Store.getTasks(user.id);
        const projects = Store.getProjects(user.id);
        const sessions = Store.getFocusSessions(user.id).filter(s => s.type === 'work' && s.completed);
        const totalFocusMin = sessions.reduce((s, f) => s + Math.floor(f.duration / 60), 0);

        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'inProgress').length;

        // Upcoming tasks (next 7 days, not completed)
        const today = Utils.toISODate(new Date());
        const weekLater = Utils.toISODate(new Date(Date.now() + 7 * 86400000));
        const upcoming = tasks
            .filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.date >= today && t.date <= weekLater)
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
            .slice(0, 5);

        const recentProjects = projects.filter(p => p.status === 'active').slice(0, 4);

        page.innerHTML = `
            <div class="page-header">
                <h1>${I18n.t('dashboard.welcome')}, ${Utils.escapeHtml(user.firstName)}! 👋</h1>
            </div>

            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">📋</div>
                    <div class="stat-content">
                        <div class="stat-value">${tasks.length}</div>
                        <div class="stat-label">${I18n.t('dashboard.totalTasks')}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">${completed}</div>
                        <div class="stat-label">${I18n.t('dashboard.completed')}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">⏳</div>
                    <div class="stat-content">
                        <div class="stat-value">${inProgress}</div>
                        <div class="stat-label">${I18n.t('dashboard.inProgress')}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">⏱️</div>
                    <div class="stat-content">
                        <div class="stat-value">${totalFocusMin}</div>
                        <div class="stat-label">${I18n.t('dashboard.focusTime')} (${I18n.t('dashboard.min')})</div>
                    </div>
                </div>
            </div>

            <div class="two-column">
                <!-- Upcoming Tasks -->
                <div>
                    <div class="section-header">
                        <h2>${I18n.t('dashboard.upcomingTasks')}</h2>
                        <a class="see-all" data-page="tasks">${I18n.t('dashboard.viewAll')}</a>
                    </div>
                    <div id="dashboard-upcoming" style="display:flex;flex-direction:column;gap:10px">
                        ${upcoming.length === 0 ? `
                            <div class="empty-state" style="padding:30px">
                                <div class="empty-state-icon">📭</div>
                                <h3>${I18n.t('dashboard.noTasks')}</h3>
                            </div>
                        ` : upcoming.map(t => Tasks.renderTaskCard(t)).join('')}
                    </div>
                </div>

                <!-- Right column: Quote + Recent Projects -->
                <div>
                    <div class="section-header">
                        <h2>${I18n.t('dashboard.quote')}</h2>
                    </div>
                    <div id="dashboard-quote"></div>

                    <div class="section-header" style="margin-top:24px">
                        <h2>${I18n.t('dashboard.recentProjects')}</h2>
                        <a class="see-all" data-page="projects">${I18n.t('dashboard.viewAll')}</a>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:10px">
                        ${recentProjects.map(p => {
                            const pTasks = tasks.filter(t => t.projectId === p.id);
                            const pDone = pTasks.filter(t => t.status === 'completed').length;
                            const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                            return `
                                <div class="card" style="padding:14px;cursor:pointer" data-goto-project="${p.id}">
                                    <div style="display:flex;align-items:center;gap:10px">
                                        <span style="font-size:1.2rem">${p.icon}</span>
                                        <div style="flex:1">
                                            <div style="font-weight:600;font-size:0.9rem">${Utils.escapeHtml(p.name)}</div>
                                            <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${pct}%;background:${p.color}"></div></div>
                                        </div>
                                        <span style="font-size:0.8rem;color:var(--text-tertiary)">${pct}%</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        Quotes.renderQuoteCard('dashboard-quote');
        Quotes.startRotation();
        bindEvents();
    }

    function bindEvents() {
        // See-all links
        document.querySelectorAll('.see-all[data-page]').forEach(a => {
            a.addEventListener('click', () => App.navigateTo(a.dataset.page));
        });

        // Project quick links
        document.querySelectorAll('[data-goto-project]').forEach(el => {
            el.addEventListener('click', () => {
                App.navigateTo('projects');
            });
        });

        // Task card checkboxes on dashboard
        document.querySelectorAll('#dashboard-page .task-card-checkbox').forEach(cb => {
            cb.addEventListener('click', e => {
                e.stopPropagation();
                const taskId = cb.dataset.taskId;
                const task = Store.getTaskById(taskId);
                if (task && task.status !== 'completed') {
                    Store.updateTask(taskId, { status:'completed', completedAt: new Date().toISOString() });
                    Confetti.fire(40);
                    Toast.success('✅', I18n.t('tasks.completed'));
                    Achievements.checkAll(Store.getCurrentUser());
                    setTimeout(renderPage, 500);
                }
            });
        });
    }

    return { renderPage };
})();
