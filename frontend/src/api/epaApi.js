/**
 * epaApi.js
 * Thin wrapper around the backend /api/pesticides endpoints.
 */

const BASE = '/api/pesticides';

/**
 * Search pesticide products by keyword.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchPesticides(query) {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch full product details for a given registration number.
 * @param {string} regNo
 * @returns {Promise<Object>}
 */
export async function getProduct(regNo) {
  const res = await fetch(`${BASE}/product/${encodeURIComponent(regNo)}`);
  if (!res.ok) throw new Error(`Product lookup failed: ${res.status}`);
  return res.json();
}
