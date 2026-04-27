/* ============================================
   TimeForge — Live AI Pet (runs around the page)
   Free AI via Google Gemini 1.5 Flash
   ============================================ */

const PetAssistant = (() => {
    const SETTINGS_KEY = 'tf_pet_settings';
    const HISTORY_KEY  = 'tf_pet_history';
    const MAX_HISTORY  = 10;

    const defaults = { type: 'fox', name: 'Nova', accent: '#7B5EFF' };

    const PETS = {
        fox:    { emoji: '🦊', style: 'quick, witty, practical' },
        cat:    { emoji: '🐱', style: 'gentle, cozy, reassuring' },
        rabbit: { emoji: '🐰', style: 'energetic, motivating, playful' },
        owl:    { emoji: '🦉', style: 'calm, wise, strategic' },
        dragon: { emoji: '🐲', style: 'bold, inspiring, powerful' },
    };

    /* ─── state ──────────────────────────────── */
    let settings = { ...defaults };
    let history  = [];
    let thinking = false;
    let chatOpen = false;

    /* ─── movement ───────────────────────────── */
    let pos    = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let moveState  = 'idle';   // idle | walk | run
    let facingLeft = false;
    let idleTimer  = null;
    let animFrame  = null;
    let lastRender = 0;

    /* ─── speech bubbles ─────────────────────── */
    const IDLE_LINES = [
        'Sveiks! Ko darām šodien? 👋',
        'Atceries dzert ūdeni! 💧',
        'Fokusa laiks? Palīdzēšu!',
        'Tavi uzdevumi gaida ☝️',
        'Esmu šeit, ja vajag! 🌟',
        'Kā sokas ar projektiem?',
        'Neaizmirsti pauzēt! 🧘',
        'Lielisks darbs šodien! 💜',
    ];

    /* ══════════════════════════════════════════
       INIT
    ══════════════════════════════════════════ */
    function init() {
        settings = loadJSON(SETTINGS_KEY, defaults);
        history  = loadJSON(HISTORY_KEY, []);

        pos.x = window.innerWidth  - 140;
        pos.y = window.innerHeight - 120;
        target.x = pos.x;
        target.y = pos.y;

        inject();
        bindEvents();
        applySettings();

        if (!history.length) {
            const pet = PETS[settings.type] || PETS.fox;
            history.push({ role: 'assistant', text: `Sveiks! Es esmu ${settings.name} ${pet.emoji} — tavs AI palīgs! Uzklikšķini uz manis, lai parunātu.` });
            saveHistory();
        }
        renderMessages();
        startMovement();
        setTimeout(showIdleBubble, 8000);
    }

    /* ══════════════════════════════════════════
       INJECT HTML
    ══════════════════════════════════════════ */
    function inject() {
        if (document.getElementById('pet-root')) return;
        const pet = PETS[settings.type] || PETS.fox;

        document.body.insertAdjacentHTML('beforeend', `
        <div id="pet-root" class="pet-root">

            <!-- Running character -->
            <div id="pet-char" class="pet-char" data-state="idle" data-facing="right"
                 style="left:${pos.x}px;top:${pos.y}px">
                <div class="pet-shadow"></div>
                <div class="pet-body">
                    <span class="pet-emoji" id="pet-emoji">${pet.emoji}</span>
                </div>
                <div class="pet-speech" id="pet-speech"></div>
            </div>

            <!-- Chat panel -->
            <div id="pet-panel" class="pet-panel pet-panel-hidden">
                <div class="pet-panel-bar">
                    <div class="pet-panel-info">
                        <span class="pet-panel-emoji" id="pet-panel-emoji">${pet.emoji}</span>
                        <div>
                            <div class="pet-panel-name">
                                <strong id="pet-panel-name">${esc(settings.name)}</strong>
                                <span class="pet-badge">AI</span>
                            </div>
                            <div class="pet-panel-status" id="pet-panel-status">
                                <span class="pet-dot"></span> Tiešsaistē
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:4px">
                        <button type="button" class="pet-bar-btn" id="pet-cfg-btn" title="Iestatījumi">⚙</button>
                        <button type="button" class="pet-bar-btn" id="pet-close-btn" title="Aizvērt">✕</button>
                    </div>
                </div>

                <div class="pet-messages" id="pet-messages"></div>

                <div class="pet-chips" id="pet-chips">
                    <button type="button" class="pet-chip" data-q="Ko man šobrīd darīt?">Ko darīt?</button>
                    <button type="button" class="pet-chip" data-q="Palīdzi koncentrēties">Fokuss</button>
                    <button type="button" class="pet-chip" data-q="Izskaidro šo lapu">Šī lapa</button>
                    <button type="button" class="pet-chip" data-q="Motivē mani!">Motivē!</button>
                </div>

                <form class="pet-form" id="pet-form">
                    <input id="pet-input" type="text" maxlength="240"
                           placeholder="Jautā savam AI palīgam…" autocomplete="off">
                    <button type="submit" class="pet-send-btn">↑</button>
                </form>

                <!-- Settings -->
                <div class="pet-settings" id="pet-settings" style="display:none">
                    <div class="pet-cfg-row">
                        <label>Vārds</label>
                        <input id="pet-name-inp" type="text" maxlength="18" value="${esc(settings.name)}">
                    </div>
                    <div class="pet-cfg-row">
                        <label>Tēls</label>
                        <div class="pet-picker" id="pet-picker">
                            ${Object.entries(PETS).map(([k, v]) => `
                                <button type="button" class="pet-pick ${settings.type === k ? 'active' : ''}"
                                        data-type="${k}">${v.emoji}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`);
    }

    /* ══════════════════════════════════════════
       MOVEMENT ENGINE
    ══════════════════════════════════════════ */
    function startMovement() {
        function loop(now) {
            if (!chatOpen && now - lastRender > 16) {
                stepPet();
                lastRender = now;
            }
            animFrame = requestAnimationFrame(loop);
        }
        animFrame = requestAnimationFrame(loop);
        scheduleNextMove(2000);
    }

    function stepPet() {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 3) {
            const spd = moveState === 'run' ? 2.8 : 1.4;
            pos.x += (dx / dist) * spd;
            pos.y += (dy / dist) * spd;
            if (Math.abs(dx) > 1) {
                const newFacing = dx < 0;
                if (newFacing !== facingLeft) {
                    facingLeft = newFacing;
                    setAttr('data-facing', facingLeft ? 'left' : 'right');
                }
            }
            applyPos();
        } else if (moveState !== 'idle') {
            setMoveState('idle');
            scheduleNextMove(1500 + Math.random() * 4000);
        }
    }

    function scheduleNextMove(delay) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(pickTarget, delay || 2000);
    }

    function pickTarget() {
        if (chatOpen) return;
        const W = window.innerWidth, H = window.innerHeight;
        const pad = 70;
        // Stay in bottom 45% so it doesn't cover main content
        target.x = pad + Math.random() * (W - pad * 2);
        target.y = H * 0.55 + Math.random() * (H * 0.38);
        const dist = Math.hypot(target.x - pos.x, target.y - pos.y);
        setMoveState(dist > 220 ? 'run' : 'walk');
    }

    function setMoveState(s) {
        moveState = s;
        setAttr('data-state', s);
    }

    function applyPos() {
        const el = document.getElementById('pet-char');
        if (el) { el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; }
        repositionPanel();
    }

    function setAttr(k, v) {
        const el = document.getElementById('pet-char');
        if (el) el.setAttribute(k, v);
    }

    /* ══════════════════════════════════════════
       CHAT PANEL POSITION
    ══════════════════════════════════════════ */
    function repositionPanel() {
        const panel = document.getElementById('pet-panel');
        if (!panel || !chatOpen) return;
        const W = window.innerWidth, H = window.innerHeight;
        const pw = panel.offsetWidth  || 320;
        const ph = panel.offsetHeight || 400;
        let px = pos.x - pw / 2;
        let py = pos.y - ph - 16;
        px = Math.max(10, Math.min(px, W - pw - 10));
        py = Math.max(10, Math.min(py, H - ph - 10));
        panel.style.left = px + 'px';
        panel.style.top  = py + 'px';
    }

    /* ══════════════════════════════════════════
       SPEECH BUBBLE
    ══════════════════════════════════════════ */
    function showIdleBubble() {
        if (chatOpen) { setTimeout(showIdleBubble, 20000); return; }
        const line = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
        showBubble(line, 5000);
        setTimeout(showIdleBubble, 25000 + Math.random() * 20000);
    }

    function showBubble(text, duration) {
        const el = document.getElementById('pet-speech');
        if (!el) return;
        el.textContent = text;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), duration || 4000);
    }

    /* ══════════════════════════════════════════
       EVENTS
    ══════════════════════════════════════════ */
    function bindEvents() {
        document.addEventListener('click', (e) => {
            const char  = document.getElementById('pet-char');
            const panel = document.getElementById('pet-panel');
            if (char && char.contains(e.target)) { toggleChat(); return; }
            if (panel && !panel.contains(e.target) && chatOpen) closeChat();
        });

        on('pet-close-btn', 'click', closeChat);

        on('pet-cfg-btn', 'click', () => {
            const s = document.getElementById('pet-settings');
            if (s) s.style.display = s.style.display === 'none' ? '' : 'none';
        });

        on('pet-form', 'submit', async (e) => {
            e.preventDefault();
            const inp = document.getElementById('pet-input');
            const txt = inp?.value.trim();
            if (!txt || thinking) return;
            inp.value = '';
            await ask(txt);
        });

        document.querySelectorAll?.('[data-q]') && document.addEventListener('click', async (e) => {
            const btn = e.target.closest?.('[data-q]');
            if (btn && !thinking) await ask(btn.dataset.q);
        });

        on('pet-name-inp', 'input', (e) => {
            settings.name = e.target.value.trim() || defaults.name;
            saveSettings();
            applySettings();
        });

        document.addEventListener('click', (e) => {
            const btn = e.target.closest?.('[data-type]');
            if (!btn) return;
            settings.type = btn.dataset.type;
            document.querySelectorAll('.pet-pick').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveSettings();
            applySettings();
        });
    }

    function on(id, ev, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(ev, fn);
    }

    function toggleChat() {
        chatOpen ? closeChat() : openChat();
    }

    function openChat() {
        chatOpen = true;
        setMoveState('idle');
        clearTimeout(idleTimer);
        document.getElementById('pet-speech')?.classList.remove('visible');
        const panel = document.getElementById('pet-panel');
        if (panel) {
            panel.classList.remove('pet-panel-hidden');
            repositionPanel();
        }
        document.getElementById('pet-input')?.focus();
        scrollMessages();
    }

    function closeChat() {
        chatOpen = false;
        document.getElementById('pet-panel')?.classList.add('pet-panel-hidden');
        scheduleNextMove(1000);
    }

    /* ══════════════════════════════════════════
       AI REQUEST
    ══════════════════════════════════════════ */
    async function ask(text) {
        pushMessage('user', text);
        thinking = true;
        setStatus(true);
        renderMessages(true);

        try {
            const res = await fetch(apiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.slice(-MAX_HISTORY),
                    pet: {
                        name: settings.name,
                        type: settings.type,
                        style: (PETS[settings.type] || PETS.fox).style,
                    },
                    context: collectContext(),
                }),
            });
            const json = await res.json();
            if (!json.ok || !json.data?.reply) throw new Error(json.error || 'no reply');
            pushMessage('assistant', json.data.reply);
            showBubble(json.data.reply.slice(0, 60) + (json.data.reply.length > 60 ? '…' : ''), 4000);
        } catch (err) {
            pushMessage('assistant', fallback(text, err));
        } finally {
            thinking = false;
            setStatus(false);
            renderMessages();
        }
    }

    function apiUrl() {
        return window.location.pathname.replace(/\\/g, '/').includes('/admin/')
            ? '../api/ai/pet_chat.php'
            : 'api/ai/pet_chat.php';
    }

    function collectContext() {
        const user = typeof Store !== 'undefined' && Store.getCurrentUser?.() || null;
        const tasks   = user && Store.getTasks?.(user.id)         || [];
        const projects = user && Store.getProjects?.(user.id)     || [];
        const pending  = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
        const top3 = pending.slice().sort((a,b) => {
            const o = { critical:4, high:3, medium:2, low:1 };
            return (o[b.priority]||0) - (o[a.priority]||0);
        }).slice(0,3).map(t => ({ name:t.name, priority:t.priority, date:t.date }));

        return {
            page: document.body?.dataset?.page || 'app',
            language: typeof I18n !== 'undefined' ? I18n.getLang() : 'lv',
            user: user ? { firstName:user.firstName, level:user.level, xp:user.xp, streak:user.streak } : null,
            stats: { totalTasks:tasks.length, pendingTasks:pending.length, projects:projects.length },
            topTasks: top3,
        };
    }

    function fallback(text, err) {
        const t = text.toLowerCase();
        const ctx = collectContext();
        if (String(err?.message).includes('GEMINI') || String(err?.message).includes('API_KEY')) {
            return '🔑 API atslēga nav iestatīta. Izveido failu api/config.local.php ar savu Google Gemini atslēgu. Bezmaksas: aistudio.google.com';
        }
        if (t.includes('tālāk') || t.includes('darīt') || t.includes('next')) {
            return ctx.stats.pendingTasks > 0
                ? `Tev ir ${ctx.stats.pendingTasks} nepabeigti uzdevumi. Izvēlies vienu augstākās prioritātes un fokusējies uz to!`
                : 'Šobrīd nav aktīvu uzdevumu. Izveido jaunu uzdevumu un sāc strādāt!';
        }
        if (t.includes('fokus') || t.includes('focus')) {
            return '🎯 Ieslēdz fokusa taimeri, aizvēr citas cilnes un strādā 25 minūtes bez pārtraukumiem!';
        }
        if (t.includes('motivē') || t.includes('motiv')) {
            return '💜 Tu dari lielisku darbu! Katrs mazs solis ved uz lielu mērķi. Turpini!';
        }
        return `Es esmu rezerves režīmā (lapā "${ctx.page}"). Jautā par uzdevumiem, fokusu vai projektu plānošanu!`;
    }

    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    function renderMessages(withTyping) {
        const el = document.getElementById('pet-messages');
        if (!el) return;
        el.innerHTML = history.map(m => `
            <div class="pet-msg pet-msg-${m.role}">
                <div class="pet-bubble">${esc(m.text)}</div>
            </div>`).join('') + (withTyping ? `
            <div class="pet-msg pet-msg-assistant">
                <div class="pet-bubble pet-typing"><span></span><span></span><span></span></div>
            </div>` : '');
        scrollMessages();
    }

    function scrollMessages() {
        const el = document.getElementById('pet-messages');
        if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 30);
    }

    function setStatus(isThinking) {
        const el = document.getElementById('pet-panel-status');
        const dot = el?.querySelector('.pet-dot');
        if (el) el.lastChild.textContent = isThinking ? ' Domā…' : ' Tiešsaistē';
        if (dot) dot.className = 'pet-dot' + (isThinking ? ' thinking' : '');
    }

    function applySettings() {
        const pet = PETS[settings.type] || PETS.fox;
        const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        set('pet-emoji',       pet.emoji);
        set('pet-panel-emoji', pet.emoji);
        set('pet-panel-name',  settings.name);
        const root = document.getElementById('pet-root');
        if (root) root.style.setProperty('--pa', settings.accent || '#7B5EFF');
    }

    /* ══════════════════════════════════════════
       HELPERS
    ══════════════════════════════════════════ */
    function pushMessage(role, text) {
        history.push({ role, text });
        if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY);
        saveHistory();
    }

    function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    function saveHistory()  { localStorage.setItem(HISTORY_KEY,  JSON.stringify(history.slice(-MAX_HISTORY))); }

    function loadJSON(key, fallback) {
        try {
            const p = JSON.parse(localStorage.getItem(key));
            return p ? (Array.isArray(fallback) ? (Array.isArray(p) ? p : []) : { ...fallback, ...p }) : { ...fallback };
        } catch { return Array.isArray(fallback) ? [] : { ...fallback }; }
    }

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s ?? '';
        return d.innerHTML;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => PetAssistant.init());
