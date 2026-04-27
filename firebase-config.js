// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================
// IMPORTANTE: Substitua os valores abaixo pelas credenciais
// do seu projeto no Firebase Console:
// https://console.firebase.google.com → Configurações do projeto → Apps da Web
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCUSgBR2fk3rRlwnT4GyeP73LPywq8OS04",
    authDomain: "appbjj-kids.firebaseapp.com",
    projectId: "appbjj-kids",
    storageBucket: "appbjj-kids.firebasestorage.app",
    messagingSenderId: "576794961750",
    appId: "1:576794961750:web:6a44ba3ce79302d0fe18f7"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const db = firebase.firestore();

// Habilitar persistência offline do Firestore
// (permite que o app funcione sem internet)
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore offline: múltiplas abas abertas, persistência ativa apenas em uma.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore offline: navegador não suporta persistência.');
        }
    });
