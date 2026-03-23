/* ============================================
   TimeForge — Store
   localStorage-based data layer with CRUD ops
   ============================================ */

const Store = (() => {
    const KEYS = {
        users: 'tf_users',
        currentUser: 'tf_currentUser',
        projects: 'tf_projects',
        tasks: 'tf_tasks',
        focusSessions: 'tf_focusSessions',
        achievements: 'tf_achievements',
        userAchievements: 'tf_userAchievements',
        notifications: 'tf_notifications',
        quotes: 'tf_quotes',
        favoriteQuotes: 'tf_favoriteQuotes',
        activityLog: 'tf_activityLog',
        settings: 'tf_settings',
    };

    /* --- Helpers --- */
    function _get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; }
        catch { return []; }
    }
    function _set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    function _getObj(key) {
        try { return JSON.parse(localStorage.getItem(key)) || null; }
        catch { return null; }
    }

    /* =========================
       USERS
       ========================= */
    function getUsers() { return _get(KEYS.users); }

    function getUserByEmail(email) {
        return getUsers().find(u => u.email === email.toLowerCase());
    }

    function createUser(data) {
        const users = getUsers();
        if (getUserByEmail(data.email)) return null; // exists
        const user = {
            id: Utils.generateId(),
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email.toLowerCase(),
            password: Utils.simpleHash(data.password),
            role: users.length === 0 ? 'admin' : 'user', // first user = admin
            timezone: 'Europe/Riga',
            language: I18n.getLang(),
            blocked: false,
            createdAt: new Date().toISOString(),
            xp: 0,
            level: 1,
            streak: 0,
            lastActiveDate: null,
        };
        users.push(user);
        _set(KEYS.users, users);
        return user;
    }

    function updateUser(id, updates) {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) return null;
        Object.assign(users[idx], updates);
        _set(KEYS.users, users);
        // Also update currentUser if it's the same
        const current = getCurrentUser();
        if (current && current.id === id) {
            setCurrentUser(users[idx]);
        }
        return users[idx];
    }

    function deleteUser(id) {
        let users = getUsers();
        users = users.filter(u => u.id !== id);
        _set(KEYS.users, users);
        // Cleanup related data
        _set(KEYS.projects, getProjects().filter(p => p.userId !== id));
        _set(KEYS.tasks, getTasks().filter(t => t.userId !== id));
        _set(KEYS.focusSessions, getFocusSessions().filter(s => s.userId !== id));
        _set(KEYS.notifications, getNotifications().filter(n => n.userId !== id));
    }

    function getCurrentUser() { return _getObj(KEYS.currentUser); }
    function setCurrentUser(user) { _set(KEYS.currentUser, user); }
    function clearCurrentUser() { localStorage.removeItem(KEYS.currentUser); }

    /* =========================
       PROJECTS
       ========================= */
    function getProjects(userId) {
        const all = _get(KEYS.projects);
        return userId ? all.filter(p => p.userId === userId) : all;
    }

    function getProjectById(id) {
        return _get(KEYS.projects).find(p => p.id === id);
    }

    function createProject(data) {
        const projects = _get(KEYS.projects);
        const project = {
            id: Utils.generateId(),
            userId: data.userId,
            name: data.name,
            description: data.description || '',
            startDate: data.startDate || Utils.toISODate(new Date()),
            endDate: data.endDate || '',
            color: data.color || '#5641FF',
            icon: data.icon || '📁',
            status: data.status || 'active',
            createdAt: new Date().toISOString(),
        };
        projects.push(project);
        _set(KEYS.projects, projects);
        return project;
    }

    function updateProject(id, updates) {
        const projects = _get(KEYS.projects);
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1) return null;
        Object.assign(projects[idx], updates);
        _set(KEYS.projects, projects);
        return projects[idx];
    }

    function deleteProject(id) {
        _set(KEYS.projects, _get(KEYS.projects).filter(p => p.id !== id));
        // Also delete tasks linked to this project
        _set(KEYS.tasks, _get(KEYS.tasks).filter(t => t.projectId !== id));
    }

    /* =========================
       TASKS (includes meetings)
       ========================= */
    function getTasks(userId) {
        const all = _get(KEYS.tasks);
        return userId ? all.filter(t => t.userId === userId) : all;
    }

    function getTaskById(id) {
        return _get(KEYS.tasks).find(t => t.id === id);
    }

    function createTask(data) {
        const tasks = _get(KEYS.tasks);
        const task = {
            id: Utils.generateId(),
            userId: data.userId,
            projectId: data.projectId || null,
            name: data.name,
            description: data.description || '',
            date: data.date,
            time: data.time || '09:00',
            duration: parseInt(data.duration) || 30,
            priority: data.priority || 'medium',
            category: data.category || 'other',
            status: data.status || 'planned',
            type: data.type || 'task', // task | meeting
            location: data.location || '',
            createdAt: new Date().toISOString(),
            completedAt: null,
        };
        tasks.push(task);
        _set(KEYS.tasks, tasks);
        return task;
    }

    function updateTask(id, updates) {
        const tasks = _get(KEYS.tasks);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        Object.assign(tasks[idx], updates);
        _set(KEYS.tasks, tasks);
        return tasks[idx];
    }

    function deleteTask(id) {
        _set(KEYS.tasks, _get(KEYS.tasks).filter(t => t.id !== id));
    }

    /* =========================
       FOCUS SESSIONS
       ========================= */
    function getFocusSessions(userId) {
        const all = _get(KEYS.focusSessions);
        return userId ? all.filter(s => s.userId === userId) : all;
    }

    function createFocusSession(data) {
        const sessions = _get(KEYS.focusSessions);
        const session = {
            id: Utils.generateId(),
            userId: data.userId,
            taskId: data.taskId || null,
            startTime: data.startTime,
            endTime: data.endTime,
            duration: data.duration, // seconds
            type: data.type, // work | shortBreak | longBreak
            completed: data.completed,
            createdAt: new Date().toISOString(),
        };
        sessions.push(session);
        _set(KEYS.focusSessions, sessions);
        return session;
    }

    /* =========================
       NOTIFICATIONS
       ========================= */
    function getNotifications(userId) {
        const all = _get(KEYS.notifications);
        return userId ? all.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) : all;
    }

    function createNotification(data) {
        const notifications = _get(KEYS.notifications);
        const notif = {
            id: Utils.generateId(),
            userId: data.userId,
            type: data.type, // deadline | meeting | achievement | focus
            title: data.title,
            message: data.message,
            icon: data.icon || '🔔',
            read: false,
            createdAt: new Date().toISOString(),
        };
        notifications.push(notif);
        _set(KEYS.notifications, notifications);
        return notif;
    }

    function markNotificationRead(id) {
        const notifs = _get(KEYS.notifications);
        const idx = notifs.findIndex(n => n.id === id);
        if (idx !== -1) { notifs[idx].read = true; _set(KEYS.notifications, notifs); }
    }

    function markAllNotificationsRead(userId) {
        const notifs = _get(KEYS.notifications);
        notifs.forEach(n => { if (n.userId === userId) n.read = true; });
        _set(KEYS.notifications, notifs);
    }

    /* =========================
       QUOTES
       ========================= */
    function getQuotes() { return _get(KEYS.quotes); }

    function createQuote(data) {
        const quotes = _get(KEYS.quotes);
        const quote = {
            id: Utils.generateId(),
            textLv: data.textLv,
            textEn: data.textEn,
            author: data.author,
            active: data.active !== false,
        };
        quotes.push(quote);
        _set(KEYS.quotes, quotes);
        return quote;
    }

    function updateQuote(id, updates) {
        const quotes = _get(KEYS.quotes);
        const idx = quotes.findIndex(q => q.id === id);
        if (idx === -1) return null;
        Object.assign(quotes[idx], updates);
        _set(KEYS.quotes, quotes);
        return quotes[idx];
    }

    function deleteQuote(id) {
        _set(KEYS.quotes, _get(KEYS.quotes).filter(q => q.id !== id));
    }

    function getFavoriteQuotes(userId) {
        const favs = _getObj(KEYS.favoriteQuotes) || {};
        return favs[userId] || [];
    }

    function toggleFavoriteQuote(userId, quoteId) {
        const favs = _getObj(KEYS.favoriteQuotes) || {};
        if (!favs[userId]) favs[userId] = [];
        const idx = favs[userId].indexOf(quoteId);
        if (idx === -1) favs[userId].push(quoteId);
        else favs[userId].splice(idx, 1);
        _set(KEYS.favoriteQuotes, favs);
        return idx === -1; // true if added
    }

    /* =========================
       ACHIEVEMENTS
       ========================= */
    function getUserAchievements(userId) {
        const all = _getObj(KEYS.userAchievements) || {};
        return all[userId] || [];
    }

    function unlockAchievement(userId, achievementId) {
        const all = _getObj(KEYS.userAchievements) || {};
        if (!all[userId]) all[userId] = [];
        if (all[userId].includes(achievementId)) return false;
        all[userId].push(achievementId);
        _set(KEYS.userAchievements, all);
        return true;
    }

    /* =========================
       ACTIVITY LOG
       ========================= */
    function logActivity(userId, action, details) {
        const log = _get(KEYS.activityLog);
        log.push({
            id: Utils.generateId(),
            userId,
            action,
            details,
            timestamp: new Date().toISOString()
        });
        // Keep last 500 entries
        if (log.length > 500) log.splice(0, log.length - 500);
        _set(KEYS.activityLog, log);
    }

    function getActivityLog() { return _get(KEYS.activityLog); }

    /* =========================
       SETTINGS
       ========================= */
    function getSettings() {
        return _getObj(KEYS.settings) || {
            emailNotifications: true,
            reminder24h: true,
            reminder1h: true,
        };
    }

    function updateSettings(updates) {
        const s = getSettings();
        Object.assign(s, updates);
        _set(KEYS.settings, s);
        return s;
    }

    /* =========================
       SEED DATA
       ========================= */
    function seedQuotes() {
        if (getQuotes().length > 0) return;
        const defaultQuotes = [
            { textLv:'Laiks, ko tu baudīsi tērēt, nav iztērēts velti.', textEn:'Time you enjoy wasting is not wasted time.', author:'Marthe Troly-Curtin' },
            { textLv:'Labākais laiks koku stādīt bija pirms 20 gadiem. Nākamais labākais laiks ir tagad.', textEn:'The best time to plant a tree was 20 years ago. The next best time is now.', author:'Ķīniešu sakāmvārds' },
            { textLv:'Nekad nav par vēlu būt tam, kas tu varēji būt.', textEn:'It is never too late to be what you might have been.', author:'George Eliot' },
            { textLv:'Veiksmīgi cilvēki dara to, ko neveiksmīgi nevēlas darīt.', textEn:'Successful people do what unsuccessful people are not willing to do.', author:'Jim Rohn' },
            { textLv:'Fokuss ir par to, lai pateiktu nē.', textEn:"Focus is about saying no.", author:'Steve Jobs' },
            { textLv:'Tu nevari izlietot radošumu. Jo vairāk lieto, jo vairāk ir.', textEn:"You can't use up creativity. The more you use, the more you have.", author:'Maya Angelou' },
            { textLv:'Sāciet tur, kur esat. Izmantojiet to, kas jums ir. Dariet to, ko varat.', textEn:'Start where you are. Use what you have. Do what you can.', author:'Arthur Ashe' },
            { textLv:'Produktivitāte nav par aizņemtību. Tā ir par prioritātēm.', textEn:'Productivity is not about being busy. It is about priorities.', author:'Unknown' },
            { textLv:'Katrs liels ceļojums sākas ar vienu soli.', textEn:'Every great journey begins with a single step.', author:'Lao Tzu' },
            { textLv:'Necenties pavadīt laiku. Centies to investēt.', textEn:"Don't try to spend time. Try to invest it.", author:'Unknown' },
        ];
        defaultQuotes.forEach(q => createQuote(q));
    }

    return {
        // Users
        getUsers, getUserByEmail, createUser, updateUser, deleteUser,
        getCurrentUser, setCurrentUser, clearCurrentUser,
        // Projects
        getProjects, getProjectById, createProject, updateProject, deleteProject,
        // Tasks
        getTasks, getTaskById, createTask, updateTask, deleteTask,
        // Focus Sessions
        getFocusSessions, createFocusSession,
        // Notifications
        getNotifications, createNotification, markNotificationRead, markAllNotificationsRead,
        // Quotes
        getQuotes, createQuote, updateQuote, deleteQuote,
        getFavoriteQuotes, toggleFavoriteQuote,
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
