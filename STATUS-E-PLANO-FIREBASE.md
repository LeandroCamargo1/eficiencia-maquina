# AppBJJ Kids — Status Atual e Plano de Integração Firebase

> Documento gerado em: 20/04/2026  
> Versão atual do app: v1.0

---

## 1. SITUAÇÃO ATUAL DO APP

### 1.1 Visão Geral

O **AppBJJ Kids** é um PWA (Progressive Web App) de acompanhamento de progresso em Jiu-Jitsu infantil. Funciona 100% offline, usando apenas tecnologias front-end (HTML/CSS/JS vanilla) sem nenhum backend ou serviço de nuvem.

### 1.2 Arquivos do Projeto

| Arquivo | Linhas (aprox.) | Função |
|---------|-----------------|--------|
| `index.html` | ~350 | Página única (SPA) com todas as seções |
| `app.js` | ~900 | Toda a lógica do app |
| `script.js` | — | Arquivo auxiliar (vazio/mínimo) |
| `styles.css` | ~600 | Estilos principais + temas dark/light |
| `styles-enhanced.css` | ~200 | Estilos complementares (modais, menus) |
| `manifest.json` | ~50 | Configuração PWA |
| `sw.js` | ~120 | Service Worker (cache offline) |
| `integrations-future.js` | ~300 | Templates de integrações futuras (não ativos) |

### 1.3 Funcionalidades Implementadas (✅)

| # | Funcionalidade | Status |
|---|---------------|--------|
| 1 | Múltiplos perfis de crianças (criar, trocar, deletar) | ✅ Completo |
| 2 | Sistema de faixas (Branca → Azul → Roxa → Marrom → Preta) | ✅ Completo |
| 3 | Sistema de graus (0-4 por faixa, progressão automática) | ✅ Completo |
| 4 | Check-in de aulas (por data, calendário visual) | ✅ Completo |
| 5 | Calendário mensal interativo (navegação mês a mês) | ✅ Completo |
| 6 | Estatísticas (streak, aulas/semana, total, assiduidade %) | ✅ Completo |
| 7 | Gráfico de aulas (Chart.js — últimos 30 dias) | ✅ Completo |
| 8 | Conquistas/Badges (6 badges desbloqueáveis) | ✅ Completo |
| 9 | Histórico de atividades (últimos 50 registros + undo) | ✅ Completo |
| 10 | Posições de Jiu-Jitsu (12 posições em 4 categorias, marcar domínio) | ✅ Completo |
| 11 | Tema dark/light com toggle | ✅ Completo |
| 12 | PWA offline (Service Worker + cache) | ✅ Completo |
| 13 | Configurações (aulas p/ próximo grau, meta semanal) | ✅ Completo |
| 14 | Design responsivo (mobile, tablet, desktop) | ✅ Completo |

### 1.4 Funcionalidades NÃO Implementadas (❌)

| # | Funcionalidade | Status |
|---|---------------|--------|
| 1 | Autenticação de usuários (login/registro) | ❌ Não existe |
| 2 | Banco de dados na nuvem | ❌ Não existe |
| 3 | Sincronização entre dispositivos | ❌ Não existe |
| 4 | Dashboard do instrutor | ❌ Não existe |
| 5 | Notas do instrutor por aluno | ❌ Não existe |
| 6 | Notificações push | ❌ Só template |
| 7 | Exportação PDF | ❌ Só template |
| 8 | Google Calendar sync | ❌ Só template |
| 9 | Leaderboard / ranking | ❌ Não existe |
| 10 | Sistema de pontos/XP | ❌ Só template |

### 1.5 Como os Dados São Armazenados Hoje

**Método:** `localStorage` do navegador (chave `appbjj-kids-state-v2`)

**Limitações críticas:**
- Dados ficam APENAS no navegador/dispositivo usado
- Se limpar o cache, **perde tudo**
- Não sincroniza entre celular ↔ computador
- Limite de ~5-10 MB por domínio
- Sem backup automático
- Sem proteção por senha

**Estrutura atual no localStorage:**
```json
{
  "currentProfileId": "profile_xxx",
  "profiles": {
    "profile_xxx": {
      "id": "profile_xxx",
      "name": "Nome da Criança",
      "age": 8,
      "beltIndex": 0,
      "gradeInBelt": 2,
      "classesProgress": 3,
      "totalClasses": 23,
      "createdAt": "2025-10-27T...",
      "checkedDates": { "2025-10-27": true },
      "badges": ["first-checkin", "streak-7"],
      "history": [{ "type": "checkin", "data": {}, "snapshot": {}, "timestamp": "" }],
      "positions": { "closed-guard": { "mastered": true, "practiceCount": 5 } }
    }
  },
  "settings": {
    "classesForNextGrade": 10,
    "weeklyGoal": 3,
    "theme": "dark",
    "notificationsEnabled": true
  }
}
```

---

## 2. O QUE PRECISA SER FEITO (Firebase Auth + Firestore)

### 2.1 Resumo das Tarefas

```
┌─────────────────────────────────────────────────┐
│              TAREFAS NECESSÁRIAS                 │
├─────────────────────────────────────────────────┤
│ FASE 1 — Setup Firebase (Pré-requisitos)        │
│   1.1 Criar projeto no Firebase Console         │
│   1.2 Adicionar Firebase SDK ao projeto         │
│   1.3 Configurar regras de segurança            │
│                                                 │
│ FASE 2 — Autenticação Google                    │
│   2.1 Criar tela de login                       │
│   2.2 Implementar login com Google              │
│   2.3 Implementar logout                        │
│   2.4 Gerenciar estado de autenticação          │
│   2.5 Proteger rotas/seções do app              │
│                                                 │
│ FASE 3 — Firestore Database                     │
│   3.1 Modelar coleções/documentos               │
│   3.2 Migrar persistência (localStorage → FS)   │
│   3.3 Implementar CRUD Firestore                │
│   3.4 Implementar sincronização                 │
│   3.5 Manter suporte offline                    │
│                                                 │
│ FASE 4 — Ajustes e Polimento                    │
│   4.1 Loading states e tratamento de erros      │
│   4.2 Migração de dados existentes              │
│   4.3 Testes de integração                      │
└─────────────────────────────────────────────────┘
```

---

### 2.2 FASE 1 — Setup do Firebase

#### 2.2.1 Criar Projeto no Firebase Console

1. Acessar https://console.firebase.google.com
2. Criar novo projeto: **"AppBJJ-Kids"**
3. Ativar **Google Analytics** (opcional, mas recomendado)
4. No painel do projeto:
   - Ir em **Authentication** → **Sign-in method** → Habilitar **Google**
   - Ir em **Firestore Database** → Criar banco em **modo de produção**
   - Escolher região: `southamerica-east1` (São Paulo)
5. Registrar app web: **"AppBJJ Kids Web"**
6. Copiar as credenciais (`firebaseConfig`)

#### 2.2.2 Adicionar Firebase SDK ao index.html

**Arquivo a modificar:** `index.html`

Adicionar antes do `</body>`:
```html
<!-- Firebase SDK (compat para uso sem bundler) -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
```

**Arquivo NOVO a criar:** `firebase-config.js`
```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "appbjj-kids.firebaseapp.com",
  projectId: "appbjj-kids",
  storageBucket: "appbjj-kids.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Habilitar persistência offline do Firestore
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline: múltiplas abas abertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline: navegador não suporta');
    }
  });
```

#### 2.2.3 Regras de Segurança do Firestore

**Configurar no Firebase Console** → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários só acessam seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Sub-coleção de perfis de crianças
      match /profiles/{profileId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

### 2.3 FASE 2 — Autenticação com Google

#### 2.3.1 Criar Tela de Login

**Arquivo a modificar:** `index.html`

Adicionar nova seção ANTES do conteúdo principal:
```html
<!-- Tela de Login (visível quando deslogado) -->
<section id="login-screen" class="login-screen">
  <div class="login-container">
    <div class="login-logo">🥋</div>
    <h1>AppBJJ Kids</h1>
    <p>Acompanhamento de Jiu-Jitsu Infantil</p>
    <button id="btn-google-login" class="btn-google-login">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20">
      Entrar com Google
    </button>
    <p class="login-info">Seus dados ficam seguros e sincronizados na nuvem</p>
  </div>
</section>

<!-- App Principal (oculto quando deslogado) -->
<div id="app-content" class="app-content hidden">
  <!-- TODO: mover todo o conteúdo atual do app para dentro deste div -->
</div>
```

**Arquivo a modificar:** `styles.css`

Adicionar estilos da tela de login:
```css
/* Tela de Login */
.login-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-black);
}

.login-container {
  text-align: center;
  padding: 48px 32px;
  background: var(--color-dark-gray);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-soft);
  max-width: 400px;
  width: 90%;
}

.login-logo {
  font-size: 64px;
  margin-bottom: 16px;
}

.login-container h1 {
  color: var(--color-white);
  margin-bottom: 8px;
}

.login-container p {
  color: var(--color-light-gray);
  margin-bottom: 24px;
}

.btn-google-login {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 32px;
  background: var(--color-white);
  color: #333;
  border: none;
  border-radius: var(--radius-small);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-google-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.hidden { display: none !important; }
```

#### 2.3.2 Implementar Login/Logout com Google

**Arquivo NOVO a criar:** `auth.js`
```javascript
// ============================================
// MÓDULO DE AUTENTICAÇÃO
// ============================================

let currentUser = null;

// --- Login com Google ---
async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await auth.signInWithPopup(provider);
    currentUser = result.user;
    console.log('Login OK:', currentUser.displayName);
  } catch (error) {
    console.error('Erro no login:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      showMessage('Login cancelado', 'warning');
    } else if (error.code === 'auth/network-request-failed') {
      showMessage('Sem conexão com a internet', 'warning');
    } else {
      showMessage('Erro ao fazer login. Tente novamente.', 'warning');
    }
  }
}

// --- Logout ---
async function logout() {
  try {
    await auth.signOut();
    currentUser = null;
    console.log('Logout OK');
  } catch (error) {
    console.error('Erro no logout:', error);
  }
}

// --- Observador de Estado de Autenticação ---
function initAuth() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Usuário logado
      currentUser = user;
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app-content').classList.remove('hidden');
      updateUserInfo(user);
      loadStateFromFirestore(user.uid);  // Carregar dados do Firestore
    } else {
      // Usuário deslogado
      currentUser = null;
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('app-content').classList.add('hidden');
    }
  });
}

// --- Exibir Info do Usuário no Header ---
function updateUserInfo(user) {
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn && user.photoURL) {
    profileBtn.innerHTML = `<img src="${user.photoURL}" alt="Perfil" 
      style="width:32px;height:32px;border-radius:50%;" referrerpolicy="no-referrer">`;
  }
  // Adicionar nome e botão de logout no menu de perfis
  const profileMenu = document.getElementById('profile-menu');
  if (profileMenu) {
    const userInfoEl = document.createElement('div');
    userInfoEl.className = 'user-info-header';
    userInfoEl.innerHTML = `
      <span>${user.displayName || user.email}</span>
      <button id="btn-logout" class="btn-logout" title="Sair">🚪</button>
    `;
    profileMenu.prepend(userInfoEl);
    document.getElementById('btn-logout').addEventListener('click', logout);
  }
}

// --- Event Listeners ---
document.getElementById('btn-google-login')?.addEventListener('click', loginWithGoogle);
```

#### 2.3.3 Modificações em `app.js`

Substituir a inicialização atual:

**DE (atual):**
```javascript
// No final de app.js:
loadTheme();
loadState();
updateUIFromProfile();
```

**PARA (novo):**
```javascript
// No final de app.js:
loadTheme();
initAuth(); // Firebase Auth controla o fluxo
```

A função `loadState()` não será mais chamada diretamente — será chamada dentro de `loadStateFromFirestore()` após autenticação.

---

### 2.4 FASE 3 — Firestore Database

#### 2.4.1 Modelagem das Coleções

```
Firestore Database
│
├── users (coleção)
│   └── {userId} (documento — UID do Google Auth)
│       ├── displayName: "Nome do Responsável"
│       ├── email: "email@gmail.com"
│       ├── photoURL: "https://..."
│       ├── createdAt: Timestamp
│       ├── lastLogin: Timestamp
│       ├── settings: {
│       │     classesForNextGrade: 10,
│       │     weeklyGoal: 3,
│       │     theme: "dark",
│       │     notificationsEnabled: true
│       │   }
│       ├── currentProfileId: "profile_xxx"
│       │
│       └── profiles (sub-coleção)
│           └── {profileId} (documento)
│               ├── name: "Nome da Criança"
│               ├── age: 8
│               ├── beltIndex: 0
│               ├── gradeInBelt: 2
│               ├── classesProgress: 3
│               ├── totalClasses: 23
│               ├── createdAt: Timestamp
│               ├── updatedAt: Timestamp
│               ├── checkedDates: { "2025-10-27": true, ... }
│               ├── badges: ["first-checkin", "streak-7"]
│               ├── positions: {
│               │     "closed-guard": { mastered: true, practiceCount: 5 }
│               │   }
│               └── history: [
│                     { type: "checkin", data: {}, timestamp: "..." }
│                   ]
```

> **Nota:** O campo `snapshot` do histórico NÃO deve ser salvo no Firestore (ocupa muito espaço). Manter snapshots apenas no localStorage para a funcionalidade de undo local.

#### 2.4.2 Arquivo NOVO: `firestore-service.js`

```javascript
// ============================================
// SERVIÇO FIRESTORE — CRUD + SYNC
// ============================================

// --- Referências ---
function getUserRef(userId) {
  return db.collection('users').doc(userId);
}

function getProfilesRef(userId) {
  return getUserRef(userId).collection('profiles');
}

// ============================================
// SALVAR DADOS NO FIRESTORE
// ============================================

// Salvar/atualizar documento do usuário
async function saveUserToFirestore(userId, userData) {
  try {
    await getUserRef(userId).set(userData, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    throw error;
  }
}

// Salvar/atualizar perfil de criança
async function saveProfileToFirestore(userId, profileId, profileData) {
  try {
    const cleanData = { ...profileData };
    // Remover snapshots do histórico para economizar espaço
    if (cleanData.history) {
      cleanData.history = cleanData.history.map(entry => ({
        type: entry.type,
        data: entry.data,
        timestamp: entry.timestamp
      }));
    }
    cleanData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await getProfilesRef(userId).doc(profileId).set(cleanData, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    throw error;
  }
}

// Deletar perfil
async function deleteProfileFromFirestore(userId, profileId) {
  try {
    await getProfilesRef(userId).doc(profileId).delete();
  } catch (error) {
    console.error('Erro ao deletar perfil:', error);
    throw error;
  }
}

// ============================================
// CARREGAR DADOS DO FIRESTORE
// ============================================

// Carregar tudo (usuário + perfis)
async function loadStateFromFirestore(userId) {
  try {
    const userDoc = await getUserRef(userId).get();

    if (!userDoc.exists) {
      // Primeiro login — criar documento e migrar dados locais
      await handleFirstLogin(userId);
      return;
    }

    const userData = userDoc.data();

    // Carregar perfis (sub-coleção)
    const profilesSnap = await getProfilesRef(userId).get();
    const profiles = {};
    profilesSnap.forEach(doc => {
      profiles[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Montar appState
    appState = {
      currentProfileId: userData.currentProfileId,
      profiles: profiles,
      settings: userData.settings || { ...DEFAULT_SETTINGS }
    };

    // Garantir pelo menos 1 perfil
    if (Object.keys(appState.profiles).length === 0) {
      const newId = createNewProfile('Criança', 8);
      appState.currentProfileId = newId;
    }

    if (!appState.profiles[appState.currentProfileId]) {
      appState.currentProfileId = Object.keys(appState.profiles)[0];
    }

    switchProfile(appState.currentProfileId);
    updateUIFromProfile();
    
    // Salvar cópia local para offline
    persistState();

  } catch (error) {
    console.error('Erro ao carregar do Firestore:', error);
    // Fallback: carregar do localStorage
    showMessage('Modo offline — dados locais carregados', 'warning');
    loadState();
    updateUIFromProfile();
  }
}

// ============================================
// PRIMEIRO LOGIN — MIGRAÇÃO
// ============================================

async function handleFirstLogin(userId) {
  const user = auth.currentUser;

  // Verificar se há dados no localStorage para migrar
  const localData = localStorage.getItem(STORAGE_KEY);

  if (localData) {
    const parsed = JSON.parse(localData);
    
    // Criar documento do usuário
    await saveUserToFirestore(userId, {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      settings: parsed.settings || { ...DEFAULT_SETTINGS },
      currentProfileId: parsed.currentProfileId
    });

    // Migrar cada perfil
    for (const [profileId, profile] of Object.entries(parsed.profiles || {})) {
      await saveProfileToFirestore(userId, profileId, profile);
    }

    showMessage('Dados locais migrados para a nuvem!', 'success');
    
    // Recarregar do Firestore
    await loadStateFromFirestore(userId);
  } else {
    // Sem dados locais — criar do zero
    await saveUserToFirestore(userId, {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      settings: { ...DEFAULT_SETTINGS },
      currentProfileId: null
    });

    const newId = createNewProfile('Criança', 8);
    appState.currentProfileId = newId;
    await syncCurrentState();
    updateUIFromProfile();
  }
}

// ============================================
// SINCRONIZAÇÃO
// ============================================

// Sincronizar estado atual para o Firestore
async function syncCurrentState() {
  if (!currentUser) return;
  const userId = currentUser.uid;

  try {
    // Salvar settings + currentProfileId
    await saveUserToFirestore(userId, {
      settings: appState.settings,
      currentProfileId: appState.currentProfileId,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Salvar perfil atual
    if (currentProfileData && currentProfileData.id) {
      await saveProfileToFirestore(userId, currentProfileData.id, currentProfileData);
    }
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    // Dados já estão salvos localmente via persistState()
  }
}

// Listener em tempo real (opcional — para sync entre abas/dispositivos)
function listenToRealtimeUpdates(userId) {
  // Escutar mudanças nos perfis
  getProfilesRef(userId).onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const updatedProfile = { id: change.doc.id, ...change.doc.data() };
        appState.profiles[change.doc.id] = updatedProfile;
        if (change.doc.id === appState.currentProfileId) {
          switchProfile(appState.currentProfileId);
          updateUIFromProfile();
        }
      }
    });
  }, (error) => {
    console.error('Erro no listener:', error);
  });
}
```

#### 2.4.3 Modificar `persistState()` em `app.js`

**DE (atual):**
```javascript
function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}
```

**PARA (novo):**
```javascript
function persistState() {
  // Sempre salvar localmente (para offline)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

  // Se logado, sincronizar com Firestore
  if (currentUser) {
    syncCurrentState().catch(err => {
      console.warn('Sync Firestore falhou (será sincronizado depois):', err);
    });
  }
}
```

#### 2.4.4 Modificar `deleteProfile()` em `app.js`

Adicionar chamada ao Firestore quando um perfil é deletado:
```javascript
// Dentro da função deleteProfile(), após deletar do appState:
if (currentUser) {
  deleteProfileFromFirestore(currentUser.uid, profileId).catch(console.error);
}
```

#### 2.4.5 Atualizar `sw.js` (Service Worker)

Adicionar os novos arquivos ao cache:
```javascript
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/styles-enhanced.css',
  '/app.js',
  '/auth.js',                    // NOVO
  '/firebase-config.js',         // NOVO
  '/firestore-service.js',       // NOVO
  '/manifest.json',
  // Firebase SDK (cachear para offline)
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  // ... demais URLs existentes
];
```

---

### 2.5 FASE 4 — Ajustes e Polimento

#### 2.5.1 Loading States

Adicionar indicador de carregamento enquanto Firebase inicializa:
```html
<div id="loading-screen" class="loading-screen">
  <div class="spinner"></div>
  <p>Carregando...</p>
</div>
```

#### 2.5.2 Tratamento de Erros

Cenários a cobrir:
- Sem internet no momento do login → mostrar mensagem
- Firestore falha → fallback para localStorage
- Popup de login bloqueado → oferecer redirect como alternativa
- Timeout na conexão → retry automático

#### 2.5.3 Botão de Logout no Header

Adicionar no header do app um indicador do usuário logado + botão de sair.

---

## 3. ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

```
PRIORIDADE / TAREFA                                    ESFORÇO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1. Criar projeto no Firebase Console                   15 min
 2. Criar firebase-config.js + adicionar SDKs           15 min
 3. Criar auth.js (login Google + observer)             1-2 h
 4. Criar tela de login no HTML + CSS                   1 h
 5. Testar login/logout isoladamente                    30 min
 6. Definir regras do Firestore                         15 min
 7. Criar firestore-service.js (CRUD)                   2-3 h
 8. Modificar persistState() para dual-write            30 min
 9. Implementar loadStateFromFirestore()                1-2 h
10. Implementar migração de dados locais                1 h
11. Testar fluxo completo (login → dados → logout)      1 h
12. Adicionar loading states e tratamento de erros      1 h
13. Atualizar Service Worker com novos arquivos         15 min
14. Testar modo offline                                 30 min
15. Testar em múltiplos dispositivos                    30 min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                        TOTAL ESTIMADO: 10-14 h
```

---

## 4. ORDEM DE CARREGAMENTO DOS SCRIPTS (index.html)

Após implementação, o `index.html` deve carregar os scripts nesta ordem:

```html
<!-- 1. Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>

<!-- 2. Configuração Firebase -->
<script src="firebase-config.js"></script>

<!-- 3. Lógica do App (existente) -->
<script src="app.js"></script>

<!-- 4. Serviço Firestore (NOVO) -->
<script src="firestore-service.js"></script>

<!-- 5. Autenticação (NOVO) -->
<script src="auth.js"></script>
```

---

## 5. CHECKLIST DE VALIDAÇÃO

Antes de considerar pronto, validar:

- [ ] Login com Google funciona (popup abre, autentica, redireciona)
- [ ] Logout funciona (volta para tela de login)
- [ ] Dados são salvos no Firestore após check-in
- [ ] Dados são carregados do Firestore ao fazer login
- [ ] Criar novo perfil salva no Firestore
- [ ] Deletar perfil remove do Firestore
- [ ] Alterar configurações salva no Firestore
- [ ] Marcar posição como dominada salva no Firestore
- [ ] App funciona offline (Service Worker + Firestore persistence)
- [ ] Dados locais são migrados no primeiro login
- [ ] Login em outro dispositivo mostra os mesmos dados
- [ ] Regras de segurança impedem acesso a dados de outros usuários
- [ ] Popup bloqueado é tratado com mensagem amigável
- [ ] Erro de rede é tratado com fallback local
- [ ] Loading screen aparece enquanto Firebase inicializa

---

## 6. RISCOS E CONSIDERAÇÕES

| Risco | Mitigação |
|-------|-----------|
| Popup de login bloqueado no mobile | Implementar `signInWithRedirect` como fallback |
| Conflito de dados local vs nuvem | Nuvem sempre tem prioridade; localStorage é cache |
| Limites do Firestore (gratuito) | Spark plan: 50K leituras/dia, 20K escritas/dia — suficiente para uso pessoal |
| Snapshots do histórico muito grandes | Não enviar snapshots ao Firestore, manter apenas local |
| Service Worker cacheando versão antiga | Incrementar `CACHE_NAME` a cada deploy |
| LGPD / Dados de menores | Informar no login que dados são armazenados; obter consentimento do responsável |

---

## 7. CUSTO ESTIMADO (Firebase)

| Recurso | Plano Gratuito (Spark) | Suficiente? |
|---------|----------------------|-------------|
| Authentication | Ilimitado | ✅ Sim |
| Firestore reads | 50.000/dia | ✅ Sim (uso pessoal) |
| Firestore writes | 20.000/dia | ✅ Sim |
| Firestore storage | 1 GB | ✅ Sim |
| Hosting (se usar) | 10 GB/mês | ✅ Sim |

**Para uso pessoal/academia pequena: custo ZERO no plano gratuito.**
