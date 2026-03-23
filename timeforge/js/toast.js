/* ============================================
   TimeForge — Toast Notifications
   ============================================ */

const Toast = (() => {
    const container = document.getElementById('toast-container');
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };

    /**
     * Show a toast notification
     * @param {string} type - success|error|warning|info
     * @param {string} title
     * @param {string} message
     * @param {number} duration - ms (default 4000)
     */
    function show(type, title, message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '🔔'}</span>
            <div class="toast-body">
                <div class="toast-title">${Utils.escapeHtml(title)}</div>
                <div class="toast-message">${Utils.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" aria-label="Close">✕</button>
            <div class="toast-progress" style="animation-duration:${duration}ms"></div>
        `;

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));

        container.appendChild(toast);

        // Auto remove
        const timer = setTimeout(() => removeToast(toast), duration);
        toast._timer = timer;
    }

    function removeToast(toast) {
        if (toast._removing) return;
        toast._removing = true;
        clearTimeout(toast._timer);
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    /** Shorthand methods */
    function success(title, msg) { show('success', title, msg); }
    function error(title, msg) { show('error', title, msg); }
    function warning(title, msg) { show('warning', title, msg); }
    function info(title, msg) { show('info', title, msg); }

    return { show, success, error, warning, info };
})();
