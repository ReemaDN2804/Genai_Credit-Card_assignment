// list_models_node.cjs  — robust CommonJS model lister
const path = require('path');

// load .env: prefer root .env, otherwise fall back to backend/.env
const rootEnv = path.resolve(process.cwd(), '.env');
const backendEnv = path.resolve(process.cwd(), 'backend', '.env');
const dotenvPath = require('fs').existsSync(rootEnv) ? rootEnv :
                   (require('fs').existsSync(backendEnv) ? backendEnv : null);

if (dotenvPath) {
  require('dotenv').config({ path: dotenvPath });
  console.log('Loaded .env from', dotenvPath);
} else {
  console.log('No .env found at repo root or backend/.env; expecting GEMINI_API_KEY in environment.');
}

let genaiPkg;
try {
  genaiPkg = require('@google/generative-ai');
} catch (e) {
  console.error("❌ Could not require('@google/generative-ai'). Did you run `npm install @google/generative-ai`?");
  console.error(e);
  process.exit(1);
}

// handle both possible export styles
const genai = genaiPkg?.default ?? genaiPkg;

if (!genai) {
  console.error('❌ @google/generative-ai export not found (genai is falsy).');
  process.exit(1);
}

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!key) {
  console.error('❌ GEMINI_API_KEY not found in environment (.env). Put GEMINI_API_KEY=your_key in .env at repo root or backend/.env');
  process.exit(1);
}

// configure client if library exposes configure
if (typeof genai.configure === 'function') {
  genai.configure({ apiKey: key });
} else if (typeof genai.default?.configure === 'function') {
  genai.default.configure({ apiKey: key });
} else {
  // some versions may require different init - still continue and attempt listModels
  console.warn('⚠ genai.configure() not found — will still attempt listModels() if available.');
}

async function listModels() {
  try {
    if (typeof genai.listModels !== 'function') {
      console.error('❌ genai.listModels() not available on this SDK version.');
      process.exit(1);
    }

    const it = genai.listModels(); // async iterator
    console.log('\n📌 Available models for this key:\n');
    let count = 0;
    for await (const m of it) {
      // model may be an object with .name or .model or .displayName
      const name = m?.name ?? m?.model ?? JSON.stringify(m);
      console.log('•', name);
      count++;
    }
    if (count === 0) console.log('(no models returned)');
  } catch (err) {
    console.error('❌ LIST MODELS ERROR:', err);
  }
}

listModels();
