import { getMarketNews } from '../services/newsService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get legitimate Indian financial market news articles
 * @route   GET /api/news
 * @access  Public
 */
export const getNews = async (req, res, next) => {
  try {
    const { category, symbol, search, limit } = req.query;

    const news = await getMarketNews({
      category,
      symbol,
      search,
      limit,
    });

    return successResponse(
      res,
      news,
      'Market news retrieved successfully',
      200,
      {
        count: news.length,
        disclaimer: 'Legitimate curated financial news reports from accredited Indian publications.',
      }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single news article by ID
 * @route   GET /api/news/:id
 * @access  Public
 */
export const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allNews = await getMarketNews({ limit: 100 });
    const article = allNews.find((n) => n.id === id);

    if (!article) {
      return errorResponse(res, 'News article not found.', 404);
    }

    return successResponse(res, article, 'Article retrieved successfully');
  } catch (err) {
    next(err);
  }
};
