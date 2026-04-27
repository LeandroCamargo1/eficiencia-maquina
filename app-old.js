// ============================================================================
// CONSTANTES E DADOS GLOBAIS
// ============================================================================

const MAX_GRADES_PER_BELT = 4;
const BELTS = [
    { name: 'Branca', color: '#ffffff', textColor: '#000000' },
    { name: 'Azul', color: '#4a90e2', textColor: '#ffffff' },
    { name: 'Roxa', color: '#9b59b6', textColor: '#ffffff' },
    { name: 'Marrom', color: '#8b4513', textColor: '#ffffff' },
    { name: 'Preta', color: '#000000', textColor: '#ffffff' },
];

const BADGES = [
    { id: 'first-checkin', name: 'Primeiro Passo', description: 'Fez seu primeiro check-in', icon: '👣' },
    { id: 'streak-7', name: 'Sete Dias', description: '7 dias consecutivos', icon: '🔥' },
    { id: 'streak-30', name: 'Um Mês', description: '30 dias consecutivos', icon: '🌟' },
    { id: 'blue-belt', name: 'Faixa Azul', description: 'Conquistou a faixa azul', icon: '🥋' },
    { id: 'brown-belt', name: 'Faixa Marrom', description: 'Conquistou a faixa marrom', icon: '🥋' },
    { id: 'century', name: 'Cem Aulas', description: 'Completou 100 aulas', icon: '💯' },
];

const STORAGE_KEY = 'appbjj-kids-state-v2';
const HISTORY_LIMIT = 50;
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DEFAULT_POSITIONS = [
    {
        category: 'Fundamentos',
        description: 'Base para alunos iniciantes',
        positions: [
            { id: 'closed-guard', name: 'Guarda fechada' },
            { id: 'open-guard', name: 'Guarda aberta' },
            { id: 'mount', name: 'Montada' },
            { id: 'side-control', name: '100kg / Controle lateral' },
            { id: 'back-control', name: 'Pegada de costas' },
        ],
    },
    {
        category: 'Passagens de guarda',
        description: 'Transições para avançar posições',
        positions: [
            { id: 'toreando-pass', name: 'Passagem toreando' },
            { id: 'knee-slide', name: 'Passagem com joelho na barriga' },
            { id: 'stack-pass', name: 'Empilhamento' },
        ],
    },
    {
        category: 'Finalizações',
        description: 'Ataques finalizadores principais',
        positions: [
            { id: 'armbar-guard', name: 'Armbar da guarda' },
            { id: 'triangle', name: 'Triângulo' },
            { id: 'americana', name: 'Americana da montada' },
            { id: 'rear-naked-choke', name: 'Mata leão' },
        ],
    },
    {
        category: 'Defesas',
        description: 'Escapes essenciais para segurança',
        positions: [
            { id: 'upa-mount', name: 'Upa (escape da montada)' },
            { id: 'hip-escape', name: 'Shrimp / Fuga de quadril' },
            { id: 'back-escape', name: 'Escape da pegada de costas' },
        ],
    },
];

const DEFAULT_SETTINGS = {
    classesForNextGrade: 10,
    weeklyGoal: 3,
    theme: 'dark',
    notificationsEnabled: true,
    activeTab: 'tab-overview',
};

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let appState = {
    currentProfileId: null,
    profiles: {},
    settings: { ...DEFAULT_SETTINGS },
};

let currentProfileData = {
    id: '',
    name: '',
    age: 0,
    beltIndex: 0,
    gradeInBelt: 0,
    classesProgress: 0,
    totalClasses: 0,
    history: [],
    badges: [],
    checkedDates: {},
    positions: {},
    createdAt: new Date().toISOString(),
};

let attendanceData = [];
let selectedDate = new Date();
let currentChart = null;
let activeTabId = DEFAULT_SETTINGS.activeTab;

// ============================================================================
// UTILITÁRIOS DE POSIÇÕES
// ============================================================================

function flattenPositions() {
    return DEFAULT_POSITIONS.flatMap((group) => group.positions);
}

function getTotalPositionsCount() {
    return flattenPositions().length;
}

function createDefaultPositionsState() {
    const state = {};
    flattenPositions().forEach((position) => {
        state[position.id] = {
            mastered: false,
            practiceCount: 0,
            updatedAt: null,
        };
    });
    return state;
}

function ensurePositionsStructure(profile) {
    if (!profile.positions || typeof profile.positions !== 'object') {
        profile.positions = createDefaultPositionsState();
        return;
    }
    const defaults = createDefaultPositionsState();
    Object.keys(defaults).forEach((positionId) => {
        if (!profile.positions[positionId]) {
            profile.positions[positionId] = defaults[positionId];
        } else {
            profile.positions[positionId] = {
                mastered: Boolean(profile.positions[positionId].mastered),
                practiceCount: Number.isFinite(profile.positions[positionId].practiceCount)
                    ? profile.positions[positionId].practiceCount
                    : 0,
                updatedAt: profile.positions[positionId].updatedAt ?? null,
            };
        }
    });
}

function getPositionDefinition(positionId) {
    for (const group of DEFAULT_POSITIONS) {
        const found = group.positions.find((pos) => pos.id === positionId);
        if (found) {
            return { ...found, category: group.category };
        }
    }
    return null;
}

// ============================================================================
// DOM ELEMENTOS
// ============================================================================

const themeToggle = document.getElementById('theme-toggle');
const profileMenuToggle = document.getElementById('profile-menu-toggle');
const profileMenu = document.getElementById('profile-menu');
const profileList = document.getElementById('profile-list');
const addProfileBtn = document.getElementById('add-profile-btn');
const closeProfileMenuBtn = document.getElementById('close-profile-menu');

const beltVisual = document.getElementById('belt-visual');
const beltTitle = document.getElementById('belt-title');
const beltGrade = document.getElementById('belt-grade');
const stripeCount = document.getElementById('stripe-count');
const progressCount = document.getElementById('progress-count');
const progressBarFill = document.getElementById('progress-bar-fill');
const statusMessage = document.getElementById('status-message');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const classesInput = document.getElementById('classes-input');
const weeklyGoalInput = document.getElementById('weekly-goal-input');
const saveSettingsBtn = document.getElementById('save-settings');

const newProfileModal = document.getElementById('new-profile-modal');
const closeNewProfileBtn = document.getElementById('close-new-profile');
const childNameInput = document.getElementById('child-name-input');
const childAgeInput = document.getElementById('child-age-input');
const createProfileBtn = document.getElementById('create-profile-btn');

const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthDisplay = document.getElementById('current-month-display');

const checkinTodayBtn = document.getElementById('checkin-today');
const undoCheckinBtn = document.getElementById('undo-checkin');
const resetWeekBtn = document.getElementById('reset-week');
const activityLog = document.getElementById('activity-log');
const activityEmpty = document.getElementById('activity-empty');
const clearHistoryBtn = document.getElementById('clear-history');

const badgesGrid = document.getElementById('badges-grid');
const streakEl = document.getElementById('streak');
const weeklyCountEl = document.getElementById('weekly-count');
const totalClassesEl = document.getElementById('total-classes');
const attendanceRateEl = document.getElementById('attendance-rate');
const attendanceChartCanvas = document.getElementById('attendance-chart');
const positionsGrid = document.getElementById('positions-grid');
const positionsMasteredCountEl = document.getElementById('positions-mastered-count');
const positionsTotalCountEl = document.getElementById('positions-total-count');
const positionsInProgressCountEl = document.getElementById('positions-in-progress-count');
const positionsPercentEl = document.getElementById('positions-percent');
const positionsProgressBar = document.getElementById('positions-progress-bar');

const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

// ============================================================================
// TEMAS
// ============================================================================

function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEY + ':theme');
    const theme = saved || 'dark';
    applyTheme(theme);
}

function applyTheme(theme) {
    const wrapper = document.querySelector('.theme-wrapper');
    if (wrapper) {
        wrapper.dataset.theme = theme;
        appState.settings.theme = theme;
    }
    updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
    if (themeToggle) {
        const isDark = appState.settings.theme === 'dark';
        themeToggle.querySelector('.icon-sun').textContent = isDark ? '🌙' : '☀️';
    }
}

themeToggle?.addEventListener('click', () => {
    const newTheme = appState.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(STORAGE_KEY + ':theme', newTheme);
});

// ============================================================================
// GERENCIAMENTO DE PERFIS
// ============================================================================

function generateProfileId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createNewProfile(name, age) {
    const profileId = generateProfileId();
    const profile = {
        id: profileId,
        name,
        age,
        beltIndex: 0,
        gradeInBelt: 0,
        classesProgress: 0,
        totalClasses: 0,
        history: [],
        badges: [],
        checkedDates: {},
        positions: createDefaultPositionsState(),
        createdAt: new Date().toISOString(),
    };
    appState.profiles[profileId] = profile;
    persistState();
    return profileId;
}

function switchProfile(profileId) {
    if (appState.profiles[profileId]) {
        appState.currentProfileId = profileId;
        const profileClone = JSON.parse(JSON.stringify(appState.profiles[profileId]));
        ensurePositionsStructure(profileClone);
        currentProfileData = profileClone;
        persistState();
        updateUIFromProfile();
        closeProfileMenu();
    }
}

function deleteProfile(profileId) {
    if (Object.keys(appState.profiles).length <= 1) {
        showMessage('Você deve ter pelo menos um perfil.', 'warning');
        return;
    }
    delete appState.profiles[profileId];
    if (appState.currentProfileId === profileId) {
        const remaining = Object.keys(appState.profiles)[0];
        switchProfile(remaining);
    }
    persistState();
    renderProfileList();

    // Deletar do Firestore se logado
    if (currentUser && typeof deleteProfileFromFirestore === 'function') {
        deleteProfileFromFirestore(currentUser.uid, profileId);
    }
}

function renderProfileList() {
    profileList.innerHTML = '';
    Object.values(appState.profiles).forEach((profile) => {
        const li = document.createElement('li');
        li.className = 'profile-item';
        if (profile.id === appState.currentProfileId) {
            li.classList.add('active');
        }
        li.innerHTML = `
            <button class="profile-name" type="button" data-profile-id="${profile.id}">
                ${profile.name} (${profile.age} anos)
            </button>
            <button class="profile-delete" type="button" data-profile-id="${profile.id}" aria-label="Deletar perfil">✕</button>
        `;
        profileList.appendChild(li);
    });
}

profileMenuToggle?.addEventListener('click', () => {
    profileMenu.hidden = false;
    renderProfileList();
});

closeProfileMenuBtn?.addEventListener('click', closeProfileMenu);

function closeProfileMenu() {
    profileMenu.hidden = true;
}

profileList?.addEventListener('click', (e) => {
    if (e.target.classList.contains('profile-name')) {
        const profileId = e.target.dataset.profileId;
        switchProfile(profileId);
    }
    if (e.target.classList.contains('profile-delete')) {
        const profileId = e.target.dataset.profileId;
        showConfirm('Deletar Perfil', `Tem certeza que deseja deletar "${appState.profiles[profileId]?.name}"?`, () => {
            deleteProfile(profileId);
        });
    }
});

addProfileBtn?.addEventListener('click', () => {
    profileMenu.hidden = true;
    newProfileModal.hidden = false;
});

closeNewProfileBtn?.addEventListener('click', () => {
    newProfileModal.hidden = true;
    childNameInput.value = '';
    childAgeInput.value = '';
});

createProfileBtn?.addEventListener('click', () => {
    const name = childNameInput.value.trim();
    const age = parseInt(childAgeInput.value);
    if (!name) {
        showMessage('Digite o nome da criança.', 'warning');
        return;
    }
    if (!age || age < 4 || age > 18) {
        showMessage('Digite uma idade válida (4-18).', 'warning');
        return;
    }
    const profileId = createNewProfile(name, age);
    switchProfile(profileId);
    newProfileModal.hidden = true;
    childNameInput.value = '';
    childAgeInput.value = '';
});

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

settingsBtn?.addEventListener('click', () => {
    classesInput.value = appState.settings.classesForNextGrade;
    weeklyGoalInput.value = appState.settings.weeklyGoal;
    settingsModal.hidden = false;
});

closeSettingsBtn?.addEventListener('click', () => {
    settingsModal.hidden = true;
});

saveSettingsBtn?.addEventListener('click', () => {
    const classes = parseInt(classesInput.value);
    const goal = parseInt(weeklyGoalInput.value);
    if (classes < 1 || classes > 50) {
        showMessage('Aulas deve estar entre 1 e 50.', 'warning');
        return;
    }
    if (goal < 1 || goal > 7) {
        showMessage('Meta deve estar entre 1 e 7 dias.', 'warning');
        return;
    }
    appState.settings.classesForNextGrade = classes;
    appState.settings.weeklyGoal = goal;
    persistState();
    updateUIFromProfile();
    settingsModal.hidden = true;
    showMessage('Configurações salvas com sucesso!', 'success');
});

// ============================================================================
// FAIXAS E GRAUS
// ============================================================================

function updateBeltVisual() {
    const belt = BELTS[currentProfileData.beltIndex];
    if (beltVisual) {
        beltVisual.style.background = `linear-gradient(90deg, ${belt.color} 0%, ${belt.color} 100%)`;
        beltVisual.style.color = belt.textColor;
        beltVisual.setAttribute('aria-label', `Faixa ${belt.name}`);
    }
    if (beltTitle) {
        beltTitle.textContent = `Faixa ${belt.name}`;
    }
    if (beltGrade) {
        beltGrade.textContent = `Grau ${currentProfileData.gradeInBelt}/${MAX_GRADES_PER_BELT}`;
    }
}

function handleGradeAdvancement() {
    if (currentProfileData.classesProgress >= appState.settings.classesForNextGrade) {
        currentProfileData.classesProgress = 0;
        currentProfileData.gradeInBelt += 1;

        if (currentProfileData.gradeInBelt > MAX_GRADES_PER_BELT) {
            currentProfileData.gradeInBelt = 0;
            currentProfileData.beltIndex = Math.min(currentProfileData.beltIndex + 1, BELTS.length - 1);
            const beltName = BELTS[currentProfileData.beltIndex].name.toLowerCase().replace(' ', '-');
            addBadge(`${beltName}-belt`);
            showMessage(`🎉 Nova faixa! ${BELTS[currentProfileData.beltIndex].name}`, 'success');
        } else {
            showMessage('✓ Novo grau conquistado!', 'success');
        }
    }
}

// ============================================================================
// CHECK-IN E PROGRESSO
// ============================================================================

function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

function handleCheckIn(date) {
    const dateKey = formatDateKey(date);
    if (currentProfileData.checkedDates[dateKey]) {
        showMessage('Este dia já foi marcado.', 'warning');
        return;
    }

    const snapshot = saveSnapshot();
    currentProfileData.checkedDates[dateKey] = true;
    currentProfileData.classesProgress += 1;
    currentProfileData.totalClasses += 1;

    recordHistory('checkin', { date: dateKey }, snapshot);
    handleGradeAdvancement();
    updateUIFromProfile();
    persistState();
}

function handleUndo() {
    if (currentProfileData.history.length === 0) {
        showMessage('Nenhuma ação para desfazer.', 'warning');
        return;
    }
    const lastEntry = currentProfileData.history.pop();
    if (lastEntry && lastEntry.snapshot) {
        Object.assign(currentProfileData, lastEntry.snapshot);
    }
    persistState();
    updateUIFromProfile();
    showMessage('Ação desfeita.', 'warning');
}

function handleResetWeek() {
    const week = getWeekDates();
    const checked = week.filter((d) => currentProfileData.checkedDates[formatDateKey(d)]);
    if (checked.length === 0) {
        showMessage('Nenhum check-in nesta semana.', 'warning');
        return;
    }
    const snapshot = saveSnapshot();
    week.forEach((d) => {
        delete currentProfileData.checkedDates[formatDateKey(d)];
    });
    recordHistory('reset-week', {}, snapshot);
    persistState();
    updateUIFromProfile();
    showMessage('Semana reiniciada.', 'info');
}

// ============================================================================
// CALENDÁRIO
// ============================================================================

function renderCalendar() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const today = new Date();

    currentMonthDisplay.textContent = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
    }).format(selectedDate);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    calendarGrid.innerHTML = '';

    // Cabeçalho dos dias da semana
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach((dayName) => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = dayName;
        calendarGrid.appendChild(header);
    });

    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        const dayEl = document.createElement('button');
        dayEl.className = 'calendar-day';
        dayEl.type = 'button';
        dayEl.textContent = day;

        if (currentProfileData.checkedDates[dateKey]) {
            dayEl.classList.add('checked');
        }
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }

        dayEl.addEventListener('click', () => {
            handleCheckIn(date);
            renderCalendar();
        });

        calendarGrid.appendChild(dayEl);
    }
}

function getWeekDates() {
    const today = new Date();
    const first = today.getDate() - today.getDay();
    const week = [];
    for (let i = 0; i < 7; i++) {
        week.push(new Date(today.getFullYear(), today.getMonth(), first + i));
    }
    return week;
}

prevMonthBtn?.addEventListener('click', () => {
    selectedDate.setMonth(selectedDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn?.addEventListener('click', () => {
    selectedDate.setMonth(selectedDate.getMonth() + 1);
    renderCalendar();
});

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

function updateStats() {
    const week = getWeekDates();
    const weekCheckins = week.filter((d) => currentProfileData.checkedDates[formatDateKey(d)]).length;

    let streak = 0;
    let current = new Date();
    while (currentProfileData.checkedDates[formatDateKey(current)]) {
        streak++;
        current.setDate(current.getDate() - 1);
    }

    const total = currentProfileData.totalClasses;
    const daysActive = Object.keys(currentProfileData.checkedDates).length;
    const daysSinceCreation = Math.floor((Date.now() - new Date(currentProfileData.createdAt)) / (1000 * 60 * 60 * 24)) + 1;
    const attendance = daysSinceCreation > 0 ? Math.round((daysActive / daysSinceCreation) * 100) : 0;

    if (streakEl) streakEl.textContent = streak;
    if (weeklyCountEl) weeklyCountEl.textContent = weekCheckins;
    if (totalClassesEl) totalClassesEl.textContent = total;
    if (attendanceRateEl) attendanceRateEl.textContent = `${attendance}%`;

    updateAttendanceChart();
}

function updateAttendanceChart() {
    if (!attendanceChartCanvas) {
        return;
    }

    const panel = attendanceChartCanvas.closest('.tab-panel');
    if (panel && panel.hidden) {
        return;
    }

    const last30Days = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);
        last30Days.push(date.getDate());
        data.push(currentProfileData.checkedDates[dateKey] ? 1 : 0);
    }

    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    const ctx = attendanceChartCanvas.getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last30Days,
            datasets: [
                {
                    label: 'Aulas',
                    data,
                    backgroundColor: '#e53935',
                    borderColor: '#ff6659',
                    borderWidth: 1,
                    borderRadius: 6,
                },
            ],
        },
        options: {
            indexAxis: 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        display: false,
                    },
                    grid: {
                        display: false,
                    },
                },
                x: {
                    ticks: {
                        color: '#8b8b95',
                    },
                    grid: {
                        display: false,
                    },
                },
            },
        },
    });
}

// ============================================================================
// BADGES E CONQUISTAS
// ============================================================================

function addBadge(badgeId) {
    if (!currentProfileData.badges.includes(badgeId)) {
        currentProfileData.badges.push(badgeId);
    }
}

function renderBadges() {
    badgesGrid.innerHTML = '';
    BADGES.forEach((badge) => {
        const earned = currentProfileData.badges.includes(badge.id);
        const div = document.createElement('div');
        div.className = `badge ${earned ? 'earned' : 'locked'}`;
        div.title = badge.description;
        div.innerHTML = `
            <span class="badge-icon">${badge.icon}</span>
            <span class="badge-name">${badge.name}</span>
        `;
        badgesGrid.appendChild(div);
    });
}

// ============================================================================
// HISTÓRICO
// ============================================================================

function saveSnapshot() {
    return JSON.parse(JSON.stringify(currentProfileData));
}

function recordHistory(type, data, snapshot) {
    currentProfileData.history.push({
        type,
        data,
        snapshot,
        timestamp: new Date().toISOString(),
    });
    if (currentProfileData.history.length > HISTORY_LIMIT) {
        currentProfileData.history = currentProfileData.history.slice(-HISTORY_LIMIT);
    }
}

function renderHistory() {
    activityLog.innerHTML = '';
    const hasHistory = currentProfileData.history.length > 0;
    activityEmpty.hidden = hasHistory;

    if (!hasHistory) {
        return;
    }

    [...currentProfileData.history]
        .reverse()
        .slice(0, 25)
        .forEach((entry) => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            const date = new Date(entry.timestamp);
            const dateStr = new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);

            let text = '';
            if (entry.type === 'checkin') {
                text = `✓ Check-in registrado`;
            } else if (entry.type === 'reset-week') {
                text = `↻ Semana reiniciada`;
            }

            li.innerHTML = `
                <strong>${text}</strong>
                <span class="activity-meta">${dateStr}</span>
            `;
            activityLog.appendChild(li);
        });
}

clearHistoryBtn?.addEventListener('click', () => {
    showConfirm('Limpar Histórico', 'Tem certeza que deseja limpar todo o histórico? O progresso será mantido.', () => {
        currentProfileData.history = [];
        persistState();
        renderHistory();
        showMessage('Histórico limpo.', 'info');
    });
});

// ============================================================================
// MENSAGENS E MODAIS
// ============================================================================

function showMessage(message, type = 'info') {
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message is-${type}`;
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }, 4000);
    }
}

function showConfirm(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.hidden = false;

    const handleConfirm = () => {
        confirmModal.hidden = true;
        confirmOk.removeEventListener('click', handleConfirm);
        confirmCancel.removeEventListener('click', handleCancel);
        onConfirm();
    };

    const handleCancel = () => {
        confirmModal.hidden = true;
        confirmOk.removeEventListener('click', handleConfirm);
        confirmCancel.removeEventListener('click', handleCancel);
    };

    confirmOk.addEventListener('click', handleConfirm);
    confirmCancel.addEventListener('click', handleCancel);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

checkinTodayBtn?.addEventListener('click', () => {
    handleCheckIn(new Date());
    renderCalendar();
});

undoCheckinBtn?.addEventListener('click', handleUndo);
resetWeekBtn?.addEventListener('click', handleResetWeek);
positionsGrid?.addEventListener('click', (event) => {
    const button = event.target.closest('.position-toggle');
    if (!button) {
        return;
    }
    const positionId = button.dataset.positionId;
    if (positionId) {
        togglePositionMastery(positionId);
    }
});

// ============================================================================
// PERSISTÊNCIA
// ============================================================================

function persistState() {
    try {
        if (appState.currentProfileId) {
            appState.profiles[appState.currentProfileId] = JSON.parse(JSON.stringify(currentProfileData));
        }
        appState.settings.activeTab = activeTabId;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

        // Sincronizar com Firestore se logado
        if (typeof syncToFirestore === 'function') {
            syncToFirestore();
        }
    } catch (error) {
        console.warn('Erro ao salvar estado:', error);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            appState = JSON.parse(saved);
            appState.settings = { ...DEFAULT_SETTINGS, ...appState.settings };
            activeTabId = appState.settings.activeTab || DEFAULT_SETTINGS.activeTab;
            Object.values(appState.profiles).forEach((profile) => ensurePositionsStructure(profile));
            if (appState.currentProfileId && appState.profiles[appState.currentProfileId]) {
                currentProfileData = JSON.parse(JSON.stringify(appState.profiles[appState.currentProfileId]));
                ensurePositionsStructure(currentProfileData);
            }
        } else {
            appState.settings = { ...DEFAULT_SETTINGS };
        }
    } catch (error) {
        console.warn('Erro ao carregar estado:', error);
        appState.settings = { ...DEFAULT_SETTINGS };
        activeTabId = DEFAULT_SETTINGS.activeTab;
    }

    // Garante que haja pelo menos um perfil
    if (Object.keys(appState.profiles).length === 0) {
        const profileId = createNewProfile('Minha Criança', 8);
        appState.currentProfileId = profileId;
        currentProfileData = JSON.parse(JSON.stringify(appState.profiles[profileId]));
    }

    if (!appState.currentProfileId) {
        appState.currentProfileId = Object.keys(appState.profiles)[0];
        currentProfileData = JSON.parse(JSON.stringify(appState.profiles[appState.currentProfileId]));
    }

    ensurePositionsStructure(currentProfileData);
}

// ============================================================================
// ATUALIZAÇÃO DA UI
// ============================================================================

function updateProgressUI() {
    const max = appState.settings.classesForNextGrade;
    const current = currentProfileData.classesProgress;
    const percent = Math.min(100, (current / max) * 100);

    if (progressBarFill) {
        progressBarFill.style.width = `${percent}%`;
    }
    if (progressCount) {
        progressCount.textContent = `${current}/${max} aulas`;
    }
    if (progressBarFill?.parentElement) {
        progressBarFill.parentElement.setAttribute('aria-valuenow', current.toString());
    }
}

function updateUIFromProfile() {
    updateBeltVisual();
    updateProgressUI();
    updateStats();
    renderHistory();
    renderBadges();
    renderCalendar();
    renderPositions();
    updateUndoState();
}

function updateUndoState() {
    if (undoCheckinBtn) {
        undoCheckinBtn.disabled = currentProfileData.history.length === 0;
    }
}

// ============================================================================
// NAVEGAÇÃO POR ABAS
// ============================================================================

function handleTabKeyNavigation(event) {
    const { key } = event;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) {
        return;
    }

    const currentIndex = tabButtons.indexOf(event.currentTarget);
    if (currentIndex === -1) {
        return;
    }

    event.preventDefault();

    let newIndex = currentIndex;
    if (key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % tabButtons.length;
    } else if (key === 'ArrowLeft') {
        newIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    } else if (key === 'Home') {

// ============================================================================
// POSIÇÕES DOMINADAS
// ============================================================================

function renderPositions() {
    if (!positionsGrid) {
        return;
    }

    ensurePositionsStructure(currentProfileData);
    const totalPositions = getTotalPositionsCount();
    positionsTotalCountEl && (positionsTotalCountEl.textContent = totalPositions.toString());

    let masteredCount = 0;
    positionsGrid.innerHTML = '';

    DEFAULT_POSITIONS.forEach((group) => {
        const section = document.createElement('section');
        section.className = 'positions-category';
        section.innerHTML = `
            <div>
                <h4>${group.category}</h4>
                <p class="positions-category-description">${group.description}</p>
            </div>
        `;

        const list = document.createElement('div');
        list.className = 'positions-list';

        group.positions.forEach((position) => {
            const state = currentProfileData.positions[position.id] || {
                mastered: false,
                practiceCount: 0,
            };
            if (state.mastered) {
                masteredCount += 1;
            }
            const statusLabel = state.mastered
                ? 'Dominada'
                : state.practiceCount > 0
                ? 'Em treino'
                : 'Para treinar';

            const card = document.createElement('div');
            card.className = `position-card ${state.mastered ? 'is-mastered' : ''}`;

            const info = document.createElement('div');
            info.className = 'position-info';
            info.innerHTML = `
                <strong>${position.name}</strong>
                <span>Status: ${statusLabel}</span>
            `;

            const toggle = document.createElement('button');
            toggle.className = 'position-toggle';
            toggle.type = 'button';
            toggle.dataset.positionId = position.id;
            toggle.setAttribute('aria-pressed', state.mastered ? 'true' : 'false');
            toggle.innerHTML = state.mastered ? '↺ Voltar para treino' : '✅ Marcar como dominada';

            card.append(info, toggle);
            list.appendChild(card);
        });

        if (list.children.length > 0) {
            section.appendChild(list);
            positionsGrid.appendChild(section);
        }
    });

    const masteredPercent = totalPositions > 0 ? Math.round((masteredCount / totalPositions) * 100) : 0;
    const inProgressCount = Math.max(totalPositions - masteredCount, 0);

    positionsMasteredCountEl && (positionsMasteredCountEl.textContent = masteredCount.toString());
    positionsInProgressCountEl && (positionsInProgressCountEl.textContent = inProgressCount.toString());
    positionsPercentEl && (positionsPercentEl.textContent = `${masteredPercent}%`);
    if (positionsProgressBar) {
        positionsProgressBar.style.width = `${masteredPercent}%`;
        positionsProgressBar.parentElement?.setAttribute('aria-valuenow', masteredPercent.toString());
    }

    if (!positionsGrid.children.length) {
        const empty = document.createElement('p');
        empty.className = 'positions-empty';
        empty.textContent = 'Nenhuma posição cadastrada ainda.';
        positionsGrid.appendChild(empty);
    }
}

function togglePositionMastery(positionId) {
    ensurePositionsStructure(currentProfileData);
    const state = currentProfileData.positions[positionId];
    if (!state) {
        return;
    }

    const snapshot = saveSnapshot();
    state.mastered = !state.mastered;
    if (state.mastered && state.practiceCount === 0) {
        state.practiceCount = 1;
    }
    if (!state.mastered) {
        state.practiceCount = Math.max(0, state.practiceCount - 1);
    }
    state.updatedAt = new Date().toISOString();

    recordHistory('position-mastered', { positionId, mastered: state.mastered }, snapshot);
    persistState();
    renderPositions();
    renderHistory();

    const position = getPositionDefinition(positionId);
    const messageName = position?.name ?? 'Posição';
    showMessage(
        state.mastered
            ? `${messageName} marcada como dominada! 🥋`
            : `${messageName} voltou para treino.`,
        state.mastered ? 'success' : 'info'
    );
}
        newIndex = 0;
    } else if (key === 'End') {
        newIndex = tabButtons.length - 1;
    }

    const targetButton = tabButtons[newIndex];
    if (targetButton) {
        targetButton.focus();
        const targetId = targetButton.getAttribute('aria-controls');
        activateTab(targetId);
    }
}

function activateTab(tabId, { skipPersist = false } = {}) {
    if (!tabPanels.length || !tabButtons.length) {
        return;
    }

    let targetId = tabId;
    if (!tabPanels.some((panel) => panel.id === tabId)) {
        targetId = DEFAULT_SETTINGS.activeTab;
    }

    activeTabId = targetId;

    tabButtons.forEach((button) => {
        const controls = button.getAttribute('aria-controls');
        const isActive = controls === targetId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        button.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    tabPanels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    if (targetId === 'tab-checkins') {
        renderCalendar();
    } else if (targetId === 'tab-conquistas') {
        renderBadges();
    } else if (targetId === 'tab-historico') {
        renderHistory();
    } else if (targetId === 'tab-overview') {
        updateStats();
    }

    appState.settings.activeTab = targetId;
    if (!skipPersist) {
        persistState();
    }
}

function initTabs() {
    if (!tabButtons.length || !tabPanels.length) {
        return;
    }

    tabPanels.forEach((panel) => {
        const isActive = panel.classList.contains('is-active');
        panel.hidden = !isActive;
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('aria-controls');
            activateTab(targetId);
        });
        button.addEventListener('keydown', handleTabKeyNavigation);
    });
}

// ============================================================================
// SERVICE WORKER
// ============================================================================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
        console.log('Service Worker não disponível');
    });
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initAuth(); // Firebase Auth controla o fluxo de inicialização
});
