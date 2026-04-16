import express from 'express';
import { searchPesticides, getProductByRegNo } from '../services/epaService.js';

const router = express.Router();

// GET /api/pesticides/search?q=<query>
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Missing search query parameter "q"' });
  }
  try {
    const results = await searchPesticides(q.trim());
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(502).json({ error: 'Failed to fetch search results from EPA' });
  }
});

// GET /api/pesticides/product/:regNo
router.get('/product/:regNo', async (req, res) => {
  const { regNo } = req.params;
  try {
    const product = await getProductByRegNo(regNo);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Product lookup error:', err.message);
    res.status(502).json({ error: 'Failed to fetch product from EPA' });
  }
});

export default router;
