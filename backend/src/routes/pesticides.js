import express from 'express';
import { searchPesticides, getProductByRegNo } from '../services/epaService.js';
import { isValidRegNo } from '../utils/validation.js';

const router = express.Router();

const VALID_MODES = new Set(['product', 'ingredient', 'regno']);

// GET /api/pesticides/search?q=<query>&mode=product|ingredient|regno
router.get('/search', async (req, res) => {
  const q    = (req.query.q    ?? '').trim();
  const mode = (req.query.mode ?? 'product').trim().toLowerCase();

  if (!q) {
    return res.status(400).json({ error: 'Missing required query parameter "q"' });
  }
  if (!VALID_MODES.has(mode)) {
    return res.status(400).json({
      error: `Invalid mode "${mode}". Must be one of: product, ingredient, regno`,
    });
  }

  try {
    const result = await searchPesticides(q, mode);
    res.json(result);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Search timeout:', q, mode);
      return res.status(504).json({ error: 'EPA search request timed out' });
    }
    console.error('Search error:', err.message);
    res.status(502).json({ error: 'Failed to fetch search results from EPA' });
  }
});

// GET /api/pesticides/product/:regNo
router.get('/product/:regNo', async (req, res) => {
  const { regNo } = req.params;

  // Basic sanity check — EPA reg numbers look like "12345-678" or "12345-678-9"
  if (!isValidRegNo(regNo)) {
    return res.status(400).json({ error: 'Invalid EPA registration number format' });
  }

  try {
    const product = await getProductByRegNo(regNo);
    if (!product) {
      return res.status(404).json({ error: `Product not found for registration number "${regNo}"` });
    }
    res.json(product);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Product lookup timeout:', regNo);
      return res.status(504).json({ error: 'EPA product request timed out' });
    }
    console.error('Product lookup error:', err.message);
    res.status(502).json({ error: 'Failed to fetch product from EPA' });
  }
});

export default router;
