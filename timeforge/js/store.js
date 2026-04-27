/* ============================================
   TimeForge — Store
   Write-through cache: localStorage + MySQL API
   ============================================ */

const Store = (() => {
    const KEYS = {
        currentUser:     'tf_currentUser',
        projects:        'tf_projects',
        tasks:           'tf_tasks',
        focusSessions:   'tf_focusSessions',
        notifications:   'tf_notifications',
        quotes:          'tf_quotes',
        favoriteQuotes:  'tf_favoriteQuotes',
        achievements:    'tf_achievements',
        activityLog:     'tf_activityLog',
        settings:        'tf_settings',
    };

    /* --- localStorage helpers --- */
    function _get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; }
        catch { return []; }
    }
    function _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function _getObj(key) {
        try { return JSON.parse(localStorage.getItem(key)) || null; }
        catch { return null; }
    }

    /* --- API helper (fire-and-forget to MySQL) --- */
    function _api(method, endpoint, data = null) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (data) opts.body = JSON.stringify(data);
        return fetch('api/data/' + endpoint, opts).catch(() => null);
    }

    /* --- Hydrate localStorage from MySQL on login --- */
    async function hydrate() {
        try {
            const res = await fetch('api/data/hydrate.php');
            const json = await res.json();
            if (!json.ok) return;
            const d = json.data;
            _set(KEYS.projects,       d.projects       || []);
            _set(KEYS.tasks,          d.tasks          || []);
            _set(KEYS.focusSessions,  d.focusSessions  || []);
            _set(KEYS.notifications,  d.notifications  || []);
            _set(KEYS.quotes,         d.quotesOut      || []);
            _set(KEYS.favoriteQuotes, d.favoriteQuotes || []);
            _set(KEYS.achievements,   d.achievements   || []);
            _set(KEYS.settings,       d.settings       || {});
            _set(KEYS.activityLog,    d.activityLog    || []);
        } catch(e) { console.warn('Hydrate failed:', e); }
    }

    /* =========================
       CURRENT USER (session)
       ========================= */
    function getCurrentUser()    { return _getObj(KEYS.currentUser); }
    function setCurrentUser(u)   { _set(KEYS.currentUser, u); }
    function clearCurrentUser()  { localStorage.removeItem(KEYS.currentUser); }
    function clearAppData() {
        Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    }

    /* =========================
       USERS (admin only, read)
       ========================= */
    async function getUsers() {
        try {
            const res = await fetch('api/data/users.php');
            const json = await res.json();
            return json.ok ? json.data : [];
        } catch { return []; }
    }

    async function updateUser(id, updates) {
        const user = getCurrentUser();
        if (user) {
            const updated = Object.assign({}, user, updates);
            setCurrentUser(updated);
        }
        await _api('PUT', 'users.php', { id, ...updates });
        return updates;
    }

    async function deleteUser(id) {
        await _api('DELETE', 'users.php', { id });
    }

    async function blockUser(id, blocked) {
        await _api('PATCH', 'users.php', { id, blocked });
    }

    /* =========================
       PROJECTS
       ========================= */
    function getProjects(userId) {
        const all = _get(KEYS.projects);
        return userId ? all.filter(p => p.userId == userId) : all;
    }

    function getProjectById(id) {
        return _get(KEYS.projects).find(p => p.id === id);
    }

    function createProject(data) {
        const projects = _get(KEYS.projects);
        const project = {
            id:          Utils.generateId(),
            userId:      data.userId,
            name:        data.name,
            description: data.description || '',
            startDate:   data.startDate || Utils.toISODate(new Date()),
            endDate:     data.endDate || '',
            color:       data.color || '#5641FF',
            icon:        data.icon || '📁',
            status:      data.status || 'active',
            createdAt:   new Date().toISOString(),
        };
        projects.push(project);
        _set(KEYS.projects, projects);
        _api('POST', 'projects.php', project);
        return project;
    }

    function updateProject(id, updates) {
        const projects = _get(KEYS.projects);
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1) return null;
        Object.assign(projects[idx], updates);
        _set(KEYS.projects, projects);
        _api('PUT', 'projects.php', projects[idx]);
        return projects[idx];
    }

    function deleteProject(id) {
        _set(KEYS.projects, _get(KEYS.projects).filter(p => p.id !== id));
        _set(KEYS.tasks, _get(KEYS.tasks).filter(t => t.projectId !== id));
        _api('DELETE', 'projects.php', { id });
    }

    /* =========================
       TASKS
       ========================= */
    function getTasks(userId) {
        const all = _get(KEYS.tasks);
        return userId ? all.filter(t => t.userId == userId) : all;
    }

    function getTaskById(id) {
        return _get(KEYS.tasks).find(t => t.id === id);
    }

    function createTask(data) {
        const tasks = _get(KEYS.tasks);
        const task = {
            id:          Utils.generateId(),
            userId:      data.userId,
            projectId:   data.projectId || null,
            name:        data.name,
            description: data.description || '',
            date:        data.date,
            time:        data.time || '09:00',
            duration:    parseInt(data.duration) || 30,
            priority:    data.priority || 'medium',
            category:    data.category || 'other',
            status:      data.status || 'planned',
            type:        data.type || 'task',
            location:    data.location || '',
            createdAt:   new Date().toISOString(),
            completedAt: null,
        };
        tasks.push(task);
        _set(KEYS.tasks, tasks);
        _api('POST', 'tasks.php', task);
        return task;
    }

    function updateTask(id, updates) {
        const tasks = _get(KEYS.tasks);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        Object.assign(tasks[idx], updates);
        _set(KEYS.tasks, tasks);
        _api('PUT', 'tasks.php', tasks[idx]);
        return tasks[idx];
    }

    function deleteTask(id) {
        _set(KEYS.tasks, _get(KEYS.tasks).filter(t => t.id !== id));
        _api('DELETE', 'tasks.php', { id });
    }

    /* =========================
       FOCUS SESSIONS
       ========================= */
    function getFocusSessions(userId) {
        const all = _get(KEYS.focusSessions);
        return userId ? all.filter(s => s.userId == userId) : all;
    }

    function createFocusSession(data) {
        const sessions = _get(KEYS.focusSessions);
        const session = {
            id:        Utils.generateId(),
            userId:    data.userId,
            taskId:    data.taskId || null,
            startTime: data.startTime,
            endTime:   data.endTime,
            duration:  data.duration,
            type:      data.type,
            completed: data.completed,
            createdAt: new Date().toISOString(),
        };
        sessions.push(session);
        _set(KEYS.focusSessions, sessions);
        _api('POST', 'focus_sessions.php', session);
        return session;
    }

    /* =========================
       NOTIFICATIONS
       ========================= */
    function getNotifications(userId) {
        const all = _get(KEYS.notifications);
        return userId
            ? all.filter(n => n.userId == userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            : all;
    }

    function createNotification(data) {
        const notifications = _get(KEYS.notifications);
        const notif = {
            id:        Utils.generateId(),
            userId:    data.userId,
            type:      data.type,
            title:     data.title,
            message:   data.message,
            icon:      data.icon || '🔔',
            read:      false,
            createdAt: new Date().toISOString(),
        };
        notifications.push(notif);
        _set(KEYS.notifications, notifications);
        _api('POST', 'notifications.php', notif);
        return notif;
    }

    function markNotificationRead(id) {
        const notifs = _get(KEYS.notifications);
        const idx = notifs.findIndex(n => n.id === id);
        if (idx !== -1) {
            notifs[idx].read = true;
            _set(KEYS.notifications, notifs);
            _api('PATCH', 'notifications.php', { id });
        }
    }

    function markAllNotificationsRead(userId) {
        const notifs = _get(KEYS.notifications);
        notifs.forEach(n => { if (n.userId == userId) n.read = true; });
        _set(KEYS.notifications, notifs);
        _api('PATCH', 'notifications.php', { all: true });
    }

    /* =========================
       QUOTES
       ========================= */
    function getQuotes()       { return _get(KEYS.quotes); }

    function createQuote(data) {
        const quotes = _get(KEYS.quotes);
        const quote = {
            id:     Utils.generateId(),
            textLv: data.textLv,
            textEn: data.textEn,
            author: data.author,
            active: data.active !== false,
        };
        quotes.push(quote);
        _set(KEYS.quotes, quotes);
        _api('POST', 'quotes.php', quote);
        return quote;
    }

    function updateQuote(id, updates) {
        const quotes = _get(KEYS.quotes);
        const idx = quotes.findIndex(q => q.id === id);
        if (idx === -1) return null;
        Object.assign(quotes[idx], updates);
        _set(KEYS.quotes, quotes);
        _api('PUT', 'quotes.php', quotes[idx]);
        return quotes[idx];
    }

    function deleteQuote(id) {
        _set(KEYS.quotes, _get(KEYS.quotes).filter(q => q.id !== id));
        _api('DELETE', 'quotes.php', { id });
    }

    function getFavoriteQuotes(_userId) {
        const favs = _get(KEYS.favoriteQuotes);
        return Array.isArray(favs) ? favs : [];
    }

    function toggleFavoriteQuote(userId, quoteId) {
        const favs = _get(KEYS.favoriteQuotes);
        const idx = favs.indexOf(quoteId);
        if (idx === -1) favs.push(quoteId);
        else favs.splice(idx, 1);
        _set(KEYS.favoriteQuotes, favs);
        _api('POST', 'quotes.php', { toggleFavorite: true, quoteId });
        return idx === -1;
    }

    /* =========================
       ACHIEVEMENTS
       ========================= */
    function getUserAchievements(_userId) {
        const all = _get(KEYS.achievements);
        return Array.isArray(all) ? all : [];
    }

    function unlockAchievement(userId, achievementId) {
        const all = _get(KEYS.achievements);
        if (all.includes(achievementId)) return false;
        all.push(achievementId);
        _set(KEYS.achievements, all);
        _api('POST', 'achievements.php', { achievementId });
        return true;
    }

    /* =========================
       ACTIVITY LOG
       ========================= */
    function logActivity(userId, action, details) {
        const log = _get(KEYS.activityLog);
        const entry = {
            id:        Utils.generateId(),
            userId,
            action,
            details,
            timestamp: new Date().toISOString(),
        };
        log.push(entry);
        if (log.length > 500) log.splice(0, log.length - 500);
        _set(KEYS.activityLog, log);
        _api('POST', 'activity.php', entry);
    }

    function getActivityLog() { return _get(KEYS.activityLog); }

    /* =========================
       SETTINGS
       ========================= */
    function getSettings() {
        return _getObj(KEYS.settings) || { emailNotifications: true, reminder24h: true, reminder1h: true };
    }

    function updateSettings(updates) {
        const s = Object.assign(getSettings(), updates);
        _set(KEYS.settings, s);
        _api('PUT', 'settings.php', s);
        return s;
    }

    /* =========================
       SEED (now handled by API)
       ========================= */
    function seedQuotes() { /* seeding is done server-side in hydrate.php */ }

    return {
        hydrate,
        // Current user
        getCurrentUser, setCurrentUser, clearCurrentUser, clearAppData,
        // Users (async, admin)
        getUsers, updateUser, deleteUser, blockUser,
        // Projects
        getProjects, getProjectById, createProject, updateProject, deleteProject,
        // Tasks
        getTasks, getTaskById, createTask, updateTask, deleteTask,
        // Focus sessions
        getFocusSessions, createFocusSession,
        // Notifications
        getNotifications, createNotification, markNotificationRead, markAllNotificationsRead,
        // Quotes
        getQuotes, createQuote, updateQuote, deleteQuote, getFavoriteQuotes, toggleFavoriteQuote,
        // Achievements
        getUserAchievements, unlockAchievement,
        // Activity
        logActivity, getActivityLog,
        // Settings
        getSettings, updateSettings,
        // Seed
        seedQuotes,
    };
})();
