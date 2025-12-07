# backend/retriever_faiss.py
import json, os
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

class FaissRetriever:
    def __init__(self, kb_path="kb/kb.json", model_name="all-MiniLM-L6-v2", index_path="kb/faiss.index"):
        self.kb_path = kb_path
        self.model = SentenceTransformer(model_name)
        self.kb = []
        self.index = None
        self.index_path = index_path
        if os.path.exists(kb_path):
            with open(kb_path, "r", encoding="utf-8") as f:
                self.kb = json.load(f)
        self._build_index()

    def _build_index(self):
        texts = [ (item.get("q","") + " " + item.get("answer","")).strip() for item in self.kb ]
        if not texts:
            self.index = None
            return
        embs = self.model.encode(texts, convert_to_numpy=True)
        d = embs.shape[1]
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                # optionally check dimension
            except Exception:
                self.index = faiss.IndexFlatL2(d)
                self.index.add(embs)
                faiss.write_index(self.index, self.index_path)
        else:
            self.index = faiss.IndexFlatL2(d)
            self.index.add(embs)
            faiss.write_index(self.index, self.index_path)

    def get_relevant(self, query: str, top_k=3):
        if self.index is None:
            return []
        q_emb = self.model.encode([query], convert_to_numpy=True)
        D, I = self.index.search(q_emb, top_k)
        results = []
        for idx in I[0]:
            if idx < len(self.kb):
                results.append(self.kb[idx])
        return results
