/**
 * Keyword extraction + fuzzy matching search engine for RAG.
 * Uses Levenshtein distance for fuzzy matching and multi-signal scoring.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
  'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
  'than', 'too', 'very', 'just', 'about', 'up', 'out', 'if', 'then',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'how', 'when',
  'where', 'why', 'hi', 'hello', 'hey', 'please', 'thanks', 'thank',
  'want', 'need', 'know', 'get', 'got', 'like', 'also', 'well', 'back',
  'even', 'new', 'way', 'use', 'come', 'make', 'go', 'see', 'look',
]);

/**
 * Extracts meaningful keywords from text.
 * Removes stop words, punctuation, normalizes to lowercase.
 * @param {string} text
 * @returns {string[]} Deduplicated keywords
 */
const extractKeywords = (text) => {
  if (!text || typeof text !== 'string') return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Deduplicate while preserving order
  return [...new Set(words)];
};

/**
 * Computes Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number} Edit distance
 */
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use single-row optimization for space efficiency
  const bLen = b.length;
  let prev = new Array(bLen + 1);
  let curr = new Array(bLen + 1);

  for (let j = 0; j <= bLen; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,     // insertion
        prev[j] + 1,         // deletion
        prev[j - 1] + cost   // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[bLen];
};

/**
 * Checks if a keyword fuzzy-matches any word in the target text.
 * Returns a match score: 1.0 for exact, 0.8 for distance=1, 0.5 for distance=2, 0 otherwise.
 * @param {string} keyword - Search keyword
 * @param {string[]} targetWords - Array of words from the document
 * @returns {number} Best fuzzy match score (0 to 1)
 */
const fuzzyMatchScore = (keyword, targetWords) => {
  let bestScore = 0;

  for (const word of targetWords) {
    // Exact match
    if (word === keyword) return 1.0;

    // Substring containment (word contains keyword or vice versa)
    if (word.includes(keyword) || keyword.includes(word)) {
      bestScore = Math.max(bestScore, 0.9);
      continue;
    }

    // Levenshtein fuzzy — only check if lengths are similar enough
    const lenDiff = Math.abs(word.length - keyword.length);
    if (lenDiff <= 2) {
      const dist = levenshtein(keyword, word);
      const maxLen = Math.max(keyword.length, word.length);

      if (dist === 1 && maxLen >= 4) {
        bestScore = Math.max(bestScore, 0.8);
      } else if (dist === 2 && maxLen >= 5) {
        bestScore = Math.max(bestScore, 0.5);
      }
    }
  }

  return bestScore;
};

/**
 * Tokenizes text into lowercase words for matching.
 * @param {string} text
 * @returns {string[]}
 */
const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
};

/**
 * Scores a document against a query using multi-signal relevance:
 *  1. Exact keyword matches in content (base score)
 *  2. Fuzzy Levenshtein matches in content
 *  3. Title matches (boosted 2x)
 *  4. Tag matches (boosted 1.5x)
 *  5. Phrase proximity bonus
 *
 * @param {string} query - User's search query
 * @param {string} docContent - Document body text
 * @param {string} docTitle - Document title
 * @param {string[]} docTags - Document tags
 * @returns {number} Relevance score between 0 and 1
 */
const scoreDocument = (query, docContent, docTitle = '', docTags = []) => {
  const queryKeywords = extractKeywords(query);
  if (queryKeywords.length === 0) return 0;

  const contentWords = tokenize(docContent);
  const titleWords = tokenize(docTitle);
  const tagWords = docTags.flatMap((t) => tokenize(t));

  if (contentWords.length === 0) return 0;

  let contentScore = 0;
  let titleScore = 0;
  let tagScore = 0;
  let matchedKeywords = 0;

  for (const keyword of queryKeywords) {
    // Content: exact + fuzzy match
    const contentMatch = fuzzyMatchScore(keyword, contentWords);
    if (contentMatch > 0) {
      contentScore += contentMatch;
      matchedKeywords++;
    }

    // Title: exact + fuzzy match (weighted higher)
    const titleMatch = fuzzyMatchScore(keyword, titleWords);
    if (titleMatch > 0) {
      titleScore += titleMatch * 0.35;
    }

    // Tags: exact + fuzzy match
    const tagMatch = fuzzyMatchScore(keyword, tagWords);
    if (tagMatch > 0) {
      tagScore += tagMatch * 0.25;
    }
  }

  // Base score: what fraction of query keywords matched content
  const baseScore = contentScore / queryKeywords.length;

  // Phrase proximity bonus: if multiple keywords appear near each other in content
  let proximityBonus = 0;
  if (queryKeywords.length >= 2) {
    const contentLower = docContent.toLowerCase();
    // Check if any pair of adjacent query keywords appear within 50 chars
    for (let i = 0; i < queryKeywords.length - 1; i++) {
      const pos1 = contentLower.indexOf(queryKeywords[i]);
      const pos2 = contentLower.indexOf(queryKeywords[i + 1]);
      if (pos1 !== -1 && pos2 !== -1 && Math.abs(pos1 - pos2) < 50) {
        proximityBonus += 0.1;
      }
    }
    proximityBonus = Math.min(proximityBonus, 0.2);
  }

  // Coverage bonus: more matched keywords = higher score
  const coverageBonus = matchedKeywords === queryKeywords.length ? 0.1 : 0;

  const finalScore = baseScore + titleScore + tagScore + proximityBonus + coverageBonus;
  return Math.min(1, Math.max(0, finalScore));
};

module.exports = { extractKeywords, scoreDocument, levenshtein, fuzzyMatchScore, tokenize };
