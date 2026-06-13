# Personal Chatbot

A fully local, private AI chatbot web app powered by Ollama. No API keys, no restrictions, no data leaving your machine.

## Demo

![Chat Interface](https://via.placeholder.com/800x400/0d0d0d/7c6aef?text=Dark+Theme+Chat+UI)

## Features

- **Fully Local** — Runs on your machine via Ollama. No cloud, no API keys.
- **No Restrictions** — No content filtering or rate limits.
- **Streaming Responses** — Token-by-token real-time output.
- **Model Selector** — Switch between any Ollama model from the UI.
- **Dark Theme** — Clean, modern interface.
- **Markdown Support** — Code blocks, bold, italic rendering.
- **Conversation History** — Chat context maintained per session.

## Tech Stack

| Layer     | Technology       |
|-----------|------------------|
| Backend   | FastAPI          |
| Frontend  | HTML / CSS / JS  |
| LLM       | Ollama (local)   |
| Styling   | Custom CSS       |

## Prerequisites

- Python 3.10+
- [Ollama](https://ollama.com) installed
- At least one model pulled (e.g., `gemma:2b` for 4GB RAM systems)

## Quick Start

### 1. Install Ollama

Download from [ollama.com](https://ollama.com) and install.

### 2. Pull a model

```bash
# For systems with 4GB RAM (recommended)
ollama pull gemma:2b

# For systems with 8GB+ RAM
ollama pull llama3
```

### 3. Clone and run

```bash
git clone https://github.com/shgfx10/personal-chatbot.git
cd personal-chatbot
pip install -r requirements.txt
python -m uvicorn app:app --reload
```

### 4. Open in browser

```
http://localhost:8000
```

## Project Structure

```
personal-chatbot/
├── app.py              # FastAPI backend with streaming
├── requirements.txt    # Python dependencies
├── setup.bat           # One-click setup script
├── templates/
│   └── index.html      # Chat UI template
└── static/
    ├── css/
    │   └── style.css   # Dark theme styling
    └── js/
        └── app.js      # Frontend logic
```

## API Endpoints

| Method | Endpoint       | Description                    |
|--------|----------------|--------------------------------|
| GET    | `/`            | Serve chat UI                 |
| POST   | `/api/chat`    | Send message (SSE streaming)   |
| POST   | `/api/clear`   | Clear conversation history     |
| GET    | `/api/models`  | List available Ollama models   |

## RAM Usage

| Model        | Size   | Min RAM |
|--------------|--------|---------|
| gemma:2b     | 1.7 GB | 4 GB    |
| phi3:mini    | 2.3 GB | 6 GB    |
| llama3       | 4.7 GB | 8 GB    |
| mistral      | 4.1 GB | 8 GB    |

## License

MIT
