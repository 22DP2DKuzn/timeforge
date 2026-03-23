/* ============================================
   TimeForge — Auth
   Register, Login, Logout, Session (JWT-like)
   ============================================ */

const Auth = (() => {
    const TOKEN_KEY = 'tf_token';
    const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

    /* --- Token management --- */
    function createToken(userId) {
        const token = {
            userId,
            created: Date.now(),
            expires: Date.now() + TOKEN_EXPIRY
        };
        localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
        return token;
    }

    function getToken() {
        try {
            const t = JSON.parse(localStorage.getItem(TOKEN_KEY));
            if (t && t.expires > Date.now()) return t;
            localStorage.removeItem(TOKEN_KEY);
            return null;
        } catch { return null; }
    }

    function clearToken() { localStorage.removeItem(TOKEN_KEY); }

    /* --- Register --- */
    function register(firstName, lastName, email, password) {
        // Validate
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
        const user = Store.createUser({ firstName, lastName, email, password });
        if (!user) {
            return { ok: false, error: 'error.emailExists' };
        }
        Store.logActivity(user.id, 'register', `User registered: ${email}`);
        return { ok: true, user };
    }

    /* --- Login --- */
    function login(email, password) {
        if (!email || !password) {
            return { ok: false, error: 'error.fillRequired' };
        }
        const user = Store.getUserByEmail(email);
        if (!user) {
            return { ok: false, error: 'error.loginFailed' };
        }
        if (user.blocked) {
            return { ok: false, error: 'error.loginFailed' };
        }
        if (user.password !== Utils.simpleHash(password)) {
            return { ok: false, error: 'error.loginFailed' };
        }
        createToken(user.id);
        Store.setCurrentUser(user);

        // Update streak
        const today = Utils.toISODate(new Date());
        if (user.lastActiveDate !== today) {
            const yesterday = Utils.toISODate(new Date(Date.now() - 86400000));
            const streak = user.lastActiveDate === yesterday ? (user.streak || 0) + 1 : 1;
            Store.updateUser(user.id, { lastActiveDate: today, streak });
        }

        Store.logActivity(user.id, 'login', `User logged in: ${email}`);
        return { ok: true, user };
    }

    /* --- Logout --- */
    function logout() {
        const user = Store.getCurrentUser();
        if (user) Store.logActivity(user.id, 'logout', 'User logged out');
        clearToken();
        Store.clearCurrentUser();
    }

    /* --- Check session --- */
    function checkSession() {
        const token = getToken();
        if (!token) return null;
        const user = Store.getCurrentUser();
        if (!user || user.id !== token.userId) {
            clearToken();
            Store.clearCurrentUser();
            return null;
        }
        return user;
    }

    /* --- Init auth UI --- */
    function init() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        const loginPage = document.getElementById('login-page');
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
                const colors = ['#f43f5e','#fb923c','#facc15','#4ade80'];
                const labels = { lv:['Vāja','Vidēja','Laba','Stipra'], en:['Weak','Fair','Good','Strong'] };
                const pct = score * 25;
                fill.style.width = pct + '%';
                fill.style.background = colors[score - 1] || '#f43f5e';
                const lang = I18n.getLang();
                text.textContent = score > 0 ? (labels[lang] || labels.lv)[score - 1] : I18n.t('form.passwordStrength');

                // Requirement checks
                document.getElementById('req-length').classList.toggle('met', checks.length);
                document.getElementById('req-upper').classList.toggle('met', checks.upper);
                document.getElementById('req-number').classList.toggle('met', checks.number);
                document.getElementById('req-special').classList.toggle('met', checks.special);
            });
        }

        // Login form submit
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const result = login(email, password);
            if (result.ok) {
                Toast.success(I18n.t('common.success'), I18n.t('login.title'));
                loginForm.reset();
                App.showMainApp(result.user);
            } else {
                Toast.error(I18n.t('common.error'), I18n.t(result.error));
            }
        });

        // Register form submit
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const firstName = document.getElementById('register-firstname').value.trim();
            const lastName = document.getElementById('register-lastname').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;

            // Clear errors
            document.getElementById('email-error').textContent = '';
            document.getElementById('password-error').textContent = '';
            document.getElementById('confirm-error').textContent = '';

            if (password !== confirm) {
                document.getElementById('confirm-error').textContent = I18n.t('error.passwordMismatch');
                return;
            }

            const result = register(firstName, lastName, email, password);
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

    return { register, login, logout, checkSession, init };
})();
