/**
 * epaApi.js
 *
 * Thin wrapper around the backend /api/pesticides endpoints.
 * When integrating into another project, update BASE to point at the host app's backend.
 */

const BASE = '/api/pesticides';

/**
 * Search pesticide products by keyword.
 * @param {string} query
 * @param {'product'|'ingredient'|'regno'} mode
 * @returns {Promise<{ query: string, mode: string, results: Array }>}
 */
export async function searchPesticides(query, mode = 'product') {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`;
  const res = await fetch(url);
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
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.error ?? `HTTP ${res.status}`;
    throw new Error(`Product lookup failed for "${regNo}": ${detail}`);
  }
  return res.json();
}
