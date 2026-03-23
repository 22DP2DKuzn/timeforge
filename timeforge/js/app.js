/* ============================================
   TimeForge — App Controller
   Navigation, init, modals, theme, sidebar, search
   ============================================ */

const App = (() => {
    let currentPage = 'dashboard';

    /** Initialize the application */
    function init() {
        // Seed default quotes
        Store.seedQuotes();

        // Init i18n
        I18n.updateDOM();

        // Init auth UI
        Auth.init();

        // Check existing session
        const user = Auth.checkSession();
        if (user) {
            showMainApp(user);
        }

        // Global event listeners
        bindGlobalEvents();
    }

    /** Show main app after login */
    function showMainApp(user) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');

        updateUserUI();
        Achievements.updateLevelUI();
        Notifications.updateBadge();

        // Show admin nav if admin
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = user.role === 'admin' ? 'flex' : 'none';
        });

        // Check deadline notifications
        Notifications.checkDeadlines();
        // Check achievements on login
        Achievements.checkAll(user);

        // Render current page
        navigateTo('dashboard');

        // Periodic deadline check every 5 min
        setInterval(() => Notifications.checkDeadlines(), 300000);
    }

    /** Show auth pages (after logout) */
    function showAuth() {
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('login-page').classList.add('active');
        document.getElementById('register-page').classList.remove('active');
        Quotes.stopRotation();
    }

    /** Navigate to a page */
    function navigateTo(pageName) {
        currentPage = pageName;

        // Update nav active state
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        // Hide all pages, show target
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(pageName + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Render page content
        switch(pageName) {
            case 'dashboard':     Dashboard.renderPage(); break;
            case 'projects':      Projects.renderPage(); break;
            case 'tasks':         Tasks.renderPage(); break;
            case 'calendar':      Calendar.renderPage(); break;
            case 'timer':         Timer.renderPage(); break;
            case 'achievements':  Achievements.renderPage(); break;
            case 'analytics':     Analytics.renderPage(); break;
            case 'notifications': Notifications.renderPage(); break;
            case 'profile':       Profile.renderPage(); break;
            case 'admin':         Admin.renderPage(); break;
        }

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');

        // Scroll to top
        document.querySelector('.page-container')?.scrollTo(0, 0);
    }

    /** Update user info in header/sidebar */
    function updateUserUI() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const initials = (user.firstName[0] || '') + (user.lastName[0] || '');
        const fullName = `${user.firstName} ${user.lastName}`;

        const el = id => document.getElementById(id);
        if (el('user-initials')) el('user-initials').textContent = initials.toUpperCase();
        if (el('dropdown-user-name')) el('dropdown-user-name').textContent = fullName;
        if (el('dropdown-user-email')) el('dropdown-user-email').textContent = user.email;
    }

    /* ========================
       Modal Management
       ======================== */
    function openModal(html) {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        container.innerHTML = html;
        overlay.classList.remove('hidden');

        // Close on overlay click
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal();
        });

        // Close on Escape
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
    function bindGlobalEvents() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                navigateTo(item.dataset.page);
            });
        });

        // Sidebar collapse toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Mobile menu
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

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('tf_theme', next);
        });

        // Restore saved theme
        const savedTheme = localStorage.getItem('tf_theme');
        if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

        // Language toggle
        document.getElementById('lang-toggle')?.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelector('.language-selector').classList.toggle('open');
        });

        document.querySelectorAll('.language-dropdown button').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                I18n.setLang(lang);
                document.querySelectorAll('.language-dropdown button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelector('.language-selector').classList.remove('open');
                // Re-render current page with new language
                navigateTo(currentPage);
            });
        });

        // User menu
        document.getElementById('user-menu-btn')?.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelector('.user-menu').classList.toggle('open');
        });

        // Profile link in dropdown
        document.querySelectorAll('.dropdown-item[data-page]').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                document.querySelector('.user-menu').classList.remove('open');
                navigateTo(item.dataset.page);
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            document.querySelector('.language-selector')?.classList.remove('open');
            document.querySelector('.user-menu')?.classList.remove('open');
        });

        // Logout buttons
        document.getElementById('logout-btn')?.addEventListener('click', e => {
            e.preventDefault();
            Auth.logout();
            showAuth();
        });
        document.getElementById('dropdown-logout')?.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('.user-menu').classList.remove('open');
            Auth.logout();
            showAuth();
        });

        // Notification bell
        document.getElementById('notifications-btn')?.addEventListener('click', () => {
            navigateTo('notifications');
        });

        // Global search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(e => {
                const term = e.target.value.trim();
                if (term.length > 0) {
                    navigateTo('tasks');
                    setTimeout(() => Tasks.setSearch(term), 50);
                }
            }, 400));
        }
    }

    return { init, showMainApp, showAuth, navigateTo, openModal, closeModal, updateUserUI };
})();

// ============================================
// Boot
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
