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
        const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

        const today = Utils.toISODate(new Date());
        const weekLater = Utils.toISODate(new Date(Date.now() + 7 * 86400000));
        const upcoming = tasks
            .filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.date >= today && t.date <= weekLater)
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
            .slice(0, 5);

        const recentProjects = projects.filter(p => p.status === 'active').slice(0, 4);
        const info = Achievements.getLevel(user.xp || 0);
        const xpPct = Math.round((info.currentXp / info.neededXp) * 100);

        const hour = new Date().getHours();
        const greeting = hour < 12
            ? (I18n.getLang() === 'lv' ? 'Labrīt' : 'Good morning')
            : hour < 17
                ? (I18n.getLang() === 'lv' ? 'Labdien' : 'Good afternoon')
                : (I18n.getLang() === 'lv' ? 'Labvakar' : 'Good evening');

        page.innerHTML = `
            <div class="site-page site-page-dashboard">
            <span class="page-eyebrow">${I18n.getLang() === 'lv' ? 'Vadības centrs' : 'Command Center'}</span>
            <!-- ═══ HERO BANNER ═══ -->
            <div class="dash-hero">
                <div class="dash-hero-text">
                    <p class="dash-greeting">${greeting} 👋</p>
                    <h1 class="dash-name">${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</h1>
                    <p class="dash-subtitle">${I18n.getLang() === 'lv'
                        ? `Jums ir <strong>${inProgress}</strong> aktīvs uzdevums un <strong>${upcoming.length}</strong> termiņš šonedēļ.`
                        : `You have <strong>${inProgress}</strong> active task${inProgress !== 1 ? 's' : ''} and <strong>${upcoming.length}</strong> deadline${upcoming.length !== 1 ? 's' : ''} this week.`
                    }</p>
                </div>
                <div class="dash-hero-right">
                    <div class="dash-xp-card">
                        <div class="dash-xp-top">
                            <span class="dash-level-badge">Lvl ${info.level}</span>
                            <span class="dash-xp-total">${user.xp || 0} XP</span>
                        </div>
                        <div class="dash-xp-label">${I18n.getLang() === 'lv' ? 'Līdz nākamajam līmenim' : 'To next level'}</div>
                        <div class="dash-xp-bar"><div class="dash-xp-fill" style="width:${xpPct}%"></div></div>
                        <div class="dash-xp-sub">${info.currentXp} / ${info.neededXp} XP</div>
                    </div>
                </div>
            </div>

            <!-- ═══ STATS ROW ═══ -->
            <div class="dash-stats">
                <div class="dash-stat">
                    <div class="dash-stat-icon blue">📋</div>
                    <div class="dash-stat-body">
                        <div class="dash-stat-value">${tasks.length}</div>
                        <div class="dash-stat-label">${I18n.t('dashboard.totalTasks')}</div>
                    </div>
                    <div class="dash-stat-trend">${tasks.length > 0 ? '↑' : '—'}</div>
                </div>
                <div class="dash-stat">
                    <div class="dash-stat-icon green">✅</div>
                    <div class="dash-stat-body">
                        <div class="dash-stat-value">${completed}</div>
                        <div class="dash-stat-label">${I18n.t('dashboard.completed')}</div>
                    </div>
                    <div class="dash-stat-rate">${completionRate}%</div>
                </div>
                <div class="dash-stat">
                    <div class="dash-stat-icon orange">⏳</div>
                    <div class="dash-stat-body">
                        <div class="dash-stat-value">${inProgress}</div>
                        <div class="dash-stat-label">${I18n.t('dashboard.inProgress')}</div>
                    </div>
                </div>
                <div class="dash-stat">
                    <div class="dash-stat-icon purple">⏱️</div>
                    <div class="dash-stat-body">
                        <div class="dash-stat-value">${totalFocusMin}</div>
                        <div class="dash-stat-label">${I18n.t('dashboard.focusTime')} (${I18n.t('dashboard.min')})</div>
                    </div>
                </div>
            </div>

            <!-- ═══ MAIN BENTO GRID ═══ -->
            <div class="dash-bento">

                <!-- Upcoming Tasks — wide panel -->
                <div class="dash-panel dash-panel-tasks">
                    <div class="dash-panel-header">
                        <div class="dash-panel-title">
                            <span class="dash-panel-icon">📅</span>
                            ${I18n.t('dashboard.upcomingTasks')}
                        </div>
                        <a class="dash-see-all" data-page="tasks">${I18n.t('dashboard.viewAll')} →</a>
                    </div>
                    <div class="dash-task-list">
                        ${upcoming.length === 0 ? `
                            <div class="dash-empty">
                                <span class="dash-empty-icon">📭</span>
                                <span>${I18n.t('dashboard.noTasks')}</span>
                            </div>
                        ` : upcoming.map(t => Tasks.renderTaskCard(t)).join('')}
                    </div>
                </div>

                <!-- Quote card -->
                <div class="dash-panel dash-panel-quote">
                    <div class="dash-panel-header">
                        <div class="dash-panel-title">
                            <span class="dash-panel-icon">💬</span>
                            ${I18n.t('dashboard.quote')}
                        </div>
                    </div>
                    <div id="dashboard-quote"></div>
                </div>

                <!-- Projects panel -->
                <div class="dash-panel dash-panel-projects">
                    <div class="dash-panel-header">
                        <div class="dash-panel-title">
                            <span class="dash-panel-icon">📁</span>
                            ${I18n.t('dashboard.recentProjects')}
                        </div>
                        <a class="dash-see-all" data-page="projects">${I18n.t('dashboard.viewAll')} →</a>
                    </div>
                    <div class="dash-project-list">
                        ${recentProjects.length === 0 ? `
                            <div class="dash-empty">
                                <span class="dash-empty-icon">📂</span>
                                <span>${I18n.getLang() === 'lv' ? 'Nav aktīvu projektu' : 'No active projects'}</span>
                            </div>
                        ` : recentProjects.map(p => {
                            const pTasks = tasks.filter(t => t.projectId === p.id);
                            const pDone = pTasks.filter(t => t.status === 'completed').length;
                            const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                            return `
                                <div class="dash-project-row" data-goto-project="${p.id}">
                                    <div class="dash-project-icon" style="background:${p.color}22">${p.icon}</div>
                                    <div class="dash-project-info">
                                        <div class="dash-project-name">${Utils.escapeHtml(p.name)}</div>
                                        <div class="dash-project-bar">
                                            <div class="dash-project-fill" style="width:${pct}%;background:${p.color}"></div>
                                        </div>
                                    </div>
                                    <div class="dash-project-pct" style="color:${p.color}">${pct}%</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Streak / quick info widget -->
                <div class="dash-panel dash-panel-streak">
                    <div class="dash-panel-header">
                        <div class="dash-panel-title">
                            <span class="dash-panel-icon">🔥</span>
                            ${I18n.getLang() === 'lv' ? 'Aktivitāte' : 'Activity'}
                        </div>
                    </div>
                    <div class="dash-streak-body">
                        <div class="dash-streak-num">${user.streak || 0}</div>
                        <div class="dash-streak-label">${I18n.getLang() === 'lv' ? 'dienu sērija' : 'day streak'}</div>
                        <div class="dash-streak-divider"></div>
                        <div class="dash-streak-row">
                            <span>${I18n.getLang() === 'lv' ? 'Projekti' : 'Projects'}</span>
                            <strong>${projects.length}</strong>
                        </div>
                        <div class="dash-streak-row">
                            <span>${I18n.getLang() === 'lv' ? 'Sesijas' : 'Sessions'}</span>
                            <strong>${sessions.length}</strong>
                        </div>
                        <div class="dash-streak-row">
                            <span>${I18n.getLang() === 'lv' ? 'Sasniegumi' : 'Achievements'}</span>
                            <strong>${Store.getUserAchievements(user.id).length}</strong>
                        </div>
                    </div>
                </div>

            </div>
            </div>
        `;

        Quotes.renderQuoteCard('dashboard-quote');
        Quotes.startRotation();
        bindEvents();
    }

    function bindEvents() {
        document.querySelectorAll('.dash-see-all[data-page]').forEach(a => {
            a.addEventListener('click', () => window.location.href = a.dataset.page + '.html');
        });
        document.querySelectorAll('[data-goto-project]').forEach(el => {
            el.addEventListener('click', () => { window.location.href = 'projects.html'; });
        });
        document.querySelectorAll('#dashboard-page .task-card-checkbox').forEach(cb => {
            cb.addEventListener('click', e => {
                e.stopPropagation();
                if (App.isGuestUser()) return App.requireAccount();
                const taskId = cb.dataset.taskId;
                const task = Store.getTaskById(taskId);
                if (task && task.status !== 'completed') {
                    Store.updateTask(taskId, { status: 'completed', completedAt: new Date().toISOString() });
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
