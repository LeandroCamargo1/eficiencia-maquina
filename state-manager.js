// ============================================================================
// STATE MANAGER — Gerenciamento Centralizado de Estado (Único padrão)
// ============================================================================

const StateManager = (() => {
    let state = {
        user: null,
        role: null, // 'student' | 'teacher'
        currentProfile: null,
        profiles: [],
        settings: {
            theme: 'dark',
            notificationsEnabled: true,
            classesForNextGrade: 10,
            weeklyGoal: 3,
        },
        checkinRequests: [],
        linkedTeacher: null,
        linkedStudents: [],
    };

    const listeners = new Set();

    return {
        // --- Get State ---
        getState() {
            return JSON.parse(JSON.stringify(state));
        },

        getUser() {
            return state.user;
        },

        getRole() {
            return state.role;
        },

        getCurrentProfile() {
            return state.currentProfile ? JSON.parse(JSON.stringify(state.currentProfile)) : null;
        },

        getProfiles() {
            return JSON.parse(JSON.stringify(state.profiles));
        },

        getSettings() {
            return JSON.parse(JSON.stringify(state.settings));
        },

        getCheckinRequests() {
            return JSON.parse(JSON.stringify(state.checkinRequests));
        },

        // --- Set State ---
        setUser(user) {
            state.user = user;
            this._notify();
        },

        setRole(role) {
            state.role = role;
            this._notify();
        },

        setCurrentProfile(profile) {
            state.currentProfile = profile ? JSON.parse(JSON.stringify(profile)) : null;
            this._notify();
        },

        setProfiles(profiles) {
            state.profiles = JSON.parse(JSON.stringify(profiles));
            this._notify();
        },

        updateProfile(updates) {
            if (!state.currentProfile) return;
            Object.assign(state.currentProfile, updates);
            this._notify();
        },

        updateSetting(key, value) {
            state.settings[key] = value;
            this._notify();
        },

        setCheckinRequests(requests) {
            state.checkinRequests = JSON.parse(JSON.stringify(requests));
            this._notify();
        },

        addCheckinRequest(request) {
            state.checkinRequests = [request, ...state.checkinRequests];
            this._notify();
        },

        updateCheckinRequest(requestId, updates) {
            const idx = state.checkinRequests.findIndex(r => r.id === requestId);
            if (idx >= 0) {
                Object.assign(state.checkinRequests[idx], updates);
                this._notify();
            }
        },

        setLinkedTeacher(teacher) {
            state.linkedTeacher = teacher ? JSON.parse(JSON.stringify(teacher)) : null;
            this._notify();
        },

        setLinkedStudents(students) {
            state.linkedStudents = JSON.parse(JSON.stringify(students));
            this._notify();
        },

        // --- Observers ---
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        _notify() {
            listeners.forEach(listener => listener(state));
        },

        // --- Reset ---
        clear() {
            state = {
                user: null,
                role: null,
                currentProfile: null,
                profiles: [],
                settings: { theme: 'dark', notificationsEnabled: true, classesForNextGrade: 10, weeklyGoal: 3 },
                checkinRequests: [],
                linkedTeacher: null,
                linkedStudents: [],
            };
            this._notify();
        },
    };
})();
