const messagesEl = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const modelSelect = document.getElementById("model");

let sessionId = crypto.randomUUID();
let isGenerating = false;

// Auto-resize textarea
userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
});

userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", clearChat);

// Load models
async function loadModels() {
    try {
        const res = await fetch("/api/models");
        const data = await res.json();
        modelSelect.innerHTML = "";
        if (data.models.length === 0) {
            const opt = document.createElement("option");
            opt.textContent = "No models found - run ollama pull llama3";
            modelSelect.appendChild(opt);
            return;
        }
        data.models.forEach((m) => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            modelSelect.appendChild(opt);
        });
    } catch {
        const opt = document.createElement("option");
        opt.textContent = "Cannot connect to Ollama";
        modelSelect.appendChild(opt);
    }
}

function addMessage(role, content) {
    const welcome = messagesEl.querySelector(".welcome");
    if (welcome) welcome.remove();

    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.innerHTML = formatContent(content);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
}

function formatContent(text) {
    // Simple markdown: code blocks, inline code, bold, italic
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    text = text.replace(/\n/g, "<br>");
    return text;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isGenerating) return;

    addMessage("user", message);
    userInput.value = "";
    userInput.style.height = "auto";

    isGenerating = true;
    sendBtn.disabled = true;

    const botDiv = addMessage("assistant", "");
    let fullResponse = "";

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                session_id: sessionId,
                model: modelSelect.value || "gemma:2b",
            }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
                const data = JSON.parse(line.slice(6));
                if (data.chunk) {
                    fullResponse += data.chunk;
                    botDiv.innerHTML = formatContent(fullResponse);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                }
            }
        }
    } catch (err) {
        botDiv.innerHTML = formatContent("Error: Could not connect to Ollama. Make sure it's running.");
    }

    isGenerating = false;
    sendBtn.disabled = false;
    userInput.focus();
}

async function clearChat() {
    sessionId = crypto.randomUUID();
    messagesEl.innerHTML = `
        <div class="welcome">
            <h1>How can I help you?</h1>
            <p>Start typing below. No restrictions, fully local.</p>
        </div>
    `;
    await fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
    });
}

loadModels();
