/* ============================================
   TimeForge — Projects
   CRUD, render list, modal forms, status
   ============================================ */

const Projects = (() => {
    const COLORS = ['#5641FF','#FF6CD2','#4ade80','#60a5fa','#fb923c','#facc15','#f43f5e','#a78bfa','#34d399','#fbbf24'];
    const ICONS = ['📁','📊','💼','🎯','🚀','💡','📝','🎨','🔧','📱','🌐','🏠'];

    /** Render projects page */
    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('projects-page');
        const projects = Store.getProjects(user.id);
        const allTasks = Store.getTasks(user.id);
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const avgProgress = projects.length > 0
            ? Math.round(projects.reduce((sum, p) => {
                const tasks = allTasks.filter(t => t.projectId === p.id);
                const completed = tasks.filter(t => t.status === 'completed').length;
                return sum + (tasks.length > 0 ? (completed / tasks.length) * 100 : 0);
            }, 0) / projects.length)
            : 0;

        let html = `
            <div class="site-page site-page-projects">
                <section class="page-hero">
                    <div class="page-hero-main">
                        <span class="page-eyebrow">${I18n.getLang() === 'lv' ? 'Portfelis' : 'Portfolio'}</span>
                        <h1>${I18n.t('projects.title')}</h1>
                        <p>${I18n.getLang() === 'lv'
                            ? 'Sakārtojiet iniciatīvas vienā vietā un pārskatāmi sekojiet progresam, termiņiem un statusiem.'
                            : 'Organize initiatives in one place and track progress, timelines, and delivery status with clarity.'
                        }</p>
                    </div>
                    <div class="page-hero-actions">
                        <button class="btn btn-primary ripple" id="new-project-btn" data-requires-auth="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            ${I18n.t('projects.new')}
                        </button>
                    </div>
                    <div class="page-metrics">
                        <div class="metric-chip"><strong>${projects.length}</strong><span>${I18n.getLang() === 'lv' ? 'kopā' : 'total'}</span></div>
                        <div class="metric-chip"><strong>${activeProjects}</strong><span>${I18n.getLang() === 'lv' ? 'aktīvi' : 'active'}</span></div>
                        <div class="metric-chip"><strong>${completedProjects}</strong><span>${I18n.getLang() === 'lv' ? 'pabeigti' : 'completed'}</span></div>
                        <div class="metric-chip"><strong>${avgProgress}%</strong><span>${I18n.getLang() === 'lv' ? 'vidējais progress' : 'avg. progress'}</span></div>
                    </div>
                </section>
                <section class="section-panel">
                    <div class="section-panel-header">
                        <div>
                            <h2>${I18n.getLang() === 'lv' ? 'Projektu pārskats' : 'Project Overview'}</h2>
                            <p>${I18n.getLang() === 'lv' ? 'Atveriet projektu, lai skatītu saistītos uzdevumus.' : 'Open a project to view its related tasks.'}</p>
                        </div>
                    </div>
        `;

        if (projects.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <h3>${I18n.t('projects.noProjects')}</h3>
                    <p>${I18n.t('projects.create')}</p>
                </div>
            `;
        } else {
            html += '<div class="content-grid">';
            projects.forEach(p => {
                const tasks = allTasks.filter(t => t.projectId === p.id);
                const completed = tasks.filter(t => t.status === 'completed').length;
                const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                const statusKey = p.status === 'active' ? 'projects.active' :
                                  p.status === 'completed' ? 'projects.completed' : 'projects.archived';
                const statusClass = p.status === 'active' ? 'tag-status-progress' :
                                    p.status === 'completed' ? 'tag-status-completed' : 'tag-status-cancelled';

                html += `
                    <div class="project-card" data-project-id="${p.id}">
                        <div class="project-card-icon" style="background:${p.color}22;color:${p.color}">${p.icon}</div>
                        <div class="project-card-title">${Utils.escapeHtml(p.name)}</div>
                        <div class="project-card-desc">${Utils.escapeHtml(p.description)}</div>
                        <div class="project-card-progress">
                            <div class="progress-info">
                                <span>${completed}/${tasks.length} ${I18n.t('projects.tasks')}</span>
                                <span>${pct}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${pct}%;background:${p.color}"></div>
                            </div>
                        </div>
                        <div class="project-card-footer">
                            <span class="task-tag ${statusClass}">${I18n.t(statusKey)}</span>
                            <div style="display:flex;gap:6px">
                                <button class="btn btn-ghost btn-sm edit-project-btn" data-id="${p.id}" data-requires-auth="true" title="${I18n.t('projects.edit')}">✏️</button>
                                <button class="btn btn-ghost btn-sm delete-project-btn" data-id="${p.id}" data-requires-auth="true" title="${I18n.t('projects.delete')}">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        html += `
                </section>
            </div>
        `;

        page.innerHTML = html;
        bindEvents();
    }

    function bindEvents() {
        const newBtn = document.getElementById('new-project-btn');
        if (newBtn) newBtn.addEventListener('click', () => openModal());

        document.querySelectorAll('.edit-project-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openModal(btn.dataset.id);
            });
        });

        document.querySelectorAll('.delete-project-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                confirmDelete(btn.dataset.id);
            });
        });

        // Ripple
        document.querySelectorAll('#projects-page .ripple').forEach(b => b.addEventListener('click', Utils.createRipple));

        // Card click -> show tasks for project
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const pid = card.dataset.projectId;
                window.location.href = `tasks.html?project=${encodeURIComponent(pid)}`;
            });
        });
    }

    /** Open create/edit modal */
    function openModal(editId) {
        if (App.isGuestUser()) return App.requireAccount();
        const project = editId ? Store.getProjectById(editId) : null;
        const isEdit = !!project;
        const title = isEdit ? I18n.t('projects.edit') : I18n.t('projects.new');

        let colorOptions = COLORS.map(c =>
            `<div class="color-option ${project && project.color === c ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
        ).join('');

        let iconOptions = ICONS.map(i =>
            `<div class="icon-option ${project && project.icon === i ? 'selected' : ''}" data-icon="${i}">${i}</div>`
        ).join('');

        const html = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" id="modal-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="modal-body">
                <form class="modal-form" id="project-form">
                    <div class="form-group">
                        <label>${I18n.t('projects.name')} *</label>
                        <input type="text" id="pf-name" required value="${isEdit ? Utils.escapeHtml(project.name) : ''}" placeholder="${I18n.t('projects.name')}">
                    </div>
                    <div class="form-group">
                        <label>${I18n.t('projects.description')}</label>
                        <textarea id="pf-desc" placeholder="${I18n.t('projects.description')}">${isEdit ? Utils.escapeHtml(project.description) : ''}</textarea>
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label>${I18n.t('projects.startDate')}</label>
                            <input type="date" id="pf-start" value="${isEdit ? project.startDate : Utils.toISODate(new Date())}">
                        </div>
                        <div class="form-group">
                            <label>${I18n.t('projects.endDate')}</label>
                            <input type="date" id="pf-end" value="${isEdit ? project.endDate : ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${I18n.t('projects.status')}</label>
                        <select id="pf-status">
                            <option value="active" ${isEdit && project.status === 'active' ? 'selected' : ''}>${I18n.t('projects.active')}</option>
                            <option value="completed" ${isEdit && project.status === 'completed' ? 'selected' : ''}>${I18n.t('projects.completed')}</option>
                            <option value="archived" ${isEdit && project.status === 'archived' ? 'selected' : ''}>${I18n.t('projects.archived')}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${I18n.t('projects.color')}</label>
                        <div class="color-options">${colorOptions}</div>
                        <input type="hidden" id="pf-color" value="${isEdit ? project.color : COLORS[0]}">
                    </div>
                    <div class="form-group">
                        <label>${I18n.t('projects.icon')}</label>
                        <div class="icon-options">${iconOptions}</div>
                        <input type="hidden" id="pf-icon" value="${isEdit ? project.icon : ICONS[0]}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modal-cancel-btn">${I18n.t('common.cancel')}</button>
                <button class="btn btn-primary ripple" id="modal-save-btn">${I18n.t('common.save')}</button>
            </div>
        `;

        App.openModal(html);

        // Color/icon selection
        document.querySelectorAll('.color-option').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
                el.classList.add('selected');
                document.getElementById('pf-color').value = el.dataset.color;
            });
        });
        document.querySelectorAll('.icon-option').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(e => e.classList.remove('selected'));
                el.classList.add('selected');
                document.getElementById('pf-icon').value = el.dataset.icon;
            });
        });

        // Save
        document.getElementById('modal-save-btn').addEventListener('click', () => {
            const name = document.getElementById('pf-name').value.trim();
            if (!name) { Toast.error(I18n.t('common.error'), I18n.t('error.required')); return; }

            const data = {
                name,
                description: document.getElementById('pf-desc').value.trim(),
                startDate: document.getElementById('pf-start').value,
                endDate: document.getElementById('pf-end').value,
                status: document.getElementById('pf-status').value,
                color: document.getElementById('pf-color').value,
                icon: document.getElementById('pf-icon').value,
            };

            if (isEdit) {
                Store.updateProject(editId, data);
                Toast.success(I18n.t('common.success'), I18n.t('projects.edit'));
            } else {
                data.userId = Store.getCurrentUser().id;
                Store.createProject(data);
                Toast.success(I18n.t('common.success'), I18n.t('projects.create'));
                Achievements.checkAll(Store.getCurrentUser());
            }
            App.closeModal();
            renderPage();
        });

        document.getElementById('modal-cancel-btn').addEventListener('click', () => App.closeModal());
        document.getElementById('modal-close-btn').addEventListener('click', () => App.closeModal());
    }

    /** Confirm delete */
    function confirmDelete(id) {
        if (App.isGuestUser()) return App.requireAccount();
        const html = `
            <div class="modal-header">
                <h2>${I18n.t('common.warning')}</h2>
                <button class="modal-close" id="modal-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="modal-body">
                <div class="confirm-dialog">
                    <div class="confirm-icon">⚠️</div>
                    <h3>${I18n.t('projects.delete')}</h3>
                    <p>${I18n.t('projects.deleteConfirm')}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-secondary" id="confirm-no">${I18n.t('common.cancel')}</button>
                        <button class="btn btn-danger" id="confirm-yes">${I18n.t('common.delete')}</button>
                    </div>
                </div>
            </div>
        `;
        App.openModal(html);
        document.getElementById('confirm-yes').addEventListener('click', () => {
            Store.deleteProject(id);
            Toast.success(I18n.t('common.success'), I18n.t('projects.delete'));
            App.closeModal();
            renderPage();
        });
        document.getElementById('confirm-no').addEventListener('click', () => App.closeModal());
        document.getElementById('modal-close-btn').addEventListener('click', () => App.closeModal());
    }

    return { renderPage, COLORS, ICONS };
})();
