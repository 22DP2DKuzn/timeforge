/* ============================================
   TimeForge — Notifications
   List, mark read, badge, auto-deadline check
   ============================================ */

const Notifications = (() => {

    /** Render notifications page */
    function renderPage() {
        const user     = Store.getCurrentUser();
        if (!user) return;
        const page     = document.getElementById('notifications-page');
        const notifs   = Store.getNotifications(user.id);
        const settings = Store.getSettings();
        const lang     = I18n.getLang();
        const unread   = notifs.filter(n => !n.read).length;

        let notifListHtml = '';
        if (notifs.length === 0) {
            notifListHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔔</div>
                    <h3>${I18n.t('notifications.noNotifications')}</h3>
                    <p>${lang === 'lv' ? 'Jums nav jaunu paziņojumu' : 'You have no new notifications'}</p>
                </div>`;
        } else {
            notifs.forEach(n => {
                const iconBg = n.type === 'achievement' ? 'rgba(251,191,36,0.15)' :
                               n.type === 'focus'       ? 'rgba(86,65,255,0.15)'  :
                               n.type === 'deadline'    ? 'rgba(244,63,94,0.15)'  : 'rgba(96,165,250,0.15)';
                notifListHtml += `
                    <div class="notification-card ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                        <div class="notification-icon" style="background:${iconBg}">${n.icon}</div>
                        <div class="notification-body">
                            <div class="notification-title">${Utils.escapeHtml(n.title)}</div>
                            <div class="notification-text">${Utils.escapeHtml(n.message)}</div>
                            <div class="notification-time">🕐 ${Utils.timeAgo(n.createdAt)}</div>
                        </div>
                        ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
                    </div>`;
            });
        }

        page.innerHTML = `
            <div class="site-page site-page-notifications">
            <section class="page-hero">
                <div class="page-hero-main">
                    <span class="page-eyebrow">${lang === 'lv' ? 'Aktivitāte' : 'Activity'}</span>
                    <h1>${I18n.t('notifications.title')}</h1>
                    <p>${lang === 'lv' ? 'Saņemiet atgādinājumus, sistēmas ziņas un sasniegumu paziņojumus vienotā ieejā.' : 'Track reminders, system messages, and achievement updates in one unified inbox.'}</p>
                </div>
                <div class="page-hero-actions">
                    <button class="btn btn-secondary btn-sm" id="mark-all-read-hero" data-requires-auth="true">
                        ✓ ${I18n.t('notifications.markAllRead')}
                    </button>
                </div>
                <div class="page-metrics">
                    <div class="metric-chip"><strong>${notifs.length}</strong><span>${lang === 'lv' ? 'kopā' : 'total'}</span></div>
                    <div class="metric-chip"><strong>${unread}</strong><span>${lang === 'lv' ? 'nelasīti' : 'unread'}</span></div>
                    <div class="metric-chip"><strong>${notifs.length - unread}</strong><span>${lang === 'lv' ? 'izskatīti' : 'reviewed'}</span></div>
                </div>
            </section>
            <!-- ═══ NOTIFICATIONS HEADER ═══ -->
            <div class="notif-page-header">
                <div class="notif-header-left">
                    <h1>${I18n.t('notifications.title')}</h1>
                    <p class="notif-header-sub">${lang === 'lv' ? 'Jūsu aktivitātes un atgādinājumi' : 'Your activity and reminders'}</p>
                </div>
                <button class="btn btn-secondary btn-sm" id="mark-all-read-btn" data-requires-auth="true">
                    ✓ ${I18n.t('notifications.markAllRead')}
                </button>
            </div>

            ${unread > 0 ? `
            <div class="notif-unread-banner">
                <span class="notif-banner-dot"></span>
                <span>${lang === 'lv' ? `Jums ir <strong>${unread}</strong> nelasīts paziņojums` : `You have <strong>${unread}</strong> unread notification${unread !== 1 ? 's' : ''}`}</span>
            </div>` : ''}

            <!-- ═══ TWO-PANEL LAYOUT ═══ -->
            <div class="notif-layout">

                <!-- Settings sidebar -->
                <aside class="notif-sidebar">
                    <div class="notif-sidebar-title">
                        <span>⚙️</span>
                        ${I18n.t('notifications.settings')}
                    </div>
                    <div class="notif-settings-list">
                        <div class="notif-setting-row">
                            <div class="notif-setting-info">
                                <div class="notif-setting-name">⏰ ${I18n.t('notifications.reminder24h')}</div>
                                <div class="notif-setting-desc">${lang === 'lv' ? '24h pirms termiņa' : '24h before deadline'}</div>
                            </div>
                            <label class="switch" data-requires-auth="true"><input type="checkbox" id="ns-24h" ${settings.reminder24h ? 'checked' : ''} data-requires-auth="true"><span class="switch-slider"></span></label>
                        </div>
                        <div class="notif-setting-row">
                            <div class="notif-setting-info">
                                <div class="notif-setting-name">🔔 ${I18n.t('notifications.reminder1h')}</div>
                                <div class="notif-setting-desc">${lang === 'lv' ? '1h pirms termiņa' : '1h before deadline'}</div>
                            </div>
                            <label class="switch" data-requires-auth="true"><input type="checkbox" id="ns-1h" ${settings.reminder1h ? 'checked' : ''} data-requires-auth="true"><span class="switch-slider"></span></label>
                        </div>
                        <div class="notif-setting-row">
                            <div class="notif-setting-info">
                                <div class="notif-setting-name">📧 ${I18n.t('notifications.email')}</div>
                                <div class="notif-setting-desc">${lang === 'lv' ? 'E-pasta paziņojumi' : 'Email notifications'}</div>
                            </div>
                            <label class="switch" data-requires-auth="true"><input type="checkbox" id="ns-email" ${settings.emailNotifications ? 'checked' : ''} data-requires-auth="true"><span class="switch-slider"></span></label>
                        </div>
                    </div>

                    <!-- Quick stats -->
                    <div class="notif-sidebar-stats">
                        <div class="notif-sidebar-stat">
                            <div class="notif-sidebar-stat-val">${notifs.length}</div>
                            <div class="notif-sidebar-stat-label">${lang === 'lv' ? 'Kopā' : 'Total'}</div>
                        </div>
                        <div class="notif-sidebar-stat">
                            <div class="notif-sidebar-stat-val" style="color:var(--accent-primary)">${unread}</div>
                            <div class="notif-sidebar-stat-label">${lang === 'lv' ? 'Nelasīti' : 'Unread'}</div>
                        </div>
                        <div class="notif-sidebar-stat">
                            <div class="notif-sidebar-stat-val" style="color:var(--success)">${notifs.length - unread}</div>
                            <div class="notif-sidebar-stat-label">${lang === 'lv' ? 'Lasīti' : 'Read'}</div>
                        </div>
                    </div>
                </aside>

                <!-- Notifications list -->
                <div class="notif-main">
                    <div class="notif-list-header">
                        <span class="notif-list-count">${notifs.length} ${lang === 'lv' ? 'paziņojumi' : 'notifications'}</span>
                    </div>
                    <div id="notification-list" class="notif-list">
                        ${notifListHtml}
                    </div>
                </div>
            </div>
            </div>
        `;

        bindEvents();
    }

    function bindEvents() {
        document.getElementById('mark-all-read-hero')?.addEventListener('click', () => document.getElementById('mark-all-read-btn')?.click());
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
