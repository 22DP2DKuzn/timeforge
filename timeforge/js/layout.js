/* ============================================
   TimeForge — Layout
   Injects sidebar, header, footer into app pages
   ============================================ */

const Layout = (() => {
    const LOGO_SVG = (id) => `
        <svg class="logo-icon" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="url(#${id})" stroke-width="3"/>
            <path d="M20 10V20L27 27" stroke="url(#${id})" stroke-width="3" stroke-linecap="round"/>
            <defs>
                <linearGradient id="${id}" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stop-color="#5641FF"/>
                    <stop offset="100%" stop-color="#FF6CD2"/>
                </linearGradient>
            </defs>
        </svg>`;

    function getSidebarHTML() {
        const user = Store.getCurrentUser();
        const isGuest = !!user && (user.role === 'guest' || user.isGuest === true);
        return `
        <aside id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <a href="dashboard.html" class="logo-link">
                        ${LOGO_SVG('gradSidebar')}
                        <span class="logo-stack">
                            <span class="logo-text">TimeForge</span>
                            <span class="logo-meta">Productivity OS</span>
                        </span>
                    </a>
                </div>
                <button id="sidebar-toggle" class="sidebar-toggle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
            </div>

            <nav class="sidebar-nav">
                <span class="nav-section-label">Galvenā</span>
                <a href="dashboard.html" class="nav-item" data-page="dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <span data-i18n="nav.dashboard">Panelis</span>
                </a>
                <a href="projects.html" class="nav-item" data-page="projects">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span data-i18n="nav.projects">Projekti</span>
                </a>
                <a href="tasks.html" class="nav-item" data-page="tasks">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span data-i18n="nav.tasks">Uzdevumi</span>
                </a>
                <a href="calendar.html" class="nav-item" data-page="calendar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span data-i18n="nav.calendar">Kalendārs</span>
                </a>
                <span class="nav-section-label">Rīki</span>
                <a href="timer.html" class="nav-item" data-page="timer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span data-i18n="nav.timer">Fokusa taimeris</span>
                </a>
                <a href="achievements.html" class="nav-item" data-page="achievements">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="8" r="7"/>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                    </svg>
                    <span data-i18n="nav.achievements">Sasniegumi</span>
                </a>
                <a href="analytics.html" class="nav-item" data-page="analytics">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <span data-i18n="nav.analytics">Analītika</span>
                </a>
                <span class="nav-section-label">Aktivitāte</span>
                <a href="notifications.html" class="nav-item" data-page="notifications">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span data-i18n="nav.notifications">Paziņojumi</span>
                    <span class="nav-badge" id="notification-badge">0</span>
                </a>
                <a href="admin/index.html" target="_blank" class="nav-item admin-only">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span data-i18n="nav.admin">Administrācija</span>
                </a>
            </nav>

            <div class="sidebar-footer">
                <div class="user-level">
                    <div class="level-info">
                        <span class="level-badge">Līm. <span id="user-level">1</span></span>
                        <span class="xp-text"><span id="user-xp">0</span> / <span id="next-level-xp">100</span> XP</span>
                    </div>
                    <div class="level-progress">
                        <div class="level-progress-fill" id="level-progress-fill"></div>
                    </div>
                </div>
                <a href="profile.html" class="nav-item" data-page="profile">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span data-i18n="nav.profile">Profils</span>
                </a>
                <a href="${isGuest ? 'index.html' : '#'}" class="nav-item" id="logout-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>${isGuest ? I18n.t('auth.signInRegister') : I18n.t('nav.logout')}</span>
                </a>
            </div>
        </aside>`;
    }

    function getHeaderHTML() {
        const user = Store.getCurrentUser();
        const isGuest = !!user && (user.role === 'guest' || user.isGuest === true);
        return `
        <header class="main-header">
            <div class="header-left">
                <button id="mobile-menu-btn" class="mobile-menu-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <div class="search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" id="global-search" placeholder="Meklēt..." data-i18n-placeholder="header.search">
                </div>
            </div>
            <div class="header-right">
                <button id="theme-toggle" class="icon-btn" title="Mainīt tēmu">
                    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <svg class="moon-icon hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </button>
                <div class="language-selector">
                    <button id="lang-toggle" class="icon-btn">
                        <span id="current-lang">LV</span>
                    </button>
                    <div class="language-dropdown">
                        <button data-lang="lv" class="active">Latviešu</button>
                        <button data-lang="en">English</button>
                    </div>
                </div>
                <button id="notifications-btn" class="icon-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span class="notification-dot" id="header-notification-dot"></span>
                </button>
                <div class="user-menu">
                    <button id="user-menu-btn" class="user-avatar">
                        <span id="user-initials">JB</span>
                    </button>
                    <div class="user-dropdown">
                        <div class="user-info">
                            <span class="user-name" id="dropdown-user-name"></span>
                            <span class="user-email" id="dropdown-user-email"></span>
                        </div>
                        <hr>
                        <a href="profile.html" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span data-i18n="nav.profile">Profils</span>
                        </a>
                        <a href="${isGuest ? 'index.html' : '#'}" id="dropdown-logout" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            <span>${isGuest ? I18n.t('auth.signInRegister') : I18n.t('nav.logout')}</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>`;
    }

    function getFooterHTML() {
        const user = Store.getCurrentUser();
        const isGuest = !!user && (user.role === 'guest' || user.isGuest === true);
        return `
        <footer class="app-footer">
            <div class="footer-container">
                <div class="footer-top">
                    <div class="footer-brand-col">
                        <div class="footer-logo">
                            <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
                                <circle cx="20" cy="20" r="18" stroke="url(#fGrad)" stroke-width="3"/>
                                <path d="M20 10V20L27 27" stroke="url(#fGrad)" stroke-width="3" stroke-linecap="round"/>
                                <defs>
                                    <linearGradient id="fGrad" x1="0" y1="0" x2="40" y2="40">
                                        <stop offset="0%" stop-color="#5641FF"/>
                                        <stop offset="100%" stop-color="#FF6CD2"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span class="footer-logo-text">TimeForge</span>
                        </div>
                        <p class="footer-desc">Gudrāks darba ritms komandām un individuāliem profesionāļiem. Plānojiet prioritātes, fokusējieties dziļā darbā un sasniedziet vairāk ar skaidru sistēmu.</p>
                        <div class="footer-social">
                            <a href="#" class="social-btn" title="GitHub">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                            </a>
                            <a href="#" class="social-btn" title="Twitter / X">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                            <a href="#" class="social-btn" title="Discord">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                            </a>
                        </div>
                    </div>
                    <div class="footer-nav-cols">
                        <div class="footer-col">
                            <h5>Platforma</h5>
                            <a href="dashboard.html">Panelis</a>
                            <a href="projects.html">Projekti</a>
                            <a href="tasks.html">Uzdevumi</a>
                            <a href="calendar.html">Kalendārs</a>
                        </div>
                        <div class="footer-col">
                            <h5>Produktivitāte</h5>
                            <a href="timer.html">Fokusa taimeris</a>
                            <a href="analytics.html">Analītika</a>
                            <a href="achievements.html">Sasniegumi</a>
                            <a href="notifications.html">Paziņojumi</a>
                        </div>
                        <div class="footer-col">
                            <h5>Konts</h5>
                            <a href="profile.html">Mans profils</a>
                            <a href="${isGuest ? 'index.html' : '#'}" id="footer-logout-btn">${isGuest ? I18n.t('auth.signInRegister') : I18n.t('nav.logout')}</a>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <div class="footer-bottom-left">
                        <span>© 2025 TimeForge.</span>
                        <span class="footer-sep">·</span>
                        <span>Visas tiesības aizsargātas</span>
                    </div>
                    <div class="footer-bottom-right">
                        <a href="#">Privātuma politika</a>
                        <a href="#">Noteikumi</a>
                        <span class="footer-version-pill">v1.0.0</span>
                    </div>
                </div>
            </div>
        </footer>`;
    }

    function inject() {
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.insertAdjacentHTML('afterbegin', getSidebarHTML());
        }
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', getHeaderHTML());
        }
        // Footer goes AFTER page-container, not inside it
        const pageContainer = document.querySelector('.page-container');
        if (pageContainer) {
            pageContainer.insertAdjacentHTML('afterend', getFooterHTML());
        }
    }

    return { inject };
})();
