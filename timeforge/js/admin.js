/* ============================================
   TimeForge — Admin Panel
   Users, Quotes, Achievements, Stats, Logs
   ============================================ */

const Admin = (() => {
    let activeTab = 'users';

    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user || user.role !== 'admin') return;
        const page = document.getElementById('admin-page');

        page.innerHTML = `
            <div class="page-header"><h1>${I18n.t('admin.title')}</h1></div>
            <div class="tabs">
                <button class="tab-btn ${activeTab==='users'?'active':''}" data-tab="users">👥 ${I18n.t('admin.users')}</button>
                <button class="tab-btn ${activeTab==='quotes'?'active':''}" data-tab="quotes">💬 ${I18n.t('admin.quotes')}</button>
                <button class="tab-btn ${activeTab==='stats'?'active':''}" data-tab="stats">📊 ${I18n.t('admin.stats')}</button>
                <button class="tab-btn ${activeTab==='logs'?'active':''}" data-tab="logs">📋 ${I18n.t('admin.logs')}</button>
            </div>
            <div id="admin-content"></div>
        `;

        document.querySelectorAll('#admin-page .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                document.querySelectorAll('#admin-page .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTab();
            });
        });
        renderTab();
    }

    function renderTab() {
        const c = document.getElementById('admin-content');
        if (!c) return;
        switch(activeTab) {
            case 'users': renderUsers(c); break;
            case 'quotes': renderQuotes(c); break;
            case 'stats': renderStats(c); break;
            case 'logs': renderLogs(c); break;
        }
    }

    /* ===== Users Tab ===== */
    function renderUsers(container) {
        const users = Store.getUsers();
        const currentId = Store.getCurrentUser().id;

        let html = `
            <div class="card" style="overflow-x:auto">
                <table class="data-table">
                    <thead><tr>
                        <th>${I18n.t('form.firstName')}</th>
                        <th>${I18n.t('form.lastName')}</th>
                        <th>${I18n.t('form.email')}</th>
                        <th>${I18n.getLang()==='lv' ? 'Loma' : 'Role'}</th>
                        <th>${I18n.getLang()==='lv' ? 'Statuss' : 'Status'}</th>
                        <th>${I18n.getLang()==='lv' ? 'Darbības' : 'Actions'}</th>
                    </tr></thead>
                    <tbody>
        `;

        users.forEach(u => {
            const isSelf = u.id === currentId;
            html += `<tr>
                <td>${Utils.escapeHtml(u.firstName)}</td>
                <td>${Utils.escapeHtml(u.lastName)}</td>
                <td>${Utils.escapeHtml(u.email)}</td>
                <td>
                    <select class="btn btn-sm btn-secondary" data-uid="${u.id}" data-action="role" ${isSelf ? 'disabled' : ''} style="padding:4px 8px;font-size:0.78rem">
                        <option value="user" ${u.role==='user'?'selected':''}>User</option>
                        <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                    </select>
                </td>
                <td><span class="badge ${u.blocked ? 'badge-danger' : 'badge-success'}">${u.blocked ? '🔒' : '✅'}</span></td>
                <td style="display:flex;gap:6px">
                    ${!isSelf ? `
                        <button class="btn btn-sm ${u.blocked ? 'btn-secondary' : 'btn-danger'}" data-uid="${u.id}" data-action="block">
                            ${u.blocked ? I18n.t('admin.unblockUser') : I18n.t('admin.blockUser')}
                        </button>
                        <button class="btn btn-sm btn-danger" data-uid="${u.id}" data-action="delete">🗑️</button>
                    ` : '<span style="color:var(--text-tertiary);font-size:0.8rem">—</span>'}
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        // Bind actions
        container.querySelectorAll('[data-action="block"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const u = Store.getUsers().find(u => u.id === btn.dataset.uid);
                if (u) { Store.updateUser(u.id, { blocked: !u.blocked }); renderUsers(container); }
            });
        });
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm(I18n.t('admin.deleteUser') + '?')) {
                    Store.deleteUser(btn.dataset.uid);
                    Toast.success('✅', I18n.t('admin.deleteUser'));
                    renderUsers(container);
                }
            });
        });
        container.querySelectorAll('[data-action="role"]').forEach(sel => {
            sel.addEventListener('change', e => {
                Store.updateUser(sel.dataset.uid, { role: e.target.value });
                Toast.success('✅', I18n.t('admin.changeRole'));
            });
        });
    }

    /* ===== Quotes Tab ===== */
    function renderQuotes(container) {
        const quotes = Store.getQuotes();
        let html = `
            <div style="margin-bottom:16px">
                <button class="btn btn-primary ripple" id="admin-add-quote">${I18n.t('admin.addQuote')}</button>
            </div>
            <div class="card" style="overflow-x:auto">
                <table class="data-table">
                    <thead><tr><th>LV</th><th>EN</th><th>${I18n.getLang()==='lv'?'Autors':'Author'}</th><th>${I18n.getLang()==='lv'?'Aktīvs':'Active'}</th><th></th></tr></thead>
                    <tbody>
        `;
        quotes.forEach(q => {
            html += `<tr>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${Utils.escapeHtml(q.textLv)}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${Utils.escapeHtml(q.textEn)}</td>
                <td>${Utils.escapeHtml(q.author)}</td>
                <td>
                    <label class="switch"><input type="checkbox" ${q.active?'checked':''} data-qid="${q.id}" data-action="toggle-quote"><span class="switch-slider"></span></label>
                </td>
                <td style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-ghost" data-qid="${q.id}" data-action="edit-quote">✏️</button>
                    <button class="btn btn-sm btn-danger" data-qid="${q.id}" data-action="delete-quote">🗑️</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;

        document.getElementById('admin-add-quote')?.addEventListener('click', () => openQuoteModal(container));
        container.querySelectorAll('[data-action="toggle-quote"]').forEach(cb => {
            cb.addEventListener('change', () => { Store.updateQuote(cb.dataset.qid, { active: cb.checked }); });
        });
        container.querySelectorAll('[data-action="edit-quote"]').forEach(btn => {
            btn.addEventListener('click', () => openQuoteModal(container, btn.dataset.qid));
        });
        container.querySelectorAll('[data-action="delete-quote"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm(I18n.t('admin.deleteQuote') + '?')) {
                    Store.deleteQuote(btn.dataset.qid);
                    Toast.success('✅', I18n.t('admin.deleteQuote'));
                    renderQuotes(container);
                }
            });
        });
    }

    function openQuoteModal(container, editId) {
        const quote = editId ? Store.getQuotes().find(q => q.id === editId) : null;
        const isEdit = !!quote;
        const html = `
            <div class="modal-header">
                <h2>${isEdit ? I18n.t('admin.editQuote') : I18n.t('admin.addQuote')}</h2>
                <button class="modal-close" id="modal-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="modal-body">
                <form class="modal-form" id="quote-form">
                    <div class="form-group"><label>Teksts (LV) *</label><textarea id="qf-lv" required>${isEdit ? Utils.escapeHtml(quote.textLv) : ''}</textarea></div>
                    <div class="form-group"><label>Text (EN) *</label><textarea id="qf-en" required>${isEdit ? Utils.escapeHtml(quote.textEn) : ''}</textarea></div>
                    <div class="form-group"><label>${I18n.getLang()==='lv'?'Autors':'Author'} *</label><input type="text" id="qf-author" required value="${isEdit ? Utils.escapeHtml(quote.author) : ''}"></div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modal-cancel-btn">${I18n.t('common.cancel')}</button>
                <button class="btn btn-primary" id="modal-save-btn">${I18n.t('common.save')}</button>
            </div>`;
        App.openModal(html);
        document.getElementById('modal-save-btn').addEventListener('click', () => {
            const lv = document.getElementById('qf-lv').value.trim();
            const en = document.getElementById('qf-en').value.trim();
            const author = document.getElementById('qf-author').value.trim();
            if (!lv || !en || !author) { Toast.error(I18n.t('common.error'), I18n.t('error.fillRequired')); return; }
            if (isEdit) Store.updateQuote(editId, { textLv: lv, textEn: en, author });
            else Store.createQuote({ textLv: lv, textEn: en, author });
            App.closeModal();
            renderQuotes(container);
            Toast.success('✅', isEdit ? I18n.t('admin.editQuote') : I18n.t('admin.addQuote'));
        });
        document.getElementById('modal-cancel-btn').addEventListener('click', () => App.closeModal());
        document.getElementById('modal-close-btn').addEventListener('click', () => App.closeModal());
    }

    /* ===== Stats Tab ===== */
    function renderStats(container) {
        const users = Store.getUsers();
        const allTasks = Store.getTasks();
        const allSessions = Store.getFocusSessions();
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon blue">👥</div><div class="stat-content"><div class="stat-value">${users.length}</div><div class="stat-label">${I18n.getLang()==='lv'?'Lietotāji':'Users'}</div></div></div>
                <div class="stat-card"><div class="stat-icon green">📋</div><div class="stat-content"><div class="stat-value">${allTasks.length}</div><div class="stat-label">${I18n.getLang()==='lv'?'Kopā uzdevumu':'Total tasks'}</div></div></div>
                <div class="stat-card"><div class="stat-icon purple">⏱️</div><div class="stat-content"><div class="stat-value">${allSessions.filter(s=>s.completed).length}</div><div class="stat-label">${I18n.getLang()==='lv'?'Fokusa sesijas':'Focus sessions'}</div></div></div>
                <div class="stat-card"><div class="stat-icon pink">💬</div><div class="stat-content"><div class="stat-value">${Store.getQuotes().length}</div><div class="stat-label">${I18n.getLang()==='lv'?'Citāti':'Quotes'}</div></div></div>
            </div>
            <div class="card" style="margin-top:16px">
                <div class="card-header"><span class="card-title">${I18n.t('admin.backup')}</span></div>
                <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px">${I18n.getLang()==='lv'?'Lejupielādēt visu datu kopiju':'Download a copy of all data'}</p>
                <button class="btn btn-secondary" id="admin-backup-btn">💾 ${I18n.t('admin.backup')}</button>
            </div>
        `;
        document.getElementById('admin-backup-btn')?.addEventListener('click', () => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('tf_')) data[key] = localStorage.getItem(key);
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `timeforge-backup-${Utils.toISODate(new Date())}.json`;
            a.click();
            Toast.success('💾', I18n.getLang() === 'lv' ? 'Kopija izveidota' : 'Backup created');
        });
    }

    /* ===== Logs Tab ===== */
    function renderLogs(container) {
        const logs = Store.getActivityLog().reverse().slice(0, 100);
        let html = '<div class="card" style="overflow-x:auto"><table class="data-table"><thead><tr><th>Laiks</th><th>Lietotājs</th><th>Darbība</th><th>Detaļas</th></tr></thead><tbody>';
        logs.forEach(l => {
            const u = Store.getUsers().find(u => u.id === l.userId);
            html += `<tr>
                <td style="white-space:nowrap;font-size:0.8rem">${new Date(l.timestamp).toLocaleString()}</td>
                <td>${u ? Utils.escapeHtml(u.email) : l.userId}</td>
                <td><span class="badge badge-info">${l.action}</span></td>
                <td style="font-size:0.8rem;color:var(--text-secondary)">${Utils.escapeHtml(l.details || '')}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    return { renderPage };
})();
