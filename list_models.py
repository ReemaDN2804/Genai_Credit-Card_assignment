# list_models.py
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
import os, json

key = os.getenv("GEMINI_API_KEY")
if not key:
    raise SystemExit("GEMINI_API_KEY missing in .env")

genai.configure(api_key=key)

# Try to list models (print raw output)
try:
    models = genai.list_models()   # will show available models & supported methods
    print(json.dumps(models, indent=2))
except Exception as e:
    print("LIST MODELS ERROR:", e)
