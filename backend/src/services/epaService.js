/**
 * epaService.js
 *
 * Wraps calls to the EPA PPLS (Pesticide Product Label System) ORDS JSON API.
 * EPA PPLS base URL: https://ordspub.epa.gov/ords/pesticides/ppls/
 *
 * Search endpoint:  GET /search?q=<term>&limit=25
 * Product endpoint: GET /product?reg_no=<regNo>
 *
 * Docs / explorer: https://ordspub.epa.gov/ords/pesticides/ppls/swagger
 */

const EPA_BASE = 'https://ordspub.epa.gov/ords/pesticides/ppls';

/**
 * Search pesticide products by keyword.
 * Returns an array of product summaries.
 *
 * @param {string} query - Search term (product name, active ingredient, etc.)
 * @param {number} limit - Max results to return (default 25)
 * @returns {Promise<Array>}
 */
export async function searchPesticides(query, limit = 25) {
  const url = new URL(`${EPA_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', limit);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`EPA search returned HTTP ${response.status}`);
  }

  const data = await response.json();
  // ORDS typically returns { items: [...] }
  return data.items ?? data;
}

/**
 * Fetch full product details + label documents for a given registration number.
 *
 * @param {string} regNo - EPA registration number (e.g. "1234-567")
 * @returns {Promise<Object|null>}
 */
export async function getProductByRegNo(regNo) {
  const url = new URL(`${EPA_BASE}/product`);
  url.searchParams.set('reg_no', regNo);

  const response = await fetch(url.toString());
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`EPA product lookup returned HTTP ${response.status}`);
  }

  const data = await response.json();
  // ORDS returns { items: [...] }; grab the first match
  const items = data.items ?? [];
  return items.length > 0 ? items[0] : null;
}
