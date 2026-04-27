// ============================================================================
// FIRESTORE SERVICE — Sincronização com StateManager (Sem Conflitos)
// ============================================================================

const FirestoreService = {
    /**
     * Salvar perfils sincronizados com StateManager
     */
    async saveProfiles(userId, profiles) {
        try {
            const profilesMap = {};
            profiles.forEach(p => {
                profilesMap[p.id] = p;
            });

            await db.collection('users').doc(userId).update({
                profiles: profilesMap,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            console.log('✓ Perfis salvos no Firestore');
        } catch (error) {
            console.error('Erro ao salvar perfis:', error);
            throw error;
        }
    },

    /**
     * Salvar perfil específico
     */
    async saveProfile(userId, profile) {
        try {
            await db.collection('users').doc(userId).update({
                [`profiles.${profile.id}`]: profile,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✓ Perfil ${profile.name} salvo`);
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            throw error;
        }
    },

    /**
     * Atualizar dados de um perfil específico
     */
    async updateProfileData(userId, profileId, data) {
        try {
            const updates = {};
            Object.keys(data).forEach(key => {
                updates[`profiles.${profileId}.${key}`] = data[key];
            });

            await db.collection('users').doc(userId).update(updates);
            console.log(`✓ Perfil ${profileId} atualizado`);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    },

    /**
     * Registrar check-in em histórico
     */
    async recordCheckin(userId, profileId, date) {
        try {
            const docDate = date.toISOString().split('T')[0];
            await db
                .collection('users')
                .doc(userId)
                .collection('checkins')
                .doc(docDate)
                .set({
                    profileId,
                    date: firebase.firestore.Timestamp.fromDate(date),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

            console.log(`✓ Check-in registrado para ${docDate}`);
        } catch (error) {
            console.error('Erro ao registrar check-in:', error);
            throw error;
        }
    },

    /**
     * Obter histórico de check-ins
     */
    async getCheckinsHistory(userId, profileId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshot = await db
                .collection('users')
                .doc(userId)
                .collection('checkins')
                .where('date', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                .where('profileId', '==', profileId)
                .orderBy('date', 'desc')
                .limit(100)
                .get();

            const checkins = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                const dateStr = data.date.toDate().toISOString().split('T')[0];
                checkins[dateStr] = true;
            });

            return checkins;
        } catch (error) {
            console.error('Erro ao obter histórico:', error);
            return {};
        }
    },

    /**
     * Salvar solicitação de check-in (aluno solicita)
     */
    async saveCheckinRequest(userId, request) {
        try {
            const requestId = request.id || `req_${Date.now()}`;
            await db
                .collection('users')
                .doc(request.teacherId)
                .collection('checkinRequests')
                .doc(requestId)
                .set({
                    ...request,
                    studentId: userId,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

            console.log(`✓ Solicitação de check-in enviada`);
            return requestId;
        } catch (error) {
            console.error('Erro ao salvar solicitação:', error);
            throw error;
        }
    },

    /**
     * Obter solicitações pendentes (professor)
     */
    async getPendingRequests(teacherId) {
        try {
            const snapshot = await db
                .collection('users')
                .doc(teacherId)
                .collection('checkinRequests')
                .where('status', '==', 'pending')
                .get();

            const requests = [];
            snapshot.forEach(doc => {
                requests.push({ id: doc.id, ...doc.data() });
            });

            // Ordenar no cliente para evitar índice composto
            requests.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() ?? 0;
                const tb = b.createdAt?.toMillis?.() ?? 0;
                return tb - ta;
            });

            return requests;
        } catch (error) {
            console.error('Erro ao obter solicitações:', error);
            return [];
        }
    },

    /**
     * Aprovar check-in (professor aprova)
     */
    async approveCheckin(teacherId, requestId, studentId, profileId) {
        try {
            const batch = db.batch();

            // Marcar solicitação como aprovada
            const requestRef = db
                .collection('users')
                .doc(teacherId)
                .collection('checkinRequests')
                .doc(requestId);

            batch.update(requestRef, {
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Registrar check-in na coleção do aluno
            const checkinDate = new Date();
            const docDate = checkinDate.toISOString().split('T')[0];
            const checkinRef = db
                .collection('users')
                .doc(studentId)
                .collection('checkins')
                .doc(docDate);

            batch.set(checkinRef, {
                profileId,
                date: firebase.firestore.Timestamp.fromDate(checkinDate),
                approvedBy: teacherId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            await batch.commit();
            console.log(`✓ Check-in aprovado`);
        } catch (error) {
            console.error('Erro ao aprovar:', error);
            throw error;
        }
    },

    /**
     * Rejeitar check-in (professor rejeita)
     */
    async rejectCheckin(teacherId, requestId) {
        try {
            await db
                .collection('users')
                .doc(teacherId)
                .collection('checkinRequests')
                .doc(requestId)
                .update({
                    status: 'rejected',
                    rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });

            console.log(`✓ Solicitação rejeitada`);
        } catch (error) {
            console.error('Erro ao rejeitar:', error);
            throw error;
        }
    },

    // =========================================================================
    // RECONHECIMENTO FACIAL — Descritores e Bulk Check-in
    // =========================================================================

    /**
     * Salvar descritor facial de um aluno no Firestore
     * @param {string} userId     - UID do aluno
     * @param {string} profileId  - ID do perfil
     * @param {number[]} descriptor - Array 128D do rosto
     */
    async saveFaceDescriptor(userId, profileId, descriptor) {
        try {
            await db.collection('users').doc(userId).update({
                [`profiles.${profileId}.faceDescriptor`]: descriptor,
                [`profiles.${profileId}.faceEnrolledAt`]: firebase.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✓ Descritor facial salvo para perfil ${profileId}`);
        } catch (error) {
            console.error('Erro ao salvar descritor facial:', error);
            throw error;
        }
    },

    /**
     * Buscar descritores faciais de todos os alunos vinculados ao professor.
     * Usa query por linkedTeacherId (não depende de linkedStudentIds no doc do professor).
     * @param {string} teacherId
     * @returns {Array} [{studentId, profileId, name, descriptor}]
     */
    async getLinkedStudentDescriptors(teacherId) {
        try {
            const snapshot = await db
                .collection('users')
                .where('linkedTeacherId', '==', teacherId)
                .get();

            const result = [];

            snapshot.forEach((doc) => {
                const studentId = doc.id;
                const userData = doc.data();
                const profiles = userData.profiles || {};

                Object.entries(profiles).forEach(([profileId, profile]) => {
                    if (Array.isArray(profile.faceDescriptor) && profile.faceDescriptor.length === 128) {
                        result.push({
                            studentId,
                            profileId,
                            name: profile.name || 'Aluno',
                            descriptor: profile.faceDescriptor,
                        });
                    }
                });
            });

            return result;
        } catch (error) {
            console.error('Erro ao buscar descritores:', error);
            return [];
        }
    },

    /**
     * Incrementar aulas e progressão de faixa de um aluno (chamado pelo professor via facial check-in)
     * Lê o perfil atual do aluno, calcula a progressão e salva num batch com o check-in.
     * @param {string} teacherId
     * @param {string} studentId
     * @param {string} profileId
     * @param {Date}   date
     */
    async incrementStudentProfile(teacherId, studentId, profileId, date = new Date()) {
        try {
            const studentDoc = await db.collection('users').doc(studentId).get();
            if (!studentDoc.exists) {
                console.warn(`Aluno ${studentId} não encontrado`);
                return false;
            }

            const userData = studentDoc.data();
            const profile = (userData.profiles || {})[profileId];
            if (!profile) {
                console.warn(`Perfil ${profileId} não encontrado para o aluno ${studentId}`);
                return false;
            }

            let { classesProgress = 0, totalClasses = 0, gradeInBelt = 0, beltIndex = 0 } = profile;
            classesProgress += 1;
            totalClasses += 1;

            if (classesProgress >= 10) {
                classesProgress = 0;
                gradeInBelt += 1;
                if (gradeInBelt > 4) {
                    gradeInBelt = 0;
                    beltIndex = Math.min(beltIndex + 1, 4);
                }
            }

            const docDate = date.toISOString().split('T')[0];
            const batch = db.batch();

            // Atualizar perfil do aluno
            const studentRef = db.collection('users').doc(studentId);
            batch.update(studentRef, {
                [`profiles.${profileId}.classesProgress`]: classesProgress,
                [`profiles.${profileId}.totalClasses`]: totalClasses,
                [`profiles.${profileId}.gradeInBelt`]: gradeInBelt,
                [`profiles.${profileId}.beltIndex`]: beltIndex,
                [`profiles.${profileId}.lastCheckinDate`]: docDate,
            });

            // Registrar check-in na subcoleção do aluno
            const checkinRef = db
                .collection('users').doc(studentId)
                .collection('checkins').doc(`${docDate}_${profileId}`);
            batch.set(checkinRef, {
                profileId,
                date: firebase.firestore.Timestamp.fromDate(date),
                approvedBy: teacherId,
                method: 'face_recognition',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            await batch.commit();
            console.log(`✓ Progressão atualizada para aluno ${studentId}, perfil ${profileId}`);
            return true;
        } catch (error) {
            console.error('Erro ao incrementar perfil do aluno:', error);
            return false;
        }
    },

    /**
     * Aprovar check-ins em lote (resultado do reconhecimento facial)
     * @param {string} teacherId
     * @param {Array} approvals - [{studentId, profileId}]
     */
    async approveFaceCheckinBatch(teacherId, approvals) {
        try {
            const batch = db.batch();
            const checkinDate = new Date();
            const docDate = checkinDate.toISOString().split('T')[0];

            for (const { studentId, profileId } of approvals) {
                const checkinRef = db
                    .collection('users')
                    .doc(studentId)
                    .collection('checkins')
                    .doc(`${docDate}_${profileId}`);

                batch.set(checkinRef, {
                    profileId,
                    date: firebase.firestore.Timestamp.fromDate(checkinDate),
                    approvedBy: teacherId,
                    method: 'face_recognition',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }

            await batch.commit();
            console.log(`✓ ${approvals.length} check-ins por reconhecimento facial salvos`);
        } catch (error) {
            console.error('Erro ao salvar check-ins em lote:', error);
            throw error;
        }
    },

    /**
     * Inicializar listener de alterações (real-time sync)
     */
    subscribeToProfile(userId, onUpdate) {
        return db.collection('users').doc(userId).onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                onUpdate(userData);
            }
        }, (error) => {
            console.error('Erro no listener:', error);
        });
    },

    /**
     * Inicializar listener para solicitações (real-time para professor)
     */
    subscribeToCheckinRequests(teacherId, onUpdate) {
        return db
            .collection('users')
            .doc(teacherId)
            .collection('checkinRequests')
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                const requests = [];
                snapshot.forEach(doc => {
                    requests.push({ id: doc.id, ...doc.data() });
                });
                // Ordenar no cliente
                requests.sort((a, b) => {
                    const ta = a.createdAt?.toMillis?.() ?? 0;
                    const tb = b.createdAt?.toMillis?.() ?? 0;
                    return tb - ta;
                });
                onUpdate(requests);
            }, (error) => {
                console.error('Erro no listener de solicitações:', error);
            });
    },
};
