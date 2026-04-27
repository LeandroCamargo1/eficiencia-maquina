// ============================================================================
// CHECKIN REQUEST — Sistema de Solicitação/Aprovação de Check-in
// ============================================================================

const CheckinManager = {
    async requestCheckin(date = new Date()) {
        const user = StateManager.getUser();
        if (!user) return;

        const dateStr = this._formatDate(date);

        try {
            const requestData = {
                id: `${user.uid}_${dateStr}`,
                studentId: user.uid,
                studentName: user.displayName || 'Aluno',
                studentPhoto: user.photoURL,
                date: dateStr,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending', // pending, approved, rejected
                approvedAt: null,
                approvedBy: null,
            };

            // Salvar em: users/{teacherId}/checkin_requests/{studentId}_{date}
            const linkedTeacher = StateManager.getRole() === RoleManager.STUDENT
                ? StateManager._state.linkedTeacher?.id
                : null;

            if (!linkedTeacher) {
                showMessage('Você não está vinculado a um professor', 'warning');
                return;
            }

            await db
                .collection('users')
                .doc(linkedTeacher)
                .collection('checkin_requests')
                .doc(requestData.id)
                .set(requestData);

            StateManager.addCheckinRequest(requestData);
            showMessage('✓ Solicitação enviada ao professor!', 'success');
        } catch (error) {
            console.error('Erro ao solicitar check-in:', error);
            showMessage('Erro ao enviar solicitação', 'warning');
        }
    },

    async approveCheckin(requestId, studentId) {
        const teacher = StateManager.getUser();
        if (!teacher) return;

        try {
            const approvalData = {
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                approvedBy: teacher.uid,
            };

            // Atualizar no Firestore
            await db
                .collection('users')
                .doc(teacher.uid)
                .collection('checkin_requests')
                .doc(requestId)
                .update(approvalData);

            // Incrementar contador de aulas do aluno
            const studentDoc = await db.collection('users').doc(studentId).get();
            const profiles = studentDoc.data()?.profiles || {};
            const currentProfileId = studentDoc.data()?.currentProfileId;

            if (currentProfileId && profiles[currentProfileId]) {
                const profile = profiles[currentProfileId];
                profile.totalClasses = (profile.totalClasses || 0) + 1;
                profile.classesProgress = (profile.classesProgress || 0) + 1;
                profile.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

                // Verificar progressão de faixa
                const newProfile = this._checkBeltProgression(profile);

                await db
                    .collection('users')
                    .doc(studentId)
                    .set({ profiles: { [currentProfileId]: newProfile } }, { merge: true });
            }

            StateManager.updateCheckinRequest(requestId, approvalData);
            showMessage('✓ Check-in aprovado!', 'success');
        } catch (error) {
            console.error('Erro ao aprovar check-in:', error);
            showMessage('Erro ao aprovar check-in', 'warning');
        }
    },

    async rejectCheckin(requestId) {
        const teacher = StateManager.getUser();
        if (!teacher) return;

        try {
            const rejectionData = {
                status: 'rejected',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                approvedBy: teacher.uid,
            };

            await db
                .collection('users')
                .doc(teacher.uid)
                .collection('checkin_requests')
                .doc(requestId)
                .update(rejectionData);

            StateManager.updateCheckinRequest(requestId, rejectionData);
            showMessage('Solicitação rejeitada', 'info');
        } catch (error) {
            console.error('Erro ao rejeitar check-in:', error);
            showMessage('Erro ao rejeitar check-in', 'warning');
        }
    },

    async getPendingRequests(teacherId) {
        try {
            const snapshot = await db
                .collection('users')
                .doc(teacherId)
                .collection('checkin_requests')
                .where('status', '==', 'pending')
                .orderBy('timestamp', 'desc')
                .get();

            const requests = [];
            snapshot.forEach(doc => {
                requests.push({ id: doc.id, ...doc.data() });
            });

            return requests;
        } catch (error) {
            console.error('Erro ao buscar solicitações pendentes:', error);
            return [];
        }
    },

    _checkBeltProgression(profile) {
        const BELTS = [
            { name: 'Branca' },
            { name: 'Azul' },
            { name: 'Roxa' },
            { name: 'Marrom' },
            { name: 'Preta' },
        ];
        const MAX_GRADES = 4;

        profile.classesProgress = (profile.classesProgress || 0);
        const requiredClasses = 10; // ou usar settings

        if (profile.classesProgress >= requiredClasses) {
            profile.classesProgress = 0;
            profile.gradeInBelt = (profile.gradeInBelt || 0) + 1;

            if (profile.gradeInBelt > MAX_GRADES && profile.beltIndex < BELTS.length - 1) {
                profile.gradeInBelt = 0;
                profile.beltIndex = (profile.beltIndex || 0) + 1;
            }
        }

        return profile;
    },

    _formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
};
