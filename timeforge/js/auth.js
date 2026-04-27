/* ============================================
   TimeForge — Auth
   Register, Login, Logout, Session (PHP API)
   ============================================ */

const Auth = (() => {
    const API = 'api/auth';
    const GUEST_USER = Object.freeze({
        id: 'guest',
        firstName: 'Guest',
        lastName: 'User',
        email: 'guest@timeforge.local',
        role: 'guest',
        xp: 0,
        level: 1,
        streak: 0,
        language: localStorage.getItem('tf_lang') || 'lv',
        timezone: 'Europe/Riga',
        blocked: false,
        lastActiveDate: null,
        createdAt: null,
        isGuest: true,
    });

    /* --- Register --- */
    async function register(firstName, lastName, email, password) {
        if (!firstName || !lastName || !email || !password) {
            return { ok: false, error: 'error.fillRequired' };
        }
        if (!Utils.isValidEmail(email)) {
            return { ok: false, error: 'error.emailInvalid' };
        }
        const strength = Utils.checkPasswordStrength(password);
        if (strength.score < 4) {
            return { ok: false, error: 'error.passwordWeak' };
        }
        try {
            const res = await fetch(`${API}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });
            return await res.json();
        } catch {
            return { ok: false, error: 'error.serverError' };
        }
    }

    /* --- Login --- */
    async function login(email, password) {
        if (!email || !password) {
            return { ok: false, error: 'error.fillRequired' };
        }
        try {
            const res = await fetch(`${API}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.ok) {
                Store.setCurrentUser(data.user);
                await Store.hydrate();
            }
            return data;
        } catch {
            return { ok: false, error: 'error.serverError' };
        }
    }

    /* --- Logout --- */
    async function logout() {
        try {
            await fetch(`${API}/logout.php`, { method: 'POST' });
        } catch { /* ignore */ }
        Store.clearAppData();
    }

    /* --- Check session --- */
    async function checkSession() {
        try {
            const res = await fetch(`${API}/check.php`);
            const data = await res.json();
            if (data.ok) {
                Store.setCurrentUser(data.user);
                return data.user;
            }
        } catch { /* ignore */ }
        Store.clearCurrentUser();
        return null;
    }

    function getGuestUser() {
        return Object.assign({}, GUEST_USER, {
            language: localStorage.getItem('tf_lang') || GUEST_USER.language,
        });
    }

    /* --- Init auth UI --- */
    function init() {
        const loginForm    = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegister = document.getElementById('show-register');
        const showLogin    = document.getElementById('show-login');
        const continueGuest = document.getElementById('continue-as-guest');
        const loginPage    = document.getElementById('login-page');
        const registerPage = document.getElementById('register-page');

        // Toggle pages
        showRegister.addEventListener('click', e => {
            e.preventDefault();
            loginPage.classList.remove('active');
            registerPage.classList.add('active');
        });
        showLogin.addEventListener('click', e => {
            e.preventDefault();
            registerPage.classList.remove('active');
            loginPage.classList.add('active');
        });
        continueGuest?.addEventListener('click', () => {
            Store.clearAppData();
            Store.setCurrentUser(getGuestUser());
            window.location.href = 'dashboard.html';
        });

        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.querySelector('.eye-open').classList.toggle('hidden', !isPassword);
                btn.querySelector('.eye-closed').classList.toggle('hidden', isPassword);
            });
        });

        // Password strength indicator on register
        const passInput = document.getElementById('register-password');
        if (passInput) {
            passInput.addEventListener('input', () => {
                const val = passInput.value;
                const { score, checks } = Utils.checkPasswordStrength(val);
                const fill = passInput.closest('.form-group').querySelector('.strength-fill');
                const text = passInput.closest('.form-group').querySelector('.strength-text');
                const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80'];
                const labels = { lv: ['Vāja', 'Vidēja', 'Laba', 'Stipra'], en: ['Weak', 'Fair', 'Good', 'Strong'] };
                fill.style.width = (score * 25) + '%';
                fill.style.background = colors[score - 1] || '#f43f5e';
                const lang = I18n.getLang();
                text.textContent = score > 0
                    ? (labels[lang] || labels.lv)[score - 1]
                    : I18n.t('form.passwordStrength');

                document.getElementById('req-length').classList.toggle('met', checks.length);
                document.getElementById('req-upper').classList.toggle('met', checks.upper);
                document.getElementById('req-number').classList.toggle('met', checks.number);
                document.getElementById('req-special').classList.toggle('met', checks.special);
            });
        }

        // Login form submit
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email    = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const btn      = loginForm.querySelector('button[type="submit"]');
            btn.disabled   = true;

            const result = await login(email, password);
            btn.disabled = false;

            if (result.ok) {
                Toast.success(I18n.t('common.success'), I18n.t('login.title'));
                loginForm.reset();
                window.location.href = 'dashboard.html';
            } else {
                Toast.error(I18n.t('common.error'), I18n.t(result.error));
            }
        });

        // Register form submit
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const firstName = document.getElementById('register-firstname').value.trim();
            const lastName  = document.getElementById('register-lastname').value.trim();
            const email     = document.getElementById('register-email').value.trim();
            const password  = document.getElementById('register-password').value;
            const confirm   = document.getElementById('register-confirm').value;
            const btn       = registerForm.querySelector('button[type="submit"]');

            document.getElementById('email-error').textContent    = '';
            document.getElementById('password-error').textContent = '';
            document.getElementById('confirm-error').textContent  = '';

            if (password !== confirm) {
                document.getElementById('confirm-error').textContent = I18n.t('error.passwordMismatch');
                return;
            }

            btn.disabled = true;
            const result = await register(firstName, lastName, email, password);
            btn.disabled = false;

            if (result.ok) {
                Toast.success(I18n.t('common.success'), I18n.t('register.title'));
                registerForm.reset();
                registerPage.classList.remove('active');
                loginPage.classList.add('active');
            } else {
                const errMsg = I18n.t(result.error);
                if (result.error === 'error.emailInvalid' || result.error === 'error.emailExists') {
                    document.getElementById('email-error').textContent = errMsg;
                } else if (result.error === 'error.passwordWeak') {
                    document.getElementById('password-error').textContent = errMsg;
                } else {
                    Toast.error(I18n.t('common.error'), errMsg);
                }
            }
        });

        // Ripple on auth buttons
        document.querySelectorAll('.ripple').forEach(btn => {
            btn.addEventListener('click', Utils.createRipple);
        });
    }

    return { register, login, logout, checkSession, getGuestUser, init };
})();
