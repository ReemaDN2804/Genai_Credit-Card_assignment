import os
import json
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠ WARNING: GEMINI_API_KEY not found in .env")

try:
    from backend.retriever_faiss import FaissRetriever as RetrieverClass
except:
    from backend.retriever import KnowledgeRetriever as RetrieverClass

from backend.executor import ActionExecutor

class ConversationOrchestrator:
    def __init__(self):
        self.retriever = RetrieverClass("kb/kb.json")
        self.executor = ActionExecutor()
        print("DEBUG: GEMINI_PRESENT =", GEMINI_API_KEY is not None)

    async def handle_text(self, user_id: str, text: str):
        contexts = self.retriever.get_relevant(text, top_k=3)
        kb_text = "\n".join([f"Q: {c['q']}\nA: {c['answer']}" for c in contexts])

        response = await self.call_gemini(text, kb_text)

        if response.get("type") == "action":
            result = await self.executor.execute(response["action"], response["params"])
            return {"type": "action_response", "result": result}

        return {"type": "info", "answer": response.get("answer"), "contexts": contexts}

    async def call_gemini(self, user_text: str, kb_text: str):
        model = genai.GenerativeModel("gemini-1.5-pro")

        prompt = f"""
You are a helpful credit card assistant.
Use this knowledge base when possible:

{kb_text}

If user requests a payment, respond as:
{{
  "type": "action",
  "action": "pay_bill",
  "params": {{"user_id": "demo", "amount": 5000}}
}}

Otherwise, answer normally.

User: {user_text}
"""

        try:
            resp = model.generate_content(prompt)
            output = resp.text.strip()

            if output.startswith("{") and '"type": "action"' in output:
                return json.loads(output)

            return {"type": "info", "answer": output}

        except Exception as e:
            print("GEMINI ERROR:", e)
            return {"type": "info", "answer": "Sorry, something went wrong."}
