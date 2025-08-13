document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('mic-btn');
    const textInput = document.getElementById('text-input');
    const statusLight = document.getElementById('status-light');
    const chatMessages = document.getElementById('chat-messages');

    let socket;
    let mediaRecorder;
    let audioContext;
    let audioQueue = [];
    let isPlaying = false;
    let isRecording = false;

    const setupWebSocket = () => {
        const wsUrl = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        socket = new WebSocket(`${wsUrl}${window.location.host}`);

        socket.onopen = () => {
            console.log('WebSocket connected');
            statusLight.className = 'listening';
        };

        socket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const message = JSON.parse(event.data);
                if (message.type === 'text') {
                    appendMessage(message.data, 'bot');
                } else if (message.type === 'tts_complete') {
                    statusLight.className = 'listening';
                } else if (message.type === 'error') {
                    appendMessage(message.data, 'bot');
                }
            } else {
                const audioData = new Uint8Array(event.data);
                audioQueue.push(audioData);
                if (!isPlaying) {
                    playNextInQueue();
                }
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            statusLight.className = 'disconnected';
        };
    };

    const playNextInQueue = async () => {
        if (audioQueue.length > 0) {
            isPlaying = true;
            statusLight.className = 'speaking';
            const audioData = audioQueue.shift();
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 8000 });
            }
            const pcmData = new Float32Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                pcmData[i] = muLawDecode(audioData[i]);
            }
            const audioBuffer = audioContext.createBuffer(1, pcmData.length, 8000);
            audioBuffer.getChannelData(0).set(pcmData);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
            source.onended = playNextInQueue;
        } else {
            isPlaying = false;
            if (socket && socket.readyState === WebSocket.OPEN) {
                statusLight.className = 'listening';
            }
        }
    };

    const startRecording = async () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setupWebSocket();
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };
            mediaRecorder.start(250);
            isRecording = true;
            micBtn.classList.add('recording');
        } catch (error) {
            console.error('Mic error:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        micBtn.classList.remove('recording');
    };

    micBtn.addEventListener('mousedown', startRecording);
    micBtn.addEventListener('mouseup', stopRecording);
    micBtn.addEventListener('touchstart', startRecording);
    micBtn.addEventListener('touchend', stopRecording);

    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && textInput.value.trim() !== '') {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                setupWebSocket();
            }
            const message = textInput.value.trim();
            appendMessage(message, 'user');
            socket.send(JSON.stringify({ type: 'text', data: message }));
            textInput.value = '';
        }
    });

    function appendMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${type}-message`);
        messageDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function muLawDecode(mu) {
        mu = ~mu;
        let abs = ((mu & 0x0F) << 3) + 0x84;
        abs <<= (mu & 0x70) >> 4;
        return ((mu & 0x80) ? 0x84 - abs : abs - 0x84) / 32768.0;
    }
    
    setupWebSocket(); // Connect on page load
});
