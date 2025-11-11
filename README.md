# Understanding UX with Personality-Driven LLM Chatbots

### Requirements
```bash
ollama
uv
npm
gpt-oss:20b # installed thru ollama
```

### Install dependencies
```bash
ollama serve
ollama pull gpt-oss:20b
uv sync
cd ui/bot_ui && npm install
```

### Start

```bash
# Terminal 1: Backend
uv run main.py

# Terminal 2: Frontend
cd ui/bot_ui && npm run dev
```
