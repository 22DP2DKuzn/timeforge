/* ============================================
   TimeForge — Achievements System
   Definitions, auto-check, XP/Level, popup, render
   ============================================ */

const Achievements = (() => {
    const DEFS = [
        { id:'first_task',    icon:'🎯', nameLv:'Pirmais uzdevums',      nameEn:'First Task',          descLv:'Izveidojiet pirmo uzdevumu',          descEn:'Create your first task',           xp:25,  condition: u => Store.getTasks(u.id).length >= 1 },
        { id:'ten_tasks',     icon:'🔥', nameLv:'Desmit uzdevumi',       nameEn:'Ten Tasks',           descLv:'Pabeidziet 10 uzdevumus',             descEn:'Complete 10 tasks',                xp:50,  condition: u => Store.getTasks(u.id).filter(t=>t.status==='completed').length >= 10 },
        { id:'fifty_tasks',   icon:'💯', nameLv:'Piecdesmit uzdevumi',   nameEn:'Fifty Tasks',         descLv:'Pabeidziet 50 uzdevumus',             descEn:'Complete 50 tasks',                xp:150, condition: u => Store.getTasks(u.id).filter(t=>t.status==='completed').length >= 50 },
        { id:'first_focus',   icon:'⏱️', nameLv:'Pirmā fokusa sesija',   nameEn:'First Focus',         descLv:'Pabeidziet pirmo fokusa sesiju',       descEn:'Complete your first focus session', xp:25,  condition: u => Store.getFocusSessions(u.id).filter(s=>s.completed&&s.type==='work').length >= 1 },
        { id:'fifty_focus',   icon:'🧘', nameLv:'Fokusa meistars',       nameEn:'Focus Master',        descLv:'Pabeidziet 50 fokusa sesijas',         descEn:'Complete 50 focus sessions',       xp:200, condition: u => Store.getFocusSessions(u.id).filter(s=>s.completed&&s.type==='work').length >= 50 },
        { id:'first_project', icon:'📁', nameLv:'Pirmais projekts',      nameEn:'First Project',       descLv:'Izveidojiet pirmo projektu',           descEn:'Create your first project',        xp:25,  condition: u => Store.getProjects(u.id).length >= 1 },
        { id:'streak_7',      icon:'🔥', nameLv:'Nedēļas sērija',        nameEn:'Week Streak',         descLv:'7 dienas pēc kārtas ar uzdevumiem',    descEn:'7 consecutive days with tasks',    xp:100, condition: u => (u.streak || 0) >= 7 },
        { id:'streak_30',     icon:'🏆', nameLv:'Mēneša sērija',         nameEn:'Month Streak',        descLv:'30 dienas pēc kārtas',                 descEn:'30 consecutive days',              xp:200, condition: u => (u.streak || 0) >= 30 },
        { id:'early_bird',    icon:'🌅', nameLv:'Agrais putns',          nameEn:'Early Bird',          descLv:'Pabeidziet uzdevumu pirms 8:00',       descEn:'Complete a task before 8:00',      xp:50,  condition: u => Store.getTasks(u.id).some(t => t.status==='completed' && t.time && parseInt(t.time.split(':')[0]) < 8) },
        { id:'organized',     icon:'🗂️', nameLv:'Organizēts',            nameEn:'Organized',           descLv:'Izveidojiet 5 projektus',              descEn:'Create 5 projects',                xp:75,  condition: u => Store.getProjects(u.id).length >= 5 },
    ];

    /* Level rewards — what each level milestone unlocks */
    const LEVEL_REWARDS = [
        { level:1, icon:'🌱', reward:null,          nameLv:'Iesācējs',          nameEn:'Beginner',         descLv:'Sāc savu TimeForge ceļojumu!',            descEn:'Start your TimeForge journey!' },
        { level:2, icon:'🐾', reward:'pet',          nameLv:'AI Palīgs',         nameEn:'AI Companion',     descLv:'Atbloķē AI mājdzīvnieku!',               descEn:'Unlock the AI Pet!' },
        { level:3, icon:'🐱', reward:'skin_cat',     nameLv:'Kaķa āda',          nameEn:'Cat Skin',         descLv:'Nova var kļūt par mīļu kaķi 🐱',         descEn:'Nova can become a cozy cat 🐱' },
        { level:4, icon:'🐰', reward:'skin_rabbit',  nameLv:'Truša āda',         nameEn:'Rabbit Skin',      descLv:'Nova var kļūt par energisku trušu 🐰',   descEn:'Nova can become an energetic rabbit 🐰' },
        { level:5, icon:'🦉', reward:'skin_owl',     nameLv:'Pūces āda',         nameEn:'Owl Skin',         descLv:'Nova var kļūt par gudru pūci 🦉',        descEn:'Nova can become a wise owl 🦉' },
        { level:6, icon:'🐲', reward:'skin_dragon',  nameLv:'Pūķa āda',          nameEn:'Dragon Skin',      descLv:'Nova var kļūt par varenu pūķi 🐲',       descEn:'Nova can become a mighty dragon 🐲' },
    ];

    function xpForLevel(level) { return level * 50; }

    function totalXpForLevel(targetLevel) {
        let total = 0;
        for (let l = 1; l < targetLevel; l++) total += xpForLevel(l);
        return total;
    }

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
                        const oldLevel  = getLevel(freshUser.xp || 0).level;
                        const newXp    = (freshUser.xp || 0) + def.xp;
                        const levelInfo = getLevel(newXp);
                        Store.updateUser(user.id, { xp: newXp, level: levelInfo.level });
                        if (levelInfo.level >= 2 && typeof PetAssistant !== 'undefined') PetAssistant.tryInit?.();
                        const lang = I18n.getLang();
                        Store.logActivity(user.id, 'achievement_unlocked',
                            (lang === 'lv' ? def.nameLv : def.nameEn) + ` (+${def.xp} XP)`);
                        if (levelInfo.level > oldLevel) {
                            Store.logActivity(user.id, 'level_up', `Level ${levelInfo.level}`);
                        }
                        showPopup(def);
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

        /* ── Next level reward teaser ── */
        const nextReward = LEVEL_REWARDS.find(lr => lr.level > info.level);

        /* ── Level roadmap ── */
        let roadmapHtml = '<div class="ach-roadmap">';
        LEVEL_REWARDS.forEach((lr, idx) => {
            const isPast   = info.level > lr.level;
            const isActive = info.level === lr.level;
            const isLocked = info.level < lr.level;
            const isFirst  = idx === 0;
            const isLast   = idx === LEVEL_REWARDS.length - 1;
            const stateClass = isPast ? 'ach-rm-past' : isActive ? 'ach-rm-active' : 'ach-rm-locked';
            const leftFill  = !isFirst && (isPast || isActive);
            const rightFill = !isLast  && isPast;
            const xpNeeded  = totalXpForLevel(lr.level);

            roadmapHtml += `
            <div class="ach-rm-item ${stateClass}">
                <div class="ach-rm-connector">
                    <div class="ach-rm-line${isFirst ? ' ach-rm-line-invisible' : leftFill ? ' ach-rm-line-fill' : ''}"></div>
                    <div class="ach-rm-node">
                        <span class="ach-rm-emoji">${lr.icon}</span>
                        <span class="ach-rm-lv-badge">Lvl ${lr.level}</span>
                    </div>
                    <div class="ach-rm-line${isLast ? ' ach-rm-line-invisible' : rightFill ? ' ach-rm-line-fill' : ''}"></div>
                </div>
                <div class="ach-rm-info">
                    <div class="ach-rm-name">${lang === 'lv' ? lr.nameLv : lr.nameEn}</div>
                    ${lr.reward ? `<div class="ach-rm-desc">${lang === 'lv' ? lr.descLv : lr.descEn}</div>` : `<div class="ach-rm-desc">${lang === 'lv' ? lr.descLv : lr.descEn}</div>`}
                    ${isLocked
                        ? `<div class="ach-rm-xp-need">⚡ ${xpNeeded} XP</div>`
                        : (isPast || isActive) && lr.reward
                            ? `<div class="ach-rm-unlocked-tag">✓ ${lang === 'lv' ? 'Atbloķēts' : 'Unlocked'}</div>`
                            : `<div class="ach-rm-unlocked-tag" style="color:var(--text-tertiary)">— ${lang === 'lv' ? 'Sākuma līmenis' : 'Starting level'}</div>`
                    }
                </div>
            </div>`;
        });
        roadmapHtml += '</div>';

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
                            ${nextReward ? `<div class="ach-next-unlock">
                                <span class="ach-next-icon">${nextReward.icon}</span>
                                <span>${lang === 'lv' ? 'Nākamais: Līm.' : 'Next: Lvl.'} ${nextReward.level} — ${lang === 'lv' ? nextReward.nameLv : nextReward.nameEn}</span>
                            </div>` : `<div class="ach-next-unlock ach-next-unlock-max">
                                🏆 ${lang === 'lv' ? 'Visi līmeņi sasniegti!' : 'All levels reached!'}
                            </div>`}
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

            <!-- ═══ LEVEL ROADMAP ═══ -->
            <div class="ach-section-header" style="margin-top:8px">
                <h2>${lang === 'lv' ? 'Līmeņu ceļvedis' : 'Level Roadmap'}</h2>
                <span class="ach-roadmap-tag">🐾 ${lang === 'lv' ? 'AI mājdzīvnieka balvas' : 'AI pet rewards'}</span>
            </div>
            ${roadmapHtml}

            <!-- ═══ ACHIEVEMENT GRID ═══ -->
            <div class="ach-section-header" style="margin-top:8px">
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

        /* Filter pills */
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

    return { DEFS, LEVEL_REWARDS, checkAll, updateLevelUI, renderPage, getLevel };
})();
