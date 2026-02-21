const prisma = require('../config/database');
const { scoreDocument, extractKeywords } = require('../utils/embeddings');
const { RAG_TOP_K, RAG_SCORE_THRESHOLD } = require('../config/constants');

/**
 * Lists all KB articles for a tenant with optional filters.
 * @param {string} tenantId
 * @param {object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.sourceType]
 * @param {boolean} [filters.isActive]
 * @param {string} [filters.search]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @returns {Promise<{articles: object[], total: number, page: number, totalPages: number}>}
 */
const listArticles = async (tenantId, filters = {}) => {
  const page = Math.max(parseInt(filters.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(filters.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const where = { tenantId };

  if (filters.category) where.category = filters.category;
  if (filters.sourceType) where.sourceType = filters.sourceType;
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true' || filters.isActive === true;
  }

  if (filters.search && filters.search.trim()) {
    return searchArticles(tenantId, filters.search, where, page, limit);
  }

  const [articles, total] = await Promise.all([
    prisma.knowledgeBase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.knowledgeBase.count({ where }),
  ]);

  return { articles, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Searches KB articles using keyword + Levenshtein fuzzy scoring.
 * @param {string} tenantId
 * @param {string} query
 * @param {object} where
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{articles: object[], total: number, page: number, totalPages: number}>}
 */
const searchArticles = async (tenantId, query, where, page, limit) => {
  const allArticles = await prisma.knowledgeBase.findMany({ where });

  const scored = allArticles
    .map((article) => ({
      ...article,
      _score: scoreDocument(query, article.content, article.title, article.tags),
    }))
    .filter((a) => a._score > 0)
    .sort((a, b) => b._score - a._score);

  const total = scored.length;
  const skip = (page - 1) * limit;
  const articles = scored.slice(skip, skip + limit);

  return { articles, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Gets a single KB article by ID, scoped to tenant.
 * @param {string} tenantId
 * @param {string} articleId
 * @returns {Promise<object|null>}
 */
const getArticle = async (tenantId, articleId) => {
  return prisma.knowledgeBase.findFirst({
    where: { id: articleId, tenantId },
  });
};

/**
 * Creates a new KB article.
 * @param {string} tenantId
 * @param {object} data
 * @returns {Promise<object>}
 */
const createArticle = async (tenantId, data) => {
  return prisma.knowledgeBase.create({
    data: {
      tenantId,
      title: data.title,
      content: data.content,
      category: data.category || 'general',
      tags: data.tags || [],
      sourceType: data.sourceType || 'text',
      sourceUrl: data.sourceUrl || null,
      fileName: data.fileName || null,
      filePath: data.filePath || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
};

/**
 * Updates a KB article.
 * @param {string} tenantId
 * @param {string} articleId
 * @param {object} data
 * @returns {Promise<object|null>}
 */
const updateArticle = async (tenantId, articleId, data) => {
  const existing = await getArticle(tenantId, articleId);
  if (!existing) return null;

  return prisma.knowledgeBase.update({
    where: { id: articleId },
    data,
  });
};

/**
 * Deletes a KB article.
 * @param {string} tenantId
 * @param {string} articleId
 * @returns {Promise<boolean>}
 */
const deleteArticle = async (tenantId, articleId) => {
  const existing = await getArticle(tenantId, articleId);
  if (!existing) return false;

  await prisma.knowledgeBase.delete({ where: { id: articleId } });
  return true;
};

/**
 * Searches the tenant's active KB for RAG context.
 * Returns top K articles above the score threshold with Levenshtein fuzzy matching.
 * Used by the AI service to build context for chat responses.
 * @param {string} tenantId
 * @param {string} query
 * @returns {Promise<Array<{id: string, title: string, content: string, category: string, score: number}>>}
 */
const searchKnowledgeBase = async (tenantId, query) => {
  const articles = await prisma.knowledgeBase.findMany({
    where: { tenantId, isActive: true },
  });

  const scored = articles
    .map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      score: scoreDocument(query, article.content, article.title, article.tags),
    }))
    .filter((article) => article.score >= RAG_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, RAG_TOP_K);

  return scored;
};

/**
 * Returns all distinct categories for a tenant's KB articles.
 * @param {string} tenantId
 * @returns {Promise<string[]>}
 */
const getCategories = async (tenantId) => {
  const result = await prisma.knowledgeBase.findMany({
    where: { tenantId },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return result.map((r) => r.category);
};

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  searchKnowledgeBase,
  getCategories,
};
