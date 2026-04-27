/* ============================================
   TimeForge — App Controller (MPA)
   Per-page init, modals, theme, sidebar, search
   ============================================ */

const App = (() => {
    function isGuestUser(user = Store.getCurrentUser()) {
        return !!user && (user.role === 'guest' || user.isGuest === true);
    }

    function requireAccount() {
        Toast.error(I18n.t('common.error'), I18n.t('auth.registerRequired'));
    }

    async function init() {
        const savedTheme = localStorage.getItem('tf_theme');
        if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

        I18n.updateDOM();

        const pageName = document.body.dataset.page;
        if (!pageName) return;

        const user = await Auth.checkSession();
        const activeUser = user || Auth.getGuestUser();

        if (!user) {
            Store.clearAppData();
            Store.setCurrentUser(activeUser);
        } else {
            Store.setCurrentUser(activeUser);
            await Store.hydrate();
        }

        Layout.inject();
        I18n.updateDOM();

        updateUserUI();
        Achievements.updateLevelUI();
        Notifications.updateBadge();

        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = activeUser.role === 'admin' ? 'flex' : 'none';
        });

        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        if (!isGuestUser(activeUser)) {
            Notifications.checkDeadlines();
            Achievements.checkAll(activeUser);
        }

        renderPage(pageName);
        applyGuestMode(activeUser);

        // Reveal app, hide loader
        const loader = document.getElementById('app-loader');
        const mainApp = document.getElementById('main-app');
        if (loader) loader.remove();
        if (mainApp) mainApp.style.display = '';

        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        if (searchTerm && pageName === 'tasks') {
            const inp = document.getElementById('global-search');
            if (inp) inp.value = searchTerm;
            Tasks.setSearch(searchTerm);
        }

        bindGlobalEvents(pageName);

        if (!isGuestUser(activeUser)) {
            setInterval(() => Notifications.checkDeadlines(), 300000);
        }
    }

    function renderPage(pageName) {
        switch (pageName) {
            case 'dashboard':     Dashboard.renderPage(); break;
            case 'projects':      Projects.renderPage(); break;
            case 'tasks':         Tasks.renderPage(); break;
            case 'calendar':      Calendar.renderPage(); break;
            case 'timer':         Timer.renderPage(); break;
            case 'achievements':  Achievements.renderPage(); break;
            case 'analytics':     Analytics.renderPage(); break;
            case 'notifications': Notifications.renderPage(); break;
            case 'profile':       Profile.renderPage(); break;
        }
    }

    function updateUserUI() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const initials = (user.firstName[0] || '') + (user.lastName[0] || '');
        const fullName = `${user.firstName} ${user.lastName}`;
        const el = id => document.getElementById(id);
        if (el('user-initials'))       el('user-initials').textContent       = initials.toUpperCase();
        if (el('dropdown-user-name'))  el('dropdown-user-name').textContent  = fullName;
        if (el('dropdown-user-email')) el('dropdown-user-email').textContent = user.email;
    }

    function applyGuestMode(user) {
        document.body.classList.toggle('guest-mode', isGuestUser(user));
        if (!isGuestUser(user) || document.getElementById('guest-mode-banner')) return;

        const header = document.querySelector('.main-header');
        if (!header) return;

        header.insertAdjacentHTML('afterend', `
            <div class="guest-mode-banner" id="guest-mode-banner">
                <strong>${I18n.t('auth.guestMode')}</strong>
                <span>${I18n.t('auth.registerPrompt')}</span>
                <a href="index.html">${I18n.t('auth.signInRegister')}</a>
            </div>
        `);
    }

    /* ========================
       Modal Management
       ======================== */
    function openModal(html) {
        const overlay   = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        container.innerHTML = html;
        overlay.classList.remove('hidden');

        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal();
        });

        const escHandler = e => {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-container').innerHTML = '';
    }

    /* ========================
       Global Event Bindings
       ======================== */
    function bindGlobalEvents(pageName) {
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', () => {
                    document.getElementById('sidebar').classList.remove('mobile-open');
                    overlay.classList.remove('show');
                });
            }
            overlay.classList.toggle('show');
        });

        const themeToggle = document.getElementById('theme-toggle');
        const syncThemeToggle = (theme) => {
            if (!themeToggle) return;
            const sunIcon = themeToggle.querySelector('.sun-icon');
            const moonIcon = themeToggle.querySelector('.moon-icon');
            if (sunIcon && moonIcon) {
                sunIcon.classList.toggle('hidden', theme === 'light');
                moonIcon.classList.toggle('hidden', theme === 'dark');
            }
            themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            themeToggle.setAttribute('title', theme === 'dark' ? 'Gaiša tēma' : 'Tumša tēma');
        };

        themeToggle?.addEventListener('click', () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('tf_theme', next);
            syncThemeToggle(next);
        });

        syncThemeToggle(localStorage.getItem('tf_theme') || 'dark');

        document.getElementById('lang-toggle')?.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelector('.language-selector').classList.toggle('open');
        });

        const savedLang = localStorage.getItem('tf_lang') || 'lv';
        document.getElementById('current-lang').textContent = savedLang.toUpperCase();
        document.querySelectorAll('.language-dropdown button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === savedLang);
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                I18n.setLang(lang);
                document.getElementById('current-lang').textContent = lang.toUpperCase();
                document.querySelectorAll('.language-dropdown button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelector('.language-selector').classList.remove('open');
                renderPage(pageName);
                I18n.updateDOM();
            });
        });

        document.getElementById('user-menu-btn')?.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelector('.user-menu').classList.toggle('open');
        });

        document.addEventListener('click', () => {
            document.querySelector('.language-selector')?.classList.remove('open');
            document.querySelector('.user-menu')?.classList.remove('open');
        });

        const doLogout = async e => {
            e.preventDefault();
            if (isGuestUser()) {
                Store.clearAppData();
            } else {
                await Auth.logout();
            }
            window.location.href = 'index.html';
        };
        document.getElementById('logout-btn')?.addEventListener('click', doLogout);
        document.getElementById('dropdown-logout')?.addEventListener('click', doLogout);
        document.getElementById('footer-logout-btn')?.addEventListener('click', doLogout);

        document.getElementById('notifications-btn')?.addEventListener('click', () => {
            window.location.href = 'notifications.html';
        });

        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(e => {
                const term = e.target.value.trim();
                if (!term) return;
                if (pageName === 'tasks') {
                    Tasks.setSearch(term);
                } else {
                    window.location.href = `tasks.html?search=${encodeURIComponent(term)}`;
                }
            }, 400));
        }

        document.addEventListener('click', e => {
            if (!isGuestUser()) return;
            const blocked = e.target.closest('[data-requires-auth="true"]');
            if (!blocked) return;
            e.preventDefault();
            e.stopPropagation();
            requireAccount();
        }, true);

        document.addEventListener('submit', e => {
            if (!isGuestUser()) return;
            if (!e.target.closest('[data-requires-auth="true"]')) return;
            e.preventDefault();
            e.stopPropagation();
            requireAccount();
        }, true);

        document.addEventListener('change', e => {
            if (!isGuestUser()) return;
            if (!e.target.closest('[data-requires-auth="true"]')) return;
            e.preventDefault();
            e.stopPropagation();
            requireAccount();
            renderPage(pageName);
        }, true);
    }

    return { init, isGuestUser, requireAccount, updateUserUI, openModal, closeModal };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
