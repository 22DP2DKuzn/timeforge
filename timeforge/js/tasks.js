/* ============================================
   TimeForge — Tasks
   CRUD, filter, search, complete toggle, meetings
   ============================================ */

const Tasks = (() => {
    let filters = { priority:'all', status:'all', project:'all', category:'all', dateFrom:'', dateTo:'', search:'' };

    /** Render tasks page */
    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('tasks-page');
        const projects = Store.getProjects(user.id);

        let html = `
            <div class="page-header">
                <h1>${I18n.t('tasks.title')}</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary ripple" id="new-task-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        ${I18n.t('tasks.new')}
                    </button>
                </div>
            </div>
            <!-- Filters -->
            <div class="filter-bar">
                <select id="filter-priority">
                    <option value="all">${I18n.t('tasks.filterPriority')}</option>
                    <option value="low">${I18n.t('tasks.low')}</option>
                    <option value="medium">${I18n.t('tasks.medium')}</option>
                    <option value="high">${I18n.t('tasks.high')}</option>
                    <option value="critical">${I18n.t('tasks.critical')}</option>
                </select>
                <select id="filter-status">
                    <option value="all">${I18n.t('tasks.filterStatus')}</option>
                    <option value="planned">${I18n.t('tasks.planned')}</option>
                    <option value="inProgress">${I18n.t('tasks.inProgress')}</option>
                    <option value="completed">${I18n.t('tasks.completed')}</option>
                    <option value="cancelled">${I18n.t('tasks.cancelled')}</option>
                </select>
                <select id="filter-project">
                    <option value="all">${I18n.t('tasks.filterProject')}</option>
                    ${projects.map(p => `<option value="${p.id}">${Utils.escapeHtml(p.name)}</option>`).join('')}
                </select>
                <select id="filter-category">
                    <option value="all">${I18n.t('tasks.filterCategory')}</option>
                    <option value="work">${I18n.t('tasks.work')}</option>
                    <option value="personal">${I18n.t('tasks.personal')}</option>
                    <option value="study">${I18n.t('tasks.study')}</option>
                    <option value="health">${I18n.t('tasks.health')}</option>
                    <option value="other">${I18n.t('tasks.other')}</option>
                </select>
                <input type="date" id="filter-date-from" title="${I18n.t('tasks.filterDateFrom')}">
                <input type="date" id="filter-date-to" title="${I18n.t('tasks.filterDateTo')}">
            </div>
            <div id="tasks-list"></div>
        `;

        page.innerHTML = html;
        renderTaskList();
        bindPageEvents();
    }

    /** Render filtered task list */
    function renderTaskList() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const container = document.getElementById('tasks-list');
        if (!container) return;

        let tasks = Store.getTasks(user.id);

        // Apply filters
        if (filters.priority !== 'all') tasks = tasks.filter(t => t.priority === filters.priority);
        if (filters.status !== 'all') tasks = tasks.filter(t => t.status === filters.status);
        if (filters.project !== 'all') tasks = tasks.filter(t => t.projectId === filters.project);
        if (filters.category !== 'all') tasks = tasks.filter(t => t.category === filters.category);
        if (filters.dateFrom) tasks = tasks.filter(t => t.date >= filters.dateFrom);
        if (filters.dateTo) tasks = tasks.filter(t => t.date <= filters.dateTo);
        if (filters.search) {
            const s = filters.search.toLowerCase();
            tasks = tasks.filter(t => t.name.toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s));
        }

        // Sort: incomplete first, then by date
        tasks.sort((a,b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (b.status === 'completed' && a.status !== 'completed') return -1;
            return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
        });

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>${I18n.t('tasks.noTasks')}</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="content-grid">' + tasks.map(t => renderTaskCard(t)).join('') + '</div>';
        bindTaskCardEvents();
    }

    /** Render single task card HTML */
    function renderTaskCard(task) {
        const project = task.projectId ? Store.getProjectById(task.projectId) : null;
        const isComplete = task.status === 'completed';
        const priorityLabel = I18n.t('tasks.' + task.priority);
        const statusKey = task.status === 'planned' ? 'tasks.planned' :
                         task.status === 'inProgress' ? 'tasks.inProgress' :
                         task.status === 'completed' ? 'tasks.completed' : 'tasks.cancelled';

        return `
            <div class="task-card ${isComplete ? 'completed' : ''}" data-priority="${task.priority}" data-task-id="${task.id}">
                <div class="task-card-header">
                    <span class="task-card-title">${task.type === 'meeting' ? '📅 ' : ''}${Utils.escapeHtml(task.name)}</span>
                    <div class="task-card-checkbox ${isComplete ? 'checked' : ''}" data-task-id="${task.id}" title="${I18n.t('tasks.markComplete')}"></div>
                </div>
                ${task.description ? `<div class="task-card-desc">${Utils.escapeHtml(task.description)}</div>` : ''}
                <div class="task-card-meta">
                    <span class="task-tag tag-priority-${task.priority}">${priorityLabel}</span>
                    <span class="task-tag tag-status-${task.status === 'inProgress' ? 'progress' : task.status}">${I18n.t(statusKey)}</span>
                    ${project ? `<span class="task-tag" style="background:${project.color}22;color:${project.color}">${Utils.escapeHtml(project.name)}</span>` : ''}
                    <span class="task-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${Utils.formatDate(task.date)} ${task.time}
                    </span>
                </div>
            </div>
        `;
    }

    function bindPageEvents() {
        document.getElementById('new-task-btn')?.addEventListener('click', () => openModal());
        document.querySelectorAll('#tasks-page .ripple').forEach(b => b.addEventListener('click', Utils.createRipple));

        // Filter change handlers
        ['filter-priority','filter-status','filter-project','filter-category'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', e => {
                const key = id.replace('filter-','');
                filters[key] = e.target.value;
                renderTaskList();
            });
        });
        document.getElementById('filter-date-from')?.addEventListener('change', e => { filters.dateFrom = e.target.value; renderTaskList(); });
        document.getElementById('filter-date-to')?.addEventListener('change', e => { filters.dateTo = e.target.value; renderTaskList(); });
    }

    function bindTaskCardEvents() {
        // Checkbox toggle
        document.querySelectorAll('.task-card-checkbox').forEach(cb => {
            cb.addEventListener('click', e => {
                e.stopPropagation();
                const taskId = cb.dataset.taskId;
                const task = Store.getTaskById(taskId);
                if (!task) return;

                if (task.status !== 'completed') {
                    Store.updateTask(taskId, { status:'completed', completedAt: new Date().toISOString() });
                    cb.classList.add('checked');
                    cb.closest('.task-card').classList.add('completed');
                    // Confetti + check animation
                    Confetti.fire(40);
                    cb.style.animation = 'checkPop 0.4s ease';
                    Toast.success('✅', I18n.t('tasks.completed'));
                    Achievements.checkAll(Store.getCurrentUser());
                } else {
                    Store.updateTask(taskId, { status:'planned', completedAt: null });
                    cb.classList.remove('checked');
                    cb.closest('.task-card').classList.remove('completed');
                }
                // Refresh after short delay
                setTimeout(renderTaskList, 500);
            });
        });

        // Card click -> edit
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => openModal(card.dataset.taskId));
        });
    }

    /** Open create/edit task modal */
    function openModal(editId, presetDate) {
        const user = Store.getCurrentUser();
        const task = editId ? Store.getTaskById(editId) : null;
        const isEdit = !!task;
        const projects = Store.getProjects(user.id);
        const title = isEdit ? I18n.t('tasks.edit') : I18n.t('tasks.new');

        const selOpt = (val, current) => val === current ? 'selected' : '';

        const html = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" id="modal-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="modal-body">
                <form class="modal-form" id="task-form">
                    <div class="form-group">
                        <label>${I18n.t('tasks.name')} *</label>
                        <input type="text" id="tf-name" required value="${isEdit ? Utils.escapeHtml(task.name) : ''}">
                    </div>
                    <div class="form-group">
                        <label>${I18n.t('tasks.description')}</label>
                        <textarea id="tf-desc">${isEdit ? Utils.escapeHtml(task.description) : ''}</textarea>
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label>${I18n.t('tasks.type')}</label>
                            <select id="tf-type">
                                <option value="task" ${isEdit ? selOpt('task', task.type) : ''}>${I18n.t('tasks.task')}</option>
                                <option value="meeting" ${isEdit ? selOpt('meeting', task.type) : ''}>${I18n.t('tasks.meeting')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${I18n.t('tasks.project')}</label>
                            <select id="tf-project">
                                <option value="">${I18n.t('tasks.none')}</option>
                                ${projects.map(p => `<option value="${p.id}" ${isEdit && task.projectId === p.id ? 'selected' : ''}>${Utils.escapeHtml(p.name)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label>${I18n.t('tasks.date')} *</label>
                            <input type="date" id="tf-date" required value="${isEdit ? task.date : (presetDate || Utils.toISODate(new Date()))}">
                        </div>
                        <div class="form-group">
                            <label>${I18n.t('tasks.time')} *</label>
                            <input type="time" id="tf-time" required value="${isEdit ? task.time : '09:00'}">
                        </div>
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label>${I18n.t('tasks.duration')}</label>
                            <input type="number" id="tf-duration" min="5" value="${isEdit ? task.duration : 30}">
                        </div>
                        <div class="form-group">
                            <label>${I18n.t('tasks.priority')}</label>
                            <select id="tf-priority">
                                <option value="low" ${isEdit ? selOpt('low', task.priority) : ''}>${I18n.t('tasks.low')}</option>
                                <option value="medium" ${isEdit ? selOpt('medium', task.priority) : 'selected'}>${I18n.t('tasks.medium')}</option>
                                <option value="high" ${isEdit ? selOpt('high', task.priority) : ''}>${I18n.t('tasks.high')}</option>
                                <option value="critical" ${isEdit ? selOpt('critical', task.priority) : ''}>${I18n.t('tasks.critical')}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label>${I18n.t('tasks.category')}</label>
                            <select id="tf-category">
                                <option value="work" ${isEdit ? selOpt('work', task.category) : ''}>${I18n.t('tasks.work')}</option>
                                <option value="personal" ${isEdit ? selOpt('personal', task.category) : ''}>${I18n.t('tasks.personal')}</option>
                                <option value="study" ${isEdit ? selOpt('study', task.category) : ''}>${I18n.t('tasks.study')}</option>
                                <option value="health" ${isEdit ? selOpt('health', task.category) : ''}>${I18n.t('tasks.health')}</option>
                                <option value="other" ${isEdit ? selOpt('other', task.category) : ''}>${I18n.t('tasks.other')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${I18n.t('tasks.status')}</label>
                            <select id="tf-status">
                                <option value="planned" ${isEdit ? selOpt('planned', task.status) : ''}>${I18n.t('tasks.planned')}</option>
                                <option value="inProgress" ${isEdit ? selOpt('inProgress', task.status) : ''}>${I18n.t('tasks.inProgress')}</option>
                                <option value="completed" ${isEdit ? selOpt('completed', task.status) : ''}>${I18n.t('tasks.completed')}</option>
                                <option value="cancelled" ${isEdit ? selOpt('cancelled', task.status) : ''}>${I18n.t('tasks.cancelled')}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" id="tf-location-group" style="display:none">
                        <label>${I18n.t('tasks.location')}</label>
                        <input type="text" id="tf-location" value="${isEdit ? Utils.escapeHtml(task.location || '') : ''}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                ${isEdit ? `<button class="btn btn-danger" id="modal-delete-btn">${I18n.t('common.delete')}</button>` : ''}
                <button class="btn btn-secondary" id="modal-cancel-btn">${I18n.t('common.cancel')}</button>
                <button class="btn btn-primary ripple" id="modal-save-btn">${I18n.t('common.save')}</button>
            </div>
        `;

        App.openModal(html);

        // Show location for meetings
        const typeSelect = document.getElementById('tf-type');
        const locationGroup = document.getElementById('tf-location-group');
        const showLocation = () => { locationGroup.style.display = typeSelect.value === 'meeting' ? 'flex' : 'none'; };
        typeSelect.addEventListener('change', showLocation);
        showLocation();

        // Save
        document.getElementById('modal-save-btn').addEventListener('click', () => {
            const name = document.getElementById('tf-name').value.trim();
            const date = document.getElementById('tf-date').value;
            const time = document.getElementById('tf-time').value;
            if (!name || !date || !time) { Toast.error(I18n.t('common.error'), I18n.t('error.fillRequired')); return; }

            const data = {
                name, date, time,
                description: document.getElementById('tf-desc').value.trim(),
                type: document.getElementById('tf-type').value,
                projectId: document.getElementById('tf-project').value || null,
                duration: parseInt(document.getElementById('tf-duration').value) || 30,
                priority: document.getElementById('tf-priority').value,
                category: document.getElementById('tf-category').value,
                status: document.getElementById('tf-status').value,
                location: document.getElementById('tf-location').value.trim(),
            };

            if (data.status === 'completed' && (!isEdit || task.status !== 'completed')) {
                data.completedAt = new Date().toISOString();
            }

            if (isEdit) {
                Store.updateTask(editId, data);
                Toast.success(I18n.t('common.success'), I18n.t('tasks.edit'));
            } else {
                data.userId = user.id;
                Store.createTask(data);
                Toast.success(I18n.t('common.success'), I18n.t('tasks.new'));
                Achievements.checkAll(user);
            }
            App.closeModal();
            renderPage();
        });

        // Delete
        document.getElementById('modal-delete-btn')?.addEventListener('click', () => {
            App.closeModal();
            confirmDelete(editId);
        });

        document.getElementById('modal-cancel-btn').addEventListener('click', () => App.closeModal());
        document.getElementById('modal-close-btn').addEventListener('click', () => App.closeModal());
    }

    function confirmDelete(id) {
        const html = `
            <div class="modal-header"><h2>${I18n.t('common.warning')}</h2>
                <button class="modal-close" id="modal-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="modal-body">
                <div class="confirm-dialog">
                    <div class="confirm-icon">⚠️</div>
                    <h3>${I18n.t('tasks.delete')}</h3>
                    <p>${I18n.t('tasks.deleteConfirm')}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-secondary" id="confirm-no">${I18n.t('common.cancel')}</button>
                        <button class="btn btn-danger" id="confirm-yes">${I18n.t('common.delete')}</button>
                    </div>
                </div>
            </div>`;
        App.openModal(html);
        document.getElementById('confirm-yes').addEventListener('click', () => { Store.deleteTask(id); Toast.success(I18n.t('common.success'), I18n.t('tasks.delete')); App.closeModal(); renderPage(); });
        document.getElementById('confirm-no').addEventListener('click', () => App.closeModal());
        document.getElementById('modal-close-btn').addEventListener('click', () => App.closeModal());
    }

    /** Set search filter from global search */
    function setSearch(term) { filters.search = term; renderTaskList(); }

    return { renderPage, renderTaskCard, openModal, setSearch };
})();
