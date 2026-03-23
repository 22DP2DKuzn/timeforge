/* ============================================
   TimeForge — Utils
   Date formatting, validation, DOM helpers, ID gen
   ============================================ */

const Utils = (() => {

    /** Generate unique ID */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    /** Format date to locale string */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString(I18n.getLang() === 'lv' ? 'lv-LV' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    /** Format date as YYYY-MM-DD */
    function toISODate(date) {
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().split('T')[0];
    }

    /** Format time HH:MM */
    function formatTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    }

    /** Format seconds as MM:SS */
    function formatTimerTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    /** Format relative time */
    function timeAgo(dateStr) {
        const now = new Date();
        const then = new Date(dateStr);
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return I18n.getLang() === 'lv' ? 'tikko' : 'just now';
        if (diff < 3600) return `${Math.floor(diff/60)} min`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h`;
        if (diff < 604800) return `${Math.floor(diff/86400)}d`;
        return formatDate(dateStr);
    }

    /** Validate email format */
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /** Check password strength, returns {score:0-4, checks:{length,upper,number,special}} */
    function checkPasswordStrength(pass) {
        const checks = {
            length: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            number: /\d/.test(pass),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
        };
        const score = Object.values(checks).filter(Boolean).length;
        return { score, checks };
    }

    /** Simple hash for demo password storage (NOT real bcrypt!) */
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash |= 0;
        }
        return 'tf_' + Math.abs(hash).toString(36) + '_' + str.length;
    }

    /** Create ripple effect on button */
    function createRipple(event) {
        const btn = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;
        const rect = btn.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple-wave');
        const old = btn.querySelector('.ripple-wave');
        if (old) old.remove();
        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
    }

    /** Debounce function */
    function debounce(fn, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /** Get day names array for current language */
    function getDayNames() {
        const lv = ['Pr','Ot','Tr','Ce','Pk','Se','Sv'];
        const en = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        return I18n.getLang() === 'lv' ? lv : en;
    }

    /** Get month name */
    function getMonthName(monthIndex) {
        const months = I18n.t('calendar.months');
        return Array.isArray(months) ? months[monthIndex] : '';
    }

    /** Get days in month */
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /** Get first day of month (0=Sun, adjusted to Mon=0) */
    function getFirstDayOfMonth(year, month) {
        let d = new Date(year, month, 1).getDay();
        return d === 0 ? 6 : d - 1; // Monday first
    }

    /** Check if same day */
    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    /** Escape HTML */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /** Query shorthand */
    function $(sel, ctx = document) { return ctx.querySelector(sel); }
    function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

    return {
        generateId, formatDate, toISODate, formatTime, formatTimerTime,
        timeAgo, isValidEmail, checkPasswordStrength, simpleHash,
        createRipple, debounce, getDayNames, getMonthName,
        getDaysInMonth, getFirstDayOfMonth, isSameDay, escapeHtml, $, $$
    };
})();
