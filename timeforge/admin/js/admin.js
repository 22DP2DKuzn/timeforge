/* ============================================================
   TimeForge Admin Panel — Main JS
   ============================================================ */

const API = '../api';

const state = {
    user:    null,
    users:   [],
    quotes:  [],
    logs:    [],
    stats:   {},
    section: 'overview',
};

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', init);

async function init() {
    const saved = localStorage.getItem('tf_theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();

    const user = await checkAuth();
    if (!user) return;
    state.user = user;

    const initStr = ((user.firstName?.[0] || 'A') + (user.lastName?.[0] || '')).toUpperCase();
    el('admin-avatar').textContent = initStr;
    el('admin-name').textContent   = user.firstName + ' ' + user.lastName;

    await loadAll();
    showApp();
    bindEvents();
    navigate('overview');
}

async function checkAuth() {
    const json = await apiFetch('GET', `${API}/auth/check.php`);
    if (!json?.ok || json.user?.role !== 'admin') {
        window.location.href = '../index.html';
        return null;
    }
    return json.user;
}

async function loadAll() {
    const [usersRes, quotesRes, statsRes] = await Promise.all([
        apiFetch('GET', `${API}/data/users.php`),
        apiFetch('GET', `${API}/data/quotes.php`),
        apiFetch('GET', `${API}/data/admin_stats.php`),
    ]);
    state.users  = usersRes?.ok  ? usersRes.data   : [];
    state.quotes = quotesRes?.ok ? quotesRes.data   : [];
    state.stats  = statsRes?.ok  ? statsRes.stats   : {};
    state.logs   = statsRes?.ok  ? statsRes.logs    : [];
    updateNavCounts();
    el('last-updated').textContent = 'Updated ' + formatTime(new Date());
}

function showApp() {
    el('loading-screen').remove();
    el('admin-app').classList.remove('hidden');
}

/* ============================================================
   Navigation
   ============================================================ */
function navigate(section) {
    state.section = section;
    document.querySelectorAll('.nav-item[data-section]').forEach(a =>
        a.classList.toggle('active', a.dataset.section === section));
    const labels = { overview: 'Overview', users: 'Users', quotes: 'Quotes', logs: 'Activity Log' };
    el('breadcrumb-current').textContent = labels[section] || section;
    document.querySelectorAll('.section').forEach(s => {
        s.classList.toggle('active', s.id === 'section-' + section);
        s.classList.toggle('hidden',  s.id !== 'section-' + section);
    });
    switch (section) {
        case 'overview': renderOverview(); break;
        case 'users':    renderUsers();    break;
        case 'quotes':   renderQuotes();   break;
        case 'logs':     renderLogs();     break;
    }
}

/* ============================================================
   Overview
   ============================================================ */
function renderOverview() {
    const s = state.stats;
    const cards = [
        { label: 'Total Users',    value: s.totalUsers    || 0, color: '#5641FF', bg: 'rgba(86,65,255,0.12)',   icon: svgUsers() },
        { label: 'Active Users',   value: s.activeUsers   || 0, color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: svgUserCheck() },
        { label: 'Total Tasks',    value: s.totalTasks    || 0, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: svgChecklist() },
        { label: 'Focus Sessions', value: s.focusSessions || 0, color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: svgTimer() },
        { label: 'Quotes',         value: s.totalQuotes   || 0, color: '#FF6CD2', bg: 'rgba(255,108,210,0.12)', icon: svgQuote() },
        { label: 'Blocked',        value: s.blockedUsers  || 0, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   icon: svgBlock() },
    ];
    el('stats-grid').innerHTML = cards.map(c => `
        <div class="stat-card">
            <div class="stat-icon" style="background:${c.bg};color:${c.color}">${c.icon}</div>
            <div class="stat-body">
                <div class="stat-value">${c.value}</div>
                <div class="stat-label">${c.label}</div>
            </div>
        </div>`).join('');

    // Top users by XP (leaderboard)
    const topUsers = [...state.users]
        .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        .slice(0, 6);

    el('recent-users').innerHTML = topUsers.length ? topUsers.map((u, i) => `
        <div class="list-item" style="cursor:pointer" data-uid="${u.id}">
            <div class="leaderboard-rank rank-${i < 3 ? i + 1 : 'other'}">${i + 1}</div>
            <div class="user-avatar-sm">${initials(u)}</div>
            <div class="list-item-info">
                <div class="list-item-name">${esc(u.firstName)} ${esc(u.lastName)}</div>
                <div class="list-item-sub">Lv.${u.level} · ${u.xp} XP · 🔥${u.streak}</div>
            </div>
            <span class="badge badge-${u.role === 'admin' ? 'admin' : 'user'}">${u.role}</span>
        </div>`).join('') : emptyState('No users yet');

    el('recent-users').querySelectorAll('[data-uid]').forEach(row =>
        row.addEventListener('click', () => openUserDetail(row.dataset.uid)));

    // Recent activity
    const recentLogs = state.logs.slice(0, 8);
    el('recent-activity').innerHTML = recentLogs.length ? recentLogs.map(l => `
        <div class="list-item">
            <span class="action-badge action-${actionType(l.action)}">${esc(l.action || '—')}</span>
            <div class="list-item-action">${esc(l.email || String(l.user_id || ''))}</div>
            <span class="list-item-time">${formatRelative(l.created_at)}</span>
        </div>`).join('')
        : `<div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No activity yet. Logs appear here when users interact with the app.</p>
           </div>`;
}

/* ============================================================
   Users
   ============================================================ */
function renderUsers() {
    const search  = (el('users-search')?.value  || '').toLowerCase();
    const roleF   = el('users-role-filter')?.value;
    const statusF = el('users-status-filter')?.value;

    let list = state.users.filter(u => {
        if (search && !`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search)) return false;
        if (roleF   && u.role    !== roleF)               return false;
        if (statusF === 'active'  && u.blocked)           return false;
        if (statusF === 'blocked' && !u.blocked)          return false;
        return true;
    });

    el('users-count-label').textContent = `${list.length} of ${state.users.length} users`;

    if (!list.length) {
        el('users-tbody').innerHTML = `<tr><td colspan="8">${emptyState('No users found')}</td></tr>`;
        return;
    }

    el('users-tbody').innerHTML = list.map(u => {
        const isSelf = u.id === state.user.id;
        const xpNext = u.level * 100;
        const xpPct  = Math.min(100, Math.round((u.xp % xpNext) / xpNext * 100));
        return `
        <tr>
            <td>
                <div class="user-cell" style="cursor:pointer" data-uid="${u.id}">
                    <div class="user-avatar-sm">${initials(u)}</div>
                    <div>
                        <div class="user-cell-name">${esc(u.firstName)} ${esc(u.lastName)}</div>
                        <div class="xp-bar-mini"><div class="xp-fill-mini" style="width:${xpPct}%"></div></div>
                    </div>
                </div>
            </td>
            <td style="color:var(--text2);font-size:0.8rem">${esc(u.email)}</td>
            <td>
                ${isSelf
                    ? `<span class="badge badge-admin">admin</span>`
                    : `<select class="role-select badge badge-${u.role === 'admin' ? 'admin' : 'user'}"
                          data-uid="${u.id}" data-action="role">
                         <option value="user"  ${u.role === 'user'  ? 'selected' : ''}>user</option>
                         <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                       </select>`}
            </td>
            <td>
                <span style="font-weight:600;color:var(--accent)">Lv.${u.level}</span>
                <span style="color:var(--text3);font-size:0.75rem"> · ${u.xp} XP</span>
            </td>
            <td style="color:var(--text2)">🔥 ${u.streak}</td>
            <td><span class="badge badge-${u.blocked ? 'blocked' : 'active'}">${u.blocked ? 'Blocked' : 'Active'}</span></td>
            <td style="color:var(--text3);font-size:0.78rem;white-space:nowrap">${formatDate(u.createdAt)}</td>
            <td>
                <div class="actions-cell">
                    ${isSelf ? '<span style="color:var(--text3);font-size:0.75rem">—</span>' : `
                        <button class="btn btn-sm btn-ghost" data-uid="${u.id}" data-action="block">
                            ${u.blocked ? 'Unblock' : 'Block'}
                        </button>
                        <button class="btn-icon" data-uid="${u.id}" data-action="delete" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                        </button>`}
                </div>
            </td>
        </tr>`;
    }).join('');

    // Bind table events
    el('users-tbody').querySelectorAll('.user-cell[data-uid]').forEach(cell =>
        cell.addEventListener('click', () => openUserDetail(cell.dataset.uid)));
    el('users-tbody').querySelectorAll('[data-action="block"]').forEach(btn =>
        btn.addEventListener('click', () => toggleBlock(btn.dataset.uid)));
    el('users-tbody').querySelectorAll('[data-action="delete"]').forEach(btn =>
        btn.addEventListener('click', () => confirmDelete(btn.dataset.uid)));
    el('users-tbody').querySelectorAll('[data-action="role"]').forEach(sel =>
        sel.addEventListener('change', () => changeRole(sel.dataset.uid, sel.value)));
}

/* --- User Detail Modal --- */
function openUserDetail(uid) {
    const u = state.users.find(u => String(u.id) === String(uid));
    if (!u) return;
    const isSelf   = u.id === state.user.id;
    const xpNext   = u.level * 100;
    const xpPct    = Math.min(100, Math.round((u.xp % xpNext) / xpNext * 100));
    const joinDays  = Math.floor((Date.now() - new Date(u.createdAt)) / 86400000);

    openModal(`
        <div class="modal-header">
            <h2>User Profile</h2>
            <button class="modal-close" id="mc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
            <div class="user-detail-header">
                <div class="user-detail-avatar">${initials(u)}</div>
                <div class="user-detail-info">
                    <h3>${esc(u.firstName)} ${esc(u.lastName)}</h3>
                    <p>${esc(u.email)}</p>
                    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                        <span class="badge badge-${u.role === 'admin' ? 'admin' : 'user'}">${u.role}</span>
                        <span class="badge badge-${u.blocked ? 'blocked' : 'active'}">${u.blocked ? '🔒 Blocked' : '✅ Active'}</span>
                    </div>
                </div>
            </div>
            <div class="user-stats-grid">
                <div class="user-stat">
                    <div class="user-stat-value" style="color:var(--accent)">${u.level}</div>
                    <div class="user-stat-label">Level</div>
                </div>
                <div class="user-stat">
                    <div class="user-stat-value">${u.xp}</div>
                    <div class="user-stat-label">XP Total</div>
                </div>
                <div class="user-stat">
                    <div class="user-stat-value">🔥 ${u.streak}</div>
                    <div class="user-stat-label">Day Streak</div>
                </div>
                <div class="user-stat">
                    <div class="user-stat-value">${joinDays}</div>
                    <div class="user-stat-label">Days Active</div>
                </div>
            </div>
            <div class="xp-section">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.78rem;color:var(--text2)">
                    <span>XP Progress to Lv.${u.level + 1}</span>
                    <span>${u.xp % xpNext} / ${xpNext} XP (${xpPct}%)</span>
                </div>
                <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
            </div>
            <div class="detail-meta">
                <div class="meta-row">
                    <span class="meta-label">Joined</span>
                    <span class="meta-value">${formatDate(u.createdAt)}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Last Active</span>
                    <span class="meta-value">${u.lastActiveDate ? formatDate(u.lastActiveDate) : '—'}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Language</span>
                    <span class="meta-value">${(u.language || 'lv').toUpperCase()}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Timezone</span>
                    <span class="meta-value">${esc(u.timezone || '—')}</span>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" id="mc2">Close</button>
            ${!isSelf ? `
                <button class="btn btn-secondary" id="detail-notify">📢 Send Message</button>
                <button class="btn btn-${u.blocked ? 'secondary' : 'danger'}" id="detail-block">
                    ${u.blocked ? 'Unblock User' : 'Block User'}
                </button>` : ''}
        </div>
    `);

    document.getElementById('mc')?.addEventListener('click', closeModal);
    document.getElementById('mc2')?.addEventListener('click', closeModal);
    document.getElementById('detail-block')?.addEventListener('click', () => {
        closeModal();
        toggleBlock(uid);
    });
    document.getElementById('detail-notify')?.addEventListener('click', () => {
        closeModal();
        openAnnouncementModal(uid);
    });
}

/* --- Block/Unblock --- */
async function toggleBlock(uid) {
    const u = state.users.find(u => String(u.id) === String(uid));
    if (!u) return;
    const blocked = !u.blocked;
    const json = await apiFetch('PATCH', `${API}/data/users.php`, { id: u.id, blocked });
    if (json?.ok) {
        u.blocked = blocked;
        state.stats.activeUsers  = state.users.filter(x => !x.blocked).length;
        state.stats.blockedUsers = state.users.filter(x =>  x.blocked).length;
        if (state.section === 'users') renderUsers();
        else renderOverview();
        toast(blocked ? 'User blocked' : 'User unblocked', blocked ? 'error' : 'success');
    }
}

/* --- Delete --- */
function confirmDelete(uid) {
    const u = state.users.find(u => String(u.id) === String(uid));
    if (!u) return;
    openModal(`
        <div class="modal-header">
            <h2>Delete User</h2>
            <button class="modal-close" id="mc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
            <p style="color:var(--text2);font-size:0.875rem;line-height:1.7">
                Permanently delete <strong style="color:var(--text)">${esc(u.firstName)} ${esc(u.lastName)}</strong>
                (${esc(u.email)})?<br>
                <span style="color:var(--red)">All their tasks, projects and data will be lost.</span>
            </p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-del">Cancel</button>
            <button class="btn btn-danger" id="confirm-del">Delete Permanently</button>
        </div>`);
    document.getElementById('mc')?.addEventListener('click', closeModal);
    document.getElementById('cancel-del')?.addEventListener('click', closeModal);
    document.getElementById('confirm-del')?.addEventListener('click', () => deleteUser(uid));
}

async function deleteUser(uid) {
    const json = await apiFetch('DELETE', `${API}/data/users.php`, { id: parseInt(uid) });
    if (json?.ok) {
        state.users = state.users.filter(u => String(u.id) !== String(uid));
        state.stats.totalUsers   = state.users.length;
        state.stats.activeUsers  = state.users.filter(x => !x.blocked).length;
        state.stats.blockedUsers = state.users.filter(x =>  x.blocked).length;
        updateNavCounts();
        closeModal();
        renderUsers();
        toast('User deleted', 'info');
    }
}

/* --- Change Role --- */
async function changeRole(uid, role) {
    const json = await apiFetch('PATCH', `${API}/data/users.php`, { id: parseInt(uid), role });
    if (json?.ok) {
        const u = state.users.find(u => String(u.id) === String(uid));
        if (u) u.role = role;
        renderUsers();
        toast(`Role changed to ${role}`, 'success');
    }
}

/* --- Export CSV --- */
function exportUsersCSV() {
    const rows = [['ID','First Name','Last Name','Email','Role','Level','XP','Streak','Status','Joined']];
    state.users.forEach(u => rows.push([
        u.id, u.firstName, u.lastName, u.email, u.role,
        u.level, u.xp, u.streak, u.blocked ? 'blocked' : 'active',
        new Date(u.createdAt).toISOString().slice(0,10)
    ]));
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast('CSV exported', 'success');
}

/* ============================================================
   Announcement
   ============================================================ */
function openAnnouncementModal(targetUserId) {
    const userOptions = state.users
        .filter(u => !u.blocked)
        .map(u => `<option value="${u.id}">${esc(u.firstName)} ${esc(u.lastName)} — ${esc(u.email)}</option>`)
        .join('');

    openModal(`
        <div class="modal-header">
            <h2>📢 Send Announcement</h2>
            <button class="modal-close" id="mc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Send to</label>
                <select id="ann-target">
                    <option value="all">📣 All active users (${state.users.filter(u => !u.blocked).length})</option>
                    ${targetUserId
                        ? `<option value="${targetUserId}" selected>${esc(state.users.find(u=>String(u.id)===String(targetUserId))?.firstName || '')} (selected)</option>`
                        : userOptions}
                    ${!targetUserId ? '' : userOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Icon</label>
                <input type="text" id="ann-icon" value="📢" maxlength="4" style="font-size:1.2rem;width:60px;text-align:center">
            </div>
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="ann-title" placeholder="Announcement title…">
            </div>
            <div class="form-group">
                <label>Message *</label>
                <textarea id="ann-message" placeholder="Write your message here…" style="min-height:100px"></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-ann">Cancel</button>
            <button class="btn btn-primary" id="send-ann">Send Announcement</button>
        </div>`);

    document.getElementById('mc')?.addEventListener('click', closeModal);
    document.getElementById('cancel-ann')?.addEventListener('click', closeModal);
    document.getElementById('send-ann')?.addEventListener('click', sendAnnouncement);
}

async function sendAnnouncement() {
    const target  = document.getElementById('ann-target')?.value;
    const icon    = document.getElementById('ann-icon')?.value.trim()   || '📢';
    const title   = document.getElementById('ann-title')?.value.trim();
    const message = document.getElementById('ann-message')?.value.trim();

    if (!title || !message) { toast('Fill in title and message', 'error'); return; }

    const btn = document.getElementById('send-ann');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const json = await apiFetch('POST', `${API}/data/admin_notify.php`, { target, icon, title, message });
    if (json?.ok) {
        closeModal();
        toast(`Sent to ${json.data?.sent ?? 0} user(s)`, 'success');
    } else {
        toast('Failed to send', 'error');
        btn.disabled = false;
        btn.textContent = 'Send Announcement';
    }
}

/* ============================================================
   Quotes
   ============================================================ */
function renderQuotes() {
    const search  = (el('quotes-search')?.value  || '').toLowerCase();
    const statusF = el('quotes-status-filter')?.value;

    let list = state.quotes.filter(q => {
        if (search && !`${q.textLv} ${q.textEn} ${q.author}`.toLowerCase().includes(search)) return false;
        if (statusF === 'active'   && !q.active) return false;
        if (statusF === 'inactive' && q.active)  return false;
        return true;
    });

    el('quotes-count-label').textContent = `${list.length} of ${state.quotes.length} quotes`;

    if (!list.length) {
        el('quotes-tbody').innerHTML = `<tr><td colspan="5">${emptyState('No quotes found')}</td></tr>`;
        return;
    }

    el('quotes-tbody').innerHTML = list.map(q => `
        <tr>
            <td><div class="quote-text" title="${esc(q.textLv)}">${esc(q.textLv)}</div></td>
            <td><div class="quote-text" title="${esc(q.textEn)}">${esc(q.textEn)}</div></td>
            <td style="color:var(--text2);white-space:nowrap">${esc(q.author || '—')}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${q.active ? 'checked' : ''} data-qid="${q.id}" data-action="toggle">
                    <span class="switch-track"></span>
                </label>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon" data-qid="${q.id}" data-action="edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon" data-qid="${q.id}" data-action="delete" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>`).join('');

    el('quotes-tbody').querySelectorAll('[data-action="toggle"]').forEach(cb =>
        cb.addEventListener('change', () => toggleQuote(cb.dataset.qid, cb.checked)));
    el('quotes-tbody').querySelectorAll('[data-action="edit"]').forEach(btn =>
        btn.addEventListener('click', () => openQuoteModal(btn.dataset.qid)));
    el('quotes-tbody').querySelectorAll('[data-action="delete"]').forEach(btn =>
        btn.addEventListener('click', () => deleteQuote(btn.dataset.qid)));
}

async function toggleQuote(qid, active) {
    const q = state.quotes.find(q => q.id === qid);
    if (!q) return;
    const json = await apiFetch('PUT', `${API}/data/quotes.php`, { ...q, active });
    if (json?.ok) { q.active = active; toast(active ? 'Quote activated' : 'Deactivated', 'info'); }
}

function openQuoteModal(editId) {
    const q = editId ? state.quotes.find(x => x.id === editId) : null;
    openModal(`
        <div class="modal-header">
            <h2>${q ? 'Edit Quote' : 'Add Quote'}</h2>
            <button class="modal-close" id="mc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Text (Latvian) *</label>
                <textarea id="qf-lv" placeholder="Teksts latviešu valodā…">${q ? esc(q.textLv) : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Text (English) *</label>
                <textarea id="qf-en" placeholder="Text in English…">${q ? esc(q.textEn) : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Author *</label>
                <input type="text" id="qf-author" placeholder="e.g. Albert Einstein" value="${q ? esc(q.author) : ''}">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-q">Cancel</button>
            <button class="btn btn-primary" id="save-q">${q ? 'Save Changes' : 'Add Quote'}</button>
        </div>`);
    document.getElementById('mc')?.addEventListener('click', closeModal);
    document.getElementById('cancel-q')?.addEventListener('click', closeModal);
    document.getElementById('save-q')?.addEventListener('click', () => saveQuote(editId));
}

async function saveQuote(editId) {
    const lv     = document.getElementById('qf-lv')?.value.trim();
    const en     = document.getElementById('qf-en')?.value.trim();
    const author = document.getElementById('qf-author')?.value.trim();
    if (!lv || !en || !author) { toast('Fill in all fields', 'error'); return; }

    if (editId) {
        const q    = state.quotes.find(x => x.id === editId);
        const json = await apiFetch('PUT', `${API}/data/quotes.php`, { ...q, textLv: lv, textEn: en, author });
        if (json?.ok) { Object.assign(q, { textLv: lv, textEn: en, author }); closeModal(); renderQuotes(); toast('Quote updated', 'success'); }
    } else {
        const newQ = { id: genId(), textLv: lv, textEn: en, author, active: true };
        const json = await apiFetch('POST', `${API}/data/quotes.php`, newQ);
        if (json?.ok) {
            state.quotes.push(newQ);
            state.stats.totalQuotes = state.quotes.length;
            updateNavCounts();
            closeModal(); renderQuotes(); toast('Quote added', 'success');
        }
    }
}

async function deleteQuote(qid) {
    if (!confirm('Delete this quote?')) return;
    const json = await apiFetch('DELETE', `${API}/data/quotes.php`, { id: qid });
    if (json?.ok) {
        state.quotes = state.quotes.filter(q => q.id !== qid);
        state.stats.totalQuotes = state.quotes.length;
        updateNavCounts();
        renderQuotes();
        toast('Quote deleted', 'info');
    }
}

/* ============================================================
   Logs
   ============================================================ */
function renderLogs() {
    const search  = (el('logs-search')?.value  || '').toLowerCase();
    const actionF = el('logs-action-filter')?.value;

    let list = state.logs.filter(l => {
        if (search && !`${l.email || ''} ${l.action || ''} ${l.details || ''}`.toLowerCase().includes(search)) return false;
        if (actionF && !String(l.action || '').toLowerCase().includes(actionF)) return false;
        return true;
    });

    el('logs-count-label').textContent = `${list.length} of ${state.logs.length} entries`;

    if (!list.length) {
        el('logs-tbody').innerHTML = `<tr><td colspan="4">
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                <p>${state.logs.length === 0
                    ? 'No activity logged yet. Logs appear here when users log in, create tasks, start focus sessions, etc.'
                    : 'No entries match your filter.'}</p>
            </div>
        </td></tr>`;
        return;
    }

    el('logs-tbody').innerHTML = list.map(l => `
        <tr>
            <td style="white-space:nowrap;color:var(--text3);font-size:0.78rem">${formatDateTime(l.created_at)}</td>
            <td>
                <div style="font-size:0.82rem">${esc(l.email || String(l.user_id || ''))}</div>
                ${l.first_name ? `<div style="font-size:0.72rem;color:var(--text3)">${esc(l.first_name)} ${esc(l.last_name||'')}</div>` : ''}
            </td>
            <td><span class="action-badge action-${actionType(l.action)}">${esc(l.action||'—')}</span></td>
            <td style="color:var(--text2);font-size:0.8rem;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${esc(l.details||'—')}
            </td>
        </tr>`).join('');
}

/* ============================================================
   Event Bindings
   ============================================================ */
function bindEvents() {
    // Sidebar nav
    document.querySelectorAll('.nav-item[data-section]').forEach(a =>
        a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.section); }));

    // Card links in overview
    document.querySelectorAll('.card-link[data-section]').forEach(a =>
        a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.section); }));

    // Sidebar toggle
    el('sidebar-toggle')?.addEventListener('click', () => {
        const s = el('sidebar');
        if (window.innerWidth <= 768) {
            s.classList.toggle('mobile-open');
            let ov = document.querySelector('.sidebar-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.className = 'sidebar-overlay';
                document.body.appendChild(ov);
                ov.addEventListener('click', () => { s.classList.remove('mobile-open'); ov.classList.remove('show'); });
            }
            ov.classList.toggle('show');
        } else {
            s.classList.toggle('collapsed');
        }
    });

    // Theme
    el('theme-toggle')?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('tf_theme', next);
        updateThemeIcon();
    });

    // Refresh
    el('refresh-btn')?.addEventListener('click', async () => {
        el('refresh-btn').style.opacity = '0.5';
        await loadAll();
        navigate(state.section);
        el('refresh-btn').style.opacity = '';
        toast('Data refreshed', 'success');
    });

    // Topbar search → mirror to section search
    el('topbar-search')?.addEventListener('input', e => {
        const map = { users: 'users-search', quotes: 'quotes-search', logs: 'logs-search' };
        const inp = el(map[state.section]);
        if (inp) inp.value = e.target.value;
        navigate(state.section);
    });

    // Section filters
    ['users-search','users-role-filter','users-status-filter'].forEach(id => {
        el(id)?.addEventListener('input',  () => renderUsers());
        el(id)?.addEventListener('change', () => renderUsers());
    });
    ['quotes-search','quotes-status-filter'].forEach(id => {
        el(id)?.addEventListener('input',  () => renderQuotes());
        el(id)?.addEventListener('change', () => renderQuotes());
    });
    ['logs-search','logs-action-filter'].forEach(id => {
        el(id)?.addEventListener('input',  () => renderLogs());
        el(id)?.addEventListener('change', () => renderLogs());
    });

    // Add quote
    el('add-quote-btn')?.addEventListener('click', () => openQuoteModal(null));

    // Export CSV
    el('export-csv-btn')?.addEventListener('click', exportUsersCSV);

    // Announce button
    el('announce-btn')?.addEventListener('click', () => openAnnouncementModal(null));

    // Modal overlay
    el('modal-overlay')?.addEventListener('click', e => {
        if (e.target === el('modal-overlay')) closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ============================================================
   Modal
   ============================================================ */
function openModal(html) {
    el('modal-box').innerHTML = html;
    el('modal-overlay').classList.remove('hidden');
}
function closeModal() {
    el('modal-overlay').classList.add('hidden');
    el('modal-box').innerHTML = '';
}

/* ============================================================
   Toast
   ============================================================ */
function toast(msg, type = 'info') {
    const icons = {
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<div class="toast-icon">${icons[type]||icons.info}</div><div class="toast-text"><div class="toast-title">${esc(msg)}</div></div>`;
    el('toast-container').appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 220); }, 3000);
}

/* ============================================================
   API Helper
   ============================================================ */
async function apiFetch(method, url, data = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (data) opts.body = JSON.stringify(data);
        return await (await fetch(url, opts)).json();
    } catch { return null; }
}

/* ============================================================
   Helpers
   ============================================================ */
function el(id)     { return document.getElementById(id); }
function esc(s)     { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function initials(u){ return ((u.firstName?.[0]||'')+(u.lastName?.[0]||'')).toUpperCase()||'?'; }
function genId()    { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);}); }
function formatDate(d)     { if(!d)return'—'; return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function formatDateTime(d) { if(!d)return'—'; return new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
function formatTime(d)     { return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }
function formatRelative(d) {
    if (!d) return '';
    const s = (Date.now()-new Date(d))/1000;
    if (s<60) return 'just now'; if (s<3600) return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
}
function actionType(action) {
    const a = String(action||'').toLowerCase();
    if (a.includes('login'))       return 'login';
    if (a.includes('register'))    return 'register';
    if (a.includes('task'))        return 'task';
    if (a.includes('project'))     return 'project';
    if (a.includes('focus'))       return 'focus';
    if (a.includes('achievement')) return 'achievement';
    return 'other';
}
function emptyState(msg) {
    return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg><p>${esc(msg)}</p></div>`;
}
function updateNavCounts() {
    const uc = el('nav-users-count'); const qc = el('nav-quotes-count');
    if (uc) uc.textContent = state.users.length  || '';
    if (qc) qc.textContent = state.quotes.length || '';
}
function updateThemeIcon() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    document.querySelector('.icon-sun')?.classList.toggle('hidden', !dark);
    document.querySelector('.icon-moon')?.classList.toggle('hidden',  dark);
}

/* ============================================================
   SVG Icons
   ============================================================ */
function svgUsers()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function svgUserCheck() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`; }
function svgChecklist() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function svgTimer()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`; }
function svgQuote()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`; }
function svgBlock()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`; }
