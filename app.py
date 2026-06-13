import json
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

OLLAMA_URL = "http://localhost:11434/api/chat"

# Store conversation history per session (in-memory for simplicity)
conversations: dict[str, list] = {}


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    message = body.get("message", "")
    session_id = body.get("session_id", "default")
    model = body.get("model", "gemma:2b")

    if session_id not in conversations:
        conversations[session_id] = []

    conversations[session_id].append({"role": "user", "content": message})

    async def generate():
        full_response = ""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    OLLAMA_URL,
                    json={
                        "model": model,
                        "messages": conversations[session_id],
                        "stream": True,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_msg = f"Ollama error: {error_text.decode()}"
                        yield f"data: {json.dumps({'chunk': error_msg})}\n\n"
                        conversations[session_id].append({"role": "assistant", "content": error_msg})
                        yield f"data: {json.dumps({'done': True})}\n\n"
                        return
                    async for line in response.aiter_lines():
                        if line:
                            data = json.loads(line)
                            if "error" in data:
                                error_msg = f"Ollama error: {data['error']}"
                                yield f"data: {json.dumps({'chunk': error_msg})}\n\n"
                                full_response = error_msg
                                break
                            chunk = data.get("message", {}).get("content", "")
                            full_response += chunk
                            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except httpx.ConnectError:
            error_msg = "Cannot connect to Ollama. Make sure it's running."
            yield f"data: {json.dumps({'chunk': error_msg})}\n\n"
            full_response = error_msg
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            yield f"data: {json.dumps({'chunk': error_msg})}\n\n"
            full_response = error_msg

        conversations[session_id].append({"role": "assistant", "content": full_response})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/clear")
async def clear(request: Request):
    body = await request.json()
    session_id = body.get("session_id", "default")
    conversations.pop(session_id, None)
    return {"status": "ok"}


@app.get("/api/models")
async def get_models():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            data = response.json()
            models = [m["name"] for m in data.get("models", [])]
            return {"models": models}
    except Exception:
        return {"models": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
