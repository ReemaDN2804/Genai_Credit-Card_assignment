import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KB_FILE = join(__dirname, '../data/kb.json');

/**
 * Simple keyword-based KB retrieval
 * TODO: Replace with vector search (Pinecone, Weaviate, or local embeddings)
 * 
 * For vector DB upgrade:
 * 1. Generate embeddings for each KB item (using Gemini embeddings API or sentence-transformers)
 * 2. Store embeddings in vector DB
 * 3. Generate embedding for user query
 * 4. Perform similarity search (cosine similarity)
 * 5. Return top-k results
 */
export async function retrieveKBItems(query, topK = 3) {
  try {
    const kbData = JSON.parse(readFileSync(KB_FILE, 'utf8'));
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Simple keyword matching with scoring
    const scoredItems = kbData.map(item => {
      let score = 0;
      const contentLower = (item.content || '').toLowerCase();
      const titleLower = (item.title || '').toLowerCase();
      const keywordsLower = (item.keywords || []).join(' ').toLowerCase();
      const tagsLower = (item.tags || []).join(' ').toLowerCase();

      // Check each query word
      queryWords.forEach(word => {
        // Title matches are weighted higher
        if (titleLower.includes(word)) score += 3;
        // Keyword matches
        if (keywordsLower.includes(word)) score += 2;
        // Tag matches
        if (tagsLower.includes(word)) score += 1.5;
        // Content matches
        if (contentLower.includes(word)) score += 1;
      });

      // Exact phrase match bonus
      if (contentLower.includes(queryLower) || titleLower.includes(queryLower)) {
        score += 5;
      }

      return { ...item, score };
    });

    // Sort by score and return top K
    const topItems = scoredItems
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ score, ...item }) => item); // Remove score from output

    console.log(`[RAG] Retrieved ${topItems.length} KB items for query: "${query}"`);
    return topItems;
  } catch (error) {
    console.error('[ERROR] KB retrieval failed:', error);
    return [];
  }
}

/**
 * TODO: Vector-based retrieval example (for future implementation)
 * 
 * async function retrieveKBItemsVector(query, topK = 3) {
 *   // 1. Generate query embedding
 *   const queryEmbedding = await generateEmbedding(query);
 *   
 *   // 2. Search vector DB
 *   const results = await vectorDB.query({
 *     vector: queryEmbedding,
 *     topK: topK,
 *     includeMetadata: true
 *   });
 *   
 *   // 3. Map results back to KB items
 *   return results.matches.map(match => ({
 *     id: match.id,
 *     content: match.metadata.content,
 *     title: match.metadata.title,
 *     score: match.score
 *   }));
 * }
 * 
 * async function generateEmbedding(text) {
 *   // Use Gemini embeddings API or sentence-transformers
 *   const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'x-goog-api-key': process.env.GEMINI_API_KEY
 *     },
 *     body: JSON.stringify({
 *       model: 'models/embedding-001',
 *       content: { parts: [{ text }] }
 *     })
 *   });
 *   const data = await response.json();
 *   return data.embedding.values;
 * }
 */

