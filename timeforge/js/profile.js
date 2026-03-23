/* ============================================
   TimeForge — Profile
   Edit user info, change password, settings
   ============================================ */

const Profile = (() => {

    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const page = document.getElementById('profile-page');
        const info = Achievements.getLevel(user.xp || 0);

        page.innerHTML = `
            <div class="page-header"><h1>${I18n.t('profile.title')}</h1></div>
            <div class="two-column">
                <!-- Profile Info -->
                <div class="card">
                    <div class="profile-avatar-large">${(user.firstName[0] || '').toUpperCase()}${(user.lastName[0] || '').toUpperCase()}</div>
                    <div style="text-align:center;margin-bottom:20px">
                        <h2 style="font-size:1.2rem">${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</h2>
                        <p style="color:var(--text-secondary);font-size:0.85rem">${Utils.escapeHtml(user.email)}</p>
                        <div style="margin-top:8px">
                            <span class="badge badge-info">Līm. ${info.level}</span>
                            <span class="badge badge-success">${user.xp || 0} XP</span>
                            <span class="badge badge-warning">🔥 ${user.streak || 0} ${I18n.getLang() === 'lv' ? 'dienas' : 'days'}</span>
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
                                    <option value="Europe/Riga" ${user.timezone==='Europe/Riga'?'selected':''}>Europe/Riga (UTC+2/+3)</option>
                                    <option value="Europe/London" ${user.timezone==='Europe/London'?'selected':''}>Europe/London (UTC+0/+1)</option>
                                    <option value="Europe/Berlin" ${user.timezone==='Europe/Berlin'?'selected':''}>Europe/Berlin (UTC+1/+2)</option>
                                    <option value="America/New_York" ${user.timezone==='America/New_York'?'selected':''}>America/New_York (UTC-5/-4)</option>
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
                        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px">
                            <button type="button" class="btn btn-secondary" id="prf-cancel">${I18n.t('profile.cancel')}</button>
                            <button type="submit" class="btn btn-primary ripple">${I18n.t('profile.save')}</button>
                        </div>
                    </form>
                </div>

                <!-- Change Password -->
                <div>
                    <div class="card">
                        <div class="card-header"><span class="card-title">🔒 ${I18n.t('profile.changePassword')}</span></div>
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
                    <div class="card" style="margin-top:16px">
                        <div class="card-header"><span class="card-title">📊 ${I18n.getLang()==='lv' ? 'Konta statistika' : 'Account Stats'}</span></div>
                        <div style="display:flex;flex-direction:column;gap:8px;font-size:0.85rem">
                            <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">${I18n.getLang()==='lv' ? 'Reģistrēts' : 'Registered'}</span><span>${Utils.formatDate(user.createdAt)}</span></div>
                            <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">${I18n.t('dashboard.totalTasks')}</span><span>${Store.getTasks(user.id).length}</span></div>
                            <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">${I18n.t('nav.projects')}</span><span>${Store.getProjects(user.id).length}</span></div>
                            <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">${I18n.t('analytics.focusSessions')}</span><span>${Store.getFocusSessions(user.id).filter(s=>s.completed).length}</span></div>
                            <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">${I18n.t('achievements.unlocked')}</span><span>${Store.getUserAchievements(user.id).length}/${Achievements.DEFS.length}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        bindEvents(user);
    }

    function bindEvents(user) {
        // Profile form
        document.getElementById('profile-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const firstName = document.getElementById('prf-first').value.trim();
            const lastName = document.getElementById('prf-last').value.trim();
            const email = document.getElementById('prf-email').value.trim();
            const timezone = document.getElementById('prf-tz').value;
            const language = document.getElementById('prf-lang').value;

            if (!firstName || !lastName || !email) {
                Toast.error(I18n.t('common.error'), I18n.t('error.fillRequired'));
                return;
            }
            if (!Utils.isValidEmail(email)) {
                Toast.error(I18n.t('common.error'), I18n.t('error.emailInvalid'));
                return;
            }

            // Confirm save
            if (!confirm(I18n.t('profile.saveConfirm'))) return;

            Store.updateUser(user.id, { firstName, lastName, email: email.toLowerCase(), timezone, language });

            // Update language if changed
            if (language !== I18n.getLang()) {
                I18n.setLang(language);
            }

            // Update header
            App.updateUserUI();
            Toast.success(I18n.t('common.success'), I18n.t('profile.save'));
            renderPage();
        });

        document.getElementById('prf-cancel')?.addEventListener('click', renderPage);

        // Password strength
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

        // Password change
        document.getElementById('password-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const curr = document.getElementById('prf-curr-pass').value;
            const newP = document.getElementById('prf-new-pass').value;
            const conf = document.getElementById('prf-confirm-pass').value;
            const errEl = document.getElementById('prf-pass-error');
            errEl.textContent = '';

            if (Utils.simpleHash(curr) !== user.password) {
                errEl.textContent = I18n.t('error.loginFailed');
                return;
            }
            if (newP !== conf) {
                errEl.textContent = I18n.t('error.passwordMismatch');
                return;
            }
            if (Utils.checkPasswordStrength(newP).score < 4) {
                errEl.textContent = I18n.t('error.passwordWeak');
                return;
            }

            Store.updateUser(user.id, { password: Utils.simpleHash(newP) });
            Toast.success(I18n.t('common.success'), I18n.t('profile.changePassword'));
            document.getElementById('password-form').reset();
        });

        // Ripple
        document.querySelectorAll('#profile-page .ripple').forEach(b => b.addEventListener('click', Utils.createRipple));
    }

    return { renderPage };
})();
