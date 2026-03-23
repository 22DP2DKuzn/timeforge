/* ============================================
   TimeForge — Notifications
   List, mark read, badge, auto-deadline check
   ============================================ */

const Notifications = (() => {

    /** Render notifications page */
    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('notifications-page');
        const notifs = Store.getNotifications(user.id);
        const settings = Store.getSettings();

        let html = `
            <div class="page-header">
                <h1>${I18n.t('notifications.title')}</h1>
                <div class="page-header-actions">
                    <button class="btn btn-secondary btn-sm" id="mark-all-read-btn">
                        ${I18n.t('notifications.markAllRead')}
                    </button>
                </div>
            </div>
            <!-- Settings -->
            <div class="card" style="margin-bottom:20px;padding:16px">
                <div class="card-header"><span class="card-title">⚙️ ${I18n.t('notifications.settings')}</span></div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="font-size:0.85rem;color:var(--text-secondary)">${I18n.t('notifications.reminder24h')}</span>
                        <label class="switch"><input type="checkbox" id="ns-24h" ${settings.reminder24h ? 'checked' : ''}><span class="switch-slider"></span></label>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="font-size:0.85rem;color:var(--text-secondary)">${I18n.t('notifications.reminder1h')}</span>
                        <label class="switch"><input type="checkbox" id="ns-1h" ${settings.reminder1h ? 'checked' : ''}><span class="switch-slider"></span></label>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="font-size:0.85rem;color:var(--text-secondary)">${I18n.t('notifications.email')}</span>
                        <label class="switch"><input type="checkbox" id="ns-email" ${settings.emailNotifications ? 'checked' : ''}><span class="switch-slider"></span></label>
                    </div>
                </div>
            </div>
            <!-- Notification List -->
            <div id="notification-list" style="display:flex;flex-direction:column;gap:8px">
        `;

        if (notifs.length === 0) {
            html += `<div class="empty-state"><div class="empty-state-icon">🔔</div><h3>${I18n.t('notifications.noNotifications')}</h3></div>`;
        } else {
            notifs.forEach(n => {
                const iconBg = n.type === 'achievement' ? 'rgba(251,191,36,0.15)' :
                               n.type === 'focus' ? 'rgba(86,65,255,0.15)' :
                               n.type === 'deadline' ? 'rgba(244,63,94,0.15)' : 'rgba(96,165,250,0.15)';
                html += `
                    <div class="notification-card ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                        <div class="notification-icon" style="background:${iconBg}">${n.icon}</div>
                        <div class="notification-body">
                            <div class="notification-title">${Utils.escapeHtml(n.title)}</div>
                            <div class="notification-text">${Utils.escapeHtml(n.message)}</div>
                            <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div>';
        page.innerHTML = html;
        bindEvents();
    }

    function bindEvents() {
        document.getElementById('mark-all-read-btn')?.addEventListener('click', () => {
            const user = Store.getCurrentUser();
            if (!user) return;
            Store.markAllNotificationsRead(user.id);
            renderPage();
            updateBadge();
            Toast.success('✅', I18n.t('notifications.markAllRead'));
        });

        document.querySelectorAll('.notification-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.notifId;
                Store.markNotificationRead(id);
                card.classList.remove('unread');
                updateBadge();
            });
        });

        // Settings toggles
        document.getElementById('ns-24h')?.addEventListener('change', e => Store.updateSettings({ reminder24h: e.target.checked }));
        document.getElementById('ns-1h')?.addEventListener('change', e => Store.updateSettings({ reminder1h: e.target.checked }));
        document.getElementById('ns-email')?.addEventListener('change', e => Store.updateSettings({ emailNotifications: e.target.checked }));
    }

    /** Update notification badge in sidebar and header */
    function updateBadge() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const unread = Store.getNotifications(user.id).filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        const dot = document.getElementById('header-notification-dot');
        if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline' : 'none'; }
        if (dot) dot.classList.toggle('show', unread > 0);
    }

    /** Check for upcoming deadlines and create notifications */
    function checkDeadlines() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const settings = Store.getSettings();
        const now = new Date();
        const tasks = Store.getTasks(user.id).filter(t => t.status !== 'completed' && t.status !== 'cancelled');
        const existing = Store.getNotifications(user.id);

        tasks.forEach(t => {
            const taskTime = new Date(t.date + 'T' + t.time);
            const diff = taskTime - now;
            const hours = diff / 3600000;

            // 24h reminder
            if (settings.reminder24h && hours > 23 && hours <= 24) {
                const alreadyNotified = existing.some(n => n.type === 'deadline' && n.message.includes(t.id) && n.message.includes('24h'));
                if (!alreadyNotified) {
                    Store.createNotification({
                        userId: user.id, type: 'deadline',
                        title: I18n.t('notifications.taskDeadline'),
                        message: `${t.name} — 24h [${t.id}]`,
                        icon: '⏰'
                    });
                }
            }

            // 1h reminder
            if (settings.reminder1h && hours > 0.5 && hours <= 1) {
                const alreadyNotified = existing.some(n => n.type === 'deadline' && n.message.includes(t.id) && n.message.includes('1h'));
                if (!alreadyNotified) {
                    Store.createNotification({
                        userId: user.id, type: t.type === 'meeting' ? 'meeting' : 'deadline',
                        title: t.type === 'meeting' ? I18n.t('notifications.meetingReminder') : I18n.t('notifications.taskDeadline'),
                        message: `${t.name} — 1h [${t.id}]`,
                        icon: t.type === 'meeting' ? '📅' : '⏰'
                    });
                }
            }
        });
        updateBadge();
    }

    return { renderPage, updateBadge, checkDeadlines };
})();
