document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('chat-bubble');
    const chatWidgetContainer = document.getElementById('chat-widget-container');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const openChatBtn = document.getElementById('open-chat-btn');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');

    // --- NEW: Array to store the conversation history ---
    let chatHistory = [];

    function toggleChatWidget() {
        chatWidgetContainer.classList.toggle('hidden');
    }

    chatBubble.addEventListener('click', toggleChatWidget);
    closeChatBtn.addEventListener('click', toggleChatWidget);
    openChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chatWidgetContainer.classList.remove('hidden');
        chatInput.focus();
    });

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '') return;

        appendMessage(messageText, 'user');
        
        // --- NEW: Add user message to history ---
        chatHistory.push({ role: 'user', parts: [{ text: messageText }] });

        chatInput.value = '';
        chatInput.focus();

        const typingIndicator = showTypingIndicator();

        try {
            // --- NEW: Send the entire history to the backend ---
            const response = await fetch('http://aibot.apexscale.api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: chatHistory }), // Send history
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botReply = data.reply;
            
            hideTypingIndicator(typingIndicator);
            appendMessage(botReply, 'bot');

            // --- NEW: Add bot response to history ---
            chatHistory.push({ role: 'model', parts: [{ text: botReply }] });

        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator(typingIndicator);
            const errorMessage = 'Sorry, I seem to be having trouble connecting. Please try again in a moment.';
            appendMessage(errorMessage, 'bot');
            // Add error message to history so the bot knows it failed
            chatHistory.push({ role: 'model', parts: [{ text: errorMessage }] });
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function appendMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${type}-message`);
        // Use a simple method to render newlines
        messageDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot-message');
        typingDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function hideTypingIndicator(indicator) {
        if (indicator) {
            indicator.remove();
        }
    }
});
