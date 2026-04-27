// ============================================================================
// FACE RECOGNITION — Reconhecimento Facial com face-api.js (@vladmandic fork)
// ============================================================================

const FaceRecognition = {
    modelsLoaded: false,

    // Base URL dos modelos (CDN jsdelivr — vladmandic/face-api, fork atualizado do face-api.js)
    MODELS_URL: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model',

    // Threshold de distância euclidiana: ≤ 0.55 = match confirmado
    MATCH_THRESHOLD: 0.55,

    // -------------------------------------------------------------------------
    // Carregar modelos de ML (executado uma única vez, depois fica em memória)
    // -------------------------------------------------------------------------
    async loadModels() {
        if (this.modelsLoaded) return true;

        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.MODELS_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL),
            ]);

            this.modelsLoaded = true;
            console.log('✓ Modelos de reconhecimento facial carregados');
            return true;
        } catch (error) {
            console.error('Erro ao carregar modelos de face-api:', error);
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // Converter File → HTMLImageElement (para passar ao face-api)
    // -------------------------------------------------------------------------
    imageFileToElement(file) {
        return new Promise((resolve, reject) => {
            // Validar tipo de arquivo antes de processar
            if (!file.type.startsWith('image/')) {
                reject(new Error('Arquivo não é uma imagem'));
                return;
            }

            const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
            if (file.size > MAX_SIZE) {
                reject(new Error('Imagem muito grande (máximo 10 MB)'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Falha ao carregar imagem'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    },

    // -------------------------------------------------------------------------
    // Extrair descritor de rosto único (cadastro do aluno)
    // Retorna Array de 128 números ou null se nenhum rosto for detectado
    // -------------------------------------------------------------------------
    async extractDescriptor(imageElement) {
        const loaded = await this.loadModels();
        if (!loaded) return null;

        const detection = await faceapi
            .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
            .withFaceLandmarks(true)
            .withFaceDescriptor();

        if (!detection) return null;

        // Converte Float32Array → Array normal para serialização no Firestore
        return Array.from(detection.descriptor);
    },

    // -------------------------------------------------------------------------
    // Detectar e reconhecer múltiplos rostos em foto de treino (sensei)
    //
    // @param imageElement  HTMLImageElement da foto do treino
    // @param students      [{studentId, profileId, name, descriptor: number[128]}]
    // @returns             [{faceIndex, box, studentId, profileId, studentName, distance, recognized}]
    // -------------------------------------------------------------------------
    async recognizeFacesInPhoto(imageElement, students) {
        const loaded = await this.loadModels();
        if (!loaded) return [];

        // Detectar todos os rostos na foto do treino
        const detections = await faceapi
            .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
            .withFaceLandmarks(true)
            .withFaceDescriptors();

        if (!detections || detections.length === 0) return [];

        // Montar LabeledFaceDescriptors apenas para alunos com rosto cadastrado
        const labeled = students
            .filter(s => Array.isArray(s.descriptor) && s.descriptor.length === 128)
            .map(s => new faceapi.LabeledFaceDescriptors(
                `${s.studentId}||${s.profileId}||${s.name}`,
                [new Float32Array(s.descriptor)]
            ));

        if (labeled.length === 0) {
            // Nenhum aluno cadastrado — retornar rostos sem identificação
            return detections.map((d, i) => ({
                faceIndex: i,
                box: d.detection.box,
                studentId: null,
                profileId: null,
                studentName: null,
                distance: 1,
                recognized: false,
            }));
        }

        const faceMatcher = new faceapi.FaceMatcher(labeled, this.MATCH_THRESHOLD);

        return detections.map((detection, i) => {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            const recognized = match.label !== 'unknown';

            let studentId = null;
            let profileId = null;
            let studentName = null;

            if (recognized) {
                const parts = match.label.split('||');
                studentId  = parts[0];
                profileId  = parts[1];
                studentName = parts[2];
            }

            return {
                faceIndex: i,
                box: detection.detection.box,
                studentId,
                profileId,
                studentName,
                distance: match.distance,
                recognized,
            };
        });
    },

    // -------------------------------------------------------------------------
    // Desenhar retângulos de resultado sobre um <canvas>
    // (canvas deve estar sobreposto à imagem com mesma dimensão)
    // -------------------------------------------------------------------------
    drawResults(canvas, imageElement, results) {
        const ctx = canvas.getContext('2d');
        const dims = faceapi.matchDimensions(canvas, imageElement, true);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        results.forEach(r => {
            if (!r.box) return;

            const resized = faceapi.resizeResults({ box: r.box }, dims);
            const color = r.recognized ? '#00c853' : '#ff5252';
            const label = r.recognized
                ? `${r.studentName} (${(1 - r.distance).toFixed(0) * 100 | ((1 - r.distance) * 100).toFixed(0)}%)`
                : 'Desconhecido';

            // Desenhar retângulo
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(resized.box.x, resized.box.y, resized.box.width, resized.box.height);

            // Desenhar label
            ctx.fillStyle = color;
            ctx.fillRect(resized.box.x, resized.box.y - 20, resized.box.width, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '13px Montserrat, sans-serif';
            ctx.fillText(label, resized.box.x + 4, resized.box.y - 5);
        });
    },
};
