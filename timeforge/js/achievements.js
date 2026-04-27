/* ============================================
   TimeForge — Achievements System
   Definitions, auto-check, XP/Level, popup, render
   ============================================ */

const Achievements = (() => {
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

    function xpForLevel(level) { return level * 100; }

    function getLevel(xp) {
        let level = 1, total = 0;
        while (total + xpForLevel(level) <= xp) { total += xpForLevel(level); level++; }
        return { level, currentXp: xp - total, neededXp: xpForLevel(level) };
    }

    function checkAll(user) {
        if (!user) return;
        const unlocked  = Store.getUserAchievements(user.id);
        const freshUser = Store.getCurrentUser() || user;
        DEFS.forEach(def => {
            if (unlocked.includes(def.id)) return;
            try {
                if (def.condition(freshUser)) {
                    const success = Store.unlockAchievement(user.id, def.id);
                    if (success) {
                        const newXp = (freshUser.xp || 0) + def.xp;
                        const levelInfo = getLevel(newXp);
                        Store.updateUser(user.id, { xp: newXp, level: levelInfo.level });
                        showPopup(def);
                        const lang = I18n.getLang();
                        Store.createNotification({
                            userId: user.id, type: 'achievement',
                            title: I18n.t('notifications.achievementUnlocked'),
                            message: lang === 'lv' ? def.nameLv : def.nameEn,
                            icon: def.icon,
                        });
                        setTimeout(() => Confetti.fire(60), 300);
                        updateLevelUI();
                        if (typeof Notifications !== 'undefined') Notifications.updateBadge();
                    }
                }
            } catch(e) { /* skip */ }
        });
    }

    function showPopup(def) {
        const popup = document.getElementById('achievement-popup');
        const lang  = I18n.getLang();
        popup.querySelector('.achievement-icon').textContent        = def.icon;
        popup.querySelector('.achievement-title').textContent       = lang === 'lv' ? def.nameLv : def.nameEn;
        popup.querySelector('.achievement-description').textContent = lang === 'lv' ? def.descLv : def.descEn;
        popup.querySelector('.achievement-points span').textContent  = def.xp;
        popup.classList.remove('hidden','hide');
        popup.classList.add('show');
        setTimeout(() => {
            popup.classList.remove('show'); popup.classList.add('hide');
            setTimeout(() => popup.classList.add('hidden'), 500);
        }, 3500);
    }

    function updateLevelUI() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const info = getLevel(user.xp || 0);
        const el = id => document.getElementById(id);
        if (el('user-level'))         el('user-level').textContent         = info.level;
        if (el('user-xp'))            el('user-xp').textContent            = info.currentXp;
        if (el('next-level-xp'))      el('next-level-xp').textContent      = info.neededXp;
        if (el('level-progress-fill')) el('level-progress-fill').style.width = ((info.currentXp / info.neededXp) * 100) + '%';
    }

    function renderPage() {
        const user     = Store.getCurrentUser();
        if (!user) return;
        const page     = document.getElementById('achievements-page');
        const unlocked = Store.getUserAchievements(user.id);
        const lang     = I18n.getLang();
        const info     = getLevel(user.xp || 0);
        const xpPct    = Math.round((info.currentXp / info.neededXp) * 100);
        const unlockedCount = unlocked.length;
        const totalXpEarned = DEFS.filter(d => unlocked.includes(d.id)).reduce((s, d) => s + d.xp, 0);

        let html = `
            <div class="site-page site-page-achievements">
            <span class="page-eyebrow">${lang === 'lv' ? 'Izaugsme' : 'Growth'}</span>
            <!-- ═══ XP HERO BANNER ═══ -->
            <div class="ach-hero">
                <div class="ach-hero-bg"></div>
                <div class="ach-hero-content">
                    <div class="ach-hero-left">
                        <div class="ach-level-ring">
                            <span class="ach-level-num">${info.level}</span>
                            <span class="ach-level-word">${lang === 'lv' ? 'Līmenis' : 'Level'}</span>
                        </div>
                        <div class="ach-hero-text">
                            <h1>${I18n.t('achievements.title')}</h1>
                            <p>${lang === 'lv'
                                ? `Atbloķēti <strong>${unlockedCount}</strong> no <strong>${DEFS.length}</strong> sasniegumiem`
                                : `<strong>${unlockedCount}</strong> of <strong>${DEFS.length}</strong> achievements unlocked`
                            }</p>
                        </div>
                    </div>
                    <div class="ach-hero-stats">
                        <div class="ach-hero-stat">
                            <div class="ach-hero-stat-val">${user.xp || 0}</div>
                            <div class="ach-hero-stat-label">Total XP</div>
                        </div>
                        <div class="ach-hero-stat-sep"></div>
                        <div class="ach-hero-stat">
                            <div class="ach-hero-stat-val">${totalXpEarned}</div>
                            <div class="ach-hero-stat-label">${lang === 'lv' ? 'Nopelnīti XP' : 'XP Earned'}</div>
                        </div>
                        <div class="ach-hero-stat-sep"></div>
                        <div class="ach-hero-stat">
                            <div class="ach-hero-stat-val">${user.streak || 0}</div>
                            <div class="ach-hero-stat-label">${lang === 'lv' ? 'Dienu sērija' : 'Day Streak'}</div>
                        </div>
                    </div>
                </div>
                <div class="ach-hero-xp">
                    <div class="ach-xp-labels">
                        <span>${lang === 'lv' ? 'Progress uz Līm.' : 'Progress to Lvl.'} ${info.level + 1}</span>
                        <span>${info.currentXp} / ${info.neededXp} XP</span>
                    </div>
                    <div class="ach-xp-track">
                        <div class="ach-xp-fill" style="width:${xpPct}%"></div>
                    </div>
                </div>
            </div>

            <!-- ═══ ACHIEVEMENT GRID ═══ -->
            <div class="ach-section-header">
                <h2>${lang === 'lv' ? 'Visi sasniegumi' : 'All Achievements'}</h2>
                <div class="ach-filter-pills">
                    <button class="ach-pill active" data-filter="all">${lang === 'lv' ? 'Visi' : 'All'} (${DEFS.length})</button>
                    <button class="ach-pill" data-filter="unlocked">${lang === 'lv' ? 'Atbloķēti' : 'Unlocked'} (${unlockedCount})</button>
                    <button class="ach-pill" data-filter="locked">${lang === 'lv' ? 'Bloķēti' : 'Locked'} (${DEFS.length - unlockedCount})</button>
                </div>
            </div>
            <div class="ach-grid" id="ach-grid">
        `;

        DEFS.forEach(def => {
            const isUnlocked = unlocked.includes(def.id);
            html += `
                <div class="ach-card ${isUnlocked ? 'ach-card-unlocked' : 'ach-card-locked'}" data-ach-state="${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="ach-card-glow"></div>
                    <div class="ach-card-icon">${def.icon}</div>
                    <div class="ach-card-name">${lang === 'lv' ? def.nameLv : def.nameEn}</div>
                    <div class="ach-card-desc">${lang === 'lv' ? def.descLv : def.descEn}</div>
                    <div class="ach-card-footer">
                        <span class="ach-card-xp">+${def.xp} XP</span>
                        <span class="ach-card-status">${isUnlocked ? '✅' : '🔒'}</span>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        page.innerHTML = html;

        // Filter pills
        page.querySelectorAll('.ach-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                page.querySelectorAll('.ach-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const filter = pill.dataset.filter;
                page.querySelectorAll('.ach-card').forEach(card => {
                    const show = filter === 'all' || card.dataset.achState === filter;
                    card.style.display = show ? '' : 'none';
                });
            });
        });
    }

    return { DEFS, checkAll, updateLevelUI, renderPage, getLevel };
})();
