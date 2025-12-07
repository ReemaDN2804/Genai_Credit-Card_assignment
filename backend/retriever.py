
import json, os
from difflib import SequenceMatcher

class KnowledgeRetriever:
    def __init__(self, path):
        if os.path.exists(path):
            self.kb = json.load(open(path, "r", encoding="utf-8"))
        else:
            self.kb = []

    def score(self, q, t):
        return SequenceMatcher(None, q.lower(), t.lower()).ratio()

    def get_relevant(self, query, top_k=1):
        scored = []
        for item in self.kb:
            s = self.score(query, item["q"])
            scored.append((s, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [x[1] for x in scored[:top_k]]
