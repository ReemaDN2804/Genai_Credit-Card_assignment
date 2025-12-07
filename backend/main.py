
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from backend.bot import ConversationOrchestrator
import uvicorn

app = FastAPI(title="GenAI Credit Card Assistant Backend")

orch = ConversationOrchestrator()

class ChatRequest(BaseModel):
    user_id: str
    text: str

@app.post("/chat")
async def chat(req: ChatRequest):
    return await orch.handle_text(req.user_id, req.text)

@app.post("/voice/stt")
async def stt(file: UploadFile = File(...)):
    return {"transcript": "Mock transcript"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
