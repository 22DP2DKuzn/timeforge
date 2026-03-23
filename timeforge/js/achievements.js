/* ============================================
   TimeForge — Achievements System
   Definitions, auto-check, XP/Level, popup, render
   ============================================ */

const Achievements = (() => {
    /* Achievement definitions */
    const DEFS = [
        { id:'first_task',    icon:'🎯', nameLv:'Pirmais uzdevums',      nameEn:'First Task',          descLv:'Izveidojiet pirmo uzdevumu',          descEn:'Create your first task',           xp:50,  condition: u => Store.getTasks(u.id).length >= 1 },
        { id:'ten_tasks',     icon:'🔥', nameLv:'Desmit uzdevumi',       nameEn:'Ten Tasks',           descLv:'Pabeidziet 10 uzdevumus',             descEn:'Complete 10 tasks',                xp:100, condition: u => Store.getTasks(u.id).filter(t=>t.status==='completed').length >= 10 },
        { id:'fifty_tasks',   icon:'💯', nameLv:'Piecdesmit uzdevumi',   nameEn:'Fifty Tasks',         descLv:'Pabeidziet 50 uzdevumus',             descEn:'Complete 50 tasks',                xp:300, condition: u => Store.getTasks(u.id).filter(t=>t.status==='completed').length >= 50 },
        { id:'first_focus',   icon:'⏱️', nameLv:'Pirmā fokusa sesija',   nameEn:'First Focus',         descLv:'Pabeidziet pirmo fokusa sesiju',       descEn:'Complete your first focus session', xp:50,  condition: u => Store.getFocusSessions(u.id).filter(s=>s.completed&&s.type==='work').length >= 1 },
        { id:'fifty_focus',   icon:'🧘', nameLv:'Fokusa meistars',       nameEn:'Focus Master',        descLv:'Pabeidziet 50 fokusa sesijas',         descEn:'Complete 50 focus sessions',       xp:500, condition: u => Store.getFocusSessions(u.id).filter(s=>s.completed&&s.type==='work').length >= 50 },
        { id:'first_project', icon:'📁', nameLv:'Pirmais projekts',      nameEn:'First Project',       descLv:'Izveidojiet pirmo projektu',           descEn:'Create your first project',        xp:50,  condition: u => Store.getProjects(u.id).length >= 1 },
        { id:'streak_7',      icon:'🔥', nameLv:'Nedēļas sērija',        nameEn:'Week Streak',         descLv:'7 dienas pēc kārtas ar uzdevumiem',    descEn:'7 consecutive days with tasks',    xp:200, condition: u => (u.streak || 0) >= 7 },
        { id:'streak_30',     icon:'🏆', nameLv:'Mēneša sērija',         nameEn:'Month Streak',        descLv:'30 dienas pēc kārtas',                 descEn:'30 consecutive days',              xp:500, condition: u => (u.streak || 0) >= 30 },
        { id:'early_bird',    icon:'🌅', nameLv:'Agrais putns',          nameEn:'Early Bird',          descLv:'Pabeidziet uzdevumu pirms 8:00',       descEn:'Complete a task before 8:00',      xp:100, condition: u => Store.getTasks(u.id).some(t => t.status==='completed' && t.time && parseInt(t.time.split(':')[0]) < 8) },
        { id:'organized',     icon:'🗂️', nameLv:'Organizēts',            nameEn:'Organized',           descLv:'Izveidojiet 5 projektus',              descEn:'Create 5 projects',                xp:150, condition: u => Store.getProjects(u.id).length >= 5 },
    ];

    /** XP thresholds per level */
    function xpForLevel(level) { return level * 100; }

    /** Calculate level from XP */
    function getLevel(xp) {
        let level = 1;
        let total = 0;
        while (total + xpForLevel(level) <= xp) {
            total += xpForLevel(level);
            level++;
        }
        return { level, currentXp: xp - total, neededXp: xpForLevel(level) };
    }

    /** Check and award achievements for a user */
    function checkAll(user) {
        if (!user) return;
        const unlocked = Store.getUserAchievements(user.id);
        const freshUser = Store.getCurrentUser() || user;

        DEFS.forEach(def => {
            if (unlocked.includes(def.id)) return;
            try {
                if (def.condition(freshUser)) {
                    const success = Store.unlockAchievement(user.id, def.id);
                    if (success) {
                        // Award XP
                        const newXp = (freshUser.xp || 0) + def.xp;
                        const levelInfo = getLevel(newXp);
                        Store.updateUser(user.id, { xp: newXp, level: levelInfo.level });

                        // Show popup
                        showPopup(def);

                        // Create notification
                        const lang = I18n.getLang();
                        Store.createNotification({
                            userId: user.id,
                            type: 'achievement',
                            title: I18n.t('notifications.achievementUnlocked'),
                            message: lang === 'lv' ? def.nameLv : def.nameEn,
                            icon: def.icon,
                        });

                        // Fire confetti
                        setTimeout(() => Confetti.fire(60), 300);

                        // Update UI
                        updateLevelUI();
                        if (typeof Notifications !== 'undefined') Notifications.updateBadge();
                    }
                }
            } catch(e) { /* skip silently */ }
        });
    }

    /** Show achievement popup */
    function showPopup(def) {
        const popup = document.getElementById('achievement-popup');
        const lang = I18n.getLang();
        popup.querySelector('.achievement-icon').textContent = def.icon;
        popup.querySelector('.achievement-title').textContent = lang === 'lv' ? def.nameLv : def.nameEn;
        popup.querySelector('.achievement-description').textContent = lang === 'lv' ? def.descLv : def.descEn;
        popup.querySelector('.achievement-points span').textContent = def.xp;

        popup.classList.remove('hidden','hide');
        popup.classList.add('show');

        setTimeout(() => {
            popup.classList.remove('show');
            popup.classList.add('hide');
            setTimeout(() => popup.classList.add('hidden'), 500);
        }, 3500);
    }

    /** Update sidebar level display */
    function updateLevelUI() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const info = getLevel(user.xp || 0);
        const el = id => document.getElementById(id);
        if (el('user-level')) el('user-level').textContent = info.level;
        if (el('user-xp')) el('user-xp').textContent = info.currentXp;
        if (el('next-level-xp')) el('next-level-xp').textContent = info.neededXp;
        if (el('level-progress-fill')) {
            el('level-progress-fill').style.width = ((info.currentXp / info.neededXp) * 100) + '%';
        }
    }

    /** Render achievements page */
    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('achievements-page');
        const unlocked = Store.getUserAchievements(user.id);
        const lang = I18n.getLang();
        const info = getLevel(user.xp || 0);

        let html = `
            <div class="page-header">
                <h1>${I18n.t('achievements.title')}</h1>
            </div>
            <div class="stats-grid" style="margin-bottom:24px">
                <div class="stat-card">
                    <div class="stat-icon purple">⭐</div>
                    <div class="stat-content">
                        <div class="stat-value">${info.level}</div>
                        <div class="stat-label">${I18n.t('achievements.level')}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pink">${I18n.t('achievements.xp')}</div>
                    <div class="stat-content">
                        <div class="stat-value">${user.xp || 0}</div>
                        <div class="stat-label">${I18n.t('achievements.xp')} (${info.currentXp}/${info.neededXp})</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">🏅</div>
                    <div class="stat-content">
                        <div class="stat-value">${unlocked.length}/${DEFS.length}</div>
                        <div class="stat-label">${I18n.t('achievements.unlocked')}</div>
                    </div>
                </div>
            </div>
            <div class="content-grid">
        `;

        DEFS.forEach(def => {
            const isUnlocked = unlocked.includes(def.id);
            html += `
                <div class="achievement-card ${isUnlocked ? '' : 'locked'}">
                    <div class="ach-icon">${def.icon}</div>
                    <div class="ach-name">${lang === 'lv' ? def.nameLv : def.nameEn}</div>
                    <div class="ach-desc">${lang === 'lv' ? def.descLv : def.descEn}</div>
                    <div class="ach-xp">${isUnlocked ? '✅' : '🔒'} +${def.xp} XP</div>
                </div>
            `;
        });

        html += '</div>';
        page.innerHTML = html;
    }

    return { DEFS, checkAll, updateLevelUI, renderPage, getLevel };
})();
