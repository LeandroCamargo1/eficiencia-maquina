// ============================================================================
// INTEGRAÇÕES FUTURAS
// ============================================================================
// Este arquivo contém templates para futuras integrações
// Ativa-se quando necessário implementar novos recursos

// ============================================================================
// 1. NOTIFICAÇÕES PUSH (Web Push API)
// ============================================================================

class NotificationManager {
    static async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Navegador não suporta notificações');
            return;
        }

        if (Notification.permission === 'granted') {
            return;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notificações permitidas');
            }
        }
    }

    static sendNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title,
                    options,
                });
            } else {
                new Notification(title, options);
            }
        }
    }

    static scheduleReminderForCheckIn() {
        // Agendar notificação para lembrar check-in
        const now = new Date();
        const target = new Date(now);
        target.setHours(18, 0, 0, 0); // 18:00

        if (target < now) {
            target.setDate(target.getDate() + 1);
        }

        const timeout = target - now;

        setTimeout(() => {
            NotificationManager.sendNotification('Hora da aula! 🥋', {
                body: 'Não esqueça de dar check-in na aula de hoje',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230d0d0f" width="192" height="192"/><circle cx="96" cy="96" r="60" fill="%23e53935"/></svg>',
                tag: 'checkin-reminder',
            });
        }, timeout);
    }
}

// ============================================================================
// 2. EXPORTAR PARA PDF
// ============================================================================

class ReportGenerator {
    static generatePDF(profileData) {
        const element = document.createElement('div');
        element.innerHTML = `
            <h1>${profileData.name}</h1>
            <p>Idade: ${profileData.age} anos</p>
            <p>Faixa: Branca | Grau: ${profileData.gradeInBelt}</p>
            <p>Total de Aulas: ${profileData.totalClasses}</p>
            <h2>Histórico</h2>
            <ul>
                ${profileData.history.map((h) => `<li>${new Date(h.timestamp).toLocaleDateString('pt-BR')} - ${h.type}</li>`).join('')}
            </ul>
        `;

        const opt = {
            margin: 10,
            filename: `${profileData.name}-relatorio.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        };

        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save();
        }
    }

    static shareReport(profileData) {
        const shareData = {
            title: `Progresso BJJ - ${profileData.name}`,
            text: `${profileData.name} conquistou ${profileData.totalClasses} aulas!`,
            url: window.location.href,
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            console.log('Share API não disponível');
        }
    }
}

// ============================================================================
// 3. INTEGRAÇÃO COM GOOGLE CALENDAR
// ============================================================================

class GoogleCalendarIntegration {
    static async authenticateWithGoogle() {
        // Requer Google Calendar API key
        // Implementar com OAuth 2.0
        console.log('Autenticando com Google...');
    }

    static async addEventToCalendar(date, title = 'Aula de Jiu-Jitsu') {
        // Adicionar evento ao calendário do usuário
        const event = {
            summary: title,
            description: 'Aula de Jiu-Jitsu registrada via AppBJJ Kids',
            start: {
                date: new Date(date).toISOString().split('T')[0],
            },
            end: {
                date: new Date(date).toISOString().split('T')[0],
            },
        };

        console.log('Evento para adicionar:', event);
        // POST para Google Calendar API
    }
}

// ============================================================================
// 4. FIREBASE INTEGRATION
// ============================================================================

class FirebaseManager {
    static async initialize() {
        // Configurar Firebase
        // const firebaseConfig = {
        //     apiKey: "YOUR_API_KEY",
        //     authDomain: "your-auth-domain",
        //     projectId: "your-project-id",
        //     storageBucket: "your-storage-bucket",
        //     messagingSenderId: "your-sender-id",
        //     appId: "your-app-id"
        // };
        // firebase.initializeApp(firebaseConfig);

        console.log('Firebase inicializado');
    }

    static async syncToCloud(appState) {
        // Sincronizar estado com Firestore
        try {
            // const ref = firebase.firestore().collection('users').doc(userId);
            // await ref.set(appState);
            console.log('Dados sincronizados com a nuvem');
        } catch (error) {
            console.error('Erro ao sincronizar:', error);
        }
    }

    static async loadFromCloud(userId) {
        // Carregar dados do Firestore
        try {
            // const ref = firebase.firestore().collection('users').doc(userId);
            // const doc = await ref.get();
            // return doc.data();
            console.log('Dados carregados da nuvem');
        } catch (error) {
            console.error('Erro ao carregar:', error);
        }
    }

    static async enableBiometric() {
        // Autenticação biométrica via Firebase
        try {
            // const provider = new firebase.auth.GoogleAuthProvider();
            // const result = await firebase.auth().signInWithPopup(provider);
            console.log('Autenticado com sucesso');
        } catch (error) {
            console.error('Erro de autenticação:', error);
        }
    }
}

// ============================================================================
// 5. ANÁLISE PREDITIVA
// ============================================================================

class PredictiveAnalytics {
    static predictNextBeltDate(profileData) {
        const classesPerWeek = profileData.totalClasses / (Math.max(1, profileData.history.length / 7));
        const classesNeeded = profileData.totalClasses - (profileData.beltIndex * 5 * 4 + profileData.gradeInBelt * 10);
        const weeksNeeded = Math.ceil(classesNeeded / classesPerWeek);

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);

        return {
            estimatedDate: targetDate,
            weeksRemaining: weeksNeeded,
            classesRemaining: classesNeeded,
        };
    }

    static calculateAttendanceGrade(profileData) {
        const daysSinceCreation = Math.floor(
            (Date.now() - new Date(profileData.createdAt)) / (1000 * 60 * 60 * 24)
        );
        const checkinDays = Object.keys(profileData.checkedDates).length;
        const percentage = (checkinDays / Math.max(1, daysSinceCreation)) * 100;

        if (percentage >= 80) return 'A - Excelente';
        if (percentage >= 60) return 'B - Ótimo';
        if (percentage >= 40) return 'C - Bom';
        if (percentage >= 20) return 'D - Precisa melhorar';
        return 'F - Muito baixo';
    }

    static suggestTrainingPlan(profileData) {
        const suggestions = [];

        if (Object.keys(profileData.checkedDates).length < profileData.history.length * 0.3) {
            suggestions.push('Aumentar frequência de aulas');
        }

        const streak = this.calculateCurrentStreak(profileData);
        if (streak > 10) {
            suggestions.push('Manter o ritmo fantástico!');
        } else if (streak === 0) {
            suggestions.push('Começar uma nova sequência de aulas');
        }

        return suggestions;
    }

    static calculateCurrentStreak(profileData) {
        let streak = 0;
        let current = new Date();

        while (true) {
            const dateKey = current.toISOString().split('T')[0];
            if (!profileData.checkedDates[dateKey]) break;
            streak++;
            current.setDate(current.getDate() - 1);
        }

        return streak;
    }
}

// ============================================================================
// 6. GAMIFICAÇÃO AVANÇADA
// ============================================================================

class GamificationEngine {
    static calculatePlayerLevel(totalClasses) {
        // Níveis: Bronze (0-50), Prata (51-200), Ouro (201-500), Platina (500+)
        if (totalClasses >= 500) return { level: 5, name: 'Platina', icon: '💎' };
        if (totalClasses >= 200) return { level: 4, name: 'Ouro', icon: '🏆' };
        if (totalClasses >= 50) return { level: 3, name: 'Prata', icon: '🥈' };
        if (totalClasses >= 10) return { level: 2, name: 'Bronze', icon: '🥉' };
        return { level: 1, name: 'Iniciante', icon: '🌱' };
    }

    static calculateExperience(profileData) {
        // XP baseado em aulas, streaks, etc
        let xp = profileData.totalClasses * 10;
        xp += profileData.badges.length * 100;
        xp += profileData.beltIndex * 500;
        xp += profileData.gradeInBelt * 50;
        return xp;
    }

    static unlockMilestones(profileData) {
        const milestones = [];

        if (profileData.totalClasses === 1) milestones.push('Primeiro Passo');
        if (profileData.totalClasses === 10) milestones.push('Novato');
        if (profileData.totalClasses === 50) milestones.push('Frequentista');
        if (profileData.totalClasses === 100) milestones.push('Veterano');
        if (profileData.totalClasses === 500) milestones.push('Lenda');

        if (profileData.beltIndex >= 1) milestones.push('Primeira Mudança');
        if (profileData.beltIndex >= 4) milestones.push('Campeão');

        return milestones;
    }
}

// ============================================================================
// 7. LEADERBOARD
// ============================================================================

class LeaderboardManager {
    static calculateRankings(allProfiles) {
        const rankings = Object.values(allProfiles)
            .map((profile) => ({
                name: profile.name,
                totalClasses: profile.totalClasses,
                beltLevel: profile.beltIndex,
                score: profile.totalClasses + profile.beltIndex * 100,
            }))
            .sort((a, b) => b.score - a.score);

        return rankings;
    }

    static getRank(allProfiles, profileId) {
        const rankings = this.calculateRankings(allProfiles);
        return rankings.findIndex((r) => r.name === allProfiles[profileId].name) + 1;
    }
}

// ============================================================================
// USO NO CÓDIGO PRINCIPAL
// ============================================================================

// Ativar quando necessário:

// NotificationManager.requestPermission();
// NotificationManager.scheduleReminderForCheckIn();
// ReportGenerator.generatePDF(currentProfileData);
// PredictiveAnalytics.predictNextBeltDate(currentProfileData);
// const level = GamificationEngine.calculatePlayerLevel(currentProfileData.totalClasses);
