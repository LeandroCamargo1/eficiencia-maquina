// ============================================================================
// CHECK-IN MANAGER — Solicitar/Aprovar Check-ins com Log
// ============================================================================

const CheckinManager = {
    /**
     * Solicitar check-in para um professor (Aluno)
     */
    async requestCheckin(date = new Date()) {
        const user = StateManager.getUser();
        const profile = StateManager.getCurrentProfile();

        if (!user || !profile) {
            console.error('Usuário ou perfil não definido');
            return false;
        }

        const linkedTeacherId = StateManager.getState().linkedTeacher?.id;
        if (!linkedTeacherId) {
            showMessage('Você não está vinculado a um professor', 'warning');
            return false;
        }

        try {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const request = {
                id: requestId,
                studentId: user.uid,
                studentName: profile.name,
                studentAge: profile.age,
                profileId: profile.id,
                teacherId: linkedTeacherId,
                requestDate: firebase.firestore.Timestamp.fromDate(date),
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };

            // Salvar no Firestore
            await FirestoreService.saveCheckinRequest(user.uid, request);

            // Adicionar ao estado local
            const requests = StateManager.getCheckinRequests() || [];
            requests.push(request);
            StateManager.setCheckinRequests(requests);

            showMessage('✓ Solicitação enviada ao seu professor!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao solicitar check-in:', error);
            showMessage('Erro ao enviar solicitação', 'warning');
            return false;
        }
    },

    /**
     * Obter solicitações pendentes (Professor)
     */
    async getPendingRequests(teacherId) {
        try {
            const requests = await FirestoreService.getPendingRequests(teacherId);
            StateManager.setCheckinRequests(requests);
            return requests;
        } catch (error) {
            console.error('Erro ao obter solicitações:', error);
            return [];
        }
    },

    /**
     * Aprovar check-in (Professor aprova, aluno contagem incrementa)
     */
    async approveCheckin(requestId, studentId, profileId) {
        const user = StateManager.getUser();

        if (!user) {
            console.error('Usuário não autenticado');
            return false;
        }

        try {
            // Salvar check-in no Firestore
            await FirestoreService.approveCheckin(user.uid, requestId, studentId, profileId);

            // Atualizar estado local
            const requests = StateManager.getCheckinRequests() || [];
            const updated = requests.filter(r => r.id !== requestId);
            StateManager.setCheckinRequests(updated);

            showMessage('✓ Check-in aprovado!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao aprovar:', error);
            showMessage('Erro ao aprovar check-in', 'warning');
            return false;
        }
    },

    /**
     * Rejeitar check-in (Professor rejeita)
     */
    async rejectCheckin(requestId) {
        const user = StateManager.getUser();

        if (!user) {
            console.error('Usuário não autenticado');
            return false;
        }

        try {
            await FirestoreService.rejectCheckin(user.uid, requestId);

            const requests = StateManager.getCheckinRequests() || [];
            const updated = requests.filter(r => r.id !== requestId);
            StateManager.setCheckinRequests(updated);

            showMessage('✓ Solicitação rejeitada', 'info');
            return true;
        } catch (error) {
            console.error('Erro ao rejeitar:', error);
            showMessage('Erro ao rejeitar', 'warning');
            return false;
        }
    },

    /**
     * Incrementar contagem de aulas (quando check-in é aprovado)
     */
    async incrementClassCount(profileId, date = new Date()) {
        const user = StateManager.getUser();
        if (!user) return false;

        try {
            const profiles = StateManager.getProfiles();
            const profile = profiles.find(p => p.id === profileId);
            if (!profile) return false;

            // Atualizar contador local
            profile.classesProgress += 1;
            profile.totalClasses += 1;

            // Verificar progresso de faixa
            if (profile.classesProgress >= 10) {
                // Próximo grau
                profile.classesProgress = 0;
                profile.gradeInBelt += 1;

                if (profile.gradeInBelt > 4) {
                    // Próxima faixa
                    profile.gradeInBelt = 0;
                    profile.beltIndex = Math.min(profile.beltIndex + 1, 4);
                    showMessage(`🎉 Parabéns! Novinha faixa: ${profile.name}!`, 'success');
                }
            }

            // Atualizar streak
            const today = new Date().toDateString();
            profile.lastCheckinDate = today;
            profile.streak = this._calculateStreak(profile);

            // Salvar no Firestore
            await FirestoreService.updateProfileData(user.uid, profileId, {
                classesProgress: profile.classesProgress,
                totalClasses: profile.totalClasses,
                gradeInBelt: profile.gradeInBelt,
                beltIndex: profile.beltIndex,
                lastCheckinDate: today,
                streak: profile.streak,
            });

            // Registrar check-in no histórico
            await FirestoreService.recordCheckin(user.uid, profileId, date);

            // Atualizar estado local com o array modificado
            StateManager.setProfiles(profiles);

            return true;
        } catch (error) {
            console.error('Erro ao incrementar contagem:', error);
            return false;
        }
    },

    /**
     * Calcular streak (dias seguidos)
     */
    _calculateStreak(profile) {
        if (!profile.lastCheckinDate) return 1;

        const lastDate = new Date(profile.lastCheckinDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            // Mesmo dia — manter streak atual (sem incrementar)
            return profile.streak || 1;
        } else if (daysDiff === 1) {
            return (profile.streak || 0) + 1;
        } else {
            return 1; // Reiniciar streak
        }
    },

    // =========================================================================
    // RECONHECIMENTO FACIAL
    // =========================================================================

    /**
     * Cadastrar rosto de um aluno (fase de enrollment)
     * O aluno/responsável sobe uma foto clara do rosto
     *
     * @param {File}   imageFile - Arquivo de foto do aluno
     * @param {string} profileId - ID do perfil do aluno
     */
    async enrollFace(imageFile, profileId) {
        const user = StateManager.getUser();
        if (!user) {
            showMessage('Você precisa estar logado', 'warning');
            return false;
        }

        if (typeof faceapi === 'undefined') {
            showMessage('Módulo de reconhecimento facial não carregado', 'warning');
            return false;
        }

        showMessage('🔍 Analisando foto...', 'info');

        try {
            const imgElement = await FaceRecognition.imageFileToElement(imageFile);
            const descriptor = await FaceRecognition.extractDescriptor(imgElement);

            if (!descriptor) {
                showMessage('Nenhum rosto detectado. Use uma foto com o rosto bem visível e iluminado.', 'warning');
                return false;
            }

            await FirestoreService.saveFaceDescriptor(user.uid, profileId, descriptor);

            // Atualizar estado local
            const profiles = StateManager.getProfiles();
            const profile = profiles.find(p => p.id === profileId);
            if (profile) {
                profile.faceDescriptor = descriptor;
                profile.faceEnrolledAt = new Date().toISOString();
                StateManager.setProfiles(profiles);
            }

            showMessage('✓ Rosto cadastrado com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao cadastrar rosto:', error);
            showMessage(`Erro ao processar foto: ${error.message}`, 'warning');
            return false;
        }
    },

    /**
     * Processar foto do treino para check-in automático (sensei)
     * Retorna lista de resultados para confirmação
     *
     * @param {File}   imageFile     - Foto da turma tirada no treino
     * @param {string} teacherId     - UID do professor
     * @returns {Object} { results, imageElement } para renderização na UI
     */
    async processFaceCheckin(imageFile, teacherId) {
        if (typeof faceapi === 'undefined') {
            showMessage('Módulo de reconhecimento facial não carregado', 'warning');
            return null;
        }

        showMessage('🔍 Detectando rostos na foto...', 'info');

        try {
            const imgElement = await FaceRecognition.imageFileToElement(imageFile);

            // Buscar descritores de todos os alunos vinculados
            const students = await FirestoreService.getLinkedStudentDescriptors(teacherId);

            if (students.length === 0) {
                showMessage('Nenhum aluno com rosto cadastrado. Peça que os alunos cadastrem seu rosto primeiro.', 'warning');
                return null;
            }

            // Reconhecer rostos na foto
            const results = await FaceRecognition.recognizeFacesInPhoto(imgElement, students);

            if (results.length === 0) {
                showMessage('Nenhum rosto detectado na foto. Tente uma foto com melhor iluminação.', 'warning');
                return null;
            }

            const recognized = results.filter(r => r.recognized).length;
            showMessage(`✓ ${results.length} rosto(s) detectado(s), ${recognized} identificado(s)`, 'success');

            return { results, imageElement: imgElement };
        } catch (error) {
            console.error('Erro no reconhecimento facial:', error);
            showMessage(`Erro ao processar foto: ${error.message}`, 'warning');
            return null;
        }
    },

    /**
     * Confirmar check-ins após revisão do sensei
     * Incrementa contagem de aulas para cada aluno confirmado
     *
     * @param {string} teacherId
     * @param {Array}  confirmed - [{studentId, profileId, studentName}]
     */
    async confirmFaceCheckins(teacherId, confirmed) {
        if (!confirmed || confirmed.length === 0) {
            showMessage('Nenhum check-in para confirmar', 'warning');
            return false;
        }

        try {
            const checkinDate = new Date();
            let successCount = 0;

            for (const { studentId, profileId } of confirmed) {
                try {
                    const ok = await FirestoreService.incrementStudentProfile(teacherId, studentId, profileId, checkinDate);
                    if (ok) successCount += 1;
                } catch (err) {
                    console.warn(`Falha ao confirmar check-in para perfil ${profileId}:`, err);
                }
            }

            if (successCount > 0) {
                showMessage(`✅ ${successCount} check-in(s) confirmado(s) com sucesso!`, 'success');
                return true;
            } else {
                showMessage('Nenhum check-in pôde ser confirmado. Verifique se os alunos estão vinculados.', 'warning');
                return false;
            }
        } catch (error) {
            console.error('Erro ao confirmar check-ins:', error);
            showMessage('Erro ao salvar check-ins', 'warning');
            return false;
        }
    },
};
