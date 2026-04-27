/* ============================================
   TimeForge — Profile
   Edit user info, change password, settings
   ============================================ */

const Profile = (() => {

    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const isGuest = App.isGuestUser(user);
        const page = document.getElementById('profile-page');
        const info = Achievements.getLevel(user.xp || 0);
        const xpPct = Math.round((info.currentXp / info.neededXp) * 100);
        const tasks = Store.getTasks(user.id);
        const completed = tasks.filter(t => t.status === 'completed').length;
        const initials = ((user.firstName[0] || '') + (user.lastName[0] || '')).toUpperCase();

        page.innerHTML = isGuest ? `
            <div class="site-page site-page-profile">
                <span class="page-eyebrow">${I18n.getLang() === 'lv' ? 'Viesis' : 'Guest'}</span>
                <div class="profile-hero">
                    <div class="profile-hero-bg"></div>
                    <div class="profile-hero-content">
                        <div class="profile-avatar-wrap">
                            <div class="profile-hero-avatar">${initials}</div>
                            <div class="profile-avatar-ring"></div>
                        </div>
                        <div class="profile-hero-info">
                            <h1 class="profile-hero-name">${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</h1>
                            <p class="profile-hero-email">${Utils.escapeHtml(user.email)}</p>
                            <div class="profile-hero-badges">
                                <span class="profile-badge profile-badge-level">${I18n.t('auth.guestMode')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card" style="padding:24px">
                    <h2>${I18n.t('auth.registerRequired')}</h2>
                    <p style="margin-top:8px">${I18n.t('auth.registerPrompt')}</p>
                    <div class="profile-form-actions" style="margin-top:16px">
                        <a href="index.html" class="btn btn-primary">${I18n.t('auth.signInRegister')}</a>
                    </div>
                </div>
            </div>
        ` : `
            <div class="site-page site-page-profile">
            <span class="page-eyebrow">${I18n.getLang() === 'lv' ? 'Konts' : 'Account'}</span>
            <!-- ═══ PROFILE HERO ═══ -->
            <div class="profile-hero">
                <div class="profile-hero-bg"></div>
                <div class="profile-hero-content">
                    <div class="profile-avatar-wrap">
                        <div class="profile-hero-avatar">${initials}</div>
                        <div class="profile-avatar-ring"></div>
                    </div>
                    <div class="profile-hero-info">
                        <h1 class="profile-hero-name">${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</h1>
                        <p class="profile-hero-email">${Utils.escapeHtml(user.email)}</p>
                        <div class="profile-hero-badges">
                            <span class="profile-badge profile-badge-level">⭐ ${I18n.getLang() === 'lv' ? 'Līmenis' : 'Level'} ${info.level}</span>
                            <span class="profile-badge profile-badge-xp">✨ ${user.xp || 0} XP</span>
                            <span class="profile-badge profile-badge-streak">🔥 ${user.streak || 0} ${I18n.getLang() === 'lv' ? 'dienas' : 'days'}</span>
                        </div>
                    </div>
                    <div class="profile-hero-stats">
                        <div class="profile-hero-stat">
                            <div class="profile-hero-stat-val">${tasks.length}</div>
                            <div class="profile-hero-stat-label">${I18n.t('dashboard.totalTasks')}</div>
                        </div>
                        <div class="profile-hero-stat-sep"></div>
                        <div class="profile-hero-stat">
                            <div class="profile-hero-stat-val">${completed}</div>
                            <div class="profile-hero-stat-label">${I18n.t('dashboard.completed')}</div>
                        </div>
                        <div class="profile-hero-stat-sep"></div>
                        <div class="profile-hero-stat">
                            <div class="profile-hero-stat-val">${Store.getProjects(user.id).length}</div>
                            <div class="profile-hero-stat-label">${I18n.t('nav.projects')}</div>
                        </div>
                        <div class="profile-hero-stat-sep"></div>
                        <div class="profile-hero-stat">
                            <div class="profile-hero-stat-val">${Store.getUserAchievements(user.id).length}</div>
                            <div class="profile-hero-stat-label">${I18n.t('achievements.unlocked')}</div>
                        </div>
                    </div>
                </div>
                <!-- XP progress bar -->
                <div class="profile-hero-xp">
                    <div class="profile-xp-track">
                        <div class="profile-xp-fill" style="width:${xpPct}%"></div>
                    </div>
                    <span class="profile-xp-text">${info.currentXp} / ${info.neededXp} XP ${I18n.getLang() === 'lv' ? 'līdz Līm.' : 'to Lvl.'} ${info.level + 1}</span>
                </div>
            </div>

            <!-- ═══ PROFILE CONTENT GRID ═══ -->
            <div class="profile-grid">

                <!-- Edit Info -->
                <div class="card profile-card-main">
                    <div class="profile-card-header">
                        <span class="profile-card-icon">👤</span>
                        <div>
                            <div class="profile-card-title">${I18n.getLang() === 'lv' ? 'Personas informācija' : 'Personal Information'}</div>
                            <div class="profile-card-sub">${I18n.getLang() === 'lv' ? 'Atjauniniet savu profilu' : 'Update your profile details'}</div>
                        </div>
                    </div>
                    <form class="modal-form" id="profile-form">
                        <div class="form-row-2">
                            <div class="form-group">
                                <label>${I18n.t('form.firstName')}</label>
                                <input type="text" id="prf-first" value="${Utils.escapeHtml(user.firstName)}" required>
                            </div>
                            <div class="form-group">
                                <label>${I18n.t('form.lastName')}</label>
                                <input type="text" id="prf-last" value="${Utils.escapeHtml(user.lastName)}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${I18n.t('form.email')}</label>
                            <input type="email" id="prf-email" value="${Utils.escapeHtml(user.email)}" required>
                        </div>
                        <div class="form-row-2">
                            <div class="form-group">
                                <label>${I18n.t('profile.timezone')}</label>
                                <select id="prf-tz">
                                    <option value="Europe/Riga"     ${user.timezone==='Europe/Riga'?'selected':''}>Europe/Riga (UTC+2/+3)</option>
                                    <option value="Europe/London"   ${user.timezone==='Europe/London'?'selected':''}>Europe/London (UTC+0/+1)</option>
                                    <option value="Europe/Berlin"   ${user.timezone==='Europe/Berlin'?'selected':''}>Europe/Berlin (UTC+1/+2)</option>
                                    <option value="America/New_York"${user.timezone==='America/New_York'?'selected':''}>America/New_York (UTC-5/-4)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>${I18n.t('profile.language')}</label>
                                <select id="prf-lang">
                                    <option value="lv" ${user.language==='lv'?'selected':''}>Latviešu</option>
                                    <option value="en" ${user.language==='en'?'selected':''}>English</option>
                                </select>
                            </div>
                        </div>
                        <div class="profile-form-actions">
                            <button type="button" class="btn btn-secondary" id="prf-cancel">${I18n.t('profile.cancel')}</button>
                            <button type="submit" class="btn btn-primary ripple">${I18n.t('profile.save')}</button>
                        </div>
                    </form>
                </div>

                <!-- Right column -->
                <div class="profile-right-col">

                    <!-- Change Password -->
                    <div class="card">
                        <div class="profile-card-header">
                            <span class="profile-card-icon">🔒</span>
                            <div>
                                <div class="profile-card-title">${I18n.t('profile.changePassword')}</div>
                                <div class="profile-card-sub">${I18n.getLang() === 'lv' ? 'Mainiet savu paroli' : 'Keep your account secure'}</div>
                            </div>
                        </div>
                        <form class="modal-form" id="password-form">
                            <div class="form-group">
                                <label>${I18n.t('profile.currentPassword')}</label>
                                <input type="password" id="prf-curr-pass" required>
                            </div>
                            <div class="form-group">
                                <label>${I18n.t('profile.newPassword')}</label>
                                <input type="password" id="prf-new-pass" required>
                                <div class="password-strength" style="margin-top:6px">
                                    <div class="strength-bar"><div class="strength-fill" id="prf-str-fill"></div></div>
                                    <span class="strength-text" id="prf-str-text">${I18n.t('form.passwordStrength')}</span>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>${I18n.t('form.confirmPassword')}</label>
                                <input type="password" id="prf-confirm-pass" required>
                                <span class="error-message" id="prf-pass-error"></span>
                            </div>
                            <div style="display:flex;justify-content:flex-end">
                                <button type="submit" class="btn btn-primary ripple">${I18n.t('profile.changePassword')}</button>
                            </div>
                        </form>
                    </div>

                    <!-- Account Stats -->
                    <div class="card profile-stats-card">
                        <div class="profile-card-header">
                            <span class="profile-card-icon">📊</span>
                            <div>
                                <div class="profile-card-title">${I18n.getLang() === 'lv' ? 'Konta statistika' : 'Account Stats'}</div>
                                <div class="profile-card-sub">${I18n.getLang() === 'lv' ? 'Jūsu aktivitāte' : 'Your activity overview'}</div>
                            </div>
                        </div>
                        <div class="profile-stats-list">
                            <div class="profile-stat-row">
                                <span class="profile-stat-key">${I18n.getLang() === 'lv' ? 'Reģistrēts' : 'Member since'}</span>
                                <span class="profile-stat-val">${Utils.formatDate(user.createdAt)}</span>
                            </div>
                            <div class="profile-stat-row">
                                <span class="profile-stat-key">${I18n.t('dashboard.totalTasks')}</span>
                                <span class="profile-stat-val profile-stat-accent">${tasks.length}</span>
                            </div>
                            <div class="profile-stat-row">
                                <span class="profile-stat-key">${I18n.getLang() === 'lv' ? 'Pabeigti' : 'Completed'}</span>
                                <span class="profile-stat-val profile-stat-green">${completed}</span>
                            </div>
                            <div class="profile-stat-row">
                                <span class="profile-stat-key">${I18n.t('nav.projects')}</span>
                                <span class="profile-stat-val profile-stat-accent">${Store.getProjects(user.id).length}</span>
                            </div>
                            <div class="profile-stat-row">
                                <span class="profile-stat-key">${I18n.t('analytics.focusSessions')}</span>
                                <span class="profile-stat-val">${Store.getFocusSessions(user.id).filter(s => s.completed).length}</span>
                            </div>
                            <div class="profile-stat-row">
                                <span class="profile-stat-key">${I18n.t('achievements.unlocked')}</span>
                                <span class="profile-stat-val profile-stat-green">${Store.getUserAchievements(user.id).length} / ${Achievements.DEFS.length}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            </div>
        `;

        if (!isGuest) bindEvents(user);
    }

    function bindEvents(user) {
        document.getElementById('profile-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const firstName = document.getElementById('prf-first').value.trim();
            const lastName  = document.getElementById('prf-last').value.trim();
            const email     = document.getElementById('prf-email').value.trim();
            const timezone  = document.getElementById('prf-tz').value;
            const language  = document.getElementById('prf-lang').value;

            if (!firstName || !lastName || !email) { Toast.error(I18n.t('common.error'), I18n.t('error.fillRequired')); return; }
            if (!Utils.isValidEmail(email))         { Toast.error(I18n.t('common.error'), I18n.t('error.emailInvalid')); return; }
            if (!confirm(I18n.t('profile.saveConfirm'))) return;

            Store.updateUser(user.id, { firstName, lastName, email: email.toLowerCase(), timezone, language });
            if (language !== I18n.getLang()) I18n.setLang(language);
            App.updateUserUI();
            Toast.success(I18n.t('common.success'), I18n.t('profile.save'));
            renderPage();
        });

        document.getElementById('prf-cancel')?.addEventListener('click', renderPage);

        document.getElementById('prf-new-pass')?.addEventListener('input', e => {
            const { score } = Utils.checkPasswordStrength(e.target.value);
            const fill = document.getElementById('prf-str-fill');
            const text = document.getElementById('prf-str-text');
            const colors = ['#f43f5e','#fb923c','#facc15','#4ade80'];
            const labels = { lv:['Vāja','Vidēja','Laba','Stipra'], en:['Weak','Fair','Good','Strong'] };
            fill.style.width = (score * 25) + '%';
            fill.style.background = colors[score - 1] || '#f43f5e';
            text.textContent = score > 0 ? (labels[I18n.getLang()] || labels.lv)[score - 1] : I18n.t('form.passwordStrength');
        });

        document.getElementById('password-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const curr  = document.getElementById('prf-curr-pass').value;
            const newP  = document.getElementById('prf-new-pass').value;
            const conf  = document.getElementById('prf-confirm-pass').value;
            const errEl = document.getElementById('prf-pass-error');
            errEl.textContent = '';

            if (Utils.simpleHash(curr) !== user.password) { errEl.textContent = I18n.t('error.loginFailed'); return; }
            if (newP !== conf)                            { errEl.textContent = I18n.t('error.passwordMismatch'); return; }
            if (Utils.checkPasswordStrength(newP).score < 4) { errEl.textContent = I18n.t('error.passwordWeak'); return; }

            Store.updateUser(user.id, { password: Utils.simpleHash(newP) });
            Toast.success(I18n.t('common.success'), I18n.t('profile.changePassword'));
            document.getElementById('password-form').reset();
        });

        document.querySelectorAll('#profile-page .ripple').forEach(b => b.addEventListener('click', Utils.createRipple));
    }

    return { renderPage };
})();
