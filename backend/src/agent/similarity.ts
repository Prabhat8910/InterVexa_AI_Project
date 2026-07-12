import { groq } from '../config/groq';

/**
 * Checks whether a proposed new question is semantically similar to any of the previously asked questions.
 * Uses a similarity threshold of 0.70.
 * 
 * @param newQuestion The proposed question text.
 * @param history Array of previously asked question texts.
 * @returns Promise<boolean> True if semantically similar (similarity >= 0.70), False otherwise.
 */
export const checkSemanticSimilarity = async (newQuestion: string, history: string[]): Promise<boolean> => {
  if (!history || history.length === 0) return false;

  const cleanNew = newQuestion.trim().toLowerCase();

  // Quick exact match or near-exact match check
  for (const prev of history) {
    if (prev.trim().toLowerCase() === cleanNew) {
      console.log(`[Similarity Check] Exact match found for: "${newQuestion}"`);
      return true;
    }
  }

  const prompt = `
    You are an expert semantic comparison system designed to prevent repetitive questions in a technical mock interview.
    Compare the following proposed interview question with the history of previously asked questions.
    
    Proposed Question:
    "${newQuestion}"
    
    Previous Questions:
    ${history.map((q, i) => `${i + 1}. "${q}"`).join('\n')}
    
    Determine if the proposed question has a semantic similarity of 0.70 or higher with ANY of the previous questions. 
    "Semantic similarity" means it asks about the same core concept, the same underlying problem (e.g. both asking to reverse a linked list, both asking about Singleton pattern thread-safety), or is a minor wording variant of a previously asked question.
    
    Respond ONLY with a JSON object in this format:
    {
      "isSimilar": true // set to true if semantic similarity with any previous question is >= 0.70, false otherwise
    }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    console.log(`[Similarity Check] Semantic check result for "${newQuestion.substring(0, 40)}...": isSimilar=${parsed.isSimilar}`);
    return !!parsed.isSimilar;
  } catch (err) {
    console.error('[Similarity Check] Error calling Groq API, using fallback keyword check:', err);
    
    // Local fallback: compute Jaccard-like similarity of significant words (length > 3)
    const getWords = (text: string) => {
      return new Set(
        text.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 3)
      );
    };

    const newWords = getWords(newQuestion);
    if (newWords.size === 0) return false;

    for (const prev of history) {
      const prevWords = getWords(prev);
      if (prevWords.size === 0) continue;

      let intersectionCount = 0;
      newWords.forEach(w => {
        if (prevWords.has(w)) intersectionCount++;
      });

      const similarity = intersectionCount / Math.min(newWords.size, prevWords.size);
      if (similarity >= 0.70) {
        console.log(`[Similarity Check] Fallback keyword overlap matched (score: ${similarity.toFixed(2)}) for "${newQuestion}"`);
        return true;
      }
    }
    return false;
  }
};
