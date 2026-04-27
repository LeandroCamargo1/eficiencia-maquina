// ============================================================================
// ROLE MANAGER — Sistema de Aluno/Professor
// ============================================================================

const RoleManager = {
    STUDENT: 'student',
    TEACHER: 'teacher',

    async initializeRole(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                // Primeiro login — mostrar seletor de role
                return null;
            }

            const userData = userDoc.data();
            const role = userData.role || this.STUDENT; // default student
            
            StateManager.setRole(role);

            if (role === this.STUDENT && userData.linkedTeacherId) {
                // Buscar dados do professor vinculado
                const teacherDoc = await db.collection('users').doc(userData.linkedTeacherId).get();
                if (teacherDoc.exists) {
                    StateManager.setLinkedTeacher({
                        id: userData.linkedTeacherId,
                        ...teacherDoc.data(),
                    });
                }
            }

            if (role === this.TEACHER) {
                // Buscar lista de alunos vinculados
                const studentIds = userData.linkedStudentIds || [];
                const students = [];
                for (const studentId of studentIds) {
                    const studentDoc = await db.collection('users').doc(studentId).get();
                    if (studentDoc.exists) {
                        students.push({
                            id: studentId,
                            ...studentDoc.data()
                        });
                    }
                }
                StateManager.setLinkedStudents(students);
            }

            return role;
        } catch (error) {
            console.error('Erro ao inicializar role:', error);
            return null;
        }
    },

    async setRole(userId, role) {
        try {
            await db.collection('users').doc(userId).set(
                { role },
                { merge: true }
            );
            StateManager.setRole(role);
        } catch (error) {
            console.error('Erro ao setar role:', error);
            throw error;
        }
    },

    async linkStudentToTeacher(studentUserId, teacherUserId) {
        try {
            // Verificar se o professor existe antes de vincular
            const teacherDoc = await db.collection('users').doc(teacherUserId).get();
            if (!teacherDoc.exists) {
                showMessage('Professor não encontrado. Verifique o UID informado.', 'warning');
                throw new Error('Teacher not found');
            }

            // Aluno: salvar linkedTeacherId no próprio doc (permitido pelas regras)
            await db.collection('users').doc(studentUserId).set(
                { linkedTeacherId: teacherUserId },
                { merge: true }
            );

            // Atualizar estado local
            StateManager.setLinkedTeacher({ id: teacherUserId, ...teacherDoc.data() });

            showMessage('Vinculado ao professor com sucesso!', 'success');
        } catch (error) {
            if (error.message !== 'Teacher not found') {
                console.error('Erro ao vincular aluno:', error);
                showMessage('Erro ao vincular com professor', 'warning');
            }
            throw error;
        }
    },

    async unlinkStudentFromTeacher(studentUserId, teacherUserId) {
        try {
            // Aluno: remover linkedTeacherId
            await db.collection('users').doc(studentUserId).set(
                { linkedTeacherId: null },
                { merge: true }
            );

            // Professor: remover de linkedStudentIds
            const teacherDoc = await db.collection('users').doc(teacherUserId).get();
            let linkedStudentIds = teacherDoc.data()?.linkedStudentIds || [];
            linkedStudentIds = linkedStudentIds.filter(id => id !== studentUserId);
            
            await db.collection('users').doc(teacherUserId).set(
                { linkedStudentIds },
                { merge: true }
            );

            showMessage('Aluno desvinculado', 'info');
        } catch (error) {
            console.error('Erro ao desvincular aluno:', error);
            throw error;
        }
    },

    isStudent() {
        return StateManager.getRole() === this.STUDENT;
    },

    isTeacher() {
        return StateManager.getRole() === this.TEACHER;
    },
};
