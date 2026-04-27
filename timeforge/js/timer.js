/* ============================================
   TimeForge — Focus Timer (Pomodoro)
   Circular progress, settings, task link, sessions
   ============================================ */

const Timer = (() => {
    const CIRC = 2 * Math.PI * 130; // circumference for r=130 SVG circle
    let state = {
        running: false,
        paused: false,
        phase: 'work', // work | shortBreak | longBreak
        secondsLeft: 25 * 60,
        totalSeconds: 25 * 60,
        completedSessions: 0,
        linkedTaskId: null,
        startedAt: null,
    };
    let interval = null;

    let settings = {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsBeforeLong: 4,
        soundEnabled: true,
    };

    /** Render timer page */
    function renderPage() {
        const user = Store.getCurrentUser();
        if (!user) return;
        const isGuest = App.isGuestUser(user);
        const page = document.getElementById('timer-page');
        const tasks = Store.getTasks(user.id).filter(t => t.status !== 'completed' && t.status !== 'cancelled');
        const todaySessions = Store.getFocusSessions(user.id).filter(s => s.type === 'work' && s.completed && s.createdAt.startsWith(Utils.toISODate(new Date())));
        const totalMin = todaySessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

        const phaseLabel = state.phase === 'work' ? I18n.t('timer.work') :
                           state.phase === 'shortBreak' ? I18n.t('timer.shortBreak') : I18n.t('timer.longBreak');

        page.innerHTML = `
            <div class="site-page site-page-timer">
            <section class="page-hero">
                <div class="page-hero-main">
                    <span class="page-eyebrow">${I18n.getLang() === 'lv' ? 'Fokuss' : 'Focus'}</span>
                    <h1>${I18n.t('timer.title')}</h1>
                    <p>${I18n.getLang() === 'lv'
                        ? 'Izmantojiet strukturētas darba sesijas, lai noturētu ritmu un sasaistītu fokusu ar reāliem uzdevumiem.'
                        : 'Use structured work sessions to keep momentum and connect focus time to real tasks.'
                    }</p>
                </div>
                <div class="page-metrics">
                    <div class="metric-chip"><strong>${todaySessions.length}</strong><span>${I18n.getLang() === 'lv' ? 'sesijas šodien' : 'sessions today'}</span></div>
                    <div class="metric-chip"><strong>${totalMin}</strong><span>${I18n.t('timer.min')}</span></div>
                    <div class="metric-chip"><strong>${settings.workDuration}</strong><span>${I18n.getLang() === 'lv' ? 'darba cikls' : 'work cycle'}</span></div>
                </div>
            </section>
            <section class="section-panel">
            <div class="timer-layout">
                <div class="card">
                    <div class="timer-display">
                        <div class="timer-circle-wrapper" id="timer-circle-wrapper">
                            <svg class="timer-svg" viewBox="0 0 280 280">
                                <defs>
                                    <linearGradient id="timerGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stop-color="#5641FF"/>
                                        <stop offset="100%" stop-color="#FF6CD2"/>
                                    </linearGradient>
                                </defs>
                                <circle class="timer-track" cx="140" cy="140" r="130"/>
                                <circle class="timer-progress-ring" id="timer-ring" cx="140" cy="140" r="130"
                                    stroke-dasharray="${CIRC}" stroke-dashoffset="0"/>
                            </svg>
                            <div class="timer-center">
                                <div class="timer-time" id="timer-display">${Utils.formatTimerTime(state.secondsLeft)}</div>
                                <div class="timer-label" id="timer-phase-label">${phaseLabel}</div>
                            </div>
                        </div>
                        <div class="timer-sessions" id="timer-session-dots">
                            ${renderSessionDots()}
                        </div>
                        <div class="timer-controls">
                            ${!state.running ? `
                                <button class="timer-btn timer-btn-primary" id="timer-start-btn" data-requires-auth="true" title="${I18n.t('timer.start')}">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                </button>
                            ` : `
                                <button class="timer-btn timer-btn-secondary" id="timer-stop-btn" data-requires-auth="true" title="${I18n.t('timer.stop')}">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                </button>
                                ${state.paused ? `
                                    <button class="timer-btn timer-btn-primary" id="timer-resume-btn" data-requires-auth="true" title="${I18n.t('timer.resume')}">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    </button>
                                ` : `
                                    <button class="timer-btn timer-btn-primary" id="timer-pause-btn" data-requires-auth="true" title="${I18n.t('timer.pause')}">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                    </button>
                                `}
                                <button class="timer-btn timer-btn-secondary" id="timer-reset-btn" data-requires-auth="true" title="${I18n.t('timer.reset')}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                                </button>
                            `}
                        </div>
                        <div class="timer-task-link" id="timer-task-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            <select id="timer-task-select" data-requires-auth="true">
                                <option value="">${I18n.t('timer.selectTask')}</option>
                                ${tasks.map(t => `<option value="${t.id}" ${state.linkedTaskId === t.id ? 'selected' : ''}>${Utils.escapeHtml(t.name)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="timer-quote-container"></div>
                </div>
                <div>
                    <div class="timer-settings">
                        <h3>⚙️ ${I18n.t('timer.settings')}</h3>
                        <div class="timer-setting-row">
                            <span class="timer-setting-label">${I18n.t('timer.workDuration')}</span>
                            <div class="timer-setting-control">
                                <input type="number" id="ts-work" value="${settings.workDuration}" min="1" max="120" data-requires-auth="true">
                                <span class="timer-setting-unit">${I18n.t('timer.min')}</span>
                            </div>
                        </div>
                        <div class="timer-setting-row">
                            <span class="timer-setting-label">${I18n.t('timer.shortBreakDuration')}</span>
                            <div class="timer-setting-control">
                                <input type="number" id="ts-short" value="${settings.shortBreak}" min="1" max="30" data-requires-auth="true">
                                <span class="timer-setting-unit">${I18n.t('timer.min')}</span>
                            </div>
                        </div>
                        <div class="timer-setting-row">
                            <span class="timer-setting-label">${I18n.t('timer.longBreakDuration')}</span>
                            <div class="timer-setting-control">
                                <input type="number" id="ts-long" value="${settings.longBreak}" min="1" max="60" data-requires-auth="true">
                                <span class="timer-setting-unit">${I18n.t('timer.min')}</span>
                            </div>
                        </div>
                        <div class="timer-setting-row">
                            <span class="timer-setting-label">${I18n.t('timer.sessionsBeforeLong')}</span>
                            <div class="timer-setting-control">
                                <input type="number" id="ts-sessions" value="${settings.sessionsBeforeLong}" min="1" max="10" data-requires-auth="true">
                            </div>
                        </div>
                        <div class="timer-setting-row">
                            <span class="timer-setting-label">${I18n.t('timer.sound')}</span>
                            <label class="switch">
                                <input type="checkbox" id="ts-sound" ${settings.soundEnabled ? 'checked' : ''} data-requires-auth="true">
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="timer-settings timer-stats" style="margin-top:16px">
                        <h3>📊 ${I18n.t('timer.todaySessions')}</h3>
                        <div class="timer-stat-row">
                            <span>${I18n.t('timer.todaySessions')}</span>
                            <span>${todaySessions.length}</span>
                        </div>
                        <div class="timer-stat-row">
                            <span>${I18n.t('timer.totalTime')}</span>
                            <span>${totalMin} ${I18n.t('timer.min')}</span>
                        </div>
                    </div>
                    ${isGuest ? `
                        <div class="timer-settings" style="margin-top:16px;border:1px dashed var(--border-color)">
                            <h3>${I18n.t('auth.guestMode')}</h3>
                            <p>${I18n.t('auth.registerPrompt')}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            </section>
            </div>
        `;

        Quotes.renderTimerQuote(document.getElementById('timer-quote-container'));
        bindTimerEvents();
        updateRing();
    }

    function renderSessionDots() {
        let html = '';
        for (let i = 0; i < settings.sessionsBeforeLong; i++) {
            const cls = i < state.completedSessions ? 'completed' :
                        (i === state.completedSessions && state.phase === 'work' && state.running) ? 'current' : '';
            html += `<div class="session-dot ${cls}"></div>`;
        }
        return html;
    }

    function bindTimerEvents() {
        document.getElementById('timer-start-btn')?.addEventListener('click', startTimer);
        document.getElementById('timer-pause-btn')?.addEventListener('click', pauseTimer);
        document.getElementById('timer-resume-btn')?.addEventListener('click', resumeTimer);
        document.getElementById('timer-stop-btn')?.addEventListener('click', stopTimer);
        document.getElementById('timer-reset-btn')?.addEventListener('click', resetTimer);

        document.getElementById('timer-task-select')?.addEventListener('change', e => {
            state.linkedTaskId = e.target.value || null;
        });

        // Settings changes (only when not running)
        ['ts-work','ts-short','ts-long','ts-sessions'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', e => {
                if (state.running) return;
                const val = parseInt(e.target.value);
                if (id === 'ts-work') { settings.workDuration = val; }
                else if (id === 'ts-short') { settings.shortBreak = val; }
                else if (id === 'ts-long') { settings.longBreak = val; }
                else if (id === 'ts-sessions') { settings.sessionsBeforeLong = val; }
                resetTimer();
            });
        });
        document.getElementById('ts-sound')?.addEventListener('change', e => {
            settings.soundEnabled = e.target.checked;
        });
    }

    function startTimer() {
        if (App.isGuestUser()) return App.requireAccount();
        state.running = true;
        state.paused = false;
        state.phase = 'work';
        state.totalSeconds = settings.workDuration * 60;
        state.secondsLeft = state.totalSeconds;
        state.startedAt = new Date().toISOString();
        tick();
        renderPage();
    }

    function pauseTimer() {
        if (App.isGuestUser()) return App.requireAccount();
        state.paused = true;
        clearInterval(interval);
        renderPage();
    }

    function resumeTimer() {
        if (App.isGuestUser()) return App.requireAccount();
        state.paused = false;
        tick();
        renderPage();
    }

    function stopTimer() {
        if (App.isGuestUser()) return App.requireAccount();
        clearInterval(interval);
        // Save incomplete session
        saveSession(false);
        state.running = false;
        state.paused = false;
        state.phase = 'work';
        state.secondsLeft = settings.workDuration * 60;
        state.totalSeconds = state.secondsLeft;
        renderPage();
    }

    function resetTimer() {
        if (App.isGuestUser()) return App.requireAccount();
        clearInterval(interval);
        state.running = false;
        state.paused = false;
        state.completedSessions = 0;
        state.phase = 'work';
        state.secondsLeft = settings.workDuration * 60;
        state.totalSeconds = state.secondsLeft;
        renderPage();
    }

    function tick() {
        clearInterval(interval);
        interval = setInterval(() => {
            state.secondsLeft--;
            updateDisplay();
            updateRing();

            // Urgency effect last 5 seconds
            const wrapper = document.getElementById('timer-circle-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('urgent', state.secondsLeft <= 5 && state.secondsLeft > 0);
            }

            if (state.secondsLeft <= 0) {
                clearInterval(interval);
                onPhaseComplete();
            }
        }, 1000);
    }

    function updateDisplay() {
        const el = document.getElementById('timer-display');
        if (el) el.textContent = Utils.formatTimerTime(state.secondsLeft);
    }

    function updateRing() {
        const ring = document.getElementById('timer-ring');
        if (!ring) return;
        const progress = state.totalSeconds > 0 ? (state.totalSeconds - state.secondsLeft) / state.totalSeconds : 0;
        ring.style.strokeDashoffset = CIRC * (1 - progress);
    }

    function onPhaseComplete() {
        if (settings.soundEnabled) playSound();

        if (state.phase === 'work') {
            saveSession(true);
            state.completedSessions++;
            Achievements.checkAll(Store.getCurrentUser());

            // Notification
            const user = Store.getCurrentUser();
            if (user) {
                Store.createNotification({
                    userId: user.id, type: 'focus',
                    title: I18n.t('notifications.focusComplete'),
                    message: `${settings.workDuration} ${I18n.t('timer.min')}`,
                    icon: '⏱️'
                });
            }

            // Determine next phase
            if (state.completedSessions >= settings.sessionsBeforeLong) {
                state.phase = 'longBreak';
                state.totalSeconds = settings.longBreak * 60;
                state.completedSessions = 0;
            } else {
                state.phase = 'shortBreak';
                state.totalSeconds = settings.shortBreak * 60;
            }
        } else {
            // Break ended, start work
            state.phase = 'work';
            state.totalSeconds = settings.workDuration * 60;
            state.startedAt = new Date().toISOString();
        }

        state.secondsLeft = state.totalSeconds;
        Toast.info('⏱️', state.phase === 'work' ? I18n.t('timer.work') :
                         state.phase === 'shortBreak' ? I18n.t('timer.shortBreak') : I18n.t('timer.longBreak'));
        renderPage();
        tick(); // Auto-continue
    }

    function saveSession(completed) {
        const user = Store.getCurrentUser();
        if (!user) return;
        const elapsed = state.totalSeconds - state.secondsLeft;
        if (elapsed < 5) return; // Don't save trivial sessions
        Store.createFocusSession({
            userId: user.id,
            taskId: state.linkedTaskId,
            startTime: state.startedAt,
            endTime: new Date().toISOString(),
            duration: elapsed,
            type: state.phase,
            completed
        });
    }

    function playSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    return { renderPage };
})();
