// ============================================================================
// AUTENTICAÇÃO REFATORADA — Google Sign-In com Integração de State
// ============================================================================

let currentUser = null;

// --- Login com Google ---
async function loginWithGoogle() {
    const btn = document.getElementById('btn-google-login');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Entrando...';
    }

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        try {
            await auth.signInWithPopup(provider);
        } catch (popupError) {
            if (popupError.code === 'auth/popup-blocked' ||
                popupError.code === 'auth/popup-closed-by-user') {
                await auth.signInWithRedirect(provider);
                return;
            }
            throw popupError;
        }
    } catch (error) {
        console.error('Erro no login:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Erro ao fazer login. Tente novamente.');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Entrar com Google`;
        }
    }
}

// --- Logout ---
async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        StateManager.clear();
    } catch (error) {
        console.error('Erro no logout:', error);
        alert('Erro ao sair. Tente novamente.');
    }
}

// --- Atualizar UI do usuário ---
function updateUserUI(user) {
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl && user.photoURL) {
        avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Perfil" class="profile-avatar-img" referrerpolicy="no-referrer">`;
    }
}

// --- Inicializar autenticação ---
function initAuth() {
    const loadingScreen = document.getElementById('loading-screen');
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Usuário autenticado
            currentUser = user;
            StateManager.setUser({
                uid: user.uid,
                displayName: user.displayName || '',
                email: user.email || '',
                photoURL: user.photoURL || '',
            });

            if (loginScreen) loginScreen.classList.add('hidden');
            if (appContent) appContent.classList.remove('hidden');
            updateUserUI(user);

            // Carregar dados do Firestore
            try {
                await loadUserData(user.uid);
            } catch (e) {
                console.warn('Erro ao carregar dados:', e);
                showMessage('Modo offline', 'warning');
            }

            // Atualizar sidebar com dados do usuário agora que temos auth
            if (typeof updateSidebarUser === 'function') {
                updateSidebarUser({
                    uid: user.uid,
                    displayName: user.displayName || '',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                });
            }

            renderUI();
        } else {
            // Usuário não autenticado
            currentUser = null;
            StateManager.clear();
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (appContent) appContent.classList.add('hidden');
        }

        if (loadingScreen) loadingScreen.classList.add('hidden');
    });
}

// --- Carregar dados do usuário do Firestore ---
async function loadUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            // Primeiro login - criar documento
            await db.collection('users').doc(userId).set({
                displayName: currentUser.displayName || '',
                email: currentUser.email || '',
                photoURL: currentUser.photoURL || '',
                role: RoleManager.STUDENT,
                profiles: {},
                currentProfileId: null,
                settings: {
                    theme: localStorage.getItem('appbjj-theme') || 'dark',
                    notificationsEnabled: true,
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Criar primeiro perfil
            const profileId = await createProfile('Minha Criança', 8);
            if (profileId) {
                StateManager.setCurrentProfile(StateManager.getProfiles()[0]);
            }
            return;
        }

        const userData = userDoc.data();

        // Carregar perfis
        const profiles = userData.profiles ? Object.values(userData.profiles) : [];
        StateManager.setProfiles(profiles);

        // Carregar perfil atual
        const currentProfileId = userData.currentProfileId || profiles[0]?.id;
        if (currentProfileId) {
            const currentProfile = profiles.find(p => p.id === currentProfileId);
            if (currentProfile) {
                StateManager.setCurrentProfile(currentProfile);
            } else if (profiles.length > 0) {
                StateManager.setCurrentProfile(profiles[0]);
            }
        } else if (profiles.length > 0) {
            StateManager.setCurrentProfile(profiles[0]);
        }

        // Se não tiver perfis, criar um
        if (profiles.length === 0) {
            const profileId = await createProfile('Minha Criança', 8);
            if (profileId) {
                StateManager.setCurrentProfile(StateManager.getProfiles()[0]);
            }
        }

        // Carregar role (aluno/professor)
        await RoleManager.initializeRole(userId);
        const role = StateManager.getRole();

        // Carregar solicitações de check-in (se professor)
        if (role === RoleManager.TEACHER) {
            const requests = await CheckinManager.getPendingRequests(userId);
            StateManager.setCheckinRequests(requests);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        throw error;
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-google-login')?.addEventListener('click', loginWithGoogle);
    // btn-logout é gerenciado pelo setupSidebarEvents() em app.js
});
