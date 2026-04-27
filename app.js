// ============================================================================
// APPBJJ KIDS — App Principal (estrutura unificada para dashboard atual)
// ============================================================================

const APP_CONFIG = {
    BELTS: [
        { name: 'Branca', color: '#ffffff', textColor: '#000000' },
        { name: 'Azul', color: '#4a90e2', textColor: '#ffffff' },
        { name: 'Roxa', color: '#9b59b6', textColor: '#ffffff' },
        { name: 'Marrom', color: '#8b4513', textColor: '#ffffff' },
        { name: 'Preta', color: '#000000', textColor: '#ffffff' },
    ],
    MAX_GRADES: 4,
    CLASSES_FOR_NEXT_GRADE: 10,
};

const STUDENT_MODULES = {
    'section-belt': ['section-belt', 'section-progress', 'section-stats', 'section-checkin'],
    'section-positions': ['section-positions'],
    'section-face-enroll': ['section-face-enroll'],
    'section-profiles': ['section-profiles'],
};

const TEACHER_MODULES = {
    'section-teacher-requests': ['section-teacher-requests'],
    'section-face-checkin': ['section-face-checkin'],
    'section-teacher-stats': ['section-teacher-stats'],
};

const DEFAULT_POSITIONS = [
    {
        category: 'Fundamentos',
        description: 'Base técnica para fixar os movimentos principais.',
        positions: [
            { id: 'closed-guard', name: 'Guarda fechada' },
            { id: 'open-guard', name: 'Guarda aberta' },
            { id: 'mount', name: 'Montada' },
            { id: 'side-control', name: '100kg / Controle lateral' },
        ],
    },
    {
        category: 'Passagens',
        description: 'Transições para avançar para posições dominantes.',
        positions: [
            { id: 'toreando-pass', name: 'Passagem toreando' },
            { id: 'knee-slide', name: 'Passagem joelho na barriga' },
            { id: 'stack-pass', name: 'Empilhamento' },
        ],
    },
    {
        category: 'Finalizações',
        description: 'Ataques para fechar o combate com controle.',
        positions: [
            { id: 'armbar-guard', name: 'Armbar da guarda' },
            { id: 'triangle', name: 'Triângulo' },
            { id: 'rear-naked-choke', name: 'Mata leão' },
        ],
    },
];

const POSITION_REWARDS = [
    { id: 'reward-3', threshold: 3, icon: '🌱', name: 'Primeiros Passos', description: 'Domine 3 posições' },
    { id: 'reward-6', threshold: 6, icon: '🔥', name: 'Ritmo Forte', description: 'Domine 6 posições' },
    { id: 'reward-10', threshold: 10, icon: '🏆', name: 'Faixa Técnica', description: 'Domine 10 posições' },
];

function flattenPositions() {
    return DEFAULT_POSITIONS.flatMap((group) => group.positions);
}

function createDefaultPositionsState() {
    const positions = {};
    flattenPositions().forEach((position) => {
        positions[position.id] = {
            mastered: false,
            practiceCount: 0,
            updatedAt: null,
        };
    });
    return positions;
}

function ensureProfileLearningData(profile) {
    if (!profile) return;

    if (!profile.positions || typeof profile.positions !== 'object') {
        profile.positions = createDefaultPositionsState();
    }

    const defaults = createDefaultPositionsState();
    Object.keys(defaults).forEach((positionId) => {
        if (!profile.positions[positionId]) {
            profile.positions[positionId] = defaults[positionId];
            return;
        }

        profile.positions[positionId] = {
            mastered: Boolean(profile.positions[positionId].mastered),
            practiceCount: Number.isFinite(profile.positions[positionId].practiceCount)
                ? profile.positions[positionId].practiceCount
                : 0,
            updatedAt: profile.positions[positionId].updatedAt || null,
        };
    });

    if (!Array.isArray(profile.rewards)) {
        profile.rewards = [];
    }
}

function loadTheme() {
    const saved = localStorage.getItem('appbjj-theme') || StateManager.getSettings().theme || 'dark';
    applyTheme(saved);
}

function applyTheme(theme) {
    const wrapper = document.querySelector('.theme-wrapper');
    if (wrapper) {
        wrapper.setAttribute('data-theme', theme);
    }
    localStorage.setItem('appbjj-theme', theme);
    StateManager.updateSetting('theme', theme);
    updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
    const icon = document.querySelector('.icon-sun');
    const theme = localStorage.getItem('appbjj-theme') || 'dark';
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = localStorage.getItem('appbjj-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
});

function generateProfileId() {
    return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

async function createProfile(name, age) {
    if (!name || !age || age < 4 || age > 18) {
        showMessage('Nome e idade válidos são obrigatórios', 'warning');
        return null;
    }

    const user = StateManager.getUser();
    if (!user) return null;

    const newProfile = {
        id: generateProfileId(),
        name,
        age,
        beltIndex: 0,
        gradeInBelt: 0,
        totalClasses: 0,
        classesProgress: 0,
        streak: 0,
        lastCheckinDate: null,
        checkedDates: {},
        badges: [],
        rewards: [],
        positions: createDefaultPositionsState(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    try {
        const profiles = StateManager.getProfiles();
        profiles.push(newProfile);
        StateManager.setProfiles(profiles);
        StateManager.setCurrentProfile(newProfile);

        await db.collection('users').doc(user.uid).set(
            {
                profiles: profiles.reduce((acc, profile) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {}),
                currentProfileId: newProfile.id,
            },
            { merge: true }
        );

        showMessage(`Perfil ${name} criado`, 'success');
        return newProfile.id;
    } catch (error) {
        console.error('Erro ao criar perfil:', error);
        showMessage('Erro ao criar perfil', 'warning');
        return null;
    }
}

async function switchProfile(profileId) {
    const profile = StateManager.getProfiles().find((p) => p.id === profileId);
    if (!profile) return;

    StateManager.setCurrentProfile(profile);

    const user = StateManager.getUser();
    if (user) {
        await db.collection('users').doc(user.uid).set({ currentProfileId: profileId }, { merge: true });
    }

    renderUI();
}

async function deleteProfile(profileId) {
    const profiles = StateManager.getProfiles();
    if (profiles.length <= 1) {
        showMessage('Você deve manter ao menos um perfil', 'warning');
        return;
    }

    const target = profiles.find((p) => p.id === profileId);
    if (!target || !confirm(`Deletar perfil ${target.name}?`)) {
        return;
    }

    try {
        const updated = profiles.filter((p) => p.id !== profileId);
        const current = StateManager.getCurrentProfile();
        const nextCurrent = current?.id === profileId ? updated[0] : current;

        StateManager.setProfiles(updated);
        StateManager.setCurrentProfile(nextCurrent);

        const user = StateManager.getUser();
        if (user) {
            await db.collection('users').doc(user.uid).set(
                {
                    profiles: updated.reduce((acc, profile) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {}),
                    currentProfileId: nextCurrent?.id || null,
                },
                { merge: true }
            );
        }

        showMessage('Perfil removido', 'success');
        renderUI();
    } catch (error) {
        console.error('Erro ao deletar perfil:', error);
        showMessage('Erro ao deletar perfil', 'warning');
    }
}

function renderBeltVisual(profile) {
    const belt = APP_CONFIG.BELTS[profile.beltIndex] || APP_CONFIG.BELTS[0];
    const visual = document.getElementById('belt-visual');
    const title = document.getElementById('belt-title');
    const grade = document.getElementById('belt-grade');

    if (visual) {
        visual.style.background = `linear-gradient(135deg, ${belt.color}, ${belt.color}dd)`;
        visual.style.color = belt.textColor;
    }
    if (title) title.textContent = `Faixa ${belt.name}`;
    if (grade) grade.textContent = `Grau ${profile.gradeInBelt}/${APP_CONFIG.MAX_GRADES}`;

    renderProgress(profile);
}

function renderProgress(profile) {
    const max = APP_CONFIG.CLASSES_FOR_NEXT_GRADE;
    const current = profile.classesProgress || 0;
    const percent = Math.min(100, (current / max) * 100);

    const bar = document.getElementById('progress-bar-fill');
    const text = document.getElementById('progress-text');

    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${current}/${max} aulas`;
}

function renderStats(profile) {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${profile.streak || 0}</div>
            <div class="stat-label">Dias seguidos</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👊</div>
            <div class="stat-value">${profile.totalClasses || 0}</div>
            <div class="stat-label">Total de aulas</div>
        </div>
    `;
}

function renderProfiles() {
    const profileList = document.getElementById('profile-list');
    if (!profileList) return;

    const profiles = StateManager.getProfiles();
    const current = StateManager.getCurrentProfile();

    profileList.innerHTML = profiles.map((p) => `
        <div class="profile-item ${p.id === current?.id ? 'active' : ''}">
            <button class="profile-name" data-profile-id="${p.id}">${p.name} (${p.age} anos)</button>
            <button class="profile-delete" data-profile-id="${p.id}" aria-label="Excluir ${p.name}">✕</button>
        </div>
    `).join('');

    profileList.querySelectorAll('.profile-name').forEach((btn) => {
        btn.addEventListener('click', () => switchProfile(btn.dataset.profileId));
    });

    profileList.querySelectorAll('.profile-delete').forEach((btn) => {
        btn.addEventListener('click', () => deleteProfile(btn.dataset.profileId));
    });
}

function setupDashboardMenus() {
    const studentTabs = Array.from(document.querySelectorAll('[data-module-target]'));
    const teacherTabs = Array.from(document.querySelectorAll('[data-teacher-module-target]'));

    studentTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            switchStudentModule(tab.dataset.moduleTarget);
        });
    });

    teacherTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            switchTeacherModule(tab.dataset.teacherModuleTarget);
        });
    });
}

function switchStudentModule(moduleId = 'section-belt') {
    const visible = STUDENT_MODULES[moduleId] || STUDENT_MODULES['section-belt'];
    const allIds = new Set(Object.values(STUDENT_MODULES).flat());

    allIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.classList.toggle('hidden', !visible.includes(sectionId));
    });

    document.querySelectorAll('[data-module-target]').forEach((tab) => {
        tab.classList.toggle('is-active', tab.dataset.moduleTarget === moduleId);
    });
}

function switchTeacherModule(moduleId = 'section-teacher-requests') {
    const visible = TEACHER_MODULES[moduleId] || TEACHER_MODULES['section-teacher-requests'];
    const allIds = new Set(Object.values(TEACHER_MODULES).flat());

    allIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.classList.toggle('hidden', !visible.includes(sectionId));
    });

    document.querySelectorAll('[data-teacher-module-target]').forEach((tab) => {
        tab.classList.toggle('is-active', tab.dataset.teacherModuleTarget === moduleId);
    });
}

async function persistCurrentProfile(profile) {
    const user = StateManager.getUser();
    if (!user || !profile) return;

    const profiles = StateManager.getProfiles().map((item) => (
        item.id === profile.id ? profile : item
    ));

    StateManager.setProfiles(profiles);
    StateManager.setCurrentProfile(profile);

    await db.collection('users').doc(user.uid).set(
        {
            profiles: profiles.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
            }, {}),
        },
        { merge: true }
    );
}

function getUnlockedRewards(profile) {
    const masteredCount = Object.values(profile.positions || {}).filter((state) => state.mastered).length;
    return POSITION_REWARDS.filter((reward) => masteredCount >= reward.threshold).map((reward) => reward.id);
}

function renderPositionRewards(profile) {
    const rewardsGrid = document.getElementById('positions-rewards-grid');
    if (!rewardsGrid) return;

    const unlockedRewards = getUnlockedRewards(profile);

    rewardsGrid.innerHTML = POSITION_REWARDS.map((reward) => {
        const unlocked = unlockedRewards.includes(reward.id);
        const classes = unlocked ? 'badge earned' : 'badge locked';
        return `
            <div class="${classes}">
                <div class="badge-icon">${reward.icon}</div>
                <div class="badge-name">${reward.name}</div>
                <span class="reward-desc">${reward.description}</span>
            </div>
        `;
    }).join('');

    const countEl = document.getElementById('positions-reward-count');
    if (countEl) countEl.textContent = String(unlockedRewards.length);
}

async function updatePositionPractice(positionId) {
    const profile = StateManager.getCurrentProfile();
    if (!profile?.positions?.[positionId]) return;

    profile.positions[positionId].practiceCount += 1;
    profile.positions[positionId].updatedAt = new Date().toISOString();

    await persistCurrentProfile(profile);
    renderPositionsModule(profile);
}

async function togglePositionMastered(positionId) {
    const profile = StateManager.getCurrentProfile();
    if (!profile?.positions?.[positionId]) return;

    const current = profile.positions[positionId];
    current.mastered = !current.mastered;
    current.updatedAt = new Date().toISOString();

    const previousRewards = Array.isArray(profile.rewards) ? profile.rewards : [];
    const unlocked = getUnlockedRewards(profile);
    profile.rewards = unlocked;

    await persistCurrentProfile(profile);
    renderPositionsModule(profile);

    if (unlocked.length > previousRewards.length) {
        const newestRewardId = unlocked.find((id) => !previousRewards.includes(id));
        const newestReward = POSITION_REWARDS.find((reward) => reward.id === newestRewardId);
        if (newestReward) {
            showMessage(`🏆 Recompensa desbloqueada: ${newestReward.name}`, 'success');
        }
    }
}

function renderPositionsModule(profile) {
    const groupsContainer = document.getElementById('positions-groups');
    if (!groupsContainer || !profile) return;

    ensureProfileLearningData(profile);

    const total = Object.keys(profile.positions).length;
    const mastered = Object.values(profile.positions).filter((state) => state.mastered).length;
    const practicing = Object.values(profile.positions).filter((state) => !state.mastered && state.practiceCount > 0).length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    const masteredEl = document.getElementById('positions-mastered-count');
    const practicingEl = document.getElementById('positions-practicing-count');
    const progressBar = document.getElementById('positions-progress-bar-fill');
    const progressText = document.getElementById('positions-progress-text');

    if (masteredEl) masteredEl.textContent = String(mastered);
    if (practicingEl) practicingEl.textContent = String(practicing);
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}% concluído`;

    groupsContainer.innerHTML = DEFAULT_POSITIONS.map((group) => {
        const items = group.positions.map((position) => {
            const data = profile.positions[position.id] || { mastered: false, practiceCount: 0 };
            return `
                <div class="position-item ${data.mastered ? 'is-mastered' : ''}">
                    <div class="position-item-top">
                        <span class="position-item-title">${position.name}</span>
                        <span class="position-practice">${data.practiceCount} prática(s)</span>
                    </div>
                    <div class="position-actions">
                        <button class="position-btn" type="button" data-position-practice="${position.id}">+1 Prática</button>
                        <button class="position-btn" type="button" data-position-mastered="${position.id}">${data.mastered ? 'Remover domínio' : 'Marcar domínio'}</button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="positions-group">
                <h4 class="positions-group-title">${group.category}</h4>
                <p class="positions-group-desc">${group.description}</p>
                <div class="positions-list">${items}</div>
            </div>
        `;
    }).join('');

    groupsContainer.querySelectorAll('[data-position-practice]').forEach((button) => {
        button.addEventListener('click', async () => {
            button.disabled = true;
            await updatePositionPractice(button.dataset.positionPractice);
        });
    });

    groupsContainer.querySelectorAll('[data-position-mastered]').forEach((button) => {
        button.addEventListener('click', async () => {
            button.disabled = true;
            await togglePositionMastered(button.dataset.positionMastered);
        });
    });

    renderPositionRewards(profile);
}

function renderUI() {
    const profile = StateManager.getCurrentProfile();
    if (!profile) return;
    ensureProfileLearningData(profile);
    renderBeltVisual(profile);
    renderStats(profile);
    renderProfiles();
    renderPositionsModule(profile);
}

function showMessage(msg, type = 'info') {
    const container = document.getElementById('message-container') || document.body;
    const el = document.createElement('div');
    el.className = `message message-${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function openNewProfileModal() {
    document.getElementById('modal-new-profile')?.classList.remove('hidden');
}

function closeNewProfileModal() {
    document.getElementById('modal-new-profile')?.classList.add('hidden');
}

function setupProfileModal() {
    const btnOpen = document.getElementById('btn-add-profile');
    const btnCancel = document.getElementById('btn-cancel-profile');
    const btnSave = document.getElementById('btn-save-profile');
    const inputName = document.getElementById('input-profile-name');
    const inputAge = document.getElementById('input-profile-age');

    btnOpen?.addEventListener('click', openNewProfileModal);
    btnCancel?.addEventListener('click', closeNewProfileModal);

    btnSave?.addEventListener('click', async () => {
        if (!inputName || !inputAge) return;
        const profileId = await createProfile(inputName.value.trim(), parseInt(inputAge.value, 10));
        if (profileId) {
            inputName.value = '';
            inputAge.value = '';
            closeNewProfileModal();
            renderUI();
        }
    });
}

function openSidebar() {
    document.getElementById('app-sidebar')?.classList.add('is-open');
    document.getElementById('sidebar-overlay')?.classList.add('is-visible');
    document.getElementById('app-sidebar')?.setAttribute('aria-hidden', 'false');
}

function closeSidebar() {
    document.getElementById('app-sidebar')?.classList.remove('is-open');
    document.getElementById('sidebar-overlay')?.classList.remove('is-visible');
    document.getElementById('app-sidebar')?.setAttribute('aria-hidden', 'true');
}

function updateSidebarRole(role) {
    const navStudent = document.getElementById('sidebar-nav-student');
    const navTeacher = document.getElementById('sidebar-nav-teacher');
    const isTeacher = role === RoleManager.TEACHER;

    navStudent?.classList.toggle('hidden', isTeacher);
    navTeacher?.classList.toggle('hidden', !isTeacher);
}

// Chamada UMA vez em DOMContentLoaded — só registra eventos estruturais
function setupSidebarEvents() {
    document.getElementById('btn-open-sidebar')?.addEventListener('click', openSidebar);
    document.getElementById('profile-menu-toggle')?.addEventListener('click', openSidebar);
    document.getElementById('btn-close-sidebar')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    document.querySelectorAll('.sidebar-nav-item').forEach((item) => {
        item.addEventListener('click', closeSidebar);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });

    // Logout — único listener
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if (!confirm('Deseja sair da sua conta?')) return;
        closeSidebar();
        logout();
    });
}

// Chamada após autenticação — preenche dados do usuário no sidebar
function updateSidebarUser(user) {
    const nameEl = document.getElementById('sidebar-user-name');
    const emailEl = document.getElementById('sidebar-user-email');
    const avatarEl = document.getElementById('sidebar-avatar');
    const headerAvatar = document.getElementById('profile-avatar');

    if (nameEl) nameEl.textContent = user.displayName || 'Usuário';
    if (emailEl) emailEl.textContent = user.email || '';
    if (avatarEl && user.photoURL) {
        avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Avatar" referrerpolicy="no-referrer">`;
    }
    if (headerAvatar && user.photoURL) {
        headerAvatar.innerHTML = `<img src="${user.photoURL}" alt="Perfil" class="profile-avatar-img" referrerpolicy="no-referrer">`;
    }

    const itemTeacher = document.getElementById('sidebar-item-teacher');
    const itemStudent = document.getElementById('sidebar-item-student');
    itemTeacher?.classList.remove('hidden');
    itemStudent?.classList.remove('hidden');

    // Remove listeners antigos substituindo os nós (evita duplicação em relogins)
    const replaceWithClone = (el) => {
        if (!el) return null;
        const clone = el.cloneNode(true);
        el.parentNode?.replaceChild(clone, el);
        return clone;
    };

    const freshTeacher = replaceWithClone(document.getElementById('sidebar-item-teacher'));
    const freshStudent = replaceWithClone(document.getElementById('sidebar-item-student'));

    freshTeacher?.addEventListener('click', async (e) => {
        e.preventDefault();
        closeSidebar();
        try {
            await RoleManager.setRole(user.uid, RoleManager.TEACHER);
            showMessage('Modo professor ativado', 'success');
        } catch (error) {
            console.error('Erro ao ativar modo professor:', error);
            showMessage('Não foi possível ativar modo professor', 'warning');
        }
    });

    freshStudent?.addEventListener('click', async (e) => {
        e.preventDefault();
        closeSidebar();
        try {
            await RoleManager.setRole(user.uid, RoleManager.STUDENT);
            await RoleManager.initializeRole(user.uid);
            showMessage('Modo aluno ativado', 'success');
        } catch (error) {
            console.error('Erro ao ativar modo aluno:', error);
            showMessage('Não foi possível ativar modo aluno', 'warning');
        }
    });

    updateSidebarRole(StateManager.getState().role);
}

// Mantido por compatibilidade com DOMContentLoaded — delega para setupSidebarEvents
function setupProfileMenu() {
    // No-op: substituído por setupSidebarEvents() + updateSidebarUser()
}

function updateTeacherStats(count) {
    const statStudents = document.getElementById('stat-total-students');
    const statApproved = document.getElementById('stat-approved-today');
    if (statStudents) statStudents.textContent = count != null ? String(count) : (StateManager.getCheckinRequests()?.length ?? 0).toString();
    if (statApproved) statApproved.textContent = '0';
}

function renderCheckingRequests(requests) {
    const container = document.getElementById('requests-container');
    if (!container) return;

    if (!requests || !requests.length) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhuma solicitação pendente</p>';
        updateTeacherStats(0);
        return;
    }

    container.innerHTML = requests.map((req) => `
        <div class="request-card">
            <div class="request-info">
                <div class="request-name">${req.studentName || 'Aluno'}</div>
                <div class="request-age">${req.studentAge ? req.studentAge + ' anos' : ''}</div>
            </div>
            <div class="request-actions">
                <button class="btn btn-primary" data-action="approve" data-request-id="${req.id}" data-student-id="${req.studentId}" data-profile-id="${req.profileId}">Aprovar</button>
                <button class="btn btn-secondary" data-action="reject" data-request-id="${req.id}">Rejeitar</button>
            </div>
        </div>
    `).join('');

    updateTeacherStats(requests.length);

    container.querySelectorAll('[data-action="approve"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            const teacherUser = StateManager.getUser();
            const ok = await CheckinManager.approveCheckin(btn.dataset.requestId, btn.dataset.studentId, btn.dataset.profileId);
            if (ok) {
                // Incrementar progressão no perfil do ALUNO (não do professor)
                await FirestoreService.incrementStudentProfile(
                    teacherUser.uid,
                    btn.dataset.studentId,
                    btn.dataset.profileId,
                    new Date()
                );
                // O listener real-time atualiza os cards automaticamente
            } else {
                btn.disabled = false;
            }
        });
    });

    container.querySelectorAll('[data-action="reject"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            const ok = await CheckinManager.rejectCheckin(btn.dataset.requestId);
            if (!ok) btn.disabled = false;
            // O listener real-time atualiza os cards automaticamente
        });
    });
}

// Listener real-time de solicitações (evita re-fetch a cada mudança de estado)
let _requestsUnsubscribe = null;

async function renderTeacherDashboard() {
    document.getElementById('student-dashboard')?.classList.add('hidden');
    document.getElementById('teacher-dashboard')?.classList.remove('hidden');
    switchTeacherModule('section-teacher-requests');

    const user = StateManager.getUser();
    if (!user) return;

    // Cancelar listener anterior e criar novo
    if (_requestsUnsubscribe) {
        _requestsUnsubscribe();
        _requestsUnsubscribe = null;
    }

    _requestsUnsubscribe = FirestoreService.subscribeToCheckinRequests(user.uid, (requests) => {
        renderCheckingRequests(requests);
    });

    updateTeacherStats();
}

async function requestChecinToday() {
    if (RoleManager.isTeacher()) {
        showMessage('Professores não podem solicitar check-in', 'warning');
        return false;
    }

    let linkedTeacherId = StateManager.getState().linkedTeacher?.id;
    if (!linkedTeacherId) {
        const teacherUid = window.prompt('Informe o UID da conta do professor para vincular este aluno:');
        if (!teacherUid || !teacherUid.trim()) {
            showMessage('Vínculo com professor não informado', 'warning');
            return false;
        }

        const user = StateManager.getUser();
        if (!user?.uid) {
            showMessage('Usuário não autenticado', 'warning');
            return false;
        }

        try {
            await RoleManager.linkStudentToTeacher(user.uid, teacherUid.trim());
            await RoleManager.initializeRole(user.uid);
            linkedTeacherId = StateManager.getState().linkedTeacher?.id;
        } catch (error) {
            console.error('Erro ao vincular professor:', error);
            showMessage('Não foi possível vincular com professor', 'warning');
            return false;
        }
    }

    if (!linkedTeacherId) {
        showMessage('Você não está vinculado a um professor', 'warning');
        return false;
    }

    return CheckinManager.requestCheckin(new Date());
}

async function requestCheckinToday() {
    return requestChecinToday();
}

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupSidebarEvents();
    setupProfileModal();
    setupDashboardMenus();
    switchStudentModule('section-belt');

    // Handler global para fechar modais via data-dismiss="modal"
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-dismiss="modal"]');
        if (btn) {
            const modal = btn.closest('.modal');
            if (modal) modal.classList.add('hidden');
        }
    });

    document.getElementById('btn-request-checkin')?.addEventListener('click', async () => {
        await requestChecinToday();
        renderUI();
    });
});

let _lastRole = null;
StateManager.subscribe((newState) => {
    if (!newState.user) return;
    updateSidebarRole(newState.role);

    // Só re-renderiza o dashboard quando o PAPEL mudar (evita loop em outras mudanças de estado)
    if (newState.role === _lastRole) return;
    _lastRole = newState.role;

    if (newState.role === RoleManager.TEACHER) {
        renderTeacherDashboard();
    } else {
        // Cancelar listener de solicitações ao sair do modo professor
        if (_requestsUnsubscribe) {
            _requestsUnsubscribe();
            _requestsUnsubscribe = null;
        }
        document.getElementById('teacher-dashboard')?.classList.add('hidden');
        document.getElementById('student-dashboard')?.classList.remove('hidden');
        switchStudentModule('section-belt');
        renderUI();
    }
});

// ============================================================================
// FACE RECOGNITION UI — Cadastro de Rosto (Aluno) + Check-in por Foto (Sensei)
// ============================================================================

function initFaceRecognitionUI() {
    _initFaceEnrollUI();
    _initFaceCheckinUI();
}

// --- ALUNO: Cadastrar rosto ---------------------------------------------------

function _initFaceEnrollUI() {
    const inputFile = document.getElementById('input-face-photo');
    const previewSection = document.getElementById('face-enroll-preview');
    const previewImg = document.getElementById('face-preview-img');
    const consentCheck = document.getElementById('face-consent-check');
    const btnConfirm = document.getElementById('btn-confirm-face-enroll');
    const btnCancel = document.getElementById('btn-cancel-face-enroll');
    const qualityEl = document.getElementById('face-enroll-quality');

    if (!inputFile) return;

    let selectedFile = null;
    let qualityApproved = false;

    inputFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selectedFile = file;

        if (qualityEl) {
            qualityEl.className = 'face-quality-status';
            qualityEl.textContent = 'Analisando qualidade da foto...';
            qualityEl.classList.remove('hidden');
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            previewSection.classList.remove('hidden');
            if (consentCheck) consentCheck.checked = false;
            if (btnConfirm) btnConfirm.disabled = true;
        };
        reader.readAsDataURL(file);

        const quality = await _analyzeFaceEnrollmentPhoto(file);
        qualityApproved = quality.ok;

        if (qualityEl) {
            qualityEl.textContent = quality.message;
            qualityEl.className = `face-quality-status ${quality.ok ? 'is-good' : 'is-warning'}`;
            qualityEl.classList.remove('hidden');
        }

        if (!quality.ok) {
            showMessage(quality.message, 'warning');
        }

        // Limpar input para permitir re-selecionar o mesmo arquivo
        inputFile.value = '';
    });

    consentCheck?.addEventListener('change', () => {
        if (btnConfirm) btnConfirm.disabled = !(consentCheck.checked && qualityApproved);
    });

    btnCancel?.addEventListener('click', () => {
        previewSection.classList.add('hidden');
        selectedFile = null;
        qualityApproved = false;
        if (consentCheck) consentCheck.checked = false;
        if (btnConfirm) btnConfirm.disabled = true;
        if (qualityEl) {
            qualityEl.classList.add('hidden');
            qualityEl.className = 'face-quality-status hidden';
            qualityEl.textContent = '';
        }
    });

    btnConfirm?.addEventListener('click', async () => {
        if (!selectedFile) return;

        const profile = StateManager.getCurrentProfile();
        if (!profile) {
            showMessage('Selecione um perfil primeiro', 'warning');
            return;
        }

        btnConfirm.disabled = true;
        btnConfirm.textContent = '⏳ Processando...';

        const ok = await CheckinManager.enrollFace(selectedFile, profile.id);

        btnConfirm.textContent = '✓ Cadastrar Rosto';

        if (ok) {
            previewSection.classList.add('hidden');
            selectedFile = null;
            qualityApproved = false;
            if (qualityEl) {
                qualityEl.classList.add('hidden');
                qualityEl.className = 'face-quality-status hidden';
                qualityEl.textContent = '';
            }
            _updateFaceEnrollStatus(profile);
        } else {
            btnConfirm.disabled = !(consentCheck?.checked && qualityApproved);
        }
    });
}

async function _analyzeFaceEnrollmentPhoto(file) {
    if (!file.type.startsWith('image/')) {
        return { ok: false, message: 'Envie um arquivo de imagem válido.' };
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
        return { ok: false, message: 'Imagem muito grande. Use até 8 MB.' };
    }

    try {
        const image = await FaceRecognition.imageFileToElement(file);

        if (image.width < 480 || image.height < 480) {
            return { ok: false, message: 'Use uma foto com resolução maior (mínimo 480x480).' };
        }

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, 64, 64);

        const pixels = ctx.getImageData(0, 0, 64, 64).data;
        let sum = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        }
        const brightness = sum / (pixels.length / 4);

        if (brightness < 55) {
            return { ok: false, message: 'Foto escura. Aumente a iluminação e tente novamente.' };
        }

        const descriptor = await FaceRecognition.extractDescriptor(image);
        if (!descriptor) {
            return { ok: false, message: 'Não foi possível detectar um rosto único e frontal.' };
        }

        return { ok: true, message: 'Foto aprovada para cadastro facial.' };
    } catch (error) {
        console.error('Erro na análise de foto facial:', error);
        return { ok: false, message: 'Não foi possível analisar a foto. Tente outra imagem.' };
    }
}

function _updateFaceEnrollStatus(profile) {
    const statusEl = document.getElementById('face-enroll-status');
    const iconEl = document.getElementById('face-status-icon');
    const textEl = document.getElementById('face-status-text');

    if (!statusEl) return;

    if (profile?.faceDescriptor?.length === 128) {
        statusEl.className = 'face-status face-status--enrolled';
        if (iconEl) iconEl.textContent = '✅';
        if (textEl) textEl.textContent = 'Rosto cadastrado';
    } else {
        statusEl.className = 'face-status face-status--none';
        if (iconEl) iconEl.textContent = '📷';
        if (textEl) textEl.textContent = 'Rosto não cadastrado';
    }
}

// Atualizar status sempre que o perfil mudar
StateManager.subscribe((state) => {
    const profile = state.currentProfile || state.profiles?.[0];
    if (profile) _updateFaceEnrollStatus(profile);
});

// --- PROFESSOR: Check-in por foto --------------------------------------------

function _initFaceCheckinUI() {
    const uploadArea = document.getElementById('face-upload-area');
    const inputPhoto = document.getElementById('input-training-photo');
    const processing = document.getElementById('face-processing');

    if (!uploadArea || !inputPhoto) return;

    // Clicar na área abre o seletor de arquivo
    uploadArea.addEventListener('click', (e) => {
        if (e.target === inputPhoto) return; // evitar loop de bubble
        inputPhoto.click();
    });

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) _handleTrainingPhoto(file, processing);
    });

    inputPhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) _handleTrainingPhoto(file, processing);
        inputPhoto.value = '';
    });

    // Botão cancelar modal
    document.getElementById('btn-close-face-results')?.addEventListener('click', _closeFaceResultsModal);
    document.getElementById('btn-cancel-face-checkin')?.addEventListener('click', _closeFaceResultsModal);

    // Marcar / desmarcar todos
    document.getElementById('btn-select-all-faces')?.addEventListener('click', () => {
        document.querySelectorAll('#face-recognized-list input[type=checkbox]').forEach(cb => {
            cb.checked = true;
            cb.closest('.face-checkin-card')?.classList.add('is-selected');
        });
        _updateConfirmCount();
    });

    document.getElementById('btn-deselect-all-faces')?.addEventListener('click', () => {
        document.querySelectorAll('#face-recognized-list input[type=checkbox]').forEach(cb => {
            cb.checked = false;
            cb.closest('.face-checkin-card')?.classList.remove('is-selected');
        });
        _updateConfirmCount();
    });

    // Botão confirmar check-ins selecionados
    document.getElementById('btn-confirm-face-checkin')?.addEventListener('click', async () => {
        const checked = document.querySelectorAll('#face-recognized-list input[type=checkbox]:checked');
        const confirmed = Array.from(checked).map(cb => ({
            studentId: cb.dataset.studentId,
            profileId: cb.dataset.profileId,
            studentName: cb.dataset.name,
        }));

        const teacher = StateManager.getUser();
        if (!teacher) return;

        const btnConfirm = document.getElementById('btn-confirm-face-checkin');
        btnConfirm.disabled = true;
        btnConfirm.textContent = '⏳ Confirmando...';

        const ok = await CheckinManager.confirmFaceCheckins(teacher.uid, confirmed);

        btnConfirm.disabled = false;
        btnConfirm.textContent = '✓ Confirmar Check-ins Selecionados';

        if (ok) _closeFaceResultsModal();
    });
}

async function _handleTrainingPhoto(file, processingEl) {
    const teacher = StateManager.getUser();
    if (!teacher) {
        showMessage('Usuário não autenticado', 'warning');
        return;
    }

    // Limpar status anterior
    const statusEl = document.getElementById('face-section-status');
    if (statusEl) { statusEl.classList.add('hidden'); statusEl.innerHTML = ''; }

    if (processingEl) processingEl.classList.remove('hidden');

    const result = await CheckinManager.processFaceCheckin(file, teacher.uid);

    if (processingEl) processingEl.classList.add('hidden');

    if (!result) {
        // Exibir cartão de erro persistente na seção (além do toast já exibido)
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.innerHTML = `
                <div class="face-status-card face-status-error">
                    <div class="face-status-icon">⚠️</div>
                    <div class="face-status-text">
                        <p class="face-status-title">Não foi possível processar a foto</p>
                        <p class="face-status-desc">Verifique se: os rostos estão visíveis e bem iluminados, os alunos cadastraram o rosto no app e a foto tem tamanho adequado (max 10 MB).</p>
                    </div>
                    <button class="btn btn-small btn-secondary face-status-close"
                        onclick="document.getElementById('face-section-status').classList.add('hidden')">✕</button>
                </div>
            `;
        }
        return;
    }

    _openFaceResultsModal(result.results, result.imageElement);
}

function _updateConfirmCount() {
    const checked = document.querySelectorAll('#face-recognized-list input[type=checkbox]:checked').length;
    const btn = document.getElementById('btn-confirm-face-checkin');
    if (!btn) return;
    btn.disabled = checked === 0;
    btn.textContent = checked > 0 ? `✓ Confirmar ${checked} Check-in(s)` : '✓ Confirmar Check-ins';
}

function _openFaceResultsModal(results, imgElement) {
    const modal = document.getElementById('modal-face-results');
    const resultImg = document.getElementById('face-result-img');
    const canvas = document.getElementById('face-result-canvas');
    const recognizedList = document.getElementById('face-recognized-list');
    const unknownListEl = document.getElementById('face-unknown-list');
    const summaryEl = document.getElementById('face-result-summary');
    const warningsEl = document.getElementById('face-result-warnings');

    if (!modal) return;

    // Imagem + canvas
    resultImg.src = imgElement.src;
    resultImg.onload = () => FaceRecognition.drawResults(canvas, resultImg, results);
    if (resultImg.complete) FaceRecognition.drawResults(canvas, resultImg, results);

    // Deduplicar por studentId+profileId (pegar melhor confiança)
    const rawRecognized = results.filter(r => r.recognized);
    const unknown = results.filter(r => !r.recognized);
    const uniqueMap = new Map();
    for (const r of rawRecognized) {
        const key = `${r.studentId}||${r.profileId}`;
        if (!uniqueMap.has(key) || r.distance < uniqueMap.get(key).distance) {
            uniqueMap.set(key, r);
        }
    }
    const recognized = Array.from(uniqueMap.values());

    // ── Barra de resumo ──
    summaryEl.innerHTML = `
        <div class="face-summary-stat">
            <span class="face-summary-num">${results.length}</span>
            <span class="face-summary-label">Detectado(s)</span>
        </div>
        <div class="face-summary-divider"></div>
        <div class="face-summary-stat face-summary--ok">
            <span class="face-summary-num">${recognized.length}</span>
            <span class="face-summary-label">Identificado(s)</span>
        </div>
        <div class="face-summary-divider"></div>
        <div class="face-summary-stat face-summary--unknown">
            <span class="face-summary-num">${unknown.length}</span>
            <span class="face-summary-label">Desconhecido(s)</span>
        </div>
    `;

    // ── Avisos de baixa confiança ──
    const lowConf = recognized.filter(r => (1 - r.distance) < 0.65);
    if (lowConf.length > 0 && warningsEl) {
        warningsEl.classList.remove('hidden');
        warningsEl.innerHTML = `
            <span class="face-warn-icon">⚠️</span>
            <span>${lowConf.length} aluno(s) com baixa confiança — revise antes de confirmar.</span>
        `;
    } else if (warningsEl) {
        warningsEl.classList.add('hidden');
        warningsEl.innerHTML = '';
    }

    // ── Cards dos identificados ──
    if (recognized.length > 0) {
        recognizedList.innerHTML = recognized.map(r => {
            const confidence = Math.round((1 - r.distance) * 100);
            const confClass = confidence >= 75 ? 'face-conf-high' : confidence >= 60 ? 'face-conf-medium' : 'face-conf-low';
            const confLabel = confidence >= 75 ? 'Alta confiança' : confidence >= 60 ? 'Média' : '⚠️ Baixa';
            const autoChecked = confidence >= 55;
            return `
                <li class="face-checkin-card${autoChecked ? ' is-selected' : ''}">
                    <label class="face-checkin-card-inner">
                        <input
                            type="checkbox"
                            ${autoChecked ? 'checked' : ''}
                            data-student-id="${_escHtml(r.studentId)}"
                            data-profile-id="${_escHtml(r.profileId)}"
                            data-name="${_escHtml(r.studentName)}"
                        >
                        <div class="face-checkin-avatar">👤</div>
                        <div class="face-checkin-info">
                            <span class="face-checkin-name">${_escHtml(r.studentName)}</span>
                            <div class="face-confidence-wrap">
                                <div class="face-confidence-bar">
                                    <div class="face-confidence-fill ${confClass}" style="width:${confidence}%"></div>
                                </div>
                                <span class="face-checkin-confidence ${confClass}">${confidence}% — ${confLabel}</span>
                            </div>
                        </div>
                        <div class="face-checkin-check-icon">✓</div>
                    </label>
                </li>
            `;
        }).join('');

        recognizedList.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.addEventListener('change', () => {
                cb.closest('.face-checkin-card')?.classList.toggle('is-selected', cb.checked);
                _updateConfirmCount();
            });
        });
    } else {
        recognizedList.innerHTML = `
            <li class="face-checkin-empty">
                <div class="face-empty-icon">🔍</div>
                <p>Nenhum aluno identificado.</p>
                <p class="face-empty-hint">Verifique se os alunos cadastraram o rosto no app.</p>
            </li>
        `;
    }

    // ── Cards dos desconhecidos ──
    if (unknownListEl) {
        if (unknown.length > 0) {
            unknownListEl.innerHTML = unknown.map((_, i) => `
                <li class="face-checkin-card face-checkin-card--unknown">
                    <div class="face-checkin-card-inner">
                        <div class="face-checkin-avatar face-avatar-unknown">❓</div>
                        <div class="face-checkin-info">
                            <span class="face-checkin-name">Rosto ${i + 1} — Não identificado</span>
                            <span class="face-checkin-hint">Nenhum cadastro de rosto correspondente</span>
                        </div>
                    </div>
                </li>
            `).join('');
        } else {
            unknownListEl.innerHTML = `<li class="face-checkin-empty face-unknown-empty">🎉 Todos os rostos foram identificados!</li>`;
        }
    }

    _updateConfirmCount();
    modal.classList.remove('hidden');
}

function _closeFaceResultsModal() {
    document.getElementById('modal-face-results')?.classList.add('hidden');
}

// Escapar HTML para evitar XSS ao inserir dados do Firestore na DOM
function _escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
